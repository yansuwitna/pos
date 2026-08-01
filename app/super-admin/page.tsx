'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

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

  // State for deleting store completely
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

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

  const handleOpenDeleteModal = (store: any) => {
    setStoreToDelete(store);
    setDeleteConfirmationText('');
    setDeleteError('');
    setDeleteSuccess('');
    setShowDeleteModal(true);
  };

  const handleDeleteStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationText !== storeToDelete.code) {
      setDeleteError(`Teks konfirmasi tidak cocok. Ketik kode toko '${storeToDelete.code}'.`);
      return;
    }

    setDeleteError('');
    setDeleteLoading(true);

    const res = await fetch(`/api/stores/${storeToDelete.id}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    setDeleteLoading(false);

    if (res.ok && data.success) {
      setDeleteSuccess(data.message);
      fetchStores();
      setTimeout(() => {
        setShowDeleteModal(false);
        setStoreToDelete(null);
        setDeleteSuccess('');
      }, 2000);
    } else {
      setDeleteError(data.message || 'Gagal menghapus toko');
    }
  };

  // Backup & Restore logic for Super Admin
  const [backupLoading, setBackupLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackupSystem = async () => {
    setBackupLoading(true);
    try {
      Swal.fire({
        title: 'Mengekspor Seluruh Sistem...',
        text: 'Harap tunggu, sedang menyiapkan file backup seluruh toko.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const res = await fetch('/api/backup');
      const data = await res.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `backup-superadmin-pos-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        Swal.fire('Berhasil!', 'File backup seluruh sistem berhasil diunduh.', 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal mengekspor database.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan sistem saat backup.', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreSystem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      return Swal.fire('Format Salah', 'Harap unggah file dengan format .json', 'error');
    }

    const confirm = await Swal.fire({
      title: '⚠️ PERINGATAN PEMULIHAN SISTEM ⚠️',
      html: 'Anda akan memulihkan database dari file backup. <br/><br/><b>Seluruh data seluruh toko saat ini akan DIHAPUS & DITIMPA PERMANEN</b>.<br/><br/>Apakah Anda yakin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Timpa Seluruh Database!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setBackupLoading(true);
    Swal.fire({
      title: 'Memulihkan Seluruh Database...',
      text: 'Harap tunggu, proses ini mungkin memakan waktu. Jangan tutup halaman.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const backupData = JSON.parse(fileContent);

        const res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backupData)
        });

        const result = await res.json();
        if (result.success) {
          Swal.fire('Berhasil!', 'Seluruh sistem berhasil dipulihkan dari backup.', 'success').then(() => {
            fetchStores();
          });
        } else {
          Swal.fire('Gagal', result.message || 'Gagal memulihkan database.', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'File backup rusak atau tidak dapat dibaca.', 'error');
      } finally {
        setBackupLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Backup specific store
  const handleBackupStore = async (store: any) => {
    try {
      Swal.fire({
        title: `Mengekspor Toko ${store.name}...`,
        text: 'Harap tunggu, sedang menyiapkan file backup toko.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const res = await fetch(`/api/backup?storeId=${store.id}`);
      const data = await res.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `backup-toko-${store.code}-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        Swal.fire('Berhasil!', `File backup toko ${store.name} (${store.code}) berhasil diunduh.`, 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal mengekspor database toko.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan sistem saat backup toko.', 'error');
    }
  };

  // Restore specific store
  const [storeToRestore, setStoreToRestore] = useState<any>(null);
  const storeFileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerRestoreStore = (store: any) => {
    setStoreToRestore(store);
    if (storeFileInputRef.current) {
      storeFileInputRef.current.value = '';
      storeFileInputRef.current.click();
    }
  };

  const handleRestoreStoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storeToRestore) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      return Swal.fire('Format Salah', 'Harap unggah file dengan format .json', 'error');
    }

    const confirm = await Swal.fire({
      title: `⚠️ PERINGATAN RESTORE TOKO ${storeToRestore.name} (${storeToRestore.code}) ⚠️`,
      html: `Anda akan memulihkan data untuk toko <b>${storeToRestore.name}</b> dari file backup.<br/><br/><b>Seluruh data operasional toko ini akan DIHAPUS & DITIMPA PERMANEN</b>.<br/>Data toko lain tidak akan terpengaruh.<br/><br/>Apakah Anda yakin?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Timpa Data Toko Ini!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: `Memulihkan Toko ${storeToRestore.name}...`,
      text: 'Harap tunggu, proses ini mungkin memakan waktu. Jangan tutup halaman.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const backupData = JSON.parse(fileContent);

        const res = await fetch(`/api/backup?storeId=${storeToRestore.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backupData)
        });

        const result = await res.json();
        if (result.success) {
          Swal.fire('Berhasil!', `Data toko ${storeToRestore.name} (${storeToRestore.code}) berhasil dipulihkan.`, 'success');
        } else {
          Swal.fire('Gagal', result.message || 'Gagal memulihkan database toko.', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'File backup rusak atau tidak dapat dibaca.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input 
        type="file" 
        ref={storeFileInputRef} 
        onChange={handleRestoreStoreFile} 
        accept=".json" 
        style={{ display: 'none' }} 
      />

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
                  <th style={{ textAlign: 'center' }}>User</th>
                  <th style={{ textAlign: 'center' }}>Barang</th>
                  <th style={{ textAlign: 'center' }}>Transaksi</th>
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
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8'
                      }}>
                        {store._count?.users ?? 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: '#fef3c7',
                        color: '#d97706'
                      }}>
                        {store._count?.products ?? 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: '#dcfce7',
                        color: '#15803d'
                      }}>
                        {store._count?.transactions ?? 0}
                      </span>
                    </td>
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
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handleBackupStore(store)}
                          title="Unduh Backup Toko Ini"
                          style={{
                            background: '#0284c7',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          💾 Backup
                        </button>
                        <button 
                          onClick={() => handleTriggerRestoreStore(store)}
                          title="Restore Backup ke Toko Ini"
                          style={{
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          ⬆️ Restore
                        </button>
                        <button 
                          onClick={() => handleOpenClearModal(store)}
                          title="Kosongkan Data Toko"
                          style={{
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          Kosongkan
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(store)}
                          title="Hapus Toko Permanen"
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      Belum ada toko yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 className="card-title">Pengaturan Sistem</h2>
            <div className="form-group" style={{ marginBottom: 0 }}>
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

          <div className="card">
            <h2 className="card-title">💾 Backup & Restore Database System</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Ekspor seluruh database (seluruh toko, transaksi, produk, dan pengaturan global) atau pulihkan dari file JSON backup.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={handleBackupSystem}
                disabled={backupLoading}
                className="btn btn-success"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                ⬇️ Unduh Full Backup System (.json)
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleRestoreSystem} 
                accept=".json" 
                style={{ display: 'none' }} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={backupLoading}
                className="btn"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#dc2626' }}
              >
                ⬆️ Pulihkan System dari File Backup
              </button>
            </div>
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

      {/* Modal Hapus Toko Permanen */}
      {showDeleteModal && storeToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>🗑️ Hapus Toko Permanen</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {deleteError && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{deleteError}</div>}
              {deleteSuccess && <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{deleteSuccess}</div>}

              <p style={{ marginBottom: '1rem' }}>
                Anda akan menghapus toko <strong>{storeToDelete.name} ({storeToDelete.code})</strong> beserta <strong>SELURUH AKUN USER DAN DATANYA</strong> secara permanen dari sistem.
              </p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>
                <li>Seluruh Akun User/Manajer/Kasir Toko Ini</li>
                <li>Seluruh Produk, Kategori, Supplier, dan Pelanggan</li>
                <li>Seluruh Transaksi Penjualan, Pembelian, Hutang & Piutang</li>
                <li>Profil Toko itu Sendiri</li>
              </ul>
              <p style={{ marginBottom: '1rem', color: '#ef4444', fontWeight: 'bold' }}>
                Tindakan ini TIDAK DAPAT DIBATALKAN.
              </p>

              <form id="deleteStoreForm" onSubmit={handleDeleteStore}>
                <div className="form-group">
                  <label>Ketik kode toko <strong>{storeToDelete.code}</strong> untuk mengonfirmasi:</label>
                  <input 
                    type="text" 
                    placeholder={storeToDelete.code} 
                    value={deleteConfirmationText} 
                    onChange={e => setDeleteConfirmationText(e.target.value.toUpperCase())} 
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
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="deleteStoreForm"
                className="btn" 
                style={{ backgroundColor: '#dc2626' }}
                disabled={deleteLoading || deleteConfirmationText !== storeToDelete.code}
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Toko Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
