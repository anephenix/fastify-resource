import Knex from "knex";
import { Model } from "objection";

const knex = Knex({
	client: "better-sqlite3",
	useNullAsDefault: true,
	connection: {
		filename: process.env.DB_FILE || "./data/dev.sqlite3",
	},
});

Model.knex(knex);

export default knex;
