import assert from "node:assert";
import { describe, it } from "vitest";
import {
	generateRoute,
	generateRoutePart,
	resourceRoutes,
} from "../../src/route";

describe("route", () => {
	describe("#resourceRoutes", () => {
		it("should return an array of RESTful routes linked to a controller", () => {
			const controller = {
				index: () => {},
				get: () => {},
				create: () => {},
				update: () => {},
				delete: () => {},
			};
			const resourceList = ["user", "post"];
			const routes = resourceRoutes(resourceList, controller);
			assert.deepStrictEqual(routes, [
				{
					method: "get",
					url: "/users/:user_id/posts",
					handler: controller.index,
					action: "index",
				},
				{
					method: "post",
					url: "/users/:user_id/posts",
					handler: controller.create,
					action: "create",
				},
				{
					method: "get",
					url: "/users/:user_id/posts/:id",
					handler: controller.get,
					action: "get",
				},
				{
					method: "patch",
					url: "/users/:user_id/posts/:id",
					handler: controller.update,
					action: "update",
				},
				{
					method: "delete",
					url: "/users/:user_id/posts/:id",
					handler: controller.delete,
					action: "delete",
				},
			]);
		});

		describe("when passed a resource as a string", () => {
			it("should return an array of RESTful routes linked to a controller", () => {
				const controller = {
					index: () => {},
					get: () => {},
					create: () => {},
					update: () => {},
					delete: () => {},
				};
				const resourceList = "user";
				const routes = resourceRoutes(resourceList, controller);
				assert.deepStrictEqual(routes, [
					{
						method: "get",
						url: "/users",
						handler: controller.index,
						action: "index",
					},
					{
						method: "post",
						url: "/users",
						handler: controller.create,
						action: "create",
					},
					{
						method: "get",
						url: "/users/:id",
						handler: controller.get,
						action: "get",
					},
					{
						method: "patch",
						url: "/users/:id",
						handler: controller.update,
						action: "update",
					},
					{
						method: "delete",
						url: "/users/:id",
						handler: controller.delete,
						action: "delete",
					},
				]);
			});
		});
	});

	describe("#generateRoute", () => {
		describe("when finalType is collection", () => {
			it("should return the collection url with the resources in the list", () => {
				const resourceList = ["application", "environment"];
				const finalType = "collection";
				const result = generateRoute(resourceList, finalType);
				assert.strictEqual(
					result,
					"/applications/:application_id/environments",
				);
			});
		});

		describe("when finalType is member", () => {
			it("should return the member url with the resources in the list", () => {
				const resourceList = ["application", "environment"];
				const finalType = "member";
				const result = generateRoute(resourceList, finalType);
				assert.strictEqual(
					result,
					"/applications/:application_id/environments/:id",
				);
			});
		});
	});

	describe("customActions option", () => {
		const controller = {
			index: () => {},
			get: () => {},
			create: () => {},
			update: () => {},
			delete: () => {},
			rename: () => {},
			archive: () => {},
		};

		describe("when a custom action has collection scope", () => {
			it("should append the route after the collection url", () => {
				const resourceList = "person";
				const customActions = [
					{
						name: "rename",
						method: "post" as const,
						path: "rename",
						scope: "collection" as const,
					},
				];
				const routes = resourceRoutes(resourceList, controller, customActions);
				assert.strictEqual(routes.length, 6);
				assert.deepStrictEqual(routes[5], {
					method: "post",
					url: "/people/rename",
					handler: controller.rename,
					action: "rename",
				});
			});
		});

		describe("when a custom action has member scope", () => {
			it("should append the route after the member url", () => {
				const resourceList = "person";
				const customActions = [
					{
						name: "archive",
						method: "post" as const,
						path: "archive",
						scope: "member" as const,
					},
				];
				const routes = resourceRoutes(resourceList, controller, customActions);
				assert.strictEqual(routes.length, 6);
				assert.deepStrictEqual(routes[5], {
					method: "post",
					url: "/people/:id/archive",
					handler: controller.archive,
					action: "archive",
				});
			});
		});

		describe("when the resource is nested", () => {
			it("should append the custom route after the fully nested collection/member url", () => {
				const resourceList = ["person", "possession"];
				const customActions = [
					{
						name: "rename",
						method: "post" as const,
						path: "rename",
						scope: "collection" as const,
					},
					{
						name: "archive",
						method: "post" as const,
						path: "archive",
						scope: "member" as const,
					},
				];
				const routes = resourceRoutes(resourceList, controller, customActions);
				assert.deepStrictEqual(routes[5], {
					method: "post",
					url: "/people/:person_id/possessions/rename",
					handler: controller.rename,
					action: "rename",
				});
				assert.deepStrictEqual(routes[6], {
					method: "post",
					url: "/people/:person_id/possessions/:id/archive",
					handler: controller.archive,
					action: "archive",
				});
			});
		});

		describe("when no customActions are given", () => {
			it("should only return the 5 standard CRUD routes", () => {
				const resourceList = "person";
				const routes = resourceRoutes(resourceList, controller);
				assert.strictEqual(routes.length, 5);
			});
		});
	});

	describe("#generateRoutePart", () => {
		describe("when passed a collection type", () => {
			it("should return the plural form of the resource name as a url route", () => {
				const resource = "application";
				const type = "collection";
				const result = generateRoutePart(resource, type);
				assert.strictEqual(result, "/applications");
			});
		});

		describe("when passed a member type", () => {
			describe("and when last is true", () => {
				it("should return the url with the id parameter as id", () => {
					const resource = "application";
					const type = "member";
					const last = true;
					const result = generateRoutePart(resource, type, last);
					assert.strictEqual(result, "/applications/:id");
				});
			});

			describe("and when last is false", () => {
				it("should return the url with the id parameter as a snake-cased resource plus _id", () => {
					const resource = "application";
					const type = "member";
					const last = false;
					const result = generateRoutePart(resource, type, last);
					assert.strictEqual(result, "/applications/:application_id");
				});
			});
		});
	});
});
