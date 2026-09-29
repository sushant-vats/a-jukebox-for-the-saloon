# A jukebox for the Saloon

A shared web jukebox where everyone in the saloon can request songs, manage one shared queue, and listen to the same music together in the browser.

## Description

A Jukebox for the Saloon is a web-based shared music player built for the Hack Club Pixel YSWS trial. Everyone opens the same website and can add songs from the available library to a shared queue. The current song, queue, playback state, and other controls stay synchronized between connected devices using real-time communication. The project has a Wild West saloon theme and is designed to work on both desktop and mobile devices.

**Live demo:** https://jukebox.sushant-vats.hackclub.app

## Screenshots

![Two devices in sync](screenshots/synced.png)
![Mobile view](screenshots/mobile.jpeg)

# Getting Started

## Dependencies
- npm
- A modern web browser
- Internet connection for the live version
- Works on Windows, macOS, and Linux

## Installing

1. Clone or download the project from GitHub.
2. Open the project folder in VS Code or another code editor.
3. Open a terminal inside the project folder.
4. Install the required packages:

npm install

No additional configuration is required for the basic local version.

## Executing program

1. Open the project folder in your terminal.
2. Start the server:

node server.js

3. Open your browser.
4. Go to:

http://localhost:3000

5. Open the same address on another device if you want to test the real-time synchronization.
6. On each device, press "Tap to Join Music" once to allow the browser to play audio.

# Help

## Common problems
1. The music does not start

Make sure you have clicked "Tap to Join Music". Browsers usually block audio playback until the user interacts with the page.

2. The queue is not syncing

Make sure both devices are connected to the same running server and have a stable internet/network connection.

3. The queue disappeared

The queue is stored in the server's memory, so it resets whenever the server restarts.

4. Someone skipped or removed a song

There is currently no login or permission system, so anyone connected to the jukebox can use the queue controls.

# License

This project is made by Sushant for HackClub Pixel YSWS program!