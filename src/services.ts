const parentScope: any = typeof window !== "undefined" ? window
  : typeof global !== "undefined" ? global
  : this;

parentScope.services = parentScope.services || {};
const services = parentScope.services;
export default services;
