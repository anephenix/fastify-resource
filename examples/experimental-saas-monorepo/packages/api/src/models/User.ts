import { Model } from "objection";
import RecoveryCode from "./RecoveryCode.js";
import { auth } from "../lib/auth.js";

// TODO: call Model.knex(<your knex connection>) somewhere in your app's
// setup before this model is used.
class User extends Model {
	id!: number;
	username!: string;
	email!: string;
	password!: string;
	mfa_totp_secret!: string | null;

	static get tableName() {
		return "users";
	}

	static get relationMappings() {
		return {
			recoveryCodes: {
				relation: Model.HasManyRelation,
				modelClass: RecoveryCode,
				join: {
					from: "users.id",
					to: "recovery_codes.user_id",
				},
			},
		};
	}

	async $beforeInsert() {
		this.password = await auth.hashPassword(this.password);
	}

	async updatePassword(password: string) {
		await this.$query().patch({ password: await auth.hashPassword(password) });
	}

	static async authenticate({
		identifier,
		password,
	}: {
		identifier: string;
		password: string;
	}) {
		const user = await User.query()
			.where("username", identifier)
			.orWhere("email", identifier)
			.first();
		if (!user) return null;

		const isValid = await auth.verifyPassword(password, user.password);
		if (!isValid) return null;

		return Object.assign(user, { isUsingMFA: !!user.mfa_totp_secret });
	}
}

export default User;
