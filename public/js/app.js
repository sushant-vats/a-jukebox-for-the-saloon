let songLibrary = [];
let hasInteracted = false;
let lastState = { queue: [], currentSong: null, playing: false, position: 0 };
let lastStateTime = Date.now();
let currentQueueId = null;

const socket = io();
const audioPlayer = document.getElementById("audio-player");
const playPauseButton = document.getElementById("play-pause-btn");
const joinButton = document.getElementById("join-btn");
const progressBar = document.getElementById("progress-bar");

function expectedPosition() {
  if (!lastState.playing) return lastState.position;
  return lastState.position + (Date.now() - lastStateTime) / 1000;
}

socket.on("state-update", (state) => {
  lastState = state;
  lastStateTime = Date.now();
  renderNowPlaying(state.currentSong);
  renderQueue(state.queue);
  syncAudio();
});

function syncAudio() {
  const song = lastState.currentSong;

  if (!song) {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    currentQueueId = null;
    playPauseButton.textContent = "Play";
    joinButton.classList.add("hidden");
    progressBar.value = 0;
    return;
  }

  if (song.queueId !== currentQueueId) {
    currentQueueId = song.queueId;
    audioPlayer.src = `audio/${song.file}`;
    audioPlayer.addEventListener(
      "loadedmetadata",
      () => {
        audioPlayer.currentTime = expectedPosition();
      },
      { once: true }
    );
  } else if (audioPlayer.readyState > 0) {
    const drift = Math.abs(audioPlayer.currentTime - expectedPosition());
    const limit = lastState.playing ? 1.5 : 0.3;
    if (drift > limit) {
      audioPlayer.currentTime = expectedPosition();
    }
  }

  playPauseButton.textContent = lastState.playing ? "Pause" : "Play";
  joinButton.classList.toggle("hidden", hasInteracted || !lastState.playing);

  if (hasInteracted && lastState.playing) {
    audioPlayer.play().catch(() => {});
  } else {
    audioPlayer.pause();
  }
}

function renderNowPlaying(currentSong) {
  const titleEl = document.getElementById("current-title");
  const artistEl = document.getElementById("current-artist");
  const artworkEl = document.getElementById("artwork");

  if (currentSong === null) {
    titleEl.textContent = "No song playing";
    artistEl.textContent = "";
    artworkEl.src = "";
    return;
  }

  titleEl.textContent = currentSong.title;
  artistEl.textContent = `${currentSong.artist} — requested by ${currentSong.requester}`;
  artworkEl.src = `images/${currentSong.image}`;
}

function renderQueue(queue) {
  const queueList = document.getElementById("queue-list");
  queueList.innerHTML = "";

  if (queue.length === 0) {
    const li = document.createElement("li");
    li.textContent = "The queue is empty.";
    queueList.appendChild(li);
    return;
  }

  queue.forEach((song, index) => {
    const li = document.createElement("li");

    const songText = document.createElement("span");
    songText.textContent = `${song.title} — ${song.artist} (requested by ${song.requester})`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeSong(index));

    li.appendChild(songText);
    li.appendChild(removeBtn);
    queueList.appendChild(li);
  });
}

async function loadSongs() {
  const response = await fetch("/api/songs");
  songLibrary = await response.json();
  setupAddSongButton();
}

function setupAddSongButton() {
  const addButton = document.getElementById("add-song-btn");
  const pickerList = document.getElementById("song-picker-list");

  addButton.addEventListener("click", () => {
    pickerList.classList.toggle("hidden");
    renderSongPicker(pickerList);
  });
}

function renderSongPicker(pickerList) {
  pickerList.innerHTML = "";

  songLibrary.forEach((song) => {
    const li = document.createElement("li");
    li.textContent = `${song.title} — ${song.artist}`;

    li.addEventListener("click", async () => {
      hasInteracted = true;
      await addSong(song.id);
      pickerList.classList.add("hidden");
    });

    pickerList.appendChild(li);
  });
}

async function addSong(songId) {
  const requesterInput = document.getElementById("requester-name");
  const requester = requesterInput.value.trim() || "Anonymous";

  await fetch("/api/add-song", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ songId, requester }),
  });
}

async function removeSong(index) {
  await fetch("/api/remove-song", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  });
}

function setupSkipButton() {
  const skipButton = document.getElementById("skip-btn");
  skipButton.addEventListener("click", async () => {
    hasInteracted = true;
    await fetch("/api/skip", { method: "POST" });
  });
}

function joinMusic() {
  hasInteracted = true;
  syncAudio();
}

function setupJoinButton() {
  joinButton.addEventListener("click", joinMusic);
}

function setupPlayPauseButton() {
  playPauseButton.addEventListener("click", () => {
    if (!lastState.currentSong) return;

    if (!hasInteracted && lastState.playing) {
      joinMusic();
      return;
    }

    hasInteracted = true;
    socket.emit(lastState.playing ? "pause" : "play");
  });
}

function setupProgressBar() {
  audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration) {
      progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    }
  });

  progressBar.addEventListener("change", () => {
    if (audioPlayer.duration) {
      hasInteracted = true;
      const seekTime = (progressBar.value / 100) * audioPlayer.duration;
      socket.emit("seek", seekTime);
    }
  });
}

function setupVolumeSlider() {
  const volumeSlider = document.getElementById("volume-slider");

  audioPlayer.volume = volumeSlider.value / 100;

  volumeSlider.addEventListener("input", () => {
    audioPlayer.volume = volumeSlider.value / 100;
  });
}

audioPlayer.addEventListener("ended", () => {
  if (currentQueueId !== null) {
    socket.emit("song-ended", currentQueueId);
  }
});

loadSongs();
setupSkipButton();
setupJoinButton();
setupPlayPauseButton();
setupProgressBar();
setupVolumeSlider();