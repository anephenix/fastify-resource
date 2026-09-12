export async function up(knex) {
	await knex.schema.alterTable("users", (table) => {
		table.renameColumn("password", "hashed_password");
		table.integer("failed_login_attempts").notNullable().defaultTo(0);
		table.timestamp("failed_login_window_started_at").nullable();
	});
}

export async function down(knex) {
	await knex.schema.alterTable("users", (table) => {
		table.dropColumn("failed_login_attempts");
		table.dropColumn("failed_login_window_started_at");
		table.renameColumn("hashed_password", "password");
	});
}
