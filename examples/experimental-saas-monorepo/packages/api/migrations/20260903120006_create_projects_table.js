export async function up(knex) {
	await knex.schema.createTable("projects", (table) => {
		table.increments("id").primary();
		table.integer("user_id").notNullable().references("users.id");
		table.string("name").notNullable();
		table.text("description").nullable();
		table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
		table.datetime("updated_at").notNullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex) {
	await knex.schema.dropTable("projects");
}
