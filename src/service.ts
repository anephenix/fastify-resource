// Dependencies
import type {
	ErrorOfSomeKind,
	ModelType,
	Params,
	ServiceOptions,
	ServiceResponse,
} from "./global";
import { objectWithoutKey } from "./utils";

/* 
  NOTE:

  I think that this needs to understand if the resource is an objection.js model or a relation
  and then adjust the query accordingly.

  In fact, it will need to in the context of Objection.js models.

  https://vincit.github.io/objection.js/guide/query-examples.html#relation-insert-queries

  At the moment, parent models are passed in as a parameter - e.g. parent_id.

*/
const modelAction = async (
	action: string,
	model: ModelType,
	params: Params,
) => {
	switch (action) {
		case "getAll":
			return await model.query().where(params);
		case "get":
			return await model.query().where(params).first();
		case "create":
			return await model.query().insert(params);
		case "update":
			return await model
				.query()
				.patchAndFetchById(params.id, objectWithoutKey(params, "id"));
		case "delete": {
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
	if (typeof error === "string") {
		return { success: false, error: new Error(error) };
	}
	return { success: false, error: new Error("No error provided") };
};

const serviceFunction = (
	action: string,
	model: ModelType,
	serviceOptions?: ServiceOptions,
) => {
	return async (params: Params): Promise<ServiceResponse> => {
		try {
			let data = null;
			if (serviceOptions?.customModelAction) {
				data = await serviceOptions.customModelAction(action, model, params);
			} else {
				data = await modelAction(action, model, params);
			}
			return { success: true, data };
		} catch (error) {
			return handleError(error);
		}
	};
};

// The generator function
function serviceGenerator(model: ModelType, serviceOptions?: ServiceOptions) {
	return {
		getAll: serviceFunction("getAll", model, serviceOptions),
		create: serviceFunction("create", model, serviceOptions),
		get: serviceFunction("get", model, serviceOptions),
		update: serviceFunction("update", model, serviceOptions),
		delete: serviceFunction("delete", model, serviceOptions),
	};
}

export default serviceGenerator;
