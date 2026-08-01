'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function FinancesClient({ role }: { role: string }) {
  const [debts, setDebts] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  // WAREHOUSE only sees debts, CASHIER only sees receivables
  const initialTab = role === 'WAREHOUSE' ? 'debts' : 'receivables';
  const [activeTab, setActiveTab] = useState<'debts' | 'receivables'>(initialTab);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    if (role === 'ADMIN' || role === 'WAREHOUSE') fetchDebts();
    if (role === 'ADMIN' || role === 'CASHIER') fetchReceivables();
  }, [role]);

  const fetchDebts = async () => {
    setTableLoading(true);
    const res = await fetch('/api/finances/debts');
    const data = await res.json();
    if (data.success) setDebts(data.debts);
    setTableLoading(false);
  };

  const fetchReceivables = async () => {
    setTableLoading(true);
    const res = await fetch('/api/finances/receivables');
    const data = await res.json();
    if (data.success) setReceivables(data.receivables);
    setTableLoading(false);
  };

  const handleOpenPayment = (doc: any) => {
    setSelectedDoc(doc);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleOpenHistory = (doc: any) => {
    setSelectedDoc(doc);
    setShowHistoryModal(true);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return Swal.fire('Error', 'Nominal harus lebih dari 0', 'error');
    }

    const payload: any = {
      amount: Number(paymentAmount),
      notes: paymentNotes
    };

    let url = '';
    if (activeTab === 'receivables') {
      url = '/api/receivable-payments';
      payload.transactionId = selectedDoc.id;
    } else {
      url = '/api/debt-payments';
      payload.purchaseId = selectedDoc.id;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil!', 'Pembayaran cicilan berhasil dicatat', 'success');
        setShowPaymentModal(false);
        if (activeTab === 'receivables') fetchReceivables();
        else fetchDebts();
      } else {
        Swal.fire('Gagal!', data.message, 'error');
      }
    } catch (e) {
      Swal.fire('Error!', 'Terjadi kesalahan sistem', 'error');
    }
  };

  return (
    <div>
      <div className="card">
        <h2 className="card-title">💼 Manajemen Hutang & Piutang</h2>
        
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
          {(role === 'ADMIN' || role === 'CASHIER') && (
            <button 
              style={{ padding: '0.5rem 1rem', background: activeTab === 'receivables' ? 'var(--primary)' : 'transparent', color: activeTab === 'receivables' ? '#fff' : 'var(--text)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveTab('receivables')}
            >
              Piutang Pelanggan (Kasbon)
            </button>
          )}
          {(role === 'ADMIN' || role === 'WAREHOUSE') && (
            <button 
              style={{ padding: '0.5rem 1rem', background: activeTab === 'debts' ? '#ef4444' : 'transparent', color: activeTab === 'debts' ? '#fff' : 'var(--text)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveTab('debts')}
            >
              Hutang ke Supplier
            </button>
          )}
        </div>

        {activeTab === 'receivables' && (role === 'ADMIN' || role === 'CASHIER') && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tgl Transaksi</th>
                  <th>Pelanggan</th>
                  <th>Total Tagihan</th>
                  <th>Sudah Dibayar</th>
                  <th>Sisa Piutang</th>
                  <th>Jatuh Tempo</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="spinner"></div> Memuat data...
                    </td>
                  </tr>
                ) : receivables.map(r => {
                  const sisa = r.grandTotal - r.amountPaid;
                  return (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleDateString('id-ID')}</td>
                      <td style={{ fontWeight: 600 }}>{r.customer?.name || '-'}</td>
                      <td>Rp {r.grandTotal.toLocaleString('id-ID')}</td>
                      <td style={{ color: '#16a34a' }}>Rp {r.amountPaid.toLocaleString('id-ID')}</td>
                      <td style={{ color: '#ef4444', fontWeight: 'bold' }}>Rp {sisa.toLocaleString('id-ID')}</td>
                      <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                      <td>
                        {sisa <= 0 ? (
                          <span style={{ padding: '0.2rem 0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>LUNAS</span>
                        ) : (
                          <span style={{ padding: '0.2rem 0.5rem', background: '#fef08a', color: '#854d0e', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>BELUM LUNAS</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {role === 'CASHIER' && sisa > 0 && (
                            <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleOpenPayment(r)}>Catat Cicilan</button>
                          )}
                          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleOpenHistory(r)}>Riwayat</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!tableLoading && receivables.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada data piutang.</p>}
          </div>
        )}

        {activeTab === 'debts' && (role === 'ADMIN' || role === 'WAREHOUSE') && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tgl Pembelian</th>
                  <th>Supplier</th>
                  <th>Total Hutang</th>
                  <th>Sudah Dibayar</th>
                  <th>Sisa Hutang</th>
                  <th>Jatuh Tempo</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="spinner"></div> Memuat data...
                    </td>
                  </tr>
                ) : debts.map(d => {
                  const sisa = d.totalCost - d.amountPaid;
                  return (
                    <tr key={d.id}>
                      <td>{new Date(d.createdAt).toLocaleDateString('id-ID')}</td>
                      <td style={{ fontWeight: 600 }}>{d.supplier?.name || '-'}</td>
                      <td>Rp {d.totalCost.toLocaleString('id-ID')}</td>
                      <td style={{ color: '#16a34a' }}>Rp {d.amountPaid.toLocaleString('id-ID')}</td>
                      <td style={{ color: '#ef4444', fontWeight: 'bold' }}>Rp {sisa.toLocaleString('id-ID')}</td>
                      <td>{d.dueDate ? new Date(d.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                      <td>
                        {sisa <= 0 ? (
                          <span style={{ padding: '0.2rem 0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>LUNAS</span>
                        ) : (
                          <span style={{ padding: '0.2rem 0.5rem', background: '#fef08a', color: '#854d0e', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>BELUM LUNAS</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {role === 'WAREHOUSE' && sisa > 0 && (
                            <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleOpenPayment(d)}>Bayar Cicilan</button>
                          )}
                          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleOpenHistory(d)}>Riwayat</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!tableLoading && debts.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada data hutang.</p>}
          </div>
        )}
      </div>

      {showPaymentModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">💸 Pembayaran Cicilan</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setShowPaymentModal(false)}>Tutup</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ margin: 0 }}><strong>ID Dokumen:</strong> {selectedDoc.id.slice(-8).toUpperCase()}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Total:</strong> Rp {activeTab === 'receivables' ? selectedDoc.grandTotal.toLocaleString('id-ID') : selectedDoc.totalCost.toLocaleString('id-ID')}</p>
                <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  Sisa Tagihan: Rp {(
                    (activeTab === 'receivables' ? selectedDoc.grandTotal : selectedDoc.totalCost) - selectedDoc.amountPaid
                  ).toLocaleString('id-ID')}
                </p>
              </div>

              <form onSubmit={submitPayment}>
                <div className="form-group">
                  <label>Nominal Pembayaran (Rp)</label>
                  <input type="number" min="1" max={(activeTab === 'receivables' ? selectedDoc.grandTotal : selectedDoc.totalCost) - selectedDoc.amountPaid} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} onFocus={e => e.target.select()} required />
                </div>
                <div className="form-group">
                  <label>Keterangan Tambahan (Opsional)</label>
                  <input type="text" placeholder="Misal: Cicilan bulan pertama" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-success w-full" style={{ padding: '0.8rem' }}>Simpan Pembayaran</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">📜 Riwayat Pembayaran/Cicilan</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setShowHistoryModal(false)}>Tutup</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ margin: 0 }}><strong>ID Dokumen:</strong> {selectedDoc.id.slice(-8).toUpperCase()}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Pihak Terkait:</strong> {activeTab === 'receivables' ? selectedDoc.customer?.name : selectedDoc.supplier?.name}</p>
                <p style={{ margin: 0 }}><strong>Total Tagihan:</strong> Rp {activeTab === 'receivables' ? selectedDoc.grandTotal.toLocaleString('id-ID') : selectedDoc.totalCost.toLocaleString('id-ID')}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>Tanggal</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>Nominal</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e1' }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'receivables' ? selectedDoc.receivablePayments : selectedDoc.debtPayments)?.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>Belum ada riwayat pembayaran.</td>
                    </tr>
                  ) : (
                    (activeTab === 'receivables' ? selectedDoc.receivablePayments : selectedDoc.debtPayments)?.map((payment: any) => (
                      <tr key={payment.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>{new Date(payment.date).toLocaleString('id-ID')}</td>
                        <td style={{ padding: '0.75rem', color: '#16a34a', fontWeight: 'bold' }}>Rp {payment.amount.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '0.75rem', color: '#475569' }}>{payment.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
