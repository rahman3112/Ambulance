import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';

const Home = () => {
  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <h2>HOSAAP</h2>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="auth-section">
            <Link to="/login">
              <button className="login-btn">Login</button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="hero-section">
        <h1>Welcome to HOSAAP!</h1>
        <p>Welcome to our innovative hospital and ambulance service platform, designed to streamline emergency medical care. Our system enables ambulances to broadcast real-time alerts and share live tracking of their routes with police and the public, ensuring smoother, faster journeys by allowing authorities to clear paths in advance. With dedicated interfaces for patients, police, ambulance drivers, and hospitals, users can book and track ambulances, connect directly with hospital doctors, and access critical services seamlessly. Experience a smarter, safer way to emergency healthcare today.</p>
        <div className="action-buttons">
          <Link to="/login">
            <button>LOGIN</button>
          </Link>
        </div>
      </div>

      <div className="overview-section">
        <div className="overlay"></div>
        <div className="overview-content">
          <h2>SAVE TIME AND LOVED ONES</h2>
          <div className="features">
            <div className="feature-card">
              <h3>Real-Time Ambulance Tracking</h3>
              <p>Ambulances share live routes with police and public for faster, safer travel.</p>
            </div>
            <div className="feature-card">
              <h3>Multi-User Interfaces</h3>
              <p>Dedicated portals for patients, police, drivers, and hospitals streamline communication and coordination.</p>
            </div>
            <div className="feature-card">
              <h3>Direct Doctor Connect</h3>
              <p>Patients can contact hospital doctors during ambulance booking for immediate medical guidance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
