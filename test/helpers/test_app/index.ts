import type { FastifyReply, FastifyRequest } from "fastify";
import fastify from "fastify";
import fastifyResource from "../../../src/index";
import Person from "./models/Person";
import Possession from "./models/Possession";

const app = fastify({ logger: false });

const addPreHandlerHeader = async (
	_request: FastifyRequest,
	reply: FastifyReply,
) => {
	reply.header("x-prehandler", "true");
};

app.register(fastifyResource, {
	model: Person,
	resourceList: "person",
	preHandler: addPreHandlerHeader,
});

app.register(fastifyResource, {
	model: Possession,
	resourceList: "possession",
});

app.register(fastifyResource, {
	model: Possession,
	resourceList: ["person", "possession"],
});

app.register(fastifyResource, {
	model: Person,
	resourceList: ["person", "child"],
	serviceOptions: {
		type: "relatedQuery",
		relatedQuery: "children",
		primaryKey: "person_id",
	},
});

// Declare a route
app.get("/", (request, reply) => {
	request.log.info("Hello world");
	reply.send({ hello: "world" });
});

export default app;
