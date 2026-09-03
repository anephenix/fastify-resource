import { API_PORT } from "./env.ts";

/*
  Magic-link codes and password-reset tokens are one-way hashed at rest, so
  (unlike the TOTP secret, see support/db.ts) there's no way to recover them
  from the database. The API exposes GET /__test__/outbox (only mounted
  when NODE_ENV === 'test') as a stand-in for reading the email a real user
  would have received - see packages/api/src/lib/outbox.ts.
*/
export async function getOutboxEntry(
	to: string,
	kind: "magic-link" | "reset-password",
): Promise<{ token: string; code?: string }> {
	const url = `http://localhost:${API_PORT}/__test__/outbox?to=${encodeURIComponent(to)}&kind=${kind}`;
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`No outbox entry found for ${to} (${kind})`);
	}
	return res.json();
}
