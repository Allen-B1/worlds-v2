<script context="module">
import {Layout} from "../game/game";
export async function preload(page, session) {
    try {
        let json = await(await this.fetch(page.query.map)).json();
        let layout = Layout.fromJSON(json);
        let title = String(json.title || "");
        let url = String(page.query.map);
        if (title == "") {
            let i = url.lastIndexOf("/");
            let j = url.lastIndexOf(".");
            if (j > i) {
                title = url.slice(i+1, j);
            } else {
                title = url.slice(i+1);
            }
        }
        let author = "";
        if (url.startsWith("https://gist.githubusercontent.com/")) {
            author = url.split("/")[3];
        }

        return {layout, title, author, url};
    } catch(err) {
        throw new Error("Invalid Map: " + err);
    }
}
</script>

<script lang="ts">
export let layout: Layout;
export let title: string;
export let author;
export let url: string;
let spawns = Array.from(layout.spawns.keys());
</script>

<style>
    .map {
        margin: auto;
    }
    #info {
        width: 512px; margin: auto;
        margin-top: 128px; margin-bottom: 16px;
        background: #fff;
        padding: 16px;
        text-align: center;
    }
    .url a {
        color: #666;
        text-decoration: none;
    }

</style>

<svelte:head>
    <title>squares - maps</title>
</svelte:head>

<div id="info">
    <h3>{title}</h3>
    {#if author}
    <div style="margin-bottom:8px">By {author}</div>
    {/if}
    <div class="url" style="line-height:0.9"><small><a target="_blank" href={url}>{url}</a></small></div>
</div>
<div class="map" style="width:{layout.width*24}px;height:{layout.height*24}px">
    {#each Array(layout.width * layout.height) as _, idx}
        <div id="tile-{idx}" class="tile terrain-{layout.spawns.has(idx) ? spawns.indexOf(idx) : layout.tiles.has(idx) ? layout.tiles.get(idx).terrain : -1}" style="left:{24*(idx % layout.width)}px;top:{24*Math.floor(idx / layout.width)}px"
            class:swamp={layout.swamps.has(idx)} class:city={layout.cities.has(idx)} class:controller={layout.spawns.has(idx)}>
            {layout.spawns.has(idx) ? layout.spawns.get(idx) : layout.cities.has(idx) ? -layout.cities.get(idx) : layout.tiles.has(idx) ? (layout.tiles.get(idx).army || "") : ""}
        </div>
    {/each}
</div>
