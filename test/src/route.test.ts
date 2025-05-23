import {
  resourceRoutes,
  generateRoutePart,
  generateRoute,
} from '../../src/route';
import assert from 'node:assert';

describe('route', () => {
  describe('#resourceRoutes', () => {
    it('should return an array of RESTful routes linked to a controller', () => {
      const controller = {
        index: () => {},
        get: () => {},
        create: () => {},
        update: () => {},
        delete: () => {},
      };
      const resourceList = ['user', 'post'];
      const routes = resourceRoutes(resourceList, controller);
      assert.deepStrictEqual(routes, [
        {
          method: 'get',
          url: '/users/:user_id/posts',
          handler: controller.index,
        },
        {
          method: 'post',
          url: '/users/:user_id/posts',
          handler: controller.create,
        },
        {
          method: 'get',
          url: '/users/:user_id/posts/:id',
          handler: controller.get,
        },
        {
          method: 'patch',
          url: '/users/:user_id/posts/:id',
          handler: controller.update,
        },
        {
          method: 'delete',
          url: '/users/:user_id/posts/:id',
          handler: controller.delete,
        },
      ]);
    });

    describe('when passed a resource as a string', () => {
      it('should return an array of RESTful routes linked to a controller', () => {
        const controller = {
          index: () => {},
          get: () => {},
          create: () => {},
          update: () => {},
          delete: () => {},
        };
        const resourceList = 'user';
        const routes = resourceRoutes(resourceList, controller);
        assert.deepStrictEqual(routes, [
          { method: 'get', url: '/users', handler: controller.index },
          { method: 'post', url: '/users', handler: controller.create },
          { method: 'get', url: '/users/:id', handler: controller.get },
          { method: 'patch', url: '/users/:id', handler: controller.update },
          { method: 'delete', url: '/users/:id', handler: controller.delete },
        ]);
      });
    });
  });

  describe('#generateRoute', () => {
    describe('when finalType is collection', () => {
      it('should return the collection url with the resources in the list', () => {
        const resourceList = ['application', 'environment'];
        const finalType = 'collection';
        const result = generateRoute(resourceList, finalType);
        assert.strictEqual(
          result,
          '/applications/:application_id/environments'
        );
      });
    });

    describe('when finalType is member', () => {
      it('should return the member url with the resources in the list', () => {
        const resourceList = ['application', 'environment'];
        const finalType = 'member';
        const result = generateRoute(resourceList, finalType);
        assert.strictEqual(
          result,
          '/applications/:application_id/environments/:id'
        );
      });
    });
  });

  describe('#generateRoutePart', () => {
    describe('when passed a collection type', () => {
      it('should return the plural form of the resource name as a url route', () => {
        const resource = 'application';
        const type = 'collection';
        const result = generateRoutePart(resource, type);
        assert.strictEqual(result, '/applications');
      });
    });

    describe('when passed a member type', () => {
      describe('and when last is true', () => {
        it('should return the url with the id parameter as id', () => {
          const resource = 'application';
          const type = 'member';
          const last = true;
          const result = generateRoutePart(resource, type, last);
          assert.strictEqual(result, '/applications/:id');
        });
      });

      describe('and when last is false', () => {
        it('should return the url with the id parameter as a snake-cased resource plus _id', () => {
          const resource = 'application';
          const type = 'member';
          const last = false;
          const result = generateRoutePart(resource, type, last);
          assert.strictEqual(result, '/applications/:application_id');
        });
      });
    });
  });
});
