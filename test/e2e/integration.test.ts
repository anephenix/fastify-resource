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
			const person = await Person.query().findById(4);
			assert.strictEqual(person, undefined);
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

	// NOTE - disabled for now until support for nested self-referential resources is implemented
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
