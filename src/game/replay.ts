import * as utils from "./utils";
import type { Game, Material, Tile } from "./game";

export class Replay {
    width: number 
    height: number
    players: string[]

    // initial state
    swamps: Set<number>
    deposits: Map<number, Material>
    tiles: Map<number, Tile>

    #tiles: Map<number, Tile>
    #surrendered: Set<number>

    updates: Array<ReplayUpdate>

    static new(game: Game): Replay {
        let self = new Replay();
        self.width = game.width;
        self.height = game.height;
        self.players = game.players;

        self.swamps = new Set(game.swamps);
        self.deposits = new Map(game.deposits);
        self.tiles = new Map();
        for (let [idx, tile] of game.tiles) {
            self.tiles.set(idx, utils.clone(tile));
        }

        self.#tiles = new Map(self.tiles);
        for (let [idx, tile] of self.tiles) {
            self.#tiles.set(idx, utils.clone(tile));
        }
        self.#surrendered = new Set();

        self.updates = [];
        return self;
    }

    update(game: Game) {
        let update: ReplayUpdate = {
            tiles: new Map(),
            surrendered: new Set()
        };

        for (let [idx, newTile] of game.tiles) {
            // old = null, new != null
            let oldTile = this.#tiles.get(idx);
            if (oldTile == null || newTile.terrain != oldTile.terrain || newTile.army != oldTile.army || newTile.building != oldTile.building) {
                update.tiles.set(idx, utils.clone(newTile));
                this.#tiles.set(idx, utils.clone(newTile));
            }
        }

        for (let [idx, oldTile] of this.#tiles) {
            // old != null, new = null
            let newTile = game.tiles.get(idx);
            if (newTile.terrain != oldTile.terrain || newTile.army != oldTile.army || newTile.building != oldTile.building) {
                update.tiles.set(idx, utils.clone(newTile));
                this.#tiles.set(idx, utils.clone(newTile));
            }
        }

        for (let newSurrender of game.surrendered) {
            if (!this.#surrendered.has(newSurrender)) {
                this.#surrendered.add(newSurrender);
                update.surrendered.add(newSurrender);
            }
        }

        this.updates.push(update);
    }

    toJSON() {
        return utils.toJSON.call(this, true); 
    }

    static fromJSON(obj): Replay {
        let self = new Replay();
        self.width = obj.width;
        self.height = obj.height;
        self.players = obj.players;

        self.swamps = new Set(obj.swamps);
        self.deposits = new Map(Object.entries(obj.deposits).map(x => [Number(x[0]), x[1] as Material]));
        self.tiles = new Map(Object.entries(obj.tiles).map(x => [Number(x[0]), x[1] as Tile]));
        self.updates = [];
        for (let update of obj.updates) {
            self.updates.push({
                tiles: new Map(Object.entries(update.tiles).map(x => [Number(x[0]), x[1] as Tile])),
                surrendered: new Set(update.surrendered),
            });
        }
        return self;
    }
}

export interface ReplayUpdate {
    tiles: Map<number, Tile>
    surrendered: Set<number>
}