'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  role: string;
  name: string;
  storeName?: string;
  links: { href: string; label: string }[];
  children: React.ReactNode;
};

const roleLabels: Record<string, string> = {
  ADMIN:     '👑 Manager',
  CASHIER:   '🛍️ Kasir',
  WAREHOUSE: '📦 Gudang',
};

export default function LayoutWrapper({ role, name, storeName: initialStoreName, links, children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Untuk Desktop
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false); // Untuk Mobile
  const pathname = usePathname();

  const [storeInfo, setStoreInfo] = useState<{ name?: string; logo?: string } | null>(
    initialStoreName ? { name: initialStoreName } : null
  );

  useEffect(() => {
    fetch('/api/settings/store')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.storeInfo) {
          setStoreInfo(data.storeInfo);
        }
      })
      .catch(() => {});
  }, []);

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

        <div className="sidebar-footer">
          {storeInfo?.name && (
            <div className="sidebar-store-name">
              <span>🏪</span>
              <span>{storeInfo.name}</span>
            </div>
          )}
          <div className="sidebar-user-info">
            <span className="nav-role-badge">{roleLabels[role] ?? role}</span>
            <span className="sidebar-username">{name}</span>
          </div>
          <a href="/api/auth/logout" className="nav-btn-logout sidebar-logout">🚪 Keluar</a>
        </div>
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
              {/* STORE NAME BADGE IN TOP NAVBAR */}
              {storeInfo?.name && (
                <div 
                  className="nav-store-badge" 
                  title={`Toko: ${storeInfo.name}`}
                >
                  <span>🏪</span>
                  <span className="nav-store-badge-text">{storeInfo.name}</span>
                </div>
              )}

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
