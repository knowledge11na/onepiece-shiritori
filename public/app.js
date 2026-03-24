let selectedCard = null;
let ws;
let playerId = Math.random().toString(36).slice(2);

function join() {
  const nameInput = document.getElementById("name");
  const roomInput = document.getElementById("room");

  ws = new WebSocket("ws://" + location.host);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "join",
      roomId: roomInput.value,
      playerId,
      name: nameInput.value || "名無し"
    }));
  };

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);

  if (msg.type === "state") {
    const s = msg.state;

    // 開始文字
    document.getElementById("kana").innerText = s.lastKana || "-";

    // 場の単語
 const field = document.getElementById("field");
field.innerHTML = "";

if (s.lastWord) {
  const card = document.createElement("div");
  card.className = "card";

  const type = document.createElement("div");
  type.className = "card-type";
  type.textContent = s.lastCardType || "-";

  const word = document.createElement("div");
  word.className = "card-word";
  word.textContent = s.lastWord;

  card.appendChild(type);
  card.appendChild(word);
  field.appendChild(card);
}


    // プレイヤー
    const pEl = document.getElementById("players");
    pEl.innerHTML = "";
    s.players.forEach(p => {
      const div = document.createElement("div");
      div.textContent =
  `${p.name}（${p.count}枚）` +
  (p.rank ? ` 🏆${p.rank}位` : "") +
  (p.isMe ? " ←あなた" : "");
      pEl.appendChild(div);
    });

    // 手札
    renderHand(s.myHand);
  }
};
} 

function start() {
  const roomInput = document.getElementById("room");
  ws.send(JSON.stringify({ type: "start", roomId: roomInput.value }));
}

function play() {
  const roomInput = document.getElementById("room");
  const wordInput = document.getElementById("word");

  if (!selectedCard) {
    alert("カードを選択してください");
    return;
  }

  if (!wordInput.value) {
    alert("言葉を入力してください");
    return;
  }

  ws.send(JSON.stringify({
    type: "play",
    roomId: roomInput.value,
    word: wordInput.value,
    cardId: selectedCard.id,
    cardType: selectedCard.type
  }));

selectedCard = null;

// 見た目リセット
document.querySelectorAll("#hand button").forEach(b => {
  b.style.border = "2px solid #333";
});
}

function renderHand(hand) {
  const el = document.getElementById("hand");
  el.innerHTML = "";

  hand.forEach(card => {
    const btn = document.createElement("button");

    btn.textContent = card.type;

    // 左クリック＝選択
    btn.onclick = () => {
      selectedCard = card;

      // 全部リセット
      document.querySelectorAll("#hand button").forEach(b => {
        b.style.border = "2px solid #333";
      });

      // 選択中
      btn.style.border = "3px solid red";

document.getElementById("selected").innerText =
  "選択中：" + card.type;
    };


    el.appendChild(btn);
  });
}
function undo() {
  ws.send(JSON.stringify({
    type: "undo",
    roomId: document.getElementById("room").value
  }));
}

function discard() {
  if (!selectedCard) {
    alert("カードを選択してください");
    return;
  }

  ws.send(JSON.stringify({
    type: "discard",
    roomId: document.getElementById("room").value,
    cardId: selectedCard.id
  }));

  selectedCard = null;
}

function restart() {
  ws.send(JSON.stringify({
    type: "start",
    roomId: document.getElementById("room").value
  }));
}
