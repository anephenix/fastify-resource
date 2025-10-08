import { appDB } from "../knexConnections";
import Person from "./models/Person";
import type { SeedData } from "./seedData";

/*
  Creates the database schema if it doesn't exist.
*/
async function createSchema() {
	if (await appDB.schema.hasTable("persons")) {
		return;
	}

	await appDB.schema.createTable("persons", (table) => {
		table.increments("id").primary();
		table.integer("parentId").references("persons.id");
		table.string("firstName");
	});

	if (await appDB.schema.hasTable("possessions")) {
		return;
	}

	await appDB.schema.createTable("possessions", (table) => {
		table.increments("id").primary();
		table.integer("person_id").references("persons.id");
		table.string("name");
	});
}

async function insertSampleData(data: SeedData) {
	await Person.query().insertGraph(data);
}

export { createSchema, insertSampleData };
