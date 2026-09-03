import "./db.js";
import fastifyCookie from "@fastify/cookie";
import fastifyResource from "@anephenix/fastify-resource";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { createAuthenticateSession } from "@anephenix/fastify-auth/middleware/authenticate";
import { registerAuthRoutes } from "./routes/auth.js";
import Session from "./models/Session.js";
import Project from "./models/Project.js";
import { scopedProjectAction } from "./lib/scopedProjectAction.js";
import * as outbox from "./lib/outbox.js";

const app = Fastify();

app.register(fastifyCookie);
registerAuthRoutes(app);

// ── Project resource (fastify-resource dogfood) ───────────────────────────

const authenticateSession = createAuthenticateSession({ Session });

async function attachUserIdHeader(request: FastifyRequest) {
	if (request.user) {
		request.headers["x-user-id"] = String(request.user.id);
	}
}

app.register(fastifyResource, {
	model: Project,
	resourceList: "project",
	preHandler: [authenticateSession, attachUserIdHeader],
	headerParams: { "x-user-id": "user_id" },
	serviceOptions: { customModelAction: scopedProjectAction },
	// x-user-id is a header, so it arrives as a string - normalize it back
	// to a number so it matches the type SQLite returns it as on reads.
	paramsTransform: async (params) =>
		params.user_id ? { ...params, user_id: Number(params.user_id) } : params,
});

// ── Test-only outbox (see src/lib/outbox.ts) ──────────────────────────────

if (process.env.NODE_ENV === "test") {
	app.get(
		"/__test__/outbox",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { to, kind } = request.query as {
				to?: string;
				kind?: "magic-link" | "reset-password";
			};
			if (!to || !kind) {
				return reply.status(400).send({ error: "to and kind are required" });
			}
			const entry = outbox.latestFor(to, kind);
			if (!entry) return reply.status(404).send({ error: "Not found" });
			return reply.send(entry);
		},
	);
}

const port = Number(process.env.PORT) || 3000;
app.listen({ port }, (err) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});

export default app;
