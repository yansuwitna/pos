'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function CapitalPage() {
  const [capitals, setCapitals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('IN');

  const fetchCapitals = async () => {
    try {
      const res = await fetch('/api/finances/capital');
      const data = await res.json();
      if (data.success) setCapitals(data.capitals);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCapitals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return Swal.fire('Error', 'Nominal wajib diisi', 'error');

    const numAmount = Math.abs(Number(amount));
    const finalAmount = type === 'OUT' ? -numAmount : numAmount;

    try {
      const res = await fetch('/api/finances/capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          description: description || (type === 'IN' ? 'Modal Awal' : 'Penarikan Modal'),
          date: date || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil', 'Transaksi modal berhasil dicatat', 'success');
        setAmount('');
        setDescription('');
        setDate('');
        fetchCapitals();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Gagal menghubungi server', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>💰 Pencatatan Modal & Penarikan Dana</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Transaksi Modal Baru</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Jenis Transaksi</label>
            <select value={type} onChange={e => setType(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}>
              <option value="IN">Suntik Modal (Kas Masuk)</option>
              <option value="OUT">Tarik Modal / Prive (Kas Keluar)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nominal (Rp)</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Contoh: 10000000"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Keterangan</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'IN' ? "Contoh: Suntik Dana Usaha" : "Contoh: Penarikan Keperluan Pribadi"}
            />
          </div>

          <div className="form-group">
            <label>Tanggal Pencatatan (Opsional, abaikan jika hari ini)</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '1rem', backgroundColor: type === 'IN' ? 'var(--primary)' : '#dc2626' }}>
            💾 Simpan Transaksi Modal
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Riwayat Modal</h2>
        {capitals.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>Belum ada data pencatatan modal.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Nominal</th>
                  <th>Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody>
                {capitals.map(cap => {
                  const isPositive = cap.amount > 0;
                  return (
                    <tr key={cap.id}>
                      <td>{new Date(cap.date).toLocaleDateString('id-ID')}</td>
                      <td>{cap.description}</td>
                      <td style={{ fontWeight: 'bold', color: isPositive ? '#16a34a' : '#dc2626' }}>
                        {isPositive ? '+' : '-'} Rp {Math.abs(cap.amount).toLocaleString('id-ID')}
                      </td>
                      <td>{cap.user?.name || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
