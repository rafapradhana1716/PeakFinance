# Laporan QC/Developer PeakFinance

Tanggal audit: 27 Juli 2026

## Ringkasan

PeakFinance sudah memiliki alur MVP yang jelas: autentikasi, transaksi,
dashboard, analitik, target tabungan, dan pengaturan profil. Sebelum audit,
terdapat beberapa risiko keamanan dan integritas data yang membuat aplikasi
belum aman untuk dipakai multi-user. Perbaikan prioritas tinggi pada repository
ini telah menangani autentikasi cookie, IDOR target tabungan, transaksi database
yang tidak atomik, validasi input finansial, stored XSS, route rusak, schema,
dan asset produksi.

Status setelah perbaikan: layak dilanjutkan ke integration/UAT, tetapi belum
direkomendasikan untuk produksi sebelum test runtime, migrasi database existing,
dan keputusan model saldo/tabungan selesai.

## Temuan yang sudah diperbaiki

| Prioritas | Area | Temuan | Perbaikan |
| --- | --- | --- | --- |
| Kritis | Autentikasi | Dashboard menerima cookie apa pun tanpa verifikasi JWT | Route dashboard kini memverifikasi signature dan expiry JWT |
| Kritis | Otorisasi | User dapat memilih `savings_goal` milik user lain (IDOR) | Update memeriksa bahwa goal dimiliki user aktif |
| Kritis | Integritas data | Transaksi menabung dibuat sebelum goal diverifikasi; kegagalan update meninggalkan data inkonsisten | Lock goal dan insert/update dilakukan dalam satu transaksi database |
| Tinggi | Validasi | `type`, nominal, ID, panjang teks, dan filter hari dapat menerima nilai tidak valid | Validator bersama, whitelist tipe, batas nominal, ID, dan rentang 1-365 hari |
| Tinggi | XSS | Nama transaksi, kategori, dan judul goal dirender melalui `innerHTML` | Nilai dinamis di-escape; elemen yang sudah aman memakai `textContent` |
| Tinggi | Cookie | `secure: true` membuat login lokal HTTP gagal | Secure cookie mengikuti environment; atribut clear/set dibuat konsisten |
| Tinggi | Schema | Username tidak unik dan index query utama kurang | Unique username, foreign key selected goal, dan index gabungan ditambahkan |
| Sedang | Akurasi grafik | Grafik saldo periode dimulai dari nol, bukan saldo sebelum periode | Opening balance dihitung sebelum data harian periode |
| Sedang | Error handling | API auth me-redirect HTML dan beberapa endpoint membocorkan error database | API mengembalikan 401 JSON dan respons error disanitasi |
| Sedang | Route | `/profil` dan `/laporan` merender template yang tidak ada | Dialihkan ke halaman fungsional yang relevan |
| Sedang | Deployment | View produksi selalu bergantung pada Vite dev server | Build CSS diarahkan ke `public/dist` dan view memilih asset sesuai environment |
| Sedang | UX | Form transaksi menampilkan sukses sebelum server berhasil | Submit memakai fetch dan toast mengikuti hasil server |
| Sedang | Responsif | Grid utama dan sidebar menutupi layar kecil | Breakpoint grid, padding responsif, dan sidebar icon-only ditambahkan |
| Rendah | Konten | Periode dashboard dan target bulanan hard-coded | Periode dihitung dari tanggal aktual dan klaim nominal palsu dihapus |

## Temuan tersisa dan rekomendasi

### P0 — sebelum production

1. Jalankan test runtime dengan Node.js 20.19+ dan MariaDB, termasuk register,
   login HTTP lokal, expiry token, transaksi, invest bersamaan, dan isolation
   antar-user. Audit ini tidak dapat menjalankan `npm`, karena runtime tidak
   tersedia di PATH lingkungan.
2. Buat migrasi versioned (misalnya `migrations/`) untuk database yang sudah
   berjalan. `db-dump.sql` saat ini cocok untuk instalasi baru; penambahan unique
   username dapat gagal bila data lama memiliki username duplikat.
3. Putuskan definisi produk untuk `saving`. Saat ini tabungan meningkatkan goal
   tetapi tidak mengurangi saldo kas karena saldo hanya menghitung income minus
   expense. Pilih salah satu model: tabungan sebagai earmark/net-worth, atau
   transfer dari kas ke akun tabungan. Jangan mengubahnya tanpa keputusan bisnis.
4. Jalankan `npm audit` dan dependency review. CDN Chart.js, Font Awesome, Google
   Fonts, serta Unsplash juga perlu kebijakan availability/privacy atau di-host
   sendiri.

### P1 — stabilitas dan maintainability

1. Tambahkan integration test API dengan database test terisolasi untuk auth,
   IDOR, rollback invest, batas nominal, dan response 401.
2. Pisahkan `server.js` menjadi `app.js` (konfigurasi Express) dan bootstrap
   listener agar mudah dites tanpa membuka port.
3. Pindahkan JavaScript inline EJS ke modul di `public/js`. Logika dashboard dan
   analitik banyak berulang dan rawan berbeda perilaku.
4. Tambahkan pagination/cursor untuk histori transaksi; filter 365 hari masih
   dapat mengirim payload besar.
5. Tambahkan structured logging, request ID, health/readiness endpoint, graceful
   shutdown, dan monitoring error.
6. Untuk deployment multi-instance, pindahkan rate-limit dari memory ke shared
   store. Pertimbangkan session/token revocation untuk logout lintas perangkat.

### P2 — produk, UX, dan aksesibilitas

1. Insight masih berupa tiga kartu statis yang sama dan belum mempunyai halaman
   detail. Hubungkan insight ke rule-based data aktual atau tandai jelas sebagai
   demo.
2. Tambahkan edit/hapus transaksi dan goal, konfirmasi destructive action, serta
   audit trail sederhana.
3. Lengkapi label/`aria-label`, focus trap modal, Escape-to-close, status toast
   `aria-live`, dan pengujian keyboard/screen reader.
4. Uji layout pada 320 px, tablet, desktop, zoom 200%, serta nominal rupiah yang
   sangat panjang. Sidebar mobile saat ini merupakan kompromi icon-only.
5. Selaraskan istilah UI. Beberapa bagian memakai “tabungan” untuk saldo,
   pemasukan, dan goal sehingga interpretasi pengguna tidak konsisten.

## Test minimum yang disarankan

- Unit: validator teks, ID, nominal rupiah, dan rentang hari (`npm test`).
- API: register duplicate email/username, login salah, expired/tampered JWT,
  Origin asing, payload terlalu besar, serta semua endpoint tanpa cookie.
- Authorization: user A tidak dapat membaca/memilih/invest goal user B.
- Concurrency: dua request invest bersamaan menghasilkan amount dan transaksi
  yang konsisten; request gagal tidak menyisakan transaction row.
- Finance: no transaction, income-only, expense-only, saldo negatif, opening
  balance, missing days, dan batas pergantian bulan/tahun.
- UI: success/error submit, expiry saat fetch, empty state, loading state,
  jaringan gagal, mobile navigation, serta input dengan karakter HTML.

## Perintah verifikasi

```bash
npm ci
npm test
npm run build
npm audit
npm run dev
```

Setelah server dan database test aktif, lanjutkan smoke test manual pada seluruh
route publik/protected dan dua akun user yang berbeda.
