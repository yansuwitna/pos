'use client';
import { useState, useRef } from 'react';
import Swal from 'sweetalert2';

export default function BackupRestorePage() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setLoading(true);
    try {
      Swal.fire({
        title: 'Mengekspor Database...',
        text: 'Harap tunggu, sedang menyiapkan file backup.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch('/api/backup');
      const data = await res.json();
      
      if (data.success) {
        // Download as JSON
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `backup-pos-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        Swal.fire('Berhasil!', 'File backup telah berhasil diunduh.', 'success');
      } else {
        Swal.fire('Gagal', data.message || 'Gagal mengekspor database.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan sistem saat backup.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      return Swal.fire('Format Salah', 'Harap unggah file dengan format .json', 'error');
    }

    const confirm = await Swal.fire({
      title: '⚠️ PERINGATAN BAHAYA ⚠️',
      html: 'Anda akan memulihkan database dari file backup. <br/><br/><b>Seluruh data saat ini (Barang, Transaksi, User) akan DIHAPUS PERMANEN</b> dan digantikan oleh data dari file backup.<br/><br/>Apakah Anda benar-benar yakin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Timpa Database!',
      cancelButtonText: 'Batal',
      focusCancel: true
    });

    if (!confirm.isConfirmed) return;

    // Double confirmation for safety
    const confirm2 = await Swal.fire({
      title: 'Apakah Anda yakin 100%?',
      text: 'Tindakan ini tidak bisa dibatalkan!',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Saya Yakin!',
      cancelButtonText: 'Batal'
    });

    if (!confirm2.isConfirmed) return;

    setLoading(true);
    Swal.fire({
      title: 'Memulihkan Database...',
      text: 'Harap tunggu, proses ini mungkin memakan waktu beberapa menit. Jangan tutup halaman ini.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
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
          Swal.fire({
            title: 'Berhasil!',
            text: 'Database telah berhasil dipulihkan. Halaman akan dimuat ulang untuk memperbarui sistem.',
            icon: 'success',
            confirmButtonText: 'Muat Ulang'
          }).then(() => {
            window.location.href = '/dashboard';
          });
        } else {
          Swal.fire('Gagal', result.message || 'Gagal memulihkan database.', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'File backup rusak atau tidak dapat dibaca.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setLoading(false);
      Swal.fire('Error', 'Gagal membaca file.', 'error');
    };

    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>💾 Backup & Restore Database</h2>
      
      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#0369a1' }}>⬇️ Unduh Backup Toko (Export)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Simpan seluruh data toko Anda (Barang, Kategori, Transaksi, Supplier, Pelanggan, User Toko) ke dalam file .json. Disarankan untuk rutin melakukan backup seminggu sekali.
          </p>
          <button 
            className="btn w-full" 
            style={{ background: '#0284c7', fontSize: '1rem', padding: '0.8rem' }}
            onClick={handleBackup}
            disabled={loading}
          >
            {loading ? 'Mengekspor...' : 'Unduh Backup Toko'}
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#b91c1c' }}>⬆️ Pulihkan Data Toko (Restore)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Kembalikan toko Anda ke kondisi sebelumnya dari file backup .json. 
            <br/><br/>
            <strong>PERINGATAN:</strong> Seluruh data operasional toko ini akan ditimpa dengan data file backup!
          </p>
          <input 
            type="file" 
            accept=".json" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleRestore}
          />
          <button 
            className="btn w-full" 
            style={{ background: '#dc2626', fontSize: '1rem', padding: '0.8rem' }}
            onClick={triggerFileInput}
            disabled={loading}
          >
            Unggah & Pulihkan
          </button>
        </div>
      </div>
    </div>
  );
}
