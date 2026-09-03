import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { BASE_URL } from "../support/env.ts";
import { enrollTotpMfa, signup } from "../support/apiClient.ts";
import { currentTotpCode } from "../support/db.ts";
import type { CustomWorld } from "../support/world.ts";

Given(
	"a registered user {string} with email {string}",
	async function (username: string, email: string) {
		await signup(username, email);
	},
);

Given("{string} has enrolled in TOTP MFA", async function (username: string) {
	await enrollTotpMfa(username);
});

When(
	"I log in with username {string} and password {string}",
	async function (this: CustomWorld, username: string, password: string) {
		await this.page.goto(`${BASE_URL}/login`);
		await this.page.fill('[data-testid="login-identifier"]', username);
		await this.page.fill('[data-testid="login-password"]', password);
		await this.page.click('[data-testid="password-login-form"] button[type="submit"]');
	},
);

Then("I should land on the dashboard", async function (this: CustomWorld) {
	await this.page.waitForURL("**/dashboard");
});

Then("I should land on the home page", async function (this: CustomWorld) {
	await this.page.waitForURL(`${BASE_URL}/`);
});

Then("I should be asked for an MFA code", async function (this: CustomWorld) {
	await this.page.waitForURL(/\/login\/mfa/);
	await this.page.waitForSelector('[data-testid="mfa-login-form"]');
});

When(
	"I enter the current TOTP code for {string}",
	async function (this: CustomWorld, username: string) {
		await this.page.fill('[data-testid="mfa-code"]', currentTotpCode(username));
		await this.page.click('[data-testid="mfa-login-form"] button[type="submit"]');
	},
);

Then(
	"I should be able to log in with username {string} and password {string}",
	async function (this: CustomWorld, username: string, password: string) {
		await this.page.goto(`${BASE_URL}/login`);
		await this.page.fill('[data-testid="login-identifier"]', username);
		await this.page.fill('[data-testid="login-password"]', password);
		await this.page.click('[data-testid="password-login-form"] button[type="submit"]');
		await this.page.waitForURL("**/dashboard");
	},
);

When("I log out", async function (this: CustomWorld) {
	await this.page.click('[data-testid="logout-button"]');
});

Then(
	"visiting the dashboard should redirect me to login",
	async function (this: CustomWorld) {
		await this.page.goto(`${BASE_URL}/dashboard`);
		await this.page.waitForURL("**/login");
		assert.ok(this.page.url().includes("/login"));
	},
);
