import assert from "node:assert";
import { DBError, type Model, type ModelClass } from "objection";
import { afterAll, beforeAll, describe, it } from "vitest";
import type { Params, ServiceOptions } from "../../src/global.js";
import serviceGenerator, { modelAction } from "../../src/service";
import { unitTestDB } from "../helpers/knexConnections";
import Employee from "../helpers/unit_tests/models/Employee";
import { createSchema } from "../helpers/unit_tests/setupDatabase";
import { deleteDatabase } from "../helpers/unit_tests/teardownDatabase";

describe("service", () => {
	beforeAll(async () => {
		await createSchema();
	});

	afterAll(async () => {
		await unitTestDB.destroy();
		await deleteDatabase();
	});

	describe("serviceGenerator", () => {
		describe("default setup", () => {
			it("should return a service for a given model, with service actions available for a controller to use", () => {
				const service = serviceGenerator(Employee);
				assert(service.getAll);
				assert(service.create);
				assert(service.get);
				assert(service.update);
				assert(service.delete);
			});

			describe("service.getAll", () => {
				describe("when successful", () => {
					it("should return a success value of true, and a list of items in the data", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.getAll({});
						assert.strictEqual(success, true);
						assert.deepEqual(data, []);
						assert.strictEqual(error, undefined);
					});
				});

				describe("when not successful", () => {
					it("should return a success value of false, and the error value should be an error object", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.getAll({
							bad: true,
						});
						assert.strictEqual(success, false);
						assert.strictEqual(data, undefined);
						assert(error instanceof DBError);
					});
				});
			});

			describe("service.create", () => {
				describe("when successful", () => {
					it("should return a success value of true, and the data record", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.create({
							name: "John",
						});
						assert.strictEqual(success, true);
						assert.deepEqual(data, {
							id: 1,
							name: "John",
							manager_id: undefined,
							reports: undefined,
						});
						assert.strictEqual(error, undefined);
					});
				});

				describe("when not successful", () => {
					it("should return a success value of false, and the error value should be an error object", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.create({
							bad: true,
						});
						assert.strictEqual(success, false);
						assert.strictEqual(data, undefined);
						assert(error instanceof DBError);
					});
				});
			});

			describe("service.get", () => {
				describe("when successful", () => {
					it("should return a success value of true, and the data record", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.get({ id: 1 });
						assert.strictEqual(success, true);
						assert.deepEqual(data, {
							id: 1,
							name: "John",
							manager_id: null,
							reports: undefined,
						});
						assert.strictEqual(error, undefined);
					});
				});

				describe("when not successful", () => {
					it("should return a success value of false, and the error value should be an error object", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.get({ bad: true });
						assert.strictEqual(success, false);
						assert.strictEqual(data, undefined);
						assert(error instanceof DBError);
					});
				});
			});

			describe("service.update", () => {
				describe("when successful", () => {
					it("should return a success value of true, and the data record", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.update({
							id: 1,
							name: "Bob",
						});
						assert.strictEqual(success, true);
						assert.deepEqual(data, {
							id: 1,
							name: "Bob",
							manager_id: null,
							reports: undefined,
						});
						assert.strictEqual(error, undefined);
					});
				});

				describe("when not successful", () => {
					it("should return a success value of false, and the error value should be an error object", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.update({
							bad: true,
						});
						assert.strictEqual(success, false);
						assert.strictEqual(data, undefined);
						assert.deepStrictEqual(
							error,
							new Error("undefined was passed to findById"),
						);
					});
				});
			});

			describe("service.delete", () => {
				describe("when successful", () => {
					it("should return a success value of true, and the id of the deleted data record", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.delete({ id: 1 });
						assert.strictEqual(success, true);
						assert.strictEqual(data, 1);
						assert.strictEqual(error, undefined);
					});
				});

				describe("when not successful", () => {
					it("should return a success value of false, and the error value should be an error object", async () => {
						const service = serviceGenerator(Employee);
						const { success, data, error } = await service.delete({
							id: "bad",
						});
						assert.strictEqual(success, false);
						assert.strictEqual(data, undefined);
						assert.deepStrictEqual(
							error,
							new Error("Record with id bad not found"),
						);
					});
				});
			});
		});

		describe("with service options", () => {
			describe("when a customModelAction is provided", () => {
				it("should call the customModelAction with the action, model, and params", async () => {
					let called = false;
					const customModelAction: ServiceOptions["customModelAction"] = async (
						action: string,
						model: ModelClass<Model>,
						params: Params,
					) => {
						if (action === "getAll") {
							called = true;
							return model.query().where(params);
						}
						return null;
					};
					const service = serviceGenerator(Employee, {
						customModelAction,
					});
					const { success, data, error } = await service.getAll({});
					assert.strictEqual(success, true);
					assert.deepStrictEqual(data, []);
					assert.strictEqual(error, undefined);
					assert.strictEqual(called, true);
				});
			});

			describe('when the type is "relatedQuery"', () => {
				it("should call the relatedQuery method on the model", async () => {
					const service = serviceGenerator(Employee, {
						type: "relatedQuery",
						relatedQuery: "reports", // This is the relatedQuery to use for the resource e.g ['employee', 'report']
						primaryKey: "employee_id",
					});

					const gary = await Employee.query().insertGraph({
						name: "Gary",
						reports: [{ name: "Barry" }, { name: "Harry" }],
					});
					const { success, data, error } = await service.getAll({
						employee_id: gary.id,
					});
					assert.strictEqual(success, true);
					assert.deepEqual(data, gary.reports);
					assert.strictEqual(error, undefined);
				});
			});
		});

		describe("customActions option", () => {
			it("should register a service function for each custom action, keyed by its name", () => {
				const service = serviceGenerator(Employee, undefined, [
					{
						name: "rename",
						method: "post",
						path: "rename",
						scope: "collection",
					},
				]);
				assert.ok(service.rename);
			});

			it("should call customModelAction with the custom action's name", async () => {
				let called = false;
				const customModelAction: ServiceOptions["customModelAction"] = async (
					action: string,
					model: ModelClass<Model>,
					params: Params,
				) => {
					if (action === "rename") {
						called = true;
						return await model.query().where(params);
					}
					return null;
				};
				const service = serviceGenerator(Employee, { customModelAction }, [
					{
						name: "rename",
						method: "post",
						path: "rename",
						scope: "collection",
					},
				]);
				const { success, error } = await service.rename({});
				assert.strictEqual(success, true);
				assert.strictEqual(error, undefined);
				assert.strictEqual(called, true);
			});

			it("should fail with an error when a customModelAction is not provided for a custom action", async () => {
				const service = serviceGenerator(Employee, undefined, [
					{
						name: "rename",
						method: "post",
						path: "rename",
						scope: "collection",
					},
				]);
				const { success, error } = await service.rename({});
				assert.strictEqual(success, false);
				assert.deepStrictEqual(error, new Error("Unknown action: rename"));
			});

			it("should let a customModelAction delegate back to the exported modelAction for the standard CRUD actions", async () => {
				const customModelAction: ServiceOptions["customModelAction"] = async (
					action: string,
					model: ModelClass<Model>,
					params: Params,
				) => {
					if (action === "rename") {
						return { renamed: true };
					}
					return await modelAction(action, model, params);
				};
				const service = serviceGenerator(Employee, { customModelAction }, [
					{
						name: "rename",
						method: "post",
						path: "rename",
						scope: "collection",
					},
				]);
				const created = await service.create({ name: "Delegate" });
				assert.strictEqual(created.success, true);
				const renamed = await service.rename({});
				assert.deepStrictEqual(renamed.data, { renamed: true });
			});
		});
	});
});
