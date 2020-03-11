

import { StoreService } from "./StoreService";

// tslint:disable max-classes-per-file

type FunctionComponent<PROPS_TYPE> = (props: PROPS_TYPE) => any;

export type ComponentType<PROPS_TYPE> = (props: PROPS_TYPE) => any | { props: PROPS_TYPE };

declare class ReactComponent {
  state: any;
  props: any;
  constructor(props: any);
  setState(state: any): void;
}

export interface IReact {
  Component: new (props: any) => ReactComponent;
  createElement: (element: any, props: any, children: any[]) => any;
  cloneElement: (element: any, props: any[], children: any[]) => any;
}

export type ConnectedProps<
  PROPS_TYPE,
  SERVICE_TYPE extends StoreService<STATE_TYPE>,
  STATE_TYPE = any
> = PROPS_TYPE & { service: SERVICE_TYPE, children: any[] } & STATE_TYPE;

export type ConnectedComponent<
  PROPS_TYPE,
  SERVICE_TYPE extends StoreService<STATE_TYPE>,
  STATE_TYPE = any
> = FunctionComponent<ConnectedProps<PROPS_TYPE, SERVICE_TYPE, STATE_TYPE>>;

export type ServiceConnector<
  SERVICE_TYPE extends StoreService<STATE_TYPE>,
  STATE_TYPE = any
> = <PROPS_TYPE>(comp: FunctionComponent<PROPS_TYPE>) => ConnectedComponent<PROPS_TYPE, SERVICE_TYPE, STATE_TYPE>;

export function serviceConnector<
  SERVICE_TYPE extends StoreService<STATE_TYPE>,
  STATE_TYPE = any
>(React: IReact, service: SERVICE_TYPE): any {
  return <PROPS_TYPE>(component: ComponentType<PROPS_TYPE>) => {
    return class WrappedComponent extends React.Component {
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
      private updateState() {
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
    }
  };
}

export default serviceConnector;
