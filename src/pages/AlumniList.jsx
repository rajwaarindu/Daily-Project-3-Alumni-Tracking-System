import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Search, Plus, Edit2, X, GraduationCap, Trash2 } from 'lucide-react';

export default function AlumniList() {
  const { alumni, addAlumni, updateAlumni, deleteAlumni } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newAlumni, setNewAlumni] = useState({
    nama_lengkap: '',
    variasi_nama: '',
    afiliasi_kata_kunci: '',
    konteks_kata_kunci: ''
  });

  const filteredAlumni = alumni.filter(a => 
    a.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e) => {
    e.preventDefault();
    const dataToSave = {
      nama_lengkap: newAlumni.nama_lengkap,
      variasi_nama: newAlumni.variasi_nama.split(',').map(s => s.trim()).filter(Boolean),
      afiliasi_kata_kunci: newAlumni.afiliasi_kata_kunci.split(',').map(s => s.trim()).filter(Boolean),
      konteks_kata_kunci: newAlumni.konteks_kata_kunci.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editingId) {
      updateAlumni(editingId, dataToSave);
    } else {
      addAlumni({
        ...dataToSave,
        status_pelacakan: 'Belum Dilacak',
        last_tracked_date: null,
        hasil: null
      });
    }
    closeModal();
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

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus alumni ini?')) {
      deleteAlumni(id);
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
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlumni.map(a => (
                <tr key={a.id}>
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
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-xs btn-secondary" onClick={() => handleEdit(a)}><Edit2 size={12} /> Edit</button>
                      <button className="btn btn-xs btn-outline border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDelete(a.id)}><Trash2 size={12} /> Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAlumni.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-muted">Tidak ada data alumni ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="modal-title mb-0">{editingId ? 'Edit Profil Alumni' : 'Tambah Profil Alumni'}</h2>
              <button className="chip-remove" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave}>
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
