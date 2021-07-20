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
			text-align: center;
			cursor: pointer;

			border: 0; font-size: 14px;
			padding: 4px 12px;
			min-width: 36px; 
			background: hsl(0, 65%, 65%);

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
		button.inactive {
			background: hsl(0, 0%, 75%);
		}


		.map {
			position: relative;
			background: #fff; }
		.tile {
			background: var(--background);
			color: #fff;
			text-align: center; line-height: 40px;
			position: absolute;
			font-size: 14px;
			width: 40px; height: 40px; }
		.tile.selected {
			outline: 2px solid #aaa;
			z-index: 1; }
		.tile.invisible {
			background: #111; }
		.swamp.terrain--1 {
			--background: hsl(240, 35%, 80%);
		}
		.swamp {
			background: url(/tiles/swamp.svg) var(--background);
		}
		.deposit-Fe::after {
			background: hsl(0, 0%, 70%);
			position: absolute;
			border: 2px solid hsl(0, 0%, 50%);
			width: 6px; height: 6px;
			top: 4px; right: 4px;
			content: " ";
		}
		.deposit-Au::after {
			background: hsl(40, 35%, 60%);
			position: absolute;
			border: 2px solid hsl(40, 45%, 40%);
			width: 6px; height: 6px;
			top: 4px; right: 4px;
			content: " ";
		}

		.building-core {
			background: url(/tiles/core.svg) var(--background);
		}
		.building-camp {
			background: url(/tiles/camp.svg) var(--background);
		}
		.building-mine {
			background: url(/tiles/mine.svg) var(--background);
		}
		.building-wall {
			background: hsl(200, 50%, 15%);
			color: #fff !important;
		}

		.terrain--2 {
			--background: hsl(200, 50%, 15%); }
		.terrain--1 { color: #111; }
		.terrain-0 {
			--background: hsl(100, 50%, 50%); }
		.terrain-1 {
			--background: hsl(320, 50%, 50%); }
		.terrain-2 {
			--background: hsl(30, 50%, 50%); }
		.terrain-3 {
			--background: hsl(200, 50%, 50%); }
		.terrain-4 {
			--background: hsl(0, 50%, 50%); }
		.terrain-5 {
			--background: hsl(270, 50%, 50%); }
		.terrain-6 {
			--background: hsl(60, 50%, 50%); }
		.terrain-7 {
			--background: hsl(160, 50%, 50%); }
		.terrain-8 {
			--background: hsl(20, 25%, 55%); }

		/* Metadata Boxes for games/replays */
		#float-info-turn {
			padding: 16px;
			background: #fff;
			min-width: 64px;
			margin-bottom: 16px;

			position: fixed; z-index: 3;
			top: 16px;
			left: 0;

			border: 1px solid #111;
			border-left: 0;
    	}

		.float-info {
			padding: 16px 24px;
			padding-bottom: 8px;
			background: #fff;
			margin-bottom: 16px;
			border: 1px solid #111;
		}

		#float-info-players { 
			position: fixed; z-index: 3;
			top: 88px;
			left: 0;
			min-width: 240px;
			border-left: 0;
		}
		#float-info-players .player {
			padding-bottom: 8px;
		}
		.player-0 .name {
			color: hsl(100, 50%, 50%); }
		.player-1 .name {
			color: hsl(320, 50%, 50%); }
		.player-2 .name {
			color: hsl(30, 50%, 50%); }
		.player-3 .name {
			color: hsl(200, 50%, 50%); }
		.player-4 .name  {
			color: hsl(0, 50%, 50%); }
		.player-5 .name  {
			color: hsl(270, 50%, 50%); }
		.player-6 .name  {
			color: hsl(60, 50%, 50%); }
		.player-7 .name  {
			color: hsl(160, 50%, 50%); }
		.player-8 .name  {
			color: hsl(20, 25%, 55%); } 
		.player.dead {
			text-decoration: line-through; }
		.player.self {
			font-weight: 400; }
	</style>
</svelte:head>

<slot></slot>