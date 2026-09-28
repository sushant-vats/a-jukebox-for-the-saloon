const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const songLibrary = require("./server/songLibrary");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let queue = [];
let currentSong = null;
let nextQueueId = 1;
let playback = { playing: false, position: 0, updatedAt: Date.now() };

app.use(express.static("public"));
app.use(express.json());

function getPosition() {
  if (!playback.playing) return playback.position;
  return playback.position + (Date.now() - playback.updatedAt) / 1000;
}

function getState() {
  return {
    queue,
    currentSong,
    playing: playback.playing,
    position: getPosition(),
  };
}

function broadcastState() {
  io.emit("state-update", getState());
}

function startCurrentSong() {
  playback = {
    playing: currentSong !== null,
    position: 0,
    updatedAt: Date.now(),
  };
}

function advanceToNextSong() {
  currentSong = queue.shift() || null;
  startCurrentSong();
}

app.get("/api/songs", (req, res) => {
  res.json(songLibrary);
});

app.get("/api/state", (req, res) => {
  res.json(getState());
});

app.post("/api/add-song", (req, res) => {
  const songId = req.body.songId;
  const requester =
    String(req.body.requester || "Anonymous").trim().slice(0, 30) || "Anonymous";
  const song = songLibrary.find((s) => s.id === songId);

  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }

  const songWithRequester = { ...song, requester, queueId: nextQueueId++ };

  if (currentSong === null) {
    currentSong = songWithRequester;
    startCurrentSong();
  } else {
    queue.push(songWithRequester);
  }

  broadcastState();
  res.json(getState());
});

app.post("/api/skip", (req, res) => {
  advanceToNextSong();
  broadcastState();
  res.json(getState());
});

app.post("/api/remove-song", (req, res) => {
  const index = req.body.index;

  if (!Number.isInteger(index) || index < 0 || index >= queue.length) {
    return res.status(400).json({ error: "Invalid index" });
  }

  queue.splice(index, 1);
  broadcastState();
  res.json(getState());
});

io.on("connection", (socket) => {
  socket.emit("state-update", getState());

  socket.on("play", () => {
    if (currentSong === null) return;
    playback = { playing: true, position: getPosition(), updatedAt: Date.now() };
    broadcastState();
  });

  socket.on("pause", () => {
    if (currentSong === null) return;
    playback = { playing: false, position: getPosition(), updatedAt: Date.now() };
    broadcastState();
  });

  socket.on("seek", (seconds) => {
    if (currentSong === null) return;
    if (typeof seconds !== "number" || seconds < 0) return;
    playback = { playing: playback.playing, position: seconds, updatedAt: Date.now() };
    broadcastState();
  });

  socket.on("song-ended", (queueId) => {
    if (currentSong && currentSong.queueId === queueId) {
      advanceToNextSong();
      broadcastState();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});