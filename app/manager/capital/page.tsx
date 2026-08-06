'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function CapitalPage() {
  const [capitals, setCapitals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchCapitals = async () => {
    setTableLoading(true);
    try {
      const res = await fetch('/api/finances/capital');
      const data = await res.json();
      if (data.success) setCapitals(data.capitals);
    } catch (e) {
      console.error(e);
    } finally {
      setTableLoading(false);
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

    setLoading(true);
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
        setShowModal(false);
        fetchCapitals();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Gagal menghubungi server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📋 Riwayat Modal Usaha ({capitals.length})</h2>
          {!showModal && (
            <button className="btn btn-success" onClick={() => setShowModal(true)}>➕ Tambah Transaksi Modal</button>
          )}
        </div>

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
              {tableLoading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div> Memuat data...
                  </td>
                </tr>
              ) : capitals.map(cap => {
                const isPositive = cap.amount > 0;
                return (
                  <tr key={cap.id}>
                    <td>{new Date(cap.date).toLocaleDateString('id-ID')}</td>
                    <td style={{ fontWeight: 600 }}>{cap.description}</td>
                    <td style={{ fontWeight: 'bold', color: isPositive ? '#16a34a' : '#dc2626' }}>
                      {isPositive ? '+' : '-'} Rp {Math.abs(cap.amount).toLocaleString('id-ID')}
                    </td>
                    <td>{cap.user?.name || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!tableLoading && capitals.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data pencatatan modal.</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">💰 Transaksi Modal Baru</h2>
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
                  <label>Jenis Transaksi</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)} 
                    required 
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  >
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
                    onFocus={e => e.target.select()}
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

                <button 
                  type="submit" 
                  className="btn btn-primary w-full mt-4" 
                  disabled={loading}
                  style={{ padding: '0.75rem', fontSize: '1rem', backgroundColor: type === 'IN' ? 'var(--primary)' : '#dc2626' }}
                >
                  {loading ? 'Menyimpan...' : '💾 Simpan Transaksi Modal'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
