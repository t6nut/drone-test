const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://uav-test-5b5e9.web.app',
  'https://uav-test-5b5e9.firebaseapp.com',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'drone-server' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Drone simulation state
let droneData = {
  lat: 59.603778, // Start near home base
  lng: 24.510694,
  battery: 100,
  altitude: 0,
  status: 'idle',
  speed: 0, // km/h
  maxSpeed: 65 // km/h
};

// Route state
let currentRoute = null; // { lat, lng } destination

// Home base coordinates (Naissaare tuletorn)
const homeBase = {
  lat: 59.603778,
  lng: 24.510694
};

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  
  // Send initial drone data
  socket.emit('drone-update', droneData);

  // Simulate drone movement and battery drain every 2 seconds
  const interval = setInterval(() => {
    let prevLat = droneData.lat;
    let prevLng = droneData.lng;

    // Check for low battery auto-return
    if (droneData.status === 'flying' && droneData.battery < 10) {
      droneData.status = 'returning';
      console.log('🔋 Low battery! Auto-returning to base');
    }

    if (droneData.status === 'returning') {
      // Move towards home base
      const latDiff = homeBase.lat - droneData.lat;
      const lngDiff = homeBase.lng - droneData.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distance > 0.0001) { // If not at base yet
        const step = 0.0003; // Movement step size for return
        droneData.lat += (latDiff / distance) * step;
        droneData.lng += (lngDiff / distance) * step;
        droneData.altitude = Math.min(100, droneData.altitude + 1);
        // Battery drain: 0.3% per 2 seconds when returning (medium usage)
        droneData.battery = Math.max(0, droneData.battery - 0.3);
      } else {
        // Arrived at base, start landing
        droneData.status = 'landing';
        console.log('🏠 Arrived at home base, landing');
      }
    } else if (droneData.status === 'flying') {
      if (currentRoute) {
        // Move towards route destination
        const latDiff = currentRoute.lat - droneData.lat;
        const lngDiff = currentRoute.lng - droneData.lng;
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        
        if (distance > 0.0001) {
          const step = 0.0004; // Faster movement for route following
          droneData.lat += (latDiff / distance) * step;
          droneData.lng += (lngDiff / distance) * step;
          droneData.altitude = Math.min(100, droneData.altitude + 1);
          // Battery drain: 0.4% per 2 seconds when following route (higher usage)
          droneData.battery = Math.max(0, droneData.battery - 0.4);
        } else {
          // Arrived at destination
          currentRoute = null;
          console.log('🎯 Arrived at route destination');
        }
      } else {
        // Random movement (simulate GPS drift)
        droneData.lat += (Math.random() - 0.5) * 0.0002;
        droneData.lng += (Math.random() - 0.5) * 0.0002;
        droneData.altitude = Math.min(100, droneData.altitude + 1);
        // Battery drain: 0.2% per 2 seconds for random flight (normal usage)
        droneData.battery = Math.max(0, droneData.battery - 0.2);
      }
    } else if (droneData.status === 'landing') {
      droneData.altitude = Math.max(0, droneData.altitude - 2);
      droneData.battery = Math.max(0, droneData.battery - 0.1); // Minimal drain when landing
      if (droneData.altitude === 0) {
        droneData.status = 'idle';
        console.log('🛬 Drone landed');
      }
    } else if (droneData.status === 'idle') {
      // Check if at home base for recharging
      const latDiff = homeBase.lat - droneData.lat;
      const lngDiff = homeBase.lng - droneData.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distance < 0.0001 && droneData.battery < 100) {
        // At home base and needs charging
        droneData.battery = Math.min(100, droneData.battery + 0.5); // Recharge 0.5% per 2 seconds (slower)
        console.log(`🔋 Recharging: ${droneData.battery.toFixed(1)}%`);
      }
    }

    // Calculate speed based on movement (km/h)
    const latChange = droneData.lat - prevLat;
    const lngChange = droneData.lng - prevLng;
    const distanceMoved = Math.sqrt(latChange * latChange + lngChange * lngChange);
    // 1 degree ≈ 111km, so distance in km = distanceMoved * 111
    // Speed = distance per 2 seconds * 1800 (to get per hour)
    droneData.speed = Math.round(distanceMoved * 111 * 1800);

    socket.emit('drone-update', droneData);
  }, 2000);

  // Handle commands from client
  socket.on('control', (command) => {
    console.log('📡 Command received:', command);
    
    if (command === 'takeoff' && droneData.status === 'idle') {
      droneData.status = 'flying';
      console.log('✈️ Drone taking off');
    } else if (command === 'land' && droneData.status === 'flying') {
      droneData.status = 'landing';
      console.log('🛬 Drone landing');
    } else if (command === 'return' && (droneData.status === 'flying' || droneData.status === 'idle')) {
      droneData.status = 'returning';
      console.log('🏠 Returning to base');
    } else if (command === 'emergency') {
      droneData.status = 'landing';
      droneData.altitude = 0;
      console.log('🚨 Emergency landing initiated');
    }
    
    socket.emit('command-ack', { command, status: droneData.status });
  });

  // Handle route setting
  socket.on('set-route', (destination) => {
    console.log('🗺️ Route set to:', destination);
    currentRoute = destination;
    if (droneData.status === 'idle') {
      droneData.status = 'flying';
      console.log('✈️ Drone taking off for route');
    }
    socket.emit('route-ack', { destination, status: droneData.status });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Drone server running on http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
