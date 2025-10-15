import type { FastifyReply, FastifyRequest } from "fastify";
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
};

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
};

export type Method = "get" | "post" | "patch" | "delete";

export type Route = {
	method: Method;
	url: string;
	handler: ControllerAction;
};

export type PreHandler = (
	request: FastifyRequest,
	reply: FastifyReply,
) => void | Promise<void>;

export type PreHandlerOption = PreHandler | Array<PreHandler>;

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
};
