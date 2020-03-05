import { ServiceConnector } from "./serviceConnector";
/** Service state snapshot */
export interface IServiceStateAction<T> {
    type: string;
    payload: Partial<T>;
}
declare type StoreAction<T = any> = {
    type: string;
    payload: T;
};
declare type StoreReducer<TState = any, TPayload = any> = (state: TState, action: StoreAction<TPayload>) => TState;
declare type StoreDispatch<TPayload = any> = (action: StoreAction<TPayload>) => void;
declare type StoreMiddleware = (store: IStore) => (next: StoreDispatch) => (action: StoreAction) => any;
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
export declare class StoreService<STATE extends Record<string, any>> {
    path: string;
    /**
     * Create a static, global StoreService singleton
     * @param serviceClassDefinition The class definition for the service.
     */
    static define<T extends StoreService<any>>(serviceClassDefinition: new () => T): T;
    /**
     * Retreive a service by class name
     * @param className the class name of the service
     */
    static get<T extends StoreService<any>>(className: string): T;
    static getServiceMap(): Record<string, StoreService<any>>;
    static getReducers(): Record<string, StoreReducer<any, any>>;
    static getMiddlewares(): StoreReducer[];
    static getServices(): StoreService<any>[];
    /** The name of the action  */
    get STATE_KEY(): string;
    /** Returns a copy of the state, based on last known and changes */
    get state(): STATE;
    connections: Array<{
        comp: any;
        sub?: any;
    }>;
    protected readonly stateInit: STATE;
    private stateLast;
    private stateChanges;
    private dispatchTimer;
    private subscriptions;
    private storeStateInternal;
    get storeState(): any;
    private store;
    private isAttachedInternal;
    get isAttached(): boolean;
    constructor(path: string, stateInit: STATE);
    /**
     * Attaches the service to a reducer
     * @param reducerObject the object containing the reducers
     * @param customPath an optional path (default is pascal service name)
     */
    get middleware(): StoreMiddleware;
    get connector(): ServiceConnector<this, STATE>;
    get reducer(): StoreReducer;
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges: Partial<STATE>): void;
    onConnect(): void;
    addListener(onChange: () => void): () => void;
    /**
     * Updates the redux store at the end of the stack-frame
     */
    protected dispatchScheduled(): void;
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
export {};
