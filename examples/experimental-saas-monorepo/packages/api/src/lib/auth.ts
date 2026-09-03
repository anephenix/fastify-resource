import { Auth } from "@anephenix/auth";
import { buildTotpCrypto } from "@anephenix/fastify-auth/core";

// TODO: tune password validation rules, token expiry, etc. for your app -
// see https://github.com/anephenix/auth for all Auth options.
export const auth = new Auth({
	passwordValidationRules: { minLength: 8 },
});

// TOTP secrets are encrypted at rest - generate a key with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// and set it as TOTP_SECRET_ENCRYPTION_KEY in your environment.
export const totpCrypto = buildTotpCrypto({
	serviceName: "Experimental SaaS",
	secretEncryptionKey: process.env.TOTP_SECRET_ENCRYPTION_KEY as string,
});
