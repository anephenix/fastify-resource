// Dependencies

import type { FastifyInstance as RealFastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import type { Model, ModelClass } from "objection";
import controllerGenerator from "./controller.js";
import type {
	ControllerAction,
	CustomActionDefinition,
	FastifyResourcePluginOptions,
	Method,
	PreHandlerOption,
	ResourceOrResourcesList,
} from "./global.js";
import { resourceRoutes } from "./route.js";
import serviceGenerator, { modelAction } from "./service.js";

type RouteMapParams = {
	method: Method;
	url: string;
	handler: ControllerAction;
};

type FastifyInstance = {
	[key: string]: (url: string, handler: ControllerAction) => void;
};

type AttachParams = {
	routes: Array<RouteMapParams>;
	fastify: FastifyInstance;
};

function resource(
	model: ModelClass<Model>,
	resourceList: ResourceOrResourcesList,
	customActions?: Array<CustomActionDefinition>,
) {
	const service = serviceGenerator(model, undefined, customActions);
	const controller = controllerGenerator(service, undefined, customActions);
	const routes = resourceRoutes(resourceList, controller, customActions);
	return { routes, controller, service };
}

function attach({ routes, fastify }: AttachParams): null {
	routes.map(({ method, url, handler }: RouteMapParams) => {
		return fastify[method](url, handler);
	});
	return null;
}

// Fastify plugin
const fastifyResource = fastifyPlugin(
	async (fastify: RealFastifyInstance, opts: FastifyResourcePluginOptions) => {
		const {
			model,
			resourceList,
			serviceOptions,
			preHandler,
			headerParams,
			schema,
			customActions,
			paramsTransform,
		} = opts;
		const service = serviceGenerator(model, serviceOptions, customActions);
		const controller = controllerGenerator(
			service,
			headerParams,
			customActions,
			paramsTransform,
		);
		const routes = resourceRoutes(resourceList, controller, customActions);
		for (const { method, url, handler, action } of routes) {
			const routeOptions: { preHandler?: PreHandlerOption; schema?: unknown } =
				{};
			if (preHandler) routeOptions.preHandler = preHandler;
			const actionSchema = schema?.[action];
			if (actionSchema) routeOptions.schema = actionSchema;
			if (Object.keys(routeOptions).length > 0) {
				(
					fastify as unknown as Record<
						string,
						(
							url: string,
							optsOrHandler: unknown,
							handler?: ControllerAction,
						) => void
					>
				)[method](url, routeOptions, handler);
			} else {
				(
					fastify as unknown as Record<
						string,
						(url: string, handler: ControllerAction) => void
					>
				)[method](url, handler);
			}
		}
	},
	{
		name: "fastify-resource",
	},
);

export default fastifyResource;
export {
	attach,
	controllerGenerator,
	modelAction,
	resource,
	resourceRoutes,
	serviceGenerator,
};
