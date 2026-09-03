<script lang="ts">
	import { router } from "./router.svelte";
	import { session } from "./session.svelte";

	async function handleLogout() {
		await session.logout();
		router.navigate("/");
	}
</script>

<nav>
	<a class="brand" href="/">Experimental SaaS</a>
	{#if session.user}
		<a href="/dashboard">Dashboard</a>
		<a href="/profile">Profile</a>
		<button class="link" data-testid="logout-button" onclick={handleLogout}>
			Log out
		</button>
	{:else}
		<a href="/login">Log in</a>
		<a href="/signup">Sign up</a>
	{/if}
</nav>
