<script lang="ts">
	import { api, ApiError } from "../lib/api";
	import { session } from "../lib/session.svelte";

	// There's no "is MFA enabled" field on GET /profile, so this only tracks
	// what happened in this session - reloading the page after enabling MFA
	// resets this back to "idle" even though it's still active server-side.
	let step = $state<"idle" | "setup" | "verified">("idle");
	let qrCodeImageData = $state("");
	let verifyCode = $state("");
	let recoveryCodes = $state<string[] | null>(null);
	let error = $state("");
	let message = $state("");
	let submitting = $state(false);

	let disablePassword = $state("");
	let disableCode = $state("");

	async function handleSetup() {
		error = "";
		submitting = true;
		try {
			const result = (await api.post("/auth/mfa/setup")) as {
				qrCodeImageData: string;
			};
			qrCodeImageData = result.qrCodeImageData;
			step = "setup";
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Setup failed";
		} finally {
			submitting = false;
		}
	}

	async function handleVerify(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			await api.post("/auth/mfa/verify", { token: verifyCode });
			step = "verified";
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Verification failed";
		} finally {
			submitting = false;
		}
	}

	async function handleGenerateRecoveryCodes() {
		error = "";
		submitting = true;
		try {
			const result = (await api.post("/auth/mfa/recovery-codes")) as {
				codes: string[];
			};
			recoveryCodes = result.codes;
		} catch (err) {
			error =
				err instanceof ApiError ? err.message : "Failed to generate recovery codes";
		} finally {
			submitting = false;
		}
	}

	async function handleDisable(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			await api.post("/auth/mfa/disable", {
				password: disablePassword,
				code: disableCode,
			});
			step = "idle";
			qrCodeImageData = "";
			recoveryCodes = null;
			message = "MFA disabled.";
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Failed to disable MFA";
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Your profile</h1>

{#if session.user}
	<p data-testid="profile-username">Username: {session.user.username}</p>
	<p data-testid="profile-email">Email: {session.user.email}</p>
{/if}

{#if error}<p class="error">{error}</p>{/if}
{#if message}<p data-testid="mfa-disabled-message">{message}</p>{/if}

<h2>Two-factor authentication</h2>

{#if step === "idle"}
	<button data-testid="mfa-setup-button" onclick={handleSetup} disabled={submitting}>
		Enable authenticator app MFA
	</button>
{:else if step === "setup"}
	<img
		src={qrCodeImageData}
		alt="TOTP QR code"
		width="200"
		height="200"
		data-testid="mfa-qr-code"
	/>
	<form onsubmit={handleVerify} data-testid="mfa-verify-form">
		<label>
			Enter the code from your authenticator app
			<input data-testid="mfa-verify-code" bind:value={verifyCode} required />
		</label>
		<button type="submit" disabled={submitting}>Confirm</button>
	</form>
{:else if step === "verified"}
	<p data-testid="mfa-verified-message">MFA is enabled.</p>

	{#if !recoveryCodes}
		<button
			data-testid="generate-recovery-codes"
			onclick={handleGenerateRecoveryCodes}
			disabled={submitting}
		>
			Generate recovery codes
		</button>
	{:else}
		<ul data-testid="recovery-codes">
			{#each recoveryCodes as code (code)}<li>{code}</li>{/each}
		</ul>
		<p class="muted">Save these somewhere safe - they won't be shown again.</p>
	{/if}

	<h3>Disable MFA</h3>
	<form onsubmit={handleDisable} data-testid="mfa-disable-form">
		<label>
			Password
			<input
				type="password"
				data-testid="mfa-disable-password"
				bind:value={disablePassword}
				required
			/>
		</label>
		<label>
			Authenticator code
			<input data-testid="mfa-disable-code" bind:value={disableCode} required />
		</label>
		<button type="submit" disabled={submitting}>Disable MFA</button>
	</form>
{/if}
