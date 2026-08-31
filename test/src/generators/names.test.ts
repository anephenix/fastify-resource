import assert from "node:assert";
import { describe, it } from "vitest";
import { deriveResourceNames } from "../../../src/generators/names";

describe("deriveResourceNames", () => {
	it("should derive names from a singular lowercase word", () => {
		assert.deepStrictEqual(deriveResourceNames("application"), {
			className: "Application",
			fileBase: "application",
			urlPath: "applications",
			tableName: "applications",
		});
	});

	it("should derive names from a capitalized word", () => {
		assert.deepStrictEqual(deriveResourceNames("Application"), {
			className: "Application",
			fileBase: "application",
			urlPath: "applications",
			tableName: "applications",
		});
	});

	it("should singularize a plural input", () => {
		assert.deepStrictEqual(deriveResourceNames("applications"), {
			className: "Application",
			fileBase: "application",
			urlPath: "applications",
			tableName: "applications",
		});
	});

	it("should derive names from a camelCase compound word", () => {
		assert.deepStrictEqual(deriveResourceNames("blogPost"), {
			className: "BlogPost",
			fileBase: "blogPost",
			urlPath: "blogPosts",
			tableName: "blogPosts",
		});
	});

	it("should derive names from a snake_case compound word", () => {
		assert.deepStrictEqual(deriveResourceNames("blog_post"), {
			className: "BlogPost",
			fileBase: "blogPost",
			urlPath: "blogPosts",
			tableName: "blogPosts",
		});
	});

	it("should derive names from a kebab-case compound word", () => {
		assert.deepStrictEqual(deriveResourceNames("blog-post"), {
			className: "BlogPost",
			fileBase: "blogPost",
			urlPath: "blogPosts",
			tableName: "blogPosts",
		});
	});

	it("should throw when given an empty resource name", () => {
		assert.throws(() => deriveResourceNames(""));
	});
});
