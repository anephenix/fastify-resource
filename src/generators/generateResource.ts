// Dependencies
import fs from "node:fs";
import path from "node:path";
import { deriveResourceNames } from "./names.js";
import {
	controllerTemplate,
	indexTemplate,
	indexWiringInstructions,
	modelTemplate,
	routesTemplate,
	serviceTemplate,
} from "./templates.js";

export type GenerateResourceOptions = {
	resourceName: string;
	outputDir: string;
	force?: boolean;
};

export type GeneratedFile = {
	path: string;
	action: "created" | "skipped";
};

export type GenerateResult = {
	files: Array<GeneratedFile>;
	// Present when outputDir/index.ts already existed - it's never
	// overwritten (it may already register other resources), so the two
	// lines needed to wire up the new resource are returned instead.
	indexWiringInstructions?: string;
};

function writeFile(
	filePath: string,
	content: string,
	force: boolean,
): GeneratedFile {
	if (fs.existsSync(filePath) && !force) {
		return { path: filePath, action: "skipped" };
	}
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content);
	return { path: filePath, action: "created" };
}

/*
  Scaffolds a model/service/controller/routes file for a resource under
  outputDir, plus an index.ts if one doesn't already exist there. Existing
  files are left alone unless force is set - except index.ts, which is
  never overwritten since it may already wire up other resources.
*/
export function generateResource({
	resourceName,
	outputDir,
	force = false,
}: GenerateResourceOptions): GenerateResult {
	const names = deriveResourceNames(resourceName);

	const files: Array<GeneratedFile> = [
		writeFile(
			path.join(outputDir, "models", `${names.className}.ts`),
			modelTemplate(names),
			force,
		),
		writeFile(
			path.join(outputDir, "services", `${names.fileBase}.ts`),
			serviceTemplate(names),
			force,
		),
		writeFile(
			path.join(outputDir, "controllers", `${names.fileBase}.ts`),
			controllerTemplate(names),
			force,
		),
		writeFile(
			path.join(outputDir, "routes", `${names.fileBase}.ts`),
			routesTemplate(names),
			force,
		),
	];

	const indexPath = path.join(outputDir, "index.ts");
	const result: GenerateResult = { files };
	if (fs.existsSync(indexPath)) {
		result.indexWiringInstructions = indexWiringInstructions(names);
	} else {
		files.push(writeFile(indexPath, indexTemplate(names), force));
	}

	return result;
}
