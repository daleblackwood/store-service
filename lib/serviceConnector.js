"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function wrapComponent(comp, props) {
    const WrappedComponent = (comp && comp.WrappedComponent) || comp;
    return WrappedComponent(props);
}
function serviceConnector(service) {
    return (component) => {
        return (props) => {
            const connectedProps = Object.assign(Object.assign(Object.assign({}, props), service.state), { service });
            const wrappedComponent = wrapComponent(component, connectedProps);
            service.onConnect(wrappedComponent);
            return wrappedComponent;
        };
    };
}
exports.serviceConnector = serviceConnector;
exports.default = serviceConnector;
