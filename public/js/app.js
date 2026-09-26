let songLibrary = [];
let hasInteracted = false;

async function loadSongs() {
  const response = await fetch("/api/songs");
  songLibrary = await response.json();
  setupAddSongButton();
}

async function loadState() {
  const response = await fetch("/api/state");
  const state = await response.json();
  renderNowPlaying(state.currentSong);
  renderQueue(state.queue);
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
  const response = await fetch("/api/add-song", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ songId }),
  });
  const state = await response.json();
  renderNowPlaying(state.currentSong);
  renderQueue(state.queue);
}

async function skipSong() {
  const response = await fetch("/api/skip", { method: "POST" });
  const state = await response.json();
  renderNowPlaying(state.currentSong);
  renderQueue(state.queue);
}

function setupSkipButton() {
  const skipButton = document.getElementById("skip-btn");
  skipButton.addEventListener("click", () => {
    hasInteracted = true;
    skipSong();
  });
}

function renderNowPlaying(currentSong) {
  const titleEl = document.getElementById("current-title");
  const artistEl = document.getElementById("current-artist");
  const artworkEl = document.getElementById("artwork");
  const audioPlayer = document.getElementById("audio-player");

  if (currentSong === null) {
  titleEl.textContent = "No song playing";
  artistEl.textContent = "";
  artworkEl.src = "";
  audioPlayer.src = "";
  return;
}

  titleEl.textContent = currentSong.title;
  artistEl.textContent = currentSong.artist;
  artworkEl.src = `images/${currentSong.image}`;

  const newSrc = `audio/${currentSong.file}`;
  const isNewSong = !audioPlayer.src.endsWith(newSrc);

  if (isNewSong) {
    audioPlayer.src = newSrc;

    if (hasInteracted) {
      audioPlayer.play();
      document.getElementById("play-pause-btn").textContent = "Pause";
    }
  }

  audioPlayer.onended = skipSong;
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
    songText.textContent = `${song.title} — ${song.artist}`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeSong(index));

    li.appendChild(songText);
    li.appendChild(removeBtn);
    queueList.appendChild(li);
  });
}

async function removeSong(index) {
  const response = await fetch("/api/remove-song", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  });
  const state = await response.json();
  renderNowPlaying(state.currentSong);
  renderQueue(state.queue);
}

function setupPlayPauseButton() {
  const playPauseButton = document.getElementById("play-pause-btn");
  const audioPlayer = document.getElementById("audio-player");

  playPauseButton.addEventListener("click", () => {
    hasInteracted = true;

    if (audioPlayer.paused) {
      audioPlayer.play();
      playPauseButton.textContent = "Pause";
    } else {
      audioPlayer.pause();
      playPauseButton.textContent = "Play";
    }
  });
}

function setupProgressBar() {
  const progressBar = document.getElementById("progress-bar");
  const audioPlayer = document.getElementById("audio-player");

  audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration) {
      const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progressBar.value = percent;
    }
  });

  progressBar.addEventListener("input", () => {
    if (audioPlayer.duration) {
      const seekTime = (progressBar.value / 100) * audioPlayer.duration;
      audioPlayer.currentTime = seekTime;
    }
  });
}

function setupVolumeSlider() {
  const volumeSlider = document.getElementById("volume-slider");
  const audioPlayer = document.getElementById("audio-player");

  audioPlayer.volume = volumeSlider.value / 100;

  volumeSlider.addEventListener("input", () => {
    audioPlayer.volume = volumeSlider.value / 100;
  });
}

const socket = io();

socket.on("state-update", (state) => {
  renderNowPlaying(state.currentSong);
  renderQueue(state.queue);
});

loadSongs();
setupSkipButton();
setupPlayPauseButton();
setupProgressBar();
setupVolumeSlider();