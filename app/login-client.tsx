'use client';
import { useState } from 'react';

type Props = {
  adminExists: boolean;
};

export default function LoginClient({ adminExists: initialAdminExists }: Props) {
  const [adminExists, setAdminExists] = useState(initialAdminExists);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // for admin creation
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      window.location.href = '/dashboard';
    } else {
      setError(data.message);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, role: 'ADMIN' })
    });

    const data = await res.json();
    if (data.success) {
      // Auto login setelah berhasil buat admin
      const loginRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const loginData = await loginRes.json();
      setLoading(false);
      if (loginData.success) {
        window.location.href = '/dashboard';
      } else {
        setAdminExists(true);
        setError('Berhasil membuat admin, silakan login.');
      }
    } else {
      setLoading(false);
      setError(data.message);
    }
  };

  // Tampilan Form Buat Admin Pertama Kali
  if (!adminExists) {
    return (
      <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 className="gradient-text" style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Setup Awal POSPro</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Sistem belum memiliki Admin. Silakan buat akun Admin pertama Anda.</p>
          </div>
          
          {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{error}</div>}

          <form onSubmit={handleCreateAdmin}>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input type="text" placeholder="Budi Santoso" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            
            <button className="btn w-full mt-4" type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Buat Akun Admin & Masuk'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tampilan Form Login Biasa
  return (
    <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="gradient-text" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Selamat Datang</h1>
          <p style={{ color: "var(--text-muted)" }}>Masuk ke akun POSPro Anda</p>
        </div>
        
        {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          <button className="btn w-full mt-4" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
