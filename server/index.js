const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

let droneData = { lat: 51.505, lng: -0.09, battery: 100 }; // Initial GPS (London) and battery

io.on('connection', (socket) => {
	console.log('Client connected');
	socket.emit('drone-update', droneData); // Send initial data

	// Simulate drone movement and battery drain every 2 seconds
	const interval = setInterval(() => {
		droneData.lat += (Math.random() - 0.5) * 0.001; // Random small movement
		droneData.lng += (Math.random() - 0.5) * 0.001;
		droneData.battery = Math.max(0, droneData.battery - 1); // Drain battery
		socket.emit('drone-update', droneData);
	}, 2000);

	socket.on('control', (command) => {
		console.log('Command received:', command);
		// Handle commands like 'takeoff', 'land' (extend as needed)
	});

	socket.on('disconnect', () => clearInterval(interval));
});

server.listen(3001, () => console.log('Server running on port 3001'));