"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serviceConnector_1 = require("./serviceConnector");
const utils_1 = require("./utils");
;
/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
class StoreService {
    /**
     * @param path - the location to occupy on the main store
     * @param stateInitial - the initial state of the service
     */
    constructor(path, stateInitial) {
        this.hasInited = false;
        if (utils_1.isDotPath(path) === false) {
            throw new Error("Service slice name must be dot path - got " + path);
        }
        this.slice = new StoreServiceSlice(path, path, stateInitial);
        this.dispatcher = new StoreServiceDispatcher(this.actionType);
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
    static getReducer(matchPaths) {
        return (state, action) => {
            const services = this.getServices(matchPaths);
            for (const service of services) {
                const slice = service.slice;
                if (slice) {
                    state = slice.reduce(state, action);
                }
            }
            return state;
        };
    }
    static wrapReducer(storeReducer, matchPaths) {
        return (state, action) => {
            state = storeReducer(state, action);
            const services = this.getServices(matchPaths);
            for (const service of services) {
                const slice = service.slice;
                if (slice) {
                    state = slice.reduce(state, action);
                }
            }
            return state;
        };
    }
    static getMiddlewares() {
        return this.getServices().map(x => x.middleware);
    }
    static getServices(matchPath) {
        if (typeof matchPath === "string") {
            matchPath = [matchPath];
        }
        const result = [];
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
    static getMiddleware() {
        return store => {
            this.staticStore = store;
            return next => action => next(action);
        };
    }
    static getServiceMap() {
        const mapParent = typeof window !== "undefined" ? window : this;
        if (!mapParent.services) {
            mapParent.services = {};
        }
        return mapParent.services;
    }
    /** The name of the action  */
    get actionType() {
        return utils_1.pascalCase("Service" + this.constructor.name.toLowerCase());
    }
    /** a readonly copy of the state, based on last known and changes */
    get state() { return this.slice.state; }
    /** a readonly copy of the store state */
    get storeState() { return this.slice.storeState; }
    get path() { return this.slice.path; }
    /**
     * Attaches the service to a reducer
     * @param reducerObject the object containing the reducers
     * @param customPath an optional path (default is pascal service name)
     */
    get middleware() {
        return store => {
            this.dispatcher.attach(store);
            return next => action => next(action);
        };
    }
    /**
     * receive a single reducer, for use in existing stores (not recommended)
     * @param React - React/preact or similar framework reference
     */
    get reducer() {
        return this.slice.reduce;
    }
    /**
     * connect in a manner similar ro react-redux as a HOC
     * @param React - React/preact or similar framework reference
     */
    connect(React) {
        return serviceConnector_1.serviceConnector(React, this);
    }
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges) {
        const hasChanged = this.slice.setState(stateChanges);
        if (hasChanged) {
            this.dispatcher.dispatchImmediate(this.state);
        }
    }
    /**
     * Subscribe to the service to receive changes
     * @param handler - a listening callback to subscribe
     */
    subscribe(handler) {
        return this.slice.subscribe(handler);
    }
    /**
     * Subscribe to the service to receive changes
     * @param handler - a listening callback to unsubscribe
     */
    unsubscribe(handler) {
        this.slice.unsubscribe(handler);
    }
    /**
     * Lifecycle method: can be overriden to react to readyness or initialize the
     * service
     * @param newState the full snapshot of changes properties
     */
    init() { }
    /**
     * Lifecycle method: can be overriden to react to incoming state changes
     * @param newState the full snapshot of changes properties
     */
    onState(newState) { }
}
exports.StoreService = StoreService;
StoreService.staticStore = null;
class StoreServiceDispatcher {
    constructor(type) {
        this.type = type;
        this.store = null;
    }
    attach(store) {
        this.store = store;
        if (StoreServiceDispatcher.staticStores.indexOf(store) < 0) {
            StoreServiceDispatcher.staticStores.push(store);
        }
    }
    /** Updates the redux store at the end of the stack-frame */
    dispatchScheduled(payload) {
        clearTimeout(this.dispatchTimer);
        return new Promise(r => setTimeout(() => {
            this.dispatchImmediate(payload);
            r();
        }, 0));
    }
    /** Updates the redux store now */
    dispatchImmediate(payload) {
        clearTimeout(this.dispatchTimer);
        const store = this.store || StoreServiceDispatcher.staticStores[0];
        if (store) {
            store.dispatch({ type: this.type, payload });
        }
    }
}
StoreServiceDispatcher.staticStores = [];
class StoreServiceSlice {
    constructor(key, path, stateInitial) {
        this.key = key;
        this.path = path;
        this.stateInitial = stateInitial;
        this.hasInited = false;
        this.stateChanges = {};
        this.subscriptions = [];
        if (utils_1.isDotPath(path) === false) {
            throw new Error("Service slice name must be dot path - got " + path);
        }
        this.path = path;
        this.stateInitial = Object.freeze(stateInitial);
        this.stateLast = Object.assign({}, stateInitial);
        this.stateChanges = {};
        this.reduce = this.reduce.bind(this);
    }
    /** Returns a copy of the state, based on last known and changes */
    get state() {
        return Object.assign(Object.assign({}, this.stateLast), this.stateChanges);
    }
    get storeState() { return this.storeStateInternal; }
    subscribe(callback) {
        const index = this.getSubscriptionIndex(callback);
        if (index >= 0) {
            return;
        }
        this.subscriptions.push(callback);
        return () => this.unsubscribe(callback);
    }
    unsubscribe(callback) {
        const index = this.getSubscriptionIndex(callback);
        if (index < 0) {
            return;
        }
        this.subscriptions.splice(index, 1);
    }
    getSubscriptionIndex(callback) {
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
    setState(stateChanges) {
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
    /**
     * The redux reducer / handler
     * @param newState the full redux state
     * @param action the acton updating
     */
    reduce(storeState, action) {
        const sliceState = utils_1.lookup(storeState, this.path);
        let currentState = this.state;
        const hasSliceChanged = utils_1.sameValue(currentState, sliceState, 1) === false;
        if (hasSliceChanged) {
            this.storeStateInternal = storeState;
            this.stateLast = sliceState || this.stateLast || this.stateInitial;
            this.stateChanges = {};
            this.stateLast = currentState;
            this.stateChanges = {};
            if (!storeState) {
                storeState = {};
            }
            utils_1.set(storeState, this.path, currentState);
            setTimeout(() => {
                for (const subcription of this.subscriptions) {
                    subcription(currentState);
                }
            }, 0);
        }
        return storeState;
    }
}
exports.default = StoreService;
