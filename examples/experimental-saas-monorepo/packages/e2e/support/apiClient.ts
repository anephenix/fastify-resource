import { API_PORT } from "./env.ts";

/*
  Direct HTTP calls to the API, bypassing the browser - used for scenario
  *setup* (creating a user, enrolling MFA) so step definitions can arrange
  state quickly without re-driving UI flows that other scenarios already
  exercise directly. The actual behaviour under test always goes through
  the real browser (see step-definitions/*.ts).
*/

const BASE = `http://localhost:${API_PORT}`;

export const TEST_PASSWORD = "hunter22";

export async function signup(username: string, email: string): Promise<void> {
	const res = await fetch(`${BASE}/signup`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, email, password: TEST_PASSWORD }),
	});
	if (!res.ok) {
		throw new Error(`signup failed for ${username}: ${await res.text()}`);
	}
}

export async function enrollTotpMfa(username: string): Promise<void> {
	const loginRes = await fetch(`${BASE}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ identifier: username, password: TEST_PASSWORD }),
	});
	if (!loginRes.ok) {
		throw new Error(`login failed for ${username}: ${await loginRes.text()}`);
	}
	const { access_token } = (await loginRes.json()) as { access_token: string };

	const setupRes = await fetch(`${BASE}/auth/mfa/setup`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${access_token}`,
			"Content-Type": "application/json",
		},
		body: "{}",
	});
	if (!setupRes.ok) {
		throw new Error(`mfa setup failed for ${username}: ${await setupRes.text()}`);
	}
}
