import { Model } from "objection";
import RecoveryCode from "./RecoveryCode.js";
import { auth } from "../lib/auth.js";

// TODO: call Model.knex(<your knex connection>) somewhere in your app's
// setup before this model is used. Your users table needs hashed_password,
// failed_login_attempts (integer, default 0) and
// failed_login_window_started_at (nullable timestamp) columns - the latter
// two back the login rate limiting configured in lib/auth.ts.
class User extends Model {
	id!: number;
	username!: string;
	email!: string;
	password?: string;
	hashed_password!: string;
	failed_login_attempts!: number;
	failed_login_window_started_at?: string | null;
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
		this.hashed_password = await auth.hashPassword(this.password as string);
		// password has no backing column - without this, Objection tries to
		// insert it anyway and the query fails against a real database.
		this.$omitFromDatabaseJson("password");
	}

	async updatePassword(password: string) {
		await this.$query().patch({
			hashed_password: await auth.hashPassword(password),
		});
	}

	// Used by @anephenix/fastify-auth's shared verifyPassword() to perform a
	// timing-safe password check and login rate limiting itself.
	static async findByIdentifier(identifier: string) {
		return await User.query()
			.where("username", identifier)
			.orWhere("email", identifier)
			.first();
	}
}

export default User;
