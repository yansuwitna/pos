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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat Laporan Keuangan...</div>;
  if (!reportData) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Gagal memuat data laporan.</div>;

  const { labaRugi, neraca } = reportData;

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* FILTER CARD */}
      <div className="card no-print" style={{ marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <h2 className="card-title">📅 Filter Laporan</h2>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '160px' }}>
            <label>Dari Tanggal</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px', minWidth: '160px' }}>
            <label>Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">Terapkan</button>
            <button type="button" className="btn btn-outline" onClick={clearFilter}>Reset</button>
            <button type="button" className="btn btn-success" onClick={printReport}>🖨️ Cetak</button>
          </div>
        </form>
      </div>

      {/* PRINT AREA / CONTENT AREA */}
      <div className="print-area" style={{ width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.6rem', fontWeight: 'bold' }}>LAPORAN KEUANGAN</h1>
        {startDate && endDate && (
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Periode: {new Date(startDate).toLocaleDateString('id-ID')} s/d {new Date(endDate).toLocaleDateString('id-ID')}
          </p>
        )}
        
        {/* RESPONSIVE GRID CONTAINER FOR LABA RUGI & NERACA */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem', 
          width: '100%', 
          boxSizing: 'border-box' 
        }}>
          
          {/* LABA RUGI CARD */}
          <div className="card" style={{ 
            padding: '1.5rem', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            boxShadow: 'none', 
            width: '100%', 
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
              📊 LAPORAN LABA RUGI
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', color: '#334155' }}>Pendapatan (Penjualan)</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {labaRugi.pendapatan.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', color: '#334155' }}>Harga Pokok Penjualan (HPP)</span>
              <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.95rem', marginLeft: 'auto', textAlign: 'right' }}>
                - Rp {labaRugi.hpp.toLocaleString('id-ID')}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', color: '#1e293b' }}>Laba Kotor</span>
              <span style={{ fontSize: '1rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {labaRugi.labaKotor.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', color: '#334155' }}>Beban Operasional</span>
              <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.95rem', marginLeft: 'auto', textAlign: 'right' }}>
                - Rp {labaRugi.beban.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #0f172a', fontWeight: 'bold', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', color: '#0f172a' }}>LABA BERSIH</span>
              <span style={{ color: labaRugi.labaBersih >= 0 ? '#16a34a' : '#ef4444', fontSize: '1.15rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {labaRugi.labaBersih.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* NERACA CARD */}
          <div className="card" style={{ 
            padding: '1.5rem', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            boxShadow: 'none', 
            width: '100%', 
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
              ⚖️ NERACA (Semua Periode)
            </h3>
            
            <h4 style={{ color: '#475569', marginBottom: '0.5rem', fontSize: '0.9rem', letterSpacing: '0.5px' }}>AKTIVA (ASET)</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', paddingLeft: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#334155' }}>Kas & Bank</span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {neraca.aktiva.kas.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', paddingLeft: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#334155' }}>Piutang Pelanggan</span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {neraca.aktiva.piutang.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', paddingLeft: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#334155' }}>Persediaan Barang</span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {neraca.aktiva.persediaan.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', color: '#0f172a' }}>Total Aktiva</span>
              <span style={{ fontSize: '1rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {neraca.aktiva.totalAktiva.toLocaleString('id-ID')}
              </span>
            </div>

            <h4 style={{ color: '#475569', marginBottom: '0.5rem', marginTop: '1.25rem', fontSize: '0.9rem', letterSpacing: '0.5px' }}>PASIVA (KEWAJIBAN & EKUITAS)</h4>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', paddingLeft: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#334155' }}>Hutang Usaha</span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {neraca.pasiva.hutang.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', paddingLeft: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#334155' }}>Ekuitas / Modal Bersih</span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {neraca.pasiva.ekuitas.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', color: '#0f172a' }}>Total Pasiva</span>
              <span style={{ fontSize: '1rem', marginLeft: 'auto', textAlign: 'right' }}>
                Rp {neraca.pasiva.totalPasiva.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
