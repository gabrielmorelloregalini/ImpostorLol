const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ---------- SERVIR PUBLIC ---------- */
app.use(express.static(path.join(__dirname, "public")));

/* ---------- RUTA PRINCIPAL ---------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let rooms = {};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ---------- FETCH FIX PARA RENDER ---------- */
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

/* ---------- API LOL ---------- */
async function getRandomChampion() {
  try {
    const res = await fetch(
      "https://ddragon.leagueoflegends.com/cdn/12.6.1/data/en_US/champion.json"
    );
    const data = Object.values((await res.json()).data);
    return data[randomInt(0, data.length - 1)].name;
  } catch {
    return "Fallback";
  }
}

io.on("connection", (socket) => {

  socket.on("createRoom", ({ name }) => {
    const roomId = socket.id;

    rooms[roomId] = {
      host: socket.id,
      players: [{ id: socket.id, name }]
    };

    socket.join(roomId);
    socket.data.roomId = roomId;

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("players", rooms[roomId].players);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    const room = rooms[roomId];

    if (!room || !name) {
      socket.emit("errorMsg", "Sala inválida");
      return;
    }

    room.players.push({ id: socket.id, name });

    socket.join(roomId);
    socket.data.roomId = roomId;

    io.to(roomId).emit("players", room.players);
  });

  socket.on("startGame", async ({ impostors }) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];

    if (!room) return;

    if (socket.id !== room.host) {
      socket.emit("errorMsg", "Solo el host puede iniciar");
      return;
    }

    const secretWord = await getRandomChampion();

    let impostorIndexes = [];
    while (impostorIndexes.length < impostors) {
      const i = randomInt(0, room.players.length - 1);
      if (!impostorIndexes.includes(i)) impostorIndexes.push(i);
    }

    room.players.forEach((p, i) => {
      if (impostorIndexes.includes(i)) {
        io.to(p.id).emit("role", { role: "impostor" });
      } else {
        io.to(p.id).emit("role", {
          role: "player",
          word: secretWord
        });
      }
    });

    io.to(roomId).emit("gameStarted");
  });
});

/* ---------- PUERTO RENDER ---------- */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});