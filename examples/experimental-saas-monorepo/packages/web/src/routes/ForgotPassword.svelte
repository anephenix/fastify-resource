<script lang="ts">
	import { api, ApiError } from "../lib/api";

	let identifier = $state("");
	let message = $state("");
	let error = $state("");
	let submitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			const result = (await api.post("/forgot-password", { identifier })) as {
				message: string;
			};
			message = result.message;
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Request failed";
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Forgot your password?</h1>

{#if message}
	<p data-testid="forgot-password-success">{message}</p>
{:else}
	{#if error}<p class="error">{error}</p>{/if}
	<form onsubmit={handleSubmit} data-testid="forgot-password-form">
		<label>
			Username or email
			<input data-testid="forgot-password-identifier" bind:value={identifier} required />
		</label>
		<button type="submit" disabled={submitting}>Send reset instructions</button>
	</form>
{/if}
