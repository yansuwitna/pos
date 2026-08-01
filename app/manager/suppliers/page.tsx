'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
  _count?: {
    purchases: number;
    returns: number;
    orders: number;
  };
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: '', contact: '', address: '' });
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setTableLoading(true);
    const res = await fetch('/api/suppliers');
    const data = await res.json();
    if (data.success) {
      setSuppliers(data.suppliers);
    }
    setTableLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSupplier) {
      if (!editSupplier.name) return Swal.fire('Peringatan', "Nama Penyedia Barang wajib diisi", 'warning');
      setLoading(true);
      try {
        const res = await fetch('/api/suppliers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editSupplier.id,
            name: editSupplier.name,
            contact: editSupplier.contact,
            address: editSupplier.address
          })
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Berhasil!', "Penyedia Barang berhasil diubah!", 'success');
          setEditSupplier(null);
          setShowForm(false);
          fetchSuppliers();
        } else {
          Swal.fire('Gagal', data.message, 'error');
        }
      } catch(err) {
        Swal.fire('Error', "Terjadi kesalahan.", 'error');
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.name) return Swal.fire('Peringatan', "Nama Penyedia Barang wajib diisi", 'warning');
      setLoading(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil!', "Penyedia Barang berhasil ditambahkan!", 'success');
        setForm({ name: '', contact: '', address: '' });
        setShowForm(false);
        fetchSuppliers();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch(err) {
      Swal.fire('Error', "Terjadi kesalahan.", 'error');
    } finally {
      setLoading(false);
    }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Penyedia Barang?',
      text: `Anda yakin ingin menghapus penyedia barang "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Terhapus!', "Berhasil dihapus", 'success');
        fetchSuppliers();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch(err) {
      Swal.fire('Error', "Terjadi kesalahan.", 'error');
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📋 Daftar Penyedia Barang ({suppliers.length})</h2>
          {!showForm && (
            <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Tambah Supplier</button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Alamat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div> Memuat data...
                  </td>
                </tr>
              ) : suppliers.map(s => {
                const isUsed = s._count && (s._count.purchases > 0 || s._count.returns > 0 || s._count.orders > 0);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.contact || '-'}</td>
                    <td>{s.address || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setEditSupplier(s);
                            setShowForm(true);
                          }}
                          style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                        >Edit</button>
                        {!isUsed && (
                          <button 
                            onClick={() => handleDelete(s.id, s.name)} 
                            style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!tableLoading && suppliers.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada penyedia barang.</p>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editSupplier ? '✏️ Edit Penyedia Barang' : '🏢 Tambah Penyedia Barang (Supplier)'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setShowForm(false); setEditSupplier(null); }}>Tutup</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Nama Penyedia (Perusahaan/Toko)</label>
                  <input 
                    type="text" 
                    value={editSupplier ? editSupplier.name : form.name} 
                    onChange={e => editSupplier ? setEditSupplier({...editSupplier, name: e.target.value}) : setForm({...form, name: e.target.value})} 
                    placeholder="Contoh: PT. Maju Jaya" required />
                </div>
                <div className="form-group">
                  <label>Kontak (No HP / Telepon)</label>
                  <input 
                    type="text" 
                    value={editSupplier ? (editSupplier.contact || '') : form.contact} 
                    onChange={e => editSupplier ? setEditSupplier({...editSupplier, contact: e.target.value}) : setForm({...form, contact: e.target.value})} 
                    placeholder="0812xxxxxx" />
                </div>
                <div className="form-group">
                  <label>Alamat</label>
                  <input 
                    type="text" 
                    value={editSupplier ? (editSupplier.address || '') : form.address} 
                    onChange={e => editSupplier ? setEditSupplier({...editSupplier, address: e.target.value}) : setForm({...form, address: e.target.value})} 
                    placeholder="Alamat lengkap..." />
                </div>
                <button type="submit" className="btn w-full mt-4" disabled={loading}>
                  {loading ? 'Menyimpan...' : (editSupplier ? '💾 Simpan Perubahan' : '➕ Tambah Penyedia Barang')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
