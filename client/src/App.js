import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
	apiKey: "AIzaSyANMbclPxCFNDwkP8id-dpKzfzuMV21fps",
	authDomain: "uav-test-5b5e9.firebaseapp.com",
	projectId: "uav-test-5b5e9",
	storageBucket: "uav-test-5b5e9.firebasestorage.app",
	messagingSenderId: "412946677587",
	appId: "1:412946677587:web:0209930fda1767fcdb2ba6",
	measurementId: "G-9BN1E68R4W"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };

function App() {
	const [dronePos, setDronePos] = useState([51.505, -0.09]);
	const [battery, setBattery] = useState(100);
	const socket = io('http://localhost:3001');

	useEffect(() => {
		socket.on('drone-update', (data) => {
			setDronePos([data.lat, data.lng]);
			setBattery(data.battery);
			// Sync to Firebase
			set(ref(db, 'drone'), data);
		});

		// Listen to Firebase for real-time sync
		onValue(ref(db, 'drone'), (snapshot) => {
			const data = snapshot.val();
			if (data) {
				setDronePos([data.lat, data.lng]);
				setBattery(data.battery);
			}
		});

		return () => socket.disconnect();
	}, [socket]);

	const sendCommand = (cmd) => socket.emit('control', cmd);

	return (
		<div style={{ height: '100vh' }}>
			<div style={{ padding: '10px', background: '#f0f0f0' }}>
				<h2>Drone Control</h2>
				<p>Battery: {battery}%</p>
				<button onClick={() => sendCommand('takeoff')}>Takeoff</button>
				<button onClick={() => sendCommand('land')}>Land</button>
			</div>
			<MapContainer center={dronePos} zoom={13} style={{ height: '80vh' }}>
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<Marker position={dronePos}>
					<Popup>Drone Position<br />Battery: {battery}%</Popup>
				</Marker>
			</MapContainer>
		</div>
	);
}

export default App;