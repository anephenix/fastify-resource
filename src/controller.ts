import {
  Service,
  ServiceKey,
  ActionServiceMapping,
  Request,
  Reply,
  StatusCode,
  Controller,
  HandleResponseParams,
  ActionServiceMappingKey,
} from './global';

/*
	TODO - use the error object to return the correct HTTP status code

	- 400 for bad request
	- 404 for not found
	- 422 for unprocessable entity
	- 500 for internal server error
*/

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

const actionServiceMapping: ActionServiceMapping = {
  index: 'getAll',
  create: 'create',
  get: 'get',
  update: 'update',
  delete: 'delete',
};

const getParams = (action: ActionServiceMappingKey, req: Request) => {
  const actionsWithBody = ['create', 'update'];
  if (actionsWithBody.includes(action)) {
    return Object.assign({}, req.params, req.body);
  }
  return req.params;
};

const getResponseData = (
  action: ActionServiceMappingKey,
  { success, data, error, rep }: HandleResponseParams
): HandleResponseParams => {
  if (action === 'create') {
    return { success, data, error, rep, successCode: 201 };
  }
  return { success, data, error, rep };
};

const generateAction = (action: ActionServiceMappingKey, service: Service) => {
  return async (req: Request, rep: Reply) => {
    const params = getParams(action, req);
    const method: ServiceKey = actionServiceMapping[action];
    const { success, data, error } = await service[method](params);
    const responseData = getResponseData(action, { success, data, error, rep });
    return handleResponse(responseData);
  };
};

const controllerGenerator = (service: Service) => {
  const actions = Object.keys(
    actionServiceMapping
  ) as ActionServiceMappingKey[];
  const actionSetup = (action: ActionServiceMappingKey) => {
    return [action, generateAction(action, service)];
  };
  const array = actions.map(actionSetup);
  const controller: Controller = Object.fromEntries(array);
  return controller;
};

export default controllerGenerator;
