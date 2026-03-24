// file: server/room.js
export const rooms = new Map();

export function deleteRoom(id) {
  rooms.delete(id);
}

export function getRoom(id) {
  if (!id) return null;

  let room = rooms.get(id);

  if (!room) {
    room = {
      id,
      players: new Map(),
      order: [],
      phase: "lobby",
      ranking: [],

      deck: [],
      lastWord: "",
      lastKana: "",
      lastCardType: "",
      usedWords: new Set(),

      locked: false,
      history: [],
    };
    rooms.set(id, room);
  }

  return room;
}