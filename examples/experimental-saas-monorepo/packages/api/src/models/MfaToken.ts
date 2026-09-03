import { Model } from "objection";

class MfaToken extends Model {
	id!: number;
	user_id!: number;
	token!: string;
	expires_at!: string;
	used_at?: string;
	number_of_attempts!: number;

	static get tableName() {
		return "mfa_tokens";
	}
}

export default MfaToken;
