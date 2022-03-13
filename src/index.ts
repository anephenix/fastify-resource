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

type RouteMapParams = {
  method: Method;
  url: string;
  handler: ControllerAction;
};

type AttachParams = {
  routes: Array<RouteMapParams>;
  fastify: any; // TODO - see if type for fastify exists
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

export {
  serviceGenerator,
  controllerGenerator,
  resourceRoutes,
  resource,
  attach,
};
