export async function up(knex) {
	await knex.schema.createTable("magic_links", (table) => {
		table.increments("id").primary();
		table.integer("user_id").notNullable().references("users.id");
		table.string("token").notNullable().unique();
		table.string("hashed_code").notNullable();
		table.string("expires_at").notNullable();
		table.string("used_at").nullable();
	});
}

export async function down(knex) {
	await knex.schema.dropTable("magic_links");
}
