<script lang="ts">
	import { api, ApiError } from "../lib/api";
	import { router } from "../lib/router.svelte";

	let username = $state("");
	let email = $state("");
	let password = $state("");
	let error = $state("");
	let success = $state(false);
	let submitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			await api.post("/signup", { username, email, password });
			success = true;
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Signup failed";
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Create an account</h1>

{#if success}
	<p data-testid="signup-success">
		Account created - you can now <a href="/login">log in</a>.
	</p>
{:else}
	{#if error}<p class="error">{error}</p>{/if}
	<form onsubmit={handleSubmit} data-testid="signup-form">
		<label>
			Username
			<input data-testid="signup-username" bind:value={username} required />
		</label>
		<label>
			Email
			<input
				data-testid="signup-email"
				type="email"
				bind:value={email}
				required
			/>
		</label>
		<label>
			Password
			<input
				data-testid="signup-password"
				type="password"
				bind:value={password}
				required
				minlength="8"
			/>
		</label>
		<button type="submit" disabled={submitting}>Sign up</button>
	</form>
	<p class="muted">
		Already have an account? <a href="/login">Log in</a>
	</p>
{/if}
