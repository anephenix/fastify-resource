import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { After, AfterAll, Before, BeforeAll } from "@cucumber/cucumber";
import { type Browser, chromium } from "playwright";
import {
	API_DIR,
	API_PORT,
	BASE_URL,
	DB_FILE,
	QUEUE_DB_FILE,
	TOTP_SECRET_ENCRYPTION_KEY,
	WEB_DIR,
	WEB_PORT,
} from "./env.ts";
import type { CustomWorld } from "./world.ts";

const API_LOG = "/tmp/e2e-api.log";
const WEB_LOG = "/tmp/e2e-web.log";

let apiProcess: ChildProcess;
let webProcess: ChildProcess;
let browser: Browser;

async function waitForServer(url: string, logFile: string, timeoutMs = 20_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			await fetch(url);
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}
	const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "";
	throw new Error(
		`Server at ${url} did not become ready within ${timeoutMs}ms.\n--- ${logFile} ---\n${log}`,
	);
}

BeforeAll({ timeout: 60_000 }, async () => {
	fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
	if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
	if (fs.existsSync(QUEUE_DB_FILE)) fs.unlinkSync(QUEUE_DB_FILE);
	execFileSync("npx", ["knex", "migrate:latest"], {
		cwd: API_DIR,
		env: { ...process.env, DB_FILE },
		stdio: "inherit",
	});

	const apiOut = fs.openSync(API_LOG, "w");
	apiProcess = spawn("npx", ["tsx", "src/index.ts"], {
		cwd: API_DIR,
		env: {
			...process.env,
			DB_FILE,
			QUEUE_DB_FILE,
			PORT: String(API_PORT),
			NODE_ENV: "test",
			TOTP_SECRET_ENCRYPTION_KEY,
		},
		stdio: ["ignore", apiOut, apiOut],
	});
	await waitForServer(`http://localhost:${API_PORT}/login`, API_LOG);

	const webOut = fs.openSync(WEB_LOG, "w");
	webProcess = spawn("npx", ["vite", "--port", String(WEB_PORT)], {
		cwd: WEB_DIR,
		env: { ...process.env, API_URL: `http://localhost:${API_PORT}` },
		stdio: ["ignore", webOut, webOut],
	});
	await waitForServer(BASE_URL, WEB_LOG);

	browser = await chromium.launch();
});

AfterAll(async () => {
	await browser?.close();
	apiProcess?.kill();
	webProcess?.kill();
});

Before(async function (this: CustomWorld) {
	const context = await browser.newContext();
	this.page = await context.newPage();
});

After(async function (this: CustomWorld) {
	await this.page?.context().close();
});
