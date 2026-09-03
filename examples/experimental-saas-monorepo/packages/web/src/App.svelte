<script lang="ts">
	import { onMount } from "svelte";
	import { router } from "./lib/router.svelte";
	import { session } from "./lib/session.svelte";
	import Nav from "./lib/Nav.svelte";
	import Home from "./routes/Home.svelte";
	import Signup from "./routes/Signup.svelte";
	import Login from "./routes/Login.svelte";
	import MfaLogin from "./routes/MfaLogin.svelte";
	import ForgotPassword from "./routes/ForgotPassword.svelte";
	import ResetPassword from "./routes/ResetPassword.svelte";
	import Dashboard from "./routes/Dashboard.svelte";
	import Profile from "./routes/Profile.svelte";

	onMount(() => {
		session.load();
	});

	const protectedRoutes = new Set(["dashboard", "profile"]);

	$effect(() => {
		const { name } = router.current;
		if (!session.loading && protectedRoutes.has(name) && !session.user) {
			router.navigate("/login", { replace: true });
		}
	});
</script>

<Nav />

<main>
	{#if session.loading}
		<p class="muted">Loading...</p>
	{:else if router.current.name === "home"}
		<Home />
	{:else if router.current.name === "signup"}
		<Signup />
	{:else if router.current.name === "login"}
		<Login />
	{:else if router.current.name === "loginMfa"}
		<MfaLogin />
	{:else if router.current.name === "forgotPassword"}
		<ForgotPassword />
	{:else if router.current.name === "resetPassword"}
		<ResetPassword selector={router.current.params.selector} />
	{:else if router.current.name === "dashboard" && session.user}
		<Dashboard />
	{:else if router.current.name === "profile" && session.user}
		<Profile />
	{:else}
		<p>Page not found.</p>
	{/if}
</main>
