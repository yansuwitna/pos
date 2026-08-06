'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  _count?: {
    transactions: number;
  };
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        const u = data.user || data;
        if (data.success && u) {
          setUserRole(u.role || u.user?.role);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setRoleLoading(false));
  }, []);

  const fetchCustomers = async () => {
    setTableLoading(true);
    const res = await fetch('/api/customers');
    const data = await res.json();
    if (data.success) {
      setCustomers(data.customers);
    }
    setTableLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCustomer) {
      if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer tidak diperbolehkan mengedit pelanggan.', 'warning');
      if (!editCustomer.name) return Swal.fire('Peringatan', "Nama Pelanggan wajib diisi", 'warning');
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${editCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editCustomer)
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Berhasil!', "Pelanggan berhasil diubah!", 'success');
          setEditCustomer(null);
          setShowForm(false);
          fetchCustomers();
        } else {
          Swal.fire('Gagal', data.message, 'error');
        }
      } catch(err) {
        Swal.fire('Error', "Terjadi kesalahan.", 'error');
      } finally {
        setLoading(false);
      }
    } else {
      if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer tidak diperbolehkan menambah pelanggan.', 'warning');
      if (!form.name) return Swal.fire('Peringatan', "Nama Pelanggan wajib diisi", 'warning');
      setLoading(true);
      try {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Berhasil!', "Pelanggan berhasil ditambahkan!", 'success');
          setForm({ name: '', phone: '', address: '' });
          setShowForm(false);
          fetchCustomers();
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
    if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer tidak diperbolehkan menghapus pelanggan.', 'warning');
    const result = await Swal.fire({
      title: 'Hapus Pelanggan?',
      text: `Anda yakin ingin menghapus pelanggan "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Terhapus!', "Berhasil dihapus", 'success');
        fetchCustomers();
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
          <h2 className="card-title" style={{ marginBottom: 0 }}>📋 Daftar Pelanggan ({customers.length})</h2>
          {!showForm && !roleLoading && userRole !== 'ADMIN' && (
            <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Tambah Pelanggan</button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak (No HP)</th>
                <th>Alamat</th>
                {userRole !== 'ADMIN' && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 3 : 4} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div> Memuat data...
                  </td>
                </tr>
              ) : customers.map(c => {
                const isUsed = c._count && c._count.transactions > 0;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.address || '-'}</td>
                    {userRole !== 'ADMIN' && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditCustomer(c);
                              setShowForm(true);
                            }}
                            style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                          >Edit</button>
                          {!isUsed && (
                            <button 
                              onClick={() => handleDelete(c.id, c.name)} 
                              style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!tableLoading && customers.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada pelanggan.</p>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editCustomer ? '✏️ Edit Pelanggan' : '👥 Tambah Pelanggan Baru'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setShowForm(false); setEditCustomer(null); }}>Tutup</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as any).tagName !== 'BUTTON' && (e.target as any).tagName !== 'TEXTAREA') e.preventDefault(); }}>
                <div className="form-group">
                  <label>Nama Pelanggan</label>
                  <input 
                    type="text" 
                    value={editCustomer ? editCustomer.name : form.name} 
                    onChange={e => editCustomer ? setEditCustomer({...editCustomer, name: e.target.value}) : setForm({...form, name: e.target.value})} 
                    placeholder="Contoh: Budi Santoso" required />
                </div>
                <div className="form-group">
                  <label>Kontak (No HP / Telepon)</label>
                  <input 
                    type="text" 
                    value={editCustomer ? (editCustomer.phone || '') : form.phone} 
                    onChange={e => editCustomer ? setEditCustomer({...editCustomer, phone: e.target.value}) : setForm({...form, phone: e.target.value})} 
                    placeholder="0812xxxxxx" />
                </div>
                <div className="form-group">
                  <label>Alamat</label>
                  <input 
                    type="text" 
                    value={editCustomer ? (editCustomer.address || '') : form.address} 
                    onChange={e => editCustomer ? setEditCustomer({...editCustomer, address: e.target.value}) : setForm({...form, address: e.target.value})} 
                    placeholder="Alamat lengkap..." />
                </div>
                <button type="submit" className="btn w-full mt-4" disabled={loading}>
                  {loading ? 'Menyimpan...' : (editCustomer ? '💾 Simpan Perubahan' : '➕ Tambah Pelanggan')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
