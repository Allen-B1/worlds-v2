import * as utils from "./utils";

export interface Tile {
    terrain: number
    army: number
}

type Spawn = string

export class Layout {
    width: number
    height: number

    swamps: Set<number>         // decrease army by 1 if occupied
    cities: Map<number, number> // tileIndex => max city val; decrease army by 1 every time, if not occupied
    tiles: Map<number, Tile>
    spawns: Map<number, Spawn>

    constructor() {}

    static randomized(size: number, players: number) : Layout {
        let layout = new Layout();
        layout.width = layout.height = size;


        let randomPool = Array(size*size).fill(0).map((_, i) => i);

        layout.swamps = new Set();
        for (let i = 0; i < size * size * 0.1; i++) {
            layout.swamps.add(randomPool.splice(Math.floor(Math.random() * randomPool.length), 1)[0]);
        }
        layout.cities = new Map<number, number>();
        for (let i = 0; i < 3; i++) {
            layout.cities.set(randomPool.splice(Math.floor(Math.random() * randomPool.length), 1)[0], 30);
        }

        layout.spawns = new Map();
        while (layout.spawns.size < players) {
            layout.spawns.set(randomPool.splice(Math.floor(Math.random() * randomPool.length), 1)[0], "");
        }

        layout.tiles = new Map();
        for (let i = 0; i < size * size * 0.25; i++) {
            layout.tiles.set(randomPool.splice(Math.floor(Math.random() * randomPool.length), 1)[0], {terrain:-2,army:0});
        }
        
        return layout;
    }
}

export class Game {
    width: number
    height: number
    players: string[]

    swamps: Set<number>
    cities: Map<number, number>

    // -- in game state --
    controllers: Set<number>
    tiles: utils.DefaultMap<number, Tile>

    turn: number

    #moves: utils.DefaultMap<number, [number, number][]>

    constructor() {
        this.#moves = new utils.DefaultMap([]);
        this.turn = 0;
    }

    static new(players: string[], layout: Layout) {
        let game = new Game();
        game.width = layout.width;
        game.height = layout.height;
        game.players = players;

        game.swamps = new Set(layout.swamps);
        game.cities = new Map(layout.cities);

        game.controllers = new Set();
        game.tiles = new utils.DefaultMap({terrain: -1, army: 0});

        let i = 0;
        for (let [tile, spawn] of layout.spawns) {
            if (i >= game.players.length) break;
            game.controllers.add(tile);
            game.tiles.set(tile, {terrain:i, army: 1});

            i++;
        }

        for (let [tile, data] of layout.tiles) {
            if (data.terrain < game.players.length) {
                game.tiles.set(tile, data);
            }
        }

        return game;
    }

    nextTurn() : void {
//        console.log("--- " + this.turn + " " + utils.objectID(this));
        this.turn += 1;
        if (this.turn % 4 == 0) {
            for (let swamp of this.swamps) {
                let tile = this.tiles.get(swamp);
                if (tile.terrain >= 0 && tile.army > 0) {
                    tile.army -= 1;
                    this.tiles.set(swamp, tile);
                } else {
                    this.deleteTile(swamp);
                }
            }

            for (let [city, maxArmy] of this.cities.entries()) {
                let tile = this.tiles.get(city);
                if (tile.terrain == -1) {
                    if (-tile.army < maxArmy)
                        tile.army -= 1;
                }
                this.tiles.set(city, tile);
//               console.log("city: " +city + " + " + tile.army + " " + utils.objectID(tile));
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
        let arr = this.#moves.get(playerIndex);
        arr.push([from, to]);
        this.#moves.set(playerIndex, arr);
        return true;
    }

    // TODO
    private applyMove(playerIndex: number, from: number, to: number) : boolean {
        let fromTile = this.tiles.get(from);
        let toTile = this.tiles.get(to);
        if (fromTile.terrain != playerIndex) {
            return false;
        }

        if (toTile.terrain == -2) {
            return false;
        }

        if (toTile.army < fromTile.army) {
            fromTile.army -= toTile.army;
            this.tiles.set(to, fromTile);
            this.tiles.delete(from);

            if (this.controllers.has(to)) {
                // TODO: conquer all of that person's territory?
                this.controllers.delete(to);   
            }
            if (this.controllers.has(from)) {
                this.controllers.delete(from);
                this.controllers.add(to);
            }
        } else if (toTile.army > fromTile.army) {
            toTile.army -= fromTile.army;
            this.tiles.delete(from);
        }

        return true;
    }

    private deleteTile(tile: number) {
        this.tiles.delete(tile);
        this.controllers.delete(tile);
    }

    toJSON = utils.toJSON

    static fromJSON(obj: any) : Game {
        let game = new Game();
        game.players = obj.players;
        game.width = obj.width;
        game.height = obj.height;
        game.swamps = new Set(obj.swamps);
        game.cities = new Map(Object.keys(obj.cities).map(key => [Number(key), Number(obj.cities[key])]));
        game.controllers = new Set(obj.controllers);
        game.tiles = new utils.DefaultMap({terrain: -1, army: 0});
        game.turn = obj.turn;
        for (let key in obj.tiles) {
            game.tiles.set(Number(key), obj.tiles[key]);
        }
        return game;
    }
}
