import Database from "better-sqlite3";
import { authenticator } from "otplib";
import { buildTotpCrypto } from "@anephenix/fastify-auth/core";
import { DB_FILE, TOTP_SECRET_ENCRYPTION_KEY } from "./env.ts";

const totpCrypto = buildTotpCrypto({
	serviceName: "Experimental SaaS",
	secretEncryptionKey: TOTP_SECRET_ENCRYPTION_KEY,
});

/*
  Reads the encrypted TOTP secret straight from the SQLite file and
  generates a live code with it - the same thing a user's authenticator
  app would produce. This only works because the secret is encrypted (
  reversible) at rest, unlike magic-link codes and reset tokens, which are
  one-way hashed - see support/outbox.ts for those.
*/
export function currentTotpCode(username: string): string {
	const db = new Database(DB_FILE, { readonly: true });
	try {
		const row = db
			.prepare("select mfa_totp_secret from users where username = ?")
			.get(username) as { mfa_totp_secret: string | null } | undefined;
		if (!row?.mfa_totp_secret) {
			throw new Error(`No mfa_totp_secret set for user "${username}"`);
		}
		const secret = totpCrypto.decrypt(row.mfa_totp_secret);
		return authenticator.generate(secret);
	} finally {
		db.close();
	}
}
