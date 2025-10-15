// Dependencies

import type { FastifyInstance as RealFastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import type { Model, ModelClass } from "objection";
import controllerGenerator from "./controller.js";
import type {
	ControllerAction,
	FastifyResourcePluginOptions,
	Method,
	ResourceOrResourcesList,
} from "./global.js";
import { resourceRoutes } from "./route.js";
import serviceGenerator from "./service.js";

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
) {
	const service = serviceGenerator(model);
	const controller = controllerGenerator(service);
	const routes = resourceRoutes(resourceList, controller);
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
		const { model, resourceList, serviceOptions, preHandler } = opts;
		const service = serviceGenerator(model, serviceOptions);
		const controller = controllerGenerator(service);
		const routes = resourceRoutes(resourceList, controller);
		for (const { method, url, handler } of routes) {
			if (preHandler) {
				(
					fastify as unknown as Record<
						string,
						(
							url: string,
							optsOrHandler: unknown,
							handler?: ControllerAction,
						) => void
					>
				)[method](url, { preHandler }, handler);
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
	serviceGenerator,
	controllerGenerator,
	resourceRoutes,
	resource,
	attach,
};
