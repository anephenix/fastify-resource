/*
  Knex CLI config, used by `npm run migrate` / `npm run migrate:make`.
  The app's own runtime Knex instance (src/db.ts) is configured separately
  since it needs to read DB_FILE from the environment at startup, not just
  at migration time.
*/
export default {
	client: "better-sqlite3",
	useNullAsDefault: true,
	connection: {
		filename: process.env.DB_FILE || "./data/dev.sqlite3",
	},
	migrations: {
		directory: "./migrations",
	},
};
