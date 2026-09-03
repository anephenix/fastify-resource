import crypto from "node:crypto";
import { Model } from "objection";
import User from "./User.js";

class Session extends Model {
	id!: number;
	user_id!: number;
	access_token!: string;
	refresh_token!: string;
	access_token_expires_at!: string;
	refresh_token_expires_at!: string;
	user_agent?: string;
	ip_address?: string;

	static get tableName() {
		return "sessions";
	}

	static get relationMappings() {
		return {
			user: {
				relation: Model.BelongsToOneRelation,
				modelClass: User,
				join: {
					from: "sessions.user_id",
					to: "users.id",
				},
			},
		};
	}

	accessTokenHasExpired(): boolean {
		return new Date(this.access_token_expires_at).getTime() < Date.now();
	}

	refreshTokenHasExpired(): boolean {
		return new Date(this.refresh_token_expires_at).getTime() < Date.now();
	}

	static generateTokens() {
		const generateToken = () => crypto.randomBytes(32).toString("hex");
		const now = Date.now();
		return {
			access_token: generateToken(),
			access_token_expires_at: new Date(now + 3_600_000).toISOString(),
			refresh_token: generateToken(),
			refresh_token_expires_at: new Date(now + 86_400_000).toISOString(),
		};
	}
}

export default Session;
