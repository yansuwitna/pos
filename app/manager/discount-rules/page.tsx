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
  const [form, setForm] = useState({
    id: '',
    name: '',
    minItemQuantity: '',
    minTransaction: '',
    discountPercent: '',
    isActive: true
  });

  const fetchRules = async () => {
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
        Swal.fire('Berhasil', 'Aturan diskon disimpan!', 'success');
        setShowModal(false);
        fetchRules();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Gagal menyimpan aturan', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus aturan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/discount-rules/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Terhapus', 'Aturan berhasil dihapus', 'success');
          fetchRules();
        } else {
          Swal.fire('Gagal', data.message, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus aturan', 'error');
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-2xl font-bold">🎟️ Manajemen Aturan Diskon</h1>
        <button className="btn btn-primary" onClick={openAddModal}>+ Tambah Aturan</button>
      </div>

      <div className="card">
        {loading ? <p>Memuat data...</p> : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Nama Aturan</th>
                  <th>Syarat Min Item</th>
                  <th>Syarat Min Belanja</th>
                  <th>Diskon (%)</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada aturan diskon</td>
                  </tr>
                ) : rules.map(rule => (
                  <tr key={rule.id}>
                    <td style={{ fontWeight: 600 }}>{rule.name}</td>
                    <td>{rule.minItemQuantity || '-'} item</td>
                    <td>{rule.minTransaction ? `Rp ${rule.minTransaction.toLocaleString('id-ID')}` : '-'}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>{rule.discountPercent}%</td>
                    <td>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        background: rule.isActive ? '#dcfce7' : '#fee2e2',
                        color: rule.isActive ? '#166534' : '#991b1b'
                      }}>
                        {rule.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', marginRight: '0.5rem' }} onClick={() => openEditModal(rule)}>Edit</button>
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(rule.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="card-title">{form.id ? 'Edit Aturan Diskon' : 'Tambah Aturan Diskon'}</h2>
            <form onSubmit={handleSubmit}>
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
                <label>Minimal Total Belanja (Opsional)</label>
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
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={e => setForm({...form, isActive: e.target.checked})} 
                  id="isActive"
                  style={{ width: 'auto' }}
                />
                <label htmlFor="isActive" style={{ marginBottom: 0, cursor: 'pointer' }}>Aturan Aktif?</label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
