# Daily Project 3 - Alumni Tracking System

Project React Vite (Frontend Simulation) untuk sistem pelacakan alumni otomatis berdasarkan rancangan Daily Project 2. Aplikasi ini berfokus pada flow simulasi *scheduler job* pencarian, penilaian (*scoring*), verifikasi ambiguitas (*human-in-the-loop*), dan riwayat audit.

## Fitur Utama

- **Dashboard:** Ringkasan statistik pelacakan profil alumni.
- **Data Master Alumni:** Pengelolaan (CRUD lengkap - Create, Read, Update, Delete) profil target pencarian beserta *alias* dan kata kunci konteks.
- **Simulasi Pelacakan (Tracking Job):** Simulasi logika *scheduler* berkala yang mengekstrak sinyal dari kandidat potensial di berbagai platform (Scholar, LinkedIn, Web) dan memberikan *Confidence Score*. Dilengkapi dengan *Live Console* dan daftar antrean yang belum dilacak.
- **Antrean Verifikasi Manual:** Fitur bagi *Reviewer/Admin* untuk menangani *edge cases* dimana skor hasil pelacakan bersifat ambigu (skor menengah: 40-69).
- **Audit Log & Riwayat:** Jejak eksekusi sistem untuk transparansi dan *cross-validation*.
- **Pengaturan:** Penyesuaian sumber (*scraping sources*) dan threshold penilaian *confidence*, dengan umpan balik visual saat penyimpanan.

## Tech Stack
- Frontend: React.js (Vite)
- Routing: React Router v6
- Icons: Lucide React
- Charts: Recharts
- Styling: Custom CSS (Glassmorphism & Gradients)

## Cara Menjalankan Aplikasi

1. Clone repository ini atau pastikan berada di dalam folder project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:5173` di browser.

---

## Tabel Pengujian Aplikasi (Quality Aspects)

Berikut adalah pengujian aspek kualitas (sesuai spesifikasi Daily Project 2):

| Aspek Kualitas | Skenario Uji | Prosedur Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| **Usability** | Navigasi Menu Sidebar | Klik setiap menu di sidebar (Dashboard, Data Alumni, Pelacakan, Verifikasi, dll) | Halaman berpindah tanpa load ulang (SPA) dan state *active* berpindah sesuai halaman. | ✅ Lulus |
| **Usability** | Responsivitas UI | Ubah ukuran jendela browser ke ukuran *mobile* (max-width: 900px) | Layout grid berubah mnjadi kolom tunggal, sidebar tersembunyi/menyesuaikan. | ✅ Lulus |
| **Functional** | Simulasi Job Pelacakan | Buka menu "Pelacakan (Job)", klik tombol "Run Job Pelacakan Sekarang" | Progress bar berjalan proporsional, log *real-time* ter-update, dan profil "Belum Dilacak" berkurang. | ✅ Lulus |
| **Functional** | Antrean Verifikasi (Human-in-the-loop) | Pada menu "Verifikasi Manual", klik tombol setujui/tolak kandidat | Status alumni terupdate, item hilang dari antrean, log histori mencatat aksi reviewer. | ✅ Lulus |
| **Functional** | CRUD Data Alumni | Pada menu "Data Alumni", isi form nama dan alias, lalu simpan, edit, dan hapus | Data berhasil dtambahkan, diperbarui, maupun dihapus dengan pemberitahuan konfirmasi dan antrean target *live console* otomatis diperbarui. | ✅ Lulus |
| **Functional** | Pengaturan Target Threshold | Pada menu "Pengaturan Sistem", rubah pengaturan atau klik simpan | Muncul status indikator *loading* lalu terdapat teks feedback bahwa konfigurasi berhasil tersimpan selama 3 detik. | ✅ Lulus |
| **Performance** | Transisi Halaman | Klik antar menu dengan cepat berturut-turut | Tidak ada *lag* visual; animasi *fade-in* (*keyframes*) dieksekusi kurang dari 0.3 dtk. | ✅ Lulus |
| **Security/Audit** | Pencatatan Log System | Lakukan aksi perubahan (Tambah/Edit/Hapus alumni, Run Job, Setujui review) lalu buka menu "Laporan & Riwayat" | Setiap aksi penting terekam dengan cap waktu (*timestamp*) dan status akurat di Log Audit. | ✅ Lulus |

---
*Dibuat untuk tugas Rekayasa Kebutuhan - Universitas Muhammadiyah Malang.*
