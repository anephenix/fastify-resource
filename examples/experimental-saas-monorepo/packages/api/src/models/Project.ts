import { Model } from "objection";

class Project extends Model {
	id!: number;
	user_id!: number;
	name!: string;
	description?: string | null;
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "projects";
	}

	$beforeInsert() {
		const now = new Date().toISOString();
		this.created_at = now;
		this.updated_at = now;
	}

	$beforeUpdate() {
		this.updated_at = new Date().toISOString();
	}
}

export default Project;
