import { Service, Params, Request, Reply } from '../../src/global';
import controller from '../../src/controller';

type GenerateServiceParams = {
  getAll?: (params: Params) => Promise<any>;
  get?: (params: Params) => Promise<any>;
  create?: (params: Params) => Promise<any>;
  update?: (params: Params) => Promise<any>;
  del?: (params: Params) => Promise<any>;
};

const func = async (params: Params) => {
  return params.id;
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
  test('should return a controller for a given service, with RESTful controller actions', () => {
    const service = generateService({});
    const c = controller(service);
    expect(c.index).toBeDefined();
    expect(c.create).toBeDefined();
    expect(c.get).toBeDefined();
    expect(c.update).toBeDefined();
    expect(c.delete).toBeDefined();
  });

  describe('controller.index', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: {} };
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      test('should return a 200 response with the data', async () => {
        const getAll = async (params: Params) => {
          expect(params).toEqual({});
          return {
            success: true,
            data: [{ id: '42' }],
          };
        };
        const service = generateService({ getAll });
        const c = controller(service);
        const result = await c.index(request, reply);
        expect(reply.statusCode).toBe(200);
        expect(result).toStrictEqual([{ id: '42' }]);
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        test('should return a 404 response', async () => {
          const getAll = async (params: Params) => {
            expect(params).toEqual({});
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ getAll });
          const c = controller(service);
          const result = await c.index(request, reply);
          expect(reply.statusCode).toBe(404);
          expect(result).toBe('Not found');
        });
      });
    });
  });

  describe('controller.create', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' }, body: { name: 'bob' } };
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      test('should return a 201 response with the data', async () => {
        const create = async (params: Params) => {
          return {
            success: true,
            data: { id: params.id, name: 'bob' },
          };
        };
        const service = generateService({ create });
        const c = controller(service);
        const result = await c.create(request, reply);
        expect(reply.statusCode).toBe(201);
        expect(result).toStrictEqual({ id: '42', name: 'bob' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        test('should return a 404 response', async () => {
          const create = async (params: Params) => {
            expect(params).toEqual({ id: '42', name: 'bob' });
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ create });
          const c = controller(service);
          const result = await c.create(request, reply);
          expect(reply.statusCode).toBe(404);
          expect(result).toBe('Not found');
        });
      });
    });
  });

  describe('controller.get', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' } };
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      test('should return a 200 response with the data', async () => {
        const get = async (params: Params) => {
          expect(params).toEqual({ id: '42' });
          return {
            success: true,
            data: { id: '42', name: 'bob' },
          };
        };
        const service = generateService({ get });
        const c = controller(service);
        const result = await c.get(request, reply);
        expect(reply.statusCode).toBe(200);
        expect(result).toStrictEqual({ id: '42', name: 'bob' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        test('should return a 404 response', async () => {
          const get = async (params: Params) => {
            expect(params).toEqual({ id: '42' });
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ get });
          const c = controller(service);
          const result = await c.get(request, reply);
          expect(reply.statusCode).toBe(404);
          expect(result).toBe('Not found');
        });
      });
    });
  });

  describe('controller.update', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' }, body: { name: 'john' } };
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      test('should return a 200 response with the data', async () => {
        const update = async (params: Params) => {
          expect(params).toEqual({ id: '42', name: 'john' });
          return {
            success: true,
            data: { id: params.id, name: 'john' },
          };
        };
        const service = generateService({ update });
        const c = controller(service);
        const result = await c.update(request, reply);
        expect(reply.statusCode).toBe(200);
        expect(result).toStrictEqual({ id: '42', name: 'john' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        test('should return a 404 response', async () => {
          const update = async (params: Params) => {
            expect(params).toEqual({ id: '42', name: 'john' });
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ update });
          const c = controller(service);
          const result = await c.update(request, reply);
          expect(reply.statusCode).toBe(404);
          expect(result).toBe('Not found');
        });
      });
    });
  });

  describe('controller.delete', () => {
    let request: Request, reply: Reply;

    beforeEach(() => {
      request = { params: { id: '42' } };
      reply = {
        statusCode: 200,
        code: (code: number) => {
          reply.statusCode = code;
        },
      };
    });

    describe('when parameters are good', () => {
      test('should return a 200 response with the data', async () => {
        const del = async (params: Params) => {
          return {
            success: true,
            data: { id: params.id },
          };
        };
        const service = generateService({ del });
        const c = controller(service);
        const result = await c.delete(request, reply);
        expect(reply.statusCode).toBe(200);
        expect(result).toStrictEqual({ id: '42' });
      });
    });

    describe('when parameters are not good', () => {
      describe('when the resource is not found', () => {
        test('should return a 404 response', async () => {
          const del = async (params: Params) => {
            expect(params).toEqual({ id: '42' });
            return {
              success: false,
              error: new Error('Not found'),
            };
          };
          const service = generateService({ del });
          const c = controller(service);
          const result = await c.delete(request, reply);
          expect(reply.statusCode).toBe(404);
          expect(result).toBe('Not found');
        });
      });

      describe('when an error occurs in general', () => {
        test('should return a 400 response', async () => {
          const del = async (params: Params) => {
            expect(params).toEqual({ id: '42' });
            return {
              success: false,
              error: new Error('Cannot delete this resource'),
            };
          };
          const service = generateService({ del });
          const c = controller(service);
          const result = await c.delete(request, reply);
          expect(reply.statusCode).toBe(400);
          expect(result).toBe('Cannot delete this resource');
        });
      });
    });
  });
});
