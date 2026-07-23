'use client';
import { useState, useRef, useEffect } from 'react';

type Product = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  cost: number;
  stock: number;
};

type Props = {
  products: Product[];
  onSelect: (product: Product) => void;
  placeholder?: string;
  width?: string;
};

export default function ProductSearch({ products, onSelect, placeholder = "Ketik Nama Barang / SKU...", width = '100%' }: Props) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown if clicked outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = products.filter(p => {
    if (!search) return false;
    const q = search.toLowerCase();
    return (p.sku && p.sku.toLowerCase().includes(q)) || p.name.toLowerCase().includes(q);
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width }}>
      <input 
        type="text" 
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        style={{ width: '100%', marginBottom: 0 }}
      />
      
      {showDropdown && search && (
        <ul style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          background: 'var(--bg)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-md)', 
          zIndex: 50, 
          maxHeight: '250px', 
          overflowY: 'auto',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          marginTop: '4px', 
          padding: 0, 
          listStyle: 'none'
        }}>
          {filtered.length > 0 ? filtered.map(p => (
            <li 
              key={p.id} 
              onClick={() => {
                onSelect(p);
                setSearch('');
                setShowDropdown(false);
              }}
              style={{ 
                padding: '0.75rem 1rem', 
                cursor: 'pointer', 
                borderBottom: '1px solid var(--border)' 
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                SKU: {p.sku || '-'} | Stok: {p.stock} | Rp {p.price.toLocaleString('id-ID')}
              </div>
            </li>
          )) : (
            <li style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Barang tidak ditemukan</li>
          )}
        </ul>
      )}
    </div>
  );
}
