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
  const [scannerMode, setScannerMode] = useState('camera');
  
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

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
    const res = await fetch('/api/returns');
    const data = await res.json();
    if (data.success) setHistory(data.returns);
  };

  const startScanner = () => {
    setScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("sku-reader-return", { 
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
      updateCartItem(product.id, existing.quantity + 1, existing.reason);
    } else {
      setCart([...cart, { product, quantity: 1, reason: 'Barang Rusak' }]);
    }
  };

  const updateCartItem = (productId: string, quantity: number, reason: string) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, quantity), reason };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(x => x.product.id !== productId));
  };

  const submitReturn = async () => {
    if (cart.length === 0) return Swal.fire('Peringatan', "Belum ada barang.", 'warning');
    
    const confirm = await Swal.fire({
      title: 'Yakin Data Retur Benar?',
      text: "Stok barang di sistem akan otomatis berkurang!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Proses Retur!',
      cancelButtonText: 'Batal'
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    const payload = {
      supplierId: selectedSupplier || null,
      notes: notes,
      createdAt: new Date(returnDate).toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        reason: item.reason
      }))
    };

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);
      
      if (data.success) {
        Swal.fire('Berhasil!', "Retur berhasil dicatat. Stok berkurang.", 'success');
        setCart([]);
        setNotes('');
        setSelectedSupplier('');
        setReturnDate(new Date().toISOString().split('T')[0]);
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

  const handlePrint = (ret: any) => {
    setPrintData(ret);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  // Render Print Area
  if (printData) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto', background: 'white', color: 'black' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>SURAT JALAN RETUR BARANG</h1>
        <div style={{ textAlign: 'center', borderBottom: '2px dashed black', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <p>Tanggal: {new Date(printData.createdAt).toLocaleString('id-ID')}</p>
          <p>ID Retur: {printData.id}</p>
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
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{item.product.name} <br/> <small>{item.product.sku}</small></td>
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
    );
  }

  return (
    <div>
      <div className="card" style={{ display: showForm ? 'none' : 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📜 Riwayat Retur Barang</h2>
          <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Tambah Retur</button>
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
              {history.map((h: any) => (
                <tr key={h.id}>
                  <td>{new Date(h.createdAt).toLocaleString('id-ID')}</td>
                  <td>{h.user?.name}</td>
                  <td style={{ fontWeight: 600 }}>{h.supplier?.name || '-'}</td>
                  <td>{h.items.length} Macam</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handlePrint(h)}>
                      🖨️ Cetak Bukti
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data retur.</p>}
        </div>
      </div>

      {showForm && (
        <div className="grid-2">
          <div className="card" style={{ position: 'relative', zIndex: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>🔙 Form Input Retur</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setShowForm(false)}>Tutup</button>
            </div>
            
            <p style={{ color: '#991b1b', background: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
              ⚠️ Perhatian: Mencatat retur di sini akan <strong>MENGURANGI STOK</strong> barang di sistem.
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
                <div id="sku-reader-return" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
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
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Cari Manual (Ketik Nama / SKU)</label>
              <ProductSearch products={products} onSelect={addToCart} />
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Daftar Barang yang Diretur:</h3>
            
            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Daftar retur kosong.</p>
            ) : (
              <div>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stok sistem: {item.product.stock}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '2 1 300px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jml (Qty)</label>
                        <input type="number" min="1" max={item.product.stock} value={item.quantity} onChange={e => updateCartItem(item.product.id, parseInt(e.target.value)||1, item.reason)} style={{ padding: '0.4rem' }} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keterangan / Alasan</label>
                        <input type="text" value={item.reason} onChange={e => updateCartItem(item.product.id, item.quantity, e.target.value)} style={{ padding: '0.4rem' }} placeholder="Rusak, Kemasan Terbuka, dll" />
                      </div>
                    </div>

                    <div style={{ flex: '0 0 auto' }}>
                      <button className="btn btn-outline" onClick={() => removeFromCart(item.product.id)} style={{ padding: '0.5rem', color: '#ef4444', borderColor: '#ef4444' }}>❌</button>
                    </div>
                  </div>
                ))}
                
                <div className="form-group mt-4">
                  <label>Catatan Tambahan (Opsional)</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tulis catatan retur..." />
                </div>

                <button className="btn w-full mt-4" style={{ background: '#b91c1c' }} onClick={submitReturn} disabled={loading}>
                  {loading ? 'Menyimpan...' : '✅ Simpan Retur & Kurangi Stok'}
                </button>
              </div>
            )}
          </div>
          
          <div className="card">
            <h2 className="card-title">📦 Info Stok Saat Ini</h2>
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
    </div>
  );
}
