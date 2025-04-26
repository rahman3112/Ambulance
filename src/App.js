import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Signup from './components/signup';
import Home from './components/home';
import DriverHome from './components/driverhome';
import UserDashboard from './components/userhome';
import DriverMap from './components/drivermap';
import PoliceHome from './components/policehome';
import PoliceMap from './components/policemap';
function App() {
  const handleLogin = (email) => {
    console.log("User logged in with email:", email);
  };

  return (
    <div className="App">
      <Router>
        <Routes>
        <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login onLogin={handleLogin} />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/driverhome' element={<DriverHome />} />
          <Route path='/userhome' element={<UserDashboard/>} />
          <Route path="/policehome" element={<PoliceHome />} />
          <Route path="/policemap/:requestId" element={<PoliceMap />} />
          <Route path="/drivermap/:requestId" element={<DriverMap />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
