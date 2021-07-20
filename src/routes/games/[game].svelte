<svelte:head>
	<title>worlds 2</title>
</svelte:head>

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
import {Building, BUILDING_INFO, Game, Material} from "../../game/game";

export let gameID: string;
export let game: Game;

let playerIndex: number = -1;

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
            if (!game.surrendered.has(tile.terrain))
                alive.add(tile.terrain);
        }

        alive = alive;
    }
}

let hide = false;

onMount(async () => {
    id = sessionStorage.getItem("sid");

    utils.xhr("GET", "/api/game/" + gameID + "/playerIndex?id=" + id).then(function(res) {
        playerIndex = Number(res);
    });

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

        if (ev.code == "KeyH") {
            hide = !hide;
            return;
        }

        if (ev.code == "Backspace") {
            make(Building.EMPTY);
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

function displayNumber(num: number) : string {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return String(num);
}

function make(building: Building) {
    utils.xhr("POST", "/api/game/" + gameID + "/make?id=" + id + "&tile=" + selectedTile + "&building=" + building);
}

function isVisible(game: Game, playerIndex: number, tile: number) {
    if (!game.fog) return true;
    if (playerIndex < 0) return false;
    if (game.surrendered.has(playerIndex)) return true;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (game.tiles.get(tile + i + j * game.width).terrain == playerIndex) return true;
        }
    }
    return false;
}

</script>

<style>
    .map { margin-right: 16px;}
    
    #turn {
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

    #players, #materials {
        padding: 16px 24px;
        padding-bottom: 8px;
        background: #fff;
        margin-bottom: 16px;
        border: 1px solid #111;
    }
    #players { 
        position: fixed; z-index: 3;
        top: 88px;
        left: 0;
        min-width: 240px;
        border-left: 0;
    }
    #players .player {
        padding-bottom: 8px;
    }
    #materials {
        display: inline-block;
        padding-bottom: 16px;
        min-width: 64px;
        border-right: 0;

        position: fixed; z-index: 3;
        top: 16px; right: 0;
    }
    #materials > div > span:last-child {
        float: right;
    }

    #buildings {
        position: fixed; z-index: 3;
        right: 0;
        bottom: 16px;

        background: #fff;
        padding: 8px 0;
        min-width: 192px;
        border: 1px solid #111;
        border-right: 0;
    }

    #buildings .building {
        padding: 4px 16px;
        display: flex;
        flex-direction: row;
        cursor: pointer; }
    .building-name { font-weight: bold;
        flex-basis: 48px;
        margin-right: 8px; }

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

<div class="map" style="width:{game.width*40}px;height:{game.height*40}px">
    {#each Array(game.width * game.height) as _, idx}
        {#if isVisible(game, playerIndex, idx)}
            <div class="tile terrain-{game.tiles.get(idx).terrain} building-{game.tiles.get(idx).building} deposit-{game.deposits.get(idx)}"
                id="tile-{idx}" style="left:{40*(idx % game.width)}px;top:{40*Math.floor(idx / game.width)}px"
                class:swamp={game.swamps.has(idx)} on:click={() => selectedTile = idx} class:selected={selectedTile == idx}>
                {game.tiles.get(idx).army != 0 ? displayNumber(game.tiles.get(idx).army) : ""}
            </div>
        {:else}
            <div class="tile invisible"
                id="tile-{idx}" style="left:{40*(idx % game.width)}px;top:{40*Math.floor(idx / game.width)}px"></div>
        {/if}
    {/each}
</div>

{#if !hide}
<div id="turn">
    <div><b>Turn</b> {Math.floor(game.turn / 4)}</div>
</div>

<div id="players">
    <h5>Players</h5>
    {#each Array(game.players.length) as _, idx}
        <div class="player player-{idx}" class:dead={!alive.has(idx)}>
            <div class="name">{game.players[idx]}</div>
        </div>
    {/each}
</div>
<div id="materials">
    {#each Object.values(Material) as material}
        <div>
            <span><b>{material}</b></span>
            <span>{playerIndex >= 0 && game.materials[playerIndex][material] | 0}</span>
        </div>
    {/each}
</div>
<div id="buildings">
    {#each Object.keys(BUILDING_INFO) as buildingID}
        <div class="building" on:click={() => make(buildingID)}>
            <div class="building-name">{BUILDING_INFO[buildingID].name}</div>
            <div class="building-cost">
                {#each Object.keys(BUILDING_INFO[buildingID].cost) as material}
                    {BUILDING_INFO[buildingID].cost[material]} {material}&nbsp;
                {/each}
            </div>
        </div>
    {/each}
</div>

{/if}

<Dialog show={showGameEndedDialog} height={64} width={256}>
    <span slot="title">Game Ended</span>
    <span slot="buttons">
        <button on:click={() => showGameEndedDialog = false}>Spectate</button>
        <button on:click={playAgain}>Play Again</button>
    </span>
</Dialog>