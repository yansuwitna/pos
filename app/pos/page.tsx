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
};

type DiscountRule = {
  id: string;
  name: string;
  minItemQuantity: number | null;
  minTransaction: number | null;
  discountPercent: number;
  isActive: boolean;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

type CartItem = Product & { quantity: number; subtotal: number };

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: Customer[], 
  value: string, 
  onChange: (val: string) => void,
  placeholder: string
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedC = options.find(o => o.id === value);
  const displayLabel = selectedC ? `${selectedC.name} ${selectedC.phone ? `(${selectedC.phone})` : ''}` : placeholder;

  const filtered = options.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q));
  });

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => { setOpen(!open); setSearch(''); }}
        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', background: '#fff', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span>{displayLabel}</span>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>▼</span>
      </div>
      
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', marginTop: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <input 
              autoFocus
              type="text" 
              placeholder="Cari nama / no HP..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '200px' }}>
            <div 
              onClick={() => { onChange(''); setOpen(false); }}
              style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {placeholder}
            </div>
            {filtered.map(c => (
              <div 
                key={c.id} 
                onClick={() => { onChange(c.id); setOpen(false); }}
                style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '0.5rem', color: 'gray', textAlign: 'center' }}>Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [scanning, setScanning] = useState(false);
  const [total, setTotal] = useState(0);
  const [payment, setPayment] = useState('');
  const [discount, setDiscount] = useState('');
  const grandTotal = Math.max(0, total - Number(discount || 0));
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [appliedRuleName, setAppliedRuleName] = useState<string | null>(null);
  
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  
  const [receiptData, setReceiptData] = useState<{
    items: CartItem[], 
    total: number, 
    discount: number,
    grandTotal: number,
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
  const [scannerObj, setScannerObj] = useState<Html5Qrcode | null>(null);
  const [printerType, setPrinterType] = useState('kabel');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.products);
      });
      
      fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCustomers(data.customers);
      });
      
    fetch('/api/discount-rules')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDiscountRules(data.rules.filter((r: DiscountRule) => r.isActive));
        }
      });
      
    const savedCam = localStorage.getItem('pos_camera_id');
    if (savedCam) setSelectedCamera(savedCam);

    const savedStore = localStorage.getItem('pos_store_info');
    if (savedStore) {
      try { setStoreInfo(JSON.parse(savedStore)); } catch(e){}
    }

    const mode = localStorage.getItem('pos_scanner_mode');
    if (mode) setScannerMode(mode);

    const savedPrinterType = localStorage.getItem('pos_printer_type');
    if (savedPrinterType) setPrinterType(savedPrinterType);
  }, []);

  useEffect(() => {
    const newTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    setTotal(newTotal);
    
    // Hitung otomatis diskon
    if (selectedCustomer && newTotal > 0) {
      const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
      let bestDiscountPercent = 0;
      let bestRuleName = null;
      
      discountRules.forEach(rule => {
        const hasItemReq = rule.minItemQuantity !== null && rule.minItemQuantity > 0;
        const hasPriceReq = rule.minTransaction !== null && rule.minTransaction > 0;
        
        let isMatch = false;
        
        if (hasItemReq && hasPriceReq) {
          isMatch = (totalItems >= (rule.minItemQuantity as number)) || (newTotal >= (rule.minTransaction as number));
        } else if (hasItemReq) {
          isMatch = totalItems >= (rule.minItemQuantity as number);
        } else if (hasPriceReq) {
          isMatch = newTotal >= (rule.minTransaction as number);
        } else {
          isMatch = true; // tidak ada syarat
        }
        
        if (isMatch) {
          if (rule.discountPercent > bestDiscountPercent) {
            bestDiscountPercent = rule.discountPercent;
            bestRuleName = rule.name;
          }
        }
      });
      
      if (bestDiscountPercent > 0) {
        setDiscount(String((newTotal * bestDiscountPercent) / 100));
        setAppliedRuleName(`${bestRuleName} (${bestDiscountPercent}%)`);
      } else {
        setDiscount('');
        setAppliedRuleName(null);
      }
    } else {
      setDiscount('');
      setAppliedRuleName(null);
    }
  }, [cart, selectedCustomer, discountRules]);

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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Jika receipt terbuka
      if (document.getElementById('receipt-content')) {
        if (e.key === 'Escape') {
          setReceiptData(null);
        } else if (e.key === 'F9') {
          e.preventDefault();
          document.getElementById('btn-print-receipt')?.click();
        }
      } else {
        // Jika kasir utama
        if (e.key === 'F2') {
          e.preventDefault();
          document.getElementById('product-search-input')?.focus();
        } else if (e.key === 'F4') {
          e.preventDefault();
          document.getElementById('payment-input')?.focus();
        } else if (e.key === 'F8') {
          e.preventDefault();
          document.getElementById('btn-pay')?.click();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []); // Event delegation via getElementById works without deps

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
          const scanner = new Html5Qrcode("barcode-reader", {
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

  const handleScan = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    if (product) {
      addToCart(product);
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
    
    if (payment === '') return Swal.fire('Peringatan', 'Masukkan nominal uang pembayaran!', 'warning');
    
    const isCredit = Number(payment) < grandTotal;
    if (isCredit && !selectedCustomer) {
      return Swal.fire('Peringatan', 'Pilih pelanggan terlebih dahulu karena pembayaran kurang (kasbon)!', 'warning');
    }
    if (isCredit && !dueDate) {
      return Swal.fire('Peringatan', 'Pilih tanggal jatuh tempo untuk kasbon!', 'warning');
    }
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          payment: Number(payment),
          discount: Number(discount || 0),
          customerId: selectedCustomer || undefined,
          dueDate: isCredit ? dueDate : undefined
        })
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
      discount: Number(discount || 0),
      grandTotal: grandTotal,
      payment: Number(payment),
      change: Number(payment) - grandTotal,
      date: new Date()
    });
    
    setCart([]);
    setPayment('');
    setDiscount('');
    setSelectedCustomer('');
    setDueDate('');
  };

  const saveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return Swal.fire('Peringatan', "Nama Pelanggan wajib diisi", 'warning');
    setSavingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil!', "Pelanggan berhasil ditambahkan!", 'success');
        // Update customer list with the new one
        const updated = await (await fetch('/api/customers')).json();
        if (updated.success) setCustomers(updated.customers);
        
        // Find and select the newly added customer if possible
        setSelectedCustomer(data.customer?.id || '');
        setNewCustomer({ name: '', phone: '', address: '' });
        setShowAddCustomer(false);
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch(err) {
      Swal.fire('Error', "Terjadi kesalahan.", 'error');
    } finally {
      setSavingCustomer(false);
    }
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

  const handlePrint = () => {
    if (printerType === 'bluetooth') {
      printReceipt();
    } else {
      window.print();
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <a href="/dashboard" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
          ⬅️ Kembali ke Dashboard
        </a>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>📷 Scan & Cari Barang</h2>
          {scannerMode === 'camera' ? (
            <button className="btn btn-outline" onClick={toggleScanner} style={{ padding: '0.5rem 1rem' }}>
              {scanning ? '❌ Tutup Kamera' : '📷 Buka Kamera'}
            </button>
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
          <ProductSearch products={products} onSelect={addToCart} />
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
          {appliedRuleName && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🎟️</span>
              <div>
                <strong>Diskon Otomatis Member Diterapkan!</strong>
                <div style={{ opacity: 0.8 }}>Aturan: {appliedRuleName}</div>
              </div>
            </div>
          )}
          
          {discountRules.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#334155' }}>📢 Promo Member Aktif:</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {discountRules.map(rule => (
                  <li key={rule.id} style={{ marginBottom: '0.2rem' }}>
                    <strong>{rule.name}</strong> - Diskon <strong>{rule.discountPercent}%</strong>
                    {rule.minItemQuantity || rule.minTransaction ? ' dengan syarat: ' : ' tanpa syarat.'}
                    {rule.minItemQuantity ? `Min. ${rule.minItemQuantity} item` : ''}
                    {rule.minItemQuantity && rule.minTransaction ? ' ATAU ' : ''}
                    {rule.minTransaction ? `Min. Belanja Rp ${rule.minTransaction.toLocaleString('id-ID')}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pelanggan (Opsional)</span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }} 
                onClick={() => setShowAddCustomer(true)}
              >
                + Pelanggan Baru
              </button>
            </label>
            <SearchableSelect 
              options={customers}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              placeholder="-- Umum / Non-Member --"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Tagihan</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
          </div>
          
          {Number(discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Potongan Harga (Diskon)</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#059669' }}>-Rp {Number(discount).toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Uang Pembayaran (Rp) [F4]</label>
            <input 
              id="payment-input"
              type="number" 
              placeholder="0" 
              value={payment} 
              onChange={e => setPayment(e.target.value)} 
              style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
            />
          </div>

          {payment !== '' && Number(payment) < grandTotal && (
            <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ color: '#b91c1c', fontWeight: 600, marginBottom: '1rem' }}>
                ⚠️ Pembayaran Kurang (Kasbon)
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tanggal Jatuh Tempo</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Kembalian</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Rp {Math.max(0, Number(payment) - grandTotal).toLocaleString('id-ID')}
            </span>
          </div>
          
          <button 
            id="btn-pay"
            className={`btn w-full ${cart.length === 0 || payment === '' ? '' : 'btn-success'}`}
            style={{ padding: '1rem', fontSize: '1.1rem' }} 
            onClick={processTransaction}
            disabled={cart.length === 0 || payment === ''}
          >
            💰 Bayar & Tampilkan Struk [F8]
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
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginTop: '0.5rem' }}>
                <span>SUBTOTAL</span>
                <span>Rp {receiptData.total.toLocaleString('id-ID')}</span>
              </div>
              {receiptData.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                  <span>DISKON</span>
                  <span>-Rp {receiptData.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                <span>GRAND TOTAL</span>
                <span>Rp {receiptData.grandTotal.toLocaleString('id-ID')}</span>
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
              <button className="btn btn-outline" style={{ flex: '1 1 100%' }} onClick={() => setReceiptData(null)}>Tutup (Esc)</button>
              <button id="btn-print-receipt" className="btn btn-success" style={{ flex: '1 1 100%' }} onClick={handlePrint}>🖨️ Cetak Struk (F9)</button>
            </div>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>➕ Tambah Pelanggan</h2>
              <button className="btn btn-outline" style={{ padding: '0.2rem 0.6rem' }} onClick={() => setShowAddCustomer(false)}>Tutup</button>
            </div>
            <form onSubmit={saveNewCustomer}>
              <div className="form-group">
                <label>Nama Pelanggan</label>
                <input 
                  type="text" 
                  value={newCustomer.name} 
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                  placeholder="Contoh: Budi Santoso" required 
                />
              </div>
              <div className="form-group">
                <label>Nomor HP / WA</label>
                <input 
                  type="text" 
                  value={newCustomer.phone} 
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                  placeholder="0812xxxxxx" 
                />
              </div>
              <div className="form-group">
                <label>Alamat</label>
                <input 
                  type="text" 
                  value={newCustomer.address} 
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                  placeholder="Alamat lengkap..." 
                />
              </div>
              <button type="submit" className="btn btn-success w-full mt-2" disabled={savingCustomer}>
                {savingCustomer ? 'Menyimpan...' : 'Simpan Pelanggan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
