export const MOCK_ALUMNI = [
  {
    id: 'A001',
    nama_lengkap: 'Muhammad Rizky Pratama',
    variasi_nama: ['M. Rizky', 'Rizky Pratama', 'Muh. Rizky P.'],
    afiliasi_kata_kunci: ['Universitas Muhammadiyah Malang', 'UMM', 'Informatika UMM'],
    konteks_kata_kunci: ['Informatika', 'Software Engineer', 'Malang', '2019'],
    status_pelacakan: 'Belum Dilacak', // Belum Dilacak | Teridentifikasi | Perlu Verifikasi | Tidak Ditemukan
    last_tracked_date: null,
    hasil: null
  },
  {
    id: 'A002',
    nama_lengkap: 'Siti Nurhaliza',
    variasi_nama: ['S. Nurhaliza', 'Siti N.', 'S.N. Haliza'],
    afiliasi_kata_kunci: ['Universitas Muhammadiyah Malang', 'UMM', 'Fakultas Teknik UMM'],
    konteks_kata_kunci: ['Informatika', 'Data Scientist', 'Jakarta', '2020'],
    status_pelacakan: 'Belum Dilacak',
    last_tracked_date: null,
    hasil: null
  },
  {
    id: 'A003',
    nama_lengkap: 'Ahmad Budi Santoso',
    variasi_nama: ['Ahmad B.', 'Budi Santoso', 'A. Budi S.'],
    afiliasi_kata_kunci: ['UMM', 'Univ. Muhammadiyah Malang'],
    konteks_kata_kunci: ['Informatika', 'Dosen', 'Surabaya', '2015'],
    status_pelacakan: 'Belum Dilacak',
    last_tracked_date: null,
    hasil: null
  },
  {
    id: 'A004',
    nama_lengkap: 'Dewi Lestari',
    variasi_nama: ['D. Lestari', 'Dewi L.'],
    afiliasi_kata_kunci: ['UMM'],
    konteks_kata_kunci: ['Informatika', 'Project Manager', 'Malang', '2018'],
    status_pelacakan: 'Belum Dilacak',
    last_tracked_date: null,
    hasil: null
  },
  {
    id: 'A005',
    nama_lengkap: 'Rudi Hermawan',
    variasi_nama: ['R. Hermawan', 'Rudi H.', 'Hermawan R.'],
    afiliasi_kata_kunci: ['Universitas Muhammadiyah Malang', 'UMM'],
    konteks_kata_kunci: ['Informatika', 'AI Researcher', 'Bandung', '2021'],
    status_pelacakan: 'Teridentifikasi dari sumber publik',
    last_tracked_date: '2023-10-15',
    hasil: {
      instansi: 'Tech Research Institute Bandung',
      jabatan: 'AI Researcher',
      sumber: 'Google Scholar, LinkedIn',
      confidence: 'Tinggi (92%)'
    }
  }
];

export const MOCK_SOURCES = [
  { id: 's1', name: 'Google Scholar', type: 'Academic', api: true, priority: 1, isEnabled: true },
  { id: 's2', name: 'LinkedIn', type: 'Professional', api: false, priority: 2, isEnabled: true },
  { id: 's3', name: 'ResearchGate', type: 'Academic', api: false, priority: 3, isEnabled: true },
  { id: 's4', name: 'ORCID', type: 'Academic', api: true, priority: 4, isEnabled: true },
  { id: 's5', name: 'Web Search (General)', type: 'General', api: false, priority: 5, isEnabled: true },
];

export const MOCK_REVIEWS = [
  {
    id: 'REV-001',
    alumni_id: 'A002',
    alumni_name: 'Siti Nurhaliza',
    tanggal_ditemukan: '2023-10-25',
    kandidat_teratas: [
      { id: 'c1', nama: 'Siti Nurhaliza', instansi: 'DataTech Jakarta', jabatan: 'Data Analyst', score: 65, sumber: 'LinkedIn' },
      { id: 'c2', nama: 'S. Nurhaliza', instansi: 'Universitas X', jabatan: 'Mahasiswa S2', score: 55, sumber: 'ResearchGate' }
    ],
    status: 'Pending'
  }
];

export const MOCK_LOGS = [
  { id: 1, time: '2023-10-25 08:00:01', message: 'Job Pelacakan Mingguan dimulai', type: 'info' },
  { id: 2, time: '2023-10-25 08:00:05', message: 'Memuat 45 profil alumni "Belum Dilacak"', type: 'info' },
  { id: 3, time: '2023-10-25 08:01:12', message: 'Berhasil mengidentifikasi Rudi Hermawan (Score: 92) via Scholar', type: 'success' },
  { id: 4, time: '2023-10-25 08:02:30', message: 'Ambiguitas ditemukan untuk profil Siti Nurhaliza. Masuk Antrean Review', type: 'warning' },
  { id: 5, time: '2023-10-25 08:15:00', message: 'Job Pelacakan Mingguan selesai. 12 Teridentifikasi, 5 Perlu Review, 28 Tidak Ditemukan.', type: 'info' }
];
