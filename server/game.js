import { createDeck, draw, randomKana, getLastKana } from "./util.js";
import { createDeck, draw, randomKana, getLastKana, toHiragana } from "./util.js";

export function handleMessage(ws, room, msg) {
  const type = msg.type;

  // ===== 入室
  if (type === "join") {
    const id = msg.playerId;

if (room.players.size >= 8 && !room.players.has(id)) {
  ws.send(JSON.stringify({ type: "error", message: "満員です" }));
  return;
}

    let p = room.players.get(id);

    if (!p) {
      p = {
        id,
        name: msg.name || "名無し",
        hand: [],
        ws
      };
      room.players.set(id, p);

      if (!room.order.includes(id)) {
        room.order.push(id);
      }
    } else {
      p.name = msg.name || "名無し";
      p.ws = ws;
    }

    ws.playerId = id;
    ws.roomId = room.id;

    broadcast(room);
  }

  // ===== スタート
if (type === "start") {
  if (room.phase !== "lobby" && room.phase !== "finished") return;

  room.phase = "playing";

  // ★完全リセット
  room.deck = createDeck();
  room.ranking = [];
  room.history = [];
  room.usedWords.clear();

  room.lastWord = "";
  room.lastCardType = "";
  room.lastKana = randomKana();

  // ★全プレイヤーの手札リセット
  room.players.forEach(p => {
    p.hand = draw(room.deck, 5);
  });

  broadcast(room);
}

  // ===== プレイ
  if (type === "play") {
    if (room.phase !== "playing") return;

    const p = room.players.get(ws.playerId);
    if (!p) return;

    if (room.locked) return;
    room.locked = true;

    const word = msg.word;

const allowedStarts = room.lastWord ? getLastKana(room.lastWord) : null;

// ★ここ追加（超重要）
const firstChar = toHiragana(word[0]);

if (allowedStarts && !allowedStarts.includes(firstChar)) {
  room.locked = false;
  return;
}

    if (room.usedWords.has(word)) {
      room.locked = false;
      return;
    }

    if (!p.hand.find(c => c.id === msg.cardId)) {
      room.locked = false;
      return;
    }

    // 履歴保存
    room.history.push({
      lastWord: room.lastWord,
      lastKana: room.lastKana,
      lastCardType: room.lastCardType,
      hands: new Map([...room.players].map(([id, p]) => [id, [...p.hand]]))
    });

    room.usedWords.add(word);
    room.lastWord = word;
    room.lastKana = getLastKana(word);
    room.lastCardType = msg.cardType;


    p.hand = p.hand.filter(c => c.id !== msg.cardId);

    if (p.hand.length === 0 && !room.ranking.includes(p.id)) {
      room.ranking.push(p.id);
    }

    if (room.ranking.length === room.order.length - 1) {
      room.phase = "finished";
    }

    broadcast(room);

    setTimeout(() => room.locked = false, 100);
  }

  // ===== 捨てる
  if (type === "discard") {
    if (room.phase !== "playing") return;

    const p = room.players.get(ws.playerId);
    if (!p) return;

    if (!p.hand.find(c => c.id === msg.cardId)) return;

    p.hand = p.hand.filter(c => c.id !== msg.cardId);
    const newCards = draw(room.deck, 2);
    p.hand.push(...newCards);

    broadcast(room);
  }

  // ===== 戻す
  if (type === "undo") {
    const prev = room.history.pop();
    if (!prev) return;

    room.lastWord = prev.lastWord;
    room.lastKana = prev.lastKana;
    room.lastCardType = prev.lastCardType;

    prev.hands.forEach((hand, id) => {
      const p = room.players.get(id);
      if (p) p.hand = hand;
    });

    broadcast(room);
  }
}

function broadcast(room) {
  room.order.forEach(id => {
    const p = room.players.get(id);
    if (!p || !p.ws || p.ws.readyState !== 1) return;

    const state = {
      phase: room.phase,
      lastWord: room.lastWord,
      lastKana: room.lastKana,
      lastCardType: room.lastCardType,

      players: room.order.map(pid => {
        const op = room.players.get(pid);
        return {
          name: op.name,
          count: op.hand.length,
          rank: room.ranking.indexOf(pid) + 1 || null,
          isMe: pid === id
        };
      }),

      myHand: p.hand
    };

    p.ws.send(JSON.stringify({ type: "state", state }));
  });
}