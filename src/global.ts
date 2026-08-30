import type { FastifyReply, FastifyRequest, FastifySchema } from "fastify";
import type { Model, ModelClass } from "objection";

// NOTE - This needs adjusting
export type Metadata = string | object;

export type Params = {
	[key: string]: unknown;
};

export type ServiceResponse = {
	success: boolean;
	error?: Error;
	data?: unknown;
};

export type Service = {
	getAll: (params: Params) => Promise<ServiceResponse>;
	create: (params: Params) => Promise<ServiceResponse>;
	get: (params: Params) => Promise<ServiceResponse>;
	update: (params: Params) => Promise<ServiceResponse>;
	delete: (params: Params) => Promise<ServiceResponse>;
} & Record<string, (params: Params) => Promise<ServiceResponse>>;

export type Request = FastifyRequest;

export type StatusCode = 200 | 201 | 400 | 404;

export type Reply = {
	statusCode: number;
	code: (code: StatusCode) => void;
};

export type ResourcesList = Array<string>;
export type ResourceOrResourcesList = ResourcesList | string;

export type ControllerAction = (
	request: { params?: unknown; body?: unknown },
	reply: unknown,
) => void;

export type Controller = {
	index: ControllerAction;
	create: ControllerAction;
	get: ControllerAction;
	update: ControllerAction;
	delete: ControllerAction;
} & Record<string, ControllerAction>;

export type Method = "get" | "post" | "patch" | "delete";

export type Route = {
	method: Method;
	url: string;
	handler: ControllerAction;
	// The 5 generated CRUD actions use ActionServiceMappingKey; a custom
	// action (see CustomActionDefinition) contributes its own name here.
	action: ActionServiceMappingKey | string;
};

/*
  Where a custom action's route is mounted relative to the resource -
  "collection" appends after the collection URL (e.g. /people/rename),
  "member" appends after the member URL (e.g. /people/:id/archive). Using a
  scope rather than a hand-built URL means nested/self-referential resources
  (which have generated :xxx_id params) don't need to be accounted for
  manually.
*/
export type CustomActionScope = "collection" | "member";

/*
  Declares a custom API route (outside of the standard index/create/get/
  update/delete CRUD set) and the controller/service action that backs it.
  `name` is used as the key for the generated controller and service
  functions, as the `action` on the generated Route, and as the key to look
  up a per-action `schema` entry - the same way the built-in CRUD actions do.
*/
export type CustomActionDefinition = {
	name: string;
	method: Method;
	// Path segment (no leading slash) appended after the collection/member URL, e.g. "rename"
	path: string;
	scope: CustomActionScope;
	// HTTP status code to set on a successful response; defaults to 200
	successCode?: StatusCode;
	// Whether to merge the request body into params; defaults to true for post/patch, false otherwise
	includeBody?: boolean;
};

export type PreHandler = (
	request: FastifyRequest,
	reply: FastifyReply,
) => void | Promise<void>;

export type PreHandlerOption = PreHandler | Array<PreHandler>;

/*
  Maps a request header name to the key it should be assigned under in the
  params object passed to the service/model layer, e.g.
  { "x-tenant-id": "tenantId" }
*/
export type HeaderParams = Record<string, string>;

/*
  Maps/transforms the params object (url + body + headerParams, already
  merged) into the params that should actually be sent to the service/model
  layer - e.g. hashing a password, renaming a field, or deriving a value.
  Runs for every generated action (CRUD and custom), after the headerParams
  merge and just before the service is called, and is awaited so async work
  is supported.
*/
export type ParamsTransform = (
	params: Params,
	action: string,
) => Params | Promise<Params>;

/*
  Maps each resource action to the Fastify schema (body/querystring/params/
  headers/response) that should be applied to the route generated for it.
  Keyed by the 5 built-in CRUD action names, or by a custom action's `name`
  (see CustomActionDefinition).
*/
export type ResourceSchema = Partial<Record<string, FastifySchema>>;

export type ServiceKey = "getAll" | "create" | "get" | "update" | "delete";

export type ActionServiceMappingKey = keyof ActionServiceMapping;

export type HandleResponseParams = {
	success: boolean;
	data: unknown;
	error?: Error;
	successCode?: StatusCode;
	rep: Reply;
};

export type ActionServiceMapping = {
	index: ServiceKey;
	create: ServiceKey;
	get: ServiceKey;
	update: ServiceKey;
	delete: ServiceKey;
};

export type RouteParams = {
	url: string;
	handler: ControllerAction;
};

export type GenerateServiceParams = {
	getAll?: (params: Params) => Promise<ServiceResponse>;
	get?: (params: Params) => Promise<ServiceResponse>;
	create?: (params: Params) => Promise<ServiceResponse>;
	update?: (params: Params) => Promise<ServiceResponse>;
	del?: (params: Params) => Promise<ServiceResponse>;
};

export type ErrorOfSomeKind = Error | string | unknown;

export type ServiceOptions = {
	type?: "relatedQuery";
	relatedQuery?: string; // This is the relatedQuery to use for the resource
	primaryKey?: string; // This is the primary key to use for the resource
	customModelAction?: (
		action: string,
		model: ModelClass<Model>,
		params: Params,
	) => void;
};

// Plugin options type
export type FastifyResourcePluginOptions = {
	model: ModelClass<Model>;
	resourceList: ResourceOrResourcesList;
	// This is a way of specifying advanced options if say setting up a more advanced configuration like loading a relatedQuery for a resource
	serviceOptions?: ServiceOptions;
	preHandler?: PreHandlerOption;
	// Named request headers to extract and merge into the params object sent to the service
	headerParams?: HeaderParams;
	// Maps/transforms the assembled params object before it's sent to the service
	paramsTransform?: ParamsTransform;
	// Per-action Fastify schema (body/querystring/params/headers/response) for validation/serialization
	schema?: ResourceSchema;
	// Extra routes (outside of the standard CRUD set) and the controller/service actions that back them
	customActions?: Array<CustomActionDefinition>;
};
