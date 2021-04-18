import sirv from 'sirv';
import express from 'express';
import * as sapper from '@sapper/server';

import * as utils from './game/utils';
import {Room} from './game/room';
import {Game,Layout, LayoutSettings} from './game/game';

// shut the freaking typechecker up
void(utils);
void(Layout);

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

let app = express();

let rooms = new Map<string, Room>();

let games = new Map<string, Game>();
let room2game = new Map<string, string>();
let gamekeys = new Map<string, utils.Object<string, number>>();

app.post("/api/room/:room/join", function(req, res) {
    let room = rooms.get(req.params.room);
    if (room == null) {
        if (req.params.room == "1v1") {
            room = new Room(2);
        } else if (req.params.room == "ffa") {
            room = new Room(8);
        } else if (req.params.room == "0") {
            room = new Room(1);  
        } else {
            room = new Room();
        }
    }
    rooms.set(req.params.room, room);

    let id = room.join(req.query.name.toString());
    res.json(id);
});

app.post("/api/room/:room/leave", function (req, res) {
    let room = rooms.get(req.params.room);
    if (room == null) {
        res.sendStatus(404);
        return;
    }

    let id = String(req.query.id);
    res.json(room.leave(id));
});

app.post("/api/room/:room/force", function (req, res) {
    let room = rooms.get(req.params.room);
    if (room == null) {
        res.sendStatus(404);
        return;
    }

    let id = String(req.query.id);
    room.setForce(id, req.query.force == "true");
    res.json(room.force.has(id));
});

app.post("/api/room/:room/settings_layout", function (req, res) {
    let room = rooms.get(req.params.room);
    if (room == null) {
        res.sendStatus(404);
        return;
    }

    let id = String(req.query.id);
    if (!room.isHost(id)) {
        res.sendStatus(403);
        return;
    }

    let changed = false;
    for (let setting of Object.keys(room.settings_layout)) {
        if (setting in req.query) {
            room.settings_layout[setting] = Number(req.query[setting]) || 0;
            changed = true;
        }
    }

    res.json(changed);
});

app.post("/api/room/:room/settings_map", function (req, res) {
    let room = rooms.get(req.params.room);
    if (room == null) {
        res.sendStatus(404);
        return;
    }

    let id = String(req.query.id);
    if (!room.isHost(id)) {
        res.sendStatus(403);
        return;
    }

    room.settings_map = String(req.query.map);

    res.json(true);
});


app.get("/api/room/:room", function (req, res) {
    let room = rooms.get(req.params.room);
    if (room == null) {
        res.sendStatus(404);
        return;
    }

    let obj = room.toJSON();
    if (room2game.get(req.params.room) != null) {
        obj.game = room2game.get(req.params.room);
    }

    res.json(obj);
});

app.get("/api/room/:room/is_host", function (req, res) {
    let room = rooms.get(req.params.room);
    if (room == null) {
        res.sendStatus(404);
        return;
    }

    res.json(room.isHost(String(req.query.id)));
});

app.get("/api/game/:game", function (req, res) {
    let game = games.get(req.params.game);
    if (game == null) {
        res.sendStatus(404);
        return;
    }

    res.json(game);
});

app.post("/api/game/:game/move", function (req, res) {
    let game = games.get(req.params.game);
    if (game == null) {
        res.sendStatus(404);
        return;
    }

    let key = req.query.id.toString();
    let playerIndex = gamekeys.get(req.params.game)[key];
    if (typeof playerIndex !== "number") {
        res.sendStatus(403);
        return;
    }

    let from = (req.query.from as any) | 0;
    let to = (req.query.to as any) | 0;

    res.json(game.move(playerIndex, from, to));
});

app.post("/api/game/:game/split", function (req, res) {
    let game = games.get(req.params.game);
    if (game == null) {
        res.sendStatus(404);
        return;
    }

    let key = req.query.id.toString();
    let playerIndex = gamekeys.get(req.params.game)[key];
    if (typeof playerIndex !== "number") {
        res.sendStatus(403);
        return;
    }

    let tile = (req.query.tile as any) | 0;

    res.json(game.split(playerIndex, tile));
});


app.post("/api/game/:game/surrender", function (req, res) {
    let game = games.get(req.params.game);
    if (game == null) {
        res.sendStatus(404);
        return;
    }

    let key = req.query.id.toString();
    let playerIndex = gamekeys.get(req.params.game)[key];
    if (typeof playerIndex !== "number") {
        res.sendStatus(403);
        return;
    }

    game.surrender(playerIndex);
    res.json(true);
});

setInterval(function() {
    for (let [id, room] of rooms.entries()) {
        if (room.shouldStart && !room2game.has(id)) {
            (async function() {
                let [game, mapping] = await room.toGame();
                let gameID = utils.objectID(game);

                games.set(gameID, game);
                gamekeys.set(gameID, mapping);
                room2game.set(id, gameID);

                setTimeout(function() {
                    rooms.delete(id);
                    room2game.delete(id);
                }, 5000);
            })();
        }
    }
    for (let game of games.values()) {
        game.nextTurn();
    }
}, 250);

app.use(sirv('static'));
app.use(sapper.middleware());

app.listen(PORT);