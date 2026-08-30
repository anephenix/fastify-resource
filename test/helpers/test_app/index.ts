import type { FastifyReply, FastifyRequest } from "fastify";
import fastify from "fastify";
import type { Model, ModelClass } from "objection";
import type { Params } from "../../../src/global";
import fastifyResource, { modelAction } from "../../../src/index";
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

/*
  Demonstrates a custom action that operates on a list of resources (a bulk
  "rename" triggered via POST /people/rename), composed alongside the
  standard CRUD actions by delegating to the exported `modelAction` for
  anything that isn't the custom action itself.
*/
const renamePeople = async (
	action: string,
	model: ModelClass<Model>,
	params: Params,
) => {
	if (action === "rename") {
		const { ids, firstName } = params as { ids: number[]; firstName: string };
		await model.query().whereIn("id", ids).patch({ firstName });
		return await model.query().whereIn("id", ids);
	}
	return await modelAction(action, model, params);
};

app.register(fastifyResource, {
	model: Person,
	resourceList: "person",
	preHandler: addPreHandlerHeader,
	serviceOptions: {
		customModelAction: renamePeople,
	},
	customActions: [
		{ name: "rename", method: "post", path: "rename", scope: "collection" },
	],
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

app.register(fastifyResource, {
	model: Possession,
	resourceList: "gadget",
	schema: {
		create: {
			body: {
				type: "object",
				required: ["name"],
				properties: { name: { type: "string" } },
			},
		},
		get: {
			response: {
				200: {
					type: "object",
					properties: {
						id: { type: "number" },
						name: { type: "string" },
					},
				},
			},
		},
	},
});

// Declare a route
app.get("/", (request, reply) => {
	request.log.info("Hello world");
	reply.send({ hello: "world" });
});

export default app;
