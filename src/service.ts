// Dependencies
import type {
  Params,
  ModelType,
  ServiceResponse,
  ErrorOfSomeKind,
} from './global';

// Helper functions

const objectWithoutKey = (object: Record<string, unknown>, key: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: deletedKey, ...otherKeys } = object;
  return otherKeys;
};

const modelAction = async (
  action: string,
  model: ModelType,
  params: Params
) => {
  switch (action) {
    case 'getAll':
      return await model.query().where(params);
    case 'get':
      return await model.query().where(params).first();
    case 'create':
      return await model.query().insert(params);
    case 'update':
      return await model
        .query()
        .patchAndFetchById(params.id, objectWithoutKey(params, 'id'));
    case 'delete': {
      const deletedCount = await model.query().deleteById(params.id);
      if (deletedCount === 0) {
        throw new Error(`Record with id ${params.id} not found`);
      }
      return params.id;
    }
  }
};

const handleError = (error: ErrorOfSomeKind) => {
  if (error instanceof Error) {
    return { success: false, error };
  }
  if (typeof error === 'string') {
    return { success: false, error: new Error(error) };
  }
  return { success: false, error: new Error('No error provided') };
};

const serviceFunction = (action: string, model: ModelType) => {
  return async (params: Params): Promise<ServiceResponse> => {
    try {
      const data = await modelAction(action, model, params);
      return { success: true, data };
    } catch (error) {
      return handleError(error);
    }
  };
};

// The generator function
function serviceGenerator(model: ModelType) {
  return {
    getAll: serviceFunction('getAll', model),
    create: serviceFunction('create', model),
    get: serviceFunction('get', model),
    update: serviceFunction('update', model),
    delete: serviceFunction('delete', model),
  };
}

export default serviceGenerator;
