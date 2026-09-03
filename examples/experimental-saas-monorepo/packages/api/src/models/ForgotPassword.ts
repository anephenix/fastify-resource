import { Model } from "objection";

class ForgotPassword extends Model {
	id!: number;
	user_id!: number;
	selector!: string;
	token_hash!: string;
	expires_at!: Date;
	used_at?: Date | null;

	static get tableName() {
		return "forgot_passwords";
	}

	async markAsUsed() {
		await this.$query().patch({ used_at: new Date() });
	}
}

export default ForgotPassword;
