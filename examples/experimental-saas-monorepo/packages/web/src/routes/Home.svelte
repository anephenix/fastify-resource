<script lang="ts">
	import { session } from "../lib/session.svelte";
</script>

<h1>Experimental SaaS</h1>
<p>
	A small real app built to put <code>@anephenix/fastify-resource</code> and
	<code>@anephenix/fastify-auth</code> to a real test - password, magic-link
	and TOTP login, forgotten-password, and a project dashboard.
</p>

{#if session.user}
	<p><a href="/dashboard">Go to your dashboard →</a></p>
{:else}
	<p>
		<a href="/signup">Create an account</a> or
		<a href="/login">log in</a> to get started.
	</p>
{/if}
