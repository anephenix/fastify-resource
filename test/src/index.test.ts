import { ControllerAction } from '../../src/global';
import {
  serviceGenerator,
  controllerGenerator,
  resourceRoutes,
  resource,
  attach,
} from '../../src/index';
import { model } from '../helpers/model';

describe('index', () => {
  describe('should export the main functions', () => {
    test('should export the serviceGenerator function', () => {
      expect(serviceGenerator).toBeDefined();
    });
    test('should export the controllerGenerator function', () => {
      expect(controllerGenerator).toBeDefined();
    });
    test('should export the resourceRoutes function', () => {
      expect(resourceRoutes).toBeDefined();
    });
  });

  describe('#resource', () => {
    test('should generate the service, controller and resource routes from the model and resource list', () => {
      const resourceList = ['asset'];
      const { service, controller, routes } = resource(model, resourceList);
      expect(service).toBeDefined();
      expect(controller).toBeDefined();
      expect(routes).toBeDefined();
      expect(routes[0]).toStrictEqual({
        method: 'get',
        url: '/assets',
        handler: controller.index,
      });
      expect(routes[1]).toStrictEqual({
        method: 'post',
        url: '/assets',
        handler: controller.create,
      });
      expect(routes[2]).toStrictEqual({
        method: 'get',
        url: '/assets/:id',
        handler: controller.get,
      });
      expect(routes[3]).toStrictEqual({
        method: 'patch',
        url: '/assets/:id',
        handler: controller.update,
      });
      expect(routes[4]).toStrictEqual({
        method: 'delete',
        url: '/assets/:id',
        handler: controller.delete,
      });
    });
  });

  describe('#attach', () => {
    test('should attach the routes to the fastify app', () => {
      const resourceList = ['asset'];
      const { routes, controller } = resource(model, resourceList);
      const routeItems = {
        get: [] as any,
        post: [] as any,
        patch: [] as any,
        delete: [] as any,
      };
      const fastify = {
        get: (url: string, handler: ControllerAction) => {
          routeItems.get.push({ url, handler });
        },
        post: (url: string, handler: ControllerAction) => {
          routeItems.post.push({ url, handler });
        },
        patch: (url: string, handler: ControllerAction) => {
          routeItems.patch.push({ url, handler });
        },
        delete: (url: string, handler: ControllerAction) => {
          routeItems.delete.push({ url, handler });
        },
      };
      attach({ routes, fastify });
      expect(routeItems.get.length).toBe(2);
      expect(routeItems.post.length).toBe(1);
      expect(routeItems.patch.length).toBe(1);
      expect(routeItems.delete.length).toBe(1);
      expect(routeItems.get[0].url).toBe('/assets');
      expect(routeItems.get[0].handler).toStrictEqual(controller.index);
      expect(routeItems.get[1].url).toBe('/assets/:id');
      expect(routeItems.get[1].handler).toStrictEqual(controller.get);
      expect(routeItems.post[0].url).toBe('/assets');
      expect(routeItems.post[0].handler).toStrictEqual(controller.create);
      expect(routeItems.patch[0].url).toBe('/assets/:id');
      expect(routeItems.patch[0].handler).toStrictEqual(controller.update);
      expect(routeItems.delete[0].url).toBe('/assets/:id');
      expect(routeItems.delete[0].handler).toStrictEqual(controller.delete);
    });
  });
});
