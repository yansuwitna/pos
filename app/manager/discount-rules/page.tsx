'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

type DiscountRule = {
  id: string;
  name: string;
  minItemQuantity: number | null;
  minTransaction: number | null;
  discountPercent: number;
  isActive: boolean;
};

export default function DiscountRulesPage() {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: '',
    name: '',
    minItemQuantity: '',
    minTransaction: '',
    discountPercent: '',
    isActive: true
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/discount-rules');
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.discountPercent) {
      return Swal.fire('Error', 'Nama dan Persen diskon wajib diisi!', 'error');
    }

    setSaving(true);
    try {
      const url = form.id ? `/api/discount-rules/${form.id}` : '/api/discount-rules';
      const method = form.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil', 'Aturan diskon berhasil disimpan!', 'success');
        setShowModal(false);
        fetchRules();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Gagal menyimpan aturan diskon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Aturan Diskon?',
      text: `Anda yakin ingin menghapus aturan "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/discount-rules/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Terhapus', 'Aturan diskon berhasil dihapus', 'success');
          fetchRules();
        } else {
          Swal.fire('Gagal', data.message, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus aturan diskon', 'error');
      }
    }
  };

  const openAddModal = () => {
    setForm({ id: '', name: '', minItemQuantity: '', minTransaction: '', discountPercent: '', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (rule: DiscountRule) => {
    setForm({
      id: rule.id,
      name: rule.name,
      minItemQuantity: rule.minItemQuantity ? String(rule.minItemQuantity) : '',
      minTransaction: rule.minTransaction ? String(rule.minTransaction) : '',
      discountPercent: String(rule.discountPercent),
      isActive: rule.isActive
    });
    setShowModal(true);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>🎟️ Manajemen Aturan Diskon ({rules.length})</h2>
          {!showModal && (
            <button className="btn btn-primary" onClick={openAddModal}>➕ Tambah Aturan Diskon</button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama Aturan</th>
                <th>Syarat Min. Item</th>
                <th>Syarat Min. Belanja</th>
                <th>Diskon (%)</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div> Memuat data...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada aturan diskon yang dibuat.</td>
                </tr>
              ) : rules.map(rule => (
                <tr key={rule.id}>
                  <td style={{ fontWeight: 600 }}>{rule.name}</td>
                  <td>{rule.minItemQuantity ? `${rule.minItemQuantity} item` : '-'}</td>
                  <td>{rule.minTransaction ? `Rp ${rule.minTransaction.toLocaleString('id-ID')}` : '-'}</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>{rule.discountPercent}%</td>
                  <td>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: rule.isActive ? '#dcfce7' : '#fee2e2',
                      color: rule.isActive ? '#166534' : '#991b1b'
                    }}>
                      {rule.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openEditModal(rule)} 
                        style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >Edit</button>
                      <button 
                        onClick={() => handleDelete(rule.id, rule.name)} 
                        style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{form.id ? '✏️ Edit Aturan Diskon' : '🎟️ Tambah Aturan Diskon'}</h2>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.4rem 0.8rem' }} 
                onClick={() => setShowModal(false)}
              >
                Tutup
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Nama Aturan</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="Contoh: Diskon Grosir > 30 Item" 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Minimal Jumlah Item (Opsional)</label>
                  <input 
                    type="number" 
                    value={form.minItemQuantity} 
                    onChange={e => setForm({...form, minItemQuantity: e.target.value})} 
                    onFocus={e => e.target.select()}
                    placeholder="Misal: 30" 
                  />
                </div>

                <div className="form-group">
                  <label>Minimal Total Belanja (Opsional, Rp)</label>
                  <input 
                    type="number" 
                    value={form.minTransaction} 
                    onChange={e => setForm({...form, minTransaction: e.target.value})} 
                    onFocus={e => e.target.select()}
                    placeholder="Misal: 1000000" 
                  />
                </div>

                <div className="form-group">
                  <label>Persen Diskon (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={form.discountPercent} 
                    onChange={e => setForm({...form, discountPercent: e.target.value})} 
                    onFocus={e => e.target.select()}
                    placeholder="Misal: 5" 
                    required 
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={e => setForm({...form, isActive: e.target.checked})} 
                    id="isActive"
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>Aturan Aktif?</label>
                </div>
                
                <button type="submit" className="btn btn-primary w-full mt-2" disabled={saving}>
                  {saving ? 'Menyimpan...' : (form.id ? '💾 Simpan Perubahan' : '➕ Tambah Aturan')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
