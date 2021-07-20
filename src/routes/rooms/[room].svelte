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

    function randomName() {
        let words = "Aardvark, Alligator, Alpaca, Anaconda, Ant, Antelope, Ape, Aphid, Armadillo, Asp, Ass, Baboon, Badger, Bald Eagle, Barracuda, Bass, Basset Hound, Bat, Bear, Beaver, Bedbug, Bee, Beetle, Bird, Bison, Black panther, Black Widow Spider, Blue Jay, Blue Whale, Bobcat, Buffalo, Butterfly, Buzzard, Camel, Caribou, Carp, Cat, Caterpillar, Catfish, Cheetah, Chicken, Chimpanzee, Chipmunk, Cobra, Cod, Condor, Cougar, Cow, Coyote, Crab, Crane, Cricket, Crocodile, Crow, Cuckoo, Deer, Dinosaur, Dog, Dolphin, Donkey, Dove, Dragonfly, Duck, Eagle, Eel, Elephant, Emu, Falcon, Ferret, Finch, Fish, Flamingo, Flea, Fly, Fox, Frog, Goat, Goose, Gopher, Gorilla, Grasshopper, Hamster, Hare, Hawk, Hippopotamus, Horse, Hummingbird, Humpback Whale, Husky, Iguana, Impala, Kangaroo, Ladybug, Leopard, Lion, Lizard, Llama, Lobster, Mongoose, Monitor lizard, Monkey, Moose, Mosquito, Moth, Mountain goat, Mouse, Mule, Octopus, Orca, Ostrich, Otter, Owl, Ox, Oyster, Panda, Parrot, Peacock, Pelican, Penguin, Perch, Pheasant, Pig, Pigeon, Polar bear, Porcupine, Quail, Rabbit, Raccoon, Rat, Rattlesnake, Raven, Rooster, Sea lion, Sheep, Shrew, Skunk, Snail, Snake, Spider, Tiger, Walrus, Whale, Wolf, Zebra".split(", ");
        return "anonymous " + words[Math.floor(Math.random() * words.length)].toLowerCase();
    }

    onMount(async () => {
        let name = localStorage.getItem("name") || randomName();
        id = JSON.parse(await utils.xhr("POST", "/api/room/" + roomID + "/join?name=" + name));

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
    $: isCustom = !(roomID == "ffa" || roomID == "1v1" || roomID == "0");

    let isHost: boolean = false;
    $: {
        room;
        if (typeof window != "undefined")
            (async function() {
                isHost = JSON.parse(await utils.xhr("GET", "/api/room/" + roomID + "/is_host?id=" + id));
            })();
    }

    async function update() {
        try {
            let roomJSON = JSON.parse(await utils.xhr("GET", "/api/room/" + roomID));
            if (roomJSON.game) {
                sessionStorage.setItem("room", roomID);
                sessionStorage.setItem("sid", id);
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

    function settings_layout(name: string, value: any) {
        utils.xhr("POST", "/api/room/" + roomID + "/settings_layout?id=" + id + "&" + name + "=" + value);
    }

    function settings_map(url: string) {
        utils.xhr("POST", "/api/room/" + roomID + "/settings_map?id=" + id + "&map=" + url);
    }

    function settings_fog(fog: boolean) {
        utils.xhr("POST", "/api/room/" + roomID + "/settings_fog?id=" + id + "&fog=" + (fog?1:0));
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
        background: #fff;
        margin-right: 16px;
    }

    #game-info {
        display: flex; flex-direction: row;
        justify-content: center;
        align-items: flex-start;
        margin-top: 16px;
        margin-bottom: 16px;
    }

    #settings {
        padding: 16px 32px;
        padding-bottom: 12px;
        width: 240px;
        background: #fff; }
    .setting {
        display: flex;
        align-items: center;
        margin-bottom: 4px; }
    .setting span { flex-grow: 1; }
    .setting input {
        width: 64px;
        margin-left: 8px; }
    .setting .map { flex-grow: 1; }

    h5 { text-align: center; }
    #buttons { text-align: center; margin-top: 8px; }
</style>

<svelte:head>
    <title>worlds 2 - {isCustom ? "custom" : roomID}</title>
</svelte:head>

<div id="player-count" style="margin-bottom:16px"><span>{room ? room.players.size : 0}</span> of <span>{room ? (room.maxPlayers || "inf") : 0}</span></div>

{#if isCustom &&  room != null}
<div id="game-info">
    <div id="players">
        <h5>Players</h5>
        {#each Array.from(room.players.keys()) as playerID}
        <div class="player">
            {room.players.get(playerID)}
        </div>
        {/each}
    </div>
    <div id="settings">
        <h5>Settings</h5>
        <div class="setting"><span>Fog of War: </span><input type="checkbox" disabled={!isHost}
            checked={room.settings_fog}
            on:input={function() { settings_fog(this.checked); }}></div>
        {#if isHost || room.settings_map != ""} 
        <div class="setting">
            {#if room.settings_map}
                <a target="_blank" href={"/maps?map=" + encodeURIComponent(room.settings_map)}>Map</a>{:else}Map{/if}:
            <input type="url" disabled={!isHost} class="map textfield" value={room.settings_map} on:input={function() { settings_map(this.value); }}></div>
        {/if}
        {#if room.settings_map == ""}
        <div class="setting"><span>Mountain Density: </span><input type="number" min="0" max="1" step="0.01" class="textfield" disabled={!isHost}
            value={room.settings_layout.mountain_density}
            on:input={function() { settings_layout("mountain_density", this.value); }}></div>
        {/if}
    </div>
</div>
{/if}

{#if room && (room.players.size > 1 || isCustom)}
<div style="text-align:center">
    <button id="force" class="big {!force?"inactive":""}" on:click={() => force = !force}>Force {room.force.size} / {room.maxForce}</button>
</div>
{/if}

<div id="buttons">
    <a class="button" href="/">Cancel</a>
</div>
