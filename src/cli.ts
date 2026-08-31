#!/usr/bin/env node

// Dependencies
import { generateResource } from "./generators/generateResource.js";

const usage = `Usage: fastify-resource generate <resourceName> [--output <dir>] [--force]

  generate <resourceName>   Scaffold model/service/controller/routes files
                             (plain fastify + Objection.js, no dependency on
                             fastify-resource) for the given resource name.

Options:
  --output <dir>            Directory to generate files under (default: src)
  --force                   Overwrite existing model/service/controller/
                             routes files (index.ts is never overwritten)
`;

type ParsedArgs = {
	resourceName: string;
	outputDir: string;
	force: boolean;
};

function parseArgs(argv: Array<string>): ParsedArgs | null {
	const [command, resourceName, ...rest] = argv;
	if (command !== "generate" || !resourceName) return null;

	let outputDir = "src";
	let force = false;
	for (let i = 0; i < rest.length; i++) {
		if (rest[i] === "--output") {
			outputDir = rest[i + 1] ?? outputDir;
			i++;
		} else if (rest[i] === "--force") {
			force = true;
		}
	}
	return { resourceName, outputDir, force };
}

function main(argv: Array<string>): void {
	const parsed = parseArgs(argv);
	if (!parsed) {
		console.log(usage);
		process.exitCode = 1;
		return;
	}

	const { resourceName, outputDir, force } = parsed;
	const result = generateResource({ resourceName, outputDir, force });

	for (const file of result.files) {
		const label =
			file.action === "created" ? "created" : "skipped (already exists)";
		console.log(`  ${label}: ${file.path}`);
	}

	if (result.indexWiringInstructions) {
		console.log(
			`\nAn index.ts already exists under ${outputDir} - add these lines to wire up the new resource:\n\n${result.indexWiringInstructions}\n`,
		);
	}
}

main(process.argv.slice(2));
