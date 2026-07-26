'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setTableLoading(true);
    const res = await fetch('/api/expenses');
    const data = await res.json();
    if (data.success) {
      setExpenses(data.expenses);
    }
    setTableLoading(false);
  };

  const handleEdit = (expense: any) => {
    setEditId(expense.id);
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDescription(expense.description || '');
    setDate(new Date(expense.date).toISOString().split('T')[0]);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus pengeluaran?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Terhapus!', 'Data pengeluaran berhasil dihapus.', 'success');
        fetchExpenses();
      } else {
        Swal.fire('Gagal!', data.message, 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      category,
      amount: Number(amount),
      description,
      date: new Date(date).toISOString()
    };

    let res;
    if (editId) {
      res = await fetch(`/api/expenses/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      Swal.fire('Berhasil!', 'Data pengeluaran disimpan.', 'success');
      setShowForm(false);
      setEditId(null);
      setCategory('');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      fetchExpenses();
    } else {
      Swal.fire('Gagal!', data.message, 'error');
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>💸 Biaya Operasional & Pengeluaran</h2>
          <button className="btn btn-success" onClick={() => {
            setEditId(null);
            setCategory('');
            setAmount('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            setShowForm(true);
          }}>➕ Tambah Pengeluaran</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Nominal</th>
                <th>Keterangan</th>
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
              ) : expenses.map((e: any) => (
                <tr key={e.id}>
                  <td>{new Date(e.date).toLocaleDateString('id-ID')}</td>
                  <td style={{ fontWeight: 'bold' }}>{e.category}</td>
                  <td>Rp {e.amount.toLocaleString('id-ID')}</td>
                  <td>{e.description || '-'}</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', marginRight: '0.5rem' }} onClick={() => handleEdit(e)}>Edit</button>
                    <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDelete(e.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tableLoading && expenses.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data pengeluaran.</p>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setShowForm(false)}>Tutup</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Tanggal</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Kategori Biaya</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} required>
                    <option value="">-- Pilih Kategori --</option>
                    <option value="Listrik">Listrik & Air</option>
                    <option value="Gaji Karyawan">Gaji Karyawan</option>
                    <option value="Sewa Tempat">Sewa Tempat</option>
                    <option value="Bensin / Transport">Bensin / Transport</option>
                    <option value="Konsumsi">Konsumsi</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nominal (Rp)</label>
                  <input type="number" min="0" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Keterangan Tambahan</label>
                  <textarea placeholder="Contoh: Bayar listrik bulan juli..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
