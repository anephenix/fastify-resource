// Dependencies
import type {
	ForIdValue,
	MaybeCompositeId,
	Model,
	ModelClass,
} from "objection";
import type {
	ErrorOfSomeKind,
	Params,
	ServiceOptions,
	ServiceResponse,
} from "./global.js";
import { objectWithoutKey } from "./utils.js";

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
	model: ModelClass<Model>,
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
				.patchAndFetchById(
					params.id as MaybeCompositeId,
					objectWithoutKey(params, "id"),
				);
		case "delete": {
			const deletedCount = await model
				.query()
				.deleteById(params.id as MaybeCompositeId);
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

const generateModelAction = (relatedQuery: string, primaryKey: string) => {
	return async (action: string, model: ModelClass<Model>, params: Params) => {
		const primaryId = params[primaryKey] as ForIdValue;
		const paramsToInsert = objectWithoutKey(params, primaryKey);
		const paramsToUpdate = objectWithoutKey(
			objectWithoutKey(paramsToInsert, "id"),
			primaryKey,
		);

		switch (action) {
			case "getAll":
				return await model.relatedQuery(relatedQuery).for(primaryId);
			case "get":
				return await model
					.relatedQuery(relatedQuery)
					.for(primaryId)
					.findById(params.id as MaybeCompositeId)
					.first();
			case "create":
				return await model
					.relatedQuery(relatedQuery)
					.for(primaryId)
					.insert(paramsToInsert);
			case "update":
				return await model
					.relatedQuery(relatedQuery)
					.for(primaryId)
					.patchAndFetchById(params.id as MaybeCompositeId, paramsToUpdate);
			case "delete": {
				const deletedCount = await model
					.relatedQuery(relatedQuery)
					.for(primaryId)
					.findById(params.id as MaybeCompositeId)
					.delete();
				if (deletedCount === 0) {
					throw new Error(`Record with id ${params.id} not found`);
				}
				return params.id;
			}
			default:
				throw new Error(`Unknown action: ${action}`);
		}
	};
};

const serviceFunction = (
	action: string,
	model: ModelClass<Model>,
	serviceOptions?: ServiceOptions,
) => {
	return async (params: Params): Promise<ServiceResponse> => {
		try {
			let data = null;
			if (serviceOptions?.customModelAction) {
				data = await serviceOptions.customModelAction(action, model, params);
			} else if (
				serviceOptions?.type === "relatedQuery" &&
				serviceOptions.relatedQuery &&
				serviceOptions.primaryKey
			) {
				const { relatedQuery, primaryKey } = serviceOptions;
				const relatedQueryModelAction = generateModelAction(
					relatedQuery,
					primaryKey,
				);
				data = await relatedQueryModelAction(action, model, params);
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
function serviceGenerator(
	model: ModelClass<Model>,
	serviceOptions?: ServiceOptions,
) {
	return {
		getAll: serviceFunction("getAll", model, serviceOptions),
		create: serviceFunction("create", model, serviceOptions),
		get: serviceFunction("get", model, serviceOptions),
		update: serviceFunction("update", model, serviceOptions),
		delete: serviceFunction("delete", model, serviceOptions),
	};
}

export default serviceGenerator;
