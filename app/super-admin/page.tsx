'use client';

import { useState, useEffect } from 'react';

export default function SuperAdminPage() {
  const [stores, setStores] = useState([]);
  const [allowPublic, setAllowPublic] = useState(false);
  
  // State for creating new store
  const [showModal, setShowModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for clearing store data
  const [showClearModal, setShowClearModal] = useState(false);
  const [storeToClear, setStoreToClear] = useState<any>(null);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState('');
  const [clearSuccess, setClearSuccess] = useState('');

  useEffect(() => {
    fetchStores();
    fetchSettings();
  }, []);

  const fetchStores = async () => {
    const res = await fetch('/api/stores');
    if (res.ok) {
      const data = await res.json();
      setStores(data.stores || []);
    }
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings/system');
    if (res.ok) {
      const data = await res.json();
      setAllowPublic(data.allowPublicRegistration === 'true');
    }
  };

  const togglePublicRegistration = async () => {
    const newValue = !allowPublic;
    const res = await fetch('/api/settings/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'allowPublicRegistration', value: newValue.toString() })
    });
    if (res.ok) {
      setAllowPublic(newValue);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
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
      setSuccess(`Toko berhasil dibuat! Username manajer: ${storeCode}_${username}`);
      fetchStores(); // Refresh table
      
      // Close modal and reset form after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setStoreName('');
        setStoreCode('');
        setUsername('');
        setPassword('');
        setName('');
        setSuccess('');
      }, 2000);
    } else {
      setError(data.message || 'Gagal mendaftar toko');
    }
  };

  const handleOpenClearModal = (store: any) => {
    setStoreToClear(store);
    setClearConfirmationText('');
    setClearError('');
    setClearSuccess('');
    setShowClearModal(true);
  };

  const handleClearStoreData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearConfirmationText !== 'KOSONGKAN') {
      setClearError("Teks konfirmasi tidak cocok. Ketik 'KOSONGKAN'.");
      return;
    }

    setClearError('');
    setClearLoading(true);

    const res = await fetch(`/api/stores/${storeToClear.id}/clear`, {
      method: 'DELETE'
    });

    const data = await res.json();
    setClearLoading(false);

    if (res.ok && data.success) {
      setClearSuccess(data.message);
      
      setTimeout(() => {
        setShowClearModal(false);
        setStoreToClear(null);
        setClearSuccess('');
      }, 3000);
    } else {
      setClearError(data.message || 'Gagal mengosongkan data');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="gradient-text" style={{ fontSize: "2rem" }}>Dashboard Super Admin</h1>
        <p style={{ color: "var(--text-muted)" }}>Kelola sistem Multi-Toko dan Pengaturan Global</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Daftar Toko Terdaftar</h2>
            <button className="btn btn-success" onClick={() => setShowModal(true)}>
              + Tambah Toko
            </button>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Toko</th>
                  <th>Status</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store: any) => (
                  <tr key={store.id}>
                    <td><strong>{store.code}</strong></td>
                    <td>{store.name}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: store.isActive ? '#dcfce7' : '#fee2e2',
                        color: store.isActive ? '#166534' : '#991b1b'
                      }}>
                        {store.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>{new Date(store.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => handleOpenClearModal(store)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Kosongkan Data
                      </button>
                    </td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      Belum ada toko yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Pengaturan Sistem</h2>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', color: "var(--text-muted)" }}>
              Apakah publik (siapapun) diizinkan mendaftar toko baru melalui halaman registrasi?
            </p>
            <button 
              onClick={togglePublicRegistration}
              className="btn w-full"
              style={{ backgroundColor: allowPublic ? 'var(--accent)' : '#ef4444' }}
            >
              {allowPublic ? 'Pendaftaran Dibuka (Klik untuk Tutup)' : 'Pendaftaran Ditutup (Klik untuk Buka)'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah Toko */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Buat Toko Baru</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{error}</div>}
              {success && <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{success}</div>}

              <form id="createStoreForm" onSubmit={handleCreateStore}>
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
                    Saat login, gunakan: <strong>{storeCode ? `${storeCode}_${username || '...'}` : `[KodeToko]_${username || '...'}`}</strong>
                  </p>
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="createStoreForm"
                className="btn btn-success" 
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Buat Toko'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kosongkan Data */}
      {showClearModal && storeToClear && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>⚠️ Kosongkan Data Toko</h3>
              <button 
                onClick={() => setShowClearModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {clearError && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{clearError}</div>}
              {clearSuccess && <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{clearSuccess}</div>}

              <p style={{ marginBottom: '1rem' }}>
                Anda akan menghapus secara <strong>PERMANEN</strong> seluruh data operasional untuk toko <strong>{storeToClear.name} ({storeToClear.code})</strong>.
              </p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                <li>Data Barang dan Kategori</li>
                <li>Data Pelanggan dan Supplier</li>
                <li>Seluruh Transaksi Penjualan, Pembelian, dan Kas</li>
              </ul>
              <p style={{ marginBottom: '1rem', color: '#ef4444', fontWeight: 'bold' }}>
                Akun user (Manajer) akan tetap dipertahankan. Data yang dihapus tidak dapat dikembalikan.
              </p>

              <form id="clearStoreForm" onSubmit={handleClearStoreData}>
                <div className="form-group">
                  <label>Ketik <strong>KOSONGKAN</strong> untuk melanjutkan:</label>
                  <input 
                    type="text" 
                    placeholder="KOSONGKAN" 
                    value={clearConfirmationText} 
                    onChange={e => setClearConfirmationText(e.target.value)} 
                    required 
                    autoComplete="off"
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowClearModal(false)}
                disabled={clearLoading}
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="clearStoreForm"
                className="btn" 
                style={{ backgroundColor: '#ef4444' }}
                disabled={clearLoading || clearConfirmationText !== 'KOSONGKAN'}
              >
                {clearLoading ? 'Menghapus...' : 'Ya, Kosongkan Data!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
