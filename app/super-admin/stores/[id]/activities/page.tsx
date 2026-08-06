'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Swal from 'sweetalert2';

export default function StoreActivitiesPage() {
  const routeParams = useParams();
  const storeId = routeParams?.id as string;
  const router = useRouter();

  const [store, setStore] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'transactions' | 'purchases' | 'returns' | 'opnames' | 'orders' | 'finances' | 'users'>('transactions');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [detailModalData, setDetailModalData] = useState<any>(null);
  const [detailModalType, setDetailModalType] = useState<string>('');

  useEffect(() => {
    if (storeId) {
      fetchStoreActivities();
    }
  }, [storeId]);

  const fetchStoreActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/stores/${storeId}/activities`);
      const data = await res.json();
      if (data.success) {
        setStore(data.store);
        setUsers(data.users || []);
        setActivities(data.activities || {});
      } else {
        Swal.fire('Gagal', data.message || 'Gagal mengambil kegiatan toko', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan sistem', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isWithinDateRange = (dateString?: string | Date) => {
    if (!dateString) return true;
    const target = new Date(dateString).getTime();
    if (isNaN(target)) return true;

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`).getTime();
      if (target < start) return false;
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`).getTime();
      if (target > end) return false;
    }
    return true;
  };

  const getDateRangeLabel = () => {
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString('id-ID')} s/d ${new Date(endDate).toLocaleDateString('id-ID')}`;
    }
    if (startDate) {
      return `Mulai ${new Date(startDate).toLocaleDateString('id-ID')}`;
    }
    if (endDate) {
      return `Hingga ${new Date(endDate).toLocaleDateString('id-ID')}`;
    }
    return 'Semua Periode Riwayat';
  };

  const handlePrintPage = () => {
    setDetailModalData(null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintDetail = (data: any, type: string) => {
    setDetailModalData(data);
    setDetailModalType(type);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* HEADER PAGE (SCREEN ONLY) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={() => router.push('/super-admin')} 
            style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            ⬅️ Kembali ke Dashboard Super Admin
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="gradient-text" style={{ fontSize: '1.8rem', margin: 0 }}>
              👁️ Pantau Kegiatan Toko: {store?.name || '...'}
            </h1>
            {store && (
              <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                Kode: {store.code}
              </span>
            )}
            <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              🛡️ Mode Read-Only (Super Admin)
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Inspeksi audit dan pantau seluruh aktivitas yang dilakukan oleh Kasir, Gudang, dan Manajer di toko ini.
          </p>
        </div>

        <button 
          onClick={handlePrintPage} 
          className="btn btn-success" 
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          🖨️ Cetak Laporan Kegiatan
        </button>
      </div>

      {/* DEDICATED PRINT AREA FOR WINDOW.PRINT() */}
      <div className="print-only" style={{ background: '#ffffff', color: '#000000', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        {/* Kop Toko Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '18pt', fontWeight: 'bold', color: '#000' }}>{store?.name || 'TOKO POS'}</h2>
          <p style={{ margin: 0, fontSize: '10pt', color: '#000' }}>Kode Toko: {store?.code} | Alamat: {store?.address || '-'} | Telp: {store?.phone || '-'}</p>
          <p style={{ margin: '3px 0 0 0', fontSize: '9pt', color: '#444' }}>
            Periode Laporan: <strong>{getDateRangeLabel()}</strong> | Tanggal Cetak: <span suppressHydrationWarning>{new Date().toLocaleString('id-ID')}</span>
          </p>
        </div>

        {/* CONDITION A: CETAK DETAIL SINGLE ITEM (TRANSAKSI / RESTOCK / RETUR / OPNAME / ORDER) */}
        {detailModalData ? (
          <div>
            <h3 style={{ textAlign: 'center', margin: '10px 0 15px 0', textTransform: 'uppercase', textDecoration: 'underline', color: '#000', fontSize: '13pt' }}>
              {detailModalType === 'transaction' ? 'BUKTI TRANSAKSI PENJUALAN KASIR' :
               detailModalType === 'purchase' ? 'BUKTI RESTOCK / PEMBELIAN BARANG GUDANG' :
               detailModalType === 'return' ? 'BUKTI RETUR BARANG GUDANG' :
               detailModalType === 'opname' ? 'BUKTI STOK OPNAME GUDANG' : 'BUKTI PESANAN (PO) MANAJER'}
            </h3>

            <table style={{ width: '100%', marginBottom: '15px', fontSize: '10pt', borderCollapse: 'collapse', color: '#000' }}>
              <tbody>
                <tr>
                  <td style={{ width: '18%', fontWeight: 'bold', padding: '4px 0' }}>Waktu & Tanggal:</td>
                  <td style={{ width: '32%', padding: '4px 0' }}>{new Date(detailModalData.createdAt).toLocaleString('id-ID')}</td>
                  <td style={{ width: '18%', fontWeight: 'bold', padding: '4px 0' }}>Diinput Oleh:</td>
                  <td style={{ width: '32%', padding: '4px 0' }}>{detailModalData.user?.name || '-'}</td>
                </tr>
                {detailModalData.customer && (
                  <tr>
                    <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Pelanggan:</td>
                    <td style={{ padding: '4px 0' }}>{detailModalData.customer.name}</td>
                    <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Status Pembayaran:</td>
                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>{detailModalData.paymentStatus === 'PAID' ? 'LUNAS' : 'KASBON / HUTANG'}</td>
                  </tr>
                )}
                {detailModalData.supplier && (
                  <tr>
                    <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Supplier:</td>
                    <td style={{ padding: '4px 0' }}>{detailModalData.supplier.name}</td>
                    <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Status Pembayaran:</td>
                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>{detailModalData.paymentStatus === 'PAID' ? 'LUNAS' : 'HUTANG'}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '15px', color: '#000' }}>
              <thead>
                <tr style={{ background: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Nama Barang</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Qty</th>
                  {detailModalType === 'transaction' && <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Harga</th>}
                  {detailModalType === 'purchase' && <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Harga Beli</th>}
                  {(detailModalType === 'transaction' || detailModalType === 'purchase') && <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Subtotal</th>}
                  {detailModalType === 'return' && <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Alasan Retur</th>}
                  {detailModalType === 'opname' && <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Selisih Stok</th>}
                </tr>
              </thead>
              <tbody>
                {detailModalData.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>{item.productName || item.product?.name || 'Produk Dihapus'}</td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity || item.actualStock}</td>
                    {detailModalType === 'transaction' && <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Rp {item.price?.toLocaleString('id-ID')}</td>}
                    {detailModalType === 'purchase' && <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Rp {item.unitCost?.toLocaleString('id-ID')}</td>}
                    {(detailModalType === 'transaction' || detailModalType === 'purchase') && (
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                    )}
                    {detailModalType === 'return' && <td style={{ border: '1px solid #000', padding: '5px' }}>{item.reason || '-'}</td>}
                    {detailModalType === 'opname' && <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{item.difference > 0 ? `+${item.difference}` : item.difference}</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            {detailModalType === 'transaction' && (
              <div style={{ textAlign: 'right', fontSize: '11pt', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>
                Total Transaksi: Rp {detailModalData.grandTotal?.toLocaleString('id-ID')}
              </div>
            )}

            {detailModalType === 'purchase' && (
              <div style={{ textAlign: 'right', fontSize: '11pt', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>
                Total Biaya Restock: Rp {detailModalData.totalCost?.toLocaleString('id-ID')}
              </div>
            )}

            {detailModalData.notes && (
              <p style={{ fontSize: '9pt', margin: '5px 0', color: '#000' }}><strong>Catatan:</strong> {detailModalData.notes}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '9pt', textAlign: 'center', color: '#000' }}>
              <div style={{ width: '30%' }}>
                <p style={{ margin: 0 }}>Petugas Input</p>
                <div style={{ height: '50px' }}></div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>( {detailModalData.user?.name || 'Petugas'} )</p>
              </div>
              <div style={{ width: '30%' }}>
                <p style={{ margin: 0 }}>Audit Super Admin</p>
                <div style={{ height: '50px' }}></div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>( Super Admin )</p>
              </div>
            </div>
          </div>
        ) : (
          /* CONDITION B: CETAK LAPORAN KATALOG TAB YANG AKTIF (TRANSAKSI / RESTOCK / RETUR / OPNAME / ORDER / BIAYA / STAF) */
          <div>
            <h3 style={{ textAlign: 'center', margin: '10px 0 15px 0', textTransform: 'uppercase', textDecoration: 'underline', color: '#000', fontSize: '13pt' }}>
              {activeTab === 'transactions' ? 'LAPORAN AUDIT TRANSAKSI PENJUALAN KASIR' :
               activeTab === 'purchases' ? 'LAPORAN AUDIT RESTOCK / PEMBELIAN BARANG GUDANG' :
               activeTab === 'returns' ? 'LAPORAN AUDIT RETUR BARANG GUDANG' :
               activeTab === 'opnames' ? 'LAPORAN AUDIT STOK OPNAME GUDANG' :
               activeTab === 'orders' ? 'LAPORAN AUDIT PESANAN (PO) MANAJER' :
               activeTab === 'finances' ? 'LAPORAN AUDIT BIAYA OPERASIONAL & MODAL USAHA' : 'LAPORAN AUDIT DAFTAR STAF TOKO'}
            </h3>

            {/* TABEL PRINT PENJUALAN KASIR */}
            {activeTab === 'transactions' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Waktu & Tanggal</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Petugas Kasir</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Pelanggan</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Jml Item</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Total Belanja</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.transactions
                    ?.filter((t: any) => {
                      if (!isWithinDateRange(t.createdAt)) return false;
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return t.user?.name?.toLowerCase().includes(q) ||
                             t.customer?.name?.toLowerCase().includes(q) ||
                             t.id.toLowerCase().includes(q) ||
                             t.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                    })
                    .map((t: any, idx: number) => (
                      <tr key={t.id}>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{t.user?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{t.customer?.name || 'Umum (Cash)'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{t.items?.length || 0}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Rp {t.grandTotal?.toLocaleString('id-ID')}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{t.paymentStatus === 'PAID' ? 'LUNAS' : 'KASBON'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* TABEL PRINT RESTOCK GUDANG */}
            {activeTab === 'purchases' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Waktu & Tanggal</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Petugas Gudang</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Supplier</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Total Biaya</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.purchases
                    ?.filter((p: any) => {
                      if (!isWithinDateRange(p.createdAt)) return false;
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return p.user?.name?.toLowerCase().includes(q) ||
                             p.supplier?.name?.toLowerCase().includes(q) ||
                             p.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                    })
                    .map((p: any, idx: number) => (
                      <tr key={p.id}>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{new Date(p.createdAt).toLocaleString('id-ID')}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{p.user?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{p.supplier?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Rp {p.totalCost?.toLocaleString('id-ID')}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{p.paymentStatus === 'PAID' ? 'LUNAS' : 'HUTANG'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* TABEL PRINT RETUR GUDANG */}
            {activeTab === 'returns' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Waktu & Tanggal</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Petugas Gudang</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Supplier</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Jml Item</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.returns
                    ?.filter((r: any) => {
                      if (!isWithinDateRange(r.createdAt)) return false;
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return r.user?.name?.toLowerCase().includes(q) ||
                             r.supplier?.name?.toLowerCase().includes(q) ||
                             r.notes?.toLowerCase().includes(q) ||
                             r.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                    })
                    .map((r: any, idx: number) => (
                      <tr key={r.id}>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{new Date(r.createdAt).toLocaleString('id-ID')}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{r.user?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{r.supplier?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{r.items?.length || 0}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{r.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* TABEL PRINT OPNAME GUDANG */}
            {activeTab === 'opnames' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Waktu & Tanggal</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Petugas Gudang</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Jml Barang Disesuaikan</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.opnames
                    ?.filter((o: any) => {
                      if (!isWithinDateRange(o.createdAt)) return false;
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return o.user?.name?.toLowerCase().includes(q) ||
                             o.notes?.toLowerCase().includes(q) ||
                             o.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                    })
                    .map((o: any, idx: number) => (
                      <tr key={o.id}>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{new Date(o.createdAt).toLocaleString('id-ID')}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{o.user?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{o.items?.length || 0} Macam</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{o.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* TABEL PRINT PESANAN PO MANAJER */}
            {activeTab === 'orders' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Waktu & Tanggal</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Manajer</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Supplier</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Jml Barang</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.orders
                    ?.filter((ord: any) => {
                      if (!isWithinDateRange(ord.createdAt)) return false;
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return ord.user?.name?.toLowerCase().includes(q) ||
                             ord.supplier?.name?.toLowerCase().includes(q) ||
                             ord.notes?.toLowerCase().includes(q) ||
                             ord.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                    })
                    .map((ord: any, idx: number) => (
                      <tr key={ord.id}>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{new Date(ord.createdAt).toLocaleString('id-ID')}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{ord.user?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{ord.supplier?.name || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{ord.items?.length || 0}</td>
                        <td style={{ border: '1px solid #000', padding: '5px' }}>{ord.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* TABEL PRINT BIAYA & MODAL */}
            {activeTab === 'finances' && (
              <div>
                <h4 style={{ margin: '10px 0 5px 0', fontSize: '10pt', textDecoration: 'underline' }}>Biaya Operasional Toko</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000', marginBottom: '15px' }}>
                  <thead>
                    <tr style={{ background: '#f2f2f2' }}>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>No</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Tanggal</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Diinput Oleh</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Kategori</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Jumlah Biaya</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities?.expenses
                      ?.filter((e: any) => {
                        if (!isWithinDateRange(e.date)) return false;
                        if (!search) return true;
                        const q = search.toLowerCase();
                        return e.user?.name?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
                      })
                      .map((e: any, idx: number) => (
                        <tr key={e.id}>
                          <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '5px' }}>{new Date(e.date).toLocaleDateString('id-ID')}</td>
                          <td style={{ border: '1px solid #000', padding: '5px' }}>{e.user?.name || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{e.category}</td>
                          <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Rp {e.amount?.toLocaleString('id-ID')}</td>
                          <td style={{ border: '1px solid #000', padding: '5px' }}>{e.description || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <h4 style={{ margin: '10px 0 5px 0', fontSize: '10pt', textDecoration: 'underline' }}>Modal Usaha Toko</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000' }}>
                  <thead>
                    <tr style={{ background: '#f2f2f2' }}>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>No</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Tanggal</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Diinput Oleh</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Nominal Modal</th>
                      <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities?.capitals
                      ?.filter((c: any) => {
                        if (!isWithinDateRange(c.date)) return false;
                        if (!search) return true;
                        const q = search.toLowerCase();
                        return c.user?.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
                      })
                      .map((c: any, idx: number) => (
                        <tr key={c.id}>
                          <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '5px' }}>{new Date(c.date).toLocaleDateString('id-ID')}</td>
                          <td style={{ border: '1px solid #000', padding: '5px' }}>{c.user?.name || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Rp {c.amount?.toLocaleString('id-ID')}</td>
                          <td style={{ border: '1px solid #000', padding: '5px' }}>{c.description || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABEL PRINT STAF TOKO */}
            {activeTab === 'users' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', color: '#000' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Nama Staf</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Username</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Role / Jabatan</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Status</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Tgl Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u: any, idx: number) => (
                    <tr key={u.id}>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{u.name}</td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{u.username}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{u.role}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{u.isActive ? 'Aktif' : 'Nonaktif'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '9pt', textAlign: 'center', color: '#000' }}>
              <div style={{ width: '30%' }}>
                <p style={{ margin: 0 }}>Mengetahui, Manajer Toko</p>
                <div style={{ height: '50px' }}></div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>( Manajer )</p>
              </div>
              <div style={{ width: '30%' }}>
                <p style={{ margin: 0 }}>Super Admin (Audit)</p>
                <div style={{ height: '50px' }}></div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>( Super Admin )</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card no-print" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Memuat seluruh riwayat aktivitas toko...</p>
        </div>
      ) : (
        <div className="no-print">
          {/* TABS NAVIGATION */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTab('transactions')}
              style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'transactions' ? '#2563eb' : 'transparent', color: activeTab === 'transactions' ? '#fff' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🛍️ Kasir: Transaksi Penjualan ({activities?.transactions?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('purchases')}
              style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'purchases' ? '#2563eb' : 'transparent', color: activeTab === 'purchases' ? '#fff' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              📥 Gudang: Restock ({activities?.purchases?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('returns')}
              style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'returns' ? '#2563eb' : 'transparent', color: activeTab === 'returns' ? '#fff' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              📤 Gudang: Retur ({activities?.returns?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('opnames')}
              style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'opnames' ? '#2563eb' : 'transparent', color: activeTab === 'opnames' ? '#fff' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              📋 Gudang: Opname ({activities?.opnames?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'orders' ? '#2563eb' : 'transparent', color: activeTab === 'orders' ? '#fff' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              📝 Manajer: Pesanan PO ({activities?.orders?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('finances')}
              style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'finances' ? '#2563eb' : 'transparent', color: activeTab === 'finances' ? '#fff' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              💸 Manajer: Biaya & Modal
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'users' ? '#2563eb' : 'transparent', color: activeTab === 'users' ? '#fff' : 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              👥 Staf Toko ({users?.length || 0})
            </button>
          </div>

          {/* SEARCH & RENTANG WAKTU FILTER CARD */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  🔎 Pencarian Kata Kunci:
                </label>
                <input 
                  type="text"
                  placeholder="Cari nama petugas, supplier, pelanggan, item..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  📅 Tanggal Mulai:
                </label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  📅 Tanggal Akhir:
                </label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setStartDate(today);
                    setEndDate(today);
                  }}
                  style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Hari Ini
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    const today = now.toISOString().split('T')[0];
                    setStartDate(firstDay);
                    setEndDate(today);
                  }}
                  style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Bulan Ini
                </button>
                {(startDate || endDate || search) && (
                  <button 
                    type="button" 
                    onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); }}
                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🧹 Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CONTENT CARD */}
          <div className="card">
            {/* TAB 1: TRANSAKSI PENJUALAN (KASIR) */}
            {activeTab === 'transactions' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>🛍️ Riwayat Transaksi Penjualan Kasir</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu & Tanggal</th>
                        <th>Petugas Kasir</th>
                        <th>Pelanggan</th>
                        <th>Jml Barang</th>
                        <th>Total Belanja</th>
                        <th>Status Pembayaran</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.transactions
                        ?.filter((t: any) => {
                          if (!isWithinDateRange(t.createdAt)) return false;
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return t.user?.name?.toLowerCase().includes(q) ||
                                 t.customer?.name?.toLowerCase().includes(q) ||
                                 t.id.toLowerCase().includes(q) ||
                                 t.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                        })
                        .map((t: any) => (
                          <tr key={t.id}>
                            <td>{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                            <td style={{ fontWeight: 600 }}>👤 {t.user?.name || '-'}</td>
                            <td>{t.customer?.name || 'Umum (Cash)'}</td>
                            <td>{t.items?.length || 0} Item</td>
                            <td style={{ fontWeight: 'bold', color: '#16a34a' }}>Rp {t.grandTotal?.toLocaleString('id-ID')}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: t.paymentStatus === 'PAID' ? '#dcfce7' : '#fee2e2', color: t.paymentStatus === 'PAID' ? '#15803d' : '#dc2626' }}>
                                {t.paymentStatus === 'PAID' ? 'LUNAS' : 'KASBON / HUTANG'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => { setDetailModalData(t); setDetailModalType('transaction'); }}
                              >
                                👁️ Detail Item
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {(!activities?.transactions || activities.transactions.length === 0) && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data transaksi penjualan kasir.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: RESTOCK / PEMBELIAN (GUDANG) */}
            {activeTab === 'purchases' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>📥 Riwayat Restock / Pembelian Barang Gudang</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu & Tanggal</th>
                        <th>Petugas Gudang</th>
                        <th>Supplier</th>
                        <th>Total Biaya</th>
                        <th>Status Bayar</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.purchases
                        ?.filter((p: any) => {
                          if (!isWithinDateRange(p.createdAt)) return false;
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return p.user?.name?.toLowerCase().includes(q) ||
                                 p.supplier?.name?.toLowerCase().includes(q) ||
                                 p.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                        })
                        .map((p: any) => (
                          <tr key={p.id}>
                            <td>{new Date(p.createdAt).toLocaleString('id-ID')}</td>
                            <td style={{ fontWeight: 600 }}>📦 {p.user?.name || '-'}</td>
                            <td>{p.supplier?.name || '-'}</td>
                            <td style={{ fontWeight: 'bold', color: '#0284c7' }}>Rp {p.totalCost?.toLocaleString('id-ID')}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: p.paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7', color: p.paymentStatus === 'PAID' ? '#15803d' : '#d97706' }}>
                                {p.paymentStatus === 'PAID' ? 'LUNAS' : 'HUTANG'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => { setDetailModalData(p); setDetailModalType('purchase'); }}
                              >
                                👁️ Detail Item
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {(!activities?.purchases || activities.purchases.length === 0) && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data restock / pembelian gudang.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: RETUR BARANG (GUDANG) */}
            {activeTab === 'returns' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>📤 Riwayat Retur Barang Gudang</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu & Tanggal</th>
                        <th>Petugas Gudang</th>
                        <th>Supplier Tujuan</th>
                        <th>Jml Barang</th>
                        <th>Catatan</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.returns
                        ?.filter((r: any) => {
                          if (!isWithinDateRange(r.createdAt)) return false;
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return r.user?.name?.toLowerCase().includes(q) ||
                                 r.supplier?.name?.toLowerCase().includes(q) ||
                                 r.notes?.toLowerCase().includes(q) ||
                                 r.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                        })
                        .map((r: any) => (
                          <tr key={r.id}>
                            <td>{new Date(r.createdAt).toLocaleString('id-ID')}</td>
                            <td style={{ fontWeight: 600 }}>📦 {r.user?.name || '-'}</td>
                            <td>{r.supplier?.name || '-'}</td>
                            <td>{r.items?.length || 0} Macam</td>
                            <td>{r.notes || '-'}</td>
                            <td>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => { setDetailModalData(r); setDetailModalType('return'); }}
                              >
                                👁️ Detail Item
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {(!activities?.returns || activities.returns.length === 0) && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data retur barang dari gudang.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: STOK OPNAME (GUDANG) */}
            {activeTab === 'opnames' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>📋 Riwayat Stok Opname Gudang</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu & Tanggal</th>
                        <th>Petugas Gudang</th>
                        <th>Jml Barang Disesuaikan</th>
                        <th>Catatan</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.opnames
                        ?.filter((o: any) => {
                          if (!isWithinDateRange(o.createdAt)) return false;
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return o.user?.name?.toLowerCase().includes(q) ||
                                 o.notes?.toLowerCase().includes(q) ||
                                 o.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                        })
                        .map((o: any) => (
                          <tr key={o.id}>
                            <td>{new Date(o.createdAt).toLocaleString('id-ID')}</td>
                            <td style={{ fontWeight: 600 }}>📦 {o.user?.name || '-'}</td>
                            <td>{o.items?.length || 0} Macam Barang</td>
                            <td>{o.notes || '-'}</td>
                            <td>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => { setDetailModalData(o); setDetailModalType('opname'); }}
                              >
                                👁️ Detail Item
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {(!activities?.opnames || activities.opnames.length === 0) && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data stok opname dari gudang.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: PESANAN PO (MANAJER) */}
            {activeTab === 'orders' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>📝 Riwayat Pesanan (Purchase Order) Manajer</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu & Tanggal</th>
                        <th>Pemesan / Manajer</th>
                        <th>Supplier Tujuan</th>
                        <th>Jml Barang</th>
                        <th>Catatan</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.orders
                        ?.filter((ord: any) => {
                          if (!isWithinDateRange(ord.createdAt)) return false;
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return ord.user?.name?.toLowerCase().includes(q) ||
                                 ord.supplier?.name?.toLowerCase().includes(q) ||
                                 ord.notes?.toLowerCase().includes(q) ||
                                 ord.items?.some((i: any) => i.productName?.toLowerCase().includes(q) || i.product?.name?.toLowerCase().includes(q));
                        })
                        .map((ord: any) => (
                          <tr key={ord.id}>
                            <td>{new Date(ord.createdAt).toLocaleString('id-ID')}</td>
                            <td style={{ fontWeight: 600 }}>👑 {ord.user?.name || '-'}</td>
                            <td>{ord.supplier?.name || '-'}</td>
                            <td>{ord.items?.length || 0} Macam</td>
                            <td>{ord.notes || '-'}</td>
                            <td>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => { setDetailModalData(ord); setDetailModalType('order'); }}
                              >
                                👁️ Detail Item
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {(!activities?.orders || activities.orders.length === 0) && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada data pesanan (PO) manajer.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: BIAYA & MODAL (MANAJER) */}
            {activeTab === 'finances' && (
              <div>
                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem 0' }}>💸 Biaya Operasional Toko</h3>
                <div className="table-container" style={{ marginBottom: '2rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Diinput Oleh</th>
                        <th>Kategori Biaya</th>
                        <th>Jumlah Biaya</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.expenses
                        ?.filter((e: any) => {
                          if (!isWithinDateRange(e.date)) return false;
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return e.user?.name?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
                        })
                        .map((e: any) => (
                          <tr key={e.id}>
                            <td>{new Date(e.date).toLocaleDateString('id-ID')}</td>
                            <td>👑 {e.user?.name || '-'}</td>
                            <td style={{ fontWeight: 600 }}>{e.category}</td>
                            <td style={{ fontWeight: 'bold', color: '#dc2626' }}>Rp {e.amount?.toLocaleString('id-ID')}</td>
                            <td>{e.description || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ fontSize: '1rem', margin: '0 0 0.75rem 0' }}>💰 Modal Usaha Toko</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Diinput Oleh</th>
                        <th>Nominal Modal</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.capitals
                        ?.filter((c: any) => {
                          if (!isWithinDateRange(c.date)) return false;
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return c.user?.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
                        })
                        .map((c: any) => (
                          <tr key={c.id}>
                            <td>{new Date(c.date).toLocaleDateString('id-ID')}</td>
                            <td>👑 {c.user?.name || '-'}</td>
                            <td style={{ fontWeight: 'bold', color: '#16a34a' }}>Rp {c.amount?.toLocaleString('id-ID')}</td>
                            <td>{c.description || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 7: STAF TOKO */}
            {activeTab === 'users' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>👥 Daftar Seluruh Staf Pengguna Toko</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama Staf</th>
                        <th>Username</th>
                        <th>Role / Jabatan</th>
                        <th>Status Akun</th>
                        <th>Tanggal Terdaftar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        ?.filter((u: any) => {
                          if (!search) return true;
                          const q = search.toLowerCase();
                          return u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
                        })
                        .map((u: any) => (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                            <td>{u.username}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'WAREHOUSE' ? '#fef3c7' : '#dcfce7', color: u.role === 'ADMIN' ? '#b91c1c' : u.role === 'WAREHOUSE' ? '#b45309' : '#15803d' }}>
                                {u.role === 'ADMIN' ? '👑 Manager' : u.role === 'WAREHOUSE' ? '📦 Gudang' : '🛍️ Kasir'}
                              </span>
                            </td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#15803d' : '#dc2626' }}>
                                {u.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td>{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL ITEM MODAL (POPUP ON SCREEN) */}
      {detailModalData && (
        <div className="modal-overlay no-print" style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {detailModalType === 'transaction' ? '🧾 Rincian Transaksi Penjualan Kasir' :
                 detailModalType === 'purchase' ? '📦 Rincian Restock / Pembelian Gudang' :
                 detailModalType === 'return' ? '📤 Rincian Retur Barang Gudang' :
                 detailModalType === 'opname' ? '📋 Rincian Stok Opname Gudang' : '📝 Rincian Pesanan PO Manajer'}
              </h2>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setDetailModalData(null)}>Tutup</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div><strong>Waktu:</strong> {new Date(detailModalData.createdAt).toLocaleString('id-ID')}</div>
                <div><strong>Diinput Oleh:</strong> {detailModalData.user?.name || '-'}</div>
                {detailModalData.customer && <div><strong>Pelanggan:</strong> {detailModalData.customer.name}</div>}
                {detailModalData.supplier && <div><strong>Supplier:</strong> {detailModalData.supplier.name}</div>}
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Barang</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      {detailModalType === 'transaction' && <th style={{ textAlign: 'right' }}>Harga</th>}
                      {detailModalType === 'purchase' && <th style={{ textAlign: 'right' }}>Harga Beli</th>}
                      {(detailModalType === 'transaction' || detailModalType === 'purchase') && <th style={{ textAlign: 'right' }}>Subtotal</th>}
                      {detailModalType === 'return' && <th>Alasan</th>}
                      {detailModalType === 'opname' && <th style={{ textAlign: 'center' }}>Selisih</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {detailModalData.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.productName || item.product?.name || 'Produk Dihapus'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity || item.actualStock}</td>
                        {detailModalType === 'transaction' && <td style={{ textAlign: 'right' }}>Rp {item.price?.toLocaleString('id-ID')}</td>}
                        {detailModalType === 'purchase' && <td style={{ textAlign: 'right' }}>Rp {item.unitCost?.toLocaleString('id-ID')}</td>}
                        {(detailModalType === 'transaction' || detailModalType === 'purchase') && (
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                        )}
                        {detailModalType === 'return' && <td>{item.reason || '-'}</td>}
                        {detailModalType === 'opname' && (
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: item.difference < 0 ? '#dc2626' : '#16a34a' }}>
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detailModalData.notes && (
                <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>Catatan:</strong> {detailModalData.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDetailModalData(null)}>Tutup</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handlePrintDetail(detailModalData, detailModalType)}>
                  🖨️ Cetak Bukti Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
