import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Signup from './components/signup';
import Home from './components/home';
import DriverHome from './components/driverhome';
import UserDashboard from './components/userhome';
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




        </Routes>
      </Router>
    </div>
  );
}

export default App;
