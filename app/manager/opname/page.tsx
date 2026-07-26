'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

type Product = {
  id: string;
  sku: string;
  name: string;
  stock: number;
};

type OpnameItem = {
  productId: string;
  productName: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  notes: string;
};

export default function OpnamePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState<string>('');

  // Form State
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OpnameItem[]>([]);
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannerObj, setScannerObj] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchProducts();
    const savedCam = localStorage.getItem('pos_camera_id');
    if (savedCam) setSelectedCamera(savedCam);
    const mode = localStorage.getItem('pos_scanner_mode') || 'camera';
    setScannerMode(mode);
  }, []);

  const fetchHistory = async () => {
    setTableLoading(true);
    const res = await fetch('/api/opname');
    const data = await res.json();
    if (data.success) setHistory(data.opnames);
    setTableLoading(false);
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      // Hanya tampilkan produk berupa fisik (GOODS)
      setProducts(data.products.filter((p: any) => p.type === 'GOODS'));
    }
  };

  const handlePrint = (opname: any) => {
    setPrintData(opname);
    setShowPrint(true);
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
          const scanner = new Html5Qrcode("reader", {
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
              handleSearch(decodedText);
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

  const handleAddProduct = (found: Product) => {
    const exists = items.find(i => i.productId === found.id);
    if (!exists) {
      setItems([...items, {
        productId: found.id,
        productName: found.name,
        systemStock: found.stock,
        actualStock: found.stock, // Default disamakan dulu
        difference: 0,
        notes: ''
      }]);
    } else {
      Swal.fire('Info', 'Barang sudah ada di daftar opname', 'info');
    }
    setSearch(''); // Reset search
  };

  const handleSearch = (term: string) => {
    setSearch(term);
    const found = products.find(p => p.sku === term || p.name.toLowerCase().includes(term.toLowerCase()));
    if (found) {
      handleAddProduct(found);
    }
  };

  const filteredSearchProducts = search 
    ? products.filter(p => 
        !items.find(i => i.productId === p.id) && 
        (p.sku?.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const updateActualStock = (index: number, newActual: string) => {
    const act = parseInt(newActual) || 0;
    const newItems = [...items];
    newItems[index].actualStock = act;
    newItems[index].difference = act - newItems[index].systemStock;
    setItems(newItems);
  };

  const updateItemNotes = (index: number, note: string) => {
    const newItems = [...items];
    newItems[index].notes = note;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return Swal.fire('Error', 'Belum ada barang yang di-opname', 'error');

    const result = await Swal.fire({
      title: 'Simpan Stok Opname?',
      text: 'Stok pada sistem akan otomatis disesuaikan dengan stok aktual yang Anda masukkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan & Sesuaikan Stok',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setLoading(true);
      const res = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, items })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        Swal.fire('Berhasil', 'Stok Opname tersimpan dan stok barang telah diperbarui', 'success');
        setShowForm(false);
        setItems([]);
        setNotes('');
        fetchHistory();
        fetchProducts(); // Refresh stok sistem terbaru
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Riwayat Opname?',
      text: 'Riwayat akan dihapus, tetapi stok barang TIDAK akan dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus'
    });

    if (result.isConfirmed) {
      const res = await fetch(`/api/opname/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Terhapus!', 'Data riwayat berhasil dihapus', 'success');
        fetchHistory();
      }
    }
  };

  return (
    <div>
      {!showForm ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>📋 Riwayat Stok Opname</h2>
            <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Buat Opname Baru</button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>ID Opname</th>
                  <th>Petugas</th>
                  <th>Jumlah Macam Barang</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="spinner"></div> Memuat data...
                    </td>
                  </tr>
                ) : history.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>OPN-{h.id.substring(0,8).toUpperCase()}</td>
                    <td style={{ fontWeight: 600 }}>{h.user?.name || '-'}</td>
                    <td>{h.items.length} Macam</td>
                    <td>{h.notes || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handlePrint(h)}>
                          🖨️ Cetak
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(h.id)}>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!tableLoading && history.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data stok opname.</p>}
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>📝 Buat Stok Opname Baru</h2>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>⬅️ Kembali</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
            {/* Kiri: Pencarian Barang */}
            <div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Cari Barang (Nama / SKU) {scannerMode === 'physical' && 'Atau Scan Barcode'}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    autoFocus={scannerMode === 'physical'}
                    placeholder={scannerMode === 'physical' ? "Scan barcode di sini..." : "Ketik lalu Enter..."} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(search);
                      }
                    }} 
                  />
                  {scannerMode !== 'physical' && (
                    <button className="btn btn-outline" onClick={toggleScanner}>
                      {scanning ? '❌ Tutup Kamera' : '📷 Scan'}
                    </button>
                  )}
                </div>
                {search && filteredSearchProducts.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {filteredSearchProducts.map(p => (
                      <div 
                        key={p.id} 
                        style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                        onClick={() => handleAddProduct(p)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>SKU: {p.sku || '-'} | Stok Sistem: {p.stock}</div>
                      </div>
                    ))}
                  </div>
                )}
                {search && filteredSearchProducts.length === 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '0.75rem', zIndex: 10, color: '#666', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    Tidak ada barang ditemukan atau sudah ada di daftar.
                  </div>
                )}
              </div>

              {scanning && <div id="reader" style={{ width: '100%', marginBottom: '1rem' }}></div>}

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Keterangan Opname</label>
                <textarea placeholder="Contoh: Opname rutin akhir bulan juli..." value={notes} onChange={e => setNotes(e.target.value)} rows={4}></textarea>
              </div>
            </div>

            {/* Kanan: Daftar Barang Opname */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Daftar Barang Disesuaikan</h3>
              
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      <th>Nama Barang</th>
                      <th style={{ width: '100px' }}>Stok Sistem</th>
                      <th style={{ width: '120px' }}>Stok Aktual</th>
                      <th style={{ width: '100px' }}>Selisih</th>
                      <th>Keterangan</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{item.productName}</td>
                        <td style={{ textAlign: 'center', background: '#f1f5f9', fontWeight: 'bold' }}>{item.systemStock}</td>
                        <td>
                          <input 
                            type="number" 
                            min="0"
                            value={item.actualStock}
                            onChange={(e) => updateActualStock(i, e.target.value)}
                            style={{ width: '100%', padding: '0.4rem', border: '2px solid var(--primary)', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: item.difference < 0 ? '#ef4444' : item.difference > 0 ? '#16a34a' : 'inherit' }}>
                          {item.difference > 0 ? `+${item.difference}` : item.difference}
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={item.notes}
                            onChange={(e) => updateItemNotes(i, e.target.value)}
                            placeholder="Alasan selisih..."
                            style={{ width: '100%', padding: '0.4rem' }}
                          />
                        </td>
                        <td>
                          <button onClick={() => removeItem(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✖</button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada barang. Cari dan tambahkan barang di sebelah kiri.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {items.length > 0 && (
                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                  <button className="btn btn-success" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Menyimpan...' : '💾 Simpan & Terapkan Stok'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Opname */}
      {showPrint && printData && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div id="print-area" className="print-area" style={{ padding: '2rem', background: '#fff', color: '#000' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Berita Acara Stok Opname</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#555' }}>ID Dokumen: OPN-{printData.id.substring(0,8).toUpperCase()}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Tanggal:</strong> {new Date(printData.createdAt).toLocaleDateString('id-ID')}</p>
                  <p style={{ margin: 0 }}><strong>Petugas:</strong> {printData.user?.name}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Catatan:</strong></p>
                  <p style={{ margin: 0 }}>{printData.notes || '-'}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'left' }}>SKU</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'left' }}>Nama Barang</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>Stok Sistem</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>Stok Aktual</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>Selisih</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'left' }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items.map((item: any) => (
                    <tr key={item.id}>
                      <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{item.product?.sku || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{item.productName || item.product?.name}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>{item.systemStock}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{item.actualStock}</td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', textAlign: 'center' }}>
                <div style={{ width: '200px' }}>
                  <p style={{ marginBottom: '5rem' }}>Mengetahui,</p>
                  <p style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>Manajer / Admin</p>
                </div>
                <div style={{ width: '200px' }}>
                  <p style={{ marginBottom: '5rem' }}>Petugas Gudang,</p>
                  <p style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>{printData.user?.name}</p>
                </div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPrint(false)}>Tutup</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Cetak Bukti</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
