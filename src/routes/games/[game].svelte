<script context="module" lang="ts">
    import {Game} from "../../game/game";
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

export let gameID: string;
export let game: Game;

let id: string = (store.get(session) as any).id;
let selectedTile: number = -1;

async function update() {
    let gameJSON = JSON.parse(await utils.xhr("GET", "/api/game/" + gameID));
    game = Game.fromJSON(gameJSON);
}

onMount(async () => {
    let interval = setInterval(update, 150);
    preloadStore.subscribe((value) => {
        if (value) {
            clearInterval(interval);
        }
    });
    window.addEventListener("beforeunload", function() {
        clearInterval(interval);
    });

    window.addEventListener("keydown", function(ev) {
        let oldTile = selectedTile;
        if (ev.code == "KeyA") {
            selectedTile -= 1;
        } else if (ev.code == "KeyW") {
            selectedTile -= game.width;
        } else if (ev.code == "KeyS") {
            selectedTile += game.width;
        } else if (ev.code == "KeyD") {
            selectedTile += 1;
        }
        if (selectedTile != oldTile) 
            utils.xhr("POST", "/api/game/" + gameID + "/move?id=" + id + "&from=" + oldTile + "&to=" + selectedTile);
    });
});
</script>

<style>
    #map {
        position: relative;
        margin: auto;
        background: #fff; }
    .tile {
        color: #fff;
        text-align: center; line-height: 24px;
        position: absolute;
        width: 24px; height: 24px; }
    .tile.selected {
        outline: 2px solid #aaa; }
    .terrain--1.city {
        background: #aaa; }
    .swamp {
        background: #aaa; 
    }
    .swamp::after {
        position: absolute;
        top: 4px;
        left: 4px;
        width: 16px;
        height: 12px;
        border: 3px solid rgba(0,0,0,0.3);
        content: " ";
        border-left: 0;
        border-right: 0;
    }
    .swamp::before {
        position: absolute;
        top: 11px; left: 6px;
        width: 12px; height: 3px;
        background: rgba(0,0,0,0.3);
        content: " ";
    }
    .terrain--2 {
        background: hsl(200, 50%, 15%); }
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

<div id="map" style="width:{game.width*24}px;height:{game.height*24}px">
    {#each Array(game.width * game.height) as _, idx}
        <div class="tile terrain-{game.tiles.get(idx).terrain}" id="tile-{idx}" style="left:{24*(idx % game.width)}px;top:{24*Math.floor(idx / game.width)}px" class:swamp={game.swamps.has(idx)} class:city={game.cities.has(idx)} on:click={() => selectedTile = idx} class:selected={selectedTile == idx}>
            {game.tiles.get(idx).army != 0 ? game.tiles.get(idx).army : ""}
        </div>
    {/each}
</div>