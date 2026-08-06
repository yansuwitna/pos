'use client';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Swal from 'sweetalert2';

type Props = { role: string };

export default function SettingsClient({ role }: Props) {
  const isAdmin = role === 'ADMIN';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [printerStatus, setPrinterStatus]   = useState('Belum Terhubung');
  const [cameras, setCameras]               = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameraSaved, setCameraSaved]       = useState(false);

  const [storeInfo, setStoreInfo] = useState({
    name: 'POS Pro',
    address: 'Jl. Contoh No. 123, Kota',
    phone: '081234567890',
    greeting: 'Terima Kasih Atas Kunjungan Anda',
    logo: ''
  });
  const [storeSaved, setStoreSaved] = useState(false);
  
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera' or 'physical'

  const [printerType, setPrinterType] = useState('kabel'); // 'kabel' or 'bluetooth'

  // State Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Swal.fire('Perhatian', 'Harap isi semua bidang password', 'warning');
    }
    if (newPassword !== confirmPassword) {
      return Swal.fire('Tidak Cocok', 'Konfirmasi password baru tidak cocok', 'error');
    }

    setChangePasswordLoading(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      setChangePasswordLoading(false);
      if (res.ok && data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Swal.fire('Berhasil!', data.message || 'Password Anda berhasil diperbarui.', 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal merubah password.', 'error');
      }
    } catch (err) {
      setChangePasswordLoading(false);
      Swal.fire('Error', 'Terjadi kesalahan sistem saat merubah password.', 'error');
    }
  };

  useEffect(() => {
    // Camera API
    Html5Qrcode.getCameras()
      .then(devs => {
        if (devs?.length) {
          setCameras(devs);
          const saved = localStorage.getItem('pos_camera_id');
          setSelectedCamera(saved ?? devs[0].id);
        }
      })
      .catch(() => {});
      
    const savedScannerMode = localStorage.getItem('pos_scanner_mode');
    if (savedScannerMode) {
      setScannerMode(savedScannerMode);
    }

    const savedPrinterType = localStorage.getItem('pos_printer_type');
    if (savedPrinterType) {
      setPrinterType(savedPrinterType);
    }

    if (!isAdmin) return;
    
    // Store Info is Admin Only - fetch from API
    fetchStoreInfo();
  }, [isAdmin]);

  const fetchStoreInfo = async () => {
    try {
      const res = await fetch('/api/settings/store');
      const data = await res.json();
      if (data.success && data.storeInfo) {
        setStoreInfo(data.storeInfo);
        localStorage.setItem('pos_store_info', JSON.stringify(data.storeInfo));
      }
    } catch (e) {}
  };

  const saveCamera = () => {
    localStorage.setItem('pos_camera_id', selectedCamera);
    setCameraSaved(true);
    setTimeout(() => setCameraSaved(false), 2500);
  };

  const saveStoreInfo = async () => {
    try {
      const res = await fetch('/api/settings/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeInfo)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('pos_store_info', JSON.stringify(storeInfo));
        setStoreSaved(true);
        setTimeout(() => setStoreSaved(false), 2500);
        Swal.fire('Berhasil!', 'Profil Toko berhasil disimpan ke database!', 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal menyimpan profil toko', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Gagal menyimpan profil toko', 'error');
    }
  };

  const saveScannerMode = (mode: string) => {
    setScannerMode(mode);
    localStorage.setItem('pos_scanner_mode', mode);
  };

  const savePrinterType = (type: string) => {
    setPrinterType(type);
    localStorage.setItem('pos_printer_type', type);
  };

  const handleResetDB = async () => {
    const confirm1 = await Swal.fire({
      title: '⚠️ PERINGATAN BAHAYA ⚠️',
      html: 'Apakah Anda yakin ingin MENGHAPUS SEMUA DATA (Transaksi, Produk, Kasir, Gudang)?<br/>Proses ini <b>TIDAK BISA dibatalkan</b>. Hanya akun Admin yang akan tersisa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Lanjutkan',
      cancelButtonText: 'Batal'
    });
    if (!confirm1.isConfirmed) return;
    
    const confirm2 = await Swal.fire({
      title: 'Sekali lagi, APAKAH ANDA BENAR-BENAR YAKIN?',
      text: 'Semua data transaksi dan master data akan musnah selamanya!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Kosongkan!',
      cancelButtonText: 'Batal',
      focusCancel: true
    });
    if (!confirm2.isConfirmed) return;

    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil!', '✅ Data berhasil di-reset.', 'success');
      } else {
        Swal.fire('Gagal', '❌ Gagal mereset: ' + data.message, 'error');
      }
    } catch (e) {
      Swal.fire('Error', '❌ Terjadi kesalahan saat mereset.', 'error');
    }
  };

  const testDrawer = async () => {
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'],
      });
      const server = await device.gatt.connect();
      setPrinterStatus(`Terhubung: ${device.name}`);
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      // ESC p 0 25 250  →  buka laci kasir
      await characteristic.writeValue(new Uint8Array([27, 112, 0, 25, 250]));
      Swal.fire('Berhasil', '✅ Sinyal buka laci telah dikirim!', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Gagal mengirim perintah. Pastikan Bluetooth aktif dan printer didukung.', 'error');
    }
  };

  const handleBackupData = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      setBackupLoading(false);
      if (data.success) {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        const storeNameSlug = data.data?.store?.code || 'toko';
        a.download = `backup_${storeNameSlug}_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Swal.fire('Berhasil!', 'File backup toko berhasil diunduh.', 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal membuat backup toko.', 'error');
      }
    } catch (err) {
      setBackupLoading(false);
      Swal.fire('Error', 'Terjadi kesalahan sistem saat mendownload backup.', 'error');
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const confirm = await Swal.fire({
      title: 'Konfirmasi Restore Data Toko',
      text: 'PERINGATAN: Memulihkan file backup akan menggantikan data toko Anda saat ini dengan data dari file backup. Apakah Anda yakin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Pulihkan Sekarang!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: 'Memulihkan Data Toko...',
      text: 'Harap tunggu, proses ini sedang memulihkan data toko Anda.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    setRestoreLoading(true);
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
        setRestoreLoading(false);
        if (result.success) {
          Swal.fire('Berhasil!', 'Data toko Anda berhasil dipulihkan dari file backup.', 'success').then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire('Gagal', result.message || 'Gagal memulihkan database toko.', 'error');
        }
      } catch (err) {
        setRestoreLoading(false);
        Swal.fire('Error', 'File backup rusak atau tidak dapat dibaca.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>⚙️ Pengaturan Perangkat & Toko</h1>

      {/* === PROFIL TOKO (Hanya Admin) === */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="card-title">🏪 Profil Toko (Struk)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Atur informasi toko yang akan ditampilkan pada struk transaksi. Pengaturan ini disimpan di perangkat ini.
          </p>

          <div className="form-group">
            <label>Logo Toko / App</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {storeInfo.logo && (
                <div style={{ position: 'relative' }}>
                  <img src={storeInfo.logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <button type="button" onClick={() => setStoreInfo(prev => ({...prev, logo: ''}))} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>&times;</button>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => setStoreInfo(prev => ({ ...prev, logo: event.target?.result as string }));
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
          </div>

          <div className="form-group">
            <label>Nama Toko / Usaha</label>
            <input type="text" value={storeInfo.name} onChange={e => setStoreInfo({...storeInfo, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Alamat Lengkap</label>
            <textarea value={storeInfo.address} onChange={e => setStoreInfo({...storeInfo, address: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'inherit', resize: 'vertical' }} rows={2}></textarea>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>No. HP / WhatsApp</label>
              <input type="text" value={storeInfo.phone} onChange={e => setStoreInfo({...storeInfo, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Pesan Penutup (Bawah Struk)</label>
              <input type="text" value={storeInfo.greeting} onChange={e => setStoreInfo({...storeInfo, greeting: e.target.value})} />
            </div>
          </div>

          <button className="btn" onClick={saveStoreInfo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            {storeSaved ? '✅ Tersimpan!' : '💾 Simpan Profil Toko'}
          </button>
        </div>
      )}

      {/* === SCANNER MODE (Hanya Kasir & Gudang) === */}
      {!isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="card-title">🔍 Mode Alat Barcode Scanner</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Pilih alat yang Anda gunakan untuk scan barcode barang.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            className={`btn w-full ${scannerMode === 'camera' ? '' : 'btn-outline'}`}
            onClick={() => saveScannerMode('camera')}
          >
            📷 Kamera Laptop / HP
          </button>
          <button 
            className={`btn w-full ${scannerMode === 'physical' ? '' : 'btn-outline'}`}
            onClick={() => saveScannerMode('physical')}
          >
            🔫 Alat Scanner (USB/Bluetooth)
          </button>
        </div>

        {scannerMode === 'camera' ? (
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Pilih Kamera yang Digunakan</h3>
            {cameras.length === 0 ? (
              <div style={{ padding: '1rem', background: '#fefce8', borderRadius: '10px', color: '#713f12', fontSize: '0.9rem' }}>
                ⚠️ Tidak ada kamera yang terdeteksi. Pastikan browser mendapat izin akses kamera.
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <select value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)}>
                    {cameras.map(c => (
                      <option key={c.id} value={c.id}>{c.label || `Kamera (${c.id.slice(0, 12)}...)`}</option>
                    ))}
                  </select>
                </div>
                <button className="btn" onClick={saveCamera} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {cameraSaved ? '✅ Kamera Tersimpan!' : '💾 Simpan Pilihan Kamera'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '0.9rem' }}>
            <strong>✅ Mode Scanner Alat Aktif!</strong><br/>
            Colokkan alat scanner ke USB PC atau hubungkan lewat Bluetooth. Sistem otomatis mendeteksi tembakan barcode.
          </div>
        )}
        </div>
      )}

      {/* === PRINTER & LACI KASIR (Hanya Kasir) === */}
      {!isAdmin && (
        <div className="card">
          <h2 className="card-title">🖨️ Pengaturan Printer & Laci Kasir</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Pilih jenis printer yang Anda gunakan di perangkat ini.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            className={`btn w-full ${printerType === 'kabel' ? '' : 'btn-outline'}`}
            onClick={() => savePrinterType('kabel')}
          >
            🔌 Printer Kabel (Browser Print)
          </button>
          <button 
            className={`btn w-full ${printerType === 'bluetooth' ? '' : 'btn-outline'}`}
            onClick={() => savePrinterType('bluetooth')}
          >
            📶 Printer Bluetooth
          </button>
        </div>

        {printerType === 'bluetooth' && (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Laci uang (Cash Drawer) umumnya dihubungkan lewat kabel RJ11 ke printer Bluetooth. 
              Gunakan tombol di bawah untuk menguji koneksi.
            </p>

        <div style={{
          padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: printerStatus.includes('Terhubung') ? '#10b981' : '#94a3b8',
            flexShrink: 0
          }} />
          <span style={{ color: printerStatus.includes('Terhubung') ? '#065f46' : 'var(--text-muted)', fontWeight: 500 }}>
            {printerStatus}
          </span>
        </div>

          <button className="btn btn-success w-full" onClick={testDrawer} style={{ padding: '1rem', fontSize: '1.05rem' }}>
            🔌 Uji Koneksi & Buka Laci (Bluetooth)
          </button>
          </>
        )}
        
        {printerType === 'kabel' && (
          <div style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', color: '#1e3a8a', fontSize: '0.9rem' }}>
            <strong>✅ Printer Kabel Dipilih</strong><br/>
            Sistem akan menggunakan fungsi pencetakan bawaan OS. Pastikan printer POS Anda sudah terpasang (Default) di Windows/Mac agar proses cetak lebih lancar tanpa banyak klik. Laci uang otomatis terbuka jika Anda mengaturnya di menu <em>Printer Properties (Cash Drawer / Cut)</em> di OS Anda.
          </div>
        )}
        </div>
      )}

      {/* === INFO AKUN & UBAH PASSWORD SAYA === */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>👤 Akun Saya</h2>
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Role: {role}
          </span>
        </div>

        <form onSubmit={handleChangePassword} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔑 Ubah Password Saya
          </h3>

          <div className="form-group">
            <label>Password Saat Ini</label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password lama Anda"
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Password Baru</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Password baru (min. 4 karakter)"
                required 
              />
            </div>
            <div className="form-group">
              <label>Konfirmasi Password Baru</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={changePasswordLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem' }}
          >
            {changePasswordLoading ? 'Memproses Perubahan...' : '💾 Simpan Password Baru Saya'}
          </button>
        </form>

        <a href="/api/auth/logout" style={{ textDecoration: 'none' }}>
          <button className="btn w-full" style={{ background: '#ef4444', fontSize: '1rem', padding: '0.85rem', fontWeight: 'bold' }}>
            🚪 Keluar / Logout
          </button>
        </a>
      </div>
      
      {/* === BACKUP & RESTORE DATA TOKO (Hanya Admin/Manager) === */}
      {isAdmin && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title">💾 Backup & Restore Data Toko</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            Unduh salinan cadangan data toko Anda (Barang, Kategori, Transaksi, Keuangan, Kasir & Gudang) atau pulihkan data dari file backup JSON.
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleRestoreFile} 
            accept=".json" 
            style={{ display: 'none' }} 
          />

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.8rem' }}
              onClick={handleBackupData}
              disabled={backupLoading}
            >
              💾 {backupLoading ? 'Mengunduh...' : 'Unduh Backup Toko'}
            </button>
            <button 
              className="btn" 
              style={{ flex: 1, minWidth: '180px', background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.8rem' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreLoading}
            >
              ⬆️ {restoreLoading ? 'Memproses...' : 'Restore File Backup'}
            </button>
          </div>
        </div>
      )}

      {/* === DANGER ZONE (Hanya Admin) === */}
      {isAdmin && (
        <div className="card" style={{ marginTop: '3rem', border: '2px solid #ef4444' }}>
          <h2 className="card-title" style={{ color: '#ef4444' }}>⚠️ Danger Zone</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Aksi di bawah ini tidak bisa dibatalkan! Ini akan menghapus semua database (Transaksi, Produk, Kategori, Kasir, dan Gudang) dari sistem. Hanya akun Admin yang tidak akan dihapus.
          </p>
          <button className="btn w-full" style={{ background: '#ef4444', fontSize: '1rem', padding: '1rem' }} onClick={handleResetDB}>
            🗑️ KOSONGKAN SEMUA DATABASE
          </button>
        </div>
      )}
    </div>
  );
}
