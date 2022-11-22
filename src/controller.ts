import { Service, Request, Reply, StatusCode } from './global';

/*
	TODO - use the error object to return the correct HTTP status code

	- 400 for bad request
	- 404 for not found
	- 422 for unprocessable entity
	- 500 for internal server error
*/

// Types
type HandleResponseParams = {
  success: boolean;
  data: any;
  error: Error;
  successCode?: StatusCode;
  rep: Reply;
};

type ActionServiceMapping = {
  index: ServiceKey;
  create: ServiceKey;
  get: ServiceKey;
  update: ServiceKey;
  delete: ServiceKey;
}
type ActionServiceMappingKey = keyof typeof actionServiceMapping;
type ServiceKey = 'getAll' | 'create' | 'get' | 'update' | 'delete';

type Controller = {
  index?: any;
  create?: any;
  get?: any;
  update?: any;
  delete?: any;
}

const getCodeForError = (error: Error): StatusCode => {
  switch (error.message) {
    case 'Not found':
      return 404;
    default:
      return 400;
  }
};

const handleResponse = ({
  success,
  data,
  error,
  successCode,
  rep,
}: HandleResponseParams) => {
  if (success) {
    if (successCode) rep.code(successCode);
    return data;
  } else {
    rep.code(getCodeForError(error));
    return error.message;
  }
};

const actionServiceMapping:ActionServiceMapping = {
  index: 'getAll',
  create: 'create',
  get: 'get',
  update: 'update',
  delete: 'delete',
}

const getParams = (action:ActionServiceMappingKey, req: Request) => { 
  const actionsWithBody = ['create', 'update'];
  if (actionsWithBody.includes(action)) {
    return Object.assign({}, req.params, req.body);
  }
  return req.params;
}

const getResponseData = (action:ActionServiceMappingKey, { success, data, error, rep } : HandleResponseParams):HandleResponseParams => {
  if (action === 'create') {
    return { success, data, error, rep, successCode: 201 };
  }
  return { success, data, error, rep };
}

const generateAction = (action:ActionServiceMappingKey, service: Service) => {
  return async (req: Request, rep: Reply) => {
    const params = getParams(action, req);
    const method:ServiceKey = actionServiceMapping[action];
    const { success, data, error } = await service[method](params);
    const responseData = getResponseData(action, { success, data, error, rep });
    return handleResponse(responseData);
  }
}

const controllerGenerator = (service: Service) => {
  const controller:Controller = {};
  const actions = Object.keys(actionServiceMapping) as ActionServiceMappingKey[];
  actions.forEach(action => {
    controller[action] = generateAction(action as ActionServiceMappingKey, service);
  })
  return controller;
};

export default controllerGenerator;
