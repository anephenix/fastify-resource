export async function up(knex) {
	await knex.schema.createTable("forgot_passwords", (table) => {
		table.increments("id").primary();
		table.integer("user_id").notNullable().references("users.id");
		table.string("selector").notNullable().unique();
		table.string("token_hash").notNullable();
		table.datetime("expires_at").notNullable();
		table.datetime("used_at").nullable();
	});
}

export async function down(knex) {
	await knex.schema.dropTable("forgot_passwords");
}
