import { Layout, Game, LayoutSettings } from "./game"
import * as utils from "./utils"

export class Room {
    players: Map<string, string>
    force: Set<string>
    maxPlayers: number
    host: string

    settings_layout: LayoutSettings

    constructor(maxPlayers: number = Infinity) {
        this.players = new Map();
        this.force = new Set();
        this.maxPlayers = maxPlayers;
        this.settings_layout = {
            mountain_density: 0.25,
            swamp_density: 0.1,
            city_count: 5,
            size: 20
        };
        this.host = "";
    }

    isHost(id: string) : boolean {
        return id == this.host;
    }

    join(name: string) : string {
        if (this.players.size >= this.maxPlayers) {
            return "";
        }

        let id = Math.random().toString(36).slice(2);
        this.players.set(id, name);

        if (this.host == "") {
            this.host = id;
        }

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

        if (this.host == player) {
            this.host = this.players.keys().next().value || "";
        }
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
        return [Game.new(playersList, Layout.randomized(this.players.size, this.settings_layout)), assoc];
    }

    toJSON() {
        let obj = utils.toJSON.call(this, true) as any;

        let idxToId: string[] = Array.from(this.players.keys());
        idxToId.sort();

        let players = [], force = [];
        for (let id of idxToId) {
            if (this.host != id) {
                players.push(this.players.get(id));
                force.push(this.force.has(id));    
            } else {
                players.unshift(this.players.get(id));
                force.unshift(this.force.has(id)); 
            }
        }

        obj.players = players;
        obj.force = force;
        obj.host = 0;
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
        room.settings_layout = obj.settings_layout;
        room.host = obj.host.toString();

        return room;
    }
}
