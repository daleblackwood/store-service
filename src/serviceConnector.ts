import { StoreService } from "./StoreService";

type FunctionComponent<PROPS_TYPE> = (props: PROPS_TYPE) => any;

type ComponentType<PROPS_TYPE> = (props: PROPS_TYPE) => any | { props: PROPS_TYPE };

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

function wrapComponent<PROPS_TYPE>(comp: ComponentType<PROPS_TYPE>, props: PROPS_TYPE) {
  const WrappedComponent = (comp && (comp as any).WrappedComponent) || comp;
  return WrappedComponent(props) as ComponentType<PROPS_TYPE>;
}

export function serviceConnector<
  SERVICE_TYPE extends StoreService<STATE_TYPE>,
  STATE_TYPE = any
>(service: SERVICE_TYPE): ServiceConnector<SERVICE_TYPE, STATE_TYPE> {
  return <PROPS_TYPE>(component: ComponentType<PROPS_TYPE>) => {
    return (props: PROPS_TYPE) => {
      const connectedProps = {
        ...props,
        ...service.state,
        service
      };
      const wrappedComponent = wrapComponent(component, connectedProps);
      service.onConnect(wrappedComponent);
      return wrappedComponent;
    };
  };
}

export default serviceConnector;
