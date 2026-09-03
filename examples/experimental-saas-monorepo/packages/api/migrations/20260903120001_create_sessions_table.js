export async function up(knex) {
	await knex.schema.createTable("sessions", (table) => {
		table.increments("id").primary();
		table.integer("user_id").notNullable().references("users.id");
		table.string("access_token").notNullable().unique();
		table.string("refresh_token").notNullable().unique();
		table.string("access_token_expires_at").notNullable();
		table.string("refresh_token_expires_at").notNullable();
	});
}

export async function down(knex) {
	await knex.schema.dropTable("sessions");
}
