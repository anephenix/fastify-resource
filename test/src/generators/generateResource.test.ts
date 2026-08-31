import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "vitest";
import { generateResource } from "../../../src/generators/generateResource";

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fastify-resource-gen-"));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("generateResource", () => {
	it("should create model/service/controller/routes/index files under outputDir", () => {
		const result = generateResource({
			resourceName: "widget",
			outputDir: tmpDir,
		});

		const expectedPaths = [
			path.join(tmpDir, "models", "Widget.ts"),
			path.join(tmpDir, "services", "widget.ts"),
			path.join(tmpDir, "controllers", "widget.ts"),
			path.join(tmpDir, "routes", "widget.ts"),
			path.join(tmpDir, "index.ts"),
		];
		for (const expectedPath of expectedPaths) {
			assert.ok(
				fs.existsSync(expectedPath),
				`expected ${expectedPath} to exist`,
			);
		}
		assert.deepStrictEqual(
			result.files.map((f) => f.action),
			["created", "created", "created", "created", "created"],
		);
		assert.strictEqual(result.indexWiringInstructions, undefined);

		const modelContent = fs.readFileSync(
			path.join(tmpDir, "models", "Widget.ts"),
			"utf8",
		);
		assert.match(modelContent, /class Widget extends Model/);
	});

	it("should skip existing layer files on a second run without force", () => {
		generateResource({ resourceName: "widget", outputDir: tmpDir });
		const result = generateResource({
			resourceName: "widget",
			outputDir: tmpDir,
		});

		const layerFiles = result.files.filter((f) => !f.path.endsWith("index.ts"));
		assert.ok(layerFiles.every((f) => f.action === "skipped"));
	});

	it("should overwrite existing layer files when force is set", () => {
		generateResource({ resourceName: "widget", outputDir: tmpDir });
		const result = generateResource({
			resourceName: "widget",
			outputDir: tmpDir,
			force: true,
		});

		const layerFiles = result.files.filter((f) => !f.path.endsWith("index.ts"));
		assert.ok(layerFiles.every((f) => f.action === "created"));
	});

	it("should not overwrite an existing index.ts, returning wiring instructions instead", () => {
		generateResource({ resourceName: "widget", outputDir: tmpDir });
		const indexPath = path.join(tmpDir, "index.ts");
		const originalIndexContent = fs.readFileSync(indexPath, "utf8");

		const result = generateResource({
			resourceName: "gadget",
			outputDir: tmpDir,
			force: true,
		});

		assert.strictEqual(
			fs.readFileSync(indexPath, "utf8"),
			originalIndexContent,
		);
		assert.ok(result.indexWiringInstructions?.includes("registerGadgetRoutes"));
		assert.ok(!result.files.some((f) => f.path === indexPath));
	});
});
