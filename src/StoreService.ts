import { dispatch } from "redux";
import services from "./services";
import { serviceConnector } from "./serviceConnector";

/** Service state snapshot */
export interface IServiceStateAction<T> {
  type: string,
  payload: Partial<T>
}

/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
export class StoreService<STATE extends Record<string, any>> {

  /**
   * Create a static, global StoreService singleton
   * @param StoreServiceDefinition The class definition for the service.
   */
  static create<T extends StoreService<any>>(StoreServiceDefinition: new() => T): T {
    const key = StoreServiceDefinition.name;
    const service = services[key] = services[key] || new StoreServiceDefinition();
    return service as T;
  }

  /** The name of the action  */
  public get STATE_KEY(): string {
    return "STATE_" + this.constructor.name.toUpperCase();
  }

  /** Returns a copy of the state, based on last known and changes */
  public get state(): STATE {
    return { ...this.stateLast, ...this.stateChanges };
  }

  /** Access to the in-built reducer */
  public get reducer() { return this.onReduce.bind(this); }

  public get connector() { return serviceConnector(this); }

  public connections: Array<{ comp: any, sub?: any }> = [];

  protected readonly stateInit: STATE;

  private stateLast: STATE;
  private stateChanges: Partial<STATE>;
  private dispatchTimer: any;
  private subscriptions: Array<() => void> = [];

  constructor(stateInit: STATE) {
    this.stateInit = Object.freeze(stateInit);
    this.stateLast = { ...stateInit };
    this.stateChanges = {};
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

  public subscribe(onChange: () => void) {
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
    dispatch({
      type: this.STATE_KEY,
      payload: this.stateChanges
    });
  }

  /**
   *
   * @param state
   * @param props
   */
  protected mapStateToProps(state: Record<string, any>, props: Record<string, any>): Record<string, any> {
    return props;
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
  private onReduce(newState: STATE, action: IServiceStateAction<STATE>) {
    if (action.type === this.STATE_KEY) {
      this.stateLast = newState || this.stateLast || this.stateInit;
      this.stateChanges = {};
      const combined = {
        ...this.stateLast,
        ...action.payload
      };
      for (const sub of this.subscriptions) {
        sub(combined);
      }
      this.onStateChange(combined);
    }
    return this.state;
  }

}
