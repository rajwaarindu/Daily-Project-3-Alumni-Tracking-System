import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Save, ShieldCheck, Globe, Database, Clock } from 'lucide-react';

export default function Settings() {
  const { sources, setSources } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Simulate API delay
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };

  const toggleSource = (id) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">Pengaturan Sistem</h1>
        <p className="page-subtitle">Konfigurasi sumber data, prioritas scraping, dan threshold skor</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header border-b pb-4 border-[rgba(255,255,255,0.05)]">
            <h2 className="card-title flex items-center gap-2">
              <Globe size={18} className="text-accent-blue" />
              Sumber Pelacakan Publik
            </h2>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-muted mb-4">Pilih sumber pencarian yang diizinkan sesuai Term of Services (ToS).</p>
            
            {sources.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 mb-2 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] transition-all">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={s.isEnabled} 
                    onChange={() => toggleSource(s.id)}
                    className="w-4 h-4 rounded text-accent-blue bg-gray-800 border-gray-600 focus:ring-accent-blue focus:ring-2"
                  />
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-muted flex gap-2 mt-1">
                      <span className="badge badge-muted py-0">{s.type}</span>
                      {s.api ? <span className="badge badge-success py-0 border-none">API Tersedia</span> : <span className="badge badge-warning py-0 border-none">Web Scraping</span>}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted">Priority: {s.priority}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header border-b pb-4 border-[rgba(255,255,255,0.05)]">
            <h2 className="card-title flex items-center gap-2">
              <ShieldCheck size={18} className="text-accent-green" />
              Aturan Disambiguasi & Threshold
            </h2>
          </div>
          
          <div className="mt-4">
            <form onSubmit={e => e.preventDefault()}>
              <div className="form-group">
                <label className="form-label flex justify-between">
                  <span>Threshold: Kemungkinan Kuat (Teridentifikasi)</span>
                  <span className="text-accent-green">≥ 70 Score</span>
                </label>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar bg-accent-green" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-muted mt-2">Skor minimal untuk otomasi update profil tanpa intervensi manusia.</p>
              </div>

              <div className="divider"></div>

              <div className="form-group">
                <label className="form-label flex justify-between">
                  <span>Threshold: Perlu Verifikasi (Ambiguitas)</span>
                  <span className="text-accent-orange">40 - 69 Score</span>
                </label>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar bg-accent-orange" style={{ width: '40%' }}></div>
                </div>
                <p className="text-xs text-muted mt-2">Kandidat dengan skor di rentang ini akan dikirim ke antrean Reviewer (Human-in-the-loop).</p>
              </div>

              <div className="divider"></div>

              <div className="form-group">
                <label className="form-label">Bobot Ekstraksi Sinyal (Simulasi)</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm bg-[rgba(255,255,255,0.05)] p-2 rounded">Kecocokan Nama (Persis): <strong className="float-right text-accent-blue">+50</strong></div>
                  <div className="text-sm bg-[rgba(255,255,255,0.05)] p-2 rounded">Afiliasi Institusi: <strong className="float-right text-accent-blue">+25</strong></div>
                  <div className="text-sm bg-[rgba(255,255,255,0.05)] p-2 rounded">Kesamaan Topik: <strong className="float-right text-accent-blue">+10</strong></div>
                  <div className="text-sm bg-[rgba(255,255,255,0.05)] p-2 rounded">Kesesuaian Tahun: <strong className="float-right text-accent-blue">+10</strong></div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button 
                  type="button"
                  className={`btn ${isSaving ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Clock size={16} className="animate-spin"/> : <Save size={16}/>} 
                  {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
                {saveSuccess && (
                  <span className="text-sm text-accent-green flex items-center gap-1 animate-fade font-medium">
                    <ShieldCheck size={16} /> Berhasil disimpan
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
