// Dependencies
import assert from "node:assert";
import { afterAll, beforeAll, describe, it } from "vitest";
import { appDB } from "../helpers/knexConnections";
import app from "../helpers/test_app/index";
import Person from "../helpers/test_app/models/Person";
import type Possession from "../helpers/test_app/models/Possession";
import seedData from "../helpers/test_app/seedData";
import {
	createSchema,
	insertSampleData,
} from "../helpers/test_app/setupDatabase";
import { deleteDatabase } from "../helpers/test_app/teardownDatabase";

// Configuration

const port = 3000;
const baseUrl = `http://localhost:${port}`;
const log = false; // Set to true to enable logging

describe("Integration tests", () => {
	beforeAll(async () => {
		await createSchema();
		await insertSampleData(seedData);
		await app.listen({ port }, (err, address) => {
			if (err) {
				app.log.error(err);
				process.exit(1);
			}
			if (log) {
				console.log(`Server listening at ${address}`);
			}
		});
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
		await appDB.destroy();
		await deleteDatabase();
	});

	describe("GET /people", () => {
		it("should return a list of people", async () => {
			const response = await fetch(`${baseUrl}/people`);
			const data = await response.json();
			assert.strictEqual(response.status, 200);
			assert.strictEqual(response.headers.get("x-prehandler"), "true");
			assert.strictEqual(data.length, 3);
			assert.strictEqual(data[0].firstName, seedData.firstName);
			assert.strictEqual(data[1].firstName, seedData.children[0].firstName);
			assert.strictEqual(data[2].firstName, seedData.children[1].firstName);
		});
	});

	describe("GET /people/:id", () => {
		it("should return a person by ID", async () => {
			const response = await fetch(`${baseUrl}/people/1`);
			const data = await response.json();
			assert.strictEqual(response.status, 200);
			assert.strictEqual(response.headers.get("x-prehandler"), "true");
			assert.strictEqual(data.firstName, seedData.firstName);
		});
	});

	describe("POST /people", () => {
		it("should create a new person", async () => {
			const newPerson = { firstName: "John" };
			const response = await fetch(`${baseUrl}/people`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newPerson),
			});
			const data = await response.json();
			assert.strictEqual(response.status, 201);
			assert.strictEqual(response.headers.get("x-prehandler"), "true");
			assert.strictEqual(data.firstName, newPerson.firstName);
			const person = await Person.query().findById(data.id);
			if (!person) {
				throw new Error("Person not found in database");
			}
			assert.strictEqual(person.firstName, newPerson.firstName);
		});
	});

	describe("PATCH /people/:id", () => {
		it("should update a person by ID", async () => {
			const updatedPerson = { firstName: "Sly" };
			const response = await fetch(`${baseUrl}/people/1`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updatedPerson),
			});
			const data = await response.json();
			assert.strictEqual(response.status, 200);
			assert.strictEqual(response.headers.get("x-prehandler"), "true");
			assert.strictEqual(data.firstName, updatedPerson.firstName);
			const person = await Person.query().findById(1);
			if (!person) {
				throw new Error("Person not found in database");
			}
			assert.strictEqual(person.firstName, updatedPerson.firstName);
		});
	});

	describe("DELETE /people/:id", () => {
		it("should delete a person by ID", async () => {
			const response = await fetch(`${baseUrl}/people/4`, {
				method: "DELETE",
			});
			assert.strictEqual(response.status, 200);
			assert.strictEqual(response.headers.get("x-prehandler"), "true");
			const person = await Person.query().findById(4);
			assert.strictEqual(person, undefined);
		});
	});

	describe("customActions option", () => {
		describe("POST /people/rename", () => {
			it("should trigger the custom action against the list of ids given in the request body", async () => {
				const createOne = await fetch(`${baseUrl}/people`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ firstName: "Temp1" }),
				});
				const createTwo = await fetch(`${baseUrl}/people`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ firstName: "Temp2" }),
				});
				const personOne = await createOne.json();
				const personTwo = await createTwo.json();

				const response = await fetch(`${baseUrl}/people/rename`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						ids: [personOne.id, personTwo.id],
						firstName: "Renamed",
					}),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.strictEqual(response.headers.get("x-prehandler"), "true");
				assert.strictEqual(data.length, 2);
				for (const person of data) {
					assert.strictEqual(person.firstName, "Renamed");
				}

				const reloaded = await Person.query().findById(personOne.id);
				assert.strictEqual(reloaded?.firstName, "Renamed");
			});
		});
	});

	describe("nested resources", () => {
		describe("GET /people/:person_id/possessions", () => {
			it("should return a list of possessions for a person", async () => {
				const response = await fetch(`${baseUrl}/people/1/possessions`);
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.strictEqual(data.length, 1);
				assert.strictEqual(data[0].name, seedData.possessions[0].name);
			});
		});

		describe("GET /people/:person_id/possessions/:id", () => {
			it("should return a possession by ID for a person", async () => {
				const response = await fetch(`${baseUrl}/people/1/possessions/1`);
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.strictEqual(data.name, seedData.possessions[0].name);
			});
		});

		describe("POST /people/:person_id/possessions", () => {
			it("should create a new possession for a person", async () => {
				const newPossession = { name: "Stopwatch" };
				const response = await fetch(`${baseUrl}/people/1/possessions`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(newPossession),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 201);
				assert.strictEqual(data.name, newPossession.name);
				const possession = (await Person.relatedQuery("possessions")
					.for(1)
					.findById(data.id)) as Possession;
				if (!possession) {
					throw new Error("Possession not found in database");
				}
				assert.strictEqual(possession.name, newPossession.name);
			});
		});

		describe("PATCH /people/:person_id/possessions/:id", () => {
			it("should update a possession by ID for a person", async () => {
				const updatedPossession = { name: "Stopwatch on a chain" };
				const response = await fetch(`${baseUrl}/people/1/possessions/1`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedPossession),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.strictEqual(data.name, updatedPossession.name);
				const possession = (await Person.relatedQuery("possessions")
					.for(1)
					.findById(1)) as Possession;
				if (!possession) {
					throw new Error("Possession not found in database");
				}
				assert.strictEqual(possession.name, updatedPossession.name);
			});
		});

		describe("DELETE /people/:person_id/possessions/:id", () => {
			it("should delete a possession by ID for a person", async () => {
				const response = await fetch(`${baseUrl}/people/1/possessions/2`, {
					method: "DELETE",
				});
				assert.strictEqual(response.status, 200);
				const possession = (await Person.relatedQuery("possessions")
					.for(1)
					.findById(2)) as Possession;
				assert.strictEqual(possession, undefined);
			});
		});
	});

	describe("headerParams option", () => {
		describe("GET /widgets", () => {
			it("should merge the configured header into the params sent to the service", async () => {
				const response = await fetch(`${baseUrl}/widgets`, {
					headers: { "x-tenant-id": "acme" },
				});
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.deepStrictEqual(data, { tenantId: "acme" });
			});
		});

		describe("POST /widgets", () => {
			it("should not let a body value override the header-derived param", async () => {
				const response = await fetch(`${baseUrl}/widgets`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-tenant-id": "acme",
					},
					body: JSON.stringify({ tenantId: "spoofed", name: "Stopwatch" }),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 201);
				assert.deepStrictEqual(data, { tenantId: "acme", name: "Stopwatch" });
			});
		});
	});

	describe("schema option", () => {
		describe("POST /gadgets", () => {
			it("should reject a request whose body fails the create schema", async () => {
				const response = await fetch(`${baseUrl}/gadgets`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
				assert.strictEqual(response.status, 400);
			});

			it("should accept a request whose body satisfies the create schema", async () => {
				const newGadget = { name: "Grapple hook" };
				const response = await fetch(`${baseUrl}/gadgets`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(newGadget),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 201);
				assert.strictEqual(data.name, newGadget.name);
			});
		});

		describe("GET /gadgets/:id", () => {
			it("should serialize the response using the response schema, dropping unlisted fields", async () => {
				const newGadget = { name: "Utility belt" };
				const createResponse = await fetch(`${baseUrl}/gadgets`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(newGadget),
				});
				const created = await createResponse.json();

				const response = await fetch(`${baseUrl}/gadgets/${created.id}`);
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.deepStrictEqual(data, { id: created.id, name: newGadget.name });
				assert.ok(!("person_id" in data));
			});
		});
	});

	describe("paramsTransform option", () => {
		describe("GET /gizmos", () => {
			it("should send the params produced by paramsTransform to the service", async () => {
				const response = await fetch(`${baseUrl}/gizmos`);
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.deepStrictEqual(data, { action: "index" });
			});
		});

		describe("POST /gizmos", () => {
			it("should merge the transform's added params alongside the request body", async () => {
				const response = await fetch(`${baseUrl}/gizmos`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Sprocket" }),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 201);
				assert.deepStrictEqual(data, { name: "Sprocket", action: "create" });
			});
		});
	});

	describe("Nested Self-Referential Resources", () => {
		describe("GET /people/:person_id/children", () => {
			it("should return a list of children for a person", async () => {
				const response = await fetch(`${baseUrl}/people/1/children`);
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.strictEqual(data.length, 2);
				assert.strictEqual(data[0].firstName, seedData.children[0].firstName);
				assert.strictEqual(data[1].firstName, seedData.children[1].firstName);
			});
		});

		describe("GET /people/:person_id/children/:id", () => {
			it("should return a child by ID for a person", async () => {
				const response = await fetch(`${baseUrl}/people/1/children/2`);
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.strictEqual(data.firstName, seedData.children[0].firstName);
			});
		});

		describe("POST /people/:person_id/children", () => {
			it("should create a new child for a person", async () => {
				const newChild = { firstName: "Daniel" };
				const response = await fetch(`${baseUrl}/people/1/children`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(newChild),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 201);
				assert.strictEqual(data.firstName, newChild.firstName);
				const child = (await Person.relatedQuery("children")
					.for(1)
					.findById(data.id)) as Person;
				if (!child) {
					throw new Error("Child not found in database");
				}
				assert.strictEqual(child.firstName, newChild.firstName);
			});
		});

		describe("PATCH /people/:person_id/children/:id", () => {
			it("should update a child by ID for a person", async () => {
				const updatedChild = { firstName: "Biff" };
				const response = await fetch(`${baseUrl}/people/1/children/2`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedChild),
				});
				const data = await response.json();
				assert.strictEqual(response.status, 200);
				assert.strictEqual(data.firstName, updatedChild.firstName);
				const child = (await Person.relatedQuery("children")
					.for(1)
					.findById(2)) as Person;
				if (!child) {
					throw new Error("Child not found in database");
				}
				assert.strictEqual(child.firstName, updatedChild.firstName);
			});
		});

		describe("DELETE /people/:person_id/children/:id", () => {
			it("should delete a child by ID for a person", async () => {
				const response = await fetch(`${baseUrl}/people/1/children/3`, {
					method: "DELETE",
				});
				assert.strictEqual(response.status, 200);
				const child = await Person.relatedQuery("children").for(1).findById(3);
				assert.strictEqual(child, undefined);
			});
		});
	});
});
