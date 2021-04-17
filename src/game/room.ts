import { Layout, Game } from "./game"
import * as utils from "./utils"

export class Room {
    players: Map<string, string>
    force: Set<string>
    maxPlayers: number

    constructor(maxPlayers: number = Infinity) {
        this.players = new Map();
        this.force = new Set();
        this.maxPlayers = maxPlayers;
    }

    join(name: string) : string {
        if (this.players.size >= this.maxPlayers) {
            return "";
        }

        let id = Math.random().toString(36).slice(2);
        this.players.set(id, name);

        return id;
    }

    setForce(player: string, force_: boolean) {
        if (force_ && this.players.has(player)) {
            this.force.add(player);
        } else {
            this.force.delete(player);
        }
    }

    get maxForce() : number {
        return Math.floor(this.players.size / 2) + 1;
    }

    leave(player: string) : boolean {
        let ret = this.players.has(player);
        this.players.delete(player);
        this.force.delete(player);
        return ret;
    }

    get shouldStart() : boolean {
        return this.force.size >= this.maxForce || this.players.size >= this.maxPlayers;
    }

    toGame() : [Game, utils.Object<string, number>] {
        let playersList: string[] = [];
        let assoc: utils.Object<string, number> = {};
        for (let [k, v] of this.players) {
            playersList.push(v);
            assoc[k] = playersList.length - 1;
        }
        return [Game.new(playersList, Layout.randomized(15, this.players.size)), assoc];
    }

    toJSON() {
        let obj = utils.toJSON.call(this, true) as any;

        let idxToId: string[] = Array.from(this.players.keys());
        idxToId.sort();

        let players = [], force = [];
        for (let id of idxToId) {
            players.push(this.players.get(id));
            force.push(this.force.has(id));
        }

        obj.players = players;
        obj.force = force;
        return obj;
    }

    static fromJSON(obj: any) : Room {
        let room = new Room();

        for (let i = 0; i < obj.players.length; i++) {
            room.players.set(i.toString(), obj.players[i]);
            if (obj.force[i])
                room.force.add(i.toString());
        }

        room.maxPlayers = obj.maxPlayers

        return room;
    }
}
