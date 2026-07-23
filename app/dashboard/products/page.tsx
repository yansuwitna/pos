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
              <th>Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-muted)' }}>{p.sku || '-'}</td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>Rp {p.cost.toLocaleString('id-ID')}</td>
                <td>Rp {p.price.toLocaleString('id-ID')}</td>
                <td style={{ fontWeight: 600, color: p.stock < 5 ? '#ef4444' : 'inherit' }}>
                  {p.type === 'GOODS' ? p.stock : '-'}
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
