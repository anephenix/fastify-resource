// NOTE - This needs adjusting
export type Metadata = string | object;

export type Params = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type ServiceResponse = {
  success: boolean;
  error?: Error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export type Service = {
  getAll: (params: Params) => Promise<ServiceResponse>;
  create: (params: Params) => Promise<ServiceResponse>;
  get: (params: Params) => Promise<ServiceResponse>;
  update: (params: Params) => Promise<ServiceResponse>;
  delete: (params: Params) => Promise<ServiceResponse>;
};

export type Request = {
  params: Params;
  body?: unknown;
};

export type StatusCode = 200 | 201 | 400 | 404;

export type Reply = {
  statusCode: number;
  code: (code: StatusCode) => void;
};

export type ModelType = ObjectionModel;

export type ResourcesList = Array<string>;
export type ResourceOrResourcesList = ResourcesList | string;

export type ControllerAction = (request: { params?: unknown, body?: unknown}, reply: unknown) => void;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  error?: Error;
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


export type RouteParams = {
  url: string,
  handler: ControllerAction,
}


export type GenerateServiceParams = {
  getAll?: (params: Params) => Promise<ServiceResponse>;
  get?: (params: Params) => Promise<ServiceResponse>;
  create?: (params: Params) => Promise<ServiceResponse>;
  update?: (params: Params) => Promise<ServiceResponse>;
  del?: (params: Params) => Promise<ServiceResponse>;
};