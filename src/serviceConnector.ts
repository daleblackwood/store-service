import { StoreService } from "./StoreService";

type FunctionComponent<PROPS_TYPE> = (props: PROPS_TYPE) => any;

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

export function connectToService<
  SERVICE_TYPE extends StoreService<STATE_TYPE>,
  STATE_TYPE = any
>(service: SERVICE_TYPE): ServiceConnector<SERVICE_TYPE, STATE_TYPE> {
  return <PROPS_TYPE>(comp: FunctionComponent<PROPS_TYPE>) => (
    (props: PROPS_TYPE) => {
      const renderComp = typeof comp === "function" ? comp : (comp as any).WrappedComponent;
      if (!renderComp) {
        return;
      }
      const connectedProps = {
        ...props,
        ...service.state,
        service
      };
      return renderComp(connectedProps) as ConnectedComponent<PROPS_TYPE, SERVICE_TYPE>;
    }
  );
}
