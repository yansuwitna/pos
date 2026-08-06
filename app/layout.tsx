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
// Force update

const roleNavLinks: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: '/dashboard', label: '🏠 Dashboard' },
    { href: '/users', label: '👥 Manajemen User' },
    { href: '/manager/capital', label: '💰 Modal Usaha' },
    { href: '/manager/discount-rules', label: '🎟️ Aturan Diskon' },
    { href: '/manager/suppliers', label: '🏢 Supplier' },
    { href: '/dashboard/products', label: '📦 Stok Barang' },
    { href: '/manager/orders', label: '📝 Pesanan (PO)' },
    { href: '/manager/purchase', label: '📥 Restock' },
    { href: '/manager/return', label: '📤 Retur Barang' },
    { href: '/manager/opname', label: '📋 Stok Opname' },
    { href: '/customers', label: '👥 Daftar Pelanggan' },
    { href: '/reports', label: '📊 Laporan Penjualan' },
    { href: '/manager/finances', label: '💼 Hutang / Piutang' },
    { href: '/manager/expenses', label: '💸 Biaya Operasional' },
    { href: '/manager/reports', label: '📈 Laporan Keuangan' },
    { href: '/settings', label: '⚙️ Pengaturan' },
  ],
  CASHIER: [
    { href: '/dashboard', label: '🏠 Dashboard' },
    { href: '/pos',     label: '🛍️ Transaksi (Kasir)' },
    { href: '/customers', label: '👥 Daftar Pelanggan' },
    { href: '/manager/finances', label: '💼 Piutang Pelanggan' },
    { href: '/settings',label: '⚙️ Pengaturan' },
  ],
  WAREHOUSE: [
    { href: '/dashboard', label: '🏠 Dashboard' },
    { href: '/manager', label: '📦 Stok Barang' },
    { href: '/manager/orders', label: '📝 Pesanan (PO)' },
    { href: '/manager/purchase', label: '📥 Restock' },
    { href: '/manager/return', label: '📤 Retur Barang' },
    { href: '/manager/opname', label: '📋 Stok Opname' },
    { href: '/manager/suppliers', label: '🏢 Supplier' },
    { href: '/manager/finances', label: '💼 Hutang Supplier' },
    { href: '/settings', label: '⚙️ Pengaturan' },
  ],
  SUPER_ADMIN: [
    { href: '/super-admin', label: '👑 Super Admin Dashboard' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const role = session?.role as string | undefined;
  const name = session?.name as string | undefined;
  const storeName = session?.storeName as string | undefined;
  const links = role ? (roleNavLinks[role] ?? []) : [];

  return (
    <html lang="id" className={poppins.className}>
      <body>
        {session ? (
          <LayoutWrapper role={role!} name={name!} storeName={storeName} links={links}>
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
