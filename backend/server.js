// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// // Express setup
// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // Connect to MongoDB Compass
// mongoose.connect('mongodb://localhost:27017/hack', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   console.log('Connected to MongoDB Compass');
// });

// // User Schema
// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, unique: true },
//   password: String,
//   role: String,
// });

// const User = mongoose.model('User', userSchema);

// // Signup route
// app.post('/api/auth/signup', async (req, res) => {
//   const { name, email, password, role } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const newUser = new User({ name, email, password, role });
//     await newUser.save();

//     res.status(200).json({ message: 'Signup successful' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error during signup' });
//   }
// });

// // Login route
// app.post('/api/auth/login', async (req, res) => {
//     const { email, password } = req.body;
//     console.log('Login request received:', email, password);
  
//     try {
//       const user = await User.findOne({ email, password });
//       console.log('User found:', user);
  
//       if (!user) {
//         return res.status(401).json({ message: 'Invalid credentials' });
//       }
  
//       let redirectPath = '';
//       switch (user.role) {
//         case 'driver': redirectPath = '/driverhome'; break;
//         case 'user': redirectPath = '/userhome'; break;
//         case 'hospital': redirectPath = '/hospitalhome'; break;
//         case 'police': redirectPath = '/policehome'; break;
//         default: redirectPath = '/';
//       }
  
//       return res.status(200).json({
//         message: 'Login successful',
//         role: user.role,
//         redirect: redirectPath,
//       });
//     } catch (err) {
//       console.error('Login route error:', err);
//       return res.status(500).json({ message: 'Server error during login' });
//     }
//   });



//   const alertSchema = new mongoose.Schema({
//     userEmail: String,
//     timestamp: { type: Date, default: Date.now },
//   });
//   const Alert = mongoose.model('Alert', alertSchema);
  
//   const ambulanceRequestSchema = new mongoose.Schema({
//     userEmail: String,
//     location: { latitude: Number, longitude: Number },
//     emergency: Boolean,
//     timestamp: { type: Date, default: Date.now },
//     driverEmail: String,
//     accepted: { type: Boolean, default: false },
//   });
//   const AmbulanceRequest = mongoose.model('AmbulanceRequest', ambulanceRequestSchema);
  
//   // Socket.IO connection
//   io.on('connection', (socket) => {
//     console.log('Client connected:', socket.id);
  
//     // Join a room based on user email
//     socket.on('join', (userEmail) => {
//       socket.join(userEmail);
//       console.log(`${userEmail} joined room`);
//     });
  
//     socket.on('disconnect', () => {
//       console.log('Client disconnected:', socket.id);
//     });
//   });
  
//   // Send Alert
//   app.post('/api/alerts/send', async (req, res) => {
//     const { email } = req.body;
//     try {
//       const newAlert = new Alert({ userEmail: email });
//       await newAlert.save();
//       res.status(200).json({ message: 'Alert sent', alertId: newAlert._id });
//     } catch (error) {
//       console.error('Error sending alert:', error);
//       res.status(500).json({ message: 'Failed to send alert' });
//     }
//   });
  
//   // Stop Alert
//   app.delete('/api/alerts/stop', async (req, res) => {
//     const { email } = req.body;
//     try {
//       const result = await Alert.findOneAndDelete({ userEmail: email });
//       if (result) {
//         res.status(200).json({ message: 'Alert stopped and removed' });
//       } else {
//         res.status(404).json({ message: 'No active alert found' });
//       }
//     } catch (error) {
//       console.error('Error stopping alert:', error);
//       res.status(500).json({ message: 'Failed to stop alert' });
//     }
//   });
  
//   // Create ambulance request
//   app.post('/api/ambulance/request', async (req, res) => {
//     const { userEmail, location, emergency } = req.body;
//     try {
//       // Check if user already has an active request
//       const existingRequest = await AmbulanceRequest.findOne({
//         userEmail,
//         accepted: false,
//         driverEmail: null,
//       });
//       if (existingRequest) {
//         return res.status(400).json({ message: 'You already have an active request' });
//       }
  
//       const newRequest = new AmbulanceRequest({ userEmail, location, emergency });
//       await newRequest.save();
  
//       // Notify drivers of new request
//       io.emit('newRequest', newRequest);
  
//       res.status(200).json({ message: 'Request sent', requestId: newRequest._id });
//     } catch (err) {
//       console.error('Error creating request:', err);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });
  
//   // Get all pending requests
//   app.get('/api/ambulance/requests', async (req, res) => {
//     try {
//       const requests = await AmbulanceRequest.find({ accepted: false, driverEmail: null });
//       res.status(200).json(requests);
//     } catch (err) {
//       res.status(500).json({ message: 'Server error' });
//     }
//   });
  
//   // Accept a request
//   app.post('/api/ambulance/accept', async (req, res) => {
//     const { requestId, driverEmail } = req.body;
//     try {
//       const request = await AmbulanceRequest.findByIdAndUpdate(
//         requestId,
//         { driverEmail, accepted: true },
//         { new: true }
//       );
  
//       if (!request) {
//         return res.status(404).json({ message: 'Request not found' });
//       }
  
//       // Notify the user that their request was accepted
//       io.to(request.userEmail).emit('requestAccepted', {
//         requestId,
//         driverEmail,
//       });
  
//       // Notify all drivers to remove the accepted request
//       io.emit('requestUpdated', request);
  
//       res.status(200).json({ message: 'Request accepted', request });
//     } catch (err) {
//       console.error('Error accepting request:', err);
//       res.status(500).json({ message: 'Failed to accept request' });
//     }
//   });
  
//   // New route to cancel a request
//   app.delete('/api/ambulance/cancel/:requestId', async (req, res) => {
//     const { requestId } = req.params;
//     try {
//       const request = await AmbulanceRequest.findByIdAndDelete(requestId);
//       if (!request) {
//         return res.status(404).json({ message: 'Request not found' });
//       }
  
//       // Notify drivers of cancellation
//       io.emit('requestCancelled', requestId);
  
//       // Notify the user
//       io.to(request.userEmail).emit('requestCancelled', requestId);
  
//       res.status(200).json({ message: 'Request cancelled' });
//     } catch (err) {
//       console.error('Error cancelling request:', err);
//       res.status(500).json({ message: 'Failed to cancel request' });
//     }
//   });
//   // Complete a request
// app.post('/api/ambulance/complete', async (req, res) => {
//   const { requestId, driverEmail } = req.body;
//   try {
//     const request = await AmbulanceRequest.findById(requestId);
//     if (!request) {
//       return res.status(404).json({ message: 'Request not found' });
//     }
//     if (request.driverEmail !== driverEmail) {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }

//     await AmbulanceRequest.findByIdAndDelete(requestId);

//     // Notify the user
//     io.to(request.userEmail).emit('requestCompleted', requestId);

//     res.status(200).json({ message: 'Request completed' });
//   } catch (err) {
//     console.error('Error completing request:', err);
//     res.status(500).json({ message: 'Failed to complete request' });
//   }
// });


// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

// Express setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Your React app's URL
    methods: ['GET', 'POST', 'DELETE'],
  },
});

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB Compass
mongoose.connect('mongodb://localhost:27017/hack', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Compass');
});

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
});

const User = mongoose.model('User', userSchema);

// Signup route (unchanged)
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ name, email, password, role });
    await newUser.save();

    res.status(200).json({ message: 'Signup successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Login route (unchanged)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received:', email, password);

  try {
    const user = await User.findOne({ email, password });
    console.log('User found:', user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let redirectPath = '';
    switch (user.role) {
      case 'driver':
        redirectPath = '/driverhome';
        break;
      case 'user':
        redirectPath = '/userhome';
        break;
      case 'hospital':
        redirectPath = '/hospitalhome';
        break;
      case 'police':
        redirectPath = '/policehome';
        break;
      default:
        redirectPath = '/';
    }

    return res.status(200).json({
      message: 'Login successful',
      role: user.role,
      redirect: redirectPath,
    });
  } catch (err) {
    console.error('Login route error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Alert Schema
const alertSchema = new mongoose.Schema({
  userEmail: String,
  timestamp: { type: Date, default: Date.now },
});

const Alert = mongoose.model('Alert', alertSchema);

// Ambulance Request Schema
const ambulanceRequestSchema = new mongoose.Schema({
  userEmail: String,
  location: { latitude: Number, longitude: Number },
  emergency: Boolean,
  timestamp: { type: Date, default: Date.now },
  driverEmail: String,
  accepted: { type: Boolean, default: false },
});

const AmbulanceRequest = mongoose.model('AmbulanceRequest', ambulanceRequestSchema);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userEmail) => {
    socket.join(userEmail);
    console.log(`${userEmail} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Send Alert
app.post('/api/alerts/send', async (req, res) => {
  const { email } = req.body;
  try {
    const newAlert = new Alert({ userEmail: email });
    await newAlert.save();
    res.status(200).json({ message: 'Alert sent', alertId: newAlert._id });
  } catch (error) {
    console.error('Error sending alert:', error);
    res.status(500).json({ message: 'Failed to send alert' });
  }
});

// Stop Alert
app.delete('/api/alerts/stop', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await Alert.findOneAndDelete({ userEmail: email });
    if (result) {
      res.status(200).json({ message: 'Alert stopped and removed' });
    } else {
      res.status(404).json({ message: 'No active alert found' });
    }
  } catch (error) {
    console.error('Error stopping alert:', error);
    res.status(500).json({ message: 'Failed to stop alert' });
  }
});

// Create ambulance request
app.post('/api/ambulance/request', async (req, res) => {
  const { userEmail, location, emergency } = req.body;
  try {
    const existingRequest = await AmbulanceRequest.findOne({
      userEmail,
      accepted: false,
      driverEmail: null,
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have an active request' });
    }

    const newRequest = new AmbulanceRequest({ userEmail, location, emergency });
    await newRequest.save();

    io.emit('newRequest', newRequest);

    res.status(200).json({ message: 'Request sent', requestId: newRequest._id });
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending requests
app.get('/api/ambulance/requests', async (req, res) => {
  try {
    const requests = await AmbulanceRequest.find({ accepted: false, driverEmail: null });
    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a request
app.post('/api/ambulance/accept', async (req, res) => {
  const { requestId, driverEmail } = req.body;
  try {
    const request = await AmbulanceRequest.findByIdAndUpdate(
      requestId,
      { driverEmail, accepted: true },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    io.to(request.userEmail).emit('requestAccepted', {
      requestId,
      driverEmail,
    });

    io.emit('requestUpdated', request);

    res.status(200).json({ message: 'Request accepted', request });
  } catch (err) {
    console.error('Error accepting request:', err);
    res.status(500).json({ message: 'Failed to accept request' });
  }
});

// Cancel a request
app.delete('/api/ambulance/cancel/:requestId', async (req, res) => {
  const { requestId } = req.params;
  try {
    const request = await AmbulanceRequest.findByIdAndDelete(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    io.emit('requestCancelled', requestId);
    io.to(request.userEmail).emit('requestCancelled', requestId);

    res.status(200).json({ message: 'Request cancelled' });
  } catch (err) {
    console.error('Error cancelling request:', err);
    res.status(500).json({ message: 'Failed to cancel request' });
  }
});

// Complete a request
app.post('/api/ambulance/complete', async (req, res) => {
  const { requestId, driverEmail } = req.body;
  try {
    const request = await AmbulanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.driverEmail !== driverEmail) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await AmbulanceRequest.findByIdAndDelete(requestId);

    io.to(request.userEmail).emit('requestCompleted', requestId);
    io.emit('requestCompleted', requestId);

    res.status(200).json({ message: 'Request completed' });
  } catch (err) {
    console.error('Error completing request:', err);
    res.status(500).json({ message: 'Failed to complete request' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});