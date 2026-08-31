import assert from "node:assert";
import { describe, it } from "vitest";
import { deriveResourceNames } from "../../../src/generators/names";
import {
	controllerTemplate,
	indexTemplate,
	indexWiringInstructions,
	modelTemplate,
	routesTemplate,
	serviceTemplate,
} from "../../../src/generators/templates";

const names = deriveResourceNames("blogPost");

describe("templates", () => {
	it("modelTemplate should define an Objection model class with the derived table name", () => {
		const output = modelTemplate(names);
		assert.match(output, /class BlogPost extends Model/);
		assert.match(output, /return "blogPosts";/);
		assert.match(output, /export default BlogPost;/);
		assert.doesNotMatch(output, /fastify-resource/);
	});

	it("serviceTemplate should define CRUD functions calling the model's query builder", () => {
		const output = serviceTemplate(names);
		for (const fn of ["getAll", "create", "get", "update", "delete: del"]) {
			assert.ok(output.includes(fn), `expected service to define ${fn}`);
		}
		assert.match(output, /BlogPost\.query\(\)/);
		assert.doesNotMatch(output, /fastify-resource/);
	});

	it("controllerTemplate should define handlers with try/catch and status codes matching the README pattern", () => {
		const output = controllerTemplate(names);
		assert.match(output, /rep\.code\(400\)/);
		assert.match(output, /rep\.code\(404\)/);
		assert.match(output, /rep\.code\(201\)/);
		assert.match(output, /service\.getAll\(\)/);
		assert.doesNotMatch(output, /fastify-resource/);
	});

	it("routesTemplate should register the 5 RESTful routes against the controller", () => {
		const output = routesTemplate(names);
		assert.match(output, /app\.get\("\/blogPosts", controller\.index\)/);
		assert.match(output, /app\.post\("\/blogPosts", controller\.create\)/);
		assert.match(output, /app\.get\("\/blogPosts\/:id", controller\.get\)/);
		assert.match(
			output,
			/app\.patch\("\/blogPosts\/:id", controller\.update\)/,
		);
		assert.match(
			output,
			/app\.delete\("\/blogPosts\/:id", controller\.delete\)/,
		);
		assert.match(output, /export default function registerBlogPostRoutes/);
	});

	it("indexTemplate should wire up the routes registration function and listen", () => {
		const output = indexTemplate(names);
		assert.match(output, /import registerBlogPostRoutes/);
		assert.match(output, /registerBlogPostRoutes\(app\)/);
		assert.match(output, /app\.listen/);
	});

	it("indexWiringInstructions should return the two lines needed to wire up an existing index.ts", () => {
		const output = indexWiringInstructions(names);
		assert.match(
			output,
			/import registerBlogPostRoutes from "\.\/routes\/blogPost\.js";/,
		);
		assert.match(output, /registerBlogPostRoutes\(app\);/);
	});
});
