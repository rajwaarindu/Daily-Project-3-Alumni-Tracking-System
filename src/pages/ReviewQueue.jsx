import React from 'react';
import { useAppContext } from '../store/AppContext';
import { CheckSquare, ExternalLink, ShieldAlert, Check, X } from 'lucide-react';

export default function ReviewQueue() {
  const { reviews, setReviews, updateAlumniStatus, addLog } = useAppContext();

  // For simulation: find 'Perlu Verifikasi Manual' alumni that haven't been added to review queue
  const { alumni } = useAppContext();
  const needReviewAlumni = alumni.filter(a => a.status_pelacakan === 'Perlu Verifikasi Manual');

  const pendingReviews = [
    ...reviews,
    // Add mock review data for newly added alumni who might have gotten 'Perlu Verifikasi Manual' in TrackingSim
    ...needReviewAlumni
      .filter(a => !reviews.some(r => r.alumni_id === a.id))
      .map(a => ({
        id: `REV-00${Math.floor(Math.random() * 1000)}`,
        alumni_id: a.id,
        alumni_name: a.nama_lengkap,
        tanggal_ditemukan: a.last_tracked_date || new Date().toISOString().split('T')[0],
        kandidat_teratas: [
          { id: `c-${a.id}-1`, nama: a.nama_lengkap, instansi: 'Perusahaan Anonim', jabatan: 'Pegawai', score: 68, sumber: 'LinkedIn' },
          { id: `c-${a.id}-2`, nama: a.variasi_nama[0] || a.nama_lengkap, instansi: 'Kampus Lain', jabatan: 'Mahasiswa', score: 50, sumber: 'Google Scholar' },
        ],
        status: 'Pending'
      }))
  ];

  const handleApprove = (reviewId, alumniId, candidate) => {
    // 1. Update status
    updateAlumniStatus(alumniId, 'Teridentifikasi dari sumber publik', {
      instansi: candidate.instansi,
      jabatan: candidate.jabatan,
      sumber: candidate.sumber,
      confidence: 'Sangat Tinggi (Verified Manual)'
    });
    
    // 2. Remove from reviews (or mark as done)
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    addLog(`Review Manual disetujui untuk profil ${candidate.nama}. Kandidat terpilih.`, 'success');
  };

  const handleRejectAll = (reviewId, alumniId) => {
    updateAlumniStatus(alumniId, 'Tidak Ditemukan (Setelah Review)', null);
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    addLog(`Kandidat ditolak oleh Reviewer untuk profil ID ${alumniId}.`, 'warning');
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">Antrean Verifikasi Manual</h1>
        <p className="page-subtitle">Disambiguasi kandidat (Human-in-the-loop) untuk skor ambiguitas sedang (40-69)</p>
      </div>

      {pendingReviews.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CheckSquare className="empty-icon text-accent-green" />
            <div className="empty-title">Semua Clear!</div>
            <div className="empty-desc">Tidak ada profil ambien yang masuk ke antrean verifikasi manual.</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingReviews.map(review => (
            <div key={review.id} className="card border-l-4 border-l-accent-orange">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-accent-orange font-bold uppercase tracking-wider mb-1">Butuh Review (Ambiguitas)</div>
                  <h2 className="text-lg font-bold text-text-primary">{review.alumni_name}</h2>
                  <div className="text-xs text-muted">ID Profile: {review.alumni_id} • Ditemukan: {review.tanggal_ditemukan}</div>
                </div>
                <div className="bg-[rgba(246,173,85,0.1)] text-accent-orange p-2 rounded">
                  <ShieldAlert size={20} />
                </div>
              </div>

              <div className="text-xs text-muted mb-3 font-semibold uppercase">Pilih Kandidat Teratas:</div>
              
              <div className="space-y-3 mb-6">
                {review.kandidat_teratas.map(k => (
                  <div key={k.id} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3 hover:border-[rgba(99,179,237,0.3)] transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm mb-1">{k.nama}</div>
                        <div className="text-xs text-muted flex gap-3">
                          <span>🏢 {k.instansi}</span>
                          <span>💼 {k.jabatan}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-muted">Match Score</div>
                        <div className="font-bold text-accent-orange">{k.score}/100</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)] flex justify-between items-center">
                      <div className="text-xs text-accent-blue flex items-center gap-1 cursor-pointer hover:underline">
                        <ExternalLink size={12} /> Buka Bukti ({k.sumber})
                      </div>
                      <button 
                        className="btn btn-xs btn-success"
                        onClick={() => handleApprove(review.id, review.alumni_id, k)}
                      >
                        <Check size={12} /> Ini Orang yang Benar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[rgba(255,255,255,0.1)] text-center">
                <button 
                  className="btn btn-sm btn-secondary w-full justify-center text-accent-red"
                  onClick={() => handleRejectAll(review.id, review.alumni_id)}
                >
                  <X size={14} /> Bukan Keduanya / Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
