'use client';
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Swal from 'sweetalert2';

type Product = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
};

type CartItem = Product & { quantity: number; subtotal: number };

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [total, setTotal] = useState(0);
  const [payment, setPayment] = useState('');
  
  const [receiptData, setReceiptData] = useState<{
    items: CartItem[], 
    total: number, 
    payment: number, 
    change: number,
    date: Date
  } | null>(null);

  const [storeInfo, setStoreInfo] = useState({
    name: 'POS Pro',
    address: '',
    phone: '',
    greeting: 'Terima Kasih',
    logo: ''
  });

  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState('camera');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.products);
      });
    const savedCam = localStorage.getItem('pos_camera_id');
    if (savedCam) setSelectedCamera(savedCam);

    const savedStore = localStorage.getItem('pos_store_info');
    if (savedStore) {
      try { setStoreInfo(JSON.parse(savedStore)); } catch(e){}
    }

    const mode = localStorage.getItem('pos_scanner_mode');
    if (mode) setScannerMode(mode);
  }, []);

  useEffect(() => {
    const newTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    setTotal(newTotal);
  }, [cart]);

  useEffect(() => {
    if (scannerMode !== 'physical') return;
    let barcodeBuffer = '';
    let interval: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (interval) clearTimeout(interval);
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          const product = products.find(p => p.sku === barcodeBuffer);
          if (product) {
            addToCart(product);
          } else {
            alert("Barang tidak ditemukan: " + barcodeBuffer);
          }
        }
        barcodeBuffer = '';
        return;
      }
      
      if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }

      interval = setTimeout(() => {
        barcodeBuffer = '';
      }, 100);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, scannerMode]);

  const startScanner = () => {
    setScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("barcode-reader", { 
        fps: 15,
        qrbox: { width: 400, height: 120 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
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

  const handleScan = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    if (product) {
      addToCart(product);
    } else {
      Swal.fire('Tidak Ditemukan', "Barang tidak ditemukan!", 'error');
    }
  };

  const handleManualSearch = () => {
    if (!search) return;
    const query = search.toLowerCase();
    const product = products.find(p => p.sku === query || p.name.toLowerCase().includes(query));
    if (product) {
      addToCart(product);
      setSearch('');
    } else {
      Swal.fire('Tidak Ditemukan', "Barang tidak ditemukan!", 'error');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.max(1, quantity), subtotal: Math.max(1, quantity) * item.price };
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = async () => {
    const result = await Swal.fire({
      title: 'Kosongkan Keranjang?',
      text: "Anda yakin ingin menghapus semua barang dari keranjang?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Kosongkan!',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) setCart([]);
  };

  const processTransaction = async () => {
    if (cart.length === 0) return Swal.fire('Peringatan', 'Keranjang kosong!', 'warning');
    if (!payment || Number(payment) < total) return Swal.fire('Peringatan', 'Uang pembayaran kurang!', 'warning');
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, payment: Number(payment) })
      });
      const data = await res.json();
      if (!data.success) {
        return Swal.fire('Gagal', "Gagal menyimpan transaksi:\n" + data.message, 'error');
      }
    } catch(e) {
      return Swal.fire('Error', "Gagal terhubung ke server. Pastikan server berjalan.", 'error');
    }

    setReceiptData({
      items: [...cart],
      total: total,
      payment: Number(payment),
      change: Number(payment) - total,
      date: new Date()
    });
    
    setCart([]);
    setPayment('');
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
      Swal.fire('Terhubung', "Printer terhubung! Mengirim instruksi cetak...", 'success');
    } catch (error) {
      Swal.fire('Info', "Pencetakan dibatalkan atau printer tidak ditemukan.", 'info');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <a href="/dashboard" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
          ⬅️ Kembali ke Dashboard
        </a>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📷 Scan & Cari Barang</h2>
          {scannerMode === 'camera' ? (
            !scanning && (
              <button className="btn btn-outline" onClick={startScanner} style={{ padding: '0.5rem 1rem' }}>
                Buka Kamera
              </button>
            )
          ) : (
            <div style={{ color: '#166534', background: '#f0fdf4', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #bbf7d0' }}>
              🔫 Scanner USB Aktif
            </div>
          )}
        </div>
        
        {scannerMode === 'camera' && scanning && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              padding: '0.5rem 1rem', 
              background: '#fefce8', 
              border: '1px solid #fde047', 
              borderRadius: '8px',
              marginBottom: '0.75rem',
              fontSize: '0.85rem',
              color: '#713f12'
            }}>
              📌 Arahkan kamera ke barcode.
            </div>
            <div id="barcode-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Pencarian Manual (Ketik Nama / SKU)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Ketik lalu Enter..." 
              onKeyDown={e => e.key === 'Enter' && handleManualSearch()} 
              style={{ marginBottom: 0 }} 
            />
            <button className="btn btn-outline" onClick={handleManualSearch}>Cari</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>🛒 Keranjang</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Bersihkan</button>
          )}
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          {cart.map((item, idx) => (
            <div key={idx} className="cart-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 200px' }}>
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-meta">@ Rp {item.price.toLocaleString('id-ID')}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 auto' }}>
                <input 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)} 
                  style={{ width: '60px', padding: '0.4rem', margin: 0, textAlign: 'center' }} 
                />
                <div className="cart-item-total" style={{ flex: 1, textAlign: 'right' }}>Rp {item.subtotal.toLocaleString('id-ID')}</div>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>❌</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>🛒</div>
              <p>Keranjang masih kosong</p>
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Tagihan</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>Rp {total.toLocaleString('id-ID')}</span>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Uang Pembayaran (Rp)</label>
            <input 
              type="number" 
              placeholder="0" 
              value={payment} 
              onChange={e => setPayment(e.target.value)} 
              style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Kembalian</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Rp {Math.max(0, Number(payment) - total).toLocaleString('id-ID')}
            </span>
          </div>
          
          <button 
            className={`btn w-full ${cart.length === 0 || Number(payment) < total ? '' : 'btn-success'}`}
            style={{ padding: '1rem', fontSize: '1.1rem' }} 
            onClick={processTransaction}
            disabled={cart.length === 0 || Number(payment) < total}
          >
            💰 Bayar & Tampilkan Struk
          </button>
        </div>
      </div>

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
              <p style={{ textAlign: 'center', margin: 0, color: '#666' }}>{receiptData.date.toLocaleString('id-ID')}</p>
              
              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '0.5rem 0', margin: '0.5rem 0' }}>
                {receiptData.items.map((item, idx) => (
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
