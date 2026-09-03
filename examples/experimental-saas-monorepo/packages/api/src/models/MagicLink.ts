import crypto from "node:crypto";
import { Model } from "objection";
import { auth } from "../lib/auth.js";

class MagicLink extends Model {
	id!: number;
	user_id!: number;
	token!: string;
	hashed_code!: string;
	expires_at!: string;
	used_at?: string;

	static get tableName() {
		return "magic_links";
	}

	static async generateTokens() {
		const token = crypto.randomBytes(32).toString("hex");
		const code = crypto.randomInt(100_000, 999_999).toString();
		const hashedCode = await auth.hashPassword(code);
		const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
		return { token, tokenExpiresAt, code, hashedCode };
	}

	static async verifyTokenAndCode(token: string, code: string) {
		const record = await MagicLink.query().where({ token }).first();
		if (!record) throw new Error("Invalid token");
		if (record.used_at) throw new Error("Token has already been used");
		if (new Date(record.expires_at) < new Date()) {
			throw new Error("Token has expired");
		}

		const isValid = await auth.verifyPassword(code, record.hashed_code);
		if (!isValid) throw new Error("Invalid code");

		await record.$query().patch({ used_at: new Date().toISOString() });
		return { userId: record.user_id };
	}
}

export default MagicLink;
