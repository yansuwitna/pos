'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

export default function SuperAdminSettingsPage() {
  const [allowPublic, setAllowPublic] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/settings/system');
      if (res.ok) {
        const data = await res.json();
        setAllowPublic(data.allowPublicRegistration === 'true');
      }
    } catch (err) {
      console.error('Failed to fetch system settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const togglePublicRegistration = async () => {
    const newValue = !allowPublic;
    try {
      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'allowPublicRegistration', value: newValue.toString() })
      });
      if (res.ok) {
        setAllowPublic(newValue);
        Swal.fire({
          icon: 'success',
          title: 'Pengaturan Diperbarui!',
          text: `Status registrasi toko publik telah ${newValue ? 'DIBUKA' : 'DITUTUP'}.`,
          confirmButtonColor: '#3b82f6'
        });
      } else {
        Swal.fire('Gagal', 'Gagal memperbarui pengaturan sistem', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan jaringan/sistem', 'error');
    }
  };

  const handleBackupSystem = async () => {
    setBackupLoading(true);
    try {
      Swal.fire({
        title: 'Mengekspor Database System...',
        text: 'Sedang menyiapkan seluruh data toko, transaksi, produk, dan pengguna...',
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
        a.download = `backup-system-superadmin-pos-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          icon: 'success',
          title: 'Backup Berhasil!',
          text: 'File backup seluruh sistem database berhasil diunduh.',
          confirmButtonColor: '#10b981'
        });
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
      title: '⚠️ PERINGATAN RESTORE SYSTEM ⚠️',
      html: '<div style="text-align: left; font-size: 0.9rem;">Anda akan memulihkan database seluruh sistem dari file backup.<br/><br/><strong style="color: #ef4444;">🔴 PERINGATAN: Seluruh data operasional semua toko saat ini akan DIHAPUS & DITIMPA PERMANEN</strong> oleh data file backup.<br/><br/>Apakah Anda yakin ingin melanjutkan?</div>',
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
      text: 'Harap tunggu, proses ini mungkin memakan waktu beberapa saat. Jangan tutup halaman.',
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
          Swal.fire('Berhasil!', 'Seluruh database sistem berhasil dipulihkan dari backup.', 'success');
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

  const handleResetAllStores = async () => {
    const { value: confirmText } = await Swal.fire({
      title: '⚠️ RESET GLOBAL SEMUA DATA TOKO ⚠️',
      html: `
        <div style="text-align: left; font-size: 0.85rem; line-height: 1.5; color: #334155;">
          Tindakan ini akan menghapus seluruh data operasional di <strong>SEMUA TOKO</strong> meliputi:
          <ul style="margin: 6px 0 10px 18px; padding: 0;">
            <li>📦 Data Produk & Kategori</li>
            <li>🧾 Seluruh Transaksi Penjualan Kasir</li>
            <li>📥 Riwayat Restock / Pembelian Gudang</li>
            <li>📤 Riwayat Retur Barang Gudang</li>
            <li>📋 Riwayat Stok Opname Gudang</li>
            <li>📝 Pesanan PO & Pengeluaran Biaya Operasional</li>
          </ul>
          <div style="background: #dcfce7; color: #15803d; padding: 8px 12px; border-radius: 6px; font-weight: bold; margin-bottom: 12px;">
            ✅ Profil Toko & Akun Login Manager (ADMIN) di setiap toko AKAN TETAP AMAN DIPERTAHANKAN.
          </div>
          Tuliskan kata <strong style="color: #ef4444;">KOSONGKAN</strong> di bawah untuk konfirmasi:
        </div>
      `,
      input: 'text',
      inputPlaceholder: 'Ketik KOSONGKAN di sini...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Reset Sekarang!',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (value !== 'KOSONGKAN') {
          return 'Teks konfirmasi harus tepat: KOSONGKAN';
        }
      }
    });

    if (!confirmText) return;

    Swal.fire({
      title: 'Mengosongkan Seluruh Data Toko...',
      text: 'Harap tunggu, proses reset sedang berjalan...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil!', data.message || 'Seluruh data operasional toko berhasil dikosongkan. Profil toko & akun manager dipertahankan.', 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal mengosongkan data toko.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan sistem saat mengosongkan data.', 'error');
    }
  };

  return (
    <div style={{ paddingBottom: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* HERO HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '2rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.3)', fontSize: '0.75rem', padding: '3px 12px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👑 Portal Administrator
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '0.75rem', padding: '3px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
              Sistem Utama Active
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ⚙️ Control Panel & Pengaturan Sistem
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, maxWidth: '700px', lineHeight: 1.6 }}>
            Pusat konfigurasi global untuk mengelola pendaftaran toko publik, mencadangkan & memulihkan database sistem, serta pemeliharaan data multi-toko.
          </p>
        </div>
      </div>

      {/* QUICK STATUS SUMMARY BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* CARD STAT 1: PUBLIC REGISTRATION */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: allowPublic ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            {allowPublic ? '🌐' : '🔒'}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Registrasi Toko Publik</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: allowPublic ? '#16a34a' : '#dc2626', marginTop: '2px' }}>
              {allowPublic ? 'DIBUKA (Aktif)' : 'DITUTUP (Terunci)'}
            </div>
          </div>
        </div>

        {/* CARD STAT 2: BACKUP STATUS */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            💾
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Backup System Database</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
              JSON Full Export Ready
            </div>
          </div>
        </div>

        {/* CARD STAT 3: ARCHITECTURE SAFETY */}
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Keamanan Multi-Tenant</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7c3aed', marginTop: '2px' }}>
              Isolated Store Schema
            </div>
          </div>
        </div>
      </div>

      {/* GRID CONFIGURATIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* CARD 1: PENGATURAN REGISTRASI TOKO PUBLIK */}
        <div className="card" style={{ borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🌐</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Registrasi Toko Publik</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Mengatur apakah calon pemilik toko baru diizinkan membuat toko dan akun manajer baru secara mandiri melalui form registrasi di halaman publik.
            </p>

            <div style={{ background: allowPublic ? '#f0fdf4' : '#fef2f2', border: `1px solid ${allowPublic ? '#bbf7d0' : '#fecaca'}`, padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: allowPublic ? '#166534' : '#991b1b' }}>
                  {allowPublic ? '🟢 Pendaftaran Publik Sedang DIBUKA' : '🔴 Pendaftaran Publik Sedang DITUTUP'}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: allowPublic ? '#15803d' : '#dc2626', color: '#fff', fontWeight: 'bold' }}>
                  {allowPublic ? 'OPEN' : 'LOCKED'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: allowPublic ? '#15803d' : '#991b1b', margin: '4px 0 0 0' }}>
                {allowPublic 
                  ? 'Siapapun dapat mendaftar toko baru secara mandiri melalui form pendaftaran.' 
                  : 'Registrasi publik ditutup. Hanya Super Admin yang dapat membuatkan toko baru.'}
              </p>
            </div>
          </div>

          <button 
            onClick={togglePublicRegistration}
            disabled={loadingSettings}
            style={{ 
              width: '100%', 
              padding: '0.85rem 1rem', 
              borderRadius: '8px', 
              border: 'none', 
              background: allowPublic ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)', 
              color: '#ffffff', 
              fontWeight: 700, 
              fontSize: '0.9rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              boxShadow: allowPublic ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {allowPublic ? '🔒 Tutup Pendaftaran Publik' : '🔓 Buka Pendaftaran Publik'}
          </button>
        </div>

        {/* CARD 2: BACKUP & RESTORE DATABASE SYSTEM */}
        <div className="card" style={{ borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>💾</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Backup & Restore System</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Mengekspor seluruh database sistem (seluruh toko, transaksi, produk, keuangan, dan pengguna) dalam format JSON, atau memulihkannya kembali.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1rem' }}>
              <button 
                onClick={handleBackupSystem}
                disabled={backupLoading}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1rem', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
                  color: '#ffffff', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' 
                }}
              >
                ⬇️ Unduh Backup Full System (.json)
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
                style={{ 
                  width: '100%', 
                  padding: '0.85rem 1rem', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  background: '#f8fafc', 
                  color: '#dc2626', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem' 
                }}
              >
                ⬆️ Pulihkan Database dari File Backup
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem' }}>
            💡 Backup berkala disarankan sebelum melakukan maintenance besar.
          </div>
        </div>
      </div>

      {/* DANGER ZONE CARD: RESET GLOBAL DATA OPERASIONAL TOKO */}
      <div className="card" style={{ borderRadius: '16px', border: '2px dashed #f87171', background: '#fff5f5', padding: '1.75rem', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            ⚠️
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>
              Zone Bahaya: Kosongkan Semua Data Toko (Global Reset)
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f1d1d' }}>
              Tindakan ini permanen dan mempengaruhi seluruh operasional toko di sistem.
            </p>
          </div>
        </div>

        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem', background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
          Tindakan reset global ini akan menghapus <strong>seluruh data operasional</strong> (Produk, Kategori, Transaksi Penjualan Kasir, Restock Gudang, Retur Barang, Stok Opname, PO, dan Pengeluaran Biaya) di <strong>SEMUA TOKO TERDAFTAR</strong>.
          <br/><br/>
          <span style={{ color: '#15803d', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            ✅ Informasi Toko (Nama, Alamat, Kode) & Akun Manager (ADMIN) setiap toko AKAN TETAP DIPERTAHANKAN AMAN.
          </span>
        </p>

        <button 
          onClick={handleResetAllStores}
          style={{ 
            width: '100%', 
            padding: '1rem 1.5rem', 
            borderRadius: '10px', 
            border: 'none', 
            background: 'linear-gradient(135deg, #dc2626, #991b1b)', 
            color: '#ffffff', 
            fontWeight: 800, 
            fontSize: '0.95rem', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.6rem',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)' 
          }}
        >
          🗑️ KOSONGKAN SEMUA DATA OPERASIONAL TOKO (RESET GLOBAL)
        </button>
      </div>
    </div>
  );
}
