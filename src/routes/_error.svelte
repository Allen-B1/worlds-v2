<script lang="ts">
	export let status: number;
	export let error: Error;

	const dev = process.env.NODE_ENV === 'development';
</script>

<style>
	h1, p {
		text-align: center; 
	}
	h1 {
		margin-top: 128px;
	}
	pre {
		margin: 0 24px; }
</style>

<svelte:head>
	<title>{status}</title>
</svelte:head>

<h1>{status}</h1>

<p>{error.message}</p>

{#if dev && error.stack}
	<pre>{error.stack}</pre>
{/if}
