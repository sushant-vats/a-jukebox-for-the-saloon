# A jukebox for the Saloon

It is a real-time software jukebox which is built for the Hack Club Pixel YSWS trial.
The saloon has speakers but no way to play requests thats why this web app is built which ;ets everyone in the saloon queue up songs and listen together in the browser, with the queue synced Live across every connected device.

## Features

- The Queue is visible to everyone and it syncs with instantly with the help of WebSockets (Socket.I0)
- You can request a song from the library and attach your name to it.
- The songs plays with display artwork title and the artist.
- Play / pause / skip buttons
- a working Progress and volume bar
- You can also remove songs from the queue
- it automatically plays the next song when one ends
- A wild west saloon visulay theme 
- Responsive on mobile too

## Tech Stack

- **Frontent** HTML, CSS, vanilla Javascript
- **Backend** Node.js, Express
- **Real-time sync** Socket.I0

## Running Locally

```
npm install
node server.js
```
Then open `http://localhost:3000` in your browser.

## Audio

All songs and artwork used here are royalty-free & sourced for this project as sample tracks to demonstrate playback functionality.

## Built By

Sushant - as a Hack Club YSWS trial project.