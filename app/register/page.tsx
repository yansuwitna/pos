'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allowPublic, setAllowPublic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings/system')
      .then(res => res.json())
      .then(data => {
        setAllowPublic(data.allowPublicRegistration === 'true');
      });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    if (storeCode.includes('_')) {
      setError("Kode toko tidak boleh mengandung garis bawah (_)");
      setLoading(false);
      return;
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName, storeCode, username, password, name })
    });

    const data = await res.json();
    setLoading(false);
    
    if (res.ok && data.success) {
      setSuccess(`Registrasi berhasil! Username Anda adalah ${storeCode}_${username}. Mengalihkan ke login...`);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } else {
      setError(data.message || 'Gagal mendaftar');
    }
  };

  if (allowPublic === null) return (
    <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Memuat sistem...</p>
    </div>
  );

  if (allowPublic === false) {
    return (
      <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem", textAlign: "center" }}>
          <h1 className="gradient-text" style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Pendaftaran Ditutup</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Saat ini pendaftaran toko baru secara publik tidak diizinkan oleh sistem.
          </p>
          <button className="btn w-full" onClick={() => router.push('/')}>
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
      <div className="card" style={{ width: "100%", maxWidth: "500px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="gradient-text" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Daftar Toko Baru</h1>
          <p style={{ color: "var(--text-muted)" }}>Lengkapi data di bawah ini untuk membuat toko.</p>
        </div>
        
        {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{error}</div>}
        {success && <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Kode Toko (Singkat, cth: TK01)</label>
            <input type="text" placeholder="TK01" value={storeCode} onChange={e => setStoreCode(e.target.value.toUpperCase())} required />
          </div>

          <div className="form-group">
            <label>Nama Toko</label>
            <input type="text" placeholder="Toko Sejahtera" value={storeName} onChange={e => setStoreName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Nama Lengkap Manajer</label>
            <input type="text" placeholder="Budi Santoso" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label>Username Manajer</label>
            <input type="text" placeholder="budi" value={username} onChange={e => setUsername(e.target.value)} required />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Saat login, gunakan: <strong>{storeCode}_{username}</strong>
            </p>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          <button className="btn w-full mt-4" type="submit" disabled={loading || !!success}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.85rem" }}>
          <a href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>Sudah punya akun? Login di sini</a>
        </div>
      </div>
    </div>
  );
}
