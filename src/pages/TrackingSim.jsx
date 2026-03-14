import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Search, Play, CheckCircle, Clock, Database, Globe } from 'lucide-react';

export default function TrackingSim() {
  const { alumni, addLog, updateAlumniStatus } = useAppContext();
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('Standby');

  const pendingAlumni = alumni.filter(a => a.status_pelacakan === 'Belum Dilacak');

  const runSimulation = async () => {
    if (pendingAlumni.length === 0) return;
    
    setIsSimulating(true);
    setProgress(0);
    
    addLog(`Memulai job pelacakan untuk ${pendingAlumni.length} alumni...`, 'info');

    // MENSIMULASIKAN PSEUDOCODE
    
    for (let i = 0; i < pendingAlumni.length; i++) {
      const target = pendingAlumni[i];
      const targetBaseProgress = (i / pendingAlumni.length) * 100;
      
      // 1) Prepare Profile
      setCurrentAction(`1. Menyiapkan Profil: ${target.nama_lengkap} (Alias: ${target.variasi_nama.length})`);
      await new Promise(r => setTimeout(r, 600));
      setProgress(targetBaseProgress + (10 / pendingAlumni.length));

      // 2) Generate Queries & Fetch
      setCurrentAction(`2. Membuat Search Queries & Mengambil Hasil (${target.nama_lengkap} + ${target.afiliasi_kata_kunci[0]})`);
      await new Promise(r => setTimeout(r, 800));
      setProgress(targetBaseProgress + (40 / pendingAlumni.length));

      // 3) Extract Signals & Disambiguate
      setCurrentAction(`3. Ekstraksi Sinyal & Disambiguasi untuk Kandidat`);
      await new Promise(r => setTimeout(r, 800));
      setProgress(targetBaseProgress + (70 / pendingAlumni.length));
      
      // 4) Cross Validate & Determine Status
      setCurrentAction(`4. Cross-Validation & Skor Akhir...`);
      await new Promise(r => setTimeout(r, 600));

      // Simulate a random outcome for demo purposes
      // Based on id modulo to have reproducible dummy results
      const outcomeCode = target.id.charCodeAt(target.id.length - 1) % 3;

      if (outcomeCode === 0) {
        // High Score
        updateAlumniStatus(target.id, 'Teridentifikasi dari sumber publik', {
          instansi: 'PT. Teknologi Nasional',
          jabatan: 'Senior Engineer',
          sumber: 'LinkedIn, Google Scholar',
          confidence: 'Tinggi (85%)'
        });
        addLog(`[Job] ${target.nama_lengkap} teridentifikasi kuat (Score: 85). Profile diperbarui.`, 'success');
      } else if (outcomeCode === 1) {
        // Medium Score - Ambiguitas
        updateAlumniStatus(target.id, 'Perlu Verifikasi Manual', null);
        addLog(`[Job] Ambiguitas pada ${target.nama_lengkap} (Score: 60). Menunggu review manual.`, 'warning');
      } else {
        // Low Score - Tidak Ditemukan
        updateAlumniStatus(target.id, 'Tidak Ditemukan di Sumber Publik', null);
        addLog(`[Job] Tidak ada kandidat relevan untuk ${target.nama_lengkap} (Score < 40).`, 'error');
      }

      setProgress(targetBaseProgress + (100 / pendingAlumni.length));
    }

    // Done
    setCurrentAction('Penyimpanan Jejak Bukti (Audit Trail) selesai.');
    await new Promise(r => setTimeout(r, 500));
    
    setIsSimulating(false);
    setProgress(100);
    setCurrentAction('Scheduler Job Selesai');
    addLog('Job "Pelacakan Alumni Publik" (Scheduler) selesai dieksekusi.', 'info');
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">Job Pelacakan Otomatis</h1>
        <p className="page-subtitle">Simulasi scheduler untuk tracking otomatis (Generate URLs, Extract Signals, Scoring)</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header border-b pb-4 border-[rgba(255,255,255,0.05)]">
            <h2 className="card-title flex items-center gap-2">
              <Database size={18} className="text-accent-blue" />
              Kontrol Job Target
            </h2>
          </div>
          
          <div className="mt-4">
            <div className="flex gap-4 mb-6">
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-4 rounded-lg flex-1 text-center">
                <div className="text-3xl font-bold font-mono text-accent-blue mb-1">{pendingAlumni.length}</div>
                <div className="text-xs text-muted uppercase tracking-wider">Target Belum Dilacak</div>
              </div>
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-4 rounded-lg flex-1 text-center">
                <div className="text-3xl font-bold font-mono text-text-primary mb-1">Weekly</div>
                <div className="text-xs text-muted uppercase tracking-wider">Jadwal (Scheduler)</div>
              </div>
            </div>

            <button 
              className={`btn w-full justify-center py-3 text-sm ${isSimulating ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}
              onClick={runSimulation}
              disabled={isSimulating || pendingAlumni.length === 0}
            >
              {isSimulating ? (
                <><Clock size={18} className="animate-spin" /> Menjalankan Pelacakan...</>
              ) : (
                <><Play size={18} /> Run Job Pelacakan Sekarang ({pendingAlumni.length})</>
              )}
            </button>
            
            {pendingAlumni.length === 0 ? (
              <p className="text-center text-xs text-muted mt-2 text-accent-green">Semua data alumni sudah dilacak.</p>
            ) : (
              <div className="mt-4 border border-[rgba(255,255,255,0.05)] rounded bg-[rgba(0,0,0,0.2)] max-h-40 overflow-y-auto">
                <div className="text-xs font-semibold text-muted p-2 sticky top-0 bg-[#0a0e1a] border-b border-[rgba(255,255,255,0.05)]">Antrean Target:</div>
                {pendingAlumni.map((a, idx) => (
                  <div key={a.id} className="text-xs p-2 border-b border-[rgba(255,255,255,0.05)] last:border-0 flex justify-between items-center hover:bg-[rgba(255,255,255,0.02)]">
                    <span className="flex items-center gap-2">
                      <span className="text-muted w-4">{idx + 1}.</span> {a.nama_lengkap}
                    </span>
                    <span className="text-muted font-mono">{a.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header border-b pb-4 border-[rgba(255,255,255,0.05)]">
            <h2 className="card-title flex items-center gap-2">
              <Globe size={18} className="text-accent-purple" />
              Progress Real-time
            </h2>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-accent-blue">Proses Saat Ini (Live Console)</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            <div className="progress-bar-wrapper h-3 mb-6">
              <div 
                className="progress-bar bg-accent-blue" 
                style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
              ></div>
            </div>

            <div className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] p-4 rounded-lg text-sm font-mono text-accent-green h-32 flex flex-col justify-end">
              <div className="animate-pulse">
                &gt; {currentAction}
                {isSimulating && <span className="animate-pulse">_</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-header border-b pb-4 border-[rgba(255,255,255,0.05)]">
          <h2 className="card-title flex items-center gap-2">
            <Search size={18} className="text-text-primary" />
            Alur Proses Berjalan (Pseudocode Implementation)
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-1 bg-[rgba(255,255,255,0.05)] z-0 rounded"></div>
          
          <div className="text-center relative z-10">
            <div className="w-14 h-14 mx-auto bg-[#0a0e1a] border-2 border-[rgba(99,179,237,0.3)] rounded-full flex items-center justify-center mb-3">
              <span className="font-bold text-accent-blue">1</span>
            </div>
            <div className="font-semibold text-[13px] mb-1">Generate Queries</div>
            <div className="text-xs text-muted">Pembuatan query per sumber (Scholar, Web)</div>
          </div>
          
          <div className="text-center relative z-10">
            <div className="w-14 h-14 mx-auto bg-[#0a0e1a] border-2 border-[rgba(99,179,237,0.3)] rounded-full flex items-center justify-center mb-3">
              <span className="font-bold text-accent-blue">2</span>
            </div>
            <div className="font-semibold text-[13px] mb-1">Fetch & Parse</div>
            <div className="text-xs text-muted">Akses API/Web, parsing snippet kandidat</div>
          </div>

          <div className="text-center relative z-10">
            <div className="w-14 h-14 mx-auto bg-[#0a0e1a] border-2 border-[rgba(159,122,234,0.3)] rounded-full flex items-center justify-center mb-3">
              <span className="font-bold text-accent-purple">3</span>
            </div>
            <div className="font-semibold text-[13px] mb-1">Extract Signals</div>
            <div className="text-xs text-muted">NER, Ekstraksi lokasi, instansi, tahun (Scoring)</div>
          </div>

          <div className="text-center relative z-10">
            <div className="w-14 h-14 mx-auto bg-[#0a0e1a] border-2 border-[rgba(104,211,145,0.3)] rounded-full flex items-center justify-center mb-3">
              <span className="font-bold text-accent-green">4</span>
            </div>
            <div className="font-semibold text-[13px] mb-1">Cross-Validation</div>
            <div className="text-xs text-muted">Disambiguasi threshold, final status</div>
          </div>
        </div>
      </div>
    </div>
  );
}
