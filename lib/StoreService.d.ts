import { ServiceConnector } from "./serviceConnector";
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
    static getServiceMap(): Record<string, StoreService<any>>;
    static getReducer(matchPaths?: string[]): StoreReducer;
    static wrapReducer(storeReducer: StoreReducer, matchPaths?: string[]): StoreReducer;
    static getMiddlewares(): StoreReducer[];
    static getServices(matchPath?: string[]): Array<StoreService>;
    static getMiddleware(): StoreMiddleware;
    static staticStore: IStore;
    /** The name of the action  */
    get STATE_KEY(): string;
    /** Returns a copy of the state, based on last known and changes */
    get state(): STATE;
    connections: Array<{
        comp: any;
        sub?: any;
    }>;
    protected readonly stateInitial: STATE;
    private stateLast;
    private stateChanges;
    private dispatchTimer;
    private subscriptions;
    private storeStateInternal;
    get storeState(): any;
    private store;
    path: string;
    private isAttachedInternal;
    get isAttached(): boolean;
    private hasInited;
    constructor(path: string, stateInitial: STATE);
    /**
     * Attaches the service to a reducer
     * @param reducerObject the object containing the reducers
     * @param customPath an optional path (default is pascal service name)
     */
    get middleware(): StoreMiddleware;
    get connector(): ServiceConnector<this, STATE>;
    get reducer(): StoreReducer;
    connect(additionalProps?: Partial<STATE>): ServiceConnector<this, STATE>;
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges: Partial<STATE>): Promise<unknown>;
    onInit(): void;
    onConnect(component?: any): void;
    addListener(onChange: () => void): () => void;
    /**
     * Updates the redux store at the end of the stack-frame
     */
    protected dispatchScheduled(): Promise<unknown>;
    /**
     * Updates the redux store now
     */
    protected dispatchImmediate(): void;
    /**
     * Can be overriden to react to incoming state changes
     * @param newState the full snapshot of changes properties
     */
    protected onStateChange(newState: STATE): void;
    /**
     * The redux reducer / handler
     * @param newState the full redux state
     * @param action the acton updating
     */
    private reduce;
}
export default StoreService;
