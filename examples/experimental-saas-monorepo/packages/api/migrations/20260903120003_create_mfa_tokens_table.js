export async function up(knex) {
	await knex.schema.createTable("mfa_tokens", (table) => {
		table.increments("id").primary();
		table.integer("user_id").notNullable().references("users.id");
		table.string("token").notNullable().unique();
		table.string("expires_at").notNullable();
		table.string("used_at").nullable();
		table.integer("number_of_attempts").notNullable().defaultTo(0);
	});
}

export async function down(knex) {
	await knex.schema.dropTable("mfa_tokens");
}
