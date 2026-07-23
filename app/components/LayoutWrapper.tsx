'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  role: string;
  name: string;
  links: { href: string; label: string }[];
  children: React.ReactNode;
};

const roleLabels: Record<string, string> = {
  ADMIN:     '👑 Admin',
  CASHIER:   '🛍️ Kasir',
  WAREHOUSE: '📦 Gudang',
};

export default function LayoutWrapper({ role, name, links, children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Untuk Desktop
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false); // Untuk Mobile
  const pathname = usePathname();

  // Find current page title
  const currentLink = links.find(l => l.href === pathname);
  const pageTitle = currentLink ? currentLink.label : 'Aplikasi POS';

  return (
    <div className="app-layout">
      {/* Sidebar Overlay for Mobile */}
      {sidebarMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarMobileOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMobileOpen ? 'mobile-open' : ''} no-print`}>
        <div className="sidebar-brand">
          POS<span>Pro</span>
          <button className="mobile-close-btn" onClick={() => setSidebarMobileOpen(false)}>✖</button>
        </div>
        <nav className="sidebar-nav">
          {links.map(link => (
            <a 
              key={link.href} 
              href={link.href} 
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => setSidebarMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Wrapper */}
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Top Navbar */}
        <header className="top-navbar no-print">
          <div className="navbar-left">
            <button className="sidebar-toggle desktop-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              ☰
            </button>
            <button className="sidebar-toggle mobile-toggle" onClick={() => setSidebarMobileOpen(true)}>
              ☰
            </button>
            <h1 className="page-title">{pageTitle}</h1>
          </div>
          
          <div className="navbar-right">
            <div className="nav-user">
              <span className="nav-role-badge">{roleLabels[role] ?? role}</span>
              <span className="nav-username">{name}</span>
              <a href="/api/auth/logout" className="nav-btn-logout">🚪 Keluar</a>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
