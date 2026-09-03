/*
  A small hand-rolled History-API router - not a third-party package. The
  route set here is small and fixed (8 routes, one with a single :selector
  param), so a dependency (with its own Svelte-5-compatibility question
  mark) buys little over this.
*/

export type RouteName =
	| "home"
	| "signup"
	| "login"
	| "loginMfa"
	| "forgotPassword"
	| "resetPassword"
	| "dashboard"
	| "profile"
	| "notFound";

type RouteDef = {
	name: RouteName;
	pattern: RegExp;
	keys: string[];
};

const routes: RouteDef[] = [
	{ name: "home", pattern: /^\/$/, keys: [] },
	{ name: "signup", pattern: /^\/signup\/?$/, keys: [] },
	{ name: "login", pattern: /^\/login\/?$/, keys: [] },
	{ name: "loginMfa", pattern: /^\/login\/mfa\/?$/, keys: [] },
	{ name: "forgotPassword", pattern: /^\/forgot-password\/?$/, keys: [] },
	{
		name: "resetPassword",
		pattern: /^\/reset-password\/([^/]+)\/?$/,
		keys: ["selector"],
	},
	{ name: "dashboard", pattern: /^\/dashboard\/?$/, keys: [] },
	{ name: "profile", pattern: /^\/profile\/?$/, keys: [] },
];

function match(pathname: string): { name: RouteName; params: Record<string, string> } {
	for (const route of routes) {
		const result = route.pattern.exec(pathname);
		if (result) {
			const params: Record<string, string> = {};
			route.keys.forEach((key, i) => {
				params[key] = decodeURIComponent(result[i + 1]);
			});
			return { name: route.name, params };
		}
	}
	return { name: "notFound", params: {} };
}

class Router {
	path = $state(window.location.pathname);
	search = $state(window.location.search);

	current = $derived(match(this.path));

	query(): URLSearchParams {
		return new URLSearchParams(this.search);
	}

	navigate(path: string, { replace = false } = {}): void {
		const url = new URL(path, window.location.origin);
		if (replace) {
			window.history.replaceState(null, "", url);
		} else {
			window.history.pushState(null, "", url);
		}
		this.path = url.pathname;
		this.search = url.search;
	}
}

export const router = new Router();

window.addEventListener("popstate", () => {
	router.path = window.location.pathname;
	router.search = window.location.search;
});

// Intercept same-origin <a href> clicks so navigation goes through the
// router instead of a full page reload.
document.addEventListener("click", (event) => {
	const anchor = (event.target as HTMLElement).closest("a");
	if (!anchor) return;
	if (anchor.target || anchor.hasAttribute("download")) return;
	const url = new URL(anchor.href, window.location.origin);
	if (url.origin !== window.location.origin) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	event.preventDefault();
	router.navigate(url.pathname + url.search);
});
