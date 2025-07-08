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
	HandleResponseParams,
	Params,
	Reply,
	Request,
	Service,
	ServiceKey,
	StatusCode,
} from "./global";

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
  Ok, so the idea is this:

  - the function will be named `extractData`
  - the function will replace getParams
  - it will create an object
  - it will then look to extract the data from the request object in the various sections (headers, query, params, body)
  - it will then put these values into the object, based on what the service wants to receive:
    - e.g. say you have a service function for performing searches, it may be interested in the query string parameters as filters to search by
    - e.g. if you are creating a resource, then you have an interest in the body payload to define fields in the resource
    - e.g. if you are performing a scoped fetch for a nested resource, then you are interested in the url parameters (from a sluggable url)
    - e.g. if you are performing an action that requires being authorized, then you want to extract a header value for a specific header

    That object is then submitted to the service function as a data object, containing all of the required fields.
*/
// const extractData = (req: Request) => {
//   // Simple and dumb, it doesn't take into account what the service function wants or where to get it from
//   // What fields to extract, where to extract them from, and how to put them into the object
//   // That is the bit that need to be worked out
//   const { headers, query, params, body } = req;
//   const data = {
//     ...headers,
//     ...query,
//     ...params,
//   };
//   if (body) Object.assign(data, body);
//   return data;
// }

/*
  In the case of the create and update actions, we want to get the parameters
  that are passed in the HTTP API url, and be able to combine them with the 
  request body so that they can be passed alltogether to the service function.
*/
const getParams = (action: ActionServiceMappingKey, req: Request) => {
	const actionsWithBody = ["create", "update"];
	if (actionsWithBody.includes(action)) {
		return Object.assign({}, req.params, req.body);
	}
	return req.params;
};

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
const generateAction = (action: ActionServiceMappingKey, service: Service) => {
	return async (req: Request, rep: Reply) => {
		// Note - if we know what the service and action is, perhaps we can lookup a schema for the data that the service function expects
		// We then need a way to work out where that data would come from in a request object, such as the body, query, params, headers etc
		const params = getParams(action, req) as Params;
		const method: ServiceKey = actionServiceMapping[action];
		const { success, data, error } = await service[method](params);
		const responseData = getResponseData(action, { success, data, error, rep });
		return handleResponse(responseData);
	};
};

/*
  This function generates the controller for the service.
*/
const controllerGenerator = (service: Service): Controller => {
	const actions = Object.keys(
		actionServiceMapping,
	) as ActionServiceMappingKey[];
	const actionSetup = (action: ActionServiceMappingKey) => {
		return [action, generateAction(action, service)];
	};
	const array = actions.map(actionSetup);
	const controller: Controller = Object.fromEntries(array);
	return controller;
};

export default controllerGenerator;
