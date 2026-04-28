
# 🚁 Drone Ground Control Station

A real-time web-based ground control interface for monitoring and controlling an unmanned aircraft system (UAS). Built as a portfolio project showcasing modern web technologies for real-time telemetry, websockets, mapping, and UI/UX for control systems.

## 🎯 Features

- **Real-time Telemetry Display**: Live GPS coordinates, battery level, altitude, speed, and drone status
- **Interactive Map**: Leaflet.js map with real-time drone position marker and home base
- **WebSocket Communication**: Bidirectional real-time data streaming via Socket.io
- **Drone Control**: Takeoff, land, return to base, and emergency commands
- **Firebase Integration**: Real-time database sync for data persistence
- **Responsive UI**: Clean, modern control panel with status indicators
- **Battery Monitoring**: Visual battery level indicator with color coding and auto-recharge
- **Status Tracking**: Real-time drone status (idle, flying, landing, returning)
- **Home Base System**: Automatic return-to-base when battery < 10%, recharging at base
- **Speed Monitoring**: Real-time speed calculation with max speed display
- **Route Planning**: Set waypoints/coordinates with visual route lines on map
- **Map Controls**: Center view on drone, zoom controls, and GPS coordinate display

## 🛠 Tech Stack

### Frontend
- **React** - UI framework
- **Leaflet.js** - Interactive mapping
- **Socket.io-client** - Real-time WebSocket communication
- **Firebase** - Real-time database

### Backend
- **Node.js** - Server runtime
- **Express.js** - HTTP server
- **Socket.io** - WebSocket server
- **CORS** - Cross-origin resource sharing

### Deployment
- **Firebase Hosting** - Frontend deployment
- **Railway/Render** - Backend deployment (optional for production)

## 📁 Project Structure

```
drone-test/
├── client/                 # React frontend app
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styling
│   │   └── index.js
│   └── package.json
├── server/                # Node.js backend
│   ├── index.js          # Server with Socket.io
│   └── package.json
├── firebase.json         # Firebase config
├── database.rules.json   # Realtime Database rules
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Firebase account
- Git

### Installation

1. **Navigate to project**
   ```bash
   cd f:\Projects\Developer\drone-test
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Firebase is already initialized** (`firebase init` already run)

## 🏃 Running Locally

### Terminal 1: Start Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:3001
```

### Terminal 2: Start Frontend App
```bash
cd client
npm start
# App opens on http://localhost:3000
```

### Testing
1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see:
   - Control panel on the left with status, battery, altitude, speed, GPS
   - Leaflet map on the right with drone (🚁) and home base (🏠) markers
   - Real-time updates every 2 seconds
3. Click buttons to control the drone:
   - **Takeoff**: Starts flying, altitude increases, battery decreases
   - **Return to Base**: Navigates back to home base coordinates
   - **Land**: Transitions to landing, altitude decreases
   - **Emergency**: Forces immediate landing
   - **Center View**: Centers map on drone position
4. Set routes by entering coordinates or clicking on map
5. Watch battery auto-recharge when drone returns to home base

## 📦 Building for Deployment

### Build Frontend
```bash
cd client
npm run build
# Creates optimized build in client/build/
```

### Deploy to Firebase Hosting
```bash
# From project root
firebase deploy
# Deploys frontend to Firebase Hosting
# View at: https://uav-test-5b5e9.web.app
```

### Deploy Backend
For production, deploy the backend server to:
- **Railway** (recommended)
- **Render**
- **Heroku** (legacy)

Then update the socket connection URL in `client/src/App.js`.

## 🔌 API Documentation

### WebSocket Events

#### Client → Server
- `control` - Send drone commands
  ```javascript
  socket.emit('control', 'takeoff' | 'land' | 'return' | 'emergency')
  ```
- `set-route` - Set destination coordinates
  ```javascript
  socket.emit('set-route', { lat: number, lng: number })
  ```

#### Server → Client
- `drone-update` - Real-time telemetry data
  ```javascript
  {
    lat: number,        // Latitude
    lng: number,        // Longitude
    battery: number,    // Battery percentage (0-100)
    altitude: number,   // Altitude in meters
    status: string,     // 'idle' | 'flying' | 'landing' | 'returning'
    speed: number,      // Current speed in km/h
    maxSpeed: number    // Maximum speed in km/h
  }
  ```
- `command-ack` - Command acknowledgment
  ```javascript
  { command: string, status: string }
  ```
- `route-ack` - Route setting acknowledgment
  ```javascript
  { destination: { lat: number, lng: number }, status: string }
  ```

## 🎨 UI/UX Highlights

- **Gradient Control Panel**: Purple gradient background for modern look
- **Real-time Status Indicators**: Animated connection status dot
- **Color-coded Battery**: Green (>50%), Orange (25-50%), Red (<25%)
- **Status Colors**: Blue (flying), Orange (landing), Deep Orange (returning), Green (idle)
- **Speed Display**: Real-time speed with max speed indicator
- **Home Base Marker**: 🏠 icon on map at Naissaare Tuletorn coordinates
- **Route Visualization**: Polyline drawing from drone to destination
- **Map Centering**: Button to center view on drone position
- **Responsive Design**: Works on desktop and tablet
- **Leaflet Map**: OpenStreetMap with custom markers and route lines

## ⚙️ Server Simulation Details

The backend simulates a real drone with:
- **GPS Drift**: Random small movements to simulate real GPS variance
- **Battery Drain**: Realistic consumption based on flight mode:
  - Normal flight: ~0.2% per 2 seconds (1-2 hour flight time)
  - Route following: ~0.4% per 2 seconds (higher consumption)
  - Return to base: ~0.3% per 2 seconds (medium consumption)
  - Landing: ~0.1% per 2 seconds (minimal consumption)
- **Auto-Recharge**: 0.5% per 2 seconds when idle at home base
- **Altitude Changes**: Gradual climb during takeoff, descent during landing
- **Speed Calculation**: Real-time km/h based on GPS movement (max 65 km/h)
- **Status Transitions**: Proper state management (idle → flying → landing → idle)
- **Home Base**: Naissaare Tuletorn (59.603778°N 24.510694°E) with auto-return when battery < 10%
- **Route Following**: Direct navigation to set waypoints with visual route lines

## 📝 Notes

- The server simulates drone data; no real drone hardware required
- Firebase auto-syncs data across multiple clients
- Socket.io automatically reconnects if connection is lost
- GPS coordinates start at Naissaare Tuletorn home base (59.603778°N 24.510694°E)
- Battery auto-recharges when drone is idle at home base
- Speed calculations are based on real GPS movement simulation
- Route waypoints can be set by clicking coordinates on the map

## 🔮 Future Enhancements

- [x] Return-to-base functionality
- [x] Battery auto-recharge system
- [x] Speed monitoring and display
- [x] Route planning and waypoint navigation
- [x] Home base system with coordinates
- [ ] Multi-drone support
- [ ] Real drone integration (via MAVLink protocol)
- [ ] Live video feed integration
- [ ] Historical telemetry playback
- [ ] Advanced flight path planning with multiple waypoints
- [ ] Weather integration
- [ ] No-fly zone definitions
- [ ] Mission planning UI with save/load functionality
- [ ] Altitude hold and automated flight patterns

---

**Ready to run?** Follow the "Running Locally" section above!


