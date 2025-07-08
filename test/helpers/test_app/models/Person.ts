import { Model } from "objection";
import { appDB } from "../../knexConnections";
import Possession from "./Possession";

Model.knex(appDB);

// Person model
class Person extends Model {
	firstName: unknown;

	static get tableName() {
		return "persons";
	}

	static get relationMappings() {
		return {
			children: {
				relation: Model.HasManyRelation,
				modelClass: Person,
				join: {
					from: "persons.id",
					to: "persons.parentId",
				},
			},
			possessions: {
				relation: Model.HasManyRelation,
				modelClass: Possession,
				join: {
					from: "persons.id",
					to: "possessions.person_id",
				},
			},
		};
	}
}

export default Person;
