import { StoreService } from "./StoreService";
declare type FunctionComponent<PROPS_TYPE> = (props: PROPS_TYPE) => any;
export declare type ConnectedProps<PROPS_TYPE, SERVICE_TYPE extends StoreService<STATE_TYPE>, STATE_TYPE = any> = PROPS_TYPE & {
    service: SERVICE_TYPE;
    children: any[];
} & STATE_TYPE;
export declare type ConnectedComponent<PROPS_TYPE, SERVICE_TYPE extends StoreService<STATE_TYPE>, STATE_TYPE = any> = FunctionComponent<ConnectedProps<PROPS_TYPE, SERVICE_TYPE, STATE_TYPE>>;
export declare type ServiceConnector<SERVICE_TYPE extends StoreService<STATE_TYPE>, STATE_TYPE = any> = <PROPS_TYPE>(comp: FunctionComponent<PROPS_TYPE>) => ConnectedComponent<PROPS_TYPE, SERVICE_TYPE, STATE_TYPE>;
export declare function serviceConnector<SERVICE_TYPE extends StoreService<STATE_TYPE>, STATE_TYPE = any>(service: SERVICE_TYPE): ServiceConnector<SERVICE_TYPE, STATE_TYPE>;
export {};
