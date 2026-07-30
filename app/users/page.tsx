'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

type User = {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'CASHIER' | 'WAREHOUSE';
  isActive: boolean;
  createdAt: string;
  _count?: {
    transactions: number;
    purchases: number;
    returns: number;
    orders: number;
  };
};

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:     { label: '👑 Admin',          color: '#92400e', bg: '#fef3c7' },
  CASHIER:   { label: '🛍️ Kasir',         color: '#1e40af', bg: '#dbeafe' },
  WAREHOUSE: { label: '📦 Operator Gudang', color: '#065f46', bg: '#d1fae5' },
};

type UserForm = { username: '', password: '', name: '', role: 'ADMIN' | 'CASHIER' | 'WAREHOUSE' };
const emptyForm = { username: '', password: '', name: '', role: 'CASHIER' as 'ADMIN' | 'CASHIER' | 'WAREHOUSE' };

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([]);
  const [form, setForm]       = useState(emptyForm);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setTableLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) {
      setUsers(data.users);
      setCurrentUserId(data.currentUserId ?? null);
    }
    setTableLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      Swal.fire('Berhasil!', 'User berhasil ditambahkan!', 'success');
      setForm(emptyForm);
      setShowForm(false);
      fetchUsers();
    } else {
      Swal.fire('Gagal', data.message, 'error');
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editUser)
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      Swal.fire('Berhasil!', 'User berhasil diperbarui!', 'success');
      setEditUser(null);
      setShowForm(false);
      fetchUsers();
    } else {
      Swal.fire('Gagal', data.message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus User?',
      text: `Anda yakin ingin menghapus user "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire('Terhapus!', 'User berhasil dihapus.', 'success');
      fetchUsers();
    } else {
      Swal.fire('Gagal', data.message, 'error');
    }
  };

  return (
    <div>
      <div>
        {/* Tabel daftar user */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>👥 Daftar User ({users.length})</h2>
            {!showForm && (
              <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Tambah User Baru</button>
            )}
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="spinner"></div> Memuat data...
                    </td>
                  </tr>
                ) : users.map(u => {
                  const isUsed = u._count && (u._count.transactions > 0 || u._count.purchases > 0 || u._count.returns > 0 || u._count.orders > 0);
                  
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.username}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '99px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: roleLabels[u.role]?.bg,
                          color: roleLabels[u.role]?.color,
                        }}>
                          {roleLabels[u.role]?.label}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '99px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: u.isActive ? '#d1fae5' : '#fee2e2',
                          color: u.isActive ? '#065f46' : '#991b1b',
                        }}>
                          {u.isActive ? '✅ Aktif' : '🚫 Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(u)}
                            style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                          >Edit</button>
                          {u.role !== 'ADMIN' && !isUsed && (
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                            >Hapus</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!tableLoading && users.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data user.</p>}
          </div>
        </div>

        {/* Form tambah / edit user */}
        {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editUser ? '✏️ Edit User' : '➕ Tambah User'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setShowForm(false); setEditUser(null); }}>Tutup</button>
            </div>

            <div className="modal-body">

          {editUser ? (
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input value={editUser.username} disabled style={{ cursor: 'not-allowed', opacity: 0.7 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>Username tidak dapat diubah</span>
              </div>
              <div className="form-group">
                <label>Password Baru (kosongkan jika tidak diubah)</label>
                <input type="password" placeholder="••••••••" onChange={e => setEditUser({...editUser, password: e.target.value} as any)} />
              </div>
              <div className="form-group">
                <label>Role / Jabatan</label>
                {editUser.id === currentUserId ? (
                  <div style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {roleLabels[editUser.role]?.label} &nbsp;<em style={{ fontSize: '0.8rem' }}>(Tidak dapat mengubah role sendiri)</em>
                  </div>
                ) : (
                  <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value as any})}>
                    <option value="ADMIN">👑 Admin (Laporan & Manajemen User)</option>
                    <option value="CASHIER">🛍️ Kasir (Transaksi POS)</option>
                    <option value="WAREHOUSE">📦 Operator Gudang (Input Barang)</option>
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Status Akun</label>
                {editUser.id === currentUserId ? (
                  <div style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {editUser.isActive ? '✅ Aktif' : '🚫 Nonaktif'} &nbsp;<em style={{ fontSize: '0.8rem' }}>(Tidak dapat menonaktifkan akun sendiri)</em>
                  </div>
                ) : (
                  <select value={editUser.isActive ? 'true' : 'false'} onChange={e => setEditUser({...editUser, isActive: e.target.value === 'true'})}>
                    <option value="true">✅ Aktif</option>
                    <option value="false">🚫 Nonaktif</option>
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn w-full" disabled={loading}>
                  {loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="cth: Budi Santoso" required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="cth: budi123" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label>Role / Jabatan</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value as any})}>
                  <option value="ADMIN">👑 Admin (Laporan & Manajemen User)</option>
                  <option value="CASHIER">🛍️ Kasir (Transaksi POS)</option>
                  <option value="WAREHOUSE">📦 Operator Gudang (Input Barang)</option>
                </select>
              </div>

              {/* Info akses per role */}
              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {form.role === 'ADMIN'     && <><strong>👑 Admin</strong> — Hanya dapat mengakses: <strong>Laporan Transaksi</strong> dan <strong>Manajemen User</strong>.</>}
                {form.role === 'CASHIER'   && <><strong>🛍️ Kasir</strong> — Hanya dapat mengakses: <strong>Layar Transaksi POS</strong> (jual beli).</>}
                {form.role === 'WAREHOUSE' && <><strong>📦 Gudang</strong> — Hanya dapat mengakses: <strong>Input & Manajemen Barang/Jasa</strong>.</>}
              </div>

              <button type="submit" className="btn w-full" disabled={loading}>
                {loading ? 'Menyimpan...' : '➕ Tambah User'}
              </button>
            </form>
          )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
