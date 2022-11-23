import { Params, ModelType } from './global';

// Helper functions

const objectWithoutKey = (object: any, key: string) => {
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
      return await model.query().where(params); //.first();
    case 'create':
      return await model.query().insert(params);
    case 'update':
      return await model
        .query()
        .patchAndFetchById(params.id, objectWithoutKey(params, 'id'));
    case 'delete':
      await model.query().deleteById(params.id);
      return params.id;
  }
};

const serviceFunction = (action: string, model: ModelType) => {
  return async (params: Params) => {
    try {
      const data = await modelAction(action, model, params);
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
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
