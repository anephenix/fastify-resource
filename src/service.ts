// Dependencies
import type {
	ForIdValue,
	MaybeCompositeId,
	Model,
	ModelClass,
} from "objection";
import type {
	CustomActionDefinition,
	ErrorOfSomeKind,
	Params,
	Service,
	ServiceOptions,
	ServiceResponse,
} from "./global.js";
import { objectWithoutKey, pickKeys } from "./utils.js";

/*
  NOTE:

  I think that this needs to understand if the resource is an objection.js model or a relation
  and then adjust the query accordingly.

  In fact, it will need to in the context of Objection.js models.

  https://vincit.github.io/objection.js/guide/query-examples.html#relation-insert-queries

  At the moment, parent models are passed in as a parameter - e.g. parent_id.

*/
/*
  `ancestorParamKeys` is the list of ":xxx_id" ancestor params a nested
  resource's URL carries (see route.ts's getAncestorParamKeys), e.g.
  ["project_id"] for /projects/:project_id/items/:id. update/delete are
  scoped to those keys so that a request can't mutate/delete a record that
  doesn't actually belong to the parent(s) named in the URL - otherwise
  patchAndFetchById/deleteById would only ever check the record's own id,
  letting e.g. PATCH /projects/1/items/:id succeed for an item that
  actually belongs to project 2.
*/
const modelAction = async (
	action: string,
	model: ModelClass<Model>,
	params: Params,
	ancestorParamKeys: Array<string> = [],
) => {
	const scopeParams = pickKeys(params, ancestorParamKeys);
	switch (action) {
		case "getAll":
			return await model.query().where(params);
		case "get":
			return await model.query().where(params).first();
		case "create":
			return await model.query().insert(params);
		case "update": {
			const updated = await model
				.query()
				.where(scopeParams)
				.patchAndFetchById(
					params.id as MaybeCompositeId,
					objectWithoutKey(params, "id"),
				);
			// patchAndFetchById resolves to undefined (rather than rejecting)
			// when the where-scoped update matches zero rows - e.g. the id
			// exists but doesn't belong to the ancestor(s) named in the URL.
			if (!updated) {
				throw new Error(`Record with id ${params.id} not found`);
			}
			return updated;
		}
		case "delete": {
			const deletedCount = await model
				.query()
				.where(scopeParams)
				.deleteById(params.id as MaybeCompositeId);
			if (deletedCount === 0) {
				throw new Error(`Record with id ${params.id} not found`);
			}
			return params.id;
		}
		default:
			throw new Error(`Unknown action: ${action}`);
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
	ancestorParamKeys?: Array<string>,
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
				data = await modelAction(action, model, params, ancestorParamKeys);
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
	customActions?: Array<CustomActionDefinition>,
	ancestorParamKeys?: Array<string>,
): Service {
	const service: Service = {
		getAll: serviceFunction("getAll", model, serviceOptions, ancestorParamKeys),
		create: serviceFunction("create", model, serviceOptions, ancestorParamKeys),
		get: serviceFunction("get", model, serviceOptions, ancestorParamKeys),
		update: serviceFunction("update", model, serviceOptions, ancestorParamKeys),
		delete: serviceFunction("delete", model, serviceOptions, ancestorParamKeys),
	};
	if (customActions) {
		for (const { name } of customActions) {
			service[name] = serviceFunction(
				name,
				model,
				serviceOptions,
				ancestorParamKeys,
			);
		}
	}
	return service;
}

export default serviceGenerator;
export { modelAction };
