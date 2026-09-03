<script lang="ts">
	import { onMount } from "svelte";
	import { api, ApiError } from "../lib/api";

	type Project = {
		id: number;
		name: string;
		description: string | null;
		created_at: string;
	};

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let name = $state("");
	let description = $state("");
	let error = $state("");
	let submitting = $state(false);

	async function loadProjects() {
		loading = true;
		try {
			projects = (await api.get("/projects")) as Project[];
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Failed to load projects";
		} finally {
			loading = false;
		}
	}

	onMount(loadProjects);

	async function handleCreate(event: Event) {
		event.preventDefault();
		error = "";
		submitting = true;
		try {
			await api.post("/projects", { name, description: description || undefined });
			name = "";
			description = "";
			await loadProjects();
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Failed to create project";
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: number) {
		error = "";
		try {
			await api.delete(`/projects/${id}`);
			await loadProjects();
		} catch (err) {
			error = err instanceof ApiError ? err.message : "Failed to delete project";
		}
	}
</script>

<h1>Your projects</h1>

{#if error}<p class="error">{error}</p>{/if}

<form onsubmit={handleCreate} data-testid="create-project-form">
	<label>
		Name
		<input data-testid="project-name" bind:value={name} required />
	</label>
	<label>
		Description
		<input data-testid="project-description" bind:value={description} />
	</label>
	<button type="submit" disabled={submitting}>Add project</button>
</form>

{#if loading}
	<p class="muted">Loading...</p>
{:else if projects.length === 0}
	<p class="muted">No projects yet - add one above.</p>
{:else}
	<div data-testid="project-list">
		{#each projects as project (project.id)}
			<div class="card" data-testid="project-item">
				<h3>{project.name}</h3>
				{#if project.description}<p>{project.description}</p>{/if}
				<button class="secondary" onclick={() => handleDelete(project.id)}>
					Delete
				</button>
			</div>
		{/each}
	</div>
{/if}
