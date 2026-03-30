const socket = io(window.location.origin);

let roomId = "";
let name = "";
let roleData = null;

/* ---------- CREAR SALA ---------- */
function crearSala() {
  name = document.getElementById("name").value.trim();

  if (!name) {
    alert("Ingresá un nombre");
    return;
  }

  const btn = document.querySelector("button[onclick='crearSala()']");
  btn.disabled = true;
  btn.textContent = "Creando...";

  socket.emit("createRoom", { name });
}

/* ---------- UNIRSE ---------- */
function unirseSala() {
  name = document.getElementById("name").value.trim();
  roomId = document.getElementById("roomInput").value.trim();

  if (!name || !roomId) {
    alert("Completá los datos");
    return;
  }

  const btn = document.querySelector("button[onclick='unirseSala()']");
  btn.disabled = true;
  btn.textContent = "Uniéndose...";

  socket.emit("joinRoom", { roomId, name });
}

/* ---------- SALA CREADA ---------- */
socket.on("roomCreated", (id) => {
  roomId = id;

  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");

  document.getElementById("roomCode").textContent = id;
});

/* ---------- ACTUALIZAR JUGADORES ---------- */
socket.on("players", (players) => {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  players.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.name;
    list.appendChild(li);
  });

  document.getElementById("home").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
});

/* ---------- INICIAR JUEGO ---------- */
function startGame() {
  const impostors = Number(document.getElementById("impostors").value);

  const btn = document.querySelector("button[onclick='startGame()']");
  btn.disabled = true;
  btn.textContent = "Iniciando...";

  socket.emit("startGame", { impostors });
}

/* ---------- JUEGO INICIADO ---------- */
socket.on("gameStarted", () => {
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
});

/* ---------- RECIBIR ROL ---------- */
socket.on("role", (data) => {
  roleData = data;
});

/* ---------- CARTA ---------- */
const card = document.getElementById("card");
const cardBack = document.getElementById("cardBack");

let showing = false;

card.onclick = () => {
  if (!roleData) return;

  if (!showing) {
    card.classList.add("flipped");

    if (roleData.role === "impostor") {
      cardBack.textContent = "IMPOSTOR";
      cardBack.classList.add("impostor");
    } else {
      cardBack.textContent = roleData.word;
    }

    showing = true;
  } else {
    card.classList.remove("flipped");
    showing = false;
  }
};

/* ---------- ERRORES ---------- */
socket.on("errorMsg", (msg) => {
  alert(msg);

  // reactivar botones
  const createBtn = document.querySelector("button[onclick='crearSala()']");
  if (createBtn) {
    createBtn.disabled = false;
    createBtn.textContent = "Crear sala";
  }

  const joinBtn = document.querySelector("button[onclick='unirseSala()']");
  if (joinBtn) {
    joinBtn.disabled = false;
    joinBtn.textContent = "Unirse";
  }

  const startBtn = document.querySelector("button[onclick='startGame()']");
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = "Empezar";
  }
});