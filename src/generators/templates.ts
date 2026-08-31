// Dependencies
import type { ResourceNames } from "./names.js";

/*
  These templates deliberately do NOT depend on fastify-resource - they're
  the plain fastify + Objection.js boilerplate shown in the README's "why
  use fastify-resource?" section, split across model/service/controller/
  routes files. They're a starting point for people who want to eject a
  resource into fully custom code rather than use the generated plugin.
*/

export function modelTemplate({ className, tableName }: ResourceNames): string {
	return `import { Model } from "objection";

// TODO: Ensure Model.knex(<your knex connection>) is called somewhere in
// your app's setup before this model is used.
class ${className} extends Model {
	static get tableName() {
		return "${tableName}";
	}
}

export default ${className};
`;
}

export function serviceTemplate({ className }: ResourceNames): string {
	return `import ${className} from "../models/${className}.js";

const getAll = async () => {
	return await ${className}.query();
};

const create = async (params: Record<string, unknown>) => {
	return await ${className}.query().insert(params);
};

const get = async (id: string | number) => {
	return await ${className}.query().findById(id);
};

const update = async (id: string | number, params: Record<string, unknown>) => {
	return await ${className}.query().patchAndFetchById(id, params);
};

const del = async (id: string | number) => {
	await ${className}.query().deleteById(id);
	return id;
};

export default { getAll, create, get, update, delete: del };
`;
}

export function controllerTemplate({ fileBase }: ResourceNames): string {
	return `import type { FastifyReply, FastifyRequest } from "fastify";
import service from "../services/${fileBase}.js";

const index = async (_req: FastifyRequest, rep: FastifyReply) => {
	try {
		return await service.getAll();
	} catch (error) {
		rep.code(400);
		return (error as Error).message;
	}
};

const create = async (req: FastifyRequest, rep: FastifyReply) => {
	try {
		const record = await service.create(req.body as Record<string, unknown>);
		rep.code(201);
		return record;
	} catch (error) {
		rep.code(400);
		return (error as Error).message;
	}
};

const get = async (req: FastifyRequest, rep: FastifyReply) => {
	try {
		const { id } = req.params as { id: string };
		const record = await service.get(id);
		if (!record) {
			rep.code(404);
			return "Not found";
		}
		return record;
	} catch (error) {
		rep.code(400);
		return (error as Error).message;
	}
};

const update = async (req: FastifyRequest, rep: FastifyReply) => {
	try {
		const { id } = req.params as { id: string };
		const record = await service.update(
			id,
			req.body as Record<string, unknown>,
		);
		if (!record) {
			rep.code(404);
			return "Not found";
		}
		return record;
	} catch (error) {
		rep.code(400);
		return (error as Error).message;
	}
};

const del = async (req: FastifyRequest, rep: FastifyReply) => {
	try {
		const { id } = req.params as { id: string };
		return await service.delete(id);
	} catch (error) {
		rep.code(400);
		return (error as Error).message;
	}
};

export default { index, create, get, update, delete: del };
`;
}

export function routesTemplate({
	className,
	fileBase,
	urlPath,
}: ResourceNames): string {
	return `import type { FastifyInstance } from "fastify";
import controller from "../controllers/${fileBase}.js";

export default function register${className}Routes(app: FastifyInstance) {
	app.get("/${urlPath}", controller.index);
	app.post("/${urlPath}", controller.create);
	app.get("/${urlPath}/:id", controller.get);
	app.patch("/${urlPath}/:id", controller.update);
	app.delete("/${urlPath}/:id", controller.delete);
}
`;
}

export function indexTemplate({ className, fileBase }: ResourceNames): string {
	return `import fastify from "fastify";
import register${className}Routes from "./routes/${fileBase}.js";

const app = fastify({ logger: false });

register${className}Routes(app);

app.listen({ port: 3000 }, (err) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});

export default app;
`;
}

/*
  The two lines a consumer needs to add to an *existing* index.ts to wire up
  a newly generated resource, when the generator won't overwrite it.
*/
export function indexWiringInstructions({
	className,
	fileBase,
}: ResourceNames): string {
	return `import register${className}Routes from "./routes/${fileBase}.js";\nregister${className}Routes(app);`;
}
