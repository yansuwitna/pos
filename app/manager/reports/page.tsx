'use client';
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (overrideStart?: string, overrideEnd?: string) => {
    setLoading(true);
    let url = '/api/finances/reports';
    const sDate = overrideStart !== undefined ? overrideStart : startDate;
    const eDate = overrideEnd !== undefined ? overrideEnd : endDate;
    
    if (sDate && eDate) {
      url += `?startDate=${sDate}&endDate=${eDate}`;
    }
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchReports('', '');
  };

  const printReport = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat Laporan...</div>;
  if (!reportData) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Gagal memuat data laporan.</div>;

  const { labaRugi, neraca } = reportData;

  return (
    <div>
      <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">📅 Filter Laporan</h2>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Dari Tanggal</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Terapkan</button>
          <button type="button" className="btn btn-outline" onClick={clearFilter}>Reset</button>
          <button type="button" className="btn btn-success" onClick={printReport}>🖨️ Cetak</button>
        </form>
      </div>

      <div className="print-area">
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: 'bold' }}>LAPORAN KEUANGAN</h1>
        {startDate && endDate && (
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
            Periode: {new Date(startDate).toLocaleDateString('id-ID')} s/d {new Date(endDate).toLocaleDateString('id-ID')}
          </p>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* LABA RUGI */}
          <div className="card" style={{ padding: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>LAPORAN LABA RUGI</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Pendapatan (Penjualan)</span>
              <span style={{ fontWeight: 600 }}>Rp {labaRugi.pendapatan.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Harga Pokok Penjualan (HPP)</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>- Rp {labaRugi.hpp.toLocaleString('id-ID')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ccc', fontWeight: 'bold' }}>
              <span>Laba Kotor</span>
              <span>Rp {labaRugi.labaKotor.toLocaleString('id-ID')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              <span>Beban Operasional</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>- Rp {labaRugi.beban.toLocaleString('id-ID')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #000', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>LABA BERSIH</span>
              <span style={{ color: labaRugi.labaBersih >= 0 ? '#16a34a' : '#ef4444' }}>
                Rp {labaRugi.labaBersih.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* NERACA */}
          <div className="card" style={{ padding: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>NERACA (Semua Periode)</h3>
            
            <h4 style={{ color: '#555', marginBottom: '0.5rem' }}>AKTIVA (ASET)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
              <span>Kas & Bank</span>
              <span>Rp {neraca.aktiva.kas.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
              <span>Piutang Pelanggan</span>
              <span>Rp {neraca.aktiva.piutang.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
              <span>Persediaan Barang</span>
              <span>Rp {neraca.aktiva.persediaan.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ccc', fontWeight: 'bold' }}>
              <span>Total Aktiva</span>
              <span>Rp {neraca.aktiva.totalAktiva.toLocaleString('id-ID')}</span>
            </div>

            <h4 style={{ color: '#555', marginBottom: '0.5rem', marginTop: '1.5rem' }}>PASIVA (KEWAJIBAN & EKUITAS)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
              <span>Hutang Usaha</span>
              <span>Rp {neraca.pasiva.hutang.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
              <span>Ekuitas / Modal Bersih</span>
              <span>Rp {neraca.pasiva.ekuitas.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ccc', fontWeight: 'bold' }}>
              <span>Total Pasiva</span>
              <span>Rp {neraca.pasiva.totalPasiva.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
