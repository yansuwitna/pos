'use client';
import { useState, useEffect } from 'react';

type Transaction = {
  id: string;
  total: number;
  discount?: number;
  grandTotal?: number;
  payment: number;
  change: number;
  createdAt: string;
  user: { name: string, role: string };
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const y = lastDay.getFullYear();
    const m = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [totalCost, setTotalCost] = useState(0); // Total HPP (Cost of Goods Sold)
  const [showPrint, setShowPrint] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  const fetchReports = () => {
    setTableLoading(true);
    fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransactions(data.transactions);
          const revenue = data.transactions.reduce((acc: number, curr: Transaction) => acc + (curr.grandTotal !== undefined ? curr.grandTotal : curr.total), 0);
          
          // Hitung HPP (Modal) dari barang yang terjual
          let cost = 0;
          data.transactions.forEach((trx: any) => {
            trx.items.forEach((item: any) => {
              cost += (item.product?.cost || 0) * item.quantity;
            });
          });
          
          setTotalRevenue(revenue);
          setTotalCost(cost);
        }
        setTableLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div>
      <div className="card mb-6">
        <h2 className="card-title">📅 Filter Laporan</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Tanggal Awal</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Tanggal Akhir</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn" style={{ padding: '0.85rem 1.5rem', height: 'fit-content' }} onClick={fetchReports}>
            🔍 Tampilkan
          </button>
          <button className="btn btn-success" style={{ padding: '0.85rem 1.5rem', height: 'fit-content', marginLeft: 'auto' }} onClick={() => setShowPrint(true)}>
            🖨️ Cetak Laporan
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none' }}>
          <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Pendapatan (Omset)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>Rp {totalRevenue.toLocaleString('id-ID')}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
          <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Laba / Keuntungan</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>Rp {(totalRevenue - totalCost).toLocaleString('id-ID')}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none' }}>
          <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Jumlah Transaksi</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{transactions.length}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">📊 Riwayat Transaksi</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Kasir</th>
                <th>Total Tagihan</th>
                <th>Pembayaran</th>
                <th>Kembalian</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div> Memuat data...
                  </td>
                </tr>
              ) : transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {(t.user?.name || 'K').charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{t.user?.name || 'Kasir'}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>Rp {t.total.toLocaleString('id-ID')}</td>
                  <td style={{ color: 'var(--text-muted)' }}>Rp {t.payment.toLocaleString('id-ID')}</td>
                  <td style={{ color: 'var(--text-muted)' }}>Rp {t.change.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tableLoading && transactions.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Belum ada data transaksi.</p>}
        </div>
      </div>

      {showPrint && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div id="print-area" className="print-area" style={{ padding: '2rem', background: '#fff', color: '#000' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>LAPORAN PENJUALAN</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#555' }}>Periode: {new Date(startDate).toLocaleDateString('id-ID')} s/d {new Date(endDate).toLocaleDateString('id-ID')}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem', borderBottom: '2px dashed #ccc', paddingBottom: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Pendapatan</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rp {totalRevenue.toLocaleString('id-ID')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Laba / Keuntungan</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rp {(totalRevenue - totalCost).toLocaleString('id-ID')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Jumlah Transaksi</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{transactions.length}</div>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Rincian Transaksi</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'left' }}>Waktu</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'left' }}>Kasir</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>Total Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{t.user?.name || 'Kasir'}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>Rp {t.total.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ border: '1px solid #000', padding: '1rem', textAlign: 'center' }}>Tidak ada transaksi pada periode ini</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', textAlign: 'center' }}>
                <div style={{ width: '200px' }}>
                  <p style={{ marginBottom: '4rem' }}>Hormat Kami,</p>
                  <p style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>Admin / Manajer</p>
                </div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPrint(false)}>Tutup</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Cetak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
