/*
  This file is used to generate a controller for a service. The controller
  is then able to serve HTTP requests for RESTful API routes specified for 
  fastify.
*/

// Dependencies
import type {
	ActionServiceMapping,
	ActionServiceMappingKey,
	Controller,
	ControllerAction,
	CustomActionDefinition,
	HandleResponseParams,
	HeaderParams,
	Params,
	ParamsTransform,
	Reply,
	Request,
	Service,
	ServiceKey,
	StatusCode,
} from "./global.js";

/*
  This function looks at the error object and returns the correct HTTP status 
  code to reflect the nature of the error.

	TODO - use the error object to return the correct HTTP status code

	- 400 for bad request
	- 404 for not found
	- 422 for unprocessable entity
	- 500 for internal server error
*/
const getCodeForError = (error: Error): StatusCode => {
	return error.message === "Not found" ? 404 : 400;
};

/*
  A helper function that returns the data if the success flag is true.
  It also sets the HTTP status code if a successCode is provided..
*/
const handleSuccessfulResponse = ({
	data,
	successCode,
	rep,
}: HandleResponseParams) => {
	if (successCode) rep.code(successCode);
	return data;
};

/*
  This handles the response for the controller action. 
*/
const handleResponse = ({
	success,
	data,
	error,
	successCode,
	rep,
}: HandleResponseParams) => {
	if (success)
		return handleSuccessfulResponse({ success, data, successCode, rep });
	if (error) {
		rep.code(getCodeForError(error));
		return error.message;
	}
	return "No error provided";
};

/*
  This object maps the controller actions to the service methods, so that we 
  we able to use the same code for generating each of the controller actions 
  and getting them to call their respective service functions.  
*/
const actionServiceMapping: ActionServiceMapping = {
	index: "getAll",
	create: "create",
	get: "get",
	update: "update",
	delete: "delete",
};

/*
  Extracts the configured request headers (e.g. a bearer token, or a header
  used to scope queries such as x-tenant-id) and returns them as a params
  object, keyed by the name given in the headerParams mapping.

  Header names are looked up case-insensitively, since Fastify normalises
  incoming header names to lowercase. Headers that are absent from the
  request are skipped rather than being added as undefined. Multi-value
  headers (arrays) are not supported and are skipped.
*/
const getHeaderParams = (
	headerParams: HeaderParams | undefined,
	req: Request,
): Params => {
	const data: Params = {};
	if (!headerParams) return data;
	for (const [headerName, paramKey] of Object.entries(headerParams)) {
		const value = req.headers[headerName.toLowerCase()];
		if (typeof value === "string") data[paramKey] = value;
	}
	return data;
};

/*
  In the case of actions that accept a request body (create/update, and any
  custom action opted into it), we want to get the parameters that are
  passed in the HTTP API url, and be able to combine them with the request
  body so that they can be passed alltogether to the service function.

  Header-derived params (if configured) are merged in last, so that a value
  taken from a request header (e.g. a tenant id or a user id resolved from a
  bearer token) cannot be overridden by a client-supplied body/url param of
  the same name.
*/
const getParams = (
	req: Request,
	includeBody: boolean,
	headerParams?: HeaderParams,
) => {
	const base = includeBody
		? Object.assign({}, req.params, req.body)
		: Object.assign({}, req.params);
	return Object.assign(base, getHeaderParams(headerParams, req));
};

const actionsWithBody: Array<ActionServiceMappingKey> = ["create", "update"];

/*
  This function return the correct response data for the controller action.

  In the case of create actions, we want to return a 201 status code as that 
  is the correct HTTP Status Code for a creative RESTful API action.
*/
const getResponseData = (
	action: ActionServiceMappingKey,
	{ success, data, error, rep }: HandleResponseParams,
): HandleResponseParams => {
	if (action === "create") {
		return { success, data, error, rep, successCode: 201 };
	}
	return { success, data, error, rep };
};

/*
  This function generates the controller action for the service method.
*/
const generateAction = (
	action: ActionServiceMappingKey,
	service: Service,
	headerParams?: HeaderParams,
	paramsTransform?: ParamsTransform,
) => {
	return async (req: Request, rep: Reply) => {
		const includeBody = actionsWithBody.includes(action);
		const rawParams = getParams(req, includeBody, headerParams) as Params;
		const params = paramsTransform
			? await paramsTransform(rawParams, action)
			: rawParams;
		const method: ServiceKey = actionServiceMapping[action];
		const { success, data, error } = await service[method](params);
		const responseData = getResponseData(action, { success, data, error, rep });
		return handleResponse(responseData);
	};
};

/*
  HTTP methods that carry a request body by convention - used as the default
  for a custom action's `includeBody` when it isn't set explicitly.
*/
const methodsWithBodyByDefault = ["post", "patch"];

/*
  This function generates the controller action for a custom action, calling
  the service function registered under the same name (see
  serviceGenerator's handling of `customActions`). It reuses the same
  param-extraction and response-handling as the built-in CRUD actions.
*/
const generateCustomAction = (
	customAction: CustomActionDefinition,
	service: Service,
	headerParams?: HeaderParams,
	paramsTransform?: ParamsTransform,
) => {
	const { name, method, includeBody, successCode } = customAction;
	const shouldIncludeBody =
		includeBody ?? methodsWithBodyByDefault.includes(method);
	return async (req: Request, rep: Reply) => {
		const rawParams = getParams(req, shouldIncludeBody, headerParams) as Params;
		const params = paramsTransform
			? await paramsTransform(rawParams, name)
			: rawParams;
		const { success, data, error } = await service[name](params);
		return handleResponse({ success, data, error, rep, successCode });
	};
};

/*
  This function generates the controller for the service.
*/
const controllerGenerator = (
	service: Service,
	headerParams?: HeaderParams,
	customActions?: Array<CustomActionDefinition>,
	paramsTransform?: ParamsTransform,
): Controller => {
	const actions = Object.keys(
		actionServiceMapping,
	) as ActionServiceMappingKey[];
	const actionSetup = (action: ActionServiceMappingKey) => {
		return [
			action,
			generateAction(action, service, headerParams, paramsTransform),
		];
	};
	const array = actions.map(actionSetup);
	const controller: Controller = Object.fromEntries(array);
	if (customActions) {
		for (const customAction of customActions) {
			controller[customAction.name] = generateCustomAction(
				customAction,
				service,
				headerParams,
				paramsTransform,
			) as unknown as ControllerAction;
		}
	}
	return controller;
};

export default controllerGenerator;
