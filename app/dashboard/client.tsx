'use client';
import { useState, useEffect } from 'react';

type Props = { role: string, name: string };

export default function DashboardClient({ role, name }: Props) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [storeInfo, setStoreInfo] = useState<any>({
    name: 'POS Pro', address: '', phone: '', greeting: 'Terima Kasih', logo: ''
  });

  useEffect(() => {
    const savedStore = localStorage.getItem('pos_store_info');
    if (savedStore) {
      try { setStoreInfo(JSON.parse(savedStore)); } catch(e){}
    }
    
    if (role === 'CASHIER') {
      fetch('/api/transactions')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTransactions(data.transactions);
          }
        });
    }
  }, [role]);

  const viewReceipt = (trx: any) => {
    const items = trx.items.map((i: any) => ({
      name: i.productName || i.product?.name || 'Produk Dihapus',
      quantity: i.quantity,
      price: i.price,
      subtotal: i.subtotal
    }));

    setReceiptData({
      items,
      total: trx.total,
      payment: trx.payment,
      change: trx.change,
      date: new Date(trx.createdAt)
    });
  };

  const printReceipt = async () => {
    if (!receiptData) return;
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2']
      });
      await device.gatt.connect();
      alert("Printer terhubung! Mengirim instruksi cetak...");
    } catch (error) {
      alert("Pencetakan dibatalkan atau printer tidak ditemukan.");
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>Selamat Datang, {name}!</h1>
        <p style={{ color: 'var(--text-muted)' }}>Anda masuk sebagai {role}</p>
      </div>

      {role === 'CASHIER' && (
        <div className="grid-2">
          <div className="card" style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
            <h2 className="card-title">📜 Transaksi Terakhir</h2>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Belum ada transaksi</p>
              ) : (
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Waktu</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem' }}>Struk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((trx, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem' }}>{new Date(trx.createdAt).toLocaleTimeString('id-ID')}</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Rp {trx.total.toLocaleString('id-ID')}</td>
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => viewReceipt(trx)}>
                            🧾 Lihat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {role === 'ADMIN' && (
        <div className="grid-3">
          <a href="/reports" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{ fontSize: '1.25rem' }}>Lihat Laporan</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pantau pendapatan dan penjualan barang.</p>
          </a>
          <a href="/users" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h2 style={{ fontSize: '1.25rem' }}>Manajemen User</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tambah atau kelola akun karyawan.</p>
          </a>
          <a href="/settings" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h2 style={{ fontSize: '1.25rem' }}>Pengaturan</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Atur profil struk dan kamera toko.</p>
          </a>
        </div>
      )}

      {role === 'WAREHOUSE' && (
        <div className="grid-3">
          <a href="/manager" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h2 style={{ fontSize: '1.25rem' }}>Input Barang</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scan barcode dan tambah stok produk.</p>
          </a>
          <a href="/settings" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h2 style={{ fontSize: '1.25rem' }}>Pengaturan Kamera</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Info pengaturan dan perangkat.</p>
          </a>
        </div>
      )}

      {/* Modal Cetak Ulang Struk (Khusus Kasir) */}
      {receiptData && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div id="receipt-content" style={{ padding: '1rem', background: '#fff', color: '#000', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {storeInfo.logo && (
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <img src={storeInfo.logo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <h2 style={{ textAlign: 'center', marginBottom: '0.25rem', fontSize: '1.2rem' }}>{storeInfo.name}</h2>
              {storeInfo.address && <p style={{ textAlign: 'center', margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{storeInfo.address}</p>}
              {storeInfo.phone && <p style={{ textAlign: 'center', margin: 0, fontSize: '0.8rem' }}>Telp/WA: {storeInfo.phone}</p>}
              
              <div style={{ borderBottom: '1px dashed #ccc', margin: '0.75rem 0' }}></div>
              <p style={{ textAlign: 'center', margin: 0, color: '#666' }}>{receiptData.date.toLocaleString('id-ID')} (Cetak Ulang)</p>
              
              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '0.5rem 0', margin: '0.5rem 0' }}>
                {receiptData.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <div>{item.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span>
                      <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                <span>TOTAL</span>
                <span>Rp {receiptData.total.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span>TUNAI</span>
                <span>Rp {receiptData.payment.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>KEMBALI</span>
                <span>Rp {receiptData.change.toLocaleString('id-ID')}</span>
              </div>
              <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>{storeInfo.greeting}</p>
            </div>
            
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: '1 1 100%' }} onClick={() => setReceiptData(null)}>Tutup</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={printReceipt}>🖨️ Bluetooth</button>
              <button className="btn btn-success" style={{ flex: 1, background: '#3b82f6' }} onClick={() => window.print()}>🖨️ Printer Kabel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
