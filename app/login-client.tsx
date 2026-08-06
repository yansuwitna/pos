'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

type StoreOption = {
  id: string;
  code: string;
  name: string;
};

type Props = {
  adminExists: boolean;
  initialStores?: StoreOption[];
};

export default function LoginClient({ adminExists: initialAdminExists, initialStores = [] }: Props) {
  const [adminExists, setAdminExists] = useState(initialAdminExists);
  const [stores, setStores] = useState<StoreOption[]>(initialStores);
  
  // Form states
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>('');
  const [rawUsername, setRawUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(''); // for admin creation
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch stores if initialStores is empty
    if (initialStores.length === 0) {
      fetch('/api/public/stores')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.stores)) {
            setStores(data.stores);
          }
        })
        .catch(() => {});
    }
  }, [initialStores]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedStoreCode) {
      setError('Harap pilih nama toko Anda terlebih dahulu.');
      return;
    }

    const cleanUser = rawUsername.trim();
    if (!cleanUser) {
      setError('Harap masukkan username Anda.');
      return;
    }

    // Determine final username format
    let finalUsername = cleanUser;
    if (selectedStoreCode !== '__SUPER_ADMIN__') {
      if (cleanUser.toUpperCase().startsWith(`${selectedStoreCode.toUpperCase()}_`)) {
        finalUsername = cleanUser;
      } else {
        finalUsername = `${selectedStoreCode}_${cleanUser}`;
      }
    }

    setLoading(true);
    
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: finalUsername, password })
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
      body: JSON.stringify({ username: rawUsername, password, name, role: 'SUPER_ADMIN' })
    });

    const data = await res.json();
    if (data.success) {
      const loginRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawUsername, password })
      });
      const loginData = await loginRes.json();
      setLoading(false);
      if (loginData.success) {
        window.location.href = '/dashboard';
      } else {
        setAdminExists(true);
        setError('Berhasil membuat Super Admin. Silakan masuk.');
      }
    } else {
      setLoading(false);
      setError(data.message);
    }
  };

  return (
    <>
      {/* FIXED FULL-VIEWPORT BACKGROUND — always covers entire screen */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 35%, #f5f3ff 70%, #eff6ff 100%)',
        zIndex: 0
      }} />
      {/* FIXED VIBRANT FLOATING MESH BLURS */}
      <div style={{
        position: 'fixed',
        top: '-100px',
        left: 'calc(50% - 300px)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(240, 249, 255, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-120px',
        right: '5%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, rgba(245, 243, 255, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        top: '20%',
        right: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(240, 249, 255, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* SCROLLABLE CONTENT WRAPPER */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: "'Poppins', sans-serif"
      }}>



      {/* LOGIN CARD CONTAINER (BRIGHT GLASSMORPHISM) */}
      <div style={{
        width: '100%',
        maxWidth: '470px',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(30px)',
        borderRadius: '28px',
        padding: '3rem 2.5rem',
        boxShadow: '0 30px 60px -12px rgba(37, 99, 235, 0.15), 0 10px 25px -5px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        border: '1.5px solid rgba(255, 255, 255, 0.8)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* TOP BADGE & BRAND HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          {/* BADGE PILL */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
            color: '#0284c7',
            border: '1px solid #bae6fd',
            padding: '5px 16px',
            borderRadius: '30px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.12)'
          }}>
            ⚡ Smart Multi-Store POS Pro
          </span>

          {/* BRAND LOGO */}
          <div style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 1rem auto',
            background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 50%, #06b6d4 100%)',
            borderRadius: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: '#ffffff',
            boxShadow: '0 12px 25px rgba(6, 182, 212, 0.4)',
            transform: 'rotate(-2deg)'
          }}>
            🛍️
          </div>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-0.6px',
            margin: '0 0 0.4rem 0',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0284c7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Selamat Datang!
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
            {!adminExists ? 'Setup Awal Akun Administrator Utama' : 'Pilih Toko Anda & Masuk ke Sistem POS'}
          </p>
        </div>

        {/* ERROR NOTIFICATION ALERT */}
        {error && (
          <div style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            color: '#e11d48',
            padding: '0.9rem 1.1rem',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span> {error}
          </div>
        )}

        {/* CONDITIONAL RENDER: SETUP ADMIN vs STANDARD LOGIN */}
        {!adminExists ? (
          /* SETUP FIRST SUPER ADMIN FORM */
          <form onSubmit={handleCreateAdmin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                👤 Nama Lengkap Super Admin
              </label>
              <input
                type="text"
                placeholder="Administrator Utama"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                🔑 Username Login
              </label>
              <input
                type="text"
                placeholder="superadmin"
                value={rawUsername}
                onChange={e => setRawUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                🔒 Password Login
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.9rem 3.2rem 0.9rem 1.1rem',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#64748b'
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 50%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: 'pointer',
                boxShadow: '0 12px 25px rgba(6, 182, 212, 0.35)',
                transition: 'transform 0.15s ease'
              }}
            >
              {loading ? 'Memproses Setup...' : '✨ Buat Akun Super Admin & Masuk'}
            </button>
          </form>
        ) : (
          /* STANDARD LOGIN FORM */
          <form onSubmit={handleLogin}>
            {/* STEP 1: PILIH TOKO DROPDOWN */}
            <div style={{ marginBottom: '1.35rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.45rem' }}>
                🏬 Pilih Nama Toko
              </label>
              <select
                value={selectedStoreCode}
                onChange={e => setSelectedStoreCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }}
              >
                <option value="" disabled>-- Klik Untuk Pilih Toko Anda --</option>
                <option value="__SUPER_ADMIN__" style={{ fontWeight: 'bold', color: '#0284c7' }}>👑 Login Super Admin (Pusat)</option>
                {stores.map(s => (
                  <option key={s.id} value={s.code}>
                    🏪 [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 2: USERNAME */}
            <div style={{ marginBottom: '1.35rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.45rem' }}>
                👤 Username
              </label>
              <input
                type="text"
                placeholder={selectedStoreCode === '__SUPER_ADMIN__' ? 'superadmin' : 'cth: admin / kasir / gudang'}
                value={rawUsername}
                onChange={e => setRawUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {selectedStoreCode && selectedStoreCode !== '__SUPER_ADMIN__' && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  fontSize: '0.8rem',
                  color: '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}>
                  <span>💡 Login ID Anda:</span>
                  <strong style={{ color: '#0284c7', fontSize: '0.85rem' }}>{selectedStoreCode}_{rawUsername.trim() || 'username'}</strong>
                </div>
              )}
            </div>

            {/* STEP 3: PASSWORD */}
            <div style={{ marginBottom: '1.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.45rem' }}>
                🔒 Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.9rem 3.2rem 0.9rem 1.1rem',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#64748b'
                  }}
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 50%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: 'pointer',
                boxShadow: '0 12px 25px rgba(6, 182, 212, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? 'Memproses Login...' : '🚀 Masuk Ke Toko Sekarang'}
            </button>
          </form>
        )}

        {/* REGISTER FOOTER LINK */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.35rem',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          <span style={{ color: '#64748b', fontWeight: 500 }}>Belum mendaftarkan toko Anda? </span>
          <a
            href="/register"
            style={{
              color: '#0284c7',
              textDecoration: 'none',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Daftar Toko Baru &rarr;
          </a>
          <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.75rem' }}>
            <a
              href="/panduan"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#7c3aed',
                fontWeight: 700,
                fontSize: '0.87rem',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              📖 Panduan Penggunaan ↗
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
