import { dataset_dev } from "svelte/internal";
import * as utils from "./utils";

export enum Material {
    IRON = "Fe",
    GOLD = "Au",
};

export enum Building {
    WALL = "wall",
    CORE = "core",
    MINE = "mine",
    CAMP = "camp",
    EMPTY = "",
};

export interface BuildingInfo {
    name: string,
    cost?: utils.Object<Material, number>,
};

export const BUILDING_INFO: utils.Object<string, BuildingInfo> = {
    [Building.WALL]: {
        name: "Wall",
        cost: {
            [Material.IRON]: 10,
        },
    },
    [Building.CORE]: {
        name: "Core",
        cost: {
            [Material.IRON]: 250,
            [Material.GOLD]: 100,
        }
    },
    [Building.MINE]: {
        name: "Mine",
        cost: {
            [Material.IRON]: 15,
        }
    },
    [Building.CAMP]: {
        name: "Camp",
        cost: {
            [Material.IRON]: 100,
            [Material.GOLD]: 25,
        }
    }
} as const;

export interface Tile {
    terrain: number
    army: number
    building: Building
}

type Spawn = string;
export interface LayoutSettings {
    mountain_density: number
};

export class Layout {
    width: number 
    height: number

    swamps: Set<number>
    deposits: Map<number, Material>
    tiles: Map<number, Tile>

    spawns: Map<number, Spawn>

    constructor() {}

    static randomized(players: number, settings: LayoutSettings) : Layout {
        let layout = new Layout();
        layout.width = layout.height = 48;
        layout.swamps = new Set();
        layout.deposits = new Map();
        layout.tiles = new Map();
        layout.spawns = new Map();

        for (let i = 0; i < layout.width * layout.height; i++) {
            layout.swamps.add(i);
        }

        for (let i = 0; i < 6; i++) {
            // TODO: Make better islands
            let center = Math.floor(Math.random() * layout.width * layout.height);

            let island = [];
            for (let j = -2; j < 3; j++) {
                for (let k = -2; k < 3; k++) {
                    island.push(center + j + k*layout.width);
                }
            }

            for (let tile of island) {
                layout.swamps.delete(tile);

                if (Math.random() < 0.075) {
                    layout.deposits.set(tile, Material.IRON);
                }
            }

            layout.deposits.set(center+1, Material.IRON);

            layout.spawns.set(center, "");
        }

        for (let i = 0; i < 64; i++) {
            let center = Math.floor(Math.random() * layout.width * layout.height);
            let island = [];
            for (let m = 0; m < 2; m++) {
                for (let k = 0; k < 2; k++) {
                    island.push(center + m + k*layout.width);
                }
            }

            for (let tile of island) {
                layout.swamps.delete(tile);

                if (Math.random() < 0.3) {
                    layout.deposits.set(tile, Material.IRON);
                }
                if (Math.random() < 0.1) {
                    layout.deposits.set(tile, Material.GOLD);
                }
            }
        }

        for (let i = 0; i < layout.width*layout.height; i++) {
            if (!layout.swamps.has(i)) {
                if (Math.random() < settings.mountain_density && !layout.deposits.has(i)) {
                    layout.tiles.set(i, {terrain: -2,  army: 0, building: Building.EMPTY});
                }
            }
        }

        return layout;
    }

    toJSON = utils.toJSON

    static fromJSON(obj: any) : Layout {
        let layout = new Layout();
        layout.width = obj.width;
        layout.height = obj.height;
        layout.swamps = new Set(obj.swamps || []);
        layout.spawns = new Map(Object.keys(obj.spawns).map(key => [Number(key), String(obj.spawns[key])]));
        layout.deposits = new Map(Object.keys(obj.deposits).map(key => [Number(key), String(obj.deposits[key]) as Material]));

        if (obj.mountains instanceof Array) {
            for (let mountain of obj.mountains) {
                layout.tiles.set(mountain, {army:0, terrain:-2, building: Building.EMPTY});
            }
        }

        return layout;
    }
}

export class Game {
    width: number
    height: number
    players: string[]

    swamps: Set<number>
    deposits: Map<number, Material>

    fog: boolean
    
    surrendered: Set<number>
    tiles: utils.DefaultMap<number, Tile>
    materials: utils.Object<Material, number>[]

    turn: number

    #moves: utils.DefaultMap<number, [number, number][]>
    #ended: boolean

    constructor() {
        this.#moves = new utils.DefaultMap([]);
        this.turn = 0;
    }

    get ended() : boolean {
        if (this.#ended) return true;

        let alive = new Set();
        for (let [_, tile] of this.tiles) {
            if (!this.surrendered.has(tile.terrain) && tile.terrain >= 0)
                alive.add(tile.terrain);
        }

        return alive.size <= 1 && alive.size < this.players.length;
    }

    set ended(ended: boolean) {
        this.#ended = ended;
    }

    static new(players: string[], layout: Layout, fog: boolean) {
        let game = new Game();
        game.fog = fog;
        game.width = layout.width;
        game.height = layout.height;
        game.players = players;

        game.swamps = new Set(layout.swamps);
        game.deposits = new Map(layout.deposits);

        game.surrendered = new Set();
        game.tiles = new utils.DefaultMap({terrain: -1, army: 0, building: Building.EMPTY});
        for (let [k,v] of layout.tiles) {
            game.tiles.set(k, v);
        }
        game.materials = Array(players.length);
        for (let i = 0; i < players.length; i++) {
            game.materials[i] = {[Material.IRON]: (BUILDING_INFO[Building.MINE].cost[Material.IRON] * 1.5)|0};
        }

        game.turn = 0;

        let i = 0;
        for (let [tile, spawn] of layout.spawns) {
            if (i >= game.players.length) break;
            game.tiles.set(tile, {terrain:i, army: 1, building: Building.CORE});

            i++;
        }

        // arrange extra spawns
        let tiles: Array<number> = [];
        for (let tile = 0; tile < game.width*game.height; tile++) {
            if (game.tiles.get(tile).terrain == -1 && !game.swamps.has(tile)) {
                tiles.push(tile);
            }
        }
        while (i < game.players.length) {
            let idx = (Math.random() * tiles.length)|0;
            let tile = tiles[idx];
            tiles.splice(idx, 1);

            game.tiles.set(tile, {terrain:i, army: 1, building: Building.CORE});

            i++;
        }

        return game;
    }

    nextTurn() : void {
//        console.log("--- " + this.turn + " " + utils.objectID(this) + " --- " + this.ended);
        this.turn += 1;

        if (this.turn % 4 == 0) {
            for (let [idx, tile] of this.tiles) {
                switch (tile.building) {
                    case Building.CORE:
                        tile.army++;
                        break;
                    case Building.CAMP:
                        if (this.materials[tile.terrain][Material.IRON] > 0 || this.materials[tile.terrain][Material.GOLD] > 0) {
                            if (this.materials[tile.terrain][Material.IRON] > 0) {
                                this.materials[tile.terrain][Material.IRON] -= 1;
                            } else {
                                this.materials[tile.terrain][Material.GOLD] -= 1;
                            }
                            tile.army++;
                        }
                        break;
                    case Building.MINE:
                        this.materials[tile.terrain][this.deposits.get(idx)] = (this.materials[tile.terrain][this.deposits.get(idx)]|0) + 1;
                        break;
                }
            }

            for (let swamp of this.swamps) {
                let tile = this.tiles.get(swamp);
                tile.army -= 1;
                if (tile.army <= 0) {
                    this.deleteTile(swamp);
                }
            }
        }

        if (this.turn % 2 == 0) {
            for (let swamp of this.swamps) {
                let tile = this.tiles.get(swamp);
                if (tile.army == 1) {
                    tile.army = 0;
                    this.deleteTile(swamp);
                }
            }    
        }

        for (let [playerIndex, moves] of this.#moves.entries()) {
            if (moves.length  == 0)continue;
            let move;
            do {
                move = moves.shift()
            } while (move && !this.applyMove(playerIndex, move[0], move[1]));
        }
    }

    move(playerIndex: number, from: number, to: number) : boolean {
        if (this.surrendered.has(playerIndex)) return false;

        let arr = this.#moves.get(playerIndex);
        arr.push([from, to]);
        this.#moves.set(playerIndex, arr);
        return true;
    }

    make(playerIndex: number, tile: number, building: Building) : boolean {
        if (this.surrendered.has(playerIndex)) return false;

        let tileObj = this.tiles.get(tile);
        if (tileObj.terrain != playerIndex) return false;

        if (building == Building.EMPTY) {
            if (tileObj.building == Building.CORE) return false;

            tileObj.building = building;
            return true;
        }

        if (tileObj.building != Building.EMPTY) return false;
        if (!BUILDING_INFO[building]) return false;

        let costs =  BUILDING_INFO[building].cost;
        if (costs == undefined) return false;
        for (let material in costs) {
            if (this.materials[playerIndex][material] < costs[material]) {
                return false;
            }
        }

        if (this.swamps.has(tile)) return false;
        if (building == Building.MINE && !this.deposits.has(tile)) return false; 

        if (building == Building.WALL) {
            if (tileObj.army > 1) return false;

            tileObj.terrain = -1;
            tileObj.army = 250;
        }

        tileObj.building = building;

        for (let material in costs) {
            this.materials[playerIndex][material] -= costs[material];
        }

        return true;
    }

    surrender(playerIndex: number) {
        this.surrendered.add(playerIndex);
    }

    private applyMove(playerIndex: number, from: number, to: number) : boolean {
        let fromTile = this.tiles.get(from);
        let toTile = this.tiles.get(to);
        if (fromTile.terrain != playerIndex) {
            return false;
        }

        if (toTile.terrain == -2 || to < 0 || to >= this.width*this.height) {
            return false;
        }

        if (toTile.terrain != fromTile.terrain) {
            if (toTile.army < fromTile.army - 1) { // conquer
                let toTerrain = toTile.terrain;

                toTile.terrain = fromTile.terrain;
                toTile.army = fromTile.army - 1 - toTile.army;
                fromTile.army = 1;
                this.tiles.set(to, toTile);
    
                if (toTile.building == Building.WALL) {
                    toTile.building = Building.EMPTY;
                }

                if (toTile.building == Building.CORE) {
                    let cores = 0;
                    for (let [_, data] of this.tiles) {
                        if (data.building == Building.CORE && data.terrain == toTerrain) { cores++; }
                    }
                    if (cores > 0) {
                        for (let i = -3; i < 4; i++) {
                            for (let j = -3; j < 4; j++) {
                                let tile = this.tiles.get(to + i + j * this.width);
                                if (tile.terrain == toTerrain) {
                                    tile.terrain = fromTile.terrain;
                                }
                            }
                        }
                    } else {
                        for (let [_, data] of this.tiles) {
                            if (data.terrain == toTerrain) {
                                data.terrain = fromTile.terrain;
                            }
                        }
                    }
                }
            } else { // failed attack
                toTile.army -= fromTile.army - 1;
                fromTile.army = 1;
                this.tiles.set(to, toTile);
            }
        } else {
            toTile.army += fromTile.army - 1;
            fromTile.army = 1;
        }

        return true;
    }

    private deleteTile(tile: number) {
        this.tiles.delete(tile);
    }

    toJSON() {
        let obj = utils.toJSON.call(this, true) as any;
        obj.ended = this.ended;
        return obj;
    }

    static fromJSON(obj: any) : Game {
        let game = new Game();
        game.fog = obj.fog;
        game.players = obj.players;
        game.width = obj.width;
        game.height = obj.height;

        game.swamps = new Set(obj.swamps);
        game.deposits = new Map(Object.keys(obj.deposits).map(key => [Number(key), String(obj.deposits[key]) as Material]));

        game.surrendered = new Set(obj.surrendered);
        game.tiles = new utils.DefaultMap({terrain: -1, army: 0, building: Building.EMPTY});
        game.materials = obj.materials;
        game.turn = obj.turn;
        for (let key in obj.tiles) {
            game.tiles.set(Number(key), obj.tiles[key]);
        }

        game.ended = obj.ended;

        return game;
    }
}
