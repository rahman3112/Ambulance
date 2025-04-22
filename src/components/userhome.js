import React, { useEffect, useState, useRef } from 'react';
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
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

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
      socket.emit('joinChat', requestId);
    });

    socket.on('requestCancelled', () => {
      setStatus('Request cancelled');
      setDriverEmail('');
      setRequestId(null);
      setEmergencyType(null);
      setChatMessages([]);
    });

    socket.on('requestCompleted', () => {
      setStatus('Ambulance request completed');
      setDriverEmail('');
      setRequestId(null);
      setEmergencyType(null);
      setChatMessages([]);
    });

    socket.on('chatMessage', ({ requestId: msgRequestId, sender, message }) => {
      if (requestId === msgRequestId) {
        setChatMessages((prev) => [...prev, { sender, message }]);
      }
    });

    return () => {
      socket.off('requestAccepted');
      socket.off('requestCancelled');
      socket.off('requestCompleted');
      socket.off('chatMessage');
    };
  }, [requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
        setChatMessages([]);
      } else {
        const data = await res.json();
        setStatus(data.message);
      }
    } catch (error) {
      setStatus('Error cancelling request');
    }
  };

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
    <div className="user-dashboard">
      <h2>Book an Ambulance</h2>

      <div className="map-container">
        {location ? (
          <iframe
            width="100%"
            height="300px"
            frameBorder="0"
            style={{ border: '2px solid #0F9E99', borderRadius: '10px' }}
            src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
            allowFullScreen
          ></iframe>
        ) : (
          <p>Loading map...</p>
        )}
      </div>

      {!requestId && (
        <button className="main-btn" onClick={() => setPopup(true)}>Book Ambulance</button>
      )}
      {requestId && (
        <button className="cancel-btn" onClick={cancelRequest}>
          Cancel Request
        </button>
      )}
      {popup && (
        <div className="popup">
          <h4>Select Emergency Type</h4>
          <button className="option-btn" onClick={() => sendRequest('emergency')}>Emergency</button>
          <button className="option-btn" onClick={() => sendRequest('not-emergency')}>Not Emergency</button>
          <button className="cancel-btn" onClick={() => setPopup(false)}>Close</button>
        </div>
      )}
      <p>{status}</p>
      {driverEmail && (
        <p>
          <strong>Driver's Email:</strong> {driverEmail}
        </p>
      )}

      {requestId && driverEmail && (
        <div className="user-chat-box">
          <h4>Chat with Driver</h4>
          <div className="user-chat-messages">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`user-chat-message ${
                  msg.sender === userEmail ? 'user-message-self' : 'user-message-other'
                }`}
              >
                <strong>{msg.sender}:</strong> {msg.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="user-chat-input">
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
      )}
    </div>
  );
};

export default UserDashboard;