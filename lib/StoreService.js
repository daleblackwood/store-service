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
    constructor(path, stateInitial) {
        this.connections = [];
        this.subscriptions = [];
        this.hasInited = false;
        if (utils_1.isDotPath(path) === false) {
            throw new Error("Service slice name must be dot path - got " + path);
        }
        this.path = path;
        this.stateInitial = Object.freeze(stateInitial);
        this.stateLast = Object.assign({}, stateInitial);
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
    static getReducer(matchPaths) {
        return (state, action) => {
            const services = this.getServices(matchPaths);
            for (const service of services) {
                const reducer = service.reducer;
                if (reducer) {
                    state = reducer(state, action);
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
                const reducer = service.reducer;
                if (reducer) {
                    state = reducer(state, action);
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
    get reducer() {
        return this.reduce.bind(this);
    }
    connect(React) {
        return serviceConnector_1.serviceConnector(React, this);
    }
    subscribe(callback) {
        const index = this.getSubscriptionIndex(callback);
        if (index >= 0) {
            return;
        }
        this.subscriptions.push(callback);
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
        if (hasChanged) {
            return this.dispatchScheduled();
        }
    }
    init() { }
    onConnect(component) { }
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
    onState(newState) { }
    /**
     * The redux reducer / handler
     * @param newState the full redux state
     * @param action the acton updating
     */
    reduce(storeState, action) {
        const sliceState = utils_1.lookup(storeState, this.path);
        let currentState = this.state;
        const hasSliceChanged = utils_1.objectsMatch(currentState, sliceState, 1) === false;
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
exports.StoreService = StoreService;
StoreService.staticStore = null;
exports.default = StoreService;
