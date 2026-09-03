import { setWorldConstructor, World } from "@cucumber/cucumber";
import type { Page } from "playwright";

export class CustomWorld extends World {
	page!: Page;
	// The email address the current scenario's outbox lookup (magic-link
	// code or password-reset token) should be filed under.
	emailUnderTest?: string;
}

setWorldConstructor(CustomWorld);
