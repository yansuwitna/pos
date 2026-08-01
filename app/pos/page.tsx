'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Swal from 'sweetalert2';
import ProductSearch from '@/app/components/ProductSearch';

type Product = { id: string; sku: string | null; name: string; price: number; discountPercent?: number; cost: number; stock: number; };
type DiscountRule = { id: string; name: string; minItemQuantity: number | null; minTransaction: number | null; discountPercent: number; isActive: boolean; };
type Customer = { id: string; name: string; phone: string | null; };
type CartItem = Product & { quantity: number; subtotal: number };

const SearchableSelect = ({ options, value, onChange, placeholder }: { options: Customer[], value: string, onChange: (val: string) => void, placeholder: string }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedC = options.find(o => o.id === value);
  const displayLabel = selectedC ? `${selectedC.name} ${selectedC.phone ? `(${selectedC.phone})` : ''}` : placeholder;
  const filtered = options.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => { setOpen(!open); setSearch(''); }} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
        <span>{displayLabel}</span>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #cbd5e1' }}>
            <input autoFocus type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '200px', fontSize: '13px' }}>
            <div onClick={() => { onChange(''); setOpen(false); }} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>{placeholder}</div>
            {filtered.map(c => (
              <div key={c.id} onClick={() => { onChange(c.id); setOpen(false); }} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </div>
            ))}
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
  const [kasirName, setKasirName] = useState<string>('Kasir');
  const [appliedRuleName, setAppliedRuleName] = useState<string | null>(null);
  
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  
  const [showConfirmTx, setShowConfirmTx] = useState(false);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  
  const [receiptData, setReceiptData] = useState<any>(null);
  const [storeInfo, setStoreInfo] = useState({ name: 'POS Pro', address: '', phone: '', greeting: 'Terima Kasih', logo: '' });
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState('');
  const [scannerObj, setScannerObj] = useState<Html5Qrcode | null>(null);
  const [printerType, setPrinterType] = useState('kabel');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(data => { if (data.success) setProducts(data.products); });
    fetch('/api/customers').then(res => res.json()).then(data => { if (data.success) setCustomers(data.customers); });
    fetch('/api/discount-rules').then(res => res.json()).then(data => { if (data.success) setDiscountRules(data.rules.filter((r: DiscountRule) => r.isActive)); });
    fetch('/api/auth/me').then(res => res.json()).then(data => { if (data.success && data.user) setKasirName(data.user.name); });
    
    fetch('/api/settings/store')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.storeInfo) {
          setStoreInfo(data.storeInfo);
          localStorage.setItem('pos_store_info', JSON.stringify(data.storeInfo));
        }
      })
      .catch(() => {});
    
    if (localStorage.getItem('pos_camera_id')) setSelectedCamera(localStorage.getItem('pos_camera_id')!);
    const mode = localStorage.getItem('pos_scanner_mode') || 'camera';
    setScannerMode(mode);
    if (localStorage.getItem('pos_printer_type')) setPrinterType(localStorage.getItem('pos_printer_type')!);
  }, []);

  useEffect(() => {
    const newTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    setTotal(newTotal);
    if (selectedCustomer && newTotal > 0) {
      const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
      let bestDiscountPercent = 0; let bestRuleName = null;
      discountRules.forEach(rule => {
        const hasItemReq = rule.minItemQuantity !== null && rule.minItemQuantity > 0;
        const hasPriceReq = rule.minTransaction !== null && rule.minTransaction > 0;
        let isMatch = false;
        if (hasItemReq && hasPriceReq) isMatch = (totalItems >= (rule.minItemQuantity as number)) || (newTotal >= (rule.minTransaction as number));
        else if (hasItemReq) isMatch = totalItems >= (rule.minItemQuantity as number);
        else if (hasPriceReq) isMatch = newTotal >= (rule.minTransaction as number);
        else isMatch = true;
        
        if (isMatch && rule.discountPercent > bestDiscountPercent) {
          bestDiscountPercent = rule.discountPercent;
          bestRuleName = rule.name;
        }
      });
      if (bestDiscountPercent > 0) {
        setDiscount(String((newTotal * bestDiscountPercent) / 100));
        setAppliedRuleName(`${bestRuleName} (${bestDiscountPercent}%)`);
      } else { setDiscount(''); setAppliedRuleName(null); }
    } else { setDiscount(''); setAppliedRuleName(null); }
  }, [cart, selectedCustomer, discountRules]);

  useEffect(() => {
    if (scannerMode !== 'physical') return;
    let barcodeBuffer = ''; let interval: NodeJS.Timeout;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (interval) clearTimeout(interval);
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          const product = products.find(p => p.sku === barcodeBuffer);
          if (product) addToCart(product); else alert("Barang tidak ditemukan: " + barcodeBuffer);
        }
        barcodeBuffer = ''; return;
      }
      if (e.key.length === 1) barcodeBuffer += e.key;
      interval = setTimeout(() => { barcodeBuffer = ''; }, 100);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, scannerMode]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.getElementById('receipt-content')) {
        if (e.key === 'Escape') setReceiptData(null);
        else if (e.key === 'F9') { e.preventDefault(); document.getElementById('btn-print-receipt')?.click(); }
      } else {
        if (e.key === 'F1') { e.preventDefault(); document.getElementById('product-search-input')?.focus(); }
        else if (e.key === 'F4') { e.preventDefault(); document.getElementById('payment-input')?.focus(); }
        else if (e.key === 'F12') { e.preventDefault(); document.getElementById('btn-pay')?.click(); }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleScanner = async () => {
    if (scanning) {
      if (scannerObj) { try { await scannerObj.stop(); scannerObj.clear(); } catch (e) {} }
      setScanning(false); setScannerObj(null);
    } else {
      setScanning(true);
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("barcode-reader", { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.CODE_128] });
          setScannerObj(scanner);
          await scanner.start(
            selectedCamera ? { deviceId: { exact: selectedCamera } } : { facingMode: 'environment' },
            { fps: 10, qrbox: (vw, vh) => ({ width: Math.min(vw * 0.8, 300), height: 100 }) },
            (decodedText) => {
              const product = products.find(p => p.sku === decodedText);
              if (product) addToCart(product); else Swal.fire('Tidak Ditemukan', "Barang tidak ditemukan!", 'error');
              scanner.stop().then(() => { scanner.clear(); setScanning(false); setScannerObj(null); }).catch(() => {});
            },
            () => {}
          );
        } catch (err) { console.error(err); Swal.fire('Error', 'Gagal mengakses kamera.', 'error'); setScanning(false); }
      }, 100);
    }
  };

  const calcSubtotal = (price: number, qty: number, discountPercent?: number) => {
    const discountAmount = price * (discountPercent || 0) / 100;
    return (price - discountAmount) * qty;
  };

  const addToCart = (product: Product) => {
    if (product.type === 'GOODS' && product.stock <= 0) {
      Swal.fire('Stok Habis!', `Stok barang "${product.name}" telah habis (Stok: 0).`, 'warning');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      const currentQty = Number(existing.quantity) || 0;
      const newQty = currentQty + 1;
      if (product.type === 'GOODS' && newQty > product.stock) {
        Swal.fire('Stok Tidak Cukup!', `Stok barang "${product.name}" hanya tersisa ${product.stock}.`, 'warning');
        return;
      }
      setCart(prev => prev.map(item => item.id === product.id ? { 
        ...item, 
        quantity: newQty, 
        subtotal: calcSubtotal(item.price, newQty, item.discountPercent) 
      } : item));
    } else {
      setCart(prev => [...prev, { 
        ...product, 
        quantity: 1, 
        subtotal: calcSubtotal(product.price, 1, product.discountPercent) 
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number | string) => {
    if (quantity === '') {
      setCart(prev => prev.map(item => item.id === productId ? { 
        ...item, 
        quantity: '' as any, 
        subtotal: 0 
      } : item));
      return;
    }

    const numQty = Number(quantity);
    const targetItem = cart.find(item => item.id === productId);

    if (targetItem && targetItem.type === 'GOODS' && numQty > targetItem.stock) {
      Swal.fire(
        'Stok Melebihi Batas!', 
        `Jumlah barang "${targetItem.name}" yang dimasukkan (${numQty}) melebihi sisa stok (${targetItem.stock}).`, 
        'warning'
      );
      const cappedQty = Math.max(1, targetItem.stock);
      setCart(prev => prev.map(item => item.id === productId ? { 
        ...item, 
        quantity: cappedQty, 
        subtotal: calcSubtotal(item.price, cappedQty, item.discountPercent) 
      } : item));
      return;
    }

    const safeQty = Math.max(1, numQty || 1);
    setCart(prev => prev.map(item => item.id === productId ? { 
      ...item, 
      quantity: quantity as any, 
      subtotal: calcSubtotal(item.price, safeQty, item.discountPercent) 
    } : item));
  };

  const removeItem = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const clearCart = async () => {
    if ((await Swal.fire({ title: 'Kosongkan?', text: "Yakin?", icon: 'warning', showCancelButton: true })).isConfirmed) setCart([]);
  };

  const processTransaction = () => {
    if (cart.length === 0) return Swal.fire('Peringatan', 'Keranjang kosong!', 'warning');
    if (payment === '') return Swal.fire('Peringatan', 'Masukkan nominal uang pembayaran!', 'warning');
    const isCredit = Number(payment) < grandTotal;
    if (isCredit && !selectedCustomer) return Swal.fire('Peringatan', 'Pilih pelanggan terlebih dahulu karena kasbon!', 'warning');
    
    // Auto fill default due date (+7 hari) if isCredit and dueDate is not set yet
    if (isCredit && !dueDate) {
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDueDate(defaultDate);
    }
    
    setShowConfirmTx(true);
  };

  const executeTransaction = async () => {
    const isCredit = Number(payment) < grandTotal;
    setIsSubmittingTx(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, payment: Number(payment), discount: Number(discount || 0), customerId: selectedCustomer || undefined, dueDate: isCredit ? dueDate : undefined })
      });
      const data = await res.json();
      if (!data.success) {
        Swal.fire('Gagal', "Gagal menyimpan: " + data.message, 'error');
        setIsSubmittingTx(false);
        return;
      }
      setReceiptData({ items: [...cart], total, discount: Number(discount || 0), grandTotal, payment: Number(payment), change: Number(payment) - grandTotal, date: new Date() });
      setCart([]); setPayment(''); setDiscount(''); setSelectedCustomer(''); setDueDate('');
      setShowConfirmTx(false);
    } catch(e) { 
      Swal.fire('Error', "Gagal terhubung ke server.", 'error'); 
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const saveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return Swal.fire('Peringatan', "Nama Pelanggan wajib diisi", 'warning');
    setSavingCustomer(true);
    try {
      const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCustomer) });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Berhasil!', "Pelanggan ditambahkan!", 'success');
        const updated = await (await fetch('/api/customers')).json();
        if (updated.success) setCustomers(updated.customers);
        setSelectedCustomer(data.customer?.id || ''); setNewCustomer({ name: '', phone: '', address: '' }); setShowAddCustomer(false);
      } else { Swal.fire('Gagal', data.message, 'error'); }
    } catch(err) { Swal.fire('Error', "Terjadi kesalahan.", 'error'); } finally { setSavingCustomer(false); }
  };

  const printReceipt = async () => {
    if (!receiptData) return;
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] });
      await device.gatt.connect(); Swal.fire('Terhubung', "Printer terhubung! Mengirim instruksi...", 'success');
    } catch (error) { Swal.fire('Info', "Pencetakan dibatalkan atau printer tidak ditemukan.", 'info'); }
  };

  const handlePrint = () => printerType === 'bluetooth' ? printReceipt() : window.print();

  if (isMobile) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER MOBILE */}
        <div style={{ background: '#000', color: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/dashboard" style={{ textDecoration: 'none', color: '#fff', fontSize: '20px', padding: '0 5px' }}>
              ⬅️
            </a>
            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {storeInfo?.logo ? (
                <img src={storeInfo.logo} alt="Logo" style={{ maxHeight: '24px', objectFit: 'contain', borderRadius: '4px' }} />
              ) : (
                <span style={{background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'}}>
                  {storeInfo?.name?.[0]?.toUpperCase() || 'P'}
                </span>
              )}
              <div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.2 }}>{storeInfo?.name || 'POS'}</div>
                {storeInfo?.address && (
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'normal', textTransform: 'none', lineHeight: 1 }}>📍 {storeInfo.address}</div>
                )}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', display: 'flex', gap: '5px', alignItems: 'center' }}>
            👤 {kasirName || 'Kasir'}
          </div>
        </div>

        {/* TOP BAR MOBILE (Search & Camera) */}
        <div style={{ background: '#fff', borderBottom: '2px solid #ef4444', padding: '10px 15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1 }} id="product-search-container">
             <ProductSearch products={products} onSelect={addToCart} hideOutOfStock={true} />
          </div>
          {scannerMode === 'camera' && (
            <div onClick={() => {
                if (scannerMode !== 'camera') setScannerMode('camera');
                toggleScanner();
              }} 
              style={{ cursor: 'pointer', background: scanning ? '#ef4444' : '#333', color: '#fff', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {scanning ? '❌' : '📷'}
            </div>
          )}
        </div>

        {/* CAMERA MODAL OVERLAY (MOBILE) */}
        {scanning && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Pemindai Barcode</h3>
                <button onClick={toggleScanner} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
              </div>
              <div id="barcode-reader" style={{ width: '100%', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}></div>
            </div>
          </div>
        )}

        {/* CUSTOMER & DISCOUNTS */}
        <div style={{ background: '#fff', padding: '10px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Pelanggan:</div>
             <SearchableSelect options={customers} value={selectedCustomer} onChange={setSelectedCustomer} placeholder="-- Umum --" />
          </div>
          {(selectedCustomer || (payment !== '' && Number(payment) < grandTotal)) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', padding: '6px 10px', borderRadius: '4px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b91c1c' }}>📅 Jatuh Tempo Kasbon:</div>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                style={{ padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
              />
            </div>
          )}
          {discountRules.length > 0 && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
               {discountRules.map(rule => (
                 <div key={rule.id} style={{ fontSize: '11px', color: '#b91c1c', background: '#fef2f2', padding: '6px 8px', borderRadius: '4px', border: '1px solid #fecaca', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                   <strong>🎟️ {rule.name} (Diskon {rule.discountPercent}%)</strong>
                   {rule.minTransaction && Number(rule.minTransaction) > 0 ? ` - Min. Rp ${Number(rule.minTransaction).toLocaleString('id-ID')}` : ''}
                   {rule.minItemQuantity && Number(rule.minItemQuantity) > 0 ? ` - Min. Qty ${rule.minItemQuantity}` : ''}
                 </div>
               ))}
             </div>
          )}
        </div>

        {/* CART LIST MOBILE */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '10px' }}>
          {cart.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>Keranjang belanja kosong.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span>{item.name}</span>
                      {item.discountPercent && item.discountPercent > 0 ? (
                        <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 4px', borderRadius: '4px' }}>-{item.discountPercent}%</span>
                      ) : null}
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Rp {item.price.toLocaleString('id-ID')} x 
                      <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, e.target.value === '' ? '' : (parseInt(e.target.value) || 1))} onFocus={e => e.target.select()} style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }} min="1" />
                    </div>
                    <div style={{ fontWeight: 'bold' }}>Rp {item.subtotal.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER FIXED BOTTOM MOBILE */}
        <div style={{ background: '#fff', borderTop: '2px solid #cbd5e1', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
             <span>Subtotal</span>
             <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
          {Number(discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ef4444' }}>
               <span>Diskon</span>
               <span>- Rp {Number(discount).toLocaleString('id-ID')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#b91c1c' }}>
             <span>TOTAL</span>
             <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
             <input type="number" placeholder="Uang Bayar" value={payment} onChange={e => setPayment(e.target.value)} onFocus={e => e.target.select()} style={{ flex: 1, padding: '10px', fontSize: '16px', border: '2px solid #cbd5e1', borderRadius: '6px', textAlign: 'right' }} />
             <button onClick={processTransaction} style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', borderRadius: '6px' }}>BAYAR</button>
          </div>
        </div>

        {/* RECEIPT MODAL MOBILE */}
        {receiptData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '8px', padding: '20px' }}>
              <div id="receipt-content-mobile" style={{ color: '#000', fontFamily: 'monospace', fontSize: '12px' }}>
                {storeInfo.logo && (
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <img src={storeInfo.logo} alt="Logo" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                  </div>
                )}
                <h2 style={{ textAlign: 'center', marginBottom: '5px', fontSize: '16px' }}>{storeInfo.name}</h2>
                <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                <p style={{ textAlign: 'center', margin: 0, color: '#666' }}>{receiptData.date.toLocaleString('id-ID')}</p>
                <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '10px 0', margin: '10px 0' }}>
                  {receiptData.items.map((item: CartItem, idx: number) => (
                    <div key={idx} style={{ marginBottom: '5px' }}>
                      <div>{item.name}</div>
                      {item.discountPercent && item.discountPercent > 0 ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', textDecoration: 'line-through' }}>
                            <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                            <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Disc {item.discountPercent}%</span>
                            <span>{item.subtotal.toLocaleString('id-ID')}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                          <span>{item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SUBTOTAL</span><span>{receiptData.total.toLocaleString('id-ID')}</span></div>
                {receiptData.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DISKON</span><span>-{receiptData.discount.toLocaleString('id-ID')}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}><span>GRAND TOTAL</span><span>{receiptData.grandTotal.toLocaleString('id-ID')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}><span>TUNAI</span><span>{receiptData.payment.toLocaleString('id-ID')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>KEMBALI</span><span>{receiptData.change.toLocaleString('id-ID')}</span></div>
                <p style={{ textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>{storeInfo.greeting}</p>
              </div>
              <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button style={{ flex: 1, padding: '10px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: '4px' }} onClick={() => setReceiptData(null)}>Tutup</button>
                <button id="btn-print-receipt-mobile" style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }} onClick={handlePrint}>Cetak</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ background: '#000', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {storeInfo?.logo ? (
              <img src={storeInfo.logo} alt="Logo" style={{ maxHeight: '32px', objectFit: 'contain', borderRadius: '4px' }} />
            ) : (
              <span style={{background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '20px'}}>
                {storeInfo?.name?.[0]?.toUpperCase() || 'P'}
              </span>
            )}
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.2 }}>{storeInfo?.name || 'POS'}</div>
              {storeInfo?.address && (
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal', textTransform: 'none', lineHeight: 1.2 }}>📍 {storeInfo.address}</div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
          <div>
            <div style={{ color: '#aaa', fontSize: '11px', textAlign: 'right' }}>CUSTOMER:</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : 'CASH'}</div>
          </div>
          <div style={{ borderLeft: '1px solid #444', paddingLeft: '40px' }}>
            <div style={{ color: '#aaa', fontSize: '11px', textAlign: 'right' }}>TANGGAL:</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div style={{ borderLeft: '1px solid #444', paddingLeft: '40px' }}>
            <div style={{ color: '#aaa', fontSize: '11px', textAlign: 'right' }}>NO. PENJUALAN:</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>AUTO</div>
          </div>
          <div style={{ borderLeft: '1px solid #444', paddingLeft: '40px' }}>
            <div style={{ color: '#aaa', fontSize: '11px', textAlign: 'right', textTransform: 'uppercase' }}>KASIR:</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{kasirName}</div>
          </div>
        </div>
      </div>

      {/* TOP BAR */}
      <div style={{ background: '#fff', borderBottom: '4px solid #ef4444', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
          {scannerMode === 'camera' && (
            <div onClick={() => {
                if (scannerMode !== 'camera') setScannerMode('camera');
                toggleScanner();
              }} 
              style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', background: scanning ? '#ef4444' : '#333', color: '#fff', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {scanning ? '❌ TUTUP KAMERA' : '📷 BUKA KAMERA'}
            </div>
          )}
          <div style={{ width: '400px' }} id="product-search-container">
             <ProductSearch products={products} onSelect={addToCart} hideOutOfStock={true} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>Total</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#000', lineHeight: 1 }}>Rp. {grandTotal.toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#b91c1c', minHeight: '44px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          {discountRules.length > 0 ? (
            discountRules.map(rule => (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                🎟️ {rule.name} (Diskon {rule.discountPercent}%)
                {rule.minTransaction && Number(rule.minTransaction) > 0 ? ` - Min. Rp ${Number(rule.minTransaction).toLocaleString('id-ID')}` : ''}
                {rule.minItemQuantity && Number(rule.minItemQuantity) > 0 ? ` - Min. Qty ${rule.minItemQuantity}` : ''}
              </div>
            ))
          ) : (
             <div style={{ color: '#94a3b8' }}>Belum ada promo</div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: TABLE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', margin: '15px', borderRadius: '4px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          
          {scanning && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Pemindai Barcode</h3>
                  <button onClick={toggleScanner} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
                </div>
                <div id="barcode-reader" style={{ width: '100%', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}></div>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ background: '#dc2626', color: '#fff', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', borderRight: '1px solid #b91c1c' }}>No</th>
                  <th style={{ padding: '12px', borderRight: '1px solid #b91c1c' }}>Kode Item</th>
                  <th style={{ padding: '12px', borderRight: '1px solid #b91c1c' }}>Nama Item</th>
                  <th style={{ padding: '12px', borderRight: '1px solid #b91c1c', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '12px', borderRight: '1px solid #b91c1c', textAlign: 'right' }}>Harga</th>
                  <th style={{ padding: '12px', borderRight: '1px solid #b91c1c', textAlign: 'right' }}>Disc %</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal+Tax</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0' }}>{idx + 1}</td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0' }}>{item.sku || '-'}</td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateQuantity(item.id, e.target.value === '' ? '' : (parseInt(e.target.value) || 1))} onFocus={e => e.target.select()} style={{ width: '60px', textAlign: 'center', border: '1px solid #ccc', padding: '4px' }} />
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{item.price.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e2e8f0', textAlign: 'right', color: item.discountPercent && item.discountPercent > 0 ? '#ef4444' : 'inherit' }}>{item.discountPercent || 0}%</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{item.subtotal.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => removeItem(item.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>❌</button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Keranjang Kosong. Ketik nama barang atau scan barcode.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: SIDEBAR BUTTONS */}
        <div style={{ width: '250px', padding: '15px 15px 15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>👤 MEMBER</div>
            <SearchableSelect options={customers} value={selectedCustomer} onChange={setSelectedCustomer} placeholder="-- Umum --" />
            <button onClick={() => setShowAddCustomer(true)} style={{ padding: '6px', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>+ Pelanggan Baru</button>
            
            {(selectedCustomer || (payment !== '' && Number(payment) < grandTotal)) && (
              <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#b91c1c', display: 'block', marginBottom: '4px' }}>📅 Jatuh Tempo Kasbon:</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
              </div>
            )}
          </div>
          

          
          {cart.length > 0 && (
             <button onClick={clearCart} style={{ padding: '12px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginTop: 'auto' }}>🗑️ KOSONGKAN KERANJANG</button>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#fff', borderTop: '2px solid #e2e8f0', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#b91c1c', fontWeight: 'bold' }}>
          <div style={{ fontSize: '32px' }}>🚪</div>
          <div>
            <div style={{ fontSize: '14px' }}>KEMBALI</div>
          </div>
        </a>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', fontWeight: 'bold', fontSize: '14px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <span>Diskon:</span>
               <span style={{ width: '120px', textAlign: 'right', paddingRight: '6px', color: '#ef4444' }}>{Number(discount) > 0 ? `- ${Number(discount).toLocaleString('id-ID')}` : '0'}</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <span>PAJAK:</span>
               <span style={{ width: '120px', textAlign: 'right', paddingRight: '6px' }}>0</span>
             </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', fontWeight: 'bold', fontSize: '14px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <span>SUBTOTAL:</span>
               <span style={{ width: '140px', textAlign: 'right', paddingRight: '6px' }}>{total.toLocaleString('id-ID')}</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c' }}>
               <span>TOTAL:</span>
               <span style={{ width: '140px', textAlign: 'right', paddingRight: '6px', fontSize: '16px' }}>{grandTotal.toLocaleString('id-ID')}</span>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>UANG BAYAR (F4)</label>
             <input id="payment-input" type="number" value={payment} onChange={e => setPayment(e.target.value)} onFocus={e => e.target.select()} style={{ padding: '12px', fontSize: '20px', width: '200px', border: '2px solid #ccc', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold' }} placeholder="0" />
          </div>
          <button id="btn-pay" onClick={processTransaction} style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '0 40px', fontSize: '22px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(185, 28, 28, 0.3)' }}>
            🛒 BAYAR (F12)
          </button>
        </div>
      </div>
      
      {receiptData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '8px', padding: '20px' }}>
            <div id="receipt-content" style={{ color: '#000', fontFamily: 'monospace', fontSize: '13px' }}>
              {storeInfo.logo && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <img src={storeInfo.logo} alt="Logo" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                </div>
              )}
              <h2 style={{ textAlign: 'center', marginBottom: '5px', fontSize: '18px' }}>{storeInfo.name}</h2>
              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
              <p style={{ textAlign: 'center', margin: 0, color: '#666' }}>{receiptData.date.toLocaleString('id-ID')}</p>
              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '10px 0', margin: '10px 0' }}>
                {receiptData.items.map((item: CartItem, idx: number) => (
                  <div key={idx} style={{ marginBottom: '5px' }}>
                    <div>{item.name}</div>
                    {item.discountPercent && item.discountPercent > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', textDecoration: 'line-through' }}>
                          <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                          <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Disc {item.discountPercent}%</span>
                          <span>{item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                        <span>{item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SUBTOTAL</span><span>{receiptData.total.toLocaleString('id-ID')}</span></div>
              {receiptData.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DISKON</span><span>-{receiptData.discount.toLocaleString('id-ID')}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', marginTop: '5px' }}><span>GRAND TOTAL</span><span>{receiptData.grandTotal.toLocaleString('id-ID')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}><span>TUNAI</span><span>{receiptData.payment.toLocaleString('id-ID')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>KEMBALI</span><span>{receiptData.change.toLocaleString('id-ID')}</span></div>
              <p style={{ textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>{storeInfo.greeting}</p>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button style={{ flex: 1, padding: '10px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: '4px' }} onClick={() => setReceiptData(null)}>Tutup (Esc)</button>
              <button id="btn-print-receipt" style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }} onClick={handlePrint}>🖨️ Cetak (F9)</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI PEMBAYARAN */}
      {showConfirmTx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px auto' }}>🛒</div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Konfirmasi Transaksi</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Periksa kembali rincian pembayaran sebelum menyimpan.</p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', fontSize: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Total Belanja:</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Uang Pembayaran:</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Rp {Number(payment).toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px', fontWeight: 'bold' }}>
                <span style={{ color: Number(payment) < grandTotal ? '#dc2626' : '#16a34a' }}>
                  {Number(payment) < grandTotal ? 'Sisa Kasbon (Hutang):' : 'Uang Kembalian:'}
                </span>
                <span style={{ color: Number(payment) < grandTotal ? '#dc2626' : '#16a34a', fontSize: '16px' }}>
                  Rp {Math.abs(Number(payment) - grandTotal).toLocaleString('id-ID')}
                </span>
              </div>

              {Number(payment) < grandTotal && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' }}>📅 Tanggal Jatuh Tempo Kasbon:</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
                    required
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                disabled={isSubmittingTx}
                onClick={() => setShowConfirmTx(false)} 
                style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
              >
                Batal
              </button>
              <button 
                disabled={isSubmittingTx}
                onClick={executeTransaction} 
                style={{ flex: 1, padding: '12px', border: 'none', background: '#b91c1c', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isSubmittingTx ? 'Memproses...' : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>➕ Tambah Pelanggan</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowAddCustomer(false)}>×</button>
            </div>
            <form onSubmit={saveNewCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Nama</label>
                <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>No HP</label>
                <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <button type="submit" disabled={savingCustomer} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>{savingCustomer ? 'Menyimpan...' : 'Simpan'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
