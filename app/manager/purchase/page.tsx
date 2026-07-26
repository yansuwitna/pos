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
};

export default function PurchasePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]); // Default today
  const [printData, setPrintData] = useState<any | null>(null);
  
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState('camera');
  const [scannerObj, setScannerObj] = useState<Html5Qrcode | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchHistory();
    const savedCam = localStorage.getItem('pos_camera_id');
    if (savedCam) setSelectedCamera(savedCam);
    
    const mode = localStorage.getItem('pos_scanner_mode');
    if (mode) setScannerMode(mode);
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
            { fps: 10, qrbox: { width: 300, height: 100 } },
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

  const updateCartItem = (productId: string, quantity: number, unitCost: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, quantity), unitCost: Math.max(0, unitCost) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(x => x.product.id !== productId));
  };

  const handleEdit = (purchase: any) => {
    setEditPurchaseId(purchase.id);
    setSelectedSupplier(purchase.supplierId || '');
    setPurchaseDate(new Date(purchase.createdAt).toISOString().split('T')[0]);
    setAmountPaid(purchase.amountPaid !== undefined ? purchase.amountPaid.toString() : '');
    setDueDate(purchase.dueDate ? new Date(purchase.dueDate).toISOString().split('T')[0] : '');
    
    // Map items back to cart format
    // Notice that purchase items might only have productId and productName.
    // We should try to find the actual product from the `products` state to have full info.
    const mappedCart = purchase.items.map((item: any) => {
      const p = products.find(x => x.id === item.productId);
      return {
        product: p || { id: item.productId, name: item.productName || 'Produk Dihapus', sku: '', price: 0, cost: item.unitCost, stock: 0 },
        quantity: item.quantity,
        unitCost: item.unitCost
      };
    });
    setCart(mappedCart);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
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
    if (cart.length === 0) return Swal.fire('Peringatan', "Belum ada barang di daftar restock", 'warning');
    if (!purchaseDate) return Swal.fire('Peringatan', "Tanggal pembelian harus diisi", 'warning');

    setLoading(true);
    
    const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const isCredit = amountPaid !== '' && Number(amountPaid) < cartTotal;
    
    if (isCredit && !dueDate) {
      setLoading(false);
      return Swal.fire('Peringatan', "Tanggal jatuh tempo harus diisi jika pembayaran kurang/hutang", 'warning');
    }

    const payload = {
      supplierId: selectedSupplier || null,
      createdAt: new Date(purchaseDate).toISOString(),
      amountPaid: amountPaid === '' ? cartTotal : Number(amountPaid),
      dueDate: isCredit ? dueDate : null,
      items: cart.map(item => ({
        id: item.product.id,
        productId: item.product.id, // For PUT API compatibility
        name: item.product.name,
        productName: item.product.name, // For PUT API compatibility
        quantity: item.quantity,
        unitCost: item.unitCost
      }))
    };

    try {
      let res;
      if (editPurchaseId) {
        res = await fetch(`/api/purchases/${editPurchaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      const data = await res.json();
      setLoading(false);
      
      if (data.success) {
        Swal.fire('Berhasil!', editPurchaseId ? "Perubahan restock berhasil disimpan." : "Restock berhasil dicatat. Stok barang bertambah.", 'success');
        setCart([]);
        setSelectedSupplier('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setAmountPaid('');
        setDueDate('');
        setEditPurchaseId(null);
        setShowForm(false);
        fetchProducts();
        fetchHistory();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (e) {
      setLoading(false);
      Swal.fire('Error', "Terjadi kesalahan sistem.", 'error');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📜 Riwayat Pembelian ({history.length})</h2>
          {!showForm && (
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleEdit(h)}>
                        Edit
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(h.id)}>
                        Hapus
                      </button>
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
          <div className="modal-content large">
            <div className="modal-header">
              <h2 className="modal-title">{editPurchaseId ? '✏️ Edit Pembelian' : '📥 Form Input Pembelian'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setShowForm(false); setEditPurchaseId(null); }}>Tutup</button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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
                  <p style={{ color: '#166534', fontWeight: 600, margin: 0 }}>🔫 Scanner Aktif. Tembakkan barcode.</p>
                )}

                {scannerMode === 'camera' && scanning && (
                  <div id="sku-reader-purchase" style={{ width: '100%', marginTop: '1rem', borderRadius: '12px', overflow: 'hidden' }}></div>
                )}
                
                <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <label>Cari Manual (Nama / SKU)</label>
                  <ProductSearch products={products} onSelect={addToCart} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Daftar Barang yang Dibeli:</h3>
              
              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>Daftar restock kosong.</p>
              ) : (
                <div>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ flex: '1 1 150px' }}>
                        <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stok Saat Ini: {item.product.stock}</div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '2 1 200px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tambahan Qty</label>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(item.product.id, parseInt(e.target.value)||1, item.unitCost)} style={{ padding: '0.4rem' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Harga Beli (Rp)</label>
                          <input type="number" min="0" value={item.unitCost} onChange={e => updateCartItem(item.product.id, item.quantity, parseInt(e.target.value)||0)} style={{ padding: '0.4rem' }} />
                        </div>
                      </div>

                      <div style={{ flex: '0 0 auto' }}>
                        <button className="btn btn-outline" onClick={() => removeFromCart(item.product.id)} style={{ padding: '0.5rem', color: '#ef4444', borderColor: '#ef4444' }}>❌</button>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '2px solid var(--border)', marginTop: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>
                    <span>Total Keseluruhan:</span>
                    <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Nominal Pembayaran Ke Supplier (Biarkan kosong jika lunas / Rp {cartTotal.toLocaleString('id-ID')})</label>
                      <input type="number" placeholder={cartTotal.toString()} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
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
                  <p style={{ marginBottom: '4rem' }}>Penerima / Supplier,</p>
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
    </div>
  );
}
