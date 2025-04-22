import React, { useState } from 'react';
import './Auth.css';

const Signup = () => {
  const [name, setName] = useState(''); // Added name state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password,role }), // Include name in request
      });
      const data = await response.json();
      if (response.ok) {
        alert('Signup successful! Please login.');
        // Redirect to login page or auto-login
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    }
  };

  return (
    <div className="auth-container">
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="" disabled hidden>Role</option>
          <option value="driver">Driver</option>
          <option value="user">User</option>
          <option value="hospital">Hospital Dep.</option>
          <option value="police">Police</option>
        </select>
        <button type="submit" className="auth-btn">Sign Up</button>
      </form>
      <p style={{    position: "relative",right: "340px",top: "0px"}}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default Signup;