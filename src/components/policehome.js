// import React, { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import io from 'socket.io-client';
// import './policehome.css'; // Create this CSS file for styling

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

// const PoliceHome = () => {
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

//   // Join police room for real-time driver location updates
//   useEffect(() => {
//     if (requestId) {
//       socket.emit('joinPolice', requestId);
//     }

//     // Handle driver location updates
//     socket.on('driverLocationUpdate', ({ requestId: updatedRequestId, location }) => {
//       if (updatedRequestId === requestId) {
//         setDriverLocation(location);
//       }
//     });

//     return () => {
//       socket.off('driverLocationUpdate');
//     };
//   }, [requestId]);

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

//   // Initialize map and display locations
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
//         center: [userLocation.longitude, userLocation.latitude], // Center on user initially
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

//         // Route 1: Driver to User
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

//       // Add markers
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

//   // Update driver marker when location changes
//   useEffect(() => {
//     if (driverLocation && driverMarkerRef.current) {
//       driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
//       mapRef.current.setCenter([driverLocation.lng, driverLocation.lat]);
//     }
//   }, [driverLocation]);

//   return (
//     <div className="police-home">
//       <h2>Police Monitoring: Ambulance Request</h2>
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
//             : 'Finding nearest hospital...'
//           : 'Fetching user location...'}
//       </div>
//     </div>
//   );
// };

// export default PoliceHome;




import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './policehome.css';

// Initialize Socket.IO client
const socket = io('http://localhost:5000');

const PoliceHome = () => {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  // Listen for new alerts and fetch existing ones
  useEffect(() => {
    socket.on('newAlert', ({ alertId, requestId, driverEmail, userLocation, driverLocation, hospitalLocation }) => {
      setAlerts((prev) => [
        ...prev,
        { alertId, requestId, driverEmail, userLocation, driverLocation, hospitalLocation },
      ]);
    });

    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/alerts');
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    fetchAlerts();

    return () => {
      socket.off('newAlert');
    };
  }, []);

  return (
    <div className="police-home">
      <h2>Police Alert Dashboard</h2>
      <h3>Incoming Alerts</h3>
      {alerts.length === 0 ? (
        <p>No alerts received</p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li key={alert.alertId}>
              <p>Alert ID: {alert.alertId}</p>
              <p>Request ID: {alert.requestId}</p>
              <p>Driver: {alert.driverEmail}</p>
              <button onClick={() => navigate(`/policemap/${alert.requestId}`)}>
                View Map
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PoliceHome;