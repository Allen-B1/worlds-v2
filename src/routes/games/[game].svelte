<script context="module" lang="ts">
    export const preload = async function(this, page, session) {
        let gameID = page.params.game;

        try {
            let gameJSON = await (await this.fetch("/api/game/" + gameID)).json();
            let game = Game.fromJSON(gameJSON);

            return {
                gameID,
                game
            };
        } catch(err) {
            this.redirect(303, "/rooms/0");
        }
    }
</script>

<script lang="ts">
import * as store from "svelte/store";
import {stores} from "@sapper/app";
let {session, preloading:preloadStore} = stores();

import * as utils from "../../game/utils";
import { onMount } from "svelte";
import {Game} from "../../game/game";

export let gameID: string;
export let game: Game;

let selectedTile: number = -1;
let id: string;

async function update() {
    let gameJSON = JSON.parse(await utils.xhr("GET", "/api/game/" + gameID));
    game = Game.fromJSON(gameJSON);
}

let alive: Set<number> = new Set();
$: {
    if (game != null) {
        alive.clear();
        for (let [_, tile] of game.tiles) {
            alive.add(tile.terrain);
        }

        alive = alive;
    }
}

onMount(async () => {
    id = localStorage.getItem("sid");

    let interval = setInterval(update, 150);
    preloadStore.subscribe((value) => {
        if (value) {
            clearInterval(interval);
        }
    });
    window.addEventListener("beforeunload", function() {
        clearInterval(interval);
    });

    window.addEventListener("keydown", async function(ev) {
        if (ev.code == "Escape") {
            utils.xhr("POST", "/api/game/" + gameID + "/surrender?id=" + id);
        }

        if (ev.code == "KeyE") {
            let result = JSON.parse(await utils.xhr("POST", "/api/game/" + gameID + "/split?id=" + id + "&tile=" + selectedTile));
            if (result >= 0) {
                selectedTile = result|0;
            }
            return;
        }

        let newTile = selectedTile;
        if (ev.code == "KeyA") {
            newTile -= 1;
        } else if (ev.code == "KeyW") {
            newTile -= game.width;
        } else if (ev.code == "KeyS") {
            newTile += game.width;
        } else if (ev.code == "KeyD") {
            newTile += 1;
        }
        if (selectedTile != newTile && game.tiles.get(newTile).terrain != -2) {
            utils.xhr("POST", "/api/game/" + gameID + "/move?id=" + id + "&from=" + selectedTile + "&to=" + newTile);
            selectedTile = newTile;
        }
    });
});
</script>

<style>
    main { 
        margin-top: 128px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: flex-start;
    }
    #map {
        position: relative;
        background: #fff;
        margin-right: 16px; }

    #turn {
        padding: 16px;
        background: #fff;
        width: 96px;
        margin-bottom: 16px;
    }

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
    #players {
        padding: 16px 24px;
        padding-bottom: 8px;
        background: #fff;
        min-width: 240px;
    }
    #players .player {
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
    .player.dead {
        text-decoration: line-through; }
    </style>

<main>
    <div id="map" style="width:{game.width*24}px;height:{game.height*24}px">
        {#each Array(game.width * game.height) as _, idx}
            <div class="tile terrain-{game.tiles.get(idx).terrain}" id="tile-{idx}" style="left:{24*(idx % game.width)}px;top:{24*Math.floor(idx / game.width)}px" class:swamp={game.swamps.has(idx)} class:city={game.cities.has(idx)} class:controller={game.controllers.has(idx)} on:click={() => selectedTile = idx} class:selected={selectedTile == idx}>
                {game.tiles.get(idx).army != 0 ? game.tiles.get(idx).army : ""}
            </div>
        {/each}
    </div>
    <div>
        <div id="turn">
            <h5>Turn</h5>
            <div>{Math.floor(game.turn / 4)}</div>
        </div>
        <div id="players">
            <h5>Players</h5>
            {#each Array(game.players.length) as _, idx}
                <div class="player player-{idx}" class:dead={!alive.has(idx)}>
                    <div class="name">{game.players[idx]}</div>
                </div>
            {/each}
        </div>
    </div>
</main>