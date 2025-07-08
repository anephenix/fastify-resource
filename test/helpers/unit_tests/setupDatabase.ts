import { unitTestDB } from "../knexConnections";

/*
  Creates the database schema if it doesn't exist.
*/
async function createSchema() {
	if (await unitTestDB.schema.hasTable("employees")) {
		return;
	}

	await unitTestDB.schema.createTable("employees", (table) => {
		table.increments("id").primary();
		table.string("name");
	});
}

export { createSchema };
