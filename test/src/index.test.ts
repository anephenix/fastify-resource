import { strict as assert } from 'node:assert';
import type { ControllerAction, RouteParams } from '../../src/global';
import {
  serviceGenerator,
  controllerGenerator,
  resourceRoutes,
  resource,
  attach,
} from '../../src/index';
import Person from '../helpers/test_app/models/Person';

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
      const resourceList = ['person'];
      const { service, controller, routes } = resource(Person, resourceList);
      assert.ok(service);
      assert.ok(controller);
      assert.ok(routes);
      assert.deepStrictEqual(routes[0], {
        method: 'get',
        url: '/people',
        handler: controller.index,
      });
      assert.deepStrictEqual(routes[1], {
        method: 'post',
        url: '/people',
        handler: controller.create,
      });
      assert.deepStrictEqual(routes[2], {
        method: 'get',
        url: '/people/:id',
        handler: controller.get,
      });
      assert.deepStrictEqual(routes[3], {
        method: 'patch',
        url: '/people/:id',
        handler: controller.update,
      });
      assert.deepStrictEqual(routes[4], {
        method: 'delete',
        url: '/people/:id',
        handler: controller.delete,
      });
    });
  });

  describe('#attach', () => {
    it('should attach the routes to the fastify app', () => {
      const resourceList = ['people'];
      const { routes, controller } = resource(Person, resourceList);
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
      assert.strictEqual(routeItems.get[0].url, '/people');
      assert.deepStrictEqual(routeItems.get[0].handler, controller.index);
      assert.strictEqual(routeItems.get[1].url, '/people/:id');
      assert.deepStrictEqual(routeItems.get[1].handler, controller.get);
      assert.strictEqual(routeItems.post[0].url, '/people');
      assert.deepStrictEqual(routeItems.post[0].handler, controller.create);
      assert.strictEqual(routeItems.patch[0].url, '/people/:id');
      assert.deepStrictEqual(routeItems.patch[0].handler, controller.update);
      assert.strictEqual(routeItems.delete[0].url, '/people/:id');
      assert.deepStrictEqual(routeItems.delete[0].handler, controller.delete);
    });
  });

  describe('fastifyResource plugin', () => {
    it('should register routes as a Fastify plugin', async () => {
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
      const { default: fastifyResource } = await import('../../src/index');
      // @ts-expect-error: mock fastify instance for plugin test
      await fastifyResource(fastify, {
        model: Person,
        resourceList: ['people'],
      });
      assert.strictEqual(routeItems.get.length, 2);
      assert.strictEqual(routeItems.post.length, 1);
      assert.strictEqual(routeItems.patch.length, 1);
      assert.strictEqual(routeItems.delete.length, 1);
    });
  });
});
