import * as utils from "./utils";

export interface Tile {
    terrain: number
    army: number
}

type Spawn = string

export interface LayoutSettings {
    swamp_density: number
    city_count: number
    mountain_density: number 
    size: number
}

export class Layout {
    width: number
    height: number

    swamps: Set<number>         // decrease army by 1 if occupied
    cities: Map<number, number> // tileIndex => max city val; decrease army by 1 every time, if not occupied
    tiles: Map<number, Tile>
    spawns: Map<number, Spawn>

    constructor() {}

    static randomized(players: number, settings: LayoutSettings) : Layout {
        let layout = new Layout();
        layout.width = layout.height = settings.size;


        let randomPool = Array(settings.size*settings.size).fill(0).map((_, i) => i);

        layout.swamps = new Set();
        for (let i = 0; i < settings.size * settings.size * settings.swamp_density; i++) {
            layout.swamps.add(randomPool.splice(Math.floor(Math.random() * randomPool.length), 1)[0]);
        }
        layout.cities = new Map<number, number>();
        for (let i = 0; i < settings.city_count; i++) {
            layout.cities.set(randomPool.splice(Math.floor(Math.random() * randomPool.length), 1)[0], 25 + Math.floor(Math.random() * 10));
        }

        layout.spawns = new Map();
        while (layout.spawns.size < players) {
            layout.spawns.set(randomPool.splice(Math.floor(Math.random() * randomPool.length), 1)[0], "");
        }

        layout.tiles = new Map();
        for (let i = 0; i < settings.size * settings.size * settings.mountain_density; i++) {
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
        if (this.turn % 40 == 0) {
            for (let controller of this.controllers) {
                this.tiles.get(controller).army += 1;
            }
        }
        if (this.turn % 2 == 0) {
            for (let swamp of this.swamps) {
                let tile = this.tiles.get(swamp);
                if (tile.terrain >= 0 && tile.army > 1) {
                    tile.army -= 1;
                    this.tiles.set(swamp, tile);
                } else {
                    this.deleteTile(swamp);
                    this.controllers.delete(swamp);
                }
            }
        }
        if (this.turn % 4 == 0) {
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

    surrender(playerIndex: number) {
        for (let [tile, data] of this.tiles) {
            if (data.terrain == playerIndex) {
                this.deleteTile(tile);
            }
        }
    }

    split(playerIndex: number, tile: number) : number {
        let fromTile = this.tiles.get(tile);
        if (fromTile.terrain != playerIndex || fromTile.army <= 50) {
            return -1;
        }

        let toPossible = Array(this.width * this.height).fill(0).map((_, i) => i)
            .filter(t => this.tiles.get(t).terrain == -1)
            .filter(t => !this.cities.has(t));
        let to = toPossible[Math.floor(Math.random() * toPossible.length)];

        this.tiles.set(to, {army: fromTile.army - 50, terrain: playerIndex});
        fromTile.army = 1;

        if (this.controllers.has(tile)) {
            this.controllers.delete(tile);
            this.controllers.add(to);
        }

        return to;
    }

    private applyMove(playerIndex: number, from: number, to: number) : boolean {
        let fromTile = this.tiles.get(from);
        let toTile = this.tiles.get(to);
        if (fromTile.terrain != playerIndex) {
            return false;
        }

        if (toTile.terrain == -2) {
            return false;
        }

        if (toTile.terrain != fromTile.terrain) {
            if (toTile.army < fromTile.army) { // from wins
                fromTile.army -= toTile.army;
                this.tiles.set(to, fromTile);
                this.tiles.delete(from);
    
                if (this.controllers.has(to)) {
                    this.controllers.delete(to);
                    for (let [tile, data] of this.tiles) {
                        if (data.terrain == toTile.terrain) {
                            data.terrain = toTile.terrain;
                        }
                    }
                }
                if (this.controllers.has(from)) {
                    this.controllers.delete(from);
                    this.controllers.add(to);
                }
            } else if (toTile.army > fromTile.army) { // to wins
                toTile.army -= fromTile.army;
                this.tiles.delete(from);

                if (this.controllers.has(from)) {
                    this.controllers.delete(from);
                    for (let [tile, data] of this.tiles) {
                        if (data.terrain == fromTile.terrain) {
                            data.terrain = fromTile.terrain;
                        }
                    }
                }
            }
        } else {
            toTile.army += fromTile.army;
            this.tiles.delete(from);
            if (this.controllers.has(from)) {
                this.controllers.delete(from);
                this.controllers.add(to);
            }
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
