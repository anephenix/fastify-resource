<script lang="ts">
	import { onMount } from "svelte";
	import { api, ApiError } from "../lib/api";
	import { router } from "../lib/router.svelte";

	let { selector }: { selector: string } = $props();
	const token = router.query().get("token") ?? "";

	let validating = $state(true);
	let valid = $state(false);
	let validationError = $state("");

	let password = $state("");
	let passwordConfirmation = $state("");
	let error = $state("");
	let success = $state(false);
	let submitting = $state(false);

	onMount(async () => {
		try {
			await api.get(
				`/reset-password/${encodeURIComponent(selector)}?token=${encodeURIComponent(token)}`,
			);
			valid = true;
		} catch (err) {
			validationError =
				err instanceof ApiError ? err.message : "Invalid or expired reset link";
		} finally {
			validating = false;
		}
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			await api.post("/reset-password", {
				selector,
				token,
				password,
				password_confirmation: passwordConfirmation,
			});
			success = true;
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Reset failed";
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Reset your password</h1>

{#if validating}
	<p class="muted">Checking your reset link...</p>
{:else if !valid}
	<p class="error" data-testid="reset-password-invalid">{validationError}</p>
{:else if success}
	<p data-testid="reset-password-success">
		Password reset - you can now <a href="/login">log in</a>.
	</p>
{:else}
	{#if error}<p class="error">{error}</p>{/if}
	<form onsubmit={handleSubmit} data-testid="reset-password-form">
		<label>
			New password
			<input
				data-testid="reset-password-password"
				type="password"
				bind:value={password}
				required
				minlength="8"
			/>
		</label>
		<label>
			Confirm password
			<input
				data-testid="reset-password-confirmation"
				type="password"
				bind:value={passwordConfirmation}
				required
			/>
		</label>
		<button type="submit" disabled={submitting}>Reset password</button>
	</form>
{/if}
