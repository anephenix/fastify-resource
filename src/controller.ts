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

const controllerGenerator = (service: Service) => {
  return {
    index: async (req: Request, rep: Reply) => {
      const { success, data, error } = await service.getAll(req.params);
      return handleResponse({ success, data, error, rep });
    },
    create: async (req: Request, rep: Reply) => {
      const params = Object.assign({}, req.params, req.body);
      const { success, data, error } = await service.create(params);
      return handleResponse({ success, data, error, rep, successCode: 201 });
    },
    get: async (req: Request, rep: Reply) => {
      const { success, data, error } = await service.get(req.params);
      return handleResponse({ success, data, error, rep });
    },
    update: async (req: Request, rep: Reply) => {
      const params = Object.assign({}, req.params, req.body);
      const { success, data, error } = await service.update(params);
      return handleResponse({ success, data, error, rep });
    },
    delete: async (req: Request, rep: Reply) => {
      const { success, data, error } = await service.delete(req.params);
      return handleResponse({ success, data, error, rep });
    },
  };
};

export default controllerGenerator;
