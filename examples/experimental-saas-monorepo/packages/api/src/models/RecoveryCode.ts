import crypto from "node:crypto";
import { Model } from "objection";
import { auth } from "../lib/auth.js";

const NUMBER_OF_RECOVERY_CODES = 10;

class RecoveryCode extends Model {
	id!: number;
	user_id!: number;
	// Plaintext code, only used transiently when generating - never persisted
	// (see $beforeInsert below, which hashes it into hashed_code instead).
	code?: string;
	hashed_code!: string;
	used_at?: string;

	static get tableName() {
		return "recovery_codes";
	}

	async $beforeInsert() {
		if (this.code) {
			this.hashed_code = await auth.hashPassword(this.code);
			// code has no backing column - without this, Objection tries to
			// insert it anyway and the query fails against a real database.
			this.$omitFromDatabaseJson("code");
		}
	}

	static generateCodes(): Promise<string[]> {
		const codes = Array.from({ length: NUMBER_OF_RECOVERY_CODES }, () =>
			crypto.randomBytes(5).toString("hex").toUpperCase(),
		);
		return Promise.resolve(codes);
	}

	static async checkForRecoveryCodeAndConsume(
		userId: number,
		code: string,
	): Promise<boolean> {
		const unused = await RecoveryCode.query().where({
			user_id: userId,
			used_at: null,
		});
		for (const record of unused) {
			if (await auth.verifyPassword(code, record.hashed_code)) {
				await record.$query().patch({ used_at: new Date().toISOString() });
				return true;
			}
		}
		return false;
	}
}

export default RecoveryCode;
