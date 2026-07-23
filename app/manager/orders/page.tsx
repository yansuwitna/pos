'use client';
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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

type OrderItem = {
  product: Product;
  quantity: number;
};

export default function OrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  const [scanning, setScanning] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState('camera');
  
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);

  // Modal Barang Baru
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

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
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (data.success) setHistory(data.orders);
  };

  const startScanner = () => {
    setScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("sku-reader-order", { 
        fps: 15,
        qrbox: { width: 400, height: 120 },
        formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.CODE_128],
        videoConstraints: selectedCamera 
          ? { deviceId: { exact: selectedCamera }, facingMode: 'environment' } 
          : { facingMode: 'environment' }
      }, false);
      scanner.render(
        (decodedText) => {
          handleScan(decodedText);
          scanner.clear();
          setScanning(false);
        },
        () => {}
      );
    }, 100);
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
      updateCartItem(product.id, existing.quantity + 1);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartItem = (productId: string, quantity: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(x => x.product.id !== productId));
  };

  const handleQuickAddProduct = async () => {
    if (!newItemName.trim()) return Swal.fire('Peringatan', "Nama barang tidak boleh kosong.", 'warning');
    setIsAddingNew(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          sku: null,
          type: 'GOODS',
          stock: 0,
          price: 0,
          cost: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        addToCart(data.product);
        setProducts([...products, data.product]); // Update local list
        setShowNewItemModal(false);
        setNewItemName('');
      } else {
        Swal.fire('Gagal', "Gagal membuat barang baru: " + data.message, 'error');
      }
    } catch (e) {
      Swal.fire('Error', "Terjadi kesalahan jaringan.", 'error');
    }
    setIsAddingNew(false);
  };

  const submitOrder = async () => {
    if (cart.length === 0) return Swal.fire('Peringatan', "Belum ada barang untuk dipesan.", 'warning');
    if (!selectedSupplier) return Swal.fire('Peringatan', "Supplier harus dipilih untuk surat pemesanan.", 'warning');

    setLoading(true);
    const payload = {
      supplierId: selectedSupplier,
      notes: notes,
      createdAt: new Date(orderDate).toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity
      }))
    };

    try {
      const url = editOrder ? `/api/orders/${editOrder.id}` : '/api/orders';
      const method = editOrder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);
      
      if (data.success) {
        Swal.fire('Berhasil!', editOrder ? "Pemesanan (PO) berhasil diperbarui." : "Pemesanan (PO) berhasil dicatat.", 'success');
        setCart([]);
        setNotes('');
        setSelectedSupplier('');
        setOrderDate(new Date().toISOString().split('T')[0]);
        setShowForm(false);
        setEditOrder(null);
        fetchHistory();
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (e) {
      setLoading(false);
      Swal.fire('Error', "Terjadi kesalahan sistem.", 'error');
    }
  };

  const handlePrint = (ord: any) => {
    setPrintData(ord);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  // Render Print Area
  if (printData) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto', background: 'white', color: 'black' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>SURAT PEMESANAN BARANG (PURCHASE ORDER)</h1>
        <div style={{ textAlign: 'center', borderBottom: '2px dashed black', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <p>Tanggal PO: {new Date(printData.createdAt).toLocaleDateString('id-ID')}</p>
          <p>Nomor PO: PO-{printData.id.substring(0,8).toUpperCase()}</p>
        </div>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p><strong>Kepada Yth:</strong></p>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{printData.supplier?.name || '______________________'}</p>
            {printData.supplier?.contact && <p>Telp: {printData.supplier.contact}</p>}
            {printData.supplier?.address && <p>{printData.supplier.address}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Pemesan:</strong></p>
            <p>{printData.user?.name || '-'}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'left' }}>No</th>
              <th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'left' }}>Nama Barang</th>
              <th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>Jumlah Pesanan</th>
            </tr>
          </thead>
          <tbody>
            {printData.items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{idx + 1}</td>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{item.productName || item.product?.name} <br/> <small>{item.product?.sku}</small></td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
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
            <p>Hormat Kami (Pemesan),</p>
            <br/><br/><br/>
            <p>( {printData.user?.name || '_________________'} )</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ display: showForm ? 'none' : 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📜 Riwayat Pesanan (PO)</h2>
          <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Buat Pesanan Baru</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>No PO</th>
                <th>Tanggal</th>
                <th>Supplier (Tujuan)</th>
                <th>Jml Barang</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id}>
                  <td>PO-{h.id.substring(0,8).toUpperCase()}</td>
                  <td>{new Date(h.createdAt).toLocaleDateString('id-ID')}</td>
                  <td style={{ fontWeight: 600 }}>{h.supplier?.name || '-'}</td>
                  <td>{h.items.length} Macam</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => {
                        setEditOrder(h);
                        setSelectedSupplier(h.supplierId || '');
                        setNotes(h.notes || '');
                        setOrderDate(new Date(h.createdAt).toISOString().split('T')[0]);
                        // Reconstruct cart
                        const rebuiltCart = h.items.map((item: any) => {
                          const p = products.find(x => x.id === item.productId);
                          return {
                            product: p || { id: item.productId, name: item.productName, sku: '', stock: 0 },
                            quantity: item.quantity
                          };
                        });
                        setCart(rebuiltCart);
                        setShowForm(true);
                      }}>
                        ✏️ Edit PO
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handlePrint(h)}>
                        🖨️ Cetak PO
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data pesanan (Purchase Order).</p>}
        </div>
      </div>

      {showForm && (
        <div className="grid-2">
          <div className="card" style={{ position: 'relative', zIndex: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>
                {editOrder ? '✏️ Edit Pesanan (PO)' : '🔙 Form Pemesanan Baru'}
              </h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setShowForm(false); setEditOrder(null); }}>Batal</button>
            </div>
            
            <p style={{ color: '#0369a1', background: '#e0f2fe', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #bae6fd' }}>
              ℹ️ Pesanan yang dibuat di sini <strong>TIDAK AKAN</strong> mengubah jumlah stok di sistem. Hanya untuk mencetak dokumen Surat Pesanan (PO) ke Supplier.
            </p>
            
            {scannerMode === 'camera' ? (
              !scanning && (
                <button className="btn btn-outline w-full" onClick={startScanner} style={{ padding: '1rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                  📷 Buka Kamera Scan Barcode
                </button>
              )
            ) : (
              <div style={{ color: '#166534', background: '#f0fdf4', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
                🔫 Scanner Alat Aktif! Tembakkan barcode.
              </div>
            )}

            {scannerMode === 'camera' && scanning && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div id="sku-reader-order" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tanggal PO</label>
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Pilih Supplier (Wajib)</label>
                <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} required>
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Cari Manual (Ketik Nama / SKU)</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <ProductSearch products={products} onSelect={addToCart} />
                </div>
                <button className="btn" style={{ background: '#10b981', color: 'white', flex: '0 0 auto' }} onClick={() => setShowNewItemModal(true)}>
                  ➕ Pesan Barang Baru (Belum ada di data)
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Daftar Barang yang Dipesan:</h3>
            
            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Daftar pesanan masih kosong.</p>
            ) : (
              <div>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SKU: {item.product.sku || '-'}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '2 1 100px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jumlah (Qty)</label>
                        <input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(item.product.id, parseInt(e.target.value)||1)} style={{ padding: '0.4rem' }} />
                      </div>
                    </div>

                    <div style={{ flex: '0 0 auto' }}>
                      <button className="btn btn-outline" onClick={() => removeFromCart(item.product.id)} style={{ padding: '0.5rem', color: '#ef4444', borderColor: '#ef4444' }}>❌</button>
                    </div>
                  </div>
                ))}
                
                <div className="form-group mt-4">
                  <label>Catatan Tambahan (Opsional)</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tulis catatan di surat pesanan..." />
                </div>

                <button className="btn w-full mt-4" style={{ background: '#0284c7' }} onClick={submitOrder} disabled={loading}>
                  {loading ? 'Menyimpan...' : (editOrder ? '💾 Simpan Perubahan PO' : '✅ Simpan & Cetak Pesanan (PO)')}
                </button>
              </div>
            )}
          </div>
          
          <div className="card">
            <h2 className="card-title">📦 Info Stok Saat Ini</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Sebagai referensi, berikut daftar stok saat ini:</p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontWeight: 600, color: p.stock < 5 ? '#ef4444' : 'inherit' }}>{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Add Product */}
      {showNewItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem' }}>📦 Pesan Barang Baru</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Gunakan fitur ini jika Anda ingin memesan barang yang belum pernah Anda daftarkan di sistem (tidak ada barcode-nya).
            </p>
            <div className="form-group">
              <label>Nama Barang (yang akan dipesan)</label>
              <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Misal: Indomie Goreng Spesial" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowNewItemModal(false)}>Batal</button>
              <button className="btn" style={{ flex: 1, background: '#0284c7', color: 'white' }} onClick={handleQuickAddProduct} disabled={isAddingNew}>
                {isAddingNew ? 'Menambahkan...' : 'Tambahkan ke Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
