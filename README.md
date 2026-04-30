# Drone Ground Control Station

A real-time web-based ground control interface for a simulated unmanned aircraft system. The app shows live telemetry, an interactive map, route controls, and command buttons for a drone simulation.

The current production setup uses Firebase Hosting for the React frontend and Railway for the Node.js Socket.IO backend.

## Features

- Real-time telemetry for GPS position, battery, altitude, speed, and flight status
- Interactive Leaflet map with drone, home base, and route destination markers
- Socket.IO connection between the React frontend and Railway backend
- Drone commands for takeoff, return to base, land, and emergency landing
- Route planning by entering latitude and longitude
- Home-base behavior at Naissaare lighthouse coordinates
- Automatic low-battery return-to-base behavior
- Battery drain, recharge, landing, and movement simulation
- Firebase Realtime Database read path for shared telemetry fallback
- Hover tooltips on control buttons
- Health endpoints for Railway deployment checks

## Tech Stack

### Frontend

- React
- React Leaflet and Leaflet
- Socket.IO client
- Firebase Realtime Database client
- Firebase Hosting

### Backend

- Node.js
- Express
- Socket.IO
- CORS
- Railway

## Project Structure

```text
drone-test/
  client/                 React frontend
    src/
      App.js              Main app component
      App.css             App styling
      index.js            React entrypoint
    package.json
  server/                 Railway backend
    index.js              Express and Socket.IO server
    package.json
  .github/workflows/
    firebase-hosting-push.yml
  database.rules.json     Firebase Realtime Database rules
  firebase.json           Firebase Hosting config
  railway.json            Railway deploy config
  README.md
```

## Local Development

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd client
npm install
```

Start the backend:

```bash
cd server
npm start
```

The local backend listens on:

```text
http://localhost:3001
```

Start the frontend:

```bash
cd client
npm start
```

The React dev server usually opens at:

```text
http://localhost:3000
```

The frontend reads `REACT_APP_BACKEND_URL` from `client/.env`. If it is not set, it falls back to `http://localhost:3001`.

## Production URLs

Frontend:

```text
https://uav-test-5b5e9.web.app
```

Backend:

```text
https://drone-test-production.up.railway.app
```

Useful backend checks:

```text
https://drone-test-production.up.railway.app/
https://drone-test-production.up.railway.app/health
https://drone-test-production.up.railway.app/socket-probe
```

Expected `/health` response:

```json
{ "status": "ok" }
```

## Deployment

### Firebase Hosting

Firebase Hosting deploys the frontend from GitHub Actions on pushes to `main`.

The workflow runs:

```bash
cd client && npm ci && npm run build
```

Then it deploys `client/build` to Firebase Hosting using `FirebaseExtended/action-hosting-deploy@v0`.

The React build needs these environment values:

- `REACT_APP_BACKEND_URL`
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_DATABASE_URL`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`

### Railway Backend

Railway is the chosen backend host for the Socket.IO server.

Recommended Railway service settings:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Healthcheck Path: `/health`
- Public Networking target port: the port shown in the Railway app log, currently `8080`

The server uses `process.env.PORT` in production and falls back to `3001` locally.

## Firebase Realtime Database

The browser client listens to `/drone` as a read-only telemetry fallback. Public browser writes are disabled.

Current rule shape:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "drone": {
      ".read": true,
      ".write": false
    }
  }
}
```

Deploy database rules manually when they change:

```bash
firebase deploy --only database
```

## Backend API

### HTTP

- `GET /` returns service status
- `GET /health` returns health status for Railway
- `GET /socket-probe` confirms regular HTTP routing to the backend
- `GET /favicon.ico` returns no content

### Socket.IO Events

Client to server:

```javascript
socket.emit('control', 'takeoff' | 'land' | 'return' | 'emergency');
socket.emit('set-route', { lat: number, lng: number });
```

Server to client:

```javascript
socket.on('drone-update', {
  lat: number,
  lng: number,
  battery: number,
  altitude: number,
  status: 'idle' | 'flying' | 'landing' | 'returning',
  speed: number,
  maxSpeed: number
});
```

Acknowledgement events:

```javascript
socket.on('command-ack', { command: string, status: string });
socket.on('route-ack', { destination: { lat: number, lng: number }, status: string });
```

## Simulation Notes

- The drone starts at Naissaare lighthouse: `59.603778, 24.510694`
- Normal flight drains battery by about `0.2%` every two seconds
- Route following drains battery by about `0.4%` every two seconds
- Return-to-base drains battery by about `0.3%` every two seconds
- Landing drains battery by about `0.1%` every two seconds
- Idle drone at home base recharges by about `0.5%` every two seconds
- Low battery below `10%` automatically switches the drone to returning
- Speed is estimated from simulated GPS movement

## Troubleshooting

If the frontend shows Socket.IO CORS errors with a `502 Bad Gateway`, check the backend URL directly first:

```text
https://drone-test-production.up.railway.app/health
```

If `/health` is also `502`, the problem is Railway routing or service configuration, not React CORS.

The Railway public networking target port must match the deployed app port in the logs. In the current deployment this was `8080`.

If Firebase logs `permission_denied`, check whether the browser is attempting a write to a protected path or whether the Realtime Database rules have been deployed.

## Future Ideas

- Multi-drone support
- MAVLink or real drone integration
- Live video feed
- Historical telemetry playback
- Multi-waypoint mission planning
- Weather and wind overlays
- No-fly-zone overlays
- Saved missions
