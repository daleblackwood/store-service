import {
  IReact,
  serviceConnector,
} from "./serviceConnector";

import {
  isDotPath,
  lookup,
  objectsMatch,
  pascalCase,
  set
} from "./utils";

/** Service state snapshot */
export interface IServiceStateAction<T> {
  type: string,
  payload: Partial<T>
}

interface IStoreAction<T = any> { type: string, payload: T };
type StoreReducer<TState = any, TPayload = any> = (state: TState, action: IStoreAction<TPayload>) => TState;
type StoreDispatch<TPayload = any> = (action: IStoreAction<TPayload>) => void;
type StoreMiddleware = (store: IStore) => (next: StoreDispatch) => (action: IStoreAction) => any;
interface IStore<TState = any> {
  dispatch: StoreDispatch;
  getState: () => TState;
  subscribe: (listener: () => void) => () => void;
  replaceReducer: (nextReducers: StoreReducer) => StoreReducer;
}

type ServiceMap = Record<string, StoreService<any>>;

/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
export class StoreService<STATE extends Record<string, any> = {}> {

  /**
   * Create a static, global StoreService singleton
   * @param serviceClassDefinition The class definition for the service.
   */
  static define<T extends StoreService>(serviceClassDefinition: new() => T): T {
    const className = serviceClassDefinition.name;
    const serviceMap = this.getServiceMap();
    const service = serviceMap[className] = serviceMap[className] || new serviceClassDefinition();
    return service as T;
  }

  /**
   * Retreive a service by class name
   * @param className the class name of the service
   */
  static get<T extends StoreService>(className: string): T {
    return this.getServiceMap()[className] as T || null;
  }

  static getReducer(matchPaths?: string[]): StoreReducer {
    return (state: any, action: IStoreAction<any>) => {
      const services = this.getServices(matchPaths);
      for (const service of services) {
        const reducer = service.slice;
        if (reducer) {
          state = reducer(state, action);
        }
      }
      return state;
    };
  }

  static wrapReducer(storeReducer: StoreReducer, matchPaths?: string[]): StoreReducer {
    return (state: any, action: IStoreAction<any>) => {
      state = storeReducer(state, action);
      const services = this.getServices(matchPaths);
      for (const service of services) {
        const reducer = service.slice;
        if (reducer) {
          state = reducer(state, action);
        }
      }
      return state;
    };
  }

  static getMiddlewares(): StoreReducer[] {
    return this.getServices().map(x => x.middleware);
  }

  static getServices(matchPath?: string[]): Array<StoreService> {
    if (typeof matchPath === "string") {
      matchPath = [matchPath];
    }
    const result: StoreService[] = [];
    const serviceMap = this.getServiceMap();
    for (const key in serviceMap) {
      if (serviceMap.hasOwnProperty(key)) {
        const service = serviceMap[key];
        if (matchPath) {
          const match = matchPath.find(x => service.path.includes(x));
          if (!match) {
            continue;
          }
        }
        result.push(serviceMap[key]);
      }
    }
    return result;
  }

  static getMiddleware(): StoreMiddleware {
    return store => {
      this.staticStore = store;
      return next => action => next(action);
    };
  }

  static staticStore: IStore = null;

  static getServiceMap() {
    const mapParent: any = typeof window !== "undefined" ? window : this;
    if (!mapParent.services) {
      mapParent.services = {};
    }
    return mapParent.services as ServiceMap;
  }

  /** The name of the action  */
  public get actionType(): string {
    return pascalCase("Service" + this.constructor.name.toLowerCase());
  }

  /** Returns a copy of the state, based on last known and changes */
  public get state(): STATE { return this.slice.state; }

  public get storeState(): any { return this.slice.storeState; }

  protected readonly slice: StoreServiceSlice<STATE>;
  protected readonly dispatcher: StoreServiceDispatcher<STATE>;
  
  private isAttachedInternal: boolean;
  get isAttached(): boolean { return this.isAttachedInternal; }

  private hasInited = false;

  constructor(path: string, stateInitial: STATE) {
    if (isDotPath(path) === false) {
      throw new Error("Service slice name must be dot path - got " + path);
    }
    this.slice = new StoreServiceSlice<STATE>(path, path, stateInitial);
    this.dispatcher = new StoreServiceDispatcher<STATE>(this.actionType);
  }

  /**
   * Attaches the service to a reducer
   * @param reducerObject the object containing the reducers
   * @param customPath an optional path (default is pascal service name)
   */
  get middleware(): StoreMiddleware {
    return store => {
      if (!this.dispatcher) {
        this.dispatcher = new StoreServiceDispatcher<STATE>(store, this.actionType);
      }
      return next => action => next(action);
    };
  }

  get reducer(): StoreReducer {
    return this.reduce.bind(this) as StoreReducer;
  }

  connect(React: IReact) {
    return serviceConnector(React, this);
  }

  public subscribe(callback: (state: STATE) => void) {
    const index = this.getSubscriptionIndex(callback);
    if (index >= 0) {
      return;
    }
    this.subscriptions.push(callback);
  }

  public unsubscribe(callback: (state: STATE) => void) {
    const index = this.getSubscriptionIndex(callback);
    if (index < 0) {
      return;
    }
    this.subscriptions.splice(index, 1);
  }

  public getSubscriptionIndex(callback: (state: STATE) => void) {
    for (let i = this.subscriptions.length - 1; i >= 0; i--) {
      if (this.subscriptions[i] === callback) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Update the state, similar to a React component
   * @param stateChanges The properties to alter on the state
   */
  setState(stateChanges: Partial<STATE>): Promise<void> {
    this.stateChanges = this.stateChanges || {};
    let hasChanged = false;
    for (const key in stateChanges) {
      if (typeof stateChanges[key] !== "undefined") {
        if (this.stateChanges.hasOwnProperty(key)) {
          delete this.stateChanges[key];
        }
        if (this.stateLast[key] === stateChanges[key]) {
          continue;
        }
        this.stateChanges[key] = stateChanges[key];
        hasChanged = true;
      }
    }
    if (hasChanged) {
      return this.dispatchScheduled();
    }
  }

  public init() {}

  public onConnect(component?: any) {}

  addListener(onChange: () => void) {
    const index = this.subscriptions.length;
    this.subscriptions.push(onChange);
    return () => {
      this.subscriptions.slice(index, 1);
    };
  }

  /**
   * Updates the redux store at the end of the stack-frame
   */
  protected dispatchScheduled(): Promise<void> {
    clearTimeout(this.dispatchTimer);
    return new Promise(r => setTimeout(() => {
      this.dispatchImmediate();
      r();
    }, 0));
  }

  /**
   * Updates the redux store now
   */
  protected dispatchImmediate() {
    clearTimeout(this.dispatchTimer);
    const store = this.store || StoreService.staticStore;
    if (store) {
      store.dispatch({
        type: this.actionType,
        payload: this.stateChanges
      });
    }
  }

  /**
   * Can be overriden to react to incoming state changes
   * @param newState the full snapshot of changes properties
   */
  onState(newState: STATE) {}

  /**
   * The redux reducer / handler
   * @param newState the full redux state
   * @param action the acton updating
   */
  private reduce(storeState: any, action: IStoreAction) {
    const sliceState = lookup(storeState, this.path);
    let currentState = this.state;
    const hasSliceChanged = objectsMatch(currentState, sliceState, 1) === false;
    if (hasSliceChanged) {
      this.storeStateInternal = storeState;
      this.stateLast = sliceState || this.stateLast || this.stateInitial;
      this.stateChanges = {};
      this.stateLast = currentState;
      this.stateChanges = {};
      if (!storeState) {
        storeState = {};
      }
      set(storeState, this.path, currentState);
      this.onState(currentState);
      setTimeout(() => {
        for (const subcription of this.subscriptions) {
          subcription(currentState);
        }
      }, 0);
    }
    if (this.hasInited === false) {
      this.hasInited = true;
      this.init();
    }
    return storeState;
  }

}

class StoreServiceDispatcher<STATE> {

  private static staticStores: IStore[] = [];
  private dispatchTimer: any;
  public store: IStore = null;

  constructor(private type: string) {}

  public attach(store: IStore) {
    this.store = store;
    if (StoreServiceDispatcher.staticStores.indexOf(store) < 0) {
      StoreServiceDispatcher.staticStores.push(store);
    }
  }

  /** Updates the redux store at the end of the stack-frame */
  protected dispatchScheduled(payload: STATE): Promise<void> {
    clearTimeout(this.dispatchTimer);
    return new Promise(r => setTimeout(() => {
      this.dispatchImmediate(payload);
      r();
    }, 0));
  }

  /** Updates the redux store now */
  protected dispatchImmediate(payload: STATE) {
    clearTimeout(this.dispatchTimer);
    const store = this.store || StoreServiceDispatcher.staticStores[0];
    if (store) {
      store.dispatch({ type: this.type, payload });
    }
  }
}


class StoreServiceSlice<STATE> {

  public hasInited = false;

  public stateLast: STATE;
  public stateChanges: Partial<STATE> = {};

  /** Returns a copy of the state, based on last known and changes */
  get state(): STATE {
    return { ...this.stateLast, ...this.stateChanges };
  }

  private subscriptions: Array<(state: STATE) => void> = [];

  private storeStateInternal: any;
  get storeState(): any { return this.storeStateInternal; }

  constructor(
    private readonly key: string, 
    private readonly path: string, 
    private readonly stateInitial: STATE
  ) {
    if (isDotPath(path) === false) {
      throw new Error("Service slice name must be dot path - got " + path);
    }
    this.path = path;
    this.stateInitial = Object.freeze(stateInitial);
    this.stateLast = { ...stateInitial };
    this.stateChanges = {};
  }

  public subscribe(callback: (state: STATE) => void) {
    const index = this.getSubscriptionIndex(callback);
    if (index >= 0) {
      return;
    }
    this.subscriptions.push(callback);
  }

  public unsubscribe(callback: (state: STATE) => void) {
    const index = this.getSubscriptionIndex(callback);
    if (index < 0) {
      return;
    }
    this.subscriptions.splice(index, 1);
  }

  public getSubscriptionIndex(callback: (state: STATE) => void) {
    for (let i = this.subscriptions.length - 1; i >= 0; i--) {
      if (this.subscriptions[i] === callback) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Update the state, similar to a React component
   * @param stateChanges The properties to alter on the state
   */
  setState(stateChanges: Partial<STATE>): boolean {
    this.stateChanges = this.stateChanges || {};
    let hasChanged = false;
    for (const key in stateChanges) {
      if (typeof stateChanges[key] !== "undefined") {
        if (this.stateChanges.hasOwnProperty(key)) {
          delete this.stateChanges[key];
        }
        if (this.stateLast[key] === stateChanges[key]) {
          continue;
        }
        this.stateChanges[key] = stateChanges[key];
        hasChanged = true;
      }
    }
    return hasChanged;
  }

  addListener(onChange: () => void) {
    const index = this.subscriptions.length;
    this.subscriptions.push(onChange);
    return () => {
      this.subscriptions.slice(index, 1);
    };
  }

  /**
   * The redux reducer / handler
   * @param newState the full redux state
   * @param action the acton updating
   */
  public reduce(storeState: any, action: IStoreAction) {
    const sliceState = lookup(storeState, this.path);
    let currentState = this.state;
    const hasSliceChanged = objectsMatch(currentState, sliceState, 1) === false;
    if (hasSliceChanged) {
      this.storeStateInternal = storeState;
      this.stateLast = sliceState || this.stateLast || this.stateInitial;
      this.stateChanges = {};
      this.stateLast = currentState;
      this.stateChanges = {};
      if (!storeState) {
        storeState = {};
      }
      set(storeState, this.path, currentState);
      setTimeout(() => {
        for (const subcription of this.subscriptions) {
          subcription(currentState);
        }
      }, 0);
    }
    return storeState;
  }

}

export default StoreService;
