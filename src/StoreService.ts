import { serviceConnector, ServiceConnector } from "./serviceConnector";
import { isDotPath, lookup, objectsMatch, pascalCase, set } from "./utils";

/** Service state snapshot */
export interface IServiceStateAction<T> {
  type: string,
  payload: Partial<T>
}

type StoreAction<T = any> = { type: string, payload: T }; 
type StoreReducer<TState = any, TPayload = any> = (state: TState, action: StoreAction<TPayload>) => TState;
type StoreDispatch<TPayload = any> = (action: StoreAction<TPayload>) => void;
type StoreMiddleware = (store: IStore) => (next: StoreDispatch) => (action: StoreAction) => any;
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
export class StoreService<STATE extends Record<string, any>> {

  /**
   * Create a static, global StoreService singleton
   * @param serviceClassDefinition The class definition for the service.
   */
  static define<T extends StoreService<any>>(serviceClassDefinition: new() => T): T {
    const className = serviceClassDefinition.name;
    const serviceMap = this.getServiceMap();
    const service = serviceMap[className] = serviceMap[className] || new serviceClassDefinition();
    return service as T;
  }

  /**
   * Retreive a service by class name
   * @param className the class name of the service
   */
  static get<T extends StoreService<any>>(className: string): T {
    return this.getServiceMap()[className] as T || null;
  }

  static getServiceMap() {
    const mapParent: any = typeof window !== "undefined" ? window : this;
    if (!mapParent.services) {
      mapParent.services = {};
    }
    return mapParent.services as ServiceMap;
  }

  static getReducers() {
    const result: Record<string, StoreReducer> = {};
    const services = this.getServices();
    for (const service of services) {
      const reducer = service.reducer;
      if (reducer) {
        result[service.path] = reducer.bind(service);
      }
    }
    return result;
  }

  static getMiddlewares(): StoreReducer[] {
    return this.getServices().map(x => x.middleware)
  }

  static getServices(): StoreService<any>[] {
    const result: StoreService<any>[] = [];
    const serviceMap = this.getServiceMap();
    for (const key in serviceMap) {
      if (serviceMap.hasOwnProperty(key)) {
        result.push(serviceMap[key]);
      }
    }
    return result;
  }

  /** The name of the action  */
  public get STATE_KEY(): string {
    return pascalCase("Service" + this.constructor.name.toLowerCase());
  }

  /** Returns a copy of the state, based on last known and changes */
  public get state(): STATE {
    return { ...this.stateLast, ...this.stateChanges };
  }

  public connections: Array<{ comp: any, sub?: any }> = [];

  protected readonly stateInit: STATE;

  private stateLast: STATE;
  private stateChanges: Partial<STATE>;
  private dispatchTimer: any;
  private subscriptions: Array<(state: STATE) => void> = [];

  private storeStateInternal: any;
  public get storeState(): any { return this.storeStateInternal; }

  private store: IStore;

  private isAttachedInternal: boolean;
  public get isAttached(): boolean { return this.isAttachedInternal; }

  constructor(public path: string, stateInit: STATE) {
    if (isDotPath(path) === false) {
      throw new Error("Service slice name must be dot path");
    }
    this.stateInit = Object.freeze(stateInit);
    this.stateLast = { ...stateInit };
    this.stateChanges = {};
  }

  /**
   * Attaches the service to a reducer
   * @param reducerObject the object containing the reducers
   * @param customPath an optional path (default is pascal service name)
   */
  public get middleware(): StoreMiddleware {
    return store => {
      this.store = store;
      return next => action => next(action);
    };
  }

  public get connector(): ServiceConnector<this, STATE> {
    return serviceConnector(this);
  }

  public get reducer(): StoreReducer {
    return this.reduce.bind(this) as StoreReducer;
  } 

  /**
   * Update the state, similar to a React component
   * @param stateChanges The properties to alter on the state
   */
  setState(stateChanges: Partial<STATE>) {
    this.stateChanges = this.stateChanges || {};
    for (const key in stateChanges) {
      if (typeof stateChanges[key] !== "undefined") {
        this.stateChanges[key] = stateChanges[key];
        this.stateLast[key] = stateChanges[key];
      }
    }
    this.dispatchScheduled();
  }

  public onConnect() {
    console.log("onConnect");
  }

  public addListener(onChange: () => void) {
    const index = this.subscriptions.length;
    this.subscriptions.push(onChange);
    return () => {
      this.subscriptions.slice(index, 1);
    };
  }

  /**
   * Updates the redux store at the end of the stack-frame
   */
  protected dispatchScheduled() {
    clearTimeout(this.dispatchTimer);
    this.dispatchTimer = setTimeout(() => this.dispatchImmediate(), 0);
  }

  /**
   * Updates the redux store now
   */
  protected dispatchImmediate() {
    clearTimeout(this.dispatchTimer);
    if (this.store) {
      this.store.dispatch({
        type: this.STATE_KEY,
        payload: this.stateChanges
      });
    }
  }

  /**
   * Can be overriden to react to incoming state changes
   * @param newState the full snapshot of changes properties
   */
  protected onStateChange(newState: STATE) {
    this.stateLast = newState;
    this.stateChanges = {};
  }

  /**
   * The redux reducer / handler
   * @param newState the full redux state
   * @param action the acton updating
   */
  private reduce(storeState: any, action: StoreAction) {
    const sliceState = lookup(storeState, this.path);
    let sliceHasChanged = objectsMatch(this.state, sliceState, 1) === false;
    if (sliceHasChanged) {
      this.storeStateInternal = storeState;
      this.stateLast = sliceState || this.stateLast || this.stateInit;
      this.stateChanges = {};
      const combined = {
        ...this.stateLast,
        ...(action ? action.payload : {})
      };
      for (const sub of this.subscriptions) {
        sub(combined);
      }
      this.onStateChange(combined);
      if (!storeState) {
        storeState = {};
      }
      set(storeState, this.path, this.state);
    }
    return storeState;
  }

}
