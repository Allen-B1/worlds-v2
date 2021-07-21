<script lang="ts">
    export let show: boolean;
    export let width: number = 256;
    export let height: number | string = "auto";
</script>

<style>
.overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.3);
    z-index: 100;
}
.overlay.show {
    display: block; }

.dialog { 
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    padding: 16px;

    z-index: 101;
    display: flex;
    flex-direction: column;
}
h5 { text-align: center; }
.buttons > :global(*) {
    display: flex !important;
    flex-direction: column;
    align-items: center;
}
.buttons :global(.button):not(:last-child), .buttons :global(button):not(:last-child) {
    margin-bottom: 8px;
}
</style>

<div class="overlay" class:show={show}>
    <div class="dialog" style={"min-width:" + width + "px;min-height:" + (typeof height == "string" ? height : height + "px")}>
        <h5><slot name="title"></slot></h5>
        <div><slot name="message"></slot></div>
        <div style="flex-grow:1"></div>
        <div class="buttons">
            <slot name="buttons"></slot>
        </div>
    </div>
</div>