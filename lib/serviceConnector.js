"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function serviceConnector(React, service) {
    return (component) => {
        return class WrappedComponent extends React.Component {
            constructor(props) {
                super(props);
                this.state = { digest: 0, isMounted: false };
                this.updateState = this.updateState.bind(this);
            }
            componentDidMount() {
                service.subscribe(this.updateState);
                this.setState({ isMounted: true });
                setTimeout(this.updateState, 0);
            }
            componentWillUnmount() {
                service.unsubscribe(this.updateState);
                this.setState({ isMounted: false });
            }
            updateState() {
                if (this.state.isMounted) {
                    this.setState({ digest: this.state.digest + 1 });
                }
            }
            render() {
                const wrappedProps = Object.assign(Object.assign({}, service.state), { service });
                const renderComp = component.WrappedComponent || component;
                if (!renderComp) {
                    return null;
                }
                if (renderComp instanceof React.Component) {
                    return React.cloneElement(renderComp, [wrappedProps], null);
                }
                return React.createElement(renderComp, wrappedProps, null);
            }
        };
    };
}
exports.serviceConnector = serviceConnector;
exports.default = serviceConnector;
