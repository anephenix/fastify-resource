import { When } from "@cucumber/cucumber";
import { BASE_URL } from "../support/env.ts";
import { getOutboxEntry } from "../support/outbox.ts";
import type { CustomWorld } from "../support/world.ts";

When(
	"I request a password reset for {string}",
	async function (this: CustomWorld, email: string) {
		this.emailUnderTest = email;
		await this.page.goto(`${BASE_URL}/forgot-password`);
		await this.page.fill('[data-testid="forgot-password-identifier"]', email);
		await this.page.click(
			'[data-testid="forgot-password-form"] button[type="submit"]',
		);
		await this.page.waitForSelector('[data-testid="forgot-password-success"]');
	},
);

When(
	"I complete the password reset with the token that was sent, setting the password to {string}",
	async function (this: CustomWorld, newPassword: string) {
		const entry = await getOutboxEntry(
			this.emailUnderTest as string,
			"reset-password",
		);
		// packages/api/src/routes/auth.ts's outbox.record() call encodes
		// the reset-password route's two params together as "selector:token".
		const [selector, token] = entry.token.split(":");

		await this.page.goto(
			`${BASE_URL}/reset-password/${selector}?token=${token}`,
		);
		await this.page.waitForSelector('[data-testid="reset-password-form"]');
		await this.page.fill('[data-testid="reset-password-password"]', newPassword);
		await this.page.fill(
			'[data-testid="reset-password-confirmation"]',
			newPassword,
		);
		await this.page.click(
			'[data-testid="reset-password-form"] button[type="submit"]',
		);
		await this.page.waitForSelector('[data-testid="reset-password-success"]');
	},
);
