import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const nav = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password.');
      return;
    }
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('xeno_token', data.data.token);
      localStorage.setItem('xeno_user', JSON.stringify(data.data.user));
      auth?.setUser(data.data.user);
      nav('/dashboard');
      toast.success(`Welcome back, ${data.data.user.name}!`);
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err?.response?.status === 401
        ? 'Invalid credentials. Please try again.'
        : err?.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errMsg);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="hero-chip">Realtime ops</div>
        <h1>Xeno Products</h1>
        <p>Track customer analytics, recover records, and dispatch automation from one dynamic control room.</p>
        <div className="login-pills">
          <span>Live scoring</span>
          <span>Campaigns</span>
          <span>Admin</span>
        </div>
      </section>

      <form className="panel login-form glass-card" onSubmit={submit}>
        <h2>Welcome back</h2>
        <p style={{ color:'var(--muted)' }}>Sign in to the operational analytics platform</p>
        <input name="email" placeholder="Email" className="field" value={email} onChange={e => setEmail(e.target.value)} />
        <input name="password" type="password" placeholder="Password" className="field" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn" style={{ width:'100%', marginTop:12 }}>Login</button>
        <div style={{ marginTop:16, color:'var(--muted)', fontSize:11 }}>
          Demo: admin@xenoproducts.com / Admin@123
        </div>
      </form>
    </div>
  );
}

