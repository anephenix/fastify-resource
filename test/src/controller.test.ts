import {
  Service,
  Params,
  Request,
  Reply,
  ServiceResponse,
  GenerateServiceParams,
} from '../../src/global';
import controller from '../../src/controller';
import assert from 'assert';
import { FastifyRequest } from 'fastify';

const func = async (params: Params): Promise<ServiceResponse> => {
  return {
    success: true,
    data: params.id,
  };
};

const generateService = ({
  getAll,
  get,
  create,
  update,
  del,
}: GenerateServiceParams) => {
  const service: Service = {
    getAll: getAll || func,
    get: get || func,
    create: create || func,
    update: update || func,
    delete: del || func,
  };
  return service;
};

describe('controller', () => {
  it('should return a controller for a given service, with RESTful controller actions', () => {
    const service = generateService({});
    const c = controller(service);
    assert(c.index);
    assert(c.create);
    assert(c.get);
    assert(c.update);
    assert(c.delete);
  });

  describe('controller.index', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: {} } as FastifyRequest;
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      it('should return a 200 response with the data', async () => {
        const data = [{ id: '42' }];
        const getAll = async (params: Params) => {
          assert.deepStrictEqual(params, {});
          return {
            success: true,
            data,
          };
        };
        const service = generateService({ getAll });
        const c = controller(service);
        const result = await c.index(request, reply);
        assert.strictEqual(reply.statusCode, 200);
        assert.deepStrictEqual(result, [{ id: '42' }]);
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        it('should return a 404 response', async () => {
          const getAll = async (params: Params) => {
            assert.deepStrictEqual(params, {});
            return Promise.resolve({
              success: false,
              error: new Error('Not found'),
            });
          };
          const service = generateService({ getAll });
          const c = controller(service);
          const result = await c.index(request, reply);
          assert.strictEqual(reply.statusCode, 404);
          assert.strictEqual(result, 'Not found');
        });
      });
    });
  });

  describe('controller.create', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' }, body: { name: 'bob' } } as FastifyRequest;
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when the parameters are good', () => {
      it('should return a 201 response with the data', async () => {
        const create = async (params: Params): Promise<ServiceResponse> => {
          return Promise.resolve({
            success: true,
            data: { id: params.id, name: 'bob' },
          });
        };
        const service = generateService({ create });
        const c = controller(service);
        const result = await c.create(request, reply);
        assert.strictEqual(reply.statusCode, 201);
        assert.deepStrictEqual(result, { id: '42', name: 'bob' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        it('should return a 404 response', async () => {
          const create = async (params: Params): Promise<ServiceResponse> => {
            assert.deepStrictEqual(params, { id: '42', name: 'bob' });
            return Promise.resolve({
              success: false,
              error: new Error('Not found'),
            });
          };
          const service = generateService({ create });
          const c = controller(service);
          const result = await c.create(request, reply);
          assert.strictEqual(reply.statusCode, 404);
          assert.strictEqual(result, 'Not found');
        });
      });
    });
  });

  describe('controller.get', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' } } as FastifyRequest;
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      it('should return a 200 response with the data', async () => {
        const get = async (params: Params) => {
          assert.deepStrictEqual(params, { id: '42' });
          return {
            success: true,
            data: { id: '42', name: 'bob' },
          };
        };
        const service = generateService({ get });
        const c = controller(service);
        const result = await c.get(request, reply);
        assert.strictEqual(reply.statusCode, 200);
        assert.deepStrictEqual(result, { id: '42', name: 'bob' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        it('should return a 404 response', async () => {
          const get = async (params: Params) => {
            assert.deepStrictEqual(params, { id: '42' });
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ get });
          const c = controller(service);
          const result = await c.get(request, reply);
          assert.strictEqual(reply.statusCode, 404);
          assert.strictEqual(result, 'Not found');
        });
      });
    });
  });

  describe('controller.update', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' }, body: { name: 'john' } } as FastifyRequest;
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      it('should return a 200 response with the data', async () => {
        const update = async (params: Params) => {
          assert.deepStrictEqual(params, { id: '42', name: 'john' });
          return {
            success: true,
            data: { id: params.id, name: 'john' },
          };
        };
        const service = generateService({ update });
        const c = controller(service);
        const result = await c.update(request, reply);
        assert.strictEqual(reply.statusCode, 200);
        assert.deepStrictEqual(result, { id: '42', name: 'john' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        it('should return a 404 response', async () => {
          const update = async (params: Params) => {
            assert.deepStrictEqual(params, { id: '42', name: 'john' });
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ update });
          const c = controller(service);
          const result = await c.update(request, reply);
          assert.strictEqual(reply.statusCode, 404);
          assert.strictEqual(result, 'Not found');
        });
      });
    });
  });

  describe('controller.delete', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' } } as FastifyRequest;
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      it('should return a 200 response with the data', async () => {
        const del = async (params: Params) => {
          return {
            success: true,
            data: { id: params.id },
          };
        };
        const service = generateService({ del });
        const c = controller(service);
        const result = await c.delete(request, reply);
        assert.strictEqual(reply.statusCode, 200);
        assert.deepStrictEqual(result, { id: '42' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        it('should return a 404 response', async () => {
          const del = async (params: Params) => {
            assert.deepStrictEqual(params, { id: '42' });
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ del });
          const c = controller(service);
          const result = await c.delete(request, reply);
          assert.strictEqual(reply.statusCode, 404);
          assert.strictEqual(result, 'Not found');
        });
      });

      describe('when an error occurs in general', () => {
        it('should return a 400 response', async () => {
          const del = async (params: Params) => {
            assert.deepStrictEqual(params, { id: '42' });
            return {
              success: false,
              error: new Error('Cannot delete this resource'),
            };
          };
          const service = generateService({ del });
          const c = controller(service);
          const result = await c.delete(request, reply);
          assert.strictEqual(reply.statusCode, 400);
          assert.strictEqual(result, 'Cannot delete this resource');
        });
      });
    });
  });
});
