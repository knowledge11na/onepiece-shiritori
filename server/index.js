// file: server/index.js

import http from "http";
import fs from "fs";
import { WebSocketServer } from "ws";
import { getRoom, deleteRoom } from "./room.js";
import { rooms } from "./room.js";
import { handleMessage } from "./game.js";

const server = http.createServer((req, res) => {
  const file = req.url === "/" ? "./public/index.html" : "./public" + req.url;

  fs.readFile(file, (err, data) => {
    if (err) return res.end("404");
const ext = file.endsWith(".js") ? "text/javascript"
  : file.endsWith(".css") ? "text/css"
  : "text/html; charset=utf-8";

res.writeHead(200, { "Content-Type": ext });
res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {

ws.on("close", () => {
  const room = rooms.get(ws.roomId); // ←ここ変更
  if (!room) return;

  room.players.delete(ws.playerId);
  room.order = room.order.filter(id => id !== ws.playerId);

if (room.players.size === 0) {
  deleteRoom(room.id);
} else {
  // ★これ追加
  room.order.forEach(id => {
    const p = room.players.get(id);
    if (p && p.ws && p.ws.readyState === 1) {
      p.ws.send(JSON.stringify({ type: "info", message: "誰かが退出しました" }));
    }
  });
}
});
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    const room = getRoom(data.roomId);
    handleMessage(ws, room, data);
  });
});

server.listen(3000, () => {
  console.log("http://localhost:3000");
});