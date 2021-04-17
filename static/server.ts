import * as game from "../game/game";
import * as room from "../game/room";
import * as utils from "../game/utils";
import * as express from "express";
import * as sapper from '@sapper/server';

var app = express();
var rooms = new Map<string, room.Room>();
var rooms2games = new Map<string, string>();
var games = new Map<string, game.Game>();
var gamesKeys = new Map<string, utils.Object<string, number>>();

app.use(sapper.middleware());

app.get("/", function(req, res) {
    res.sendFile("./index.html");
});

app.post("/api/room/:room", function (req, res) {
    if (!rooms.has(req.params.room)) {
        rooms.set(req.params.room, new room.Room());
        res.sendStatus(201);
    } else {
        res.sendStatus(200);
    }
})

app.get("/api/room/:room", function(req, res) {
    if (!rooms.has(req.params.room)) {
        res.sendStatus(404);
        return;
    }

    res.json(rooms.get(req.params.room));
});

app.get("/api/room/:room/index", function(req, res) {
    if (!rooms.has(req.params.room)) {
        res.sendStatus(404);
        return;
    }

    let room = rooms.get(req.params.room);

    let idxToId: string[] = Array.from(room.players.keys());
    idxToId.sort();

    res.json(idxToId.indexOf(req.query.id as string));
});

app.post("/api/room/:room/join", function(req, res) {
    if (!rooms.has(req.params.room)) {
        res.sendStatus(404);
        return;
    }

    let room = rooms.get(req.params.room);
    if (room.shouldStart) {
        res.status(400);
        res.send("started");
        return;
    }

    let id = room.join(String(req.query.name || "") || "Anonymous");
    res.send(id);
});

app.post("/api/room/:room/leave", function(req, res) {
    if (!rooms.has(req.params.room)) {
        res.sendStatus(404);
        return;
    }

    let room = rooms.get(req.params.room);
    if (room.shouldStart) {
        res.status(400);
        res.send("started");
        return;
    }
    
    res.json(room.leave(String(req.query.id)));
});

app.post("/api/room/:room/force", function(req, res) {
    if (!rooms.has(req.params.room)) {
        res.sendStatus(404);
        return;
    }

    let room = rooms.get(req.params.room);
    if (room.shouldStart) {
        res.status(400);
        res.send("started");
        return;
    }

    room.setForce(String(req.query.id), req.query.force == "true");
    res.sendStatus(200);

    if (room.shouldStart) {
        let id = Math.random().toString(36).slice(2);
        rooms2games.set(req.params.room, id);

        var [game, assoc] = room.toGame();
        games.set(id, game);
        gamesKeys.set(id, assoc);
    }
});

app.listen(8080, () => {
    console.log(`http://127.0.0.1:8080/`);
});