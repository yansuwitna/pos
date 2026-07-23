import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import LayoutWrapper from "./components/LayoutWrapper";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "POS Pro - Point of Sale",
  description: "Point of Sale Modern Web App",
};

const roleNavLinks: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: '/dashboard', label: '🏠 Dashboard' },
    { href: '/dashboard/products', label: '📦 Stok Barang' },
    { href: '/users',     label: '👥 Manajemen User' },
    { href: '/reports',   label: '📊 Laporan' },
    { href: '/backup',    label: '💾 Backup / Restore' },
    { href: '/settings',  label: '⚙️ Pengaturan' },
  ],
  CASHIER: [
    { href: '/dashboard', label: '🏠 Dashboard' },
    { href: '/pos',     label: '🛍️ Transaksi (Kasir)' },
    { href: '/settings',label: '⚙️ Pengaturan' },
  ],
  WAREHOUSE: [
    { href: '/dashboard', label: '🏠 Dashboard' },
    { href: '/manager', label: '📦 Manajemen Barang' },
    { href: '/manager/orders', label: '📝 Pesanan (PO)' },
    { href: '/manager/purchase', label: '📥 Restock' },
    { href: '/manager/return', label: '📤 Retur' },
    { href: '/manager/suppliers', label: '🏢 Supplier' },
    { href: '/settings', label: '⚙️ Pengaturan' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const role = session?.role as string | undefined;
  const name = session?.name as string | undefined;
  const links = role ? (roleNavLinks[role] ?? []) : [];

  return (
    <html lang="id" className={poppins.className}>
      <body>
        {session ? (
          <LayoutWrapper role={role!} name={name!} links={links}>
            {children}
          </LayoutWrapper>
        ) : (
          <main className="main-content">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
