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
		.map {
			position: relative;
			background: #fff; }
		.tile {
			color: #fff;
			text-align: center; line-height: 24px;
			position: absolute;
			width: 24px; height: 24px; }
		.tile.selected {
			outline: 2px solid #aaa; }
		.terrain--1.city {
			background: #777; }
		.swamp {
			background: #aaa; 
		}
		:not(.swamp).controller::after {
			position: absolute;
			top: 0;
			right: 0;
			width: 8px;
			height: 8px;
			border-radius: 0 0 0 8px;
			background: rgba(0,0,0,0.3);
			content: " "; }
		.swamp::after {
			position: absolute;
			top: 4px;
			left: 4px;
			width: 16px;
			height: 12px;
			border: 3px solid rgba(0,0,0,0.3);
			content: " ";
			border-left: 0;
			border-right: 0; }
		.swamp::before {
			position: absolute;
			top: 11px; left: 6px;
			width: 12px; height: 3px;
			background: rgba(0,0,0,0.3);
			content: " "; }
		.terrain--2 {
			background: hsl(200, 50%, 15%); }
		.terrain--1:not(.city) { color: #111; }
		.terrain-0 {
			background: hsl(100, 50%, 50%); }
		.terrain-1 {
			background: hsl(320, 50%, 50%); }
		.terrain-2 {
			background: hsl(30, 50%, 50%); }
		.terrain-3 {
			background: hsl(200, 50%, 50%); }
		.terrain-4 {
			background: hsl(0, 50%, 50%); }
		.terrain-5 {
			background: hsl(270, 50%, 50%); }
		.terrain-6 {
			background: hsl(60, 50%, 50%); }
	</style>
</svelte:head>

<slot></slot>