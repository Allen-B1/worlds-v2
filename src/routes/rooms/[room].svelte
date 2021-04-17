<script context="module" lang="ts">
    import {Room} from "../../game/room";

    export async function preload(page, session) {
        let roomID = page.params.room;

        try {
            let roomJSON = await (await this.fetch("/api/room/" + roomID)).json();
            return {
                roomID,
                room: Room.fromJSON(roomJSON),
            }
        } catch(err) {
            return {roomID};
        }
    }
</script>

<script lang="ts">
    import * as utils from "../../game/utils";

    import { stores, goto } from '@sapper/app';
    import { onMount } from 'svelte';

    let {preloading:preloadStore, session} = stores();

    export let roomID: string;
    export let room: Room;
    let id: string;

    onMount(async () => {
        id = JSON.parse(await utils.xhr("POST", "/api/room/" + roomID + "/join?name=" + localStorage.getItem("name")));

        let interval = setInterval(update, 1000);

        preloadStore.subscribe((value) => {
            if (value) {
                navigator.sendBeacon("/api/room/" + roomID + "/leave?id=" + id, null);
                clearInterval(interval);
            }
        });
        window.addEventListener("beforeunload", function() {
            navigator.sendBeacon("/api/room/" + roomID + "/leave?id=" + id, null);
            clearInterval(interval);
        });
    });

    let isCustom: boolean;
    $: isCustom = !(roomID == "ffa" || roomID == "1v1");

    async function update() {
        try {
            let roomJSON = JSON.parse(await utils.xhr("GET", "/api/room/" + roomID));
            if (roomJSON.game) {
                session.update(x => { x = x || {}; x.id = id; return x });
                goto("/games/" + roomJSON.game);
            }
            room = Room.fromJSON(roomJSON);
        } catch(err) {}
    }

    let force: boolean = false;
    $: {
        if (typeof window !== "undefined") {
            utils.xhr("POST", "/api/room/" + roomID + "/force?id=" + id + "&force=" + force.toString());
            update();
        }
    }
</script>

<style>
    #player-count {
        font-size: 24px;
        text-align: center;
        margin-top: 192px;
    }
    #player-count > span {
        font-weight: 500;
    }

    #players {
        width: 256px;
        padding: 16px;
        text-align: center;
        margin: 16px auto;
        background: #fff;
    }

    #buttons { text-align: center; margin-top: 8px; }

    #force.inactive { background: #ccc; }
</style>

<svelte:head>
    <title>squares - {isCustom ? "custom" : roomID}</title>
</svelte:head>

<div id="player-count" style="margin-bottom:16px"><span>{room ? room.players.size : 0}</span> of <span>{room ? (room.maxPlayers || "inf") : 0}</span></div>

{#if isCustom &&  room != null}
<div id="players">
    <h5>Players</h5>
    {#each Array.from(room.players.keys()) as playerID}
    <div class="player">
        {room.players.get(playerID)}
    </div>
    {/each}
</div>
{/if}

{#if room && room.players.size > 1}
<div style="text-align:center">
    <button id="force" class="big {!force?"inactive":""}" on:click={() => force = !force}>Force {room.force.size} / {room.maxForce}</button>
</div>
{/if}

<div id="buttons">
    <a class="button" href="/">Cancel</a>
</div>
