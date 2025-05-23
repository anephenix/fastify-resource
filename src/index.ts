// Dependencies
import serviceGenerator from './service';
import controllerGenerator from './controller';
import { resourceRoutes } from './route';
import {
  ModelType,
  ResourceOrResourcesList,
  ControllerAction,
  Method,
} from './global';
import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance as RealFastifyInstance } from 'fastify';

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

function resource(model: ModelType, resourceList: ResourceOrResourcesList) {
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

// Plugin options type
type FastifyResourcePluginOptions = {
  model: ModelType;
  resourceList: ResourceOrResourcesList;
};

// Fastify plugin
const fastifyResource = fastifyPlugin(
  async function (fastify: RealFastifyInstance, opts: FastifyResourcePluginOptions) {
    const { model, resourceList } = opts;
    const service = serviceGenerator(model);
    const controller = controllerGenerator(service);
    const routes = resourceRoutes(resourceList, controller);
    routes.forEach(({ method, url, handler }) => {
      (fastify as unknown as Record<string, (url: string, handler: ControllerAction) => void>)[method](url, handler);
    });
  },
  {
    name: 'fastify-resource',
  }
);

export default fastifyResource;
export {
  serviceGenerator,
  controllerGenerator,
  resourceRoutes,
  resource,
  attach,
};
