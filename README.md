# 🛍️ POS Pro - Multi-Store Point of Sale & Inventory System

A modern, full-featured **Multi-Store Point of Sale (POS) and Inventory Management System** built with **Next.js 14 App Router**, **TypeScript**, **Prisma ORM**, and **SQLite**.

---

## 🌟 Fitur Utama & Arsitektur Role

Aplikasi ini mendukung multi-tenant (Multi-Toko) dengan 4 hirarki role pengaksesan:

### 👑 1. Super Admin (Administrator Utama)
- **Dashboard Global**: Ringkasan performa keuangan seluruh toko (Total Omzet, Laba Bersih, Biaya Operasional, Total Hutang/Piutang).
- **Setup Awal Otomatis**: Jika sistem baru dipasang atau tidak memiliki akun Super Admin, halaman utama aplikasi secara otomatis membuka form **Setup Awal Sistem** untuk mendaftarkan Super Admin pertama kali.
- **Manajemen Toko**: Membuat toko baru, mereset password manajer, mencadangkan (backup) & memulihkan (restore) data toko individual.
- **👁️ Pantau Kegiatan Toko**: Halaman khusus untuk memantau 7 kategori aktivitas toko (Penjualan Kasir, Restock Gudang, Retur Barang, Stok Opname, Pesanan PO, Biaya & Modal, Staf Toko) dilengkapi dengan **Filter Rentang Waktu** & **Tombol Cetak Laporan**.
- **⚙️ Pengaturan Sistem**: Mengontrol status registrasi toko publik (`DIBUKA` / `DITUTUP`), ekspor & impor backup database seluruh sistem, serta pengosongan data operasional toko (*Global Reset*).

### 🏢 2. Admin / Manager Toko
- **Manajemen Usaha**: Kelola stok barang, kategori produk, supplier, pelanggan, dan aturan diskon toko.
- **Operasional Keuangan**: Kelola Modal Usaha, Biaya Operasional, Piutang Pelanggan, Hutang Supplier, dan Laporan Keuangan Toko.
- **Staf Toko**: Kelola akun pengguna untuk role Kasir (*Cashier*) dan Gudang (*Warehouse*).

### 📦 3. Gudang (Warehouse Staff)
- **Kelola Stok Barang**: Input dan perbarui stok produk.
- **Restock & Retur**: Pencatatan pembelian/restock barang dari supplier dan retur barang bermasalah.
- **Stok Opname**: Penyesuaian stok fisik vs stok sistem dengan laporan selisih stok.

### 🛍️ 4. Kasir (Cashier Staff)
- **Transaksi Penjualan (POS)**: Antarmuka kasir cepat dan responsif (Optimasi Desktop & Mobile).
- **Pencarian Stok Realtime**: Pencarian produk otomatis memperbarui jumlah stok yang tersedia.
- **Pembayaran Flexibel**: Mendukung pembayaran Tunai maupun Kredit (Piutang Pelanggan).
- **Cetak Struk**: Cetak bukti rincian transaksi penjualan.

### 🏬 6. Login Praktis (Pemilih Nama Toko Dropdown)
- **Pilihan Nama Toko via Combo Dropdown**: Pengguna tidak perlu mengetikkan kode awal toko secara manual. Cukup pilih **Nama Toko** dari menu combo dropdown (atau `👑 Super Admin`), lalu masukkan username biasa (contoh: `admin` atau `kasir`). Sistem otomatis mengkombinasikan username dengan kode toko.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend & Backend**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Bahasa Pemrograman**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database Engine**: [SQLite](https://www.sqlite.org/) (`dev.db`)
- **Desain & Tipografi**: Custom Responsive CSS System dengan Font **Poppins** (Google Fonts)
- **Autentikasi**: JWT Encrypted Cookie (`jose`)
- **Notifikasi Modal**: [SweetAlert2](https://sweetalert2.github.io/)

---

## 🚀 Panduan Instalasi & Penggunaan

### 1. Prasyarat System
- **Node.js**: `v18.x` atau versi lebih baru
- **npm**: `v9.x` atau versi lebih baru

### 2. Langkah Praktis Instalasi

1. **Install Dependensi**:
   ```bash
   npm install
   ```

2. **Inisialisasi Database SQLite**:
   ```bash
   npx prisma db push
   ```

3. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```

4. **Buka di Browser**:
   Buka [http://localhost:3000](http://localhost:3000). 
   - Jika database baru pertama kali dibuat, halaman web akan **otomatis menampilkan form pendaftaran Super Admin**.
   - *(Opsional)* Jika ingin membuat Super Admin bawaan secara otomatis via terminal, Anda dapat menjalankan perintah `node scripts/init-db.js` (dengan default login `superadmin` / `admin123`).

---

## 📄 Lisensi

Proyek ini dikembangkan khusus untuk sistem POS Multi-Toko Modern. Hak cipta dilindungi undang-undang.