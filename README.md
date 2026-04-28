
# 🚁 Drone Ground Control Station

A real-time web-based ground control interface for monitoring and controlling an unmanned aircraft system (UAS). Built as a portfolio project showcasing modern web technologies for real-time telemetry, websockets, mapping, and UI/UX for control systems.

## 🎯 Features

- **Real-time Telemetry Display**: Live GPS coordinates, battery level, altitude, and drone status
- **Interactive Map**: Leaflet.js map with real-time drone position marker
- **WebSocket Communication**: Bidirectional real-time data streaming via Socket.io
- **Drone Control**: Takeoff, land, and emergency commands
- **Firebase Integration**: Real-time database sync for data persistence
- **Responsive UI**: Clean, modern control panel with status indicators
- **Battery Monitoring**: Visual battery level indicator with color coding
- **Status Tracking**: Real-time drone status (idle, flying, landing)

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
   - Control panel on the left with status, battery, altitude, GPS
   - Leaflet map on the right with drone marker
   - Real-time updates every 2 seconds
3. Click buttons to control the drone:
   - **Takeoff**: Starts flying, altitude increases, battery decreases
   - **Land**: Transitions to landing, altitude decreases
   - **Emergency**: Forces immediate landing

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
  socket.emit('control', 'takeoff' | 'land' | 'emergency')
  ```

#### Server → Client
- `drone-update` - Real-time telemetry data
  ```javascript
  {
    lat: number,        // Latitude
    lng: number,        // Longitude
    battery: number,    // Battery percentage (0-100)
    altitude: number,   // Altitude in meters
    status: string      // 'idle' | 'flying' | 'landing'
  }
  ```
- `command-ack` - Command acknowledgment
  ```javascript
  { command: string, status: string }
  ```

## 🎨 UI/UX Highlights

- **Gradient Control Panel**: Purple gradient background for modern look
- **Real-time Status Indicators**: Animated connection status dot
- **Color-coded Battery**: Green (>50%), Orange (25-50%), Red (<25%)
- **Status Colors**: Blue (flying), Orange (landing), Green (idle)
- **Responsive Design**: Works on desktop and tablet
- **Leaflet Map**: OpenStreetMap with custom drone marker (helicopter emoji)

## ⚙️ Server Simulation Details

The backend simulates a real drone with:
- **GPS Drift**: Random small movements to simulate real GPS variance
- **Battery Drain**: 1% per 2 seconds while flying, 0.5% while landing
- **Altitude Changes**: Gradual climb during takeoff, descent during landing
- **Status Transitions**: Proper state management (idle → flying → landing → idle)

## 📝 Notes

- The server simulates drone data; no real drone hardware required
- Firebase auto-syncs data across multiple clients
- Socket.io automatically reconnects if connection is lost
- GPS coordinates start at London (51.505, -0.09) and drift randomly

## 🔮 Future Enhancements

- [ ] Multi-drone support
- [ ] Mission planning UI
- [ ] Real drone integration (via MAVLink protocol)
- [ ] Live video feed integration
- [ ] Historical telemetry playback
- [ ] Advanced flight path planning
- [ ] Weather integration
- [ ] No-fly zone definitions

---

**Ready to run?** Follow the "Running Locally" section above!


