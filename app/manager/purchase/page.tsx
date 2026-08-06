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

type PurchaseItem = {
  product: Product;
  quantity: number;
  unitCost: number;
  subtotal?: number;
};

export default function PurchasePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]); // Default today
  const [notes, setNotes] = useState('');
  const [printData, setPrintData] = useState<any | null>(null);
  
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState('');
  const [scannerObj, setScannerObj] = useState<Html5Qrcode | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
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
    const res = await fetch('/api/purchases');
    const data = await res.json();
    if (data.success) setHistory(data.purchases || []);
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
          const scanner = new Html5Qrcode("sku-reader-purchase", {
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

  const addToCart = async (product: Product) => {
    const existing = cart.find(x => x.product.id === product.id);
    if (existing) {
      updateCartItem(product.id, existing.quantity + 1, existing.unitCost);
    } else {
      setCart([...cart, { product, quantity: 1, unitCost: product.cost }]);
    }
  };

  const updateCartItem = (productId: string, quantity: number | string, unitCost: number | string) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { 
          ...item, 
          quantity: quantity as any, 
          unitCost: unitCost as any 
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(x => x.product.id !== productId));
  };

  const handleEdit = (purchase: any) => {
    if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer hanya memiliki akses lihat data.', 'warning');
    setEditPurchaseId(purchase.id);
    setSelectedSupplier(purchase.supplierId || '');
    setPurchaseDate(new Date(purchase.createdAt).toISOString().split('T')[0]);
    setNotes(purchase.notes || '');
    setAmountPaid(purchase.amountPaid ? String(purchase.amountPaid) : '');
    setDueDate(purchase.dueDate ? new Date(purchase.dueDate).toISOString().split('T')[0] : '');

    const rebuiltCart: PurchaseItem[] = purchase.items.map((item: any) => ({
      product: {
        id: item.productId,
        sku: item.product?.sku || null,
        name: item.productName || item.product?.name || 'Produk Dihapus',
        price: item.product?.price || 0,
        cost: item.unitCost,
        stock: item.product?.stock || 0
      },
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.subtotal
    }));
    setCart(rebuiltCart);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer hanya memiliki akses lihat data.', 'warning');
    const result = await Swal.fire({
      title: 'Hapus Pembelian?',
      text: 'Stok barang akan otomatis dikurangi. Lanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      Swal.fire('Terhapus!', data.message, 'success');
      fetchHistory();
      fetchProducts();
    } else {
      Swal.fire('Gagal', data.message, 'error');
    }
  };

  const submitPurchase = async () => {
    if (userRole === 'ADMIN') return Swal.fire('Akses Ditolak', 'Manajer hanya memiliki akses lihat data.', 'warning');
    if (cart.length === 0) return Swal.fire('Peringatan', "Belum ada barang di daftar restock", 'warning');
    if (!purchaseDate) return Swal.fire('Peringatan', "Tanggal pembelian harus diisi", 'warning');

    setLoading(true);
    
    const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const isCredit = amountPaid !== '' && Number(amountPaid) < cartTotal;
    
    const payload = {
      supplierId: selectedSupplier || null,
      notes: notes,
      createdAt: new Date(purchaseDate).toISOString(),
      amountPaid: amountPaid ? Number(amountPaid) : 0,
      dueDate: isCredit && dueDate ? new Date(dueDate).toISOString() : null,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        subtotal: Number(item.subtotal || (item.quantity * item.unitCost))
      }))
    };

    try {
      const url = editPurchaseId ? `/api/purchases/${editPurchaseId}` : '/api/purchases';
      const method = editPurchaseId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        Swal.fire('Berhasil!', editPurchaseId ? "Data pembelian berhasil diperbarui." : "Transaksi pembelian berhasil disimpan.", 'success');
        setCart([]);
        setNotes('');
        setSelectedSupplier('');
        setAmountPaid('');
        setDueDate('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setShowForm(false);
        setEditPurchaseId(null);
        fetchHistory();
        fetchProducts();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (e) {
      setLoading(false);
      Swal.fire('Error', "Terjadi kesalahan sistem", 'error');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📜 Riwayat Pembelian ({history.length})</h2>
          {!showForm && userRole !== 'ADMIN' && (
            <button className="btn btn-success" onClick={() => {
              setCart([]);
              setSelectedSupplier('');
              setPurchaseDate(new Date().toISOString().split('T')[0]);
              setAmountPaid('');
              setDueDate('');
              setEditPurchaseId(null);
              setShowForm(true);
            }}>➕ Tambah Pembelian</button>
          )}
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th>Total Biaya</th>
                <th>Status</th>
                <th>Aksi / Item</th>
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
                  <td style={{ fontWeight: 600 }}>{h.supplier?.name || '-'}</td>
                  <td>Rp {h.totalCost?.toLocaleString('id-ID')}</td>
                  <td>
                    {h.paymentStatus === 'PAID' ? <span style={{color: 'green', fontWeight: 'bold'}}>LUNAS</span> : 
                     h.paymentStatus === 'PARTIAL' ? <span style={{color: 'orange', fontWeight: 'bold'}}>HUTANG SEBAGIAN</span> : 
                     <span style={{color: 'red', fontWeight: 'bold'}}>BELUM BAYAR</span>}
                  </td>
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
          {!tableLoading && history.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data pembelian.</p>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editPurchaseId ? '✏️ Edit Pembelian' : '📥 Form Input Pembelian'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setShowForm(false); setEditPurchaseId(null); }}>Tutup</button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tanggal Pembelian</label>
                  <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Penyedia Barang (Opsional)</label>
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
                    {scanning ? '❌ Tutup Kamera' : '📷 Buka Kamera Scanner'}
                  </button>
                ) : (
                  <p style={{ color: '#166534', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>🔫 Scanner Aktif. Tembakkan barcode.</p>
                )}

                {scannerMode === 'camera' && scanning && (
                  <div id="sku-reader-purchase" style={{ width: '100%', marginTop: '1rem', borderRadius: '12px', overflow: 'hidden' }}></div>
                )}
                
                <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <label>Cari Manual (Nama / SKU)</label>
                  <ProductSearch products={products} onSelect={addToCart} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Daftar Barang yang Dibeli:</h3>
              
              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>Daftar restock kosong.</p>
              ) : (
                <div>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg)', padding: '0.85rem', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.product.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stok Saat Ini: {item.product.stock}</div>
                        </div>
                        <button className="btn btn-outline" onClick={() => removeFromCart(item.product.id)} style={{ padding: '0.35rem 0.6rem', color: '#ef4444', borderColor: '#ef4444', fontSize: '0.85rem' }} title="Hapus">❌</button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Tambahan Qty</label>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(item.product.id, e.target.value === '' ? '' : (parseInt(e.target.value) || 1), item.unitCost)} onFocus={e => e.target.select()} style={{ padding: '0.35rem 0.5rem', width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Harga Beli (Rp)</label>
                          <input type="number" min="0" value={item.unitCost} onChange={e => updateCartItem(item.product.id, item.quantity, e.target.value === '' ? '' : (parseInt(e.target.value) || 0))} onFocus={e => e.target.select()} style={{ padding: '0.35rem 0.5rem', width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem 0', borderTop: '2px solid var(--border)', marginTop: '1rem', fontSize: '1.15rem', fontWeight: 700 }}>
                    <span>Total Keseluruhan:</span>
                    <span style={{ color: '#16a34a' }}>Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Nominal Pembayaran Ke Supplier (Biarkan kosong jika lunas / Rp {cartTotal.toLocaleString('id-ID')})</label>
                      <input type="number" placeholder={cartTotal.toString()} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} onFocus={e => e.target.select()} />
                    </div>
                    {amountPaid !== '' && Number(amountPaid) < cartTotal && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ color: '#b91c1c', fontWeight: 600 }}>⚠️ Status: Hutang (Jatuh Tempo)</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <button className="btn w-full mt-4" style={{ background: '#16a34a' }} onClick={submitPurchase} disabled={loading}>
                    {loading ? 'Menyimpan...' : '✅ Simpan & Tambah Stok'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {printData && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div id="print-area" className="print-area" style={{ padding: '2rem', background: '#fff', color: '#000' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>BUKTI PEMBELIAN / RESTOCK</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#555' }}>Tanggal: {new Date(printData.createdAt).toLocaleDateString('id-ID')}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '150px', padding: '0.2rem 0', fontWeight: 'bold', border: 'none' }}>ID Pembelian</td>
                      <td style={{ padding: '0.2rem 0', border: 'none' }}>: {printData.id.slice(-8).toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.2rem 0', fontWeight: 'bold', border: 'none' }}>Supplier</td>
                      <td style={{ padding: '0.2rem 0', border: 'none' }}>: {printData.supplier?.name || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.2rem 0', fontWeight: 'bold', border: 'none' }}>Admin/Gudang</td>
                      <td style={{ padding: '0.2rem 0', border: 'none' }}>: {printData.user?.name || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'left' }}>Nama Barang</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>Harga Beli</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{item.productName || item.product?.name || 'Produk Dihapus'}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>Rp {item.unitCost?.toLocaleString('id-ID')}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>Total Keseluruhan</td>
                    <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>Rp {printData.totalCost?.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', textAlign: 'center' }}>
                <div>
                  <p style={{ marginBottom: '4rem' }}>Hormat Kami,</p>
                  <p style={{ textDecoration: 'underline' }}>{printData.user?.name || 'Admin Gudang'}</p>
                </div>
                <div>
                  <p style={{ marginBottom: '4rem' }}>Pihak Supplier / Pengirim,</p>
                  <p>_______________________</p>
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

      {/* Modal Detail Pembelian / Restock */}
      {selectedDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">📦 Detail Restock / Pembelian</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setSelectedDetail(null)}>Tutup</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div><strong>ID Pembelian:</strong> {selectedDetail.id.slice(-8).toUpperCase()}</div>
                <div><strong>Tanggal:</strong> {new Date(selectedDetail.createdAt).toLocaleDateString('id-ID')}</div>
                <div><strong>Supplier:</strong> {selectedDetail.supplier?.name || '-'}</div>
                <div><strong>Admin/Gudang:</strong> {selectedDetail.user?.name || '-'}</div>
                <div><strong>Status Pembayaran:</strong> {selectedDetail.paymentStatus === 'PAID' ? 'LUNAS' : selectedDetail.paymentStatus === 'PARTIAL' ? 'HUTANG SEBAGIAN' : 'BELUM BAYAR'}</div>
              </div>

              <h3 style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>Daftar Barang Dibeli:</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Barang</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Harga Beli</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetail.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.productName || item.product?.name || 'Produk Dihapus'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>Rp {item.unitCost?.toLocaleString('id-ID')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.85rem 1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem' }}>
                <span>Total Keseluruhan Biaya:</span>
                <span style={{ color: '#16a34a' }}>Rp {selectedDetail.totalCost?.toLocaleString('id-ID')}</span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedDetail(null)}>Tutup</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setPrintData(selectedDetail); setSelectedDetail(null); }}>
                  🖨️ Cetak Bukti Pembelian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
