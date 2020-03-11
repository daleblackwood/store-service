import { IReact } from "./serviceConnector";
/** Service state snapshot */
export interface IServiceStateAction<T> {
    type: string;
    payload: Partial<T>;
}
interface IStoreAction<T = any> {
    type: string;
    payload: T;
}
declare type StoreReducer<TState = any, TPayload = any> = (state: TState, action: IStoreAction<TPayload>) => TState;
declare type StoreDispatch<TPayload = any> = (action: IStoreAction<TPayload>) => void;
declare type StoreMiddleware = (store: IStore) => (next: StoreDispatch) => (action: IStoreAction) => any;
interface IStore<TState = any> {
    dispatch: StoreDispatch;
    getState: () => TState;
    subscribe: (listener: () => void) => () => void;
    replaceReducer: (nextReducers: StoreReducer) => StoreReducer;
}
/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
export declare class StoreService<STATE extends Record<string, any> = {}> {
    /**
     * Create a static, global StoreService singleton
     * @param serviceClassDefinition The class definition for the service.
     */
    static define<T extends StoreService>(serviceClassDefinition: new () => T): T;
    /**
     * Retreive a service by class name
     * @param className the class name of the service
     */
    static get<T extends StoreService>(className: string): T;
    static getReducer(matchPaths?: string[]): StoreReducer;
    static wrapReducer(storeReducer: StoreReducer, matchPaths?: string[]): StoreReducer;
    static getMiddlewares(): StoreReducer[];
    static getServices(matchPath?: string[]): Array<StoreService>;
    static getMiddleware(): StoreMiddleware;
    static staticStore: IStore;
    static getServiceMap(): Record<string, StoreService<any>>;
    /** The name of the action  */
    get actionType(): string;
    /** a readonly copy of the state, based on last known and changes */
    get state(): STATE;
    /** a readonly copy of the store state */
    get storeState(): any;
    get path(): string;
    protected readonly slice: StoreServiceSlice<STATE>;
    protected readonly dispatcher: StoreServiceDispatcher<STATE>;
    private hasInited;
    /**
     * @param path - the location to occupy on the main store
     * @param stateInitial - the initial state of the service
     */
    constructor(path: string, stateInitial: STATE);
    /**
     * Attaches the service to a reducer
     * @param reducerObject the object containing the reducers
     * @param customPath an optional path (default is pascal service name)
     */
    get middleware(): StoreMiddleware;
    /**
     * receive a single reducer, for use in existing stores (not recommended)
     * @param React - React/preact or similar framework reference
     */
    get reducer(): StoreReducer;
    /**
     * connect in a manner similar ro react-redux as a HOC
     * @param React - React/preact or similar framework reference
     */
    connect(React: IReact): any;
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges: Partial<STATE>): void;
    /**
     * Subscribe to the service to receive changes
     * @param handler - a listening callback to subscribe
     */
    subscribe(handler: () => void): () => void;
    /**
     * Subscribe to the service to receive changes
     * @param handler - a listening callback to unsubscribe
     */
    unsubscribe(handler: () => void): void;
    /**
     * Lifecycle method: can be overriden to react to readyness or initialize the
     * service
     * @param newState the full snapshot of changes properties
     */
    protected init(): void;
    /**
     * Lifecycle method: can be overriden to react to incoming state changes
     * @param newState the full snapshot of changes properties
     */
    protected onState(newState: STATE): void;
}
declare class StoreServiceDispatcher<STATE> {
    private type;
    private static staticStores;
    private dispatchTimer;
    store: IStore;
    constructor(type: string);
    attach(store: IStore): void;
    /** Updates the redux store at the end of the stack-frame */
    dispatchScheduled(payload: STATE): Promise<void>;
    /** Updates the redux store now */
    dispatchImmediate(payload: STATE): void;
}
declare class StoreServiceSlice<STATE> {
    readonly key: string;
    readonly path: string;
    readonly stateInitial: STATE;
    hasInited: boolean;
    stateLast: STATE;
    stateChanges: Partial<STATE>;
    /** Returns a copy of the state, based on last known and changes */
    get state(): STATE;
    private subscriptions;
    private storeStateInternal;
    get storeState(): any;
    constructor(key: string, path: string, stateInitial: STATE);
    subscribe(callback: (state: STATE) => void): () => void;
    unsubscribe(callback: (state: STATE) => void): void;
    getSubscriptionIndex(callback: (state: STATE) => void): number;
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges: Partial<STATE>): boolean;
    /**
     * The redux reducer / handler
     * @param newState the full redux state
     * @param action the acton updating
     */
    reduce(storeState: any, action: IStoreAction): any;
}
export default StoreService;
