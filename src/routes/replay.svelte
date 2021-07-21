<script context="module" lang="ts">
    import {Replay} from "../game/replay";
    export async function preload(page, session) {
        let json = await(await this.fetch(page.query.url)).json();
        let url = page.query.url;
        let replay = Replay.fromJSON(json);

        return {replay, url};
    }
</script>

<svelte:head>
	<title>worlds 2 - replay</title>
    <meta name="description" content="{replay.updates.length - 1} turns | {replay.players.join(", ")}">
</svelte:head>

<script lang="ts">
import { Building } from "../game/game";
import type { Tile } from "../game/game";
import { onMount } from "svelte";

export let replay: Replay;
export let url: string;

let hide = false;

let tiles: Map<number, Tile> = new Map(replay.tiles);
let surrendered: Set<number> = new Set();

let alive = new Set();
$: {
    alive.clear();
    for (let [_, tile] of tiles) {
        if (!surrendered.has(tile.terrain) && tile.terrain >= 0)
            alive.add(tile.terrain);
    }

    alive = alive;
}

let turn = 0;
function nextTurn() {
    let update = replay.updates[turn];
    if (!update) {
        speed.set(0);
        return;
    }
    for (let [idx, tile] of update.tiles) {
        tiles.set(idx, tile);
    }
    tiles = tiles;
    for (let surrender of update.surrendered) {
        surrendered.add(surrender);
    }
    surrendered = surrendered;

    turn += 1;
}

function reset() {
    tiles = new Map(replay.tiles);
    surrendered = new Set();
    turn = 0;
}

function goToTurn(n: number) {
    if (n >= replay.updates.length) n = replay.updates.length;

    reset();
    while (turn < n) {
        nextTurn();
    }
}

function displayNumber(num: number) : string {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return String(num);
}

import * as store from 'svelte/store';
import { update_await_block_branch } from "svelte/internal";

let speed = store.writable<number>(0);
onMount(() => {
    window.addEventListener("keydown", async function(ev) {
        if (ev.code == "Enter") {
            nextTurn();
        }
        if (ev.code == "Space") {
            if (store.get(speed) == 0) {
                speed.set(1);
            } else {
                speed.set(0);
            }

            document.activeElement.blur();
            ev.stopPropagation();
            ev.preventDefault();
            return false;
        }

        if (ev.code == "KeyH") {
            hide = !hide;
            return;
        }
    });
});

let intervalID: number = -1;
speed.subscribe((value) => {
    if (intervalID != -1) clearInterval(intervalID);
    if (value != 0) {
        if (turn >= replay.updates.length) {
            reset();
        }
        intervalID = setInterval(nextTurn, 250/value);
    }
});

function onTurnInput() { speed.set(0); goToTurn(this.value * 4); }
</script>

<style>
    #speed {
        bottom: 16px;
        left: 50%;
        margin-left: -128px;
        width: 256px;
        position: fixed;
        z-index: 3;
    }

    #speed button {
        flex-grow: 1;
    }
</style>

{#if !hide}
<div id="float-info-turn">
    <div><b>Turn</b> <input style="width:5em" class="textfield" type="number" value={Math.floor(turn / 4)} on:blur={onTurnInput} on:keydown={function(e) { if (e.code == "Enter") onTurnInput.call(this); }}></div>
</div>

<div id="float-info-players" class="float-info">
    <h5>Players</h5>
    {#each Array(replay.players.length) as _, idx}
        <div class="player player-{idx}" class:dead={!alive.has(idx)}>
            <div class="name">{replay.players[idx]}</div>
        </div>
    {/each}
</div>

<div id="speed" class="float-info">
    <h5 align="center">Speed</h5>
    <div style="font-size:0;display:flex;flex-direction:row">
        <button class:inactive={$speed != 0} on:click={() => speed.set(0)}>0</button>
        <button class:inactive={$speed != 0.5} on:click={() => speed.set(0.5)}>0.5</button>
        <button class:inactive={$speed != 1} on:click={() => speed.set(1)}>1</button>
        <button class:inactive={$speed != 2} on:click={() => speed.set(2)}>2</button>
        <button class:inactive={$speed != 4} on:click={() => speed.set(4)}>4</button>
    </div>
</div>
{/if}

<div class="map" style="width:{replay.width*40}px;height:{replay.height*40}px">
    {#each Array(replay.width * replay.height) as _, idx}
        <div class="tile terrain-{tiles.get(idx) ? tiles.get(idx).terrain : -1} building-{tiles.get(idx) ? tiles.get(idx).building : Building.EMPTY} deposit-{replay.deposits.get(idx)}"
            id="tile-{idx}" style="left:{40*(idx % replay.width)}px;top:{40*Math.floor(idx / replay.width)}px"
            class:swamp={replay.swamps.has(idx)}>
            {tiles.get(idx) && tiles.get(idx).army != 0 ? tiles.get(idx) && displayNumber(tiles.get(idx).army) : ""}
        </div>
    {/each}
</div>
