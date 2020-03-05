"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serviceConnector_1 = require("./serviceConnector");
const utils_1 = require("./utils");
/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
class StoreService {
    constructor(path, stateInit) {
        this.connections = [];
        this.subscriptions = [];
        if (utils_1.isDotPath(path) === false) {
            throw new Error("Service slice name must be dot path - got " + path);
        }
        this.path = path;
        this.stateInit = Object.freeze(stateInit);
        this.stateLast = Object.assign({}, stateInit);
        this.stateChanges = {};
    }
    /**
     * Create a static, global StoreService singleton
     * @param serviceClassDefinition The class definition for the service.
     */
    static define(serviceClassDefinition) {
        const className = serviceClassDefinition.name;
        const serviceMap = this.getServiceMap();
        const service = serviceMap[className] = serviceMap[className] || new serviceClassDefinition();
        return service;
    }
    /**
     * Retreive a service by class name
     * @param className the class name of the service
     */
    static get(className) {
        return this.getServiceMap()[className] || null;
    }
    static getServiceMap() {
        const mapParent = typeof window !== "undefined" ? window : this;
        if (!mapParent.services) {
            mapParent.services = {};
        }
        return mapParent.services;
    }
    static getReducers() {
        const result = {};
        const services = this.getServices();
        for (const service of services) {
            const reducer = service.reducer;
            if (reducer) {
                result[service.path] = reducer.bind(service);
            }
        }
        return result;
    }
    static getMiddlewares() {
        return this.getServices().map(x => x.middleware);
    }
    static getServices() {
        const result = [];
        const serviceMap = this.getServiceMap();
        for (const key in serviceMap) {
            if (serviceMap.hasOwnProperty(key)) {
                result.push(serviceMap[key]);
            }
        }
        return result;
    }
    static getStoreReducer(reducer) {
        if (typeof reducer !== "function") {
            throw new Error("reducer must be function");
        }
        return (state, action) => {
            const services = this.getServices();
            for (const service of services) {
                state = service.reducer(state, action);
            }
            return reducer(state, action);
        };
    }
    static getMiddleware() {
        return store => {
            this.staticStore = store;
            return next => action => next(action);
        };
    }
    /** The name of the action  */
    get STATE_KEY() {
        return utils_1.pascalCase("Service" + this.constructor.name.toLowerCase());
    }
    /** Returns a copy of the state, based on last known and changes */
    get state() {
        return Object.assign(Object.assign({}, this.stateLast), this.stateChanges);
    }
    get storeState() { return this.storeStateInternal; }
    get isAttached() { return this.isAttachedInternal; }
    /**
     * Attaches the service to a reducer
     * @param reducerObject the object containing the reducers
     * @param customPath an optional path (default is pascal service name)
     */
    get middleware() {
        return store => {
            this.store = store;
            return next => action => next(action);
        };
    }
    get connector() {
        return serviceConnector_1.serviceConnector(this);
    }
    get reducer() {
        return this.reduce.bind(this);
    }
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges) {
        this.stateChanges = this.stateChanges || {};
        for (const key in stateChanges) {
            if (typeof stateChanges[key] !== "undefined") {
                this.stateChanges[key] = stateChanges[key];
                this.stateLast[key] = stateChanges[key];
            }
        }
        return this.dispatchScheduled();
    }
    onConnect() {
        console.log("onConnect");
    }
    addListener(onChange) {
        const index = this.subscriptions.length;
        this.subscriptions.push(onChange);
        return () => {
            this.subscriptions.slice(index, 1);
        };
    }
    /**
     * Updates the redux store at the end of the stack-frame
     */
    dispatchScheduled() {
        clearTimeout(this.dispatchTimer);
        return new Promise(r => setTimeout(() => {
            this.dispatchImmediate();
            r();
        }, 0));
    }
    /**
     * Updates the redux store now
     */
    dispatchImmediate() {
        clearTimeout(this.dispatchTimer);
        const store = this.store || StoreService.staticStore;
        if (store) {
            store.dispatch({
                type: this.STATE_KEY,
                payload: this.stateChanges
            });
        }
    }
    /**
     * Can be overriden to react to incoming state changes
     * @param newState the full snapshot of changes properties
     */
    onStateChange(newState) {
        this.stateLast = newState;
        this.stateChanges = {};
    }
    /**
     * The redux reducer / handler
     * @param newState the full redux state
     * @param action the acton updating
     */
    reduce(storeState, action) {
        const sliceState = utils_1.lookup(storeState, this.path);
        let sliceHasChanged = utils_1.objectsMatch(this.state, sliceState, 1) === false;
        if (sliceHasChanged) {
            this.storeStateInternal = storeState;
            this.stateLast = sliceState || this.stateLast || this.stateInit;
            this.stateChanges = {};
            const combined = Object.assign(Object.assign({}, this.stateLast), (action ? action.payload : {}));
            for (const sub of this.subscriptions) {
                sub(combined);
            }
            this.onStateChange(combined);
            if (!storeState) {
                storeState = {};
            }
            utils_1.set(storeState, this.path, this.state);
        }
        return storeState;
    }
}
exports.StoreService = StoreService;
StoreService.staticStore = null;
