'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Swal from 'sweetalert2';

type Props = { role: string };

export default function SettingsClient({ role }: Props) {
  const isAdmin = role === 'ADMIN';

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
    
    // Store Info is Admin Only
    const savedStore = localStorage.getItem('pos_store_info');
    if (savedStore) {
      try { setStoreInfo(JSON.parse(savedStore)); } catch(e){}
    }
  }, [isAdmin]);

  const saveCamera = () => {
    localStorage.setItem('pos_camera_id', selectedCamera);
    setCameraSaved(true);
    setTimeout(() => setCameraSaved(false), 2500);
  };

  const saveStoreInfo = () => {
    localStorage.setItem('pos_store_info', JSON.stringify(storeInfo));
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 2500);
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

      {/* === INFO AKUN === */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="card-title">👤 Akun Saya</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Role Anda: <strong>{role}</strong>. Untuk mengubah password atau informasi akun, hubungi Admin.
        </p>
        <a href="/api/auth/logout" style={{ textDecoration: 'none' }}>
          <button className="btn w-full" style={{ background: '#ef4444', fontSize: '1rem', padding: '0.85rem' }}>
            🚪 Keluar / Logout
          </button>
        </a>
      </div>
      
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
