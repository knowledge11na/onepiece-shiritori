// file: server/index.js
import { WebSocketServer } from "ws";
import { getRoom, deleteRoom, rooms } from "./room.js";
import { handleMessage } from "./game.js";

const PORT = process.env.PORT || 3000;

// WebSocketサーバー単独で起動
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  ws.on("close", () => {
    const room = rooms.get(ws.roomId);
    if (!room) return;

    room.players.delete(ws.playerId);
    room.order = room.order.filter(id => id !== ws.playerId);

    if (room.players.size === 0) {
      deleteRoom(room.id);
    } else {
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

console.log(`WS Server listening on port ${PORT}`);

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