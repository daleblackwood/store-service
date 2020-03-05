"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function serviceConnector(service) {
    return (comp) => {
        return (props) => {
            service.onConnect();
            console.log("serviceConnector onConnect", comp, props);
            const renderComp = typeof comp === "function" ? comp : comp.WrappedComponent;
            if (!renderComp) {
                return;
            }
            const connectedProps = Object.assign(Object.assign(Object.assign({}, props), service.state), { service });
            return renderComp(connectedProps);
        };
    };
}
exports.serviceConnector = serviceConnector;
