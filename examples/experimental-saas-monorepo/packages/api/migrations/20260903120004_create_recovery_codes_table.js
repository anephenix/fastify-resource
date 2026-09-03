export async function up(knex) {
	await knex.schema.createTable("recovery_codes", (table) => {
		table.increments("id").primary();
		table.integer("user_id").notNullable().references("users.id");
		table.string("hashed_code").notNullable();
		table.string("used_at").nullable();
	});
}

export async function down(knex) {
	await knex.schema.dropTable("recovery_codes");
}
