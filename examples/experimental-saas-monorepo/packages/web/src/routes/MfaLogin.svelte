<script lang="ts">
	import { api, ApiError } from "../lib/api";
	import { router } from "../lib/router.svelte";
	import { session } from "../lib/session.svelte";

	const token = router.query().get("token") ?? "";

	let code = $state("");
	let recoveryCode = $state("");
	let useRecoveryCode = $state(false);
	let error = $state("");
	let submitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			await api.post("/login/mfa", {
				token,
				...(useRecoveryCode
					? { recovery_code: recoveryCode }
					: { code }),
			});
			await session.load();
			router.navigate("/dashboard");
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Verification failed";
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Enter your authenticator code</h1>

{#if !token}
	<p class="error">
		No MFA token found - go back to <a href="/login">login</a> and try again.
	</p>
{:else}
	{#if error}<p class="error">{error}</p>{/if}

	<form onsubmit={handleSubmit} data-testid="mfa-login-form">
		{#if !useRecoveryCode}
			<label>
				Authenticator code
				<input data-testid="mfa-code" bind:value={code} required />
			</label>
		{:else}
			<label>
				Recovery code
				<input data-testid="mfa-recovery-code" bind:value={recoveryCode} required />
			</label>
		{/if}
		<button type="submit" disabled={submitting}>Verify</button>
	</form>
	<button
		class="link secondary"
		data-testid="mfa-toggle-recovery"
		onclick={() => (useRecoveryCode = !useRecoveryCode)}
	>
		{useRecoveryCode ? "Use authenticator code instead" : "Use a recovery code instead"}
	</button>
{/if}
