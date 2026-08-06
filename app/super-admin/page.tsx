'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function SuperAdminPage() {
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
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

  // State for changing store password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStoreForPassword, setSelectedStoreForPassword] = useState<any>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState('');
  const [newPasswordForStore, setNewPasswordForStore] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchStores();
    fetchSettings();
  }, []);

  const fetchStores = async () => {
    const res = await fetch('/api/stores');
    if (res.ok) {
      const data = await res.json();
      setStores(data.stores || []);
      setGlobalStats(data.globalStats || null);
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

    Swal.fire({
      title: `Mengosongkan Toko ${storeToClear?.name}...`,
      text: 'Harap tunggu, sedang menghapus seluruh data operasional toko.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const res = await fetch(`/api/stores/${storeToClear.id}/clear`, {
        method: 'DELETE'
      });

      const data = await res.json();
      setClearLoading(false);

      if (res.ok && data.success) {
        setShowClearModal(false);
        setStoreToClear(null);
        setClearConfirmationText('');
        fetchStores(); // Refresh dashboard table & global stats
        Swal.fire('Berhasil!', data.message || 'Data toko berhasil dikosongkan.', 'success');
      } else {
        setClearError(data.message || 'Gagal mengosongkan data');
        Swal.fire('Gagal', data.message || 'Gagal mengosongkan data toko.', 'error');
      }
    } catch (err) {
      setClearLoading(false);
      Swal.fire('Error', 'Terjadi kesalahan sistem saat mengosongkan data toko.', 'error');
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

  const handleOpenPasswordModal = (store: any) => {
    setSelectedStoreForPassword(store);
    const defaultUser = store.users?.find((u: any) => u.role === 'ADMIN')?.id || store.users?.[0]?.id || '';
    setSelectedUserForPassword(defaultUser);
    setNewPasswordForStore('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  const handleChangeStorePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) {
      setPasswordError("Pilih akun user terlebih dahulu");
      return;
    }
    if (!newPasswordForStore || newPasswordForStore.length < 4) {
      setPasswordError("Password minimal 4 karakter");
      return;
    }

    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUserForPassword, password: newPasswordForStore })
      });

      const data = await res.json();
      setPasswordLoading(false);

      if (res.ok && data.success) {
        setPasswordSuccess(`Password akun toko berhasil diperbarui!`);
        setNewPasswordForStore('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setSelectedStoreForPassword(null);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Gagal mengubah password');
      }
    } catch (err) {
      setPasswordLoading(false);
      setPasswordError('Terjadi kesalahan jaringan/sistem.');
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
          fetchStores(); // Refresh dashboard table & global stats immediately
          Swal.fire('Berhasil!', `Data toko ${storeToRestore.name} (${storeToRestore.code}) berhasil dipulihkan.`, 'success').then(() => {
            fetchStores();
          });
        } else {
          Swal.fire('Gagal', result.message || 'Gagal memulihkan database toko.', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'File backup rusak atau tidak dapat dibaca.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAllStores = async () => {
    const confirm = await Swal.fire({
      title: '⚠️ KOSONGKAN SEMUA DATA TOKO?',
      text: 'Anda akan menghapus seluruh data operasional (Barang, Transaksi, Laporan, Keuangan, Kasir/Gudang) di SEMUA TOKO. Informasi Toko dan Akun Manager setiap toko AKAN TETAP DIPERTAHANKAN. Lanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Kosongkan Semua Data!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: 'Mengosongkan Seluruh Data Toko...',
      text: 'Harap tunggu, sedang menghapus seluruh data operasional toko...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchStores();
        Swal.fire('Berhasil!', data.message || 'Seluruh data operasional toko berhasil dikosongkan. Informasi toko & akun manager dipertahankan.', 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal mengosongkan data toko.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan sistem saat mengosongkan data.', 'error');
    }
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

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="gradient-text" style={{ fontSize: "2rem" }}>Dashboard</h1>
        <p style={{ color: "var(--text-muted)" }}>Kelola sistem Multi-Toko dan Performa Keuangan Global</p>
      </div>

      {/* RINGKASAN GLOBAL SEMUA TOKO */}
      {globalStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>🛒 Total Transaksi</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{globalStats.transactionCount} Transaksi</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Dari seluruh toko</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>💰 Total Omzet</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.25rem' }}>Rp {globalStats.totalRevenue.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pendapatan Kotor</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>📈 Keuntungan (Laba Kotor)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.25rem' }}>Rp {globalStats.grossProfit.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Omzet - Harga Modal (HPP)</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>💸 Biaya Operasional</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.25rem' }}>Rp {globalStats.totalExpense.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pengeluaran Operasional</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>💵 Laba Bersih</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.25rem' }}>Rp {globalStats.netProfit.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Keuntungan - Biaya</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>🔴 Total Hutang</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.25rem' }}>Rp {globalStats.totalDebt.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Hutang ke Supplier</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>🔵 Total Piutang</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.25rem' }}>Rp {globalStats.totalReceivable.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Piutang Pelanggan</div>
          </div>
        </div>
      )}

      {/* DAFTAR TOKO TERDAFTAR */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Daftar Toko Terdaftar</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Rincian performa operasional & keuangan masing-masing toko</p>
          </div>
          <button className="btn btn-success" onClick={() => setShowModal(true)}>
            + Tambah Toko
          </button>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>Aksi</th>
                <th>Kode</th>
                <th style={{ whiteSpace: 'nowrap' }}>Nama Toko</th>
                <th style={{ textAlign: 'center' }}>User</th>
                <th style={{ textAlign: 'center' }}>Barang</th>
                <th style={{ textAlign: 'center' }}>Transaksi</th>
                <th>Omzet</th>
                <th>Keuntungan</th>
                <th>Biaya Operasional</th>
                <th>Laba Bersih</th>
                <th>Total Hutang</th>
                <th>Total Piutang</th>
                <th>Status</th>
                <th>Tanggal Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store: any) => (
                <tr key={store.id}>
                  <td style={{ minWidth: '150px' }}>
                    <select 
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (val === 'activity') router.push(`/super-admin/stores/${store.id}/activities`);
                        if (val === 'password') handleOpenPasswordModal(store);
                        if (val === 'backup') handleBackupStore(store);
                        if (val === 'restore') handleTriggerRestoreStore(store);
                        if (val === 'clear') handleOpenClearModal(store);
                        if (val === 'delete') handleOpenDeleteModal(store);
                      }}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.82rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        minWidth: '140px',
                        width: '100%'
                      }}
                    >
                      <option value="" disabled>Pilih Aksi</option>
                      <option value="activity">👁️ Pantau Kegiatan</option>
                      <option value="password">🔑 Password</option>
                      <option value="backup">💾 Backup Toko</option>
                      <option value="restore">⬆️ Restore Toko</option>
                      <option value="clear">🧹 Kosongkan Data</option>
                      <option value="delete">🗑️ Hapus Toko</option>
                    </select>
                  </td>
                  <td><strong>{store.code}</strong></td>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{store.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                      {store._count?.users ?? 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#fef3c7', color: '#d97706' }}>
                      {store._count?.products ?? 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#dcfce7', color: '#15803d' }}>
                      {store.stats?.transactionCount ?? store._count?.transactions ?? 0}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#0369a1' }}>
                    Rp {(store.stats?.totalRevenue || 0).toLocaleString('id-ID')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#6d28d9' }}>
                    Rp {(store.stats?.grossProfit || 0).toLocaleString('id-ID')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#b45309' }}>
                    Rp {(store.stats?.totalExpense || 0).toLocaleString('id-ID')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 'bold', color: (store.stats?.netProfit || 0) >= 0 ? '#15803d' : '#b91c1c' }}>
                    Rp {(store.stats?.netProfit || 0).toLocaleString('id-ID')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#b91c1c' }}>
                    Rp {(store.stats?.totalDebt || 0).toLocaleString('id-ID')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#1d4ed8' }}>
                    Rp {(store.stats?.totalReceivable || 0).toLocaleString('id-ID')}
                  </td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: store.isActive ? '#dcfce7' : '#fee2e2', color: store.isActive ? '#166534' : '#991b1b' }}>
                      {store.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(store.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Belum ada toko yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* Modal Ubah Password Toko */}
      {showPasswordModal && selectedStoreForPassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">🔑 Ubah Password Akun Toko</h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {passwordError && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{passwordError}</div>}
              {passwordSuccess && <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>{passwordSuccess}</div>}

              <p style={{ marginBottom: '1rem' }}>
                Ganti password akun user untuk toko <strong>{selectedStoreForPassword.name} ({selectedStoreForPassword.code})</strong>.
              </p>

              <form id="changePasswordForm" onSubmit={handleChangeStorePassword}>
                <div className="form-group">
                  <label>Pilih Akun User Toko:</label>
                  <select 
                    value={selectedUserForPassword} 
                    onChange={e => setSelectedUserForPassword(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                    required
                  >
                    {selectedStoreForPassword.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.role === 'ADMIN' ? '👑 [MANAGER] ' : `👤 [${u.role}] `}{u.name} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Password Baru:</label>
                  <input 
                    type="password" 
                    placeholder="Masukkan password baru (min. 4 karakter)..." 
                    value={newPasswordForStore} 
                    onChange={e => setNewPasswordForStore(e.target.value)} 
                    required 
                    minLength={4}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordLoading}
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="changePasswordForm"
                className="btn btn-success" 
                disabled={passwordLoading || !newPasswordForStore}
              >
                {passwordLoading ? 'Memproses...' : 'Simpan Password Baru'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
