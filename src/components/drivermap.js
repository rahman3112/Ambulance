// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import './drivermap.css';

// // Debounce utility to limit API calls
// const debounce = (func, wait) => {
//   let timeout;
//   return (...args) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// const DriverMap = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const mapContainer = useRef(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [alertStatus, setAlertStatus] = useState('');
//   const [userEmail, setUserEmail] = useState('');
//   const mapRef = useRef(null);
//   const userMarkerRef = useRef(null);
//   const destinationMarkerRef = useRef(null);
//   const hospitalMarkerRef = useRef(null);
//   const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

//   // Fetch driver email from sessionStorage
//   useEffect(() => {
//     const email = sessionStorage.getItem('loggedInEmail');
//     if (email) {
//       setUserEmail(email);
//     } else {
//       setError('No user logged in');
//     }
//   }, []);

//   // Fetch the ambulance request to get the user's location
//   useEffect(() => {
//     const fetchRequest = async () => {
//       try {
//         const response = await fetch(`http://localhost:5000/api/ambulance/request/${requestId}`);
//         const data = await response.json();
//         if (response.ok) {
//           setUserLocation(data.location);
//         } else {
//           setError(data.message);
//         }
//       } catch (err) {
//         console.error('Error fetching request:', err);
//         setError('Failed to fetch request');
//       }
//     };
//     fetchRequest();
//   }, [requestId]);

//   // Find the nearest hospital using TomTom Search API
//   useEffect(() => {
//     if (!userLocation) return;

//     const findNearestHospital = async () => {
//       try {
//         const response = await fetch(
//           `https://api.tomtom.com/search/2/poiSearch/hospital.json?key=${API_KEY}&lat=${userLocation.latitude}&lon=${userLocation.longitude}&radius=10000&categorySet=7321&limit=1`
//         );
//         const data = await response.json();
//         if (data.results && data.results.length > 0) {
//           const hospital = data.results[0];
//           setHospitalLocation({
//             latitude: hospital.position.lat,
//             longitude: hospital.position.lon,
//             name: hospital.poi.name,
//           });
//         } else {
//           setError('No hospitals found nearby');
//         }
//       } catch (err) {
//         console.error('Error finding hospital:', err);
//         setError('Failed to find nearby hospital');
//       }
//     };
//     findNearestHospital();
//   }, [userLocation]);

//   // Initialize map and track driver's location
//   useEffect(() => {
//     if (!mapContainer.current || !userLocation || !hospitalLocation) return;

//     // Load TomTom SDK scripts and CSS dynamically
//     const loadScriptsAndStyles = async () => {
//       const link = document.createElement('link');
//       link.rel = 'stylesheet';
//       link.type = 'text/css';
//       link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css';
//       document.head.appendChild(link);

//       const script1 = document.createElement('script');
//       script1.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js';
//       document.body.appendChild(script1);

//       const script2 = document.createElement('script');
//       script2.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/services/services-web.min.js';
//       document.body.appendChild(script2);

//       await Promise.all([
//         new Promise((resolve) => (link.onload = resolve)),
//         new Promise((resolve) => (script1.onload = resolve)),
//         new Promise((resolve) => (script2.onload = resolve)),
//       ]);
//     };

//     const initializeMap = async () => {
//       await loadScriptsAndStyles();

//       mapRef.current = window.tt.map({
//         key: API_KEY,
//         container: mapContainer.current,
//         zoom: 13,
//       });

//       const calculateRoutesDebounced = debounce((currentPos) => {
//         // Remove existing route layers and sources
//         ['route-driver-to-user', 'route-user-to-hospital'].forEach((layerId) => {
//           if (mapRef.current.getLayer(layerId)) {
//             mapRef.current.removeLayer(layerId);
//           }
//           if (mapRef.current.getSource(layerId)) {
//             mapRef.current.removeSource(layerId);
//           }
//         });

//         // Route 1: Driver to User
//         window.tt.services
//           .calculateRoute({
//             key: API_KEY,
//             locations: `${currentPos.lng},${currentPos.lat}:${userLocation.longitude},${userLocation.latitude}`,
//           })
//           .then((routeData) => {
//             const geojson = routeData.toGeoJson();
//             mapRef.current.addLayer({
//               id: 'route-driver-to-user',
//               type: 'line',
//               source: {
//                 type: 'geojson',
//                 data: geojson,
//               },
//               paint: {
//                 'line-color': '#00aaff',
//                 'line-width': 5,
//               },
//             });
//           })
//           .catch((err) => {
//             console.error('Error calculating driver-to-user route:', err);
//             setError('Failed to calculate route to user');
//           });

//         // Route 2: User to Hospital
//         window.tt.services
//           .calculateRoute({
//             key: API_KEY,
//             locations: `${userLocation.longitude},${userLocation.latitude}:${hospitalLocation.longitude},${hospitalLocation.latitude}`,
//           })
//           .then((routeData) => {
//             const geojson = routeData.toGeoJson();
//             mapRef.current.addLayer({
//               id: 'route-user-to-hospital',
//               type: 'line',
//               source: {
//                 type: 'geojson',
//                 data: geojson,
//               },
//               paint: {
//                 'line-color': '#ff4444',
//                 'line-width': 5,
//                 'line-dasharray': [2, 2],
//               },
//             });
//           })
//           .catch((err) => {
//             console.error('Error calculating user-to-hospital route:', err);
//             setError('Failed to calculate route to hospital');
//           });
//       }, 5000);

//       navigator.geolocation.watchPosition(
//         (position) => {
//           const currentPos = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           };

//           mapRef.current.setCenter([currentPos.lng, currentPos.lat]);

//           if (!userMarkerRef.current) {
//             userMarkerRef.current = new window.tt.Marker()
//               .setLngLat([currentPos.lng, currentPos.lat])
//               .addTo(mapRef.current);
//           } else {
//             userMarkerRef.current.setLngLat([currentPos.lng, currentPos.lat]);
//           }

//           if (!destinationMarkerRef.current) {
//             destinationMarkerRef.current = new window.tt.Marker({ color: 'red' })
//               .setLngLat([userLocation.longitude, userLocation.latitude])
//               .addTo(mapRef.current);
//           }

//           if (!hospitalMarkerRef.current) {
//             hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
//               .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
//               .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
//               .addTo(mapRef.current);
//           }

//           if (
//             Math.abs(currentPos.lng - userLocation.longitude) < 0.0001 &&
//             Math.abs(currentPos.lat - userLocation.latitude) < 0.0001
//           ) {
//             setError('Driver and user are at the same location.');
//             return;
//           }

//           calculateRoutesDebounced(currentPos);
//         },
//         (err) => {
//           setError('Unable to access location. Please enable location services.');
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0,
//         }
//       );
//     };

//     initializeMap();

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//       }
//     };
//   }, [userLocation, hospitalLocation]);

//   // Complete request function
//   const completeRequest = async () => {
//     if (!requestId || !userEmail) {
//       setAlertStatus('Cannot complete request: Missing request or user information');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ requestId, driverEmail: userEmail }),
//       });

//       if (response.ok) {
//         setAlertStatus('Request completed');
//         navigate('/driverhome');
//       } else {
//         const data = await response.json();
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Error completing request:', error);
//       setAlertStatus('Error completing request');
//     }
//   };

//   // Send alert function
//   const sendAlert = async () => {
//     if (!userEmail) {
//       setAlertStatus('Cannot send alert: No user logged in');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/alerts/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: userEmail }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setAlertStatus(`Alert Sent! ID: ${data.alertId}`);
//       } else {
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Send alert error:', error);
//       setAlertStatus('Error sending alert');
//     }
//   };

//   // Stop alert function
//   const stopAlert = async () => {
//     if (!userEmail) {
//       setAlertStatus('Cannot stop alert: No user logged in');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/alerts/stop', {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: userEmail }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setAlertStatus('Alert stopped and deleted');
//       } else {
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Stop alert error:', error);
//       setAlertStatus('Error stopping alert');
//     }
//   };

//   return (
//     <div className="driver-map">
//       <h2>Live Route to User and Hospital</h2>
//       {error && <p className="error">{error}</p>}
//       {alertStatus && <p className="alert-status">{alertStatus}</p>}
//       <div className="alert-section">
//         <h3>Send an Emergency Alert</h3>
//         <button onClick={sendAlert}>Send Alert</button>
//         <button onClick={stopAlert}>Stop Alert</button>
//       </div>
//       <div className="accepted-request">
//         <h4>Accepted Request</h4>
//         <p><strong>Request ID:</strong> {requestId}</p>
//         <button onClick={completeRequest}>Mark as Completed</button>
//       </div>
//       <div
//         id="map"
//         ref={mapContainer}
//         style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
//       >
//         {userLocation ? (hospitalLocation ? 'Loading map...' : 'Finding nearest hospital...') : 'Fetching user location...'}
//       </div>
//     </div>
//   );
// };

// export default DriverMap;



// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import io from 'socket.io-client';
// import './drivermap.css';

// // Initialize Socket.IO client
// const socket = io('http://localhost:5000');

// // Debounce utility to limit API calls
// const debounce = (func, wait) => {
//   let timeout;
//   return (...args) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// const DriverMap = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const mapContainer = useRef(null);
//   const messagesEndRef = useRef(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [alertStatus, setAlertStatus] = useState('');
//   const [userEmail, setUserEmail] = useState('');
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatInput, setChatInput] = useState('');
//   const mapRef = useRef(null);
//   const userMarkerRef = useRef(null);
//   const destinationMarkerRef = useRef(null);
//   const hospitalMarkerRef = useRef(null);
//   const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

//   // Fetch driver email from sessionStorage and join chat
//   useEffect(() => {
//     const email = sessionStorage.getItem('loggedInEmail');
//     if (email) {
//       setUserEmail(email);
//       socket.emit('join', email);
//       socket.emit('joinChat', requestId);
//     } else {
//       setError('No user logged in');
//     }

//     // Handle incoming chat messages
//     socket.on('chatMessage', ({ requestId: msgRequestId, sender, message }) => {
//       if (msgRequestId === requestId) {
//         setChatMessages((prev) => [...prev, { sender, message }]);
//       }
//     });

//     // Cleanup socket listeners
//     return () => {
//       socket.off('chatMessage');
//     };
//   }, [requestId]);

//   // Scroll to the latest chat message
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [chatMessages]);

//   // Fetch the ambulance request to get the user's location
//   useEffect(() => {
//     const fetchRequest = async () => {
//       try {
//         const response = await fetch(`http://localhost:5000/api/ambulance/request/${requestId}`);
//         const data = await response.json();
//         if (response.ok) {
//           setUserLocation(data.location);
//         } else {
//           setError(data.message);
//         }
//       } catch (err) {
//         console.error('Error fetching request:', err);
//         setError('Failed to fetch request');
//       }
//     };
//     fetchRequest();
//   }, [requestId]);

//   // Find the nearest hospital using TomTom Search API
//   useEffect(() => {
//     if (!userLocation) return;

//     const findNearestHospital = async () => {
//       try {
//         const response = await fetch(
//           `https://api.tomtom.com/search/2/poiSearch/hospital.json?key=${API_KEY}&lat=${userLocation.latitude}&lon=${userLocation.longitude}&radius=10000&categorySet=7321&limit=1`
//         );
//         const data = await response.json();
//         if (data.results && data.results.length > 0) {
//           const hospital = data.results[0];
//           setHospitalLocation({
//             latitude: hospital.position.lat,
//             longitude: hospital.position.lon,
//             name: hospital.poi.name,
//           });
//         } else {
//           setError('No hospitals found nearby');
//         }
//       } catch (err) {
//         console.error('Error finding hospital:', err);
//         setError('Failed to find nearby hospital');
//       }
//     };
//     findNearestHospital();
//   }, [userLocation]);

//   // Initialize map and track driver's location
//   useEffect(() => {
//     if (!mapContainer.current || !userLocation || !hospitalLocation) return;

//     // Load TomTom SDK scripts and CSS dynamically
//     const loadScriptsAndStyles = async () => {
//       const link = document.createElement('link');
//       link.rel = 'stylesheet';
//       link.type = 'text/css';
//       link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css';
//       document.head.appendChild(link);

//       const script1 = document.createElement('script');
//       script1.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js';
//       document.body.appendChild(script1);

//       const script2 = document.createElement('script');
//       script2.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/services/services-web.min.js';
//       document.body.appendChild(script2);

//       await Promise.all([
//         new Promise((resolve) => (link.onload = resolve)),
//         new Promise((resolve) => (script1.onload = resolve)),
//         new Promise((resolve) => (script2.onload = resolve)),
//       ]);
//     };

//     const initializeMap = async () => {
//       await loadScriptsAndStyles();

//       mapRef.current = window.tt.map({
//         key: API_KEY,
//         container: mapContainer.current,
//         zoom: 13,
//       });

//       const calculateRoutesDebounced = debounce((currentPos) => {
//         // Remove existing route layers and sources
//         ['route-driver-to-user', 'route-user-to-hospital'].forEach((layerId) => {
//           if (mapRef.current.getLayer(layerId)) {
//             mapRef.current.removeLayer(layerId);
//           }
//           if (mapRef.current.getSource(layerId)) {
//             mapRef.current.removeSource(layerId);
//           }
//         });

//         // Route 1: Driver to User
//         window.tt.services
//           .calculateRoute({
//             key: API_KEY,
//             locations: `${currentPos.lng},${currentPos.lat}:${userLocation.longitude},${userLocation.latitude}`,
//           })
//           .then((routeData) => {
//             const geojson = routeData.toGeoJson();
//             mapRef.current.addLayer({
//               id: 'route-driver-to-user',
//               type: 'line',
//               source: {
//                 type: 'geojson',
//                 data: geojson,
//               },
//               paint: {
//                 'line-color': '#00aaff',
//                 'line-width': 5,
//               },
//             });
//           })
//           .catch((err) => {
//             console.error('Error calculating driver-to-user route:', err);
//             setError('Failed to calculate route to user');
//           });

//         // Route 2: User to Hospital
//         window.tt.services
//           .calculateRoute({
//             key: API_KEY,
//             locations: `${userLocation.longitude},${userLocation.latitude}:${hospitalLocation.longitude},${hospitalLocation.latitude}`,
//           })
//           .then((routeData) => {
//             const geojson = routeData.toGeoJson();
//             mapRef.current.addLayer({
//               id: 'route-user-to-hospital',
//               type: 'line',
//               source: {
//                 type: 'geojson',
//                 data: geojson,
//               },
//               paint: {
//                 'line-color': '#ff4444',
//                 'line-width': 5,
//                 'line-dasharray': [2, 2],
//               },
//             });
//           })
//           .catch((err) => {
//             console.error('Error calculating user-to-hospital route:', err);
//             setError('Failed to calculate route to hospital');
//           });
//       }, 5000);

//       navigator.geolocation.watchPosition(
//         (position) => {
//           const currentPos = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           };

//           mapRef.current.setCenter([currentPos.lng, currentPos.lat]);

//           if (!userMarkerRef.current) {
//             userMarkerRef.current = new window.tt.Marker()
//               .setLngLat([currentPos.lng, currentPos.lat])
//               .addTo(mapRef.current);
//           } else {
//             userMarkerRef.current.setLngLat([currentPos.lng, currentPos.lat]);
//           }

//           if (!destinationMarkerRef.current) {
//             destinationMarkerRef.current = new window.tt.Marker({ color: 'red' })
//               .setLngLat([userLocation.longitude, userLocation.latitude])
//               .addTo(mapRef.current);
//           }

//           if (!hospitalMarkerRef.current) {
//             hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
//               .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
//               .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
//               .addTo(mapRef.current);
//           }

//           if (
//             Math.abs(currentPos.lng - userLocation.longitude) < 0.0001 &&
//             Math.abs(currentPos.lat - userLocation.latitude) < 0.0001
//           ) {
//             setError('Driver and user are at the same location.');
//             return;
//           }

//           calculateRoutesDebounced(currentPos);
//         },
//         (err) => {
//           setError('Unable to access location. Please enable location services.');
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0,
//         }
//       );
//     };

//     initializeMap();

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//       }
//     };
//   }, [userLocation, hospitalLocation]);

//   // Complete request function
//   const completeRequest = async () => {
//     if (!requestId || !userEmail) {
//       setAlertStatus('Cannot complete request: Missing request or user information');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ requestId, driverEmail: userEmail }),
//       });

//       if (response.ok) {
//         setAlertStatus('Request completed');
//         setChatMessages([]);
//         navigate('/driverhome');
//       } else {
//         const data = await response.json();
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Error completing request:', error);
//       setAlertStatus('Error completing request');
//     }
//   };

//   // Send alert function
//   const sendAlert = async () => {
//     if (!userEmail) {
//       setAlertStatus('Cannot send alert: No user logged in');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/alerts/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: userEmail }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setAlertStatus(`Alert Sent! ID: ${data.alertId}`);
//       } else {
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Send alert error:', error);
//       setAlertStatus('Error sending alert');
//     }
//   };

//   // Stop alert function
//   const stopAlert = async () => {
//     if (!userEmail) {
//       setAlertStatus('Cannot stop alert: No user logged in');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/alerts/stop', {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: userEmail }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setAlertStatus('Alert stopped and deleted');
//       } else {
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Stop alert error:', error);
//       setAlertStatus('Error stopping alert');
//     }
//   };

//   // Send chat message function
//   const sendChatMessage = () => {
//     if (chatInput.trim() && requestId) {
//       socket.emit('chatMessage', {
//         requestId,
//         sender: userEmail,
//         message: chatInput,
//       });
//       setChatMessages((prev) => [...prev, { sender: userEmail, message: chatInput }]);
//       setChatInput('');
//     }
//   };

//   return (
//     <div className="driver-map">
//       <h2>Live Route to User and Hospital</h2>
//       {error && <p className="error">{error}</p>}
//       {alertStatus && <p className="alert-status">{alertStatus}</p>}
//       <div className="alert-section">
//         <h3>Send an Emergency Alert</h3>
//         <button onClick={sendAlert}>Send Alert</button>
//         <button onClick={stopAlert}>Stop Alert</button>
//       </div>
//       <div className="accepted-request">
//         <h4>Accepted Request</h4>
//         <p><strong>Request ID:</strong> {requestId}</p>
//         <button onClick={completeRequest}>Mark as Completed</button>
//       </div>
//       <div
//         id="map"
//         ref={mapContainer}
//         style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
//       >
//         {userLocation ? (hospitalLocation ? 'Loading map...' : 'Finding nearest hospital...') : 'Fetching user location...'}
//       </div>
//       <div className="driver-chat-box">
//         <h4>Chat with User</h4>
//         <div className="driver-chat-messages">
//           {chatMessages.map((msg, index) => (
//             <div
//               key={index}
//               className={`driver-chat-message ${
//                 msg.sender === userEmail ? 'driver-message-self' : 'driver-message-other'
//               }`}
//             >
//               <strong>{msg.sender}:</strong> {msg.message}
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>
//         <div className="driver-chat-input">
//           <input
//             type="text"
//             placeholder="Type a message..."
//             value={chatInput}
//             onChange={(e) => setChatInput(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
//           />
//           <button onClick={sendChatMessage}>Send</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DriverMap;







// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import io from 'socket.io-client';
// import './drivermap.css';

// // Initialize Socket.IO client
// const socket = io('http://localhost:5000');

// // Debounce utility to limit API calls
// const debounce = (func, wait) => {
//   let timeout;
//   return (...args) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// const DriverMap = () => {
//   const { requestId } = useParams();
//   const navigate = useNavigate();
//   const mapContainer = useRef(null);
//   const messagesEndRef = useRef(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null); // Track driver location
//   const [error, setError] = useState(null);
//   const [alertStatus, setAlertStatus] = useState('');
//   const [userEmail, setUserEmail] = useState('');
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatInput, setChatInput] = useState('');
//   const mapRef = useRef(null);
//   const userMarkerRef = useRef(null);
//   const destinationMarkerRef = useRef(null);
//   const hospitalMarkerRef = useRef(null);
//   const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

//   // Fetch driver email and join chat
//   useEffect(() => {
//     const email = sessionStorage.getItem('loggedInEmail');
//     if (email) {
//       setUserEmail(email);
//       socket.emit('join', email);
//       socket.emit('joinChat', requestId);
//     } else {
//       setError('No user logged in');
//     }

//     socket.on('chatMessage', ({ requestId: msgRequestId, sender, message }) => {
//       if (msgRequestId === requestId) {
//         setChatMessages((prev) => [...prev, { sender, message }]);
//       }
//     });

//     return () => {
//       socket.off('chatMessage');
//     };
//   }, [requestId]);

//   // Scroll to latest chat message
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [chatMessages]);

//   // Fetch ambulance request
//   useEffect(() => {
//     const fetchRequest = async () => {
//       try {
//         const response = await fetch(`http://localhost:5000/api/ambulance/request/${requestId}`);
//         const data = await response.json();
//         if (response.ok) {
//           setUserLocation(data.location);
//         } else {
//           setError(data.message);
//         }
//       } catch (err) {
//         console.error('Error fetching request:', err);
//         setError('Failed to fetch request');
//       }
//     };
//     fetchRequest();
//   }, [requestId]);

//   // Find nearest hospital
//   useEffect(() => {
//     if (!userLocation) return;

//     const findNearestHospital = async () => {
//       try {
//         const response = await fetch(
//           `https://api.tomtom.com/search/2/poiSearch/hospital.json?key=${API_KEY}&lat=${userLocation.latitude}&lon=${userLocation.longitude}&radius=10000&categorySet=7321&limit=1`
//         );
//         const data = await response.json();
//         if (data.results && data.results.length > 0) {
//           const hospital = data.results[0];
//           setHospitalLocation({
//             latitude: hospital.position.lat,
//             longitude: hospital.position.lon,
//             name: hospital.poi.name,
//           });
//         } else {
//           setError('No hospitals found nearby');
//         }
//       } catch (err) {
//         console.error('Error finding hospital:', err);
//         setError('Failed to find nearby hospital');
//       }
//     };
//     findNearestHospital();
//   }, [userLocation]);

//   // Initialize map and track driver location
//   useEffect(() => {
//     if (!mapContainer.current || !userLocation || !hospitalLocation) return;

//     const loadScriptsAndStyles = async () => {
//       const link = document.createElement('link');
//       link.rel = 'stylesheet';
//       link.type = 'text/css';
//       link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css';
//       document.head.appendChild(link);

//       const script1 = document.createElement('script');
//       script1.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js';
//       document.body.appendChild(script1);

//       const script2 = document.createElement('script');
//       script2.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/services/services-web.min.js';
//       document.body.appendChild(script2);

//       await Promise.all([
//         new Promise((resolve) => (link.onload = resolve)),
//         new Promise((resolve) => (script1.onload = resolve)),
//         new Promise((resolve) => (script2.onload = resolve)),
//       ]);
//     };

//     const initializeMap = async () => {
//       await loadScriptsAndStyles();

//       mapRef.current = window.tt.map({
//         key: API_KEY,
//         container: mapContainer.current,
//         zoom: 13,
//       });

//       const calculateRoutesDebounced = debounce((currentPos) => {
//         ['route-driver-to-user', 'route-user-to-hospital'].forEach((layerId) => {
//           if (mapRef.current.getLayer(layerId)) {
//             mapRef.current.removeLayer(layerId);
//           }
//           if (mapRef.current.getSource(layerId)) {
//             mapRef.current.removeSource(layerId);
//           }
//         });

//         window.tt.services
//           .calculateRoute({
//             key: API_KEY,
//             locations: `${currentPos.lng},${currentPos.lat}:${userLocation.longitude},${userLocation.latitude}`,
//           })
//           .then((routeData) => {
//             const geojson = routeData.toGeoJson();
//             mapRef.current.addLayer({
//               id: 'route-driver-to-user',
//               type: 'line',
//               source: {
//                 type: 'geojson',
//                 data: geojson,
//               },
//               paint: {
//                 'line-color': '#00aaff',
//                 'line-width': 5,
//               },
//             });
//           })
//           .catch((err) => {
//             console.error('Error calculating driver-to-user route:', err);
//             setError('Failed to calculate route to user');
//           });

//         window.tt.services
//           .calculateRoute({
//             key: API_KEY,
//             locations: `${userLocation.longitude},${userLocation.latitude}:${hospitalLocation.longitude},${hospitalLocation.latitude}`,
//           })
//           .then((routeData) => {
//             const geojson = routeData.toGeoJson();
//             mapRef.current.addLayer({
//               id: 'route-user-to-hospital',
//               type: 'line',
//               source: {
//                 type: 'geojson',
//                 data: geojson,
//               },
//               paint: {
//                 'line-color': '#ff4444',
//                 'line-width': 5,
//                 'line-dasharray': [2, 2],
//               },
//             });
//           })
//           .catch((err) => {
//             console.error('Error calculating user-to-hospital route:', err);
//             setError('Failed to calculate route to hospital');
//           });
//       }, 5000);

//       navigator.geolocation.watchPosition(
//         (position) => {
//           const currentPos = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           };

//           // Update driver location state
//           setDriverLocation(currentPos);

//           // Emit driver location for real-time updates
//           socket.emit('driverLocationUpdate', {
//             requestId,
//             driverEmail: userEmail,
//             location: currentPos,
//           });

//           mapRef.current.setCenter([currentPos.lng, currentPos.lat]);

//           if (!userMarkerRef.current) {
//             userMarkerRef.current = new window.tt.Marker()
//               .setLngLat([currentPos.lng, currentPos.lat])
//               .addTo(mapRef.current);
//           } else {
//             userMarkerRef.current.setLngLat([currentPos.lng, currentPos.lat]);
//           }

//           if (!destinationMarkerRef.current) {
//             destinationMarkerRef.current = new window.tt.Marker({ color: 'red' })
//               .setLngLat([userLocation.longitude, userLocation.latitude])
//               .addTo(mapRef.current);
//           }

//           if (!hospitalMarkerRef.current) {
//             hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
//               .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
//               .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
//               .addTo(mapRef.current);
//           }

//           if (
//             Math.abs(currentPos.lng - userLocation.longitude) < 0.0001 &&
//             Math.abs(currentPos.lat - userLocation.latitude) < 0.0001
//           ) {
//             setError('Driver and user are at the same location.');
//             return;
//           }

//           calculateRoutesDebounced(currentPos);
//         },
//         (err) => {
//           setError('Unable to access location. Please enable location services.');
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0,
//         }
//       );
//     };

//     initializeMap();

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//       }
//     };
//   }, [userLocation, hospitalLocation]);

//   // Complete request
//   const completeRequest = async () => {
//     if (!requestId || !userEmail) {
//       setAlertStatus('Cannot complete request: Missing request or user information');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ requestId, driverEmail: userEmail }),
//       });

//       if (response.ok) {
//         setAlertStatus('Request completed');
//         setChatMessages([]);
//         navigate('/driverhome');
//       } else {
//         const data = await response.json();
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Error completing request:', error);
//       setAlertStatus('Error completing request');
//     }
//   };

//   // Send alert with location data
//   const sendAlert = async () => {
//     if (!userEmail) {
//       setAlertStatus('Cannot send alert: No user logged in');
//       return;
//     }
//     if (!userLocation || !driverLocation || !hospitalLocation) {
//       setAlertStatus('Cannot send alert: Location data missing');
//       return;
//     }

//     try {
//       // Emit alert with location data
//       socket.emit('sendAlert', {
//         requestId,
//         driverEmail: userEmail,
//         userLocation,
//         driverLocation,
//         hospitalLocation,
//       });

//       // Save alert to MongoDB
//       const response = await fetch('http://localhost:5000/api/alerts/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: userEmail, requestId }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setAlertStatus(`Alert Sent! ID: ${data.alertId}`);
//       } else {
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Send alert error:', error);
//       setAlertStatus('Error sending alert');
//     }
//   };

//   // Stop alert
//   const stopAlert = async () => {
//     if (!userEmail) {
//       setAlertStatus('Cannot stop alert: No user logged in');
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/alerts/stop', {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: userEmail }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setAlertStatus('Alert stopped and deleted');
//       } else {
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Stop alert error:', error);
//       setAlertStatus('Error stopping alert');
//     }
//   };

//   // Send chat message
//   const sendChatMessage = () => {
//     if (chatInput.trim() && requestId) {
//       socket.emit('chatMessage', {
//         requestId,
//         sender: userEmail,
//         message: chatInput,
//       });
//       setChatMessages((prev) => [...prev, { sender: userEmail, message: chatInput }]);
//       setChatInput('');
//     }
//   };

//   return (
//     <div className="driver-map">
//       {error && <p className="error">{error}</p>}
//       {alertStatus && <p className="alert-status">{alertStatus}</p>}
//       <div className="button-group">
//       <div className="alert-section">
//         <h3>Send an Emergency Alert</h3>
//         <button onClick={sendAlert}>Send Alert</button>
//         <button onClick={stopAlert}>Stop Alert</button>
//       </div>
//       <div className="accepted-request">
//         <h4>Accepted Request</h4>
//         <p><strong>Request ID:</strong> {requestId}</p>
//         <button onClick={completeRequest}>Mark as Completed</button>
//       </div>
//       </div>
//       <div
//         id="map"
//         ref={mapContainer}
//         style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
//       >
//         {userLocation ? (hospitalLocation ? 'Loading map...' : 'Finding nearest hospital...') : 'Fetching user location...'}
//       </div>
//       <div className="driver-chat-box">
//         <h4>Chat with User</h4>
//         <div className="driver-chat-messages">
//           {chatMessages.map((msg, index) => (
//             <div
//               key={index}
//               className={`driver-chat-message ${
//                 msg.sender === userEmail ? 'driver-message-self' : 'driver-message-other'
//               }`}
//             >
//               <strong>{msg.sender}:</strong> {msg.message}
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>
//         <div className="driver-chat-input">
//           <input
//             type="text"
//             placeholder="Type a message..."
//             value={chatInput}
//             onChange={(e) => setChatInput(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
//           />
//           <button onClick={sendChatMessage}>Send</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DriverMap;





import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './drivermap.css';

// Initialize Socket.IO client
const socket = io('http://localhost:5000');

// Debounce utility to limit API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const DriverMap = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const messagesEndRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [error, setError] = useState(null);
  const [alertStatus, setAlertStatus] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const hospitalMarkerRef = useRef(null);
  const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

  // Fetch driver email and join chat
  useEffect(() => {
    const email = sessionStorage.getItem('loggedInEmail');
    if (email) {
      setUserEmail(email);
      socket.emit('join', email);
      socket.emit('joinChat', requestId);
    } else {
      setError('No user logged in');
      navigate('/login');
    }

    socket.on('chatMessage', ({ requestId: msgRequestId, sender, message }) => {
      if (msgRequestId === requestId) {
        setChatMessages((prev) => [...prev, { sender, message }]);
      }
    });

    return () => {
      socket.off('chatMessage');
    };
  }, [requestId, navigate]);

  // Scroll to latest chat message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch ambulance request
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/ambulance/request/${requestId}`);
        const data = await response.json();
        console.log('Ambulance Request Data:', data);
        if (response.ok) {
          setUserLocation({
            latitude:  17.3850,
            longitude: 78.4867,
          });
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Failed to fetch request');
      }
    };
    fetchRequest();
  }, [requestId]);

  // Find nearest hospital
  useEffect(() => {
    if (!userLocation) return;

    const findNearestHospital = async () => {
      try {
        const response = await fetch(
          `https://api.tomtom.com/search/2/poiSearch/hospital.json?key=${API_KEY}&lat=${userLocation.latitude}&lon=${userLocation.longitude}&radius=10000&categorySet=7321&limit=1`
        );
        const data = await response.json();
        console.log('Hospital Search Data:', data);
        if (data.results && data.results.length > 0) {
          const hospital = data.results[0];
          setHospitalLocation({
            latitude: hospital.position.lat,
            longitude: hospital.position.lon,
            name: hospital.poi.name,
          });
        } else {
          setError('No hospitals found nearby');
        }
      } catch (err) {
        console.error('Error finding hospital:', err);
        setError('Failed to find nearby hospital');
      }
    };
    findNearestHospital();
  }, [userLocation]);

  // Initialize map and track driver location
  useEffect(() => {
    if (!mapContainer.current || !userLocation || !hospitalLocation) {
      console.log('Map initialization skipped: missing map container, userLocation, or hospitalLocation');
      return;
    }

    const loadScriptsAndStyles = async () => {
      try {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css';
        document.head.appendChild(link);

        const script1 = document.createElement('script');
        script1.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js';
        document.body.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/services/services-web.min.js';
        document.body.appendChild(script2);

        await Promise.all([
          new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = () => reject(new Error('Failed to load TomTom CSS'));
          }),
          new Promise((resolve, reject) => {
            script1.onload = resolve;
            script1.onerror = () => reject(new Error('Failed to load TomTom maps script'));
          }),
          new Promise((resolve, reject) => {
            script2.onload = resolve;
            script2.onerror = () => reject(new Error('Failed to load TomTom services script'));
          }),
        ]);
        console.log('TomTom SDK scripts and styles loaded successfully');
      } catch (err) {
        console.error('Error loading TomTom SDK:', err);
        throw err;
      }
    };

    const initializeMap = async () => {
      try {
        console.log('Starting map initialization');
        await loadScriptsAndStyles();

        if (!window.tt || !window.tt.map || !window.tt.Marker) {
          throw new Error('TomTom SDK not loaded properly');
        }

        if (!mapContainer.current) {
          throw new Error('Map container not found');
        }

        mapRef.current = window.tt.map({
          key: API_KEY,
          container: mapContainer.current,
          zoom: 13,
        });

        mapRef.current.on('load', () => {
          console.log('Map fully loaded');
        });

        mapRef.current.on('error', (err) => {
          console.error('Map error:', err);
          setError('Failed to initialize map: ' + err.message);
        });

        const calculateRoutesDebounced = debounce((currentPos) => {
          console.log('Calculating routes with locations:', {
            driver: currentPos,
            user: userLocation,
            hospital: hospitalLocation,
          });
          const routeLayers = [
            'route-driver-to-user',
            'route-driver-to-user-alt1',
            'route-driver-to-user-alt2',
            'route-user-to-hospital',
          ];

          // Remove existing layers and sources
          routeLayers.forEach((layerId) => {
            try {
              if (mapRef.current.getLayer(layerId)) {
                mapRef.current.removeLayer(layerId);
                console.log(`Removed layer: ${layerId}`);
              }
              if (mapRef.current.getSource(layerId)) {
                mapRef.current.removeSource(layerId);
                console.log(`Removed source: ${layerId}`);
              }
            } catch (err) {
              console.error(`Error removing layer/source ${layerId}:`, err);
            }
          });

          // Calculate route from driver to user with alternatives
          window.tt.services
            .calculateRoute({
              key: API_KEY,
              locations: `${currentPos.lng},${currentPos.lat}:${userLocation.longitude},${userLocation.latitude}`,
              traffic: 'live',
              computeAlternativeRoutes: true,
              maxAlternatives: 2,
            })
            .then((routeData) => {
              const geojson = routeData.toGeoJson();
              console.log('GeoJSON features count:', geojson.features.length, 'Features:', geojson.features);

              // Primary route
              if (geojson.features[0]) {
                try {
                  mapRef.current.addSource('route-driver-to-user', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [geojson.features[0]] },
                  });
                  mapRef.current.addLayer({
                    id: 'route-driver-to-user',
                    type: 'line',
                    source: 'route-driver-to-user',
                    paint: {
                      'line-color': '#00aaff',
                      'line-width': 5,
                      'line-dasharray': [1, 0],
                    },
                  });
                  console.log('Primary route added');
                } catch (err) {
                  console.error('Error adding primary route:', err);
                  setError('Failed to add primary route');
                }
              } else {
                console.warn('No primary route returned');
              }

              // Alternative routes
              geojson.features.slice(1).forEach((feature, index) => {
                const layerId = `route-driver-to-user-alt${index + 1}`;
                try {
                  mapRef.current.addSource(layerId, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [feature] },
                  });
                  mapRef.current.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    paint: {
                      'line-color': index === 0 ? '#888888' : '#aaaaaa',
                      'line-width': 3,
                      'line-dasharray': [2, 2],
                    },
                  });
                  console.log(`Alternative route ${layerId} added with coordinates:`, feature.geometry.coordinates);
                } catch (err) {
                  console.error(`Error adding alternative route ${layerId}:`, err);
                  setError(`Failed to add alternative route ${layerId}`);
                }
              });

              if (geojson.features.length < 2) {
                console.warn('No alternative routes returned. Try different coordinates or check API key.');
              }
            })
            .catch((err) => {
              console.error('Error calculating driver-to-user route:', err);
              setError('Failed to calculate route to user');
            });

          // Calculate route from user to hospital
          window.tt.services
            .calculateRoute({
              key: API_KEY,
              locations: `${userLocation.longitude},${userLocation.latitude}:${hospitalLocation.longitude},${hospitalLocation.latitude}`,
              traffic: 'live',
            })
            .then((routeData) => {
              const geojson = routeData.toGeoJson();
              try {
                mapRef.current.addSource('route-user-to-hospital', {
                  type: 'geojson',
                  data: geojson,
                });
                mapRef.current.addLayer({
                  id: 'route-user-to-hospital',
                  type: 'line',
                  source: 'route-user-to-hospital',
                  paint: {
                    'line-color': '#ff4444',
                    'line-width': 5,
                    'line-dasharray': [2, 2],
                  },
                });
                console.log('User-to-hospital route added');
              } catch (err) {
                console.error('Error adding user-to-hospital route:', err);
                setError('Failed to add user-to-hospital route');
              }
            })
            .catch((err) => {
              console.error('Error calculating user-to-hospital route:', err);
              setError('Failed to calculate route to hospital');
            });
        }, 10000);

        navigator.geolocation.watchPosition(
          (position) => {
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            console.log('Driver Location:', currentPos);
            console.log('User Location:', userLocation);
            console.log('Hospital Location:', hospitalLocation);

            if (!userLocation || !hospitalLocation) {
              console.warn('User or hospital location missing');
              setError('User or hospital location missing');
              return;
            }

            setDriverLocation(currentPos);
            socket.emit('driverLocationUpdate', {
              requestId,
              driverEmail: userEmail,
              location: currentPos,
            });

            const bounds = new window.tt.LngLatBounds();
            bounds.extend([currentPos.lng, currentPos.lat]);
            bounds.extend([userLocation.longitude, userLocation.latitude]);
            bounds.extend([hospitalLocation.longitude, hospitalLocation.latitude]);

            mapRef.current.fitBounds(bounds, {
              padding: 50,
              maxZoom: 12, // Reduced to show wider area
            });

            // Create custom ambulance icon for driver
            if (!userMarkerRef.current) {
              try {
                const driverIcon = document.createElement('div');
                driverIcon.style.width = '32px';
                driverIcon.style.height = '32px';
                driverIcon.style.backgroundImage = 'url(https://cdn-icons-png.flaticon.com/512/2972/2972427.png)';
                driverIcon.style.backgroundSize = 'cover';
                userMarkerRef.current = new window.tt.Marker({ element: driverIcon })
                  .setLngLat([currentPos.lng, currentPos.lat])
                  .addTo(mapRef.current);
                console.log('Driver marker created with ambulance icon');
              } catch (err) {
                console.error('Error creating driver marker:', err);
                setError('Failed to create driver marker');
              }
            } else {
              userMarkerRef.current.setLngLat([currentPos.lng, currentPos.lat]);
            }

            if (!destinationMarkerRef.current) {
              try {
                destinationMarkerRef.current = new window.tt.Marker({ color: 'red' })
                  .setLngLat([userLocation.longitude, userLocation.latitude])
                  .addTo(mapRef.current);
                console.log('User marker created');
              } catch (err) {
                console.error('Error creating user marker:', err);
                setError('Failed to create user marker');
              }
            }

            if (!hospitalMarkerRef.current) {
              try {
                hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
                  .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
                  .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
                  .addTo(mapRef.current);
                console.log('Hospital marker created');
              } catch (err) {
                console.error('Error creating hospital marker:', err);
                setError('Failed to create hospital marker');
              }
            }

            if (
              Math.abs(currentPos.lng - userLocation.longitude) < 0.0001 &&
              Math.abs(currentPos.lat - userLocation.latitude) < 0.0001
            ) {
              setError('Driver and user are at the same location.');
              return;
            }

            calculateRoutesDebounced(currentPos);
          },
          (err) => {
            console.error('Geolocation error:', err);
            setError('Unable to access location. Please enable location services.');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } catch (err) {
        console.error('Map initialization failed:', err);
        setError('Failed to initialize map: ' + err.message);
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          console.log('Map removed');
        } catch (err) {
          console.error('Error removing map:', err);
        }
      }
    };
  }, [userLocation, hospitalLocation, userEmail, requestId, navigate]);

  // Complete request
  const completeRequest = async () => {
    if (!requestId || !userEmail) {
      setAlertStatus('Cannot complete request: Missing request or user information');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/ambulance/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, driverEmail: userEmail }),
      });

      if (response.ok) {
        setAlertStatus('Request completed');
        setChatMessages([]);
        navigate('/driverhome');
      } else {
        const data = await response.json();
        setAlertStatus(data.message);
      }
    } catch (error) {
      console.error('Error completing request:', error);
      setAlertStatus('Error completing request');
    }
  };

  // Send alert with location data
  const sendAlert = async () => {
    if (!userEmail) {
      setAlertStatus('Cannot send alert: No user logged in');
      return;
    }
    if (!userLocation || !driverLocation || !hospitalLocation) {
      setAlertStatus('Cannot send alert: Location data missing');
      return;
    }

    try {
      socket.emit('sendAlert', {
        requestId,
        driverEmail: userEmail,
        userLocation,
        driverLocation,
        hospitalLocation,
      });

      const response = await fetch('http://localhost:5000/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, requestId }),
      });

      const data = await response.json();
      if (response.ok) {
        setAlertStatus(`Alert Sent! ID: ${data.alertId}`);
      } else {
        setAlertStatus(data.message);
      }
    } catch (error) {
      console.error('Send alert error:', error);
      setAlertStatus('Error sending alert');
    }
  };

  // Stop alert
  const stopAlert = async () => {
    if (!userEmail) {
      setAlertStatus('Cannot stop alert: No user logged in');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/alerts/stop', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        setAlertStatus('Alert stopped and deleted');
      } else {
        setAlertStatus(data.message);
      }
    } catch (error) {
      console.error('Stop alert error:', error);
      setAlertStatus('Error stopping alert');
    }
  };

  // Send chat message
  const sendChatMessage = () => {
    if (chatInput.trim() && requestId) {
      socket.emit('chatMessage', {
        requestId,
        sender: userEmail,
        message: chatInput,
      });
      setChatMessages((prev) => [...prev, { sender: userEmail, message: chatInput }]);
      setChatInput('');
    }
  };

  return (
    <div className="driver-map">
      {error && <p className="error">{error}</p>}
      {alertStatus && <p className="alert-status">{alertStatus}</p>}
      <div className="button-group">
        <div className="alert-section">
          <h3>Send an Emergency Alert</h3>
          <button onClick={sendAlert}>Send Alert</button>
          <button onClick={stopAlert}>Stop Alert</button>
        </div>
        <div className="accepted-request">
          <h4>Accepted Request</h4>
          <p><strong>Request ID:</strong> {requestId}</p>
          <button onClick={completeRequest}>Mark as Completed</button>
        </div>
      </div>
      <div
        id="map"
        ref={mapContainer}
        style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
      >
        {userLocation ? (hospitalLocation ? 'Loading map...' : 'Finding nearest hospital...') : 'Fetching user location...'}
      </div>
      <div className="driver-chat-box">
        <h4>Chat with User</h4>
        <div className="driver-chat-messages">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`driver-chat-message ${
                msg.sender === userEmail ? 'driver-message-self' : 'driver-message-other'
              }`}
            >
              <strong>{msg.sender}:</strong> {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="driver-chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
          />
          <button onClick={sendChatMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default DriverMap;