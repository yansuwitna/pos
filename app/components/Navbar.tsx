'use client';
import { useState } from 'react';

type Props = {
  role: string;
  name: string;
  links: { href: string; label: string }[];
};

const roleLabels: Record<string, string> = {
  ADMIN:     '👑 Admin',
  CASHIER:   '🛍️ Kasir',
  WAREHOUSE: '📦 Gudang',
};

export default function Navbar({ role, name, links }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar no-print">
      <div className="nav-container">
        <div className="nav-brand">POS<span>Pro</span></div>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? '✖' : '☰'}
        </button>
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          {links.map(link => (
            <a key={link.href} href={link.href} className="nav-link">{link.label}</a>
          ))}
          <div className="nav-user">
            <span className="nav-role-badge">{roleLabels[role] ?? role}</span>
            <span className="nav-username">{name}</span>
            <a href="/api/auth/logout" className="nav-btn-logout">🚪 Keluar</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
