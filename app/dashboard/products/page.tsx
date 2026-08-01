'use client';
import { useState, useEffect } from 'react';

type Product = {
  id: string;
  sku: string | null;
  name: string;
  type: 'GOODS' | 'SERVICE';
  price: number;
  cost: number;
  stock: number;
  discountPercent?: number;
  totalBought?: number;
  totalReturned?: number;
  totalSold?: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) setProducts(data.products);
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.includes(search))
  );

  return (
    <div className="card">
      <h2 className="card-title">📦 Info Stok Barang</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Halaman ini hanya untuk memantau stok. Penambahan barang atau restock dilakukan oleh bagian Gudang.</p>
      
      <div className="form-group">
        <input 
          type="text" 
          placeholder="Cari nama barang atau SKU..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nama</th>
              <th>Harga Modal</th>
              <th>Harga Jual</th>
              <th>Diskon (%)</th>
              <th style={{ textAlign: 'center' }}>Jml Beli</th>
              <th style={{ textAlign: 'center' }}>Jml Return</th>
              <th style={{ textAlign: 'center' }}>Jml Jual</th>
              <th style={{ textAlign: 'center' }}>Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-muted)' }}>{p.sku || '-'}</td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>Rp {p.cost.toLocaleString('id-ID')}</td>
                <td>Rp {p.price.toLocaleString('id-ID')}</td>
                <td style={{ color: p.discountPercent && p.discountPercent > 0 ? '#b91c1c' : 'inherit' }}>{p.discountPercent || 0}%</td>
                <td style={{ textAlign: 'center' }}>
                  {p.type === 'GOODS' ? (
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      {p.totalBought ?? 0}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {p.type === 'GOODS' ? (
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#fef3c7', color: '#b45309' }}>
                      {p.totalReturned ?? 0}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
                    {p.totalSold ?? 0}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {p.type === 'GOODS' ? (
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: p.stock < 5 ? '#fee2e2' : '#dcfce7', color: p.stock < 5 ? '#991b1b' : '#166534' }}>
                      {p.stock}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Barang tidak ditemukan.</p>}
      </div>
    </div>
  );
}
