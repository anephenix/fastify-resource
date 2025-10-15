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

/*
	Question - how does model know that the last item in the 
	resourceList is a relatedQuery? - Let's assume it is the last 
	item in the resourceList for now, and then we'll focus on 
	support 3/4/5 levels deep later
*/
const enableNestedSelfReferentialExample = true;
if (enableNestedSelfReferentialExample) {
	app.register(fastifyResource, {
		model: Person,
		resourceList: ["person", "child"],
		serviceOptions: {
			type: "relatedQuery",
			relatedQuery: "children",
			primaryKey: "person_id",
		},
	});
}

// Declare a route
app.get("/", (request, reply) => {
	request.log.info("Hello world");
	reply.send({ hello: "world" });
});

export default app;
