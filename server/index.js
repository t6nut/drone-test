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
  lat: 51.505,
  lng: -0.09,
  battery: 100,
  altitude: 0,
  status: 'idle'
};

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  
  // Send initial drone data
  socket.emit('drone-update', droneData);

  // Simulate drone movement and battery drain every 2 seconds
  const interval = setInterval(() => {
    // Random movement (simulate GPS drift)
    droneData.lat += (Math.random() - 0.5) * 0.0005;
    droneData.lng += (Math.random() - 0.5) * 0.0005;
    
    // Battery drain (1% per 2 seconds, unless idle)
    if (droneData.status === 'flying') {
      droneData.battery = Math.max(0, droneData.battery - 1);
      droneData.altitude = Math.min(100, droneData.altitude + 1);
    } else if (droneData.status === 'landing') {
      droneData.altitude = Math.max(0, droneData.altitude - 2);
      droneData.battery = Math.max(0, droneData.battery - 0.5);
      if (droneData.altitude === 0) {
        droneData.status = 'idle';
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

server.listen(3001, () => {
  console.log('🚁 Drone server running on http://localhost:3001');
});