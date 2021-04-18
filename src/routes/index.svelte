<script>
	import successkid from 'images/successkid.jpg';
</script>

<style>
	main { 
		text-align: center;
		margin-top: 192px; }
	h1 {
		font-size: 32px; }
	#buttons {
		margin-top: 8px; }
</style>

<svelte:head>
	<title>squares</title>
</svelte:head>

<main>
	<h1>squares</h1>

	<div><input type="text" value={typeof localStorage != "undefined" ? localStorage.getItem("name") : ""} class="textfield" placeholder="anonymous" on:input={function() {localStorage.setItem("name", this.value)}}></div>
	<div id="buttons">
		<a class="button" href="/rooms/ffa">FFA</a>
		<a class="button" href="/rooms/1v1">1v1</a>
	</div>
</main>