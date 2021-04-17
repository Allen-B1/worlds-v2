<svelte:head>
	<link rel="preconnect" href="https://fonts.gstatic.com">
		<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,500;1,300;1,500&display=swap" rel="stylesheet"> 
	<style>
		body {
			background: #fafafa;
			font-size: 14px;
			font-family: 'Roboto';
			font-weight: 300;
			color: #111; }
		h1, h2, h3, h4, h5, h6 {
			font-weight: 500;
			margin-top: 0; margin-bottom: 8px; }
		h1 {
			font-size: 48px; }
		h2 { font-size: 32px; }
		h3 { font-size: 28px; }
		h4 { font-size: 24px; }
		h5 { font-size: 18px; }
		.textfield {
			font-family: 'Roboto';
			font-weight: 300;

			border: 0;
			font-size: 14px;
			padding: 4px 8px;
			background: transparent;
			border-bottom: 2px solid #aaa; 
			color: #111; }
		.textfield:focus {
			border-color: orange;
			outline: 0;
		}
		button, .button {
			display: inline-block;
			font-family: 'Roboto';
			font-weight: 500;
			text-decoration: none;
			cursor: pointer;

			border: 0; font-size: 14px;
			padding: 4px 12px;
			min-width: 36px; 
			background: orange;

			position: relative;
			top: -2px; left: -2px;
			box-shadow: 2px 2px 0 #aaa;

			color: #fff; }
		button:active, .button:active {
			top: -1px; left: -1px;
			box-shadow: 1px 1px 0 #aaa; }
		button.big, .button.big {
			padding: 8px 24px;
			min-width: 72px; 
			font-size: 16px; }
		.card {        background: #fff;
        box-shadow: 2px 2px 0 #aaa; }
	</style>
</svelte:head>

<main>
	<slot></slot>
</main>