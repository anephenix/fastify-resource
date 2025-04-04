import { strict as assert } from 'assert';
import { ControllerAction, RouteParams } from '../../src/global';
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
    it('should export the serviceGenerator function', () => {
      assert.ok(serviceGenerator);
    });
    it('should export the controllerGenerator function', () => {
      assert.ok(controllerGenerator);
    });
    it('should export the resourceRoutes function', () => {
      assert.ok(resourceRoutes);
    });
  });

  describe('#resource', () => {
    it('should generate the service, controller and resource routes from the model and resource list', () => {
      const resourceList = ['asset'];
      const { service, controller, routes } = resource(model, resourceList);
      assert.ok(service);
      assert.ok(controller);
      assert.ok(routes);
      assert.deepStrictEqual(routes[0], {
        method: 'get',
        url: '/assets',
        handler: controller.index,
      });
      assert.deepStrictEqual(routes[1], {
        method: 'post',
        url: '/assets',
        handler: controller.create,
      });
      assert.deepStrictEqual(routes[2], {
        method: 'get',
        url: '/assets/:id',
        handler: controller.get,
      });
      assert.deepStrictEqual(routes[3], {
        method: 'patch',
        url: '/assets/:id',
        handler: controller.update,
      });
      assert.deepStrictEqual(routes[4], {
        method: 'delete',
        url: '/assets/:id',
        handler: controller.delete,
      });
    });
  });

  describe('#attach', () => {
    it('should attach the routes to the fastify app', () => {
      const resourceList = ['asset'];
      const { routes, controller } = resource(model, resourceList);
      const routeItems = {
        get: [] as Array<RouteParams>,
        post: [] as Array<RouteParams>,
        patch: [] as Array<RouteParams>,
        delete: [] as Array<RouteParams>,
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
      assert.strictEqual(routeItems.get.length, 2);
      assert.strictEqual(routeItems.post.length, 1);
      assert.strictEqual(routeItems.patch.length, 1);
      assert.strictEqual(routeItems.delete.length, 1);
      assert.strictEqual(routeItems.get[0].url, '/assets');
      assert.deepStrictEqual(routeItems.get[0].handler, controller.index);
      assert.strictEqual(routeItems.get[1].url, '/assets/:id');
      assert.deepStrictEqual(routeItems.get[1].handler, controller.get);
      assert.strictEqual(routeItems.post[0].url, '/assets');
      assert.deepStrictEqual(routeItems.post[0].handler, controller.create);
      assert.strictEqual(routeItems.patch[0].url, '/assets/:id');
      assert.deepStrictEqual(routeItems.patch[0].handler, controller.update);
      assert.strictEqual(routeItems.delete[0].url, '/assets/:id');
      assert.deepStrictEqual(routeItems.delete[0].handler, controller.delete);
    });
  });
});
