import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Search, Plus, Edit2, X, GraduationCap, Trash2 } from 'lucide-react';

export default function AlumniList() {
  const navigate = useNavigate();
  const {
    alumni,
    alumniLoading,
    addLog,
    addAlumni,
    updateAlumni,
    deleteAlumni,
    selectAlumniForPpdikti,
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAlumniId, setSelectedAlumniId] = useState('');
  const [formError, setFormError] = useState('');
  const [newAlumni, setNewAlumni] = useState({
    nama_lengkap: '',
    variasi_nama: '',
    afiliasi_kata_kunci: '',
    konteks_kata_kunci: ''
  });

  const selectedAlumni = useMemo(
    () => alumni.find((item) => item.id === selectedAlumniId) || null,
    [alumni, selectedAlumniId]
  );

  const filteredAlumni = useMemo(() => {
    return alumni.filter(a =>
      (a.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(a.id).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [alumni, searchTerm]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    const dataToSave = {
      nama_lengkap: newAlumni.nama_lengkap,
      variasi_nama: newAlumni.variasi_nama.split(',').map(s => s.trim()).filter(Boolean),
      afiliasi_kata_kunci: newAlumni.afiliasi_kata_kunci.split(',').map(s => s.trim()).filter(Boolean),
      konteks_kata_kunci: newAlumni.konteks_kata_kunci.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editingId) {
        const updated = await updateAlumni(editingId, dataToSave);
        if (selectedAlumni?.id === updated.id) {
          setSelectedAlumniId(updated.id);
        }
      } else {
        const created = await addAlumni({
          ...dataToSave,
          status_pelacakan: 'Belum Dilacak',
          last_tracked_date: null,
          hasil: null,
          ppdikti_verified: false,
        });
        setSelectedAlumniId(created.id);
      }
      closeModal();
    } catch (error) {
      setFormError(error.message || 'Gagal menyimpan data alumni.');
    }
  };

  const handleEdit = (alumniData) => {
    setEditingId(alumniData.id);
    setNewAlumni({
      nama_lengkap: alumniData.nama_lengkap,
      variasi_nama: alumniData.variasi_nama.join(', '),
      afiliasi_kata_kunci: alumniData.afiliasi_kata_kunci.join(', '),
      konteks_kata_kunci: alumniData.konteks_kata_kunci.join(', ')
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus alumni ini?')) {
      try {
        await deleteAlumni(id);
        if (selectedAlumni?.id === id) {
          setSelectedAlumniId('');
        }
      } catch (error) {
        window.alert(error.message || 'Gagal menghapus data alumni.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewAlumni({ nama_lengkap: '', variasi_nama: '', afiliasi_kata_kunci: '', konteks_kata_kunci: '' });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Teridentifikasi dari sumber publik': return <span className="badge badge-success">Teridentifikasi</span>;
      case 'Perlu Verifikasi Manual': return <span className="badge badge-warning">Perlu Verifikasi</span>;
      case 'Belum Dilacak': return <span className="badge badge-muted">Belum Dilacak</span>;
      default: return <span className="badge badge-danger">Tidak Ditemukan</span>;
    }
  };

  const getPpdiktiBadge = (isVerified) => {
    return isVerified
      ? <span className="badge badge-success">Terverifikasi</span>
      : <span className="badge badge-muted">Belum Verifikasi</span>;
  };

  const moveToPpdikti = (alumniData) => {
    selectAlumniForPpdikti(alumniData);
    if (addLog) {
      addLog(`Data alumni dipilih untuk cek PPDIKTI: ${alumniData.nama_lengkap}`, 'info');
    }
    navigate('/ppdikti');
  };

  return (
    <div className="animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Data Master Alumni</h1>
          <p className="page-subtitle">Kelola profil target pencarian alumni</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Tambah Alumni
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box">
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Cari nama atau ID alumni..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted">Total: {filteredAlumni.length} data</div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Lengkap</th>
                <th>Variasi Penulisan (Alias)</th>
                <th>Konteks Pencarian</th>
                <th>Status Pelacakan</th>
                <th>Verifikasi PPDIKTI</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {alumniLoading && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">Memuat data dari Supabase...</td>
                </tr>
              )}
              {filteredAlumni.map(a => (
                <tr key={a.id} className="table-row-clickable" onClick={() => setSelectedAlumniId(a.id)}>
                  <td><strong>{a.id}</strong></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} className="text-muted" />
                      <strong>{a.nama_lengkap}</strong>
                    </div>
                  </td>
                  <td>
                    {a.variasi_nama.slice(0, 2).map((alias, i) => (
                      <span key={i} className="chip">{alias}</span>
                    ))}
                    {a.variasi_nama.length > 2 && <span className="text-xs text-muted">+{a.variasi_nama.length - 2}</span>}
                  </td>
                  <td>
                    <div className="text-xs truncate" style={{ maxWidth: 200 }} title={a.konteks_kata_kunci.join(', ')}>
                      {a.konteks_kata_kunci.join(', ')}
                    </div>
                  </td>
                  <td>{getStatusBadge(a.status_pelacakan)}</td>
                  <td>{getPpdiktiBadge(a.ppdikti_verified)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-xs btn-secondary" onClick={(event) => { event.stopPropagation(); handleEdit(a); }}><Edit2 size={12} /> Edit</button>
                      <button className="btn btn-xs btn-primary" onClick={(event) => { event.stopPropagation(); moveToPpdikti(a); }}>Cek PPDIKTI</button>
                      <button className="btn btn-xs btn-outline border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white" onClick={(event) => { event.stopPropagation(); handleDelete(a.id); }}><Trash2 size={12} /> Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!alumniLoading && filteredAlumni.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">Tidak ada data alumni ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAlumni && (
        <div className="card mt-4">
          <div className="card-header">
            <div>
              <h3 className="card-title">Detail Alumni Terpilih</h3>
              <p className="text-sm text-muted">Klik baris data untuk menampilkan detail.</p>
            </div>
            <div>{getPpdiktiBadge(selectedAlumni.ppdikti_verified)}</div>
          </div>

          <div className="ppdikti-detail-card">
            <div className="ppdikti-detail-row">
              <div className="ppdikti-detail-label">ID</div>
              <div className="ppdikti-detail-value">{selectedAlumni.id}</div>
            </div>
            <div className="ppdikti-detail-row">
              <div className="ppdikti-detail-label">Nama Lengkap</div>
              <div className="ppdikti-detail-value">{selectedAlumni.nama_lengkap}</div>
            </div>
            <div className="ppdikti-detail-row">
              <div className="ppdikti-detail-label">Variasi Nama</div>
              <div className="ppdikti-detail-value">{(selectedAlumni.variasi_nama || []).join(', ') || '-'}</div>
            </div>
            <div className="ppdikti-detail-row">
              <div className="ppdikti-detail-label">Afiliasi Kata Kunci</div>
              <div className="ppdikti-detail-value">{(selectedAlumni.afiliasi_kata_kunci || []).join(', ') || '-'}</div>
            </div>
            <div className="ppdikti-detail-row">
              <div className="ppdikti-detail-label">Konteks Kata Kunci</div>
              <div className="ppdikti-detail-value">{(selectedAlumni.konteks_kata_kunci || []).join(', ') || '-'}</div>
            </div>
            <div className="ppdikti-detail-row">
              <div className="ppdikti-detail-label">Status Pelacakan</div>
              <div className="ppdikti-detail-value">{selectedAlumni.status_pelacakan}</div>
            </div>
            <div className="ppdikti-detail-row">
              <div className="ppdikti-detail-label">PPDIKTI Dicek Pada</div>
              <div className="ppdikti-detail-value">{selectedAlumni.ppdikti_checked_at || '-'}</div>
            </div>
          </div>

          {selectedAlumni.ppdikti_detail && (
            <div className="ppdikti-result-section mt-4">
              <h3 className="ppdikti-subtitle">Data PPDIKTI Tertaut</h3>
              <div className="ppdikti-detail-card">
                <div className="ppdikti-detail-row">
                  <div className="ppdikti-detail-label">Nama</div>
                  <div className="ppdikti-detail-value">{selectedAlumni.ppdikti_detail.nama || '-'}</div>
                </div>
                <div className="ppdikti-detail-row">
                  <div className="ppdikti-detail-label">NIM</div>
                  <div className="ppdikti-detail-value">{selectedAlumni.ppdikti_detail.nim || '-'}</div>
                </div>
                <div className="ppdikti-detail-row">
                  <div className="ppdikti-detail-label">Perguruan Tinggi</div>
                  <div className="ppdikti-detail-value">{selectedAlumni.ppdikti_detail.nama_pt || '-'}</div>
                </div>
                <div className="ppdikti-detail-row">
                  <div className="ppdikti-detail-label">Program Studi</div>
                  <div className="ppdikti-detail-value">{selectedAlumni.ppdikti_detail.prodi || '-'}</div>
                </div>
                <div className="ppdikti-detail-row">
                  <div className="ppdikti-detail-label">Status Saat Ini</div>
                  <div className="ppdikti-detail-value">{selectedAlumni.ppdikti_detail.status_saat_ini || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="modal-title mb-0">{editingId ? 'Edit Profil Alumni' : 'Tambah Profil Alumni'}</h2>
              <button className="chip-remove" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              {formError && <div className="auth-alert mb-4">{formError}</div>}

              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={newAlumni.nama_lengkap}
                  onChange={e => setNewAlumni({...newAlumni, nama_lengkap: e.target.value})}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Variasi Penulisan Nama (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newAlumni.variasi_nama}
                  onChange={e => setNewAlumni({...newAlumni, variasi_nama: e.target.value})}
                  placeholder="Contoh: Budi S., B. Santoso"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Afiliasi Institusi (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newAlumni.afiliasi_kata_kunci}
                  onChange={e => setNewAlumni({...newAlumni, afiliasi_kata_kunci: e.target.value})}
                  placeholder="Contoh: Universitas Muhammadiyah Malang, UMM"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Konteks Pekerjaan/Prodi (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newAlumni.konteks_kata_kunci}
                  onChange={e => setNewAlumni({...newAlumni, konteks_kata_kunci: e.target.value})}
                  placeholder="Contoh: Informatika, Software Engineer, Malang"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Profil</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
