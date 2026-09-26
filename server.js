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

app.use(express.static("public"));
app.use(express.json());

app.get("/api/songs", (req, res) => {
  res.json(songLibrary);
});

app.get("/api/state", (req, res) => {
  res.json({ queue, currentSong });
});

function broadcastState() {
  io.emit("state-update", { queue, currentSong });
}

app.post("/api/add-song", (req, res) => {
  const songId = req.body.songId;
  const requester = req.body.requester || "Anonymous";
  const song = songLibrary.find((s) => s.id === songId);

  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }

  const songWithRequester = { ...song, requester };

  if (currentSong === null) {
    currentSong = songWithRequester;
  } else {
    queue.push(songWithRequester);
  }

  broadcastState();
  res.json({ queue, currentSong });
});

app.post("/api/skip", (req, res) => {
  currentSong = queue.shift() || null;
  broadcastState();
  res.json({ queue, currentSong });
});

app.post("/api/remove-song", (req, res) => {
  const index = req.body.index;
  queue.splice(index, 1);
  broadcastState();
  res.json({ queue, currentSong });
});

io.on("connection", (socket) => {
  socket.emit("state-update", { queue, currentSong });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});