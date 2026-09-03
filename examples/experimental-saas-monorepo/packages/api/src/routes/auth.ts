import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import crypto from "node:crypto";
import qrcode from "qrcode";
import { authenticator } from "otplib";
import { createAuthenticateSession } from "@anephenix/fastify-auth/middleware/authenticate";
import {
	createDeleteAllSessionsHandler,
	createDeleteSessionHandler,
	createListSessionsHandler,
	createLogoutHandler,
	createProfileHandler,
	createRefreshHandler,
	createSession,
	issueMfaChallenge,
	respondWithNewSession,
	validateResetToken,
	verifyPassword,
	verifyRecoveryCode,
	verifyTotpCode,
} from "@anephenix/fastify-auth/core";
import User from "../models/User.js";
import Session from "../models/Session.js";
import MagicLink from "../models/MagicLink.js";
import MfaToken from "../models/MfaToken.js";
import RecoveryCode from "../models/RecoveryCode.js";
import ForgotPassword from "../models/ForgotPassword.js";
import { auth, totpCrypto } from "../lib/auth.js";
import * as outbox from "../lib/outbox.js";
import { emailQueue } from "../lib/emailQueue.js";

// This file needs otplib and qrcode installed:
//   npm i otplib qrcode

export function registerAuthRoutes(app: FastifyInstance) {
	const secureCookie = process.env.NODE_ENV === "production";
	const authenticateSession = createAuthenticateSession({ Session });

	// ── POST /signup ───────────────────────────────────────────────────────

	app.post("/signup", async (request: FastifyRequest, reply: FastifyReply) => {
		const { username, email, password } = request.body as {
			username: string;
			email: string;
			password: string;
		};

		try {
			const user = await User.query().insert({ username, email, password });
			reply
				.status(201)
				.send({ id: user.id, username: user.username, email: user.email });
		} catch (error) {
			reply.status(400).send({ error: (error as Error).message });
		}
	});

	// ── POST /login ────────────────────────────────────────────────────────

	app.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
		const { identifier, password } = request.body as {
			identifier: string;
			password: string;
		};

		try {
			const user = await verifyPassword(User, identifier, password);
			if (!user) {
				return reply.status(401).send({ error: "Invalid credentials" });
			}

			if (user.isUsingMFA) {
				const challenge = await issueMfaChallenge(MfaToken, auth, user.id);
				return reply.status(201).send(challenge);
			}

			const tokens = await createSession(Session, user.id);
			return respondWithNewSession({
				request,
				reply,
				auth,
				secureCookie,
				tokens,
			});
		} catch (error) {
			reply.status(401).send({ error: (error as Error).message });
		}
	});

	// ── POST /magic-links ─────────────────────────────────────────────────

	app.post(
		"/magic-links",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const { email } = request.body as { email?: string };
				if (!email) {
					throw new Error("No email provided - please provide an email");
				}

				const user = await User.query().where({ email }).first();
				if (!user) throw new Error("User not found for email");

				const { token, tokenExpiresAt, code, hashedCode } =
					await MagicLink.generateTokens();

				await MagicLink.query().insert({
					user_id: user.id,
					token,
					hashed_code: hashedCode,
					expires_at: tokenExpiresAt.toISOString(),
				});

				await emailQueue.add({
					name: "magic-link",
					data: {
						to: email,
						subject: "Your magic sign-in link",
						body: `Enter this token and code on the login page to sign in:\n\nToken: ${token}\nCode: ${code}`,
					},
				});
				outbox.record({ to: email, kind: "magic-link", token, code });

				reply.code(201).send({ message: "Magic link created" });
			} catch (err) {
				reply.status(400).send({ error: (err as Error).message });
			}
		},
	);

	// ── POST /magic-links/verify ──────────────────────────────────────────

	app.post(
		"/magic-links/verify",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const { token, code } = request.body as {
					token?: string;
					code?: string;
				};
				if (!token || !code) throw new Error("Token and code are required");

				const { userId } = await MagicLink.verifyTokenAndCode(token, code);

				// A magic link is still only a first factor - if this user has
				// MFA enrolled, gate them the same way password login does.
				const user = await User.query().findById(userId);
				if (!user) throw new Error("User not found");

				if (user.mfa_totp_secret) {
					const challenge = await issueMfaChallenge(MfaToken, auth, user.id);
					return reply.code(201).send(challenge);
				}

				const tokens = await createSession(Session, userId);
				return respondWithNewSession({
					request,
					reply,
					auth,
					secureCookie,
					tokens,
				});
			} catch (err) {
				reply.status(400).send({ error: (err as Error).message });
			}
		},
	);

	// ── POST /login/mfa ───────────────────────────────────────────────────

	app.post(
		"/login/mfa",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { token, code, recovery_code } = request.body as {
				token: string;
				code?: string;
				recovery_code?: string;
			};

			if (!token || (!code && !recovery_code)) {
				return reply
					.status(400)
					.send({ error: "Token and code/recovery_code are required" });
			}

			try {
				const mfaToken = await MfaToken.query().where({ token }).first();
				if (!mfaToken) {
					return reply.status(400).send({ error: "MFA token not found" });
				}
				if (mfaToken.number_of_attempts >= auth.maxMfaAttempts) {
					return reply.status(400).send({ error: "Too many attempts" });
				}
				if (mfaToken.used_at) {
					return reply
						.status(400)
						.send({ error: "MFA token has already been used" });
				}

				const user = await User.query().findById(mfaToken.user_id);
				if (!user) {
					return reply.status(400).send({ error: "User not found" });
				}
				if (!user.mfa_totp_secret) {
					return reply
						.status(400)
						.send({ error: "User does not have MFA enabled" });
				}

				if (recovery_code) {
					const isValid = await verifyRecoveryCode(
						RecoveryCode,
						user.id,
						recovery_code,
					);
					if (!isValid) {
						return reply.status(400).send({ error: "Invalid recovery code" });
					}
				} else {
					const isValid = verifyTotpCode(
						totpCrypto,
						user.mfa_totp_secret,
						code as string,
					);
					if (!isValid) {
						await mfaToken.$query().increment("number_of_attempts", 1);
						return reply.status(400).send({ error: "Invalid code" });
					}
				}

				const tokens = await createSession(Session, mfaToken.user_id);
				await mfaToken.$query().patch({ used_at: new Date().toISOString() });

				return respondWithNewSession({
					request,
					reply,
					auth,
					secureCookie,
					tokens,
				});
			} catch (error) {
				reply.status(401).send({ error: (error as Error).message });
			}
		},
	);

	// ── POST /auth/mfa/recovery-codes (protected) ─────────────────────────

	app.post(
		"/auth/mfa/recovery-codes",
		{ preHandler: [authenticateSession] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const user = request.user;
			if (!user) return reply.status(401).send({ error: "Unauthorized" });

			const existing = await user
				.$relatedQuery("recoveryCodes")
				.where("used_at", null);
			if (existing.length > 0) {
				return reply
					.status(400)
					.send({ error: "Recovery codes have already been generated" });
			}

			const codes = await RecoveryCode.generateCodes();
			for (const code of codes) {
				await RecoveryCode.query().insert({ user_id: user.id, code });
			}

			return reply.status(201).send({ codes });
		},
	);

	// ── POST /auth/mfa/setup (protected) ───────────────────────────────────

	app.post(
		"/auth/mfa/setup",
		{ preHandler: [authenticateSession] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const user = request.user;
			if (!user) return reply.status(401).send({ error: "Unauthorized" });

			try {
				const secret = authenticator.generateSecret();
				const otpauth = authenticator.keyuri(
					user.email,
					"Experimental SaaS",
					secret,
				);
				const encryptedSecret = totpCrypto.encrypt(secret);

				await user.$query().patch({ mfa_totp_secret: encryptedSecret });

				const qrCodeImageData = await qrcode.toDataURL(otpauth);
				return reply.status(200).send({ qrCodeImageData });
			} catch (error) {
				reply.status(500).send({ error: (error as Error).message });
			}
		},
	);

	// ── POST /auth/mfa/verify (protected) ──────────────────────────────────

	app.post(
		"/auth/mfa/verify",
		{ preHandler: [authenticateSession] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { token } = request.body as { token: string };
			const user = request.user;
			if (!user) return reply.status(401).send({ error: "Unauthorized" });

			const isValid = verifyTotpCode(totpCrypto, user.mfa_totp_secret, token);
			if (!isValid) {
				return reply.status(400).send({ error: "Invalid TOTP token" });
			}
			return reply
				.status(200)
				.send({ message: "TOTP token verified successfully" });
		},
	);

	// ── POST /auth/mfa/disable (protected) ─────────────────────────────────

	app.post(
		"/auth/mfa/disable",
		{ preHandler: [authenticateSession] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const user = request.user;
			const { password, code } = request.body as {
				password: string;
				code: string;
			};
			if (!user) return reply.status(401).send({ error: "Unauthorized" });

			try {
				const isPasswordValid = await User.authenticate({
					identifier: user.username,
					password,
				});
				if (!isPasswordValid) throw new Error("Invalid password");

				if (!verifyTotpCode(totpCrypto, user.mfa_totp_secret, code)) {
					throw new Error("Invalid MFA TOTP code");
				}

				await user.$query().patch({ mfa_totp_secret: null });
				await user.$relatedQuery("recoveryCodes").delete();

				return reply
					.status(200)
					.send({ message: "MFA TOTP disabled successfully" });
			} catch (error) {
				reply.status(400).send({ error: (error as Error).message });
			}
		},
	);

	// ── POST /auth/mfa/disable-with-recovery-code (protected) ─────────────

	app.post(
		"/auth/mfa/disable-with-recovery-code",
		{ preHandler: [authenticateSession] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const user = request.user;
			const { password, code } = request.body as {
				password: string;
				code: string;
			};
			if (!user) return reply.status(401).send({ error: "Unauthorized" });

			try {
				const isPasswordValid = await User.authenticate({
					identifier: user.username,
					password,
				});
				if (!isPasswordValid) throw new Error("Invalid password");

				const isRecoveryCodeValid = await verifyRecoveryCode(
					RecoveryCode,
					user.id,
					code,
				);
				if (!isRecoveryCodeValid) throw new Error("Invalid Recovery code");

				await user.$query().patch({ mfa_totp_secret: null });
				await user.$relatedQuery("recoveryCodes").delete();

				return reply
					.status(200)
					.send({ message: "MFA TOTP disabled successfully" });
			} catch (error) {
				reply.status(400).send({ error: (error as Error).message });
			}
		},
	);


	// ── POST /forgot-password ─────────────────────────────────────────────

	app.post(
		"/forgot-password",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { identifier } = request.body as { identifier?: string };

			if (identifier) {
				const isEmailAddress = identifier.includes("@");
				const user = await User.query()
					.where(isEmailAddress ? "email" : "username", identifier)
					.first();

				if (user) {
					const selector = crypto.randomBytes(16).toString("hex");
					const token = crypto.randomBytes(32).toString("hex");
					const token_hash = await auth.hashPassword(token);

					await ForgotPassword.query().insert({
						user_id: user.id,
						selector,
						token_hash,
						expires_at: new Date(Date.now() + 3_600_000),
					});

					await emailQueue.add({
						name: "reset-password",
						data: {
							to: user.email,
							subject: "Reset your password",
							body: `Reset your password here: http://localhost:5173/reset-password/${selector}?token=${token}`,
						},
					});
					outbox.record({
						to: user.email,
						kind: "reset-password",
						token: `${selector}:${token}`,
					});
				}
			}

			// Always return the same response to avoid leaking whether the
			// account exists.
			return reply.send({
				message:
					"If an account with that username/email exists, we've sent password reset instructions.",
			});
		},
	);

	// ── GET /reset-password/:selector ───────────────────────────────────────

	app.get(
		"/reset-password/:selector",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { selector } = request.params as { selector: string };
			const { token } = request.query as { token?: string };

			if (!token || !selector) {
				return reply
					.status(400)
					.send({ error: "Invalid reset password selector or token" });
			}

			const result = await validateResetToken({
				ForgotPassword,
				auth,
				selector,
				token,
			});
			if (!result.valid) {
				return reply.status(400).send({ error: result.error });
			}

			return reply.send({ message: "Password reset token is valid" });
		},
	);

	// ── POST /reset-password ─────────────────────────────────────────────────

	app.post(
		"/reset-password",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { selector, token, password, password_confirmation } =
				request.body as {
					selector: string;
					token: string;
					password: string;
					password_confirmation: string;
				};

			if (!password || !password_confirmation) {
				return reply.status(400).send({
					error: "Password and password confirmation are required",
				});
			}
			if (password !== password_confirmation) {
				return reply.status(400).send({
					error: "Password and password confirmation do not match",
				});
			}
			if (!auth.validatePassword(password)) {
				return reply
					.status(400)
					.send({ error: "Password does not meet validation rules" });
			}
			if (!token || !selector) {
				return reply
					.status(400)
					.send({ error: "Invalid reset password selector or token" });
			}

			const result = await validateResetToken({
				ForgotPassword,
				auth,
				selector,
				token,
			});
			if (!result.valid) {
				return reply.status(400).send({ error: result.error });
			}

			const user = await User.query().findById(result.record.user_id);
			if (!user) {
				return reply.status(400).send({
					error: "User not found for this password reset request",
				});
			}

			await user.updatePassword(password);
			await result.record.markAsUsed();

			return reply.send({ message: "Password reset successfully" });
		},
	);

	// ── Session management (protected) ────────────────────────────────────

	app.get(
		"/profile",
		{ preHandler: [authenticateSession] },
		createProfileHandler(),
	);
	app.post(
		"/logout",
		{ preHandler: [authenticateSession] },
		createLogoutHandler(Session),
	);
	app.post(
		"/auth/refresh",
		createRefreshHandler({ Session, auth, secureCookie }),
	);
	app.get(
		"/sessions",
		{ preHandler: [authenticateSession] },
		createListSessionsHandler(Session),
	);
	app.delete(
		"/sessions",
		{ preHandler: [authenticateSession] },
		createDeleteAllSessionsHandler(Session),
	);
	app.delete(
		"/sessions/:id",
		{ preHandler: [authenticateSession] },
		createDeleteSessionHandler(Session),
	);
}
