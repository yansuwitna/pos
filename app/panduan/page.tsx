import Link from 'next/link';

export const metadata = {
  title: 'Panduan Penggunaan | Smart Multi-Store POS Pro',
  description: 'Panduan lengkap cara login, tugas Super Admin, Manajer, Gudang, dan Kasir di sistem POS multi-toko.',
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.93)',
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
  padding: '2rem',
  border: '1.5px solid rgba(255,255,255,0.8)',
  boxShadow: '0 8px 25px rgba(37,99,235,0.08)',
  marginBottom: '1.5rem',
} as const;

function SectionBadge({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <span style={{
      background: gradient,
      color: '#fff',
      borderRadius: '10px',
      padding: '5px 14px',
      fontSize: '0.78rem',
      fontWeight: 800,
      letterSpacing: '0.5px',
      display: 'inline-block',
      marginBottom: '1.5rem',
    }}>
      {children}
    </span>
  );
}

function TaskItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#0f172a', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '0.81rem', color: '#475569', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function PanduanPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 35%, #f5f3ff 70%, #eff6ff 100%)',
      fontFamily: "'Poppins', sans-serif",
      padding: '2rem 1rem 5rem',
    }}>
      {/* Fixed background blobs */}
      <div style={{ position: 'fixed', top: '-100px', left: 'calc(50% - 300px)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-120px', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto' }}>

        {/* BACK BUTTON */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#0284c7', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem',
            background: 'rgba(255,255,255,0.85)', padding: '8px 18px',
            borderRadius: '30px', border: '1.5px solid #bae6fd',
            boxShadow: '0 2px 8px rgba(2,132,199,0.1)',
          }}>
            ← Kembali ke Login
          </Link>
        </div>

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 50%, #06b6d4 100%)',
          borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '2rem',
          textAlign: 'center', boxShadow: '0 20px 40px rgba(6,182,212,0.3)', color: '#fff',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📖</div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: '0 0 0.5rem', letterSpacing: '-0.5px' }}>
            Panduan Penggunaan Sistem
          </h1>
          <p style={{ margin: '0 0 1.5rem', opacity: 0.85, fontSize: '0.95rem', fontWeight: 500 }}>
            Smart Multi-Store POS Pro — Panduan lengkap untuk semua peran pengguna
          </p>
          {/* Quick nav */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {[
              { label: '🔑 Cara Login', href: '#login' },
              { label: '👑 Super Admin', href: '#superadmin' },
              { label: '🏪 Manajer', href: '#manajer' },
              { label: '📦 Gudang', href: '#gudang' },
              { label: '🖥️ Kasir', href: '#kasir' },
              { label: '💡 Tips', href: '#tips' },
              { label: '❓ FAQ', href: '#faq' },
            ].map(n => (
              <a key={n.href} href={n.href} style={{
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                textDecoration: 'none', padding: '5px 14px', borderRadius: '20px',
                fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.35)',
              }}>{n.label}</a>
            ))}
          </div>
        </div>

        {/* ── CARA LOGIN ─────────────────────────────────────────────────────── */}
        <div id="login" style={card}>
          <SectionBadge gradient="linear-gradient(135deg,#2563eb,#06b6d4)">🔑 CARA LOGIN KE SISTEM</SectionBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { step: '1', icon: '🏬', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd', title: 'Pilih Nama Toko', desc: 'Buka halaman login, klik dropdown "Pilih Nama Toko", lalu pilih toko tempat Anda bekerja. Jika Anda Super Admin, pilih "Login Super Admin (Pusat)".' },
              { step: '2', icon: '👤', color: '#059669', bg: '#d1fae5', border: '#6ee7b7', title: 'Masukkan Username', desc: 'Ketik username Anda tanpa kode toko. Contoh: jika username lengkap TK01_admin, cukup ketik admin. Sistem otomatis menggabungkan kode toko dengan username Anda.' },
              { step: '3', icon: '🔒', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', title: 'Masukkan Password', desc: 'Ketik password akun Anda. Gunakan ikon mata 👁️ di sebelah kanan untuk menampilkan atau menyembunyikan karakter password.' },
              { step: '4', icon: '🚀', color: '#d97706', bg: '#fef3c7', border: '#fde68a', title: 'Klik Masuk', desc: 'Klik tombol "Masuk Ke Toko Sekarang". Anda akan diarahkan otomatis ke dashboard sesuai peran akun yang terdaftar.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem 1.2rem', borderRadius: '14px', background: item.bg, border: `1.5px solid ${item.border}` }}>
                <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: `2.5px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: item.color }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.93rem', color: item.color, marginBottom: '3px' }}>{item.icon} {item.title}</div>
                  <div style={{ fontSize: '0.84rem', color: '#374151', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SUPER ADMIN ────────────────────────────────────────────────────── */}
        <div id="superadmin" style={{ ...card, borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>👑</span>
            <div>
              <SectionBadge gradient="linear-gradient(135deg,#2563eb,#0284c7)">SUPER ADMIN — AKSES PENUH SISTEM</SectionBadge>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b', lineHeight: 1.55 }}>
                Super Admin adalah administrator utama yang mengelola seluruh ekosistem sistem POS. Bertanggung jawab atas setup awal, manajemen toko, dan pemantauan seluruh operasional.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: '#f0f9ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem', marginBottom: '0.8rem' }}>🏬 Manajemen Toko</div>
              <TaskItem icon="➕" title="Daftarkan toko baru" desc="Buka menu Toko → klik Tambah Toko, isi kode toko (contoh: TK02), nama toko, alamat, dan status aktif." />
              <TaskItem icon="✏️" title="Edit data toko" desc="Pilih toko dari daftar → klik Edit → ubah informasi toko sesuai kebutuhan." />
              <TaskItem icon="🔴" title="Nonaktifkan toko" desc="Ubah status toko menjadi Tidak Aktif agar tidak muncul di dropdown login." />
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem', marginBottom: '0.8rem' }}>👥 Manajemen Pengguna</div>
              <TaskItem icon="➕" title="Tambah pengguna baru" desc="Menu Pengguna → Tambah Pengguna, pilih toko, tentukan peran (Admin/Kasir/Gudang), isi username dan password." />
              <TaskItem icon="🔑" title="Reset password pengguna" desc="Pilih pengguna → klik Ubah Password → masukkan password baru untuk pengguna tersebut." />
              <TaskItem icon="🗑️" title="Nonaktifkan akun" desc="Pilih pengguna → ubah status menjadi Tidak Aktif untuk mencabut akses tanpa menghapus data." />
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem', marginBottom: '0.8rem' }}>📊 Laporan & Monitoring</div>
              <TaskItem icon="📈" title="Laporan penjualan semua toko" desc="Menu Laporan → pilih rentang tanggal dan toko → lihat total penjualan, omzet, dan grafik perbandingan." />
              <TaskItem icon="📦" title="Monitoring stok lintas toko" desc="Pantau stok barang di semua toko sekaligus, identifikasi toko yang kekurangan stok." />
              <TaskItem icon="💰" title="Laporan keuangan" desc="Lihat ringkasan pendapatan, pengeluaran, dan laba bersih per toko maupun keseluruhan." />
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem', marginBottom: '0.8rem' }}>⚙️ Pengaturan Sistem</div>
              <TaskItem icon="🔐" title="Ubah password sendiri" desc="Menu Pengaturan → Ubah Password Akun Super Admin → masukkan password lama dan baru." />
              <TaskItem icon="🛒" title="Kelola produk master" desc="Tambah, edit, atau hapus produk yang berlaku lintas toko dari menu Produk." />
              <TaskItem icon="🏷️" title="Kelola kategori produk" desc="Buat dan atur kategori produk untuk memudahkan pengelompokan di semua toko." />
            </div>
          </div>
        </div>

        {/* ── MANAJER / ADMIN TOKO ───────────────────────────────────────────── */}
        <div id="manajer" style={{ ...card, borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🏪</span>
            <div>
              <SectionBadge gradient="linear-gradient(135deg,#059669,#10b981)">MANAJER / ADMIN TOKO — OPERASIONAL TOKO</SectionBadge>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b', lineHeight: 1.55 }}>
                Manajer bertanggung jawab atas operasional harian satu toko yang ditugaskan. Mengelola produk, stok, karyawan toko, dan memantau kinerja penjualan tokonya.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '1.25rem', border: '1px solid #6ee7b7' }}>
              <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem', marginBottom: '0.8rem' }}>📦 Manajemen Produk & Stok</div>
              <TaskItem icon="➕" title="Tambah produk toko" desc="Menu Produk → Tambah Produk, isi nama, kategori, harga jual, harga beli, dan stok awal." />
              <TaskItem icon="✏️" title="Ubah harga produk" desc="Pilih produk → klik Edit → ubah harga jual atau harga beli sesuai kebutuhan toko." />
              <TaskItem icon="📋" title="Pantau stok menipis" desc="Dashboard akan menampilkan notifikasi produk yang stoknya di bawah batas minimum yang ditentukan." />
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '1.25rem', border: '1px solid #6ee7b7' }}>
              <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem', marginBottom: '0.8rem' }}>👤 Manajemen Karyawan Toko</div>
              <TaskItem icon="➕" title="Tambah akun kasir/gudang" desc="Menu Pengguna → Tambah, pilih peran Kasir atau Gudang, isi username dan password untuk karyawan baru." />
              <TaskItem icon="🔑" title="Reset password karyawan" desc="Pilih akun karyawan → Ubah Password → masukkan password baru bila karyawan lupa password." />
              <TaskItem icon="👁️" title="Pantau aktivitas kasir" desc="Lihat riwayat transaksi per kasir untuk memantau kinerja dan memvalidasi transaksi harian." />
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '1.25rem', border: '1px solid #6ee7b7' }}>
              <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem', marginBottom: '0.8rem' }}>📊 Laporan Toko</div>
              <TaskItem icon="📈" title="Laporan penjualan harian" desc="Menu Laporan → pilih tanggal → lihat total transaksi, produk terlaris, dan omzet hari ini." />
              <TaskItem icon="📉" title="Laporan stok & mutasi" desc="Lihat riwayat perubahan stok: barang masuk dari gudang, barang terjual, dan sisa stok terkini." />
              <TaskItem icon="🧾" title="Cetak laporan" desc="Klik tombol Cetak atau Ekspor untuk mengunduh laporan dalam format PDF atau Excel." />
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '1.25rem', border: '1px solid #6ee7b7' }}>
              <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem', marginBottom: '0.8rem' }}>🔧 Pengaturan Toko</div>
              <TaskItem icon="🏷️" title="Atur kategori produk" desc="Tambah atau edit kategori yang relevan untuk toko Anda agar produk lebih mudah dikelola." />
              <TaskItem icon="💳" title="Atur metode pembayaran" desc="Aktifkan atau nonaktifkan metode pembayaran (tunai, transfer, QRIS) yang tersedia di toko." />
              <TaskItem icon="🔐" title="Ubah password sendiri" desc="Menu Pengaturan → Ubah Password untuk memperbarui keamanan akun Manajer Anda." />
            </div>
          </div>
        </div>

        {/* ── GUDANG ─────────────────────────────────────────────────────────── */}
        <div id="gudang" style={{ ...card, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📦</span>
            <div>
              <SectionBadge gradient="linear-gradient(135deg,#7c3aed,#a855f7)">GUDANG — MANAJEMEN PERSEDIAAN</SectionBadge>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b', lineHeight: 1.55 }}>
                Petugas Gudang bertugas mengelola seluruh pergerakan barang: penerimaan dari supplier, pembaruan stok, dan mutasi barang. Memastikan ketersediaan produk selalu terjaga.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: '#faf5ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #c4b5fd' }}>
              <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.9rem', marginBottom: '0.8rem' }}>📥 Penerimaan Barang</div>
              <TaskItem icon="📋" title="Catat barang masuk" desc="Menu Gudang → Penerimaan Barang → isi nama produk, jumlah yang diterima, tanggal terima, dan nama supplier." />
              <TaskItem icon="🔍" title="Verifikasi jumlah barang" desc="Cocokkan jumlah fisik barang dengan dokumen pengiriman (surat jalan/faktur) sebelum mencatat." />
              <TaskItem icon="✅" title="Konfirmasi penerimaan" desc="Klik Simpan setelah data lengkap — stok produk akan otomatis bertambah sesuai jumlah yang dicatat." />
            </div>
            <div style={{ background: '#faf5ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #c4b5fd' }}>
              <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.9rem', marginBottom: '0.8rem' }}>🔄 Penyesuaian Stok</div>
              <TaskItem icon="✏️" title="Update stok manual" desc="Jika ada selisih stok fisik vs sistem, lakukan penyesuaian di menu Stok → Penyesuaian dengan mencatat alasannya." />
              <TaskItem icon="⚠️" title="Laporkan stok menipis" desc="Segera informasikan ke Manajer jika stok produk mendekati batas minimum agar dapat segera dipesan." />
              <TaskItem icon="🗑️" title="Catat barang rusak/expired" desc="Produk rusak atau kadaluarsa dicatat sebagai pengurangan stok dengan keterangan alasan." />
            </div>
            <div style={{ background: '#faf5ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #c4b5fd' }}>
              <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.9rem', marginBottom: '0.8rem' }}>📊 Laporan Stok</div>
              <TaskItem icon="📋" title="Lihat stok terkini" desc="Menu Stok → Daftar Stok untuk melihat jumlah stok semua produk saat ini beserta nilai persediaan." />
              <TaskItem icon="📜" title="Riwayat mutasi barang" desc="Lihat semua pergerakan stok: barang masuk, barang terjual, dan penyesuaian dalam periode tertentu." />
              <TaskItem icon="📤" title="Ekspor laporan stok" desc="Unduh laporan stok dalam format Excel untuk pelaporan atau rekap bulanan ke Manajer." />
            </div>
            <div style={{ background: '#faf5ff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #c4b5fd' }}>
              <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.9rem', marginBottom: '0.8rem' }}>🔐 Pengaturan Akun</div>
              <TaskItem icon="🔑" title="Ubah password sendiri" desc="Menu Pengaturan → Ubah Password untuk memperbarui password akun gudang Anda secara mandiri." />
              <TaskItem icon="📞" title="Laporkan kendala sistem" desc="Jika mengalami masalah teknis (tidak bisa simpan data, stok tidak terupdate), segera hubungi Manajer." />
            </div>
          </div>
        </div>

        {/* ── KASIR ──────────────────────────────────────────────────────────── */}
        <div id="kasir" style={{ ...card, borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🖥️</span>
            <div>
              <SectionBadge gradient="linear-gradient(135deg,#d97706,#f59e0b)">KASIR — TRANSAKSI PENJUALAN</SectionBadge>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b', lineHeight: 1.55 }}>
                Kasir bertugas melayani transaksi penjualan pelanggan secara langsung. Bertanggung jawab atas ketepatan transaksi, pembayaran, dan penerbitan struk pembelian.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: '#fffbeb', borderRadius: '14px', padding: '1.25rem', border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem', marginBottom: '0.8rem' }}>🛒 Proses Transaksi Penjualan</div>
              <TaskItem icon="1️⃣" title="Buka halaman POS/Kasir" desc="Setelah login, klik menu POS atau Kasir di dashboard untuk membuka tampilan kasir." />
              <TaskItem icon="2️⃣" title="Cari dan tambah produk" desc="Ketik nama produk di kolom pencarian atau scan barcode, lalu klik produk untuk menambahkan ke keranjang belanja." />
              <TaskItem icon="3️⃣" title="Atur jumlah item" desc="Klik ikon + atau - di keranjang untuk menyesuaikan jumlah setiap produk yang dibeli pelanggan." />
              <TaskItem icon="4️⃣" title="Proses pembayaran" desc="Klik Bayar, pilih metode pembayaran (tunai/transfer/QRIS), masukkan nominal yang diterima, klik Konfirmasi." />
              <TaskItem icon="5️⃣" title="Cetak struk" desc="Setelah transaksi berhasil, klik Cetak Struk untuk mencetak bukti pembelian bagi pelanggan." />
            </div>
            <div style={{ background: '#fffbeb', borderRadius: '14px', padding: '1.25rem', border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem', marginBottom: '0.8rem' }}>🧾 Transaksi Khusus</div>
              <TaskItem icon="🔄" title="Transaksi dengan diskon" desc="Jika ada diskon, masukkan nominal atau persentase diskon pada kolom yang tersedia sebelum konfirmasi pembayaran." />
              <TaskItem icon="↩️" title="Batalkan transaksi" desc="Jika pelanggan membatalkan sebelum konfirmasi, klik tombol Batal/Kosongkan Keranjang." />
              <TaskItem icon="🧮" title="Hitung kembalian" desc="Sistem otomatis menghitung kembalian saat Anda memasukkan nominal uang yang diterima dari pelanggan." />
              <TaskItem icon="🔍" title="Cek detail transaksi" desc="Klik transaksi di riwayat untuk melihat detail produk, harga, diskon, dan metode pembayaran yang digunakan." />
            </div>
            <div style={{ background: '#fffbeb', borderRadius: '14px', padding: '1.25rem', border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem', marginBottom: '0.8rem' }}>📜 Riwayat Transaksi</div>
              <TaskItem icon="📋" title="Lihat transaksi hari ini" desc="Menu Riwayat → filter tanggal hari ini untuk melihat semua transaksi yang telah Anda proses." />
              <TaskItem icon="🖨️" title="Cetak ulang struk" desc="Pilih transaksi yang dibutuhkan → klik Cetak Ulang untuk mencetak kembali struk yang sudah ada." />
              <TaskItem icon="📊" title="Ringkasan shift kasir" desc="Lihat total transaksi dan omzet yang berhasil diproses selama shift kerja Anda." />
            </div>
            <div style={{ background: '#fffbeb', borderRadius: '14px', padding: '1.25rem', border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem', marginBottom: '0.8rem' }}>⚠️ Hal Penting untuk Kasir</div>
              <TaskItem icon="🚫" title="Jangan tinggalkan kasir terbuka" desc="Jika meninggalkan meja kasir, selalu lock layar atau logout untuk mencegah transaksi tidak sah." />
              <TaskItem icon="✅" title="Verifikasi sebelum konfirmasi" desc="Pastikan nama produk, jumlah, dan total harga sudah benar sebelum mengklik tombol Konfirmasi." />
              <TaskItem icon="📞" title="Laporkan masalah ke manajer" desc="Jika ada kesalahan transaksi yang tidak bisa dibatalkan sendiri, segera hubungi Manajer untuk koreksi." />
              <TaskItem icon="🔐" title="Ubah password sendiri" desc="Menu Pengaturan → Ubah Password untuk memperbarui password akun kasir Anda secara berkala." />
            </div>
          </div>
        </div>

        {/* ── TIPS KEAMANAN ──────────────────────────────────────────────────── */}
        <div id="tips" style={{ background: 'linear-gradient(135deg, rgba(254,249,195,0.97), rgba(253,230,138,0.6))', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '2rem', border: '1.5px solid rgba(253,211,77,0.5)', boxShadow: '0 8px 20px rgba(234,179,8,0.1)', marginBottom: '1.5rem' }}>
          <SectionBadge gradient="linear-gradient(135deg,#f59e0b,#d97706)">💡 TIPS KEAMANAN PENGGUNAAN</SectionBadge>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {[
              { icon: '🔐', text: 'Jangan bagikan password kepada siapapun, termasuk sesama karyawan atau atasan.' },
              { icon: '🏬', text: 'Pastikan memilih toko yang benar sebelum login untuk menghindari kesalahan akses data.' },
              { icon: '🚪', text: 'Selalu klik Logout setelah selesai, terutama di komputer yang digunakan bersama.' },
              { icon: '📞', text: 'Jika lupa password, hubungi Manajer atau Super Admin untuk reset — jangan coba-coba tebak.' },
              { icon: '🔄', text: 'Ganti password minimal setiap 3 bulan melalui menu Pengaturan di dalam dashboard.' },
              { icon: '⚠️', text: 'Hindari membuka sistem POS di jaringan WiFi publik yang tidak aman atau tidak dikenal.' },
              { icon: '📱', text: 'Jangan simpan password di browser umum atau perangkat yang diakses banyak orang.' },
              { icon: '🕐', text: 'Perhatikan sesi login — sistem akan otomatis logout jika tidak aktif dalam waktu tertentu.' },
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '0.8rem 1rem' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{tip.icon}</span>
                <span style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.55, fontWeight: 500 }}>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────────────────── */}
        <div id="faq" style={card}>
          <SectionBadge gradient="linear-gradient(135deg,#0f172a,#334155)">❓ PERTANYAAN UMUM (FAQ)</SectionBadge>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { q: 'Saya salah memilih toko saat login, apa yang terjadi?', a: 'Login akan gagal karena username Anda tidak terdaftar di toko yang dipilih. Kembali ke halaman login, pilih toko yang benar, dan coba lagi.' },
              { q: 'Username dan password benar tapi tidak bisa login?', a: 'Pastikan Anda memilih toko yang sesuai di dropdown. Periksa juga apakah akun Anda masih aktif — akun bisa dinonaktifkan oleh Manajer atau Super Admin. Hubungi Manajer jika masalah berlanjut.' },
              { q: 'Bagaimana cara menambah toko baru?', a: 'Hanya Super Admin yang bisa mendaftarkan toko baru. Klik "Daftar Toko Baru" di halaman login atau login sebagai Super Admin, lalu buka menu Toko → Tambah Toko.' },
              { q: 'Kasir tidak bisa menemukan produk saat transaksi?', a: 'Produk mungkin belum ditambahkan ke toko tersebut, atau stoknya sudah habis. Hubungi Manajer untuk menambahkan produk atau menambah stok.' },
              { q: 'Bagaimana jika terjadi kesalahan transaksi yang sudah dikonfirmasi?', a: 'Kasir tidak bisa membatalkan transaksi yang sudah dikonfirmasi. Segera hubungi Manajer untuk melakukan koreksi manual pada laporan.' },
              { q: 'Apakah data stok otomatis berkurang saat ada penjualan?', a: 'Ya, setiap transaksi penjualan yang berhasil akan otomatis mengurangi stok produk yang terjual secara real-time.' },
              { q: 'Bagaimana cara mengubah password saya?', a: 'Setelah login, buka menu Pengaturan di dashboard → pilih Ubah Password → masukkan password lama dan password baru Anda.' },
              { q: 'Apakah bisa login dari beberapa perangkat sekaligus?', a: 'Bisa secara teknis, namun demi keamanan sebaiknya hanya login di satu perangkat dalam satu waktu dan selalu logout setelah selesai bekerja.' },
            ].map((faq, i) => (
              <div key={i} style={{ borderRadius: '14px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '0.9rem 1.2rem', fontWeight: 700, fontSize: '0.87rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                  ❓ {faq.q}
                </div>
                <div style={{ padding: '0.9rem 1.2rem', fontSize: '0.84rem', color: '#374151', lineHeight: 1.65 }}>
                  💬 {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BACK TO LOGIN */}
        <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 50%, #06b6d4 100%)',
            color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem',
            padding: '0.9rem 2.5rem', borderRadius: '50px',
            boxShadow: '0 10px 25px rgba(6,182,212,0.35)',
          }}>
            ← Kembali ke Halaman Login
          </Link>
        </div>

      </div>
    </div>
  );
}
