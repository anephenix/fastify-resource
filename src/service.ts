import { Params, ModelType } from './global';

// Helper functions

const objectWithoutKey = (object: any, key: string) => {
  const { [key]: deletedKey, ...otherKeys } = object;
  return otherKeys;
};

// The generator function
function serviceGenerator(model: ModelType) {
  return {
    getAll: async (params: Params) => {
      try {
        const data = await model.query().where(params);
        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    },
    create: async (params: Params) => {
      try {
        const data = await model.query().insert(params);
        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    },
    get: async (params: Params) => {
      try {
        const data = await model.query().where(params);
        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    },
    update: async (params: Params) => {
      try {
        const updateParams = objectWithoutKey(params, 'id');
        const data = await model
          .query()
          .patchAndFetchById(params.id, updateParams);
        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    },
    delete: async (params: Params) => {
      try {
        await model.query().deleteById(params.id);
        return { success: true, data: params.id };
      } catch (error) {
        return { success: false, error };
      }
    },
  };
}

export default serviceGenerator;
