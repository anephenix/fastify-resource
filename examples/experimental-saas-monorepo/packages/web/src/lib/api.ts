/*
  Thin fetch wrapper around the API. `credentials: 'include'` + the Vite
  dev-server proxy (see vite.config.ts) mean the browser only ever sees one
  origin, so the auth cookies (sameSite: 'strict') work with zero CORS
  config. `x-client-type: web` puts the API in cookie mode rather than
  JSON-token mode (see @anephenix/fastify-auth's detectClientType).
*/

const BASE = "/api";

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

async function request(path: string, options: RequestInit = {}) {
	const res = await fetch(`${BASE}${path}`, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			"x-client-type": "web",
			...options.headers,
		},
	});

	const contentType = res.headers.get("content-type") || "";
	const isJson = contentType.includes("application/json");
	const body = isJson ? await res.json() : await res.text();

	if (!res.ok) {
		const message =
			(isJson && body && typeof body === "object" && "error" in body
				? (body as { error: string }).error
				: undefined) ??
			(typeof body === "string" && body ? body : "Request failed");
		throw new ApiError(res.status, message);
	}

	return body;
}

export const api = {
	get: (path: string) => request(path),
	post: (path: string, data?: unknown) =>
		// Fastify's default JSON body parser rejects an empty body when
		// Content-Type: application/json is set (which every request here
		// sends) - `{}` for bodyless POSTs (e.g. /auth/mfa/setup) keeps that
		// header truthful instead of a body-less request with a JSON header.
		request(path, {
			method: "POST",
			body: JSON.stringify(data ?? {}),
		}),
	patch: (path: string, data?: unknown) =>
		request(path, { method: "PATCH", body: JSON.stringify(data) }),
	delete: (path: string) => request(path, { method: "DELETE" }),
};
