'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Swal from 'sweetalert2';
import ProductSearch from '@/app/components/ProductSearch';

type Product = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  cost: number;
  stock: number;
};

type ReturnItem = {
  product: Product;
  quantity: number;
  reason: string;
};

export default function ReturnPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<ReturnItem[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState('');
  const [scannerObj, setScannerObj] = useState<Html5Qrcode | null>(null);
  
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editReturnId, setEditReturnId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchHistory();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(u => {
        if (u.success) setUserRole(u.role || u.user?.role);
      })
      .catch(() => {});

    const savedCam = localStorage.getItem('pos_camera_id');
    if (savedCam) setSelectedCamera(savedCam);
    
    const mode = localStorage.getItem('pos_scanner_mode') || 'camera';
    setScannerMode(mode);
  }, []);

  const fetchSuppliers = async () => {
    const res = await fetch('/api/suppliers');
    const data = await res.json();
    if (data.success) setSuppliers(data.suppliers);
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      setProducts(data.products.filter((p: any) => p.type === 'GOODS'));
    }
  };

  const fetchHistory = async () => {
    setTableLoading(true);
    const res = await fetch('/api/returns');
    const data = await res.json();
    if (data.success) setHistory(data.returns);
    setTableLoading(false);
  };

  const toggleScanner = async () => {
    if (scanning) {
      if (scannerObj) {
        try {
          await scannerObj.stop();
          scannerObj.clear();
        } catch (e) {}
      }
      setScanning(false);
      setScannerObj(null);
    } else {
      setScanning(true);
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("sku-reader-return", {
            verbose: false,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.CODE_128,
            ]
          });
          setScannerObj(scanner);
          
          await scanner.start(
            selectedCamera ? { deviceId: { exact: selectedCamera } } : { facingMode: 'environment' },
            { fps: 10, qrbox: (vw, vh) => ({ width: Math.min(vw * 0.8, 300), height: 100 }) },
            (decodedText) => {
              handleScan(decodedText);
              // Hentikan otomatis setelah berhasil scan
              scanner.stop().then(() => {
                scanner.clear();
                setScanning(false);
                setScannerObj(null);
              }).catch(() => {});
            },
            () => {} // Abaikan error per frame
          );
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Gagal mengakses kamera.', 'error');
          setScanning(false);
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (scannerMode !== 'physical') return;
    let barcodeBuffer = '';
    let timeoutId: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) handleScan(barcodeBuffer);
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { barcodeBuffer = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scannerMode, products]);

  const handleScan = (query: string) => {
    const p = products.find(x => x.sku === query || x.name.toLowerCase() === query.toLowerCase());
    if (p) {
      addToCart(p);
    } else {
      Swal.fire('Pencarian', `Produk "${query}" tidak ditemukan.`, 'info');
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(x => x.product.id === product.id);
    if (existing) {
      updateCartItem(product.id, existing.quantity + 1, existing.reason);
    } else {
      setCart([...cart, { product, quantity: 1, reason: 'Barang Rusak' }]);
    }
  };

  const updateCartItem = (productId: string, quantity: number | string, reason: string) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: quantity as any, reason };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(x => x.product.id !== productId));
  };

  const handleEdit = (ret: any) => {
    if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer hanya memiliki akses lihat data.', 'warning');
    setEditReturnId(ret.id);
    setSelectedSupplier(ret.supplierId || '');
    setReturnDate(new Date(ret.createdAt).toISOString().split('T')[0]);
    setNotes(ret.notes || '');
    
    const mappedCart = ret.items.map((item: any) => {
      const p = products.find(x => x.id === item.productId);
      return {
        product: p || { id: item.productId, name: item.productName || 'Produk Dihapus', sku: '', price: 0, cost: 0, stock: 0 },
        quantity: item.quantity,
        reason: item.reason
      };
    });
    
    setCart(mappedCart);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer hanya memiliki akses lihat data.', 'warning');
    const result = await Swal.fire({
      title: 'Hapus Retur?',
      text: 'Stok barang akan otomatis dikembalikan (bertambah). Lanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`/api/returns/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      Swal.fire('Terhapus!', data.message, 'success');
      fetchHistory();
      fetchProducts();
    } else {
      Swal.fire('Gagal', data.message, 'error');
    }
  };

  const submitReturn = async () => {
    if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer hanya memiliki akses lihat data.', 'warning');
    if (cart.length === 0) return Swal.fire('Peringatan', "Belum ada barang di daftar retur.", 'warning');
    if (!returnDate) return Swal.fire('Peringatan', "Tanggal retur harus diisi.", 'warning');

    setLoading(true);
    const payload = {
      supplierId: selectedSupplier || null,
      notes: notes,
      createdAt: new Date(returnDate).toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: Number(item.quantity),
        reason: item.reason
      }))
    };

    try {
      const url = editReturnId ? `/api/returns/${editReturnId}` : '/api/returns';
      const method = editReturnId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        Swal.fire('Berhasil!', editReturnId ? "Data retur berhasil diperbarui." : "Transaksi retur berhasil disimpan.", 'success');
        setCart([]);
        setNotes('');
        setSelectedSupplier('');
        setReturnDate(new Date().toISOString().split('T')[0]);
        setShowForm(false);
        setEditReturnId(null);
        fetchHistory();
        fetchProducts();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (e) {
      setLoading(false);
      Swal.fire('Error', "Terjadi kesalahan sistem.", 'error');
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📜 Riwayat Retur Barang</h2>
          {!showForm && userRole !== 'ADMIN' && (
            <button className="btn btn-success" onClick={() => {
              setCart([]);
              setSelectedSupplier('');
              setNotes('');
              setReturnDate(new Date().toISOString().split('T')[0]);
              setEditReturnId(null);
              setShowForm(true);
            }}>➕ Tambah Retur</button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Petugas</th>
                <th>Tujuan (Supplier)</th>
                <th>Jml Barang</th>
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
              ) : history.map((h: any) => (
                <tr key={h.id}>
                  <td>{new Date(h.createdAt).toLocaleString('id-ID')}</td>
                  <td>{h.user?.name}</td>
                  <td style={{ fontWeight: 600 }}>{h.supplier?.name || '-'}</td>
                  <td>{h.items.length} Macam</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderColor: '#0284c7', color: '#0284c7' }} onClick={() => setSelectedDetail(h)}>
                        👁️ Detail
                      </button>
                      {userRole !== 'ADMIN' && (
                        <>
                          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleEdit(h)}>
                            Edit
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(h.id)}>
                            Hapus
                          </button>
                        </>
                      )}
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setPrintData(h)}>
                        🖨️ Cetak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tableLoading && history.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data retur.</p>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editReturnId ? '✏️ Edit Retur' : '🔙 Form Input Retur'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setShowForm(false); setEditReturnId(null); }}>Tutup</button>
            </div>
            
            <div className="modal-body">
              <p style={{ color: '#991b1b', background: '#fef2f2', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                ⚠️ Perhatian: Mencatat/mengedit retur di sini akan <strong>MENYESUAIKAN STOK</strong> barang secara otomatis.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tanggal Retur</label>
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Penyedia Barang (Tujuan Retur)</label>
                  <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {scannerMode === 'camera' ? (
                  <button className="btn btn-outline w-full" onClick={toggleScanner} style={{ padding: '0.75rem', fontSize: '1rem' }}>
                    {scanning ? '❌ Tutup Kamera' : '📷 Buka Kamera Scan Barcode'}
                  </button>
                ) : (
                  <div style={{ color: '#166534', background: '#f0fdf4', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
                    🔫 Scanner Alat Aktif! Tembakkan barcode.
                  </div>
                )}

                {scannerMode === 'camera' && scanning && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div id="sku-reader-return" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                  </div>
                )}
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Cari Manual (Ketik Nama / SKU)</label>
                  <ProductSearch products={products} onSelect={addToCart} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Daftar Barang yang Diretur:</h3>
              
              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>Daftar retur kosong.</p>
              ) : (
                <div>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg)', padding: '0.85rem', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.product.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stok sistem saat ini: {item.product.stock}</div>
                        </div>
                        <button className="btn btn-outline" onClick={() => removeFromCart(item.product.id)} style={{ padding: '0.35rem 0.6rem', color: '#ef4444', borderColor: '#ef4444', fontSize: '0.85rem' }} title="Hapus">❌</button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Jml (Qty)</label>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(item.product.id, e.target.value === '' ? '' : (parseInt(e.target.value) || 1), item.reason)} onFocus={e => e.target.select()} style={{ padding: '0.35rem 0.5rem', width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Keterangan / Alasan</label>
                          <input type="text" value={item.reason} onChange={e => updateCartItem(item.product.id, item.quantity, e.target.value)} style={{ padding: '0.35rem 0.5rem', width: '100%' }} placeholder="Rusak, Terbuka, dll" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="form-group mt-4">
                    <label>Catatan Tambahan (Opsional)</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tulis catatan retur..." />
                  </div>

                  <button className="btn w-full mt-4" style={{ background: '#b91c1c' }} onClick={submitReturn} disabled={loading}>
                    {loading ? 'Menyimpan...' : '✅ Simpan Retur'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {printData && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="print-area" style={{ padding: '2rem', fontFamily: 'monospace', background: 'white', color: 'black' }}>
              <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>SURAT JALAN RETUR BARANG</h1>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed black', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <p>Tanggal: {new Date(printData.createdAt).toLocaleString('id-ID')}</p>
                <p>ID Retur: {printData.id.slice(-8).toUpperCase()}</p>
              </div>
              
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p><strong>Kepada Yth:</strong></p>
                  <p>{printData.supplier?.name || '______________________'}</p>
                </div>
                <div>
                  <p><strong>Dari (Petugas):</strong></p>
                  <p>{printData.user?.name || '-'}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'left' }}>No</th>
                    <th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'left' }}>Nama Barang</th>
                    <th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'left' }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid black', padding: '0.5rem' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid black', padding: '0.5rem' }}>{item.productName || item.product?.name}</td>
                      <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid black', padding: '0.5rem' }}>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {printData.notes && (
                <div style={{ marginBottom: '2rem' }}>
                  <p><strong>Catatan Tambahan:</strong></p>
                  <p style={{ padding: '0.5rem', border: '1px solid black' }}>{printData.notes}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '3rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p>Diserahkan Oleh,</p>
                  <br/><br/><br/>
                  <p>(.........................)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p>Diterima Oleh,</p>
                  <br/><br/><br/>
                  <p>(.........................)</p>
                </div>
              </div>
            </div>
            
            <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setPrintData(null)}>Tutup</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Cetak</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Retur */}
      {selectedDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">📤 Detail Retur Barang</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setSelectedDetail(null)}>Tutup</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div><strong>ID Retur:</strong> RET-{selectedDetail.id.slice(-8).toUpperCase()}</div>
                <div><strong>Tanggal:</strong> {new Date(selectedDetail.createdAt).toLocaleDateString('id-ID')}</div>
                <div><strong>Supplier (Tujuan):</strong> {selectedDetail.supplier?.name || '-'}</div>
                <div><strong>Petugas:</strong> {selectedDetail.user?.name || '-'}</div>
              </div>

              <h3 style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>Daftar Barang Diretur:</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Barang</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>Alasan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetail.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.productName || item.product?.name || 'Produk Dihapus'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                        <td>{item.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedDetail.notes && (
                <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '0.75rem', borderRadius: '8px' }}>
                  <strong>Catatan Tambahan:</strong> {selectedDetail.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedDetail(null)}>Tutup</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setPrintData(selectedDetail); setSelectedDetail(null); }}>
                  🖨️ Cetak Surat Jalan Retur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
