// Dependencies
import serviceGenerator from './service';
import controllerGenerator from './controller';
import { resourceRoutes } from './route';
import type {
  ModelType,
  ResourceOrResourcesList,
  ControllerAction,
  Method,
} from './global';
import fastifyPlugin from 'fastify-plugin';
import type { FastifyInstance as RealFastifyInstance } from 'fastify';

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
  async (fastify: RealFastifyInstance, opts: FastifyResourcePluginOptions) => {
    /*
      NOTE:
    
      Here the logic seems to assume that each resource in the resourceList is 
      a model. It might be a relation instead. This might need to be explicitly specified in some way.
      
      We need to make the solution smart enough to make that distinction. 
      Perhaps it needs to find a way to read the relation mapping of each model
      and then create the routes accordingly. 
    */
    const { model, resourceList } = opts;
    const service = serviceGenerator(model);
    const controller = controllerGenerator(service);
    const routes = resourceRoutes(resourceList, controller);
    for (const { method, url, handler } of routes) {
      (
        fastify as unknown as Record<
          string,
          (url: string, handler: ControllerAction) => void
        >
      )[method](url, handler);
    }
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
