import assert from "node:assert";
import type { FastifyRequest } from "fastify";
import { beforeEach, describe, it } from "vitest";
import controller from "../../src/controller";
import type {
	GenerateServiceParams,
	Params,
	Reply,
	Request,
	Service,
	ServiceResponse,
} from "../../src/global";

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

describe("controller", () => {
	it("should return a controller for a given service, with RESTful controller actions", () => {
		const service = generateService({});
		const c = controller(service);
		assert(c.index);
		assert(c.create);
		assert(c.get);
		assert(c.update);
		assert(c.delete);
	});

	describe("controller.index", () => {
		let request: Request;
		let reply: Reply;

		beforeEach(() => {
			request = { params: {} } as FastifyRequest;
			reply = {
				statusCode: 200,
				code: (code: number) => {
					reply.statusCode = code;
				},
			};
		});

		describe("when parameters are good", () => {
			it("should return a 200 response with the data", async () => {
				const data = [{ id: "42" }];
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
				assert.deepStrictEqual(result, [{ id: "42" }]);
			});
		});

		describe("when parameters are not good", () => {
			describe("when the resource is not found", () => {
				it("should return a 404 response", async () => {
					const getAll = async (params: Params) => {
						assert.deepStrictEqual(params, {});
						return Promise.resolve({
							success: false,
							error: new Error("Not found"),
						});
					};
					const service = generateService({ getAll });
					const c = controller(service);
					const result = await c.index(request, reply);
					assert.strictEqual(reply.statusCode, 404);
					assert.strictEqual(result, "Not found");
				});
			});
		});
	});

	describe("controller.create", () => {
		let request: Request;
		let reply: Reply;

		beforeEach(() => {
			request = {
				params: { id: "42" },
				body: { name: "bob" },
			} as FastifyRequest;
			reply = {
				statusCode: 200,
				code: (code: number) => {
					reply.statusCode = code;
				},
			};
		});

		describe("when the parameters are good", () => {
			it("should return a 201 response with the data", async () => {
				const create = async (params: Params): Promise<ServiceResponse> => {
					return Promise.resolve({
						success: true,
						data: { id: params.id, name: "bob" },
					});
				};
				const service = generateService({ create });
				const c = controller(service);
				const result = await c.create(request, reply);
				assert.strictEqual(reply.statusCode, 201);
				assert.deepStrictEqual(result, { id: "42", name: "bob" });
			});
		});

		describe("when parameters are not good", () => {
			describe("when the resource is not found", () => {
				it("should return a 404 response", async () => {
					const create = async (params: Params): Promise<ServiceResponse> => {
						assert.deepStrictEqual(params, { id: "42", name: "bob" });
						return Promise.resolve({
							success: false,
							error: new Error("Not found"),
						});
					};
					const service = generateService({ create });
					const c = controller(service);
					const result = await c.create(request, reply);
					assert.strictEqual(reply.statusCode, 404);
					assert.strictEqual(result, "Not found");
				});
			});
		});
	});

	describe("controller.get", () => {
		let request: Request;
		let reply: Reply;

		beforeEach(() => {
			request = { params: { id: "42" } } as FastifyRequest;
			reply = {
				statusCode: 200,
				code: (code: number) => {
					reply.statusCode = code;
				},
			};
		});

		describe("when parameters are good", () => {
			it("should return a 200 response with the data", async () => {
				const get = async (params: Params) => {
					assert.deepStrictEqual(params, { id: "42" });
					return {
						success: true,
						data: { id: "42", name: "bob" },
					};
				};
				const service = generateService({ get });
				const c = controller(service);
				const result = await c.get(request, reply);
				assert.strictEqual(reply.statusCode, 200);
				assert.deepStrictEqual(result, { id: "42", name: "bob" });
			});
		});

		describe("when parameters are not good", () => {
			describe("when the resource is not found", () => {
				it("should return a 404 response", async () => {
					const get = async (params: Params) => {
						assert.deepStrictEqual(params, { id: "42" });
						return {
							success: false,
							error: new Error("Not found"),
						};
					};
					const service = generateService({ get });
					const c = controller(service);
					const result = await c.get(request, reply);
					assert.strictEqual(reply.statusCode, 404);
					assert.strictEqual(result, "Not found");
				});
			});
		});
	});

	describe("controller.update", () => {
		let request: Request;
		let reply: Reply;

		beforeEach(() => {
			request = {
				params: { id: "42" },
				body: { name: "john" },
			} as FastifyRequest;
			reply = {
				statusCode: 200,
				code: (code: number) => {
					reply.statusCode = code;
				},
			};
		});

		describe("when parameters are good", () => {
			it("should return a 200 response with the data", async () => {
				const update = async (params: Params) => {
					assert.deepStrictEqual(params, { id: "42", name: "john" });
					return {
						success: true,
						data: { id: params.id, name: "john" },
					};
				};
				const service = generateService({ update });
				const c = controller(service);
				const result = await c.update(request, reply);
				assert.strictEqual(reply.statusCode, 200);
				assert.deepStrictEqual(result, { id: "42", name: "john" });
			});
		});

		describe("when parameters are not good", () => {
			describe("when the resource is not found", () => {
				it("should return a 404 response", async () => {
					const update = async (params: Params) => {
						assert.deepStrictEqual(params, { id: "42", name: "john" });
						return {
							success: false,
							error: new Error("Not found"),
						};
					};
					const service = generateService({ update });
					const c = controller(service);
					const result = await c.update(request, reply);
					assert.strictEqual(reply.statusCode, 404);
					assert.strictEqual(result, "Not found");
				});
			});
		});
	});

	describe("controller.delete", () => {
		let request: Request;
		let reply: Reply;

		beforeEach(() => {
			request = { params: { id: "42" } } as FastifyRequest;
			reply = {
				statusCode: 200,
				code: (code: number) => {
					reply.statusCode = code;
				},
			};
		});

		describe("when parameters are good", () => {
			it("should return a 200 response with the data", async () => {
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
				assert.deepStrictEqual(result, { id: "42" });
			});
		});

		describe("when parameters are not good", () => {
			describe("when the resource is not found", () => {
				it("should return a 404 response", async () => {
					const del = async (params: Params) => {
						assert.deepStrictEqual(params, { id: "42" });
						return {
							success: false,
							error: new Error("Not found"),
						};
					};
					const service = generateService({ del });
					const c = controller(service);
					const result = await c.delete(request, reply);
					assert.strictEqual(reply.statusCode, 404);
					assert.strictEqual(result, "Not found");
				});
			});

			describe("when an error occurs in general", () => {
				it("should return a 400 response", async () => {
					const del = async (params: Params) => {
						assert.deepStrictEqual(params, { id: "42" });
						return {
							success: false,
							error: new Error("Cannot delete this resource"),
						};
					};
					const service = generateService({ del });
					const c = controller(service);
					const result = await c.delete(request, reply);
					assert.strictEqual(reply.statusCode, 400);
					assert.strictEqual(result, "Cannot delete this resource");
				});
			});
		});
	});

	describe("customActions option", () => {
		let reply: Reply;

		beforeEach(() => {
			reply = {
				statusCode: 200,
				code: (code: number) => {
					reply.statusCode = code;
				},
			};
		});

		it("should generate a controller action that calls the service function registered under the custom action's name", async () => {
			const request = {
				params: {},
				body: { ids: [1, 2], name: "Renamed" },
			} as FastifyRequest;
			const service = generateService({});
			const rename = async (params: Params) => {
				assert.deepStrictEqual(params, { ids: [1, 2], name: "Renamed" });
				return { success: true, data: { renamed: 2 } };
			};
			(service as Service).rename = rename;
			const c = controller(service, undefined, [
				{ name: "rename", method: "post", path: "rename", scope: "collection" },
			]);
			assert.ok(c.rename);
			const result = await c.rename(request, reply);
			assert.strictEqual(reply.statusCode, 200);
			assert.deepStrictEqual(result, { renamed: 2 });
		});

		it("should not merge the request body into params for a custom action whose method is get", async () => {
			const request = {
				params: { id: "42" },
				body: { ignored: true },
			} as FastifyRequest;
			const service = generateService({});
			const summary = async (params: Params) => {
				assert.deepStrictEqual(params, { id: "42" });
				return { success: true, data: { total: 3 } };
			};
			(service as Service).summary = summary;
			const c = controller(service, undefined, [
				{ name: "summary", method: "get", path: "summary", scope: "member" },
			]);
			const result = await c.summary(request, reply);
			assert.strictEqual(reply.statusCode, 200);
			assert.deepStrictEqual(result, { total: 3 });
		});

		it("should merge the request body into params for a custom action whose method is post, even without an explicit includeBody", async () => {
			const request = {
				params: { id: "42" },
				body: { note: "hello" },
			} as FastifyRequest;
			const service = generateService({});
			const archive = async (params: Params) => {
				assert.deepStrictEqual(params, { id: "42", note: "hello" });
				return { success: true, data: { id: "42", archived: true } };
			};
			(service as Service).archive = archive;
			const c = controller(service, undefined, [
				{ name: "archive", method: "post", path: "archive", scope: "member" },
			]);
			const result = await c.archive(request, reply);
			assert.strictEqual(reply.statusCode, 200);
			assert.deepStrictEqual(result, { id: "42", archived: true });
		});

		it("should respect an explicit includeBody: false override even for a post method", async () => {
			const request = {
				params: { id: "42" },
				body: { ignored: true },
			} as FastifyRequest;
			const service = generateService({});
			const ping = async (params: Params) => {
				assert.deepStrictEqual(params, { id: "42" });
				return { success: true, data: "pong" };
			};
			(service as Service).ping = ping;
			const c = controller(service, undefined, [
				{
					name: "ping",
					method: "post",
					path: "ping",
					scope: "member",
					includeBody: false,
				},
			]);
			const result = await c.ping(request, reply);
			assert.strictEqual(reply.statusCode, 200);
			assert.strictEqual(result, "pong");
		});

		it("should set the reply status code to a configured successCode", async () => {
			const request = { params: {}, body: {} } as FastifyRequest;
			const service = generateService({});
			const bulkCreate = async () => {
				return { success: true, data: [] };
			};
			(service as Service).bulkCreate = bulkCreate;
			const c = controller(service, undefined, [
				{
					name: "bulkCreate",
					method: "post",
					path: "bulk",
					scope: "collection",
					successCode: 201,
				},
			]);
			await c.bulkCreate(request, reply);
			assert.strictEqual(reply.statusCode, 201);
		});

		it("should return a 404 response when the custom action's service function reports Not found", async () => {
			const request = { params: { id: "99" } } as FastifyRequest;
			const service = generateService({});
			const archive = async () => {
				return { success: false, error: new Error("Not found") };
			};
			(service as Service).archive = archive;
			const c = controller(service, undefined, [
				{ name: "archive", method: "post", path: "archive", scope: "member" },
			]);
			const result = await c.archive(request, reply);
			assert.strictEqual(reply.statusCode, 404);
			assert.strictEqual(result, "Not found");
		});

		it("should merge headerParams into the params sent to the custom action's service function", async () => {
			const request = {
				params: {},
				body: {},
				headers: { "x-tenant-id": "acme" },
			} as unknown as FastifyRequest;
			const service = generateService({});
			const rename = async (params: Params) => {
				assert.deepStrictEqual(params, { tenantId: "acme" });
				return { success: true, data: {} };
			};
			(service as Service).rename = rename;
			const c = controller(service, { "x-tenant-id": "tenantId" }, [
				{ name: "rename", method: "post", path: "rename", scope: "collection" },
			]);
			await c.rename(request, reply);
			assert.strictEqual(reply.statusCode, 200);
		});
	});

	describe("headerParams option", () => {
		let reply: Reply;

		beforeEach(() => {
			reply = {
				statusCode: 200,
				code: (code: number) => {
					reply.statusCode = code;
				},
			};
		});

		it("should merge configured headers into the params sent to the service", async () => {
			const request = {
				params: {},
				headers: { "x-tenant-id": "acme" },
			} as unknown as FastifyRequest;
			const getAll = async (params: Params) => {
				assert.deepStrictEqual(params, { tenantId: "acme" });
				return { success: true, data: [] };
			};
			const service = generateService({ getAll });
			const c = controller(service, { "x-tenant-id": "tenantId" });
			await c.index(request, reply);
			assert.strictEqual(reply.statusCode, 200);
		});

		it("should look up headers case-insensitively", async () => {
			const request = {
				params: {},
				headers: { "x-tenant-id": "acme" },
			} as unknown as FastifyRequest;
			const getAll = async (params: Params) => {
				assert.deepStrictEqual(params, { tenantId: "acme" });
				return { success: true, data: [] };
			};
			const service = generateService({ getAll });
			const c = controller(service, { "X-Tenant-Id": "tenantId" });
			await c.index(request, reply);
			assert.strictEqual(reply.statusCode, 200);
		});

		it("should not add a param for a header that is absent from the request", async () => {
			const request = {
				params: {},
				headers: {},
			} as unknown as FastifyRequest;
			const getAll = async (params: Params) => {
				assert.deepStrictEqual(params, {});
				return { success: true, data: [] };
			};
			const service = generateService({ getAll });
			const c = controller(service, { "x-tenant-id": "tenantId" });
			await c.index(request, reply);
			assert.strictEqual(reply.statusCode, 200);
		});

		it("should not let a client-supplied body value override a header-derived param", async () => {
			const request = {
				params: {},
				body: { tenantId: "spoofed" },
				headers: { "x-tenant-id": "acme" },
			} as unknown as FastifyRequest;
			const create = async (params: Params) => {
				assert.deepStrictEqual(params, { tenantId: "acme" });
				return { success: true, data: {} };
			};
			const service = generateService({ create });
			const c = controller(service, { "x-tenant-id": "tenantId" });
			await c.create(request, reply);
			assert.strictEqual(reply.statusCode, 201);
		});
	});
});
