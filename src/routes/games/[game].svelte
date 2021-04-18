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
import Dialog from '../../components/Dialog.svelte';

import * as store from "svelte/store";
import {stores, goto} from "@sapper/app";
let {session, preloading:preloadStore} = stores();

import * as utils from "../../game/utils";
import { onMount } from "svelte";
import {Game} from "../../game/game";

export let gameID: string;
export let game: Game;

let selectedTile: number = -1;
let id: string;

let showGameEndedDialog = false;

let wasGameEnded = false;
async function update() {
    let gameJSON = JSON.parse(await utils.xhr("GET", "/api/game/" + gameID));
    game = Game.fromJSON(gameJSON);

    if (game.ended && !wasGameEnded) {
        wasGameEnded = true;
        showGameEndedDialog = true;
    }
}

function playAgain() {
    goto("/rooms/" + sessionStorage.getItem("room"));
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
    id = sessionStorage.getItem("sid");

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
            if (newTile % game.width == game.width - 1) {
                newTile += game.width;
            }
        } else if (ev.code == "KeyW") {
            newTile -= game.width;
        } else if (ev.code == "KeyS") {
            newTile += game.width;
        } else if (ev.code == "KeyD") {
            newTile += 1;
            if (newTile % game.width == 0) {
                newTile -= game.width;
            }
        }
        if (selectedTile != newTile && game.tiles.get(newTile).terrain != -2) {
            utils.xhr("POST", "/api/game/" + gameID + "/move?id=" + id + "&from=" + selectedTile + "&to=" + newTile);
            selectedTile = newTile;
        }
    });
});

function displayNumber(num: number) : string {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return String(num);
}
</script>

<style>
    main { 
        margin-top: 128px;
        margin-bottom: 128px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: flex-start;
    }

    .map { margin-right: 16px;}
    
    #turn {
        padding: 16px;
        background: #fff;
        width: 96px;
        margin-bottom: 16px;
    }

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
    <div class="map" style="width:{game.width*24}px;height:{game.height*24}px">
        {#each Array(game.width * game.height) as _, idx}
            <div class="tile terrain-{game.tiles.get(idx).terrain}" id="tile-{idx}" style="left:{24*(idx % game.width)}px;top:{24*Math.floor(idx / game.width)}px" class:swamp={game.swamps.has(idx)} class:city={game.cities.has(idx)} class:controller={game.controllers.has(idx)} on:click={() => selectedTile = idx} class:selected={selectedTile == idx}>
                {game.tiles.get(idx).army != 0 ? displayNumber(game.tiles.get(idx).army) : ""}
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

<Dialog show={showGameEndedDialog} height={64} width={256}>
    <span slot="title">Game Ended</span>
    <span slot="buttons">
        <button on:click={() => showGameEndedDialog = false}>Spectate</button>
        <button on:click={playAgain}>Play Again</button>
    </span>
</Dialog>