export async function up(knex) {
	await knex.schema.createTable("users", (table) => {
		table.increments("id").primary();
		table.string("username").notNullable().unique();
		table.string("email").notNullable().unique();
		table.string("password").notNullable();
		table.string("mfa_totp_secret").nullable();
	});
}

export async function down(knex) {
	await knex.schema.dropTable("users");
}
