// import React, { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import io from 'socket.io-client';
// import './policemap.css';

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

// const PoliceMap = () => {
//   const { requestId } = useParams();
//   const mapContainer = useRef(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const mapRef = useRef(null);
//   const driverMarkerRef = useRef(null);
//   const userMarkerRef = useRef(null);
//   const hospitalMarkerRef = useRef(null);
//   const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

//   // Join police room and handle driver location updates
//   useEffect(() => {
//     if (requestId) {
//       socket.emit('joinPolice', requestId);
//     }

//     socket.on('driverLocationUpdate', ({ requestId: updatedRequestId, location }) => {
//       if (updatedRequestId === requestId) {
//         setDriverLocation(location);
//       }
//     });

//     return () => {
//       socket.off('driverLocationUpdate');
//     };
//   }, [requestId]);

//   // Fetch alert data
//   useEffect(() => {
//     const fetchAlert = async () => {
//       try {
//         const response = await fetch(`http://localhost:5000/api/alerts/request/${requestId}`);
//         const data = await response.json();
//         if (response.ok && data) {
//           setUserLocation(data.userLocation);
//           setHospitalLocation(data.hospitalLocation);
//           setDriverLocation(data.driverLocation);
//         } else {
//           setError('Alert not found');
//         }
//       } catch (err) {
//         console.error('Error fetching alert:', err);
//         setError('Failed to fetch alert');
//       }
//     };
//     fetchAlert();
//   }, [requestId]);

//   // Initialize map
//   useEffect(() => {
//     if (!mapContainer.current || !userLocation || !hospitalLocation || !driverLocation) return;

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
//         center: [userLocation.longitude, userLocation.latitude],
//         zoom: 13,
//       });

//       const calculateRoutesDebounced = debounce(() => {
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
//             locations: `${driverLocation.lng},${driverLocation.lat}:${userLocation.longitude},${userLocation.latitude}`,
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

//       if (!driverMarkerRef.current) {
//         driverMarkerRef.current = new window.tt.Marker()
//           .setLngLat([driverLocation.lng, driverLocation.lat])
//           .addTo(mapRef.current);
//       } else {
//         driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
//       }

//       if (!userMarkerRef.current) {
//         userMarkerRef.current = new window.tt.Marker({ color: 'red' })
//           .setLngLat([userLocation.longitude, userLocation.latitude])
//           .addTo(mapRef.current);
//       }

//       if (!hospitalMarkerRef.current) {
//         hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
//           .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
//           .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
//           .addTo(mapRef.current);
//       }

//       calculateRoutesDebounced();
//     };

//     initializeMap();

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//       }
//     };
//   }, [userLocation, hospitalLocation, driverLocation]);

//   // Update driver marker
//   useEffect(() => {
//     if (driverLocation && driverMarkerRef.current) {
//       driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
//       mapRef.current.setCenter([driverLocation.lng, driverLocation.lat]);
//     }
//   }, [driverLocation]);

//   return (
//     <div className="police-map">
//       <h2>Ambulance Request {requestId}</h2>
//       {error && <p className="error">{error}</p>}
//       <div
//         id="map"
//         ref={mapContainer}
//         style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
//       >
//         {userLocation
//           ? hospitalLocation
//             ? driverLocation
//               ? 'Loading map...'
//               : 'Waiting for driver location...'
//             : 'Waiting for hospital location...'
//           : 'Fetching user location...'}
//       </div>
//     </div>
//   );
// };

// export default PoliceMap;

// import React, { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import io from 'socket.io-client';
// import './policemap.css';

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

// // Function to create a GeoJSON circle (moved outside initializeMap)
// const createCircleGeoJSON = (center, radiusInMeters) => {
//   const points = 64;
//   const coords = {
//     latitude: center.lat,
//     longitude: center.lng,
//   };
//   const km = radiusInMeters / 1000;
//   const ret = [];
//   const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
//   const distanceY = km / 110.574;

//   for (let i = 0; i < points; i++) {
//     const theta = (i / points) * (2 * Math.PI);
//     const x = distanceX * Math.cos(theta);
//     const y = distanceY * Math.sin(theta);
//     ret.push([coords.longitude + x, coords.latitude + y]);
//   }
//   ret.push(ret[0]);
//   return {
//     type: 'Feature',
//     geometry: {
//       type: 'Polygon',
//       coordinates: [ret],
//     },
//   };
// };

// const PoliceMap = () => {
//   const { requestId } = useParams();
//   const mapContainer = useRef(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [policeLocation, setPoliceLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const mapRef = useRef(null);
//   const driverMarkerRef = useRef(null);
//   const userMarkerRef = useRef(null);
//   const hospitalMarkerRef = useRef(null);
//   const policeMarkerRef = useRef(null);
//   const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

//   // Join police room and handle driver location updates
//   useEffect(() => {
//     if (requestId) {
//       socket.emit('joinPolice', requestId);
//     }

//     socket.on('driverLocationUpdate', ({ requestId: updatedRequestId, location }) => {
//       if (updatedRequestId === requestId) {
//         setDriverLocation(location);
//       }
//     });

//     return () => {
//       socket.off('driverLocationUpdate');
//     };
//   }, [requestId]);

//   // Fetch alert data
//   useEffect(() => {
//     const fetchAlert = async () => {
//       try {
//         const response = await fetch(`http://localhost:5000/api/alerts/request/${requestId}`);
//         const data = await response.json();
//         if (response.ok && data) {
//           setUserLocation(data.userLocation);
//           setHospitalLocation(data.hospitalLocation);
//           setDriverLocation(data.driverLocation);
//         } else {
//           setError('Alert not found');
//         }
//       } catch (err) {
//         console.error('Error fetching alert:', err);
//         setError('Failed to fetch alert');
//       }
//     };
//     fetchAlert();
//   }, [requestId]);

//   // Get police officer's location
//   useEffect(() => {
//     navigator.geolocation.watchPosition(
//       (position) => {
//         const policePos = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//         };
//         console.log('Police Location:', policePos);
//         setPoliceLocation(policePos);
//       },
//       (err) => {
//         console.error('Geolocation error for police:', err);
//         setError('Unable to access police location. Please enable location services.');
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0,
//       }
//     );
//   }, []);

//   // Initialize map
//   useEffect(() => {
//     if (!mapContainer.current || !userLocation || !hospitalLocation || !driverLocation || !policeLocation) {
//       console.log('Map initialization skipped: missing required locations', {
//         mapContainer: !!mapContainer.current,
//         userLocation: !!userLocation,
//         hospitalLocation: !!hospitalLocation,
//         driverLocation: !!driverLocation,
//         policeLocation: !!policeLocation,
//       });
//       return;
//     }

//     const loadScriptsAndStyles = async () => {
//       try {
//         const link = document.createElement('link');
//         link.rel = 'stylesheet';
//         link.type = 'text/css';
//         link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css';
//         document.head.appendChild(link);

//         const script1 = document.createElement('script');
//         script1.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js';
//         document.body.appendChild(script1);

//         const script2 = document.createElement('script');
//         script2.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/services/services-web.min.js';
//         document.body.appendChild(script2);

//         await Promise.all([
//           new Promise((resolve, reject) => {
//             link.onload = resolve;
//             link.onerror = () => reject(new Error('Failed to load TomTom CSS'));
//           }),
//           new Promise((resolve, reject) => {
//             script1.onload = resolve;
//             script1.onerror = () => reject(new Error('Failed to load TomTom maps script'));
//           }),
//           new Promise((resolve, reject) => {
//             script2.onload = resolve;
//             script2.onerror = () => reject(new Error('Failed to load TomTom services script'));
//           }),
//         ]);
//         console.log('TomTom SDK scripts and styles loaded successfully');
//       } catch (err) {
//         console.error('Error loading TomTom SDK:', err);
//         throw err;
//       }
//     };

//     const initializeMap = async () => {
//       try {
//         console.log('Starting map initialization');
//         await loadScriptsAndStyles();

//         if (!window.tt || !window.tt.map || !window.tt.Marker) {
//           throw new Error('TomTom SDK not loaded properly');
//         }

//         if (!mapContainer.current) {
//           throw new Error('Map container not found');
//         }

//         mapRef.current = window.tt.map({
//           key: API_KEY,
//           container: mapContainer.current,
//           zoom: 13,
//         });

//         mapRef.current.on('load', () => {
//           console.log('Map fully loaded');

//           // Create markers
//           try {
//             if (!driverMarkerRef.current) {
//               driverMarkerRef.current = new window.tt.Marker()
//                 .setLngLat([driverLocation.lng, driverLocation.lat])
//                 .addTo(mapRef.current);
//               console.log('Driver marker created');
//             }

//             if (!userMarkerRef.current) {
//               userMarkerRef.current = new window.tt.Marker({ color: 'red' })
//                 .setLngLat([userLocation.longitude, userLocation.latitude])
//                 .addTo(mapRef.current);
//               console.log('User marker created');
//             }

//             if (!hospitalMarkerRef.current) {
//               hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
//                 .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
//                 .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
//                 .addTo(mapRef.current);
//               console.log('Hospital marker created');
//             }

//             if (!policeMarkerRef.current) {
//               policeMarkerRef.current = new window.tt.Marker({ color: 'blue' })
//                 .setLngLat([policeLocation.lng, policeLocation.lat])
//                 .addTo(mapRef.current);
//               console.log('Police marker created');
//             }

//             // Add police circle
//             const circleGeoJSON = createCircleGeoJSON(policeLocation, 150);
//             mapRef.current.addSource('police-circle', {
//               type: 'geojson',
//               data: circleGeoJSON,
//             });
//             mapRef.current.addLayer({
//               id: 'police-circle',
//               type: 'fill',
//               source: 'police-circle',
//               paint: {
//                 'fill-color': '#0000FF',
//                 'fill-opacity': 0.3,
//               },
//             });
//             console.log('Police circle added');
//           } catch (err) {
//             console.error('Error adding markers or circle:', err);
//             setError('Failed to add map elements');
//           }
//         });

//         mapRef.current.on('error', (err) => {
//           console.error('Map error:', err);
//           setError('Failed to initialize map: ' + err.message);
//         });

//         const calculateRoutesDebounced = debounce(() => {
//           console.log('Calculating routes');
//           const routeLayers = ['route-driver-to-user', 'route-user-to-hospital'];

//           // Remove existing layers and sources
//           routeLayers.forEach((layerId) => {
//             try {
//               if (mapRef.current.getLayer(layerId)) {
//                 mapRef.current.removeLayer(layerId);
//                 console.log(`Removed layer: ${layerId}`);
//               }
//               if (mapRef.current.getSource(layerId)) {
//                 mapRef.current.removeSource(layerId);
//                 console.log(`Removed source: ${layerId}`);
//               }
//             } catch (err) {
//               console.error(`Error removing layer/source ${layerId}:`, err);
//             }
//           });

//           // Calculate route from driver to user
//           window.tt.services
//             .calculateRoute({
//               key: API_KEY,
//               locations: `${driverLocation.lng},${driverLocation.lat}:${userLocation.longitude},${userLocation.latitude}`,
//             })
//             .then((routeData) => {
//               const geojson = routeData.toGeoJson();
//               try {
//                 mapRef.current.addSource('route-driver-to-user', {
//                   type: 'geojson',
//                   data: geojson,
//                 });
//                 mapRef.current.addLayer({
//                   id: 'route-driver-to-user',
//                   type: 'line',
//                   source: 'route-driver-to-user',
//                   paint: {
//                     'line-color': '#00aaff',
//                     'line-width': 5,
//                   },
//                 });
//                 console.log('Driver-to-user route added');
//               } catch (err) {
//                 console.error('Error adding driver-to-user route:', err);
//                 setError('Failed to add driver-to-user route');
//               }
//             })
//             .catch((err) => {
//               console.error('Error calculating driver-to-user route:', err);
//               setError('Failed to calculate route to user');
//             });

//           // Calculate route from user to hospital
//           window.tt.services
//             .calculateRoute({
//               key: API_KEY,
//               locations: `${userLocation.longitude},${userLocation.latitude}:${hospitalLocation.longitude},${hospitalLocation.latitude}`,
//             })
//             .then((routeData) => {
//               const geojson = routeData.toGeoJson();
//               try {
//                 mapRef.current.addSource('route-user-to-hospital', {
//                   type: 'geojson',
//                   data: geojson,
//                 });
//                 mapRef.current.addLayer({
//                   id: 'route-user-to-hospital',
//                   type: 'line',
//                   source: 'route-user-to-hospital',
//                   paint: {
//                     'line-color': '#ff4444',
//                     'line-width': 5,
//                     'line-dasharray': [2, 2],
//                   },
//                 });
//                 console.log('User-to-hospital route added');
//               } catch (err) {
//                 console.error('Error adding user-to-hospital route:', err);
//                 setError('Failed to add user-to-hospital route');
//               }
//             })
//             .catch((err) => {
//               console.error('Error calculating user-to-hospital route:', err);
//               setError('Failed to calculate route to hospital');
//             });
//         }, 10000);

//         // Center map on all locations
//         const bounds = new window.tt.LngLatBounds();
//         bounds.extend([driverLocation.lng, driverLocation.lat]);
//         bounds.extend([userLocation.longitude, userLocation.latitude]);
//         bounds.extend([hospitalLocation.longitude, hospitalLocation.latitude]);
//         bounds.extend([policeLocation.lng, policeLocation.lat]);
//         mapRef.current.fitBounds(bounds, {
//           padding: 50,
//           maxZoom: 14,
//         });

//         calculateRoutesDebounced();
//       } catch (err) {
//         console.error('Map initialization failed:', err);
//         setError('Failed to initialize map: ' + err.message);
//       }
//     };

//     initializeMap();

//     return () => {
//       if (mapRef.current) {
//         try {
//           mapRef.current.remove();
//           console.log('Map removed');
//         } catch (err) {
//           console.error('Error removing map:', err);
//         }
//       }
//     };
//   }, [userLocation, hospitalLocation, driverLocation, policeLocation]);

//   // Update police marker and circle
//   useEffect(() => {
//     if (policeLocation && policeMarkerRef.current && mapRef.current) {
//       try {
//         policeMarkerRef.current.setLngLat([policeLocation.lng, policeLocation.lat]);
//         console.log('Police marker updated');

//         // Update police circle
//         if (mapRef.current.getSource('police-circle')) {
//           const circleGeoJSON = createCircleGeoJSON(policeLocation, 150);
//           mapRef.current.getSource('police-circle').setData(circleGeoJSON);
//           console.log('Police circle updated');
//         }
//       } catch (err) {
//         console.error('Error updating police marker or circle:', err);
//         setError('Failed to update police location');
//       }
//     }
//   }, [policeLocation]);

//   // Update driver marker
//   useEffect(() => {
//     if (driverLocation && driverMarkerRef.current) {
//       try {
//         driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
//         console.log('Driver marker updated');
//       } catch (err) {
//         console.error('Error updating driver marker:', err);
//         setError('Failed to update driver location');
//       }
//     }
//   }, [driverLocation]);

//   return (
//     <div className="police-map">
//       <h2>Ambulance Request {requestId}</h2>
//       {error && <p className="error">{error}</p>}
//       <div
//         id="map"
//         ref={mapContainer}
//         style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
//       >
//         {userLocation
//           ? hospitalLocation
//             ? driverLocation
//               ? policeLocation
//                 ? 'Loading map...'
//                 : 'Waiting for police location...'
//               : 'Waiting for driver location...'
//             : 'Waiting for hospital location...'
//           : 'Fetching user location...'}
//       </div>
//     </div>
//   );
// };

// export default PoliceMap;




// import React, { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import io from 'socket.io-client';
// import './policemap.css';

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

// // Function to create a GeoJSON circle
// const createCircleGeoJSON = (center, radiusInMeters) => {
//   const points = 64;
//   const coords = {
//     latitude: center.lat,
//     longitude: center.lng,
//   };
//   const km = radiusInMeters / 1000;
//   const ret = [];
//   const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
//   const distanceY = km / 110.574;

//   for (let i = 0; i < points; i++) {
//     const theta = (i / points) * (2 * Math.PI);
//     const x = distanceX * Math.cos(theta);
//     const y = distanceY * Math.sin(theta);
//     ret.push([coords.longitude + x, coords.latitude + y]);
//   }
//   ret.push(ret[0]);
//   return {
//     type: 'Feature',
//     geometry: {
//       type: 'Polygon',
//       coordinates: [ret],
//     },
//   };
// };

// const PoliceMap = () => {
//   const { requestId } = useParams();
//   const mapContainer = useRef(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [hospitalLocation, setHospitalLocation] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [policeLocation, setPoliceLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const mapRef = useRef(null);
//   const driverMarkerRef = useRef(null);
//   const userMarkerRef = useRef(null);
//   const hospitalMarkerRef = useRef(null);
//   const policeMarkerRef = useRef(null);
//   const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

//   // Join police room and handle driver location updates
//   useEffect(() => {
//     if (requestId) {
//       socket.emit('joinPolice', requestId);
//     }

//     socket.on('driverLocationUpdate', ({ requestId: updatedRequestId, location }) => {
//       if (updatedRequestId === requestId) {
//         setDriverLocation(location);
//       }
//     });

//     return () => {
//       socket.off('driverLocationUpdate');
//     };
//   }, [requestId]);

//   // Fetch alert data
//   useEffect(() => {
//     const fetchAlert = async () => {
//       try {
//         const response = await fetch(`http://localhost:5000/api/alerts/request/${requestId}`);
//         const data = await response.json();
//         if (response.ok && data) {
//           setUserLocation(data.userLocation);
//           setHospitalLocation(data.hospitalLocation);
//           setDriverLocation(data.driverLocation);
//         } else {
//           setError('Alert not found');
//         }
//       } catch (err) {
//         console.error('Error fetching alert:', err);
//         setError('Failed to fetch alert');
//       }
//     };
//     fetchAlert();
//   }, [requestId]);

//   // Get police officer's location
//   useEffect(() => {
//     navigator.geolocation.watchPosition(
//       (position) => {
//         const policePos = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//         };
//         console.log('Police Location:', policePos);
//         setPoliceLocation(policePos);
//       },
//       (err) => {
//         console.error('Geolocation error for police:', err);
//         setError('Unable to access police location. Please enable location services.');
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0,
//       }
//     );
//   }, []);

//   // Initialize map
//   useEffect(() => {
//     if (!mapContainer.current || !userLocation || !hospitalLocation || !driverLocation || !policeLocation) {
//       console.log('Map initialization skipped: missing required locations', {
//         mapContainer: !!mapContainer.current,
//         userLocation: !!userLocation,
//         hospitalLocation: !!hospitalLocation,
//         driverLocation: !!driverLocation,
//         policeLocation: !!policeLocation,
//       });
//       return;
//     }

//     const loadScriptsAndStyles = async () => {
//       try {
//         const link = document.createElement('link');
//         link.rel = 'stylesheet';
//         link.type = 'text/css';
//         link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps.css';
//         document.head.appendChild(link);

//         const script1 = document.createElement('script');
//         script1.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/maps/maps-web.min.js';
//         document.body.appendChild(script1);

//         const script2 = document.createElement('script');
//         script2.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.22.0/services/services-web.min.js';
//         document.body.appendChild(script2);

//         await Promise.all([
//           new Promise((resolve, reject) => {
//             link.onload = resolve;
//             link.onerror = () => reject(new Error('Failed to load TomTom CSS'));
//           }),
//           new Promise((resolve, reject) => {
//             script1.onload = resolve;
//             script1.onerror = () => reject(new Error('Failed to load TomTom maps script'));
//           }),
//           new Promise((resolve, reject) => {
//             script2.onload = resolve;
//             script2.onerror = () => reject(new Error('Failed to load TomTom services script'));
//           }),
//         ]);
//         console.log('TomTom SDK scripts and styles loaded successfully');
//       } catch (err) {
//         console.error('Error loading TomTom SDK:', err);
//         throw err;
//       }
//     };

//     const initializeMap = async () => {
//       try {
//         console.log('Starting map initialization');
//         await loadScriptsAndStyles();

//         if (!window.tt || !window.tt.map || !window.tt.Marker) {
//           throw new Error('TomTom SDK not loaded properly');
//         }

//         if (!mapContainer.current) {
//           throw new Error('Map container not found');
//         }

//         mapRef.current = window.tt.map({
//           key: API_KEY,
//           container: mapContainer.current,
//           zoom: 13,
//         });

//         mapRef.current.on('load', () => {
//           console.log('Map fully loaded');
//           setMapLoaded(true);

//           // Create markers
//           try {
//             if (!driverMarkerRef.current) {
//               driverMarkerRef.current = new window.tt.Marker()
//                 .setLngLat([driverLocation.lng, driverLocation.lat])
//                 .addTo(mapRef.current);
//               console.log('Driver marker created');
//             }

//             if (!userMarkerRef.current) {
//               userMarkerRef.current = new window.tt.Marker({ color: 'red' })
//                 .setLngLat([userLocation.longitude, userLocation.latitude])
//                 .addTo(mapRef.current);
//               console.log('User marker created');
//             }

//             if (!hospitalMarkerRef.current) {
//               hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
//                 .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
//                 .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
//                 .addTo(mapRef.current);
//               console.log('Hospital marker created');
//             }

//             if (!policeMarkerRef.current) {
//               policeMarkerRef.current = new window.tt.Marker({ color: 'blue' })
//                 .setLngLat([policeLocation.lng, policeLocation.lat])
//                 .addTo(mapRef.current);
//               console.log('Police marker created');
//             }

//             // Add police circle
//             const circleGeoJSON = createCircleGeoJSON(policeLocation, 150);
//             mapRef.current.addSource('police-circle', {
//               type: 'geojson',
//               data: circleGeoJSON,
//             });
//             mapRef.current.addLayer({
//               id: 'police-circle',
//               type: 'fill',
//               source: 'police-circle',
//               paint: {
//                 'fill-color': '#0000FF',
//                 'fill-opacity': 0.3,
//               },
//             });
//             console.log('Police circle added');
//           } catch (err) {
//             console.error('Error adding markers or circle:', err);
//             setError('Failed to add map elements');
//           }
//         });

//         mapRef.current.on('error', (err) => {
//           console.error('Map error:', err);
//           setError('Failed to initialize map: ' + err.message);
//         });

//         const calculateRoutesDebounced = debounce(() => {
//           console.log('Calculating routes');
//           const routeLayers = ['route-driver-to-user', 'route-user-to-hospital'];

//           // Remove existing layers and sources
//           routeLayers.forEach((layerId) => {
//             try {
//               if (mapRef.current.getLayer(layerId)) {
//                 mapRef.current.removeLayer(layerId);
//                 console.log(`Removed layer: ${layerId}`);
//               }
//               if (mapRef.current.getSource(layerId)) {
//                 mapRef.current.removeSource(layerId);
//                 console.log(`Removed source: ${layerId}`);
//               }
//             } catch (err) {
//               console.error(`Error removing layer/source ${layerId}:`, err);
//             }
//           });

//           // Calculate route from driver to user
//           window.tt.services
//             .calculateRoute({
//               key: API_KEY,
//               locations: `${driverLocation.lng},${driverLocation.lat}:${userLocation.longitude},${userLocation.latitude}`,
//             })
//             .then((routeData) => {
//               const geojson = routeData.toGeoJson();
//               try {
//                 mapRef.current.addSource('route-driver-to-user', {
//                   type: 'geojson',
//                   data: geojson,
//                 });
//                 mapRef.current.addLayer({
//                   id: 'route-driver-to-user',
//                   type: 'line',
//                   source: 'route-driver-to-user',
//                   paint: {
//                     'line-color': '#00aaff',
//                     'line-width': 5,
//                   },
//                 });
//                 console.log('Driver-to-user route added');
//               } catch (err) {
//                 console.error('Error adding driver-to-user route:', err);
//                 setError('Failed to add driver-to-user route');
//               }
//             })
//             .catch((err) => {
//               console.error('Error calculating driver-to-user route:', err);
//               setError('Failed to calculate route to user');
//             });

//           // Calculate route from user to hospital
//           window.tt.services
//             .calculateRoute({
//               key: API_KEY,
//               locations: `${userLocation.longitude},${userLocation.latitude}:${hospitalLocation.longitude},${hospitalLocation.latitude}`,
//             })
//             .then((routeData) => {
//               const geojson = routeData.toGeoJson();
//               try {
//                 mapRef.current.addSource('route-user-to-hospital', {
//                   type: 'geojson',
//                   data: geojson,
//                 });
//                 mapRef.current.addLayer({
//                   id: 'route-user-to-hospital',
//                   type: 'line',
//                   source: 'route-user-to-hospital',
//                   paint: {
//                     'line-color': '#ff4444',
//                     'line-width': 5,
//                     'line-dasharray': [2, 2],
//                   },
//                 });
//                 console.log('User-to-hospital route added');
//               } catch (err) {
//                 console.error('Error adding user-to-hospital route:', err);
//                 setError('Failed to add user-to-hospital route');
//               }
//             })
//             .catch((err) => {
//               console.error('Error calculating user-to-hospital route:', err);
//               setError('Failed to calculate route to hospital');
//             });
//         }, 10000);

//         // Center map on all locations
//         const bounds = new window.tt.LngLatBounds();
//         bounds.extend([driverLocation.lng, driverLocation.lat]);
//         bounds.extend([userLocation.longitude, userLocation.latitude]);
//         bounds.extend([hospitalLocation.longitude, hospitalLocation.latitude]);
//         bounds.extend([policeLocation.lng, policeLocation.lat]);
//         mapRef.current.fitBounds(bounds, {
//           padding: 50,
//           maxZoom: 14,
//         });

//         calculateRoutesDebounced();
//       } catch (err) {
//         console.error('Map initialization failed:', err);
//         setError('Failed to initialize map: ' + err.message);
//       }
//     };

//     initializeMap();

//     return () => {
//       if (mapRef.current) {
//         try {
//           mapRef.current.remove();
//           console.log('Map removed');
//         } catch (err) {
//           console.error('Error removing map:', err);
//         }
//       }
//     };
//   }, [userLocation, hospitalLocation, driverLocation, policeLocation]);

//   // Update police marker and circle
//   useEffect(() => {
//     if (policeLocation && policeMarkerRef.current && mapRef.current && mapLoaded) {
//       try {
//         policeMarkerRef.current.setLngLat([policeLocation.lng, policeLocation.lat]);
//         console.log('Police marker updated');

//         // Update police circle
//         const source = mapRef.current.getSource('police-circle');
//         if (source) {
//           const circleGeoJSON = createCircleGeoJSON(policeLocation, 150);
//           source.setData(circleGeoJSON);
//           console.log('Police circle updated');
//         } else {
//           console.warn('Police circle source not found, attempting to add');
//           const circleGeoJSON = createCircleGeoJSON(policeLocation, 150);
//           mapRef.current.addSource('police-circle', {
//             type: 'geojson',
//             data: circleGeoJSON,
//           });
//           mapRef.current.addLayer({
//             id: 'police-circle',
//             type: 'fill',
//             source: 'police-circle',
//             paint: {
//               'fill-color': '#0000FF',
//               'fill-opacity': 0.3,
//             },
//           });
//           console.log('Police circle re-added');
//         }
//       } catch (err) {
//         console.error('Error updating police marker or circle:', err);
//         setError('Failed to update police location');
//       }
//     } else {
//       console.log('Police update skipped:', {
//         policeLocation: !!policeLocation,
//         policeMarker: !!policeMarkerRef.current,
//         map: !!mapRef.current,
//         mapLoaded,
//       });
//     }
//   }, [policeLocation, mapLoaded]);

//   // Update driver marker
//   useEffect(() => {
//     if (driverLocation && driverMarkerRef.current && mapRef.current && mapLoaded) {
//       try {
//         driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
//         console.log('Driver marker updated');
//       } catch (err) {
//         console.error('Error updating driver marker:', err);
//         setError('Failed to update driver location');
//       }
//     }
//   }, [driverLocation, mapLoaded]);

//   return (
//     <div className="police-map">
//       <h2>Ambulance Request {requestId}</h2>
//       {error && <p className="error">{error}</p>}
//       <div
//         id="map"
//         ref={mapContainer}
//         style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
//       >
//         {userLocation
//           ? hospitalLocation
//             ? driverLocation
//               ? policeLocation
//                 ? 'Loading map...'
//                 : 'Waiting for police location...'
//               : 'Waiting for driver location...'
//             : 'Waiting for hospital location...'
//           : 'Fetching user location...'}
//       </div>
//     </div>
//   );
// };

// export default PoliceMap;




import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './policemap.css';

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

// Function to create a GeoJSON circle
const createCircleGeoJSON = (center, radiusInMeters) => {
  const points = 64;
  const coords = {
    latitude: center.lat,
    longitude: center.lng,
  };
  const km = radiusInMeters / 1000;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
  };
};

const PoliceMap = () => {
  const { requestId } = useParams();
  const mapContainer = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [policeLocation, setPoliceLocation] = useState(null);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const hospitalMarkerRef = useRef(null);
  const policeMarkerRef = useRef(null);
  const API_KEY = 'lLcJIAppIBBRFN6wNjpax85Vpoj2FqLN';

  // Join police room and handle driver location updates
  useEffect(() => {
    if (requestId) {
      socket.emit('joinPolice', requestId);
    }

    socket.on('driverLocationUpdate', ({ requestId: updatedRequestId, location }) => {
      if (updatedRequestId === requestId) {
        setDriverLocation(location);
      }
    });

    return () => {
      socket.off('driverLocationUpdate');
    };
  }, [requestId]);

  // Fetch alert data
  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/alerts/request/${requestId}`);
        const data = await response.json();
        if (response.ok && data) {
          setUserLocation(data.userLocation);
          setHospitalLocation(data.hospitalLocation);
          setDriverLocation(data.driverLocation);
        } else {
          setError('Alert not found');
        }
      } catch (err) {
        console.error('Error fetching alert:', err);
        setError('Failed to fetch alert');
      }
    };
    fetchAlert();
  }, [requestId]);

  // Get police officer's location
  useEffect(() => {
    navigator.geolocation.watchPosition(
      (position) => {
        const policePos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log('Police Location:', policePos);
        setPoliceLocation(policePos);
      },
      (err) => {
        console.error('Geolocation error for police:', err);
        setError('Unable to access police location. Please enable location services.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || !hospitalLocation || !driverLocation || !policeLocation) {
      console.log('Map initialization skipped: missing required locations', {
        mapContainer: !!mapContainer.current,
        userLocation: !!userLocation,
        hospitalLocation: !!hospitalLocation,
        driverLocation: !!driverLocation,
        policeLocation: !!policeLocation,
      });
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
          setMapLoaded(true);

          // Create markers
          try {
            if (!driverMarkerRef.current) {
              driverMarkerRef.current = new window.tt.Marker()
                .setLngLat([driverLocation.lng, driverLocation.lat])
                .addTo(mapRef.current);
              console.log('Driver marker created');
            }

            if (!userMarkerRef.current) {
              userMarkerRef.current = new window.tt.Marker({ color: 'red' })
                .setLngLat([userLocation.longitude, userLocation.latitude])
                .addTo(mapRef.current);
              console.log('User marker created');
            }

            if (!hospitalMarkerRef.current) {
              hospitalMarkerRef.current = new window.tt.Marker({ color: 'green' })
                .setLngLat([hospitalLocation.longitude, hospitalLocation.latitude])
                .setPopup(new window.tt.Popup().setText(hospitalLocation.name))
                .addTo(mapRef.current);
              console.log('Hospital marker created');
            }

            if (!policeMarkerRef.current) {
              policeMarkerRef.current = new window.tt.Marker({ color: 'blue' })
                .setLngLat([policeLocation.lng, policeLocation.lat])
                .addTo(mapRef.current);
              console.log('Police marker created');
            }

            // Add police circle
            const circleGeoJSON = createCircleGeoJSON(policeLocation, 400);
            mapRef.current.addSource('police-circle', {
              type: 'geojson',
              data: circleGeoJSON,
            });
            mapRef.current.addLayer({
              id: 'police-circle',
              type: 'fill',
              source: 'police-circle',
              paint: {
                'fill-color': '#0000FF',
                'fill-opacity': 0.3,
              },
            });
            console.log('Police circle added');
          } catch (err) {
            console.error('Error adding markers or circle:', err);
            setError('Failed to add map elements');
          }
        });

        mapRef.current.on('error', (err) => {
          console.error('Map error:', err);
          setError('Failed to initialize map: ' + err.message);
        });

        const calculateRoutesDebounced = debounce(() => {
          console.log('Calculating routes');
          const routeLayers = ['route-driver-to-user', 'route-user-to-hospital'];

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

          // Calculate route from driver to user
          window.tt.services
            .calculateRoute({
              key: API_KEY,
              locations: `${driverLocation.lng},${driverLocation.lat}:${userLocation.longitude},${userLocation.latitude}`,
            })
            .then((routeData) => {
              const geojson = routeData.toGeoJson();
              try {
                mapRef.current.addSource('route-driver-to-user', {
                  type: 'geojson',
                  data: geojson,
                });
                mapRef.current.addLayer({
                  id: 'route-driver-to-user',
                  type: 'line',
                  source: 'route-driver-to-user',
                  paint: {
                    'line-color': '#00aaff',
                    'line-width': 5,
                  },
                });
                console.log('Driver-to-user route added');
              } catch (err) {
                console.error('Error adding driver-to-user route:', err);
                setError('Failed to add driver-to-user route');
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

        // Center map on all locations
        const bounds = new window.tt.LngLatBounds();
        bounds.extend([driverLocation.lng, driverLocation.lat]);
        bounds.extend([userLocation.longitude, userLocation.latitude]);
        bounds.extend([hospitalLocation.longitude, hospitalLocation.latitude]);
        bounds.extend([policeLocation.lng, policeLocation.lat]);
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14,
        });

        calculateRoutesDebounced();
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
  }, [userLocation, hospitalLocation, driverLocation, policeLocation]);

  // Update police marker and circle
  useEffect(() => {
    if (policeLocation && policeMarkerRef.current && mapRef.current && mapLoaded) {
      try {
        policeMarkerRef.current.setLngLat([policeLocation.lng, policeLocation.lat]);
        console.log('Police marker updated');

        // Update police circle
        const source = mapRef.current.getSource('police-circle');
        if (source) {
          const circleGeoJSON = createCircleGeoJSON(policeLocation, 400);
          source.setData(circleGeoJSON);
          console.log('Police circle updated');
        } else {
          console.warn('Police circle source not found, attempting to add');
          const circleGeoJSON = createCircleGeoJSON(policeLocation, 400);
          mapRef.current.addSource('police-circle', {
            type: 'geojson',
            data: circleGeoJSON,
          });
          mapRef.current.addLayer({
            id: 'police-circle',
            type: 'fill',
            source: 'police-circle',
            paint: {
              'fill-color': '#0000FF',
              'fill-opacity': 0.3,
            },
          });
          console.log('Police circle re-added');
        }
      } catch (err) {
        console.error('Error updating police marker or circle:', err);
        setError('Failed to update police location');
      }
    } else {
      console.log('Police update skipped:', {
        policeLocation: !!policeLocation,
        policeMarker: !!policeMarkerRef.current,
        map: !!mapRef.current,
        mapLoaded,
      });
    }
  }, [policeLocation, mapLoaded]);

  // Update driver marker
  useEffect(() => {
    if (driverLocation && driverMarkerRef.current && mapRef.current && mapLoaded) {
      try {
        driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
        console.log('Driver marker updated');
      } catch (err) {
        console.error('Error updating driver marker:', err);
        setError('Failed to update driver location');
      }
    }
  }, [driverLocation, mapLoaded]);

  return (
    <div className="police-map">
      <h2>Ambulance Request {requestId}</h2>
      {error && <p className="error">{error}</p>}
      <div
        id="map"
        ref={mapContainer}
        style={{ width: '100%', maxWidth: '800px', height: '500px', margin: '20px auto', border: '1px solid #ccc' }}
      >
        {userLocation
          ? hospitalLocation
            ? driverLocation
              ? policeLocation
                ? 'Loading map...'
                : 'Waiting for police location...'
              : 'Waiting for driver location...'
            : 'Waiting for hospital location...'
          : 'Fetching user location...'}
      </div>
    </div>
  );
};

export default PoliceMap;