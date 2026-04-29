import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import './App.css';

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyANMbclPxCFNDwkP8id-dpKzfzuMV21fps',
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'uav-test-5b5e9.firebaseapp.com',
	databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || 'https://uav-test-5b5e9-default-rtdb.europe-west1.firebasedatabase.app',
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'uav-test-5b5e9',
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'uav-test-5b5e9.firebasestorage.app',
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '412946677587',
	appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:412946677587:web:0209930fda1767fcdb2ba6',
	measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-9BN1E68R4W'
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Home base coordinates (Naissaare tuletorn)
const homeBase = [59.603778, 24.510694];

// Custom drone marker icon
const droneIcon = L.divIcon({
	html: `<div style="font-size: 24px; transform: rotate(-45deg);">🚁</div>`,
	iconSize: [30, 30],
	popupAnchor: [0, -15]
});

// Custom home base marker icon
const homeBaseIcon = L.divIcon({
	html: `<div style="font-size: 20px;">🏠</div>`,
	iconSize: [25, 25],
	popupAnchor: [0, -12]
});

function App() {
	const [dronePos, setDronePos] = useState([59.603778, 24.510694]); // Start at home base
	const [battery, setBattery] = useState(100);
	const [altitude, setAltitude] = useState(0);
	const [status, setStatus] = useState('idle');
	const [connected, setConnected] = useState(false);
	const [speed, setSpeed] = useState(0);
	const [maxSpeed, setMaxSpeed] = useState(65);
	const [routeDestination, setRouteDestination] = useState(null);
	const [routeLat, setRouteLat] = useState('');
	const [routeLng, setRouteLng] = useState('');
	const socketRef = useRef(null);
	const mapRef = useRef(null);

	useEffect(() => {
		const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
		console.log('Connecting to backend:', backendUrl);

		// Initialize socket connection
		const socket = io(backendUrl);
		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('✅ Connected to server', { url: backendUrl, id: socket.id });
			setConnected(true);
		});

		socket.on('connect_error', (err) => {
			console.error('⚠️ Socket connect error:', err);
		});

		socket.on('reconnect_attempt', (attempt) => {
			console.log('🔄 Socket reconnect attempt', attempt);
		});

		socket.on('drone-update', (data) => {
			setDronePos([data.lat, data.lng]);
			setBattery(data.battery);
			setAltitude(data.altitude);
			setStatus(data.status);
			setSpeed(data.speed || 0);
			setMaxSpeed(data.maxSpeed || 65);
			
			// Sync to Firebase
			set(ref(db, 'drone'), data);
		});

		socket.on('command-ack', (ack) => {
			console.log('Command acknowledged:', ack);
		});

		socket.on('disconnect', (reason) => {
			console.log('❌ Disconnected from server', reason);
			setConnected(false);
		});

		// Listen to Firebase for real-time sync (redundancy)
		onValue(ref(db, 'drone'), (snapshot) => {
			const data = snapshot.val();
			if (data) {
				setDronePos([data.lat, data.lng]);
				setBattery(data.battery);
				setAltitude(data.altitude);
				setStatus(data.status);
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	const sendCommand = (cmd) => {
		if (socketRef.current) {
			socketRef.current.emit('control', cmd);
		}
	};

	const getBatteryColor = () => {
		if (battery > 50) return '#4CAF50'; // Green
		if (battery > 25) return '#FF9800'; // Orange
		return '#f44336'; // Red
	};

	const getStatusColor = () => {
		switch(status) {
			case 'flying': return '#2196F3';
			case 'returning': return '#FF5722'; // Deep orange for returning
			case 'landing': return '#FF9800';
			case 'idle': return '#4CAF50';
			default: return '#9E9E9E';
		}
	};

	return (
		<div className="app-container">
			<div className="control-panel">
				<h1>🚁 Ground Control Station</h1>
				
				<div className="status-indicator">
					<div className="connection-status">
						<span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
						<span>{connected ? 'Connected' : 'Disconnected'}</span>
					</div>
				</div>

				<div className="telemetry">
					<div className="telemetry-item">
						<label>Status</label>
						<div className="value" style={{ color: getStatusColor() }}>
							{status.toUpperCase()}
						</div>
					</div>
					<div className="telemetry-item">
						<label>Battery</label>
						<div className="battery-bar">
							<div 
								className="battery-fill" 
								style={{ 
									width: `${battery}%`, 
									backgroundColor: getBatteryColor() 
								}}
							></div>
						</div>
						<div className="value">{battery.toFixed(1)}%</div>
					</div>
					<div className="telemetry-item">
						<label>Altitude</label>
						<div className="value">{altitude.toFixed(1)}m</div>
					</div>
					<div className="telemetry-item">
						<label>Speed</label>
						<div className="value">{speed} / {maxSpeed} km/h</div>
					</div>
				</div>

				<div className="gps-info">
					<label>GPS Coordinates</label>
					<div className="gps-values">
						<span>Lat: {dronePos[0].toFixed(6)}</span>
						<span>Lng: {dronePos[1].toFixed(6)}</span>
					</div>
				</div>

				<div className="route-section">
					<label>Set Route</label>
					<div className="route-inputs">
						<input 
							type="number" 
							placeholder="Latitude"
							value={routeLat}
							onChange={(e) => setRouteLat(e.target.value)}
							step="0.000001"
						/>
						<input 
							type="number" 
							placeholder="Longitude"
							value={routeLng}
							onChange={(e) => setRouteLng(e.target.value)}
							step="0.000001"
						/>
					</div>
					<button 
						className="btn btn-info"
						onClick={() => {
							if (routeLat && routeLng) {
								const dest = { lat: parseFloat(routeLat), lng: parseFloat(routeLng) };
								setRouteDestination(dest);
								if (socketRef.current) {
									socketRef.current.emit('set-route', dest);
								}
							}
						}}
					>
						🗺️ Set Route
					</button>
				</div>

				<div className="controls">
					<button 
						className="btn btn-success"
						onClick={() => sendCommand('takeoff')}
						disabled={status !== 'idle'}
					>
						✈️ Takeoff
					</button>
					<button 
						className="btn btn-primary"
						onClick={() => sendCommand('return')}
						disabled={status === 'landing'}
					>
						🏠 Return to Base
					</button>
					<button 
						className="btn btn-warning"
						onClick={() => sendCommand('land')}
						disabled={status === 'idle'}
					>
						🛬 Land
					</button>
					<button 
						className="btn btn-danger"
						onClick={() => sendCommand('emergency')}
					>
						🚨 Emergency
					</button>
					<button 
						className="btn btn-info"
						onClick={() => {
							if (mapRef.current) {
								mapRef.current.setView(dronePos, 16);
							}
						}}
					>
						📍 Center View
					</button>
				</div>
			</div>

			<div className="map-container">
				<MapContainer center={homeBase} zoom={13} className="leaflet-map" whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}>
					<TileLayer 
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution='&copy; OpenStreetMap contributors'
					/>
					<Marker position={dronePos} icon={droneIcon}>
						<Popup>
							<div>
								<strong>Drone Position</strong><br />
								Battery: {battery.toFixed(1)}%<br />
								Altitude: {altitude.toFixed(1)}m<br />
								Status: {status}
							</div>
						</Popup>
					</Marker>
					<Marker position={homeBase} icon={homeBaseIcon}>
						<Popup>
							<div>
								<strong>Home Base</strong><br />
								Naissaare Tuletorn<br />
								Lat: {homeBase[0].toFixed(6)}<br />
								Lng: {homeBase[1].toFixed(6)}
							</div>
						</Popup>
					</Marker>
					{routeDestination && (
						<Polyline 
							positions={[dronePos, [routeDestination.lat, routeDestination.lng]]}
							color="#FF5722"
							weight={3}
							dashArray="5, 5"
						/>
					)}
					{routeDestination && (
						<Marker position={[routeDestination.lat, routeDestination.lng]} icon={L.icon({
							iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF5722"><circle cx="12" cy="12" r="8"/></svg>',
							iconSize: [24, 24],
						})}>
							<Popup>
								<div>
									<strong>Route Destination</strong><br />
									Lat: {routeDestination.lat.toFixed(6)}<br />
									Lng: {routeDestination.lng.toFixed(6)}
								</div>
							</Popup>
						</Marker>
					)}
				</MapContainer>
			</div>
		</div>
	);
}

export default App;
