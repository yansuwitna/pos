'use client';
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Swal from 'sweetalert2';

type Product = {
  id?: string;
  sku: string;
  name: string;
  type: 'GOODS' | 'SERVICE';
  price: number;
  cost: number;
  stock: number;
  discountPercent?: number;
  category?: { name: string };
  _count?: {
    transactionItems: number;
    purchaseItems: number;
    returnItems: number;
    orderItems: number;
  };
};

export default function ManagerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>({ sku: '', name: '', type: 'GOODS', price: 0, cost: 0, stock: 0, discountPercent: 0 });
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [scannerObj, setScannerObj] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchProducts();
    // Baca kamera yang sudah dikonfigurasi Admin di halaman Pengaturan
    const savedCam = localStorage.getItem('pos_camera_id');
    if (savedCam) setSelectedCamera(savedCam);
    
    const mode = localStorage.getItem('pos_scanner_mode') || 'camera';
    setScannerMode(mode);
  }, []);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const fetchProducts = () => {
    setTableLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.products);
        setTableLoading(false);
      });
  };

  const startScanner = () => {
    if (scanning) {
      if (scannerObj) {
        scannerObj.stop().then(() => {
          scannerObj.clear();
          setScanning(false);
          setScannerObj(null);
        }).catch(() => {});
      } else {
        setScanning(false);
      }
    } else {
      setScanning(true);
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("sku-reader", {
            verbose: false,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.CODE_128,
            ]
          });
          setScannerObj(scanner);
          
          await scanner.start(
            selectedCamera ? { deviceId: { exact: selectedCamera } } : { facingMode: 'environment' },
            { fps: 15, qrbox: (vw, vh) => ({ width: Math.min(vw * 0.8, 300), height: 100 }) },
            (decodedText) => {
              if (editProduct) setEditProduct(prev => prev ? { ...prev, sku: decodedText } : prev);
              else setForm(prev => ({ ...prev, sku: decodedText }));
              scanner.stop().then(() => {
                scanner.clear();
                setScanning(false);
                setScannerObj(null);
              }).catch(() => {});
            },
            () => {}
          );
        } catch (e) {
          console.error(e);
          setScanning(false);
        }
      }, 100);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price), cost: Number(form.cost), stock: 0, discountPercent: Number(form.discountPercent) || 0 })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      Swal.fire('Berhasil!', "Barang berhasil ditambahkan!", 'success');
      setForm({ sku: '', name: '', type: 'GOODS', price: 0, cost: 0, stock: 0, discountPercent: 0 });
      setShowForm(false);
      fetchProducts();
    } else {
      Swal.fire('Gagal', "Gagal menambahkan produk: " + data.message, 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setLoading(true);
    const res = await fetch(`/api/products/${editProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editProduct)
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      Swal.fire('Berhasil!', "Berhasil diupdate!", 'success');
      setShowForm(false);
      setEditProduct(null);
      fetchProducts();
    } else {
      Swal.fire('Gagal', data.message || "Gagal menyimpan perubahan", 'error');
    }
  };

  const handleDelete = async (id?: string, name?: string) => {
    const result = await Swal.fire({
      title: 'Hapus Barang?',
      text: `Anda yakin ingin menghapus "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      Swal.fire('Terhapus!', "Barang berhasil dihapus.", 'success');
      fetchProducts();
    } else {
      Swal.fire('Gagal', data.message, 'error');
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📋 Daftar Barang & Jasa ({products.length})</h2>
          {!showForm && (
            <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Tambah Barang/Jasa</button>
          )}
        </div>
        <div className="form-group">
          <input type="text" placeholder="Cari nama barang atau SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Harga Modal</th>
                <th>Harga Jual</th>
                <th>Diskon (%)</th>
                <th>Sisa Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div> Memuat data...
                  </td>
                </tr>
              ) : filtered.map(p => {
                const isUsed = p._count && (p._count.transactionItems > 0 || p._count.purchaseItems > 0 || p._count.returnItems > 0 || p._count.orderItems > 0);
                
                return (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{p.sku || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.type === 'GOODS' ? '📦 Barang' : '🔧 Jasa'}</td>
                    <td>{p.category?.name || '-'}</td>
                    <td>Rp {p.cost.toLocaleString('id-ID')}</td>
                    <td>Rp {p.price.toLocaleString('id-ID')}</td>
                    <td style={{ color: p.discountPercent && p.discountPercent > 0 ? '#b91c1c' : 'inherit' }}>{p.discountPercent || 0}%</td>
                    <td style={{ fontWeight: 600, color: p.stock < 5 ? '#ef4444' : 'inherit' }}>{p.type === 'GOODS' ? p.stock : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEdit(p)} style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit</button>
                        {!isUsed && (
                          <button onClick={() => handleDelete(p.id, p.name)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '0.3rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Hapus</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!tableLoading && filtered.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Barang tidak ditemukan.</p>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? '✏️ Edit Barang/Jasa' : '➕ Tambah Barang/Jasa Baru'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { 
                setShowForm(false); 
                setEditProduct(null); 
                if (scannerObj) {
                  scannerObj.stop().then(() => { scannerObj.clear(); setScannerObj(null); setScanning(false); }).catch(() => {});
                } else {
                  setScanning(false);
                }
              }}>Tutup</button>
            </div>
            <div className="modal-body">
              {scannerMode === 'camera' && scanning && (
                <div id="sku-reader" style={{ width: '100%', marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden' }}></div>
              )}
          {editProduct ? (
            <form onSubmit={handleUpdate} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') e.preventDefault(); }}>
              <div className="form-group">
                <label>Nama Barang/Jasa</label>
                <input value={editProduct.name} onChange={e => setEditProduct({...editProduct, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Tipe</label>
                <select value={editProduct.type} onChange={e => setEditProduct({...editProduct, type: e.target.value as any})}>
                  <option value="GOODS">📦 Barang Fisik (Pakai Stok)</option>
                  <option value="SERVICE">🔧 Jasa (Tanpa Stok)</option>
                </select>
              </div>
              {editProduct.type === 'GOODS' && (
                <div className="form-group">
                  <label>SKU / Barcode</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      value={editProduct.sku || ''} 
                      onChange={e => setEditProduct({...editProduct, sku: e.target.value})} 
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    />
                    {scannerMode === 'camera' && (
                      <button type="button" className="btn btn-outline" onClick={startScanner}>
                        {scanning ? '🛑 Tutup Kamera' : '📷 Kamera'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Harga Modal</label>
                  <input type="number" min="0" value={editProduct.cost} onChange={e => setEditProduct({...editProduct, cost: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})} onFocus={e => e.target.select()} required />
                </div>
                <div className="form-group">
                  <label>Harga Jual</label>
                  <input type="number" min="0" value={editProduct.price} onChange={e => setEditProduct({...editProduct, price: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})} onFocus={e => e.target.select()} required />
                </div>
              </div>
              <div className="form-group">
                <label>Diskon (%)</label>
                <input type="number" min="0" max="100" value={editProduct.discountPercent} onChange={e => setEditProduct({...editProduct, discountPercent: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})} onFocus={e => e.target.select()} />
              </div>
              <button type="submit" className="btn w-full" disabled={loading}>{loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}</button>
            </form>
          ) : (
            <form onSubmit={handleAdd} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') e.preventDefault(); }}>
              <div className="form-group">
                <label>Nama Barang/Jasa</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ketik nama produk..." required />
              </div>
              <div className="form-group">
                <label>Tipe</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                  <option value="GOODS">📦 Barang Fisik (Pakai Stok)</option>
                  <option value="SERVICE">🔧 Jasa (Tanpa Stok)</option>
                </select>
              </div>
              {form.type === 'GOODS' && (
                <div className="form-group">
                  <label>SKU / Barcode</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      value={form.sku} 
                      onChange={e => setForm({...form, sku: e.target.value})} 
                      placeholder="Scan barcode..." 
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    />
                    {scannerMode === 'camera' && (
                      <button type="button" className="btn btn-outline" onClick={startScanner}>
                        {scanning ? '🛑 Tutup Kamera' : '📷 Kamera'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Harga Modal</label>
                  <input type="number" min="0" value={form.cost} onChange={e => setForm({...form, cost: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})} onFocus={e => e.target.select()} required />
                </div>
                <div className="form-group">
                  <label>Harga Jual</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})} onFocus={e => e.target.select()} required />
                </div>
              </div>
              <div className="form-group">
                <label>Diskon (%)</label>
                <input type="number" min="0" max="100" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})} onFocus={e => e.target.select()} />
              </div>
              <button type="submit" className="btn w-full" disabled={loading}>{loading ? 'Menyimpan...' : '➕ Tambah Barang/Jasa'}</button>
            </form>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
