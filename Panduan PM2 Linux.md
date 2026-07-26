# Panduan Lengkap Menjalankan Aplikasi Next.js dengan PM2 di Windows

Panduan ini akan menjelaskan cara menjalankan dua (atau lebih) aplikasi Next.js secara bersamaan menggunakan **PM2** (`ecosystem.config.js`), serta cara mengaturnya agar **otomatis berjalan (Auto-Start)** ketika komputer/server Windows baru saja di-restart.

---

## 1. Persiapan & Instalasi PM2

Buka Command Prompt (CMD) atau PowerShell dengan akses **Administrator** (klik kanan *Run as Administrator*), lalu instal PM2 secara global:

```bash
npm install -g pm2
```

## 2. Membuat File Konfigurasi (Ecosystem)

Di dalam folder proyek Anda (misalnya `c:\xampp\htdocs\sh\POS2`), buat sebuah file baru bernama `ecosystem.config.js`. 

Salin dan tempel kode berikut ke dalam file tersebut:

```javascript
module.exports = {
  apps: [
    // --- APLIKASI PERTAMA ---
    {
      name   : "pos1", // Nama aplikasi di PM2
      script : "npm",
      args   : "start",
      cwd    : "/var/www/html/server/pos1", // Lokasi folder aplikasi pertama
      env: {
        PORT: 3001 // Port untuk aplikasi pertama
      }
    },
    
    // --- APLIKASI KEDUA ---
    {
      name   : "pos2", // Nama aplikasi di PM2 (HARUS BERBEDA)
      script : "npm",
      args   : "start",
      cwd    : "/var/www/html/server/pos2", // Ubah jika foldernya berbeda
      env: {
        PORT: 3002 // Port untuk aplikasi kedua
      }
    }
  ]
}
```

> [!TIP]
> **Penting:** Pastikan Anda sudah menjalankan perintah `npm run build` di masing-masing folder aplikasi sebelum menjalankan PM2.

---

## 3. Menjalankan Aplikasi

Setelah file `ecosystem.config.js` dibuat dan disimpan, jalankan perintah berikut di folder yang sama:

```bash
pm2 start ecosystem.config.js
```
*Kedua aplikasi akan langsung berjalan di background (port 3009 dan 3008).*

---

## 4. Cara Membuat PM2 Otomatis Berjalan Saat Komputer Restart (Windows)

Sistem operasi Windows memerlukan sedikit modul tambahan agar PM2 bisa otomatis berjalan saat komputer baru dinyalakan. Masih di terminal **Administrator**, ikuti langkah berikut:

### A. Instal Modul Startup untuk Windows
Jalankan perintah ini:
```bash
npm install pm2-windows-startup -g
```

### B. Pasang Service Startup
Setelah terinstal, jalankan:
```bash
pm2-startup install
```
*(Perintah ini akan membuat sebuah registri di Windows agar PM2 langsung berjalan saat komputer menyala).*

### C. Simpan Kondisi Aplikasi (Save)
Pastikan saat ini aplikasi POS Anda sedang berjalan (terlihat di `pm2 status`). Kemudian jalankan:
```bash
pm2 save
```
Selesai! Sekarang konfigurasi PM2 Anda sudah **disimpan**. Jika komputer Windows Anda mati mendadak atau di-restart, aplikasi POS Anda akan otomatis menyala kembali tanpa perlu membuka terminal CMD.

---

## Daftar Perintah Bermanfaat PM2

- `pm2 status` : Melihat daftar dan status semua aplikasi yang berjalan.
- `pm2 logs` : Melihat catatan aktivitas (*log*) atau error dari aplikasi.
- `pm2 stop all` : Menghentikan semua aplikasi.
- `pm2 restart all` : Merestart semua aplikasi (berguna setelah Anda memperbarui kode dan melakukan `npm run build`).
- `pm2 delete all` : Menghapus semua aplikasi dari daftar PM2.
