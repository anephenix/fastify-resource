export type Params = Object<any>;

export type Service = {
  getAll: (params: Params) => Promise<any>;
  create: (params: Params) => Promise<any>;
  get: (params: Params) => Promise<any>;
  update: (params: Params) => Promise<any>;
  delete: (params: Params) => Promise<any>;
};

export type Request = {
  params: Params;
  body?: {};
};

export type StatusCode = 200 | 201 | 400 | 404;

export type Reply = {
  statusCode: number;
  code: (code: StatusCode) => void;
};

export type ModelType = {
  query: () => any;
};

export type ResourcesList = Array<string>;
export type ResourceOrResourcesList = ResourcesList | string;

export type ControllerAction = (request: any, reply: any) => void;

export type Controller = {
  index: ControllerAction;
  create: ControllerAction;
  get: ControllerAction;
  update: ControllerAction;
  delete: ControllerAction;
};

export type Method = 'get' | 'post' | 'patch' | 'delete';

export type Route = {
  method: Method;
  url: string;
  handler: ControllerAction;
};

export type ServiceKey = 'getAll' | 'create' | 'get' | 'update' | 'delete';

export type ActionServiceMappingKey = keyof ActionServiceMapping;

export type HandleResponseParams = {
  success: boolean;
  data: any;
  error: Error;
  successCode?: StatusCode;
  rep: Reply;
};

export type ActionServiceMapping = {
  index: ServiceKey;
  create: ServiceKey;
  get: ServiceKey;
  update: ServiceKey;
  delete: ServiceKey;
};
