<script lang="ts">
	import { api, ApiError } from "../lib/api";
	import { router } from "../lib/router.svelte";
	import { session } from "../lib/session.svelte";

	// The magic-link "email" is a link containing this - landing here with a
	// token in the URL is what clicking that link looks like, so only the
	// code (the human-facing confirmation piece) needs to be typed in.
	const tokenFromUrl = router.query().get("token");

	let mode = $state<"password" | "magic-link">("password");
	let identifier = $state("");
	let password = $state("");
	let email = $state("");
	let magicLinkRequested = $state(false);
	let mlCode = $state("");
	let error = $state("");
	let submitting = $state(false);

	async function handleLoginResult(result: { token?: string }) {
		if (result?.token) {
			router.navigate(`/login/mfa?token=${encodeURIComponent(result.token)}`);
			return;
		}
		await session.load();
		router.navigate("/dashboard");
	}

	async function handlePasswordLogin(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			const result = await api.post("/login", { identifier, password });
			await handleLoginResult(result as { token?: string });
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Login failed";
		} finally {
			submitting = false;
		}
	}

	async function handleRequestMagicLink(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			await api.post("/magic-links", { email });
			magicLinkRequested = true;
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Request failed";
		} finally {
			submitting = false;
		}
	}

	async function handleVerifyMagicLink(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			const result = await api.post("/magic-links/verify", {
				token: tokenFromUrl,
				code: mlCode,
			});
			await handleLoginResult(result as { token?: string });
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Verification failed";
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Log in</h1>

{#if error}<p class="error">{error}</p>{/if}

{#if tokenFromUrl}
	<p class="muted">Enter the code from your email to finish signing in.</p>
	<form onsubmit={handleVerifyMagicLink} data-testid="magic-link-verify-form">
		<label>
			Code
			<input data-testid="magic-link-code" bind:value={mlCode} required />
		</label>
		<button type="submit" disabled={submitting}>Verify</button>
	</form>
{:else}
	<div class="tabs">
		<button
			class:secondary={mode !== "password"}
			data-testid="login-tab-password"
			onclick={() => (mode = "password")}
		>
			Password
		</button>
		<button
			class:secondary={mode !== "magic-link"}
			data-testid="login-tab-magic-link"
			onclick={() => (mode = "magic-link")}
		>
			Magic link
		</button>
	</div>

	{#if mode === "password"}
		<form onsubmit={handlePasswordLogin} data-testid="password-login-form">
			<label>
				Username or email
				<input data-testid="login-identifier" bind:value={identifier} required />
			</label>
			<label>
				Password
				<input
					data-testid="login-password"
					type="password"
					bind:value={password}
					required
				/>
			</label>
			<button type="submit" disabled={submitting}>Log in</button>
		</form>
		<p class="muted"><a href="/forgot-password">Forgot your password?</a></p>
	{:else if !magicLinkRequested}
		<form onsubmit={handleRequestMagicLink} data-testid="magic-link-request-form">
			<label>
				Email
				<input
					data-testid="magic-link-email"
					type="email"
					bind:value={email}
					required
				/>
			</label>
			<button type="submit" disabled={submitting}>Send magic link</button>
		</form>
	{:else}
		<p class="muted" data-testid="magic-link-sent-message">
			Check your email for a sign-in link (this demo has no real email
			delivery - check the API server's console output, or the e2e suite's
			test-only outbox).
		</p>
	{/if}
{/if}
