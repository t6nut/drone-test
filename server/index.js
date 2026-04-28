const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// Drone simulation state
let droneData = {
  lat: 59.603778, // Start near home base
  lng: 24.510694,
  battery: 100,
  altitude: 0,
  status: 'idle'
};

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
        const step = 0.0002; // Movement step size
        droneData.lat += (latDiff / distance) * step;
        droneData.lng += (lngDiff / distance) * step;
        droneData.altitude = Math.min(100, droneData.altitude + 1);
        droneData.battery = Math.max(0, droneData.battery - 1.5); // Faster drain when returning
      } else {
        // Arrived at base, start landing
        droneData.status = 'landing';
        console.log('🏠 Arrived at home base, landing');
      }
    } else if (droneData.status === 'flying') {
      // Random movement (simulate GPS drift)
      droneData.lat += (Math.random() - 0.5) * 0.0005;
      droneData.lng += (Math.random() - 0.5) * 0.0005;
      droneData.altitude = Math.min(100, droneData.altitude + 1);
      droneData.battery = Math.max(0, droneData.battery - 1);
    } else if (droneData.status === 'landing') {
      droneData.altitude = Math.max(0, droneData.altitude - 2);
      droneData.battery = Math.max(0, droneData.battery - 0.5);
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
        droneData.battery = Math.min(100, droneData.battery + 2); // Recharge 2% per 2 seconds
        console.log(`🔋 Recharging: ${droneData.battery.toFixed(1)}%`);
      }
    }

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

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚁 Drone server running on http://localhost:${PORT}`);
});