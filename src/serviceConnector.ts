

import { StoreService } from "./StoreService";

// tslint:disable max-classes-per-file

type FunctionComponent<PROPS_TYPE> = (props: PROPS_TYPE) => any;

export type ComponentType<PROPS_TYPE> = (props: PROPS_TYPE) => any | { props: PROPS_TYPE };

declare class ReactComponent<T = {}> {
  state: any;
  props: any;
  constructor(props: any);
  setState(state: any): void;
}

export interface IReact {
  Component: new <T>(props: any) => ReactComponent<T>;
  createElement: (element: any, props: any, children: any[]) => any;
  cloneElement: (element: any, props: any[], children: any[]) => any;
}

export function serviceConnector<
  SERVICE_TYPE extends StoreService<any> = StoreService<any>
>(React: IReact, service: SERVICE_TYPE) {
  return (component: FunctionComponent<typeof service.state & { service: typeof service }>) => {
    return class WrappedComponent extends React.Component<typeof service.state & { service: SERVICE_TYPE }> {
      state = { digest: 0, isMounted: false };
      constructor(props: any) {
        super(props);
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
        const wrappedProps = { ...service.state, service };
        const renderComp = (component as any).WrappedComponent || component;
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

export default serviceConnector;
