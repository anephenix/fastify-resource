import { Model } from "objection";
import { unitTestDB } from "../../knexConnections";

Model.knex(unitTestDB);

// Person model
class Employee extends Model {
	id!: number;
	name!: string;
	manager_id?: number;
	reports?: Employee[];

	static get tableName() {
		return "employees";
	}

	static get relationMappings() {
		return {
			reports: {
				relation: Model.HasManyRelation,
				modelClass: Employee,
				join: {
					from: "employees.id",
					to: "employees.manager_id",
				},
			},
		};
	}
}

export default Employee;
