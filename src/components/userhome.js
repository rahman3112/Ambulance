import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './userhome.css';

const socket = io('http://localhost:5000');

const UserDashboard = () => {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('');
  const [popup, setPopup] = useState(false);
  const [emergencyType, setEmergencyType] = useState(null);
  const [driverEmail, setDriverEmail] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [requestId, setRequestId] = useState(null);

  useEffect(() => {
    const email = sessionStorage.getItem('loggedInEmail');
    if (email) {
      setUserEmail(email);
      socket.emit('join', email);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setStatus('Failed to get location')
    );

    socket.on('requestAccepted', ({ requestId, driverEmail }) => {
      setStatus(`Ambulance booked by: ${driverEmail}`);
      setDriverEmail(driverEmail);
      setRequestId(requestId);
    });

    socket.on('requestCancelled', () => {
      setStatus('Request cancelled');
      setDriverEmail('');
      setRequestId(null);
      setEmergencyType(null);
    });

    socket.on('requestCompleted', () => {
      setStatus('Ambulance request completed');
      setDriverEmail('');
      setRequestId(null);
      setEmergencyType(null);
    });

    return () => {
      socket.off('requestAccepted');
      socket.off('requestCancelled');
      socket.off('requestCompleted');
    };
  }, []);

  const sendRequest = async (emergency) => {
    if (requestId) {
      setStatus('You already have an active request.');
      return;
    }

    if (!location) {
      setStatus('Location not available. Please enable location services.');
      return;
    }

    setPopup(false);
    setEmergencyType(emergency);

    const body = {
      userEmail,
      location,
      emergency: emergency === 'emergency',
    };

    try {
      const res = await fetch('http://localhost:5000/api/ambulance/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('Finding ambulance...');
        setRequestId(data.requestId);
      } else {
        setStatus(data.message);
      }
    } catch (error) {
      setStatus('Error sending request');
    }
  };

  const cancelRequest = async () => {
    if (!requestId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/ambulance/cancel/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setStatus('Request cancelled');
        setDriverEmail('');
        setRequestId(null);
        setEmergencyType(null);
      } else {
        const data = await res.json();
        setStatus(data.message);
      }
    } catch (error) {
      setStatus('Error cancelling request');
    }
  };

  return (
    <div className="user-dashboard">
      <h2>Your Current Location</h2>
      <div id="map">
        {location ? (
          <iframe
            width="100%"
            height="300px"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
            allowFullScreen
          ></iframe>
        ) : (
          <p>Loading map...</p>
        )}
      </div>

      {!requestId && (
        <button onClick={() => setPopup(true)}>Book Ambulance</button>
      )}
      {requestId && (
        <button onClick={cancelRequest} style={{ backgroundColor: 'red' }}>
          Cancel Request
        </button>
      )}
      {popup && (
        <div className="popup">
          <h4>Select Emergency Type</h4>
          <button onClick={() => sendRequest('emergency')}>Emergency</button>
          <button onClick={() => sendRequest('not-emergency')}>Not Emergency</button>
          <button onClick={() => setPopup(false)}>Cancel</button>
        </div>
      )}
      <p>{status}</p>
      {driverEmail && (
        <p>
          <strong>Driver's Email:</strong> {driverEmail}
        </p>
      )}
    </div>
  );
};

export default UserDashboard;