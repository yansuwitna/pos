'use client';
import { useState } from 'react';
import Swal from 'sweetalert2';

type Props = {
  adminExists: boolean;
};

export default function LoginClient({ adminExists: initialAdminExists }: Props) {
  const [adminExists, setAdminExists] = useState(initialAdminExists);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const errMsg = data.message || 'Username dan Password salah';
      setError(errMsg);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Masuk!',
        text: errMsg,
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, role: 'SUPER_ADMIN' })
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
      <div className="container" style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "2.5rem", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 'bold', padding: '4px 14px', borderRadius: '20px', marginBottom: '0.75rem' }}>
              👑 Setup Awal Sistem
            </span>
            <h1 className="gradient-text" style={{ fontSize: "1.8rem", marginBottom: "0.5rem", fontWeight: 800 }}>Daftarkan Super Admin</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>Sistem belum memiliki Super Admin. Silakan daftarkan akun Super Admin pertama Anda.</p>
          </div>
          
          {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500', fontSize: '0.88rem' }}>{error}</div>}

          <form onSubmit={handleCreateAdmin}>
            <div className="form-group">
              <label>Nama Lengkap Super Admin</label>
              <input type="text" placeholder="Administrator Utama" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Username Login</label>
              <input type="text" placeholder="superadmin" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label>Password Login</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: 'var(--text-muted)',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>
            
            <button className="btn w-full mt-4" type="submit" disabled={loading} style={{ padding: '0.85rem', fontWeight: 'bold', fontSize: '0.95rem' }}>
              {loading ? 'Memproses Setup...' : '✨ Buat Akun Super Admin & Masuk'}
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
            <input type="text" placeholder="cth: TK01_admin" value={username} onChange={e => setUsername(e.target.value)} required />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Format: <strong>KodeToko_Username</strong> (contoh: TK01_admin). Khusus Super Admin, gunakan username Anda.
            </p>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)',
                  padding: '4px'
                }}
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>
          
          <button className="btn w-full mt-4" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.85rem" }}>
          <a href="/register" style={{ color: "#2563eb", textDecoration: "underline" }}>Daftar Toko Baru</a>
        </div>
      </div>
    </div>
  );
}
