import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      console.log('Raw response:', response);
  
      const data = await response.json();
      console.log('Parsed response:', data);
  
      if (!response.ok) {
        alert(data.message || 'Login failed');
        return;
      }
  
      alert('Login successful!');
      sessionStorage.setItem('loggedInEmail', email);
      onLogin(email);
      navigate(data.redirect);
    } catch (error) {
      console.error('Login error:', error);  // Log exact error
      alert('Something went wrong while logging in.');
    }
  };
  

  return (
    <div className="auth-container">
      <h1 style={{ position: 'relative', top: '40px' }}>Login</h1>
      <form onSubmit={handleSubmit} className="auth-form" style={{ position: 'relative', top: '40px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="auth-btn">Login</button>
      </form>
      <p style={{ position: 'relative', top: '30px', right: '330px' }}>
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>
    </div>
  );
};

export default Login;
