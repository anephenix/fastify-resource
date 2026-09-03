/*
  Dev/test-only stand-in for "sending an email" - magic-link codes and
  password-reset tokens are one-way hashed at rest (like passwords), so
  unlike the TOTP secret (encrypted, reversible) there's no way to recover
  them from the database after the fact. routes/auth.ts pushes into this
  alongside its console.log() calls; the /__test__/outbox route (mounted
  only when NODE_ENV === 'test', see index.ts) exposes it to the Cucumber
  suite so it doesn't have to scrape stdout.
*/

export type OutboxEntry = {
	to: string;
	kind: "magic-link" | "reset-password";
	token: string;
	code?: string;
	createdAt: string;
};

const entries: OutboxEntry[] = [];

export function record(entry: Omit<OutboxEntry, "createdAt">): void {
	entries.push({ ...entry, createdAt: new Date().toISOString() });
}

export function latestFor(
	to: string,
	kind: OutboxEntry["kind"],
): OutboxEntry | undefined {
	return [...entries].reverse().find((e) => e.to === to && e.kind === kind);
}

export function all(): OutboxEntry[] {
	return entries;
}
