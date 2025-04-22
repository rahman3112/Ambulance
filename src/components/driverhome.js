// import React, { useState, useEffect } from 'react';
// import io from 'socket.io-client';
// import './driverhome.css';

// const socket = io('http://localhost:5000');

// const DriverHome = () => {
//   const [alertStatus, setAlertStatus] = useState('');
//   const [userEmail, setUserEmail] = useState('');
//   const [requests, setRequests] = useState([]);
//   const [acceptedRequest, setAcceptedRequest] = useState(null);

//   useEffect(() => {
//     const email = sessionStorage.getItem('loggedInEmail');
//     if (email) {
//       setUserEmail(email);
//       socket.emit('join', email);
//       fetchRequests();
//     } else {
//       setAlertStatus('No user logged in');
//     }

//     socket.on('newRequest', (newRequest) => {
//       setRequests((prev) => [...prev, newRequest]);
//     });

//     socket.on('requestUpdated', (updatedRequest) => {
//       setRequests((prev) => prev.filter((req) => req._id !== updatedRequest._id));
//     });

//     socket.on('requestCancelled', (requestId) => {
//       setRequests((prev) => prev.filter((req) => req._id !== requestId));
//     });

//     socket.on('requestCompleted', (requestId) => {
//       if (acceptedRequest && acceptedRequest.requestId === requestId) {
//         setAcceptedRequest(null);
//         setAlertStatus('Request completed');
//       }
//       setRequests((prev) => prev.filter((req) => req._id !== requestId));
//     });

//     return () => {
//       socket.off('newRequest');
//       socket.off('requestUpdated');
//       socket.off('requestCancelled');
//       socket.off('requestCompleted');
//     };
//   }, [acceptedRequest]);

//   const fetchRequests = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/requests');
//       const data = await response.json();
//       setRequests(data);
//     } catch (error) {
//       console.error('Error fetching requests:', error);
//     }
//   };

//   const acceptRequest = async (requestId) => {
//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/accept', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ requestId, driverEmail: userEmail }),
//       });

//       if (response.ok) {
//         setRequests((prev) => prev.filter((req) => req._id !== requestId));
//         setAcceptedRequest({ requestId });
//         setAlertStatus('Request accepted');
//       } else {
//         const data = await response.json();
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       setAlertStatus('Error accepting request');
//     }
//   };

//   const completeRequest = async () => {
//     if (!acceptedRequest) return;

//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ requestId: acceptedRequest.requestId, driverEmail: userEmail }),
//       });

//       if (response.ok) {
//         setAcceptedRequest(null);
//         setAlertStatus('Request completed');
//       } else {
//         const data = await response.json();
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Error completing request:', error);
//       setAlertStatus('Error completing request');
//     }
//   };

//   const sendAlert = async () => {
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

//   const stopAlert = async () => {
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
//     <div className="driver-home">
//       <nav className="navbar">
//         <h2>Driver Dashboard</h2>
//         <p>{userEmail}</p>
//       </nav>

//       <div className="main-content">
//         <div className="alert-section">
//           <h3>Send an Emergency Alert</h3>
//           <button onClick={sendAlert}>Send Alert</button>
//           <button onClick={stopAlert}>Stop Alert</button>
//           <p className="alert-status">{alertStatus}</p>
//         </div>

//         {acceptedRequest && (
//           <div className="accepted-request">
//             <h4>Accepted Request</h4>
//             <p><strong>Request ID:</strong> {acceptedRequest.requestId}</p>
//             <button onClick={completeRequest}>Mark as Completed</button>
//           </div>
//         )}

//         <div className="right-panel">
//           <h4>Incoming Ambulance Requests</h4>
//           <div className="scroll-list">
//             {requests.length === 0 ? (
//               <p>No requests found</p>
//             ) : (
//               requests.map((req) => (
//                 <div key={req._id} className="request-card">
//                   <p><strong>Email:</strong> {req.userEmail}</p>
//                   <p>
//                     <strong>Location:</strong> Latitude: {req.location.latitude}, Longitude:{' '}
//                     {req.location.longitude}
//                   </p>
//                   <p><strong>Emergency:</strong> {req.emergency ? 'Yes' : 'No'}</p>
//                   <p><strong>Status:</strong> {req.accepted ? 'Accepted' : 'Pending'}</p>
//                   {!req.accepted && (
//                     <button onClick={() => acceptRequest(req._id)}>Accept</button>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DriverHome;

// import React, { useState, useEffect } from 'react';
// import io from 'socket.io-client';
// import './driverhome.css';

// const socket = io('http://localhost:5000');

// const DriverHome = () => {
//   const [alertStatus, setAlertStatus] = useState('');
//   const [userEmail, setUserEmail] = useState('');
//   const [requests, setRequests] = useState([]);
//   const [acceptedRequest, setAcceptedRequest] = useState(null);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatInput, setChatInput] = useState('');

//   useEffect(() => {
//     const email = sessionStorage.getItem('loggedInEmail');
//     if (email) {
//       setUserEmail(email);
//       socket.emit('join', email);
//       fetchRequests();
//     } else {
//       setAlertStatus('No user logged in');
//     }

//     socket.on('newRequest', (newRequest) => {
//       setRequests((prev) => [...prev, newRequest]);
//     });

//     socket.on('requestUpdated', (updatedRequest) => {
//       setRequests((prev) => prev.filter((req) => req._id !== updatedRequest._id));
//     });

//     socket.on('requestCancelled', (requestId) => {
//       setRequests((prev) => prev.filter((req) => req._id !== requestId));
//       if (acceptedRequest && acceptedRequest.requestId === requestId) {
//         setAcceptedRequest(null);
//         setChatMessages([]);
//         setAlertStatus('Request cancelled');
//       }
//     });

//     socket.on('requestCompleted', (requestId) => {
//       if (acceptedRequest && acceptedRequest.requestId === requestId) {
//         setAcceptedRequest(null);
//         setChatMessages([]);
//         setAlertStatus('Request completed');
//       }
//       setRequests((prev) => prev.filter((req) => req._id !== requestId));
//     });

//     socket.on('chatMessage', ({ requestId, sender, message }) => {
//       if (acceptedRequest && acceptedRequest.requestId === requestId) {
//         setChatMessages((prev) => [...prev, { sender, message }]);
//       }
//     });

//     return () => {
//       socket.off('newRequest');
//       socket.off('requestUpdated');
//       socket.off('requestCancelled');
//       socket.off('requestCompleted');
//       socket.off('chatMessage');
//     };
//   }, [acceptedRequest]);

//   const fetchRequests = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/requests');
//       const data = await response.json();
//       setRequests(data);
//     } catch (error) {
//       console.error('Error fetching requests:', error);
//     }
//   };

//   const acceptRequest = async (requestId) => {
//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/accept', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ requestId, driverEmail: userEmail }),
//       });

//       if (response.ok) {
//         setRequests((prev) => prev.filter((req) => req._id !== requestId));
//         setAcceptedRequest({ requestId });
//         setAlertStatus('Request accepted');
//         socket.emit('joinChat', requestId);
//       } else {
//         const data = await response.json();
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       setAlertStatus('Error accepting request');
//     }
//   };

//   const completeRequest = async () => {
//     if (!acceptedRequest) return;

//     try {
//       const response = await fetch('http://localhost:5000/api/ambulance/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ requestId: acceptedRequest.requestId, driverEmail: userEmail }),
//       });

//       if (response.ok) {
//         setAcceptedRequest(null);
//         setChatMessages([]);
//         setAlertStatus('Request completed');
//       } else {
//         const data = await response.json();
//         setAlertStatus(data.message);
//       }
//     } catch (error) {
//       console.error('Error completing request:', error);
//       setAlertStatus('Error completing request');
//     }
//   };

//   const sendAlert = async () => {
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

//   const stopAlert = async () => {
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

//   const sendChatMessage = () => {
//     if (chatInput.trim() && acceptedRequest) {
//       socket.emit('chatMessage', {
//         requestId: acceptedRequest.requestId,
//         sender: userEmail,
//         message: chatInput,
//       });
//       setChatMessages((prev) => [...prev, { sender: userEmail, message: chatInput }]);
//       setChatInput('');
//     }
//   };

//   return (
//     <div className="driver-home">
//       <nav className="navbar">
//         <h2>Driver Dashboard</h2>
//         <p>{userEmail}</p>
//       </nav>

//       <div className="main-content">
//         <div className="alert-section">
//           <h3>Send an Emergency Alert</h3>
//           <button onClick={sendAlert}>Send Alert</button>
//           <button onClick={stopAlert}>Stop Alert</button>
//           <p className="alert-status">{alertStatus}</p>
//         </div>

//         {acceptedRequest && (
//           <div className="accepted-request">
//             <h4>Accepted Request</h4>
//             <p><strong>Request ID:</strong> {acceptedRequest.requestId}</p>
//             <button onClick={completeRequest}>Mark as Completed</button>
//           </div>
//         )}

//         <div className="right-panel">
//           <h4>Incoming Ambulance Requests</h4>
//           <div className="scroll-list">
//             {requests.length === 0 ? (
//               <p>No requests found</p>
//             ) : (
//               requests.map((req) => (
//                 <div key={req._id} className="request-card">
//                   <p><strong>Email:</strong> {req.userEmail}</p>
//                   <p>
//                     <strong>Location:</strong> Latitude: {req.location.latitude}, Longitude:{' '}
//                     {req.location.longitude}
//                   </p>
//                   <p><strong>Emergency:</strong> {req.emergency ? 'Yes' : 'No'}</p>
//                   <p><strong>Status:</strong> {req.accepted ? 'Accepted' : 'Pending'}</p>
//                   {!req.accepted && (
//                     <button onClick={() => acceptRequest(req._id)}>Accept</button>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {acceptedRequest && (
//         <div className="chat-box1">
//           <h4>Chat with User</h4>
//           <div className="chat-messages">
//             {chatMessages.map((msg, index) => (
//               <div
//                 key={index}
//                 className={`chat-message ${msg.sender === userEmail ? 'user' : 'other'}`}
//               >
//                 <strong>{msg.sender}:</strong> {msg.message}
//               </div>
//             ))}
//           </div>
//           <input
//             type="text"
//             placeholder="Type a message..."
//             value={chatInput}
//             onChange={(e) => setChatInput(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
//           />
//           <button onClick={sendChatMessage}>Send</button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DriverHome;

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './driverhome.css';

const socket = io('http://localhost:5000');

const DriverHome = () => {
  const [alertStatus, setAlertStatus] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [requests, setRequests] = useState([]);
  const [acceptedRequest, setAcceptedRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const email = sessionStorage.getItem('loggedInEmail');
    if (email) {
      setUserEmail(email);
      socket.emit('join', email);
      fetchRequests();
    } else {
      setAlertStatus('No user logged in');
    }

    socket.on('newRequest', (newRequest) => {
      setRequests((prev) => [...prev, newRequest]);
    });

    socket.on('requestUpdated', (updatedRequest) => {
      setRequests((prev) => prev.filter((req) => req._id !== updatedRequest._id));
    });

    socket.on('requestCancelled', (requestId) => {
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
      if (acceptedRequest && acceptedRequest.requestId === requestId) {
        setAcceptedRequest(null);
        setChatMessages([]);
        setAlertStatus('Request cancelled');
      }
    });

    socket.on('requestCompleted', (requestId) => {
      if (acceptedRequest && acceptedRequest.requestId === requestId) {
        setAcceptedRequest(null);
        setChatMessages([]);
        setAlertStatus('Request completed');
      }
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    });

    socket.on('chatMessage', ({ requestId, sender, message }) => {
      if (acceptedRequest && acceptedRequest.requestId === requestId) {
        setChatMessages((prev) => [...prev, { sender, message }]);
      }
    });

    return () => {
      socket.off('newRequest');
      socket.off('requestUpdated');
      socket.off('requestCancelled');
      socket.off('requestCompleted');
      socket.off('chatMessage');
    };
  }, [acceptedRequest]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ambulance/requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      const response = await fetch('http://localhost:5000/api/ambulance/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, driverEmail: userEmail }),
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((req) => req._id !== requestId));
        setAcceptedRequest({ requestId });
        setAlertStatus('Request accepted');
        socket.emit('joinChat', requestId);
      } else {
        const data = await response.json();
        setAlertStatus(data.message);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      setAlertStatus('Error accepting request');
    }
  };

  const completeRequest = async () => {
    if (!acceptedRequest) return;

    try {
      const response = await fetch('http://localhost:5000/api/ambulance/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: acceptedRequest.requestId, driverEmail: userEmail }),
      });

      if (response.ok) {
        setAcceptedRequest(null);
        setChatMessages([]);
        setAlertStatus('Request completed');
      } else {
        const data = await response.json();
        setAlertStatus(data.message);
      }
    } catch (error) {
      console.error('Error completing request:', error);
      setAlertStatus('Error completing request');
    }
  };

  const sendAlert = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
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

  const stopAlert = async () => {
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

  const sendChatMessage = () => {
    if (chatInput.trim() && acceptedRequest) {
      socket.emit('chatMessage', {
        requestId: acceptedRequest.requestId,
        sender: userEmail,
        message: chatInput,
      });
      setChatMessages((prev) => [...prev, { sender: userEmail, message: chatInput }]);
      setChatInput('');
    }
  };

  return (
    <div className="driver-home">
      <nav className="navbar">
        <h2>Driver Dashboard</h2>
        <p>{userEmail}</p>
      </nav>

      <div className="main-content">
        <div className="alert-section">
          <h3>Send an Emergency Alert</h3>
          <button onClick={sendAlert}>Send Alert</button>
          <button onClick={stopAlert}>Stop Alert</button>
          <p className="alert-status">{alertStatus}</p>
        </div>

        {acceptedRequest && (
          <div className="accepted-request">
            <h4>Accepted Request</h4>
            <p><strong>Request ID:</strong> {acceptedRequest.requestId}</p>
            <button onClick={completeRequest}>Mark as Completed</button>
          </div>
        )}

        <div className="right-panel">
          <h4>Incoming Ambulance Requests</h4>
          <div className="scroll-list">
            {requests.length === 0 ? (
              <p>No requests found</p>
            ) : (
              requests.map((req) => (
                <div key={req._id} className="request-card">
                  <p><strong>Email:</strong> {req.userEmail}</p>
                  <p>
                    <strong>Location:</strong> Latitude: {req.location.latitude}, Longitude:{' '}
                    {req.location.longitude}
                  </p>
                  <p><strong>Emergency:</strong> {req.emergency ? 'Yes' : 'No'}</p>
                  <p><strong>Status:</strong> {req.accepted ? 'Accepted' : 'Pending'}</p>
                  {!req.accepted && (
                    <button onClick={() => acceptRequest(req._id)}>Accept</button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {acceptedRequest && (
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
      )}
    </div>
  );
};

export default DriverHome;