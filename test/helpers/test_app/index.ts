import type { FastifyReply, FastifyRequest } from "fastify";
import fastify from "fastify";
import type { Model, ModelClass } from "objection";
import type { Params } from "../../../src/global";
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

// Used to prove that headerParams values reach the service/model layer, by
// simply echoing back the params it was called with instead of querying the db
const echoParams = async (
	_action: string,
	_model: ModelClass<Model>,
	params: Params,
) => {
	return params;
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

app.register(fastifyResource, {
	model: Possession,
	resourceList: "widget",
	headerParams: { "x-tenant-id": "tenantId" },
	serviceOptions: {
		customModelAction: echoParams,
	},
});

// Declare a route
app.get("/", (request, reply) => {
	request.log.info("Hello world");
	reply.send({ hello: "world" });
});

export default app;
