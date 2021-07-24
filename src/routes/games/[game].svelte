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
import type { Stats } from "../../game/game";
import {Building, BUILDING_INFO, Game, Material, calcStats} from "../../game/game";

export let gameID: string;
export let game: Game;

let playerIndex: number | null = null;

let selectedTile: number = -1;
let id: string;

let updateIntervalID: number;

let showGameEndedDialog = false;

async function update() {
    let gameJSON = JSON.parse(await utils.xhr("GET", "/api/game/" + gameID));
    game = Game.fromJSON(gameJSON);

    if (game.ended) {
        showGameEndedDialog = true;

        clearInterval(updateIntervalID);
    }
}

const BUILDING_SHORTCUTS: utils.Object<Material, number | string> = {
    [Building.MINE]: 1,
    [Building.CAMP]: 2,
    [Building.WALL]: 3,
};

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
        if (playerIndex != playerIndex) playerIndex = -1;
    });

    updateIntervalID = setInterval(update, 150);
    preloadStore.subscribe((value) => {
        if (value) {
            clearInterval(updateIntervalID);
        }
    });
    window.addEventListener("beforeunload", function() {
        clearInterval(updateIntervalID);
    });

    window.addEventListener("keydown", async function(ev) {
        if (ev.code == "Escape") {
            utils.xhr("POST", "/api/game/" + gameID + "/surrender?id=" + id);
        }

        if (ev.code == "KeyH") {
            hide = !hide;
            return;
        }

        if (ev.code == "Backspace") { make(Building.EMPTY); }
        if (ev.key == "1") { make(Building.MINE); }
        if (ev.key == "2") { make(Building.CAMP); }
        if (ev.key == "3") { make(Building.WALL); }

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
            if (!ev.shiftKey)
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

function isVisible(game: Game, playerIndex: number | null, tile: number) {
    if (!game.fog) return true;
    if (playerIndex == null) return false;

    // is spectating
    if (!alive.has(playerIndex) || game.ended) return true;

    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (game.tiles.get(tile + i + j * game.width).terrain == playerIndex) return true;
        }
    }
    return false;
}

let stats: Stats;
$: {
    stats = calcStats(game.players.length, game.tiles);
}
</script>

<style>
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
        min-width: 256px;
        border: 1px solid #111;
        border-right: 0;
    }

    #buildings .building {
        padding: 4px 16px;
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer; }
    .building-key {
        flex-basis: 16px;
        background: #ddd; text-align: center; padding: 2px 4px; margin-right: 8px;  }
    .building-key:empty { background: transparent; }
    .building-name { font-weight: bold;
        flex-basis: 48px;
        margin-right: 8px; }
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
<div id="float-info-turn">
    <div><b>Turn</b> {Math.floor(game.turn / 4)}</div>
</div>

<div id="float-info-players" class="float-info">
    <div class="player-header">
        <h5>Players</h5>
        <span class="stat stat-land">LND</span>
        <span class="stat stat-army">ARM</span>
        <span class="stat stat-buildings">BLD</span>
    </div>
    {#each Array(game.players.length) as _, idx}
        <div class="player player-{idx}" class:dead={!alive.has(idx)} class:self={idx == playerIndex}>
            <div class="name">{game.players[idx]}</div>
            <div class="stat stat-land">{stats[idx].land}</div>
            <div class="stat stat-army">{stats[idx].army}</div>
            <div class="stat stat-buildings">{stats[idx].buildings}</div>
        </div>
    {/each}
</div>
{#if playerIndex >= 0 && playerIndex != null}
<div id="materials" class="float-info">
    {#each Object.values(Material) as material}
        <div>
            <span><b>{material}</b></span>
            <span>{playerIndex >= 0 && game.materials[playerIndex][material] | 0}</span>
        </div>
    {/each}
</div>
{/if}
<div id="buildings">
    {#each Object.keys(BUILDING_INFO) as buildingID}
        <div class="building" on:click={() => make(buildingID)}>
            <div class="building-key">{BUILDING_SHORTCUTS[buildingID] || ""}</div>
            <div class="building-name">{BUILDING_INFO[buildingID].name}</div>
            {#if BUILDING_INFO[buildingID].cost != undefined}
            <div class="building-cost">
                {#each Object.keys(BUILDING_INFO[buildingID].cost) as material}
                    {BUILDING_INFO[buildingID].cost[material]} {material}&nbsp;
                {/each}
            </div>
            {/if}
        </div>
    {/each}
</div>

{/if}

<Dialog show={showGameEndedDialog} height={128} width={256}>
    <span slot="title">Game Ended</span>
    <span slot="buttons">
        <button class="big" on:click={playAgain}>Play Again</button>
        <a class="button" href="/api/game/{gameID}/replay.json" target="_blank">Download Replay</a>
        <a class="button" href="/replay?url=/api/game/{gameID}/replay.json" target="_blank">Watch Replay</a>
    </span>
</Dialog>