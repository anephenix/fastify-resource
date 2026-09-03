import { When } from "@cucumber/cucumber";
import { BASE_URL } from "../support/env.ts";
import { getOutboxEntry } from "../support/outbox.ts";
import type { CustomWorld } from "../support/world.ts";

When("I request a magic link for {string}", async function (this: CustomWorld, email: string) {
	this.emailUnderTest = email;
	await this.page.goto(`${BASE_URL}/login`);
	await this.page.click('[data-testid="login-tab-magic-link"]');
	await this.page.fill('[data-testid="magic-link-email"]', email);
	await this.page.click(
		'[data-testid="magic-link-request-form"] button[type="submit"]',
	);
	await this.page.waitForSelector('[data-testid="magic-link-verify-form"]');
});

When(
	"I complete the magic-link login using the code that was sent",
	async function (this: CustomWorld) {
		const entry = await getOutboxEntry(this.emailUnderTest as string, "magic-link");
		await this.page.fill('[data-testid="magic-link-token"]', entry.token);
		await this.page.fill('[data-testid="magic-link-code"]', entry.code as string);
		await this.page.click(
			'[data-testid="magic-link-verify-form"] button[type="submit"]',
		);
	},
);
