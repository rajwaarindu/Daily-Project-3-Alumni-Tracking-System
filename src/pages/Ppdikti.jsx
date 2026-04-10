import React, { useEffect, useMemo, useState } from 'react';
import { Search, University, User, BookOpen, Loader2, ExternalLink } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { dedupeAlumniById, selectVerifiedAlumni } from '../lib/verifiedAlumni';

const PDDIKTI_PROXY_BASE = '/api-pddikti';

async function requestPddikti(path) {
    const response = await fetch(`${PDDIKTI_PROXY_BASE}${path}`);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        const bodyText = await response.text();
        const preview = bodyText.slice(0, 80).replace(/\s+/g, ' ').trim();
        const error = new Error(`Respons bukan JSON (Content-Type: ${contentType || 'unknown'}) - ${preview}`);
        error.status = response.status;
        throw error;
    }

    if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

function buildKeyword(query) {
    return [query.namaLengkap, query.universitas, query.prodi]
        .map(part => part.trim())
        .filter(Boolean)
        .join(' ');
}

function DetailRow({ label, value }) {
    return (
        <div className="ppdikti-detail-row">
            <div className="ppdikti-detail-label">{label}</div>
            <div className="ppdikti-detail-value">{value || '-'}</div>
        </div>
    );
}

export default function PPDIKTI() {
    const {
        alumni,
        alumniLoading,
        verifyAlumniPpdikti,
        selectedPpdiktiAlumni,
        selectAlumniForPpdikti,
    } = useAppContext();
    const [query, setQuery] = useState({
        namaLengkap: '',
        universitas: '',
        prodi: '',
    });
    const [searchLoading, setSearchLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [detailError, setDetailError] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedAlumniRecordId, setSelectedAlumniRecordId] = useState('');
    const [alumniPickerTerm, setAlumniPickerTerm] = useState('');
    const [selectedMahasiswaId, setSelectedMahasiswaId] = useState('');
    const [mahasiswaDetail, setMahasiswaDetail] = useState(null);
    const [verifySaving, setVerifySaving] = useState(false);

    const uniqueAlumni = useMemo(() => dedupeAlumniById(alumni), [alumni]);
    const verifiedAlumni = useMemo(() => selectVerifiedAlumni(uniqueAlumni), [uniqueAlumni]);

    const selectedAlumniRecord = useMemo(
        () => alumni.find(item => item.id === selectedAlumniRecordId) || null,
        [alumni, selectedAlumniRecordId]
    );

    const activeSelectedAlumni = useMemo(
        () => selectedAlumniRecord || selectedPpdiktiAlumni || null,
        [selectedAlumniRecord, selectedPpdiktiAlumni]
    );

    const activeSelectedAlumniId = useMemo(
        () => (activeSelectedAlumni?.id ? String(activeSelectedAlumni.id) : ''),
        [activeSelectedAlumni]
    );

    const unverifiedAlumni = useMemo(
        () => uniqueAlumni.filter(item => !item.ppdikti_verified),
        [uniqueAlumni]
    );

    const filteredAlumniForPicker = useMemo(() => {
        const keyword = alumniPickerTerm.trim().toLowerCase();
        const quickPickerSource = verifiedAlumni;

        if (!keyword) {
            return quickPickerSource.slice(0, 10);
        }

        return quickPickerSource
            .filter((item) =>
                String(item.id || '').toLowerCase().includes(keyword)
                || String(item.nama_lengkap || '').toLowerCase().includes(keyword)
            )
            .slice(0, 10);
    }, [verifiedAlumni, alumniPickerTerm]);

    const handleChooseAlumni = (row) => {
        setSelectedAlumniRecordId(row.id);
        selectAlumniForPpdikti(row);
        setSearchError('');
        setDetailError('');
    };

    useEffect(() => {
        if (!selectedAlumniRecordId && unverifiedAlumni.length > 0) {
            setSelectedAlumniRecordId(unverifiedAlumni[0].id);
        }
    }, [selectedAlumniRecordId, unverifiedAlumni]);

    useEffect(() => {
        if (!selectedPpdiktiAlumni) {
            return;
        }

        const selectedFromQueue = alumni.find((item) => item.id === selectedPpdiktiAlumni.id) || null;
        const sourceRecord = selectedFromQueue || selectedPpdiktiAlumni;

        const firstAffiliation = Array.isArray(sourceRecord.afiliasi_kata_kunci)
            ? sourceRecord.afiliasi_kata_kunci[0] || ''
            : '';
        const firstProdi = Array.isArray(sourceRecord.konteks_kata_kunci)
            ? sourceRecord.konteks_kata_kunci[0] || ''
            : '';

        setQuery({
            namaLengkap: sourceRecord.nama_lengkap || '',
            universitas: firstAffiliation,
            prodi: firstProdi,
        });

        setSelectedMahasiswaId('');
        setSearchResults([]);
        setSearchError('');
        setDetailError('');
        setMahasiswaDetail(sourceRecord.ppdikti_detail || null);

        if (selectedFromQueue && selectedFromQueue.id !== selectedAlumniRecordId) {
            setSelectedAlumniRecordId(selectedFromQueue.id);
        }
    }, [alumni, selectedAlumniRecordId, selectedPpdiktiAlumni]);

    useEffect(() => {
        if (!selectedAlumniRecord) return;

        const firstAffiliation = Array.isArray(selectedAlumniRecord.afiliasi_kata_kunci)
            ? selectedAlumniRecord.afiliasi_kata_kunci[0] || ''
            : '';
        const firstProdi = Array.isArray(selectedAlumniRecord.konteks_kata_kunci)
            ? selectedAlumniRecord.konteks_kata_kunci[0] || ''
            : '';

        setQuery({
            namaLengkap: selectedAlumniRecord.nama_lengkap || '',
            universitas: firstAffiliation,
            prodi: firstProdi,
        });
        setSelectedMahasiswaId('');
        setSearchResults([]);
        setMahasiswaDetail(selectedAlumniRecord.ppdikti_detail || null);
    }, [selectedAlumniRecord]);

    // FIX: gunakan encodeURIComponent agar spasi → %20, konsisten dengan urlencode PHP
    // lalu replace %20 kembali ke spasi agar path-nya terbaca API (beberapa API butuh ini)
    // Kalau API butuh spasi literal: hapus .replace(/%20/g, ' ')
    // Kalau API butuh %20: biarkan encodeURIComponent saja
    // FIX: dependency array yang benar — ikut perubahan query
    const queryPreview = useMemo(() => buildKeyword(query), [query]);

    const handleQueryChange = (field, value) => {
        setQuery(prev => ({ ...prev, [field]: value }));
    };

    const searchMahasiswa = async (event) => {
        event.preventDefault();
        setSearchError('');

        if (!query.namaLengkap.trim() || !query.universitas.trim()) {
            setSearchError('Nama lengkap dan universitas wajib diisi.');
            return;
        }

        const keyword = buildKeyword(query);

        setSearchLoading(true);
        setSearchResults([]);
        setMahasiswaDetail(null);
        setDetailError('');

        try {
            const data = await requestPddikti(`/search/mhs/${encodeURIComponent(keyword)}/`);
            console.log(
            `/api-pddikti/search/mhs/${encodeURIComponent(keyword)}/`
            );
            const rows = Array.isArray(data)
                ? data
                : Array.isArray(data?.mahasiswa)
                    ? data.mahasiswa
                    : [];
            setSearchResults(rows);
            setSelectedMahasiswaId(rows.length > 0 ? rows[0].id : '');
        } catch (error) {
            setSearchError(
                error.status
                    ? `Gagal mencari data mahasiswa (${error.status}).`
                    : error.message || 'Terjadi kesalahan saat mencari data PPDIKTI.'
            );
        } finally {
            setSearchLoading(false);
        }
    };

    const fetchMahasiswaDetail = async (event) => {
        event.preventDefault();
        setDetailError('');

        const trimmedId = selectedMahasiswaId.trim();
        if (!trimmedId) {
            setDetailError('ID mahasiswa wajib diisi untuk melihat detail.');
            return;
        }

        setDetailLoading(true);
        setMahasiswaDetail(null);

        try {
            // Trailing slash wajib sesuai endpoint Django
            const data = await requestPddikti(`/mhs/detail/${trimmedId}/`);
            setMahasiswaDetail(data);
        } catch (error) {
            setDetailError(
                error.status
                    ? `Gagal memuat detail mahasiswa (${error.status}).`
                    : error.message || 'Terjadi kesalahan saat memuat detail mahasiswa.'
            );
        } finally {
            setDetailLoading(false);
        }
    };

    const saveVerification = async (verified) => {
        if (!activeSelectedAlumniId) {
            setDetailError('Pilih data alumni terlebih dahulu.');
            return;
        }

        setVerifySaving(true);
        setDetailError('');

        try {
            await verifyAlumniPpdikti(activeSelectedAlumniId, verified, mahasiswaDetail);
        } catch (error) {
            setDetailError(error.message || 'Gagal menyimpan status verifikasi PPDIKTI.');
        } finally {
            setVerifySaving(false);
        }
    };

    return (
        <div className="animate-fade">
            <div className="page-header">
                <h1 className="page-title">Cek Mahasiswa PDDIKTI</h1>
                <p className="page-subtitle">Cari mahasiswa berdasarkan nama lengkap dan universitas, lalu ambil detail dari ID hasil pencarian.</p>
            </div>

            <div className="ppdikti-grid">
                {/* ── Panel Antrian ── */}
                <section className="card">
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">Antrian Verifikasi Alumni</h2>
                            <p className="text-sm text-muted">Pilih data alumni dari Supabase agar proses pengecekan dilakukan satu per satu.</p>
                        </div>
                        <div className="badge badge-info">Belum Verifikasi: {unverifiedAlumni.length}</div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Pilih Alumni Cepat (Sudah Verified)</label>
                        <div className="search-box">
                            <Search size={16} className="text-muted" />
                            <input
                                type="text"
                                value={alumniPickerTerm}
                                onChange={(event) => setAlumniPickerTerm(event.target.value)}
                                placeholder="Cari nama atau ID alumni verified..."
                            />
                        </div>
                        <div className="ppdikti-result-list" style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
                            {filteredAlumniForPicker.map((row) => (
                                <button
                                    key={`picker-${row.id}`}
                                    type="button"
                                    className={`ppdikti-queue-item ${activeSelectedAlumniId === String(row.id) ? 'active' : ''}`}
                                    onClick={() => handleChooseAlumni(row)}
                                >
                                    <div className="ppdikti-result-head">
                                        <div>
                                            <div className="ppdikti-result-name">{row.nama_lengkap}</div>
                                            <div className="text-xs text-muted">{row.id}</div>
                                        </div>
                                        <span className={`badge ${row.ppdikti_verified ? 'badge-success' : 'badge-muted'}`}>
                                            {row.ppdikti_verified ? 'Verified' : 'Pending'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {filteredAlumniForPicker.length === 0 && (
                                <div className="text-xs text-muted">Data alumni verified tidak ditemukan.</div>
                            )}
                        </div>
                    </div>

                    {alumniLoading ? (
                        <div className="text-sm text-muted">Memuat data alumni dari Supabase...</div>
                    ) : (
                        <div className="ppdikti-result-list">
                            {unverifiedAlumni.length === 0 && (
                                <div className="text-sm text-muted">Semua data alumni sudah diverifikasi PPDIKTI.</div>
                            )}
                            {unverifiedAlumni.map((row) => (
                                <button
                                    key={row.id}
                                    type="button"
                                    className={`ppdikti-queue-item ${selectedAlumniRecordId === row.id ? 'active' : ''}`}
                                    onClick={() => handleChooseAlumni(row)}
                                >
                                    <div className="ppdikti-result-head">
                                        <div>
                                            <div className="ppdikti-result-name">{row.nama_lengkap}</div>
                                            <div className="text-xs text-muted">{row.id}</div>
                                        </div>
                                        <span className="badge badge-muted">Pending</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Panel Pencarian ── */}
                <section className="card">
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">Pencarian Mahasiswa</h2>
                            <p className="text-sm text-muted">Endpoint: /search/mhs/{'<keyword>'}</p>
                        </div>
                        <a className="btn btn-secondary" href="https://api-pddikti.rone.dev" target="_blank" rel="noreferrer">
                            <ExternalLink size={14} /> API
                        </a>
                    </div>

                    {selectedPpdiktiAlumni && (
                        <div className="auth-alert" style={{ marginBottom: 12 }}>
                            Data dari Data Master Alumni terhubung otomatis: <strong>{selectedPpdiktiAlumni.nama_lengkap}</strong>
                            {selectedPpdiktiAlumni.id && (
                                <span className="text-xs text-muted" style={{ marginLeft: 6 }}>
                                    ({selectedPpdiktiAlumni.id})
                                </span>
                            )}
                            <button
                                type="button"
                                className="btn btn-xs btn-secondary"
                                style={{ marginLeft: 12 }}
                                onClick={() => selectAlumniForPpdikti(null)}
                            >
                                Bersihkan Pilihan
                            </button>
                        </div>
                    )}

                    <form onSubmit={searchMahasiswa} className="ppdikti-form">
                        <div className="form-group">
                            <label className="form-label">Data Alumni Terpilih</label>
                            <div className="search-box">
                                <User size={16} className="text-muted" />
                                <input
                                    type="text"
                                    value={activeSelectedAlumni ? `${activeSelectedAlumni.id} - ${activeSelectedAlumni.nama_lengkap}` : ''}
                                    readOnly
                                    placeholder="Pilih alumni dari panel antrian"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nama Lengkap</label>
                            <div className="search-box">
                                <User size={16} className="text-muted" />
                                <input
                                    type="text"
                                    value={query.namaLengkap}
                                    onChange={(e) => handleQueryChange('namaLengkap', e.target.value)}
                                    placeholder="Contoh: Ridwan Halim"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Universitas</label>
                            <div className="search-box">
                                <University size={16} className="text-muted" />
                                <input
                                    type="text"
                                    value={query.universitas}
                                    onChange={(e) => handleQueryChange('universitas', e.target.value)}
                                    placeholder="Contoh: UTY"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Program Studi (Opsional)</label>
                            <div className="search-box">
                                <BookOpen size={16} className="text-muted" />
                                <input
                                    type="text"
                                    value={query.prodi}
                                    onChange={(e) => handleQueryChange('prodi', e.target.value)}
                                    placeholder="Contoh: Informatika"
                                />
                            </div>
                        </div>

                        <div className="ppdikti-query-preview">
                            URL yang dipanggil:&nbsp;
                            <strong>
                                {queryPreview
                                    ? `https://api-pddikti.rone.dev/search/mhs/${queryPreview}`
                                    : '-'}
                            </strong>
                        </div>

                        {searchError && <div className="auth-alert">{searchError}</div>}

                        <button className="btn btn-primary" type="submit" disabled={searchLoading}>
                            {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            {searchLoading ? 'Mencari...' : 'Cari Mahasiswa'}
                        </button>
                    </form>

                    <div className="ppdikti-result-section">
                        {searchResults.length === 0 ? (
                            <div className="text-sm text-muted">Belum ada hasil. Jalankan pencarian untuk menampilkan data mahasiswa.</div>
                        ) : (
                            <div className="ppdikti-result-list">
                                {searchResults.map((row) => (
                                    <article className="ppdikti-result-item" key={row.id}>
                                        <div className="ppdikti-result-head">
                                            <div>
                                                <div className="ppdikti-result-name">{row.nama || '-'}</div>
                                                <div className="text-xs text-muted">NIM: {row.nim || '-'}</div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-secondary"
                                                onClick={() => {
                                                    setSelectedMahasiswaId(row.id);
                                                    setDetailError('');
                                                }}
                                            >
                                                Gunakan ID
                                            </button>
                                        </div>
                                        <div className="ppdikti-meta-grid">
                                            <span className="chip">{row.nama_prodi || '-'}</span>
                                            <span className="chip">{row.nama_pt || row.sinkatan_pt || '-'}</span>
                                        </div>
                                        <div className="text-xs text-muted">ID: {row.id}</div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Panel Detail ── */}
                <section className="card">
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">Detail Mahasiswa</h2>
                            <p className="text-sm text-muted">Endpoint: /mhs/detail/{'{id_mahasiswa}'}/ (trailing slash wajib)</p>
                        </div>
                    </div>

                    <form onSubmit={fetchMahasiswaDetail} className="ppdikti-form">
                        <div className="form-group">
                            <label className="form-label">ID Mahasiswa</label>
                            <div className="search-box">
                                <Search size={16} className="text-muted" />
                                <input
                                    type="text"
                                    value={selectedMahasiswaId}
                                    onChange={(e) => setSelectedMahasiswaId(e.target.value)}
                                    placeholder="Paste ID mahasiswa dari hasil pencarian"
                                />
                            </div>
                        </div>

                        {detailError && <div className="auth-alert">{detailError}</div>}

                        <button className="btn btn-primary" type="submit" disabled={detailLoading}>
                            {detailLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            {detailLoading ? 'Memuat Detail...' : 'Ambil Detail Mahasiswa'}
                        </button>
                    </form>

                    <div className="ppdikti-result-section">
                        <h3 className="ppdikti-subtitle">Data Detail</h3>
                        {!mahasiswaDetail ? (
                            <div className="text-sm text-muted">Detail mahasiswa akan tampil di sini setelah endpoint dipanggil.</div>
                        ) : (
                            <>
                                <div className="ppdikti-detail-card">
                                    <DetailRow label="Nama" value={mahasiswaDetail.nama} />
                                    <DetailRow label="NIM" value={mahasiswaDetail.nim} />
                                    <DetailRow label="Perguruan Tinggi" value={mahasiswaDetail.nama_pt} />
                                    <DetailRow label="Kode PT" value={mahasiswaDetail.kode_pt} />
                                    <DetailRow label="Program Studi" value={mahasiswaDetail.prodi} />
                                    <DetailRow label="Kode Prodi" value={mahasiswaDetail.kode_prodi} />
                                    <DetailRow label="Jenjang" value={mahasiswaDetail.jenjang} />
                                    <DetailRow label="Jenis Kelamin" value={mahasiswaDetail.jenis_kelamin} />
                                    <DetailRow label="Jenis Daftar" value={mahasiswaDetail.jenis_daftar} />
                                    <DetailRow label="Status Saat Ini" value={mahasiswaDetail.status_saat_ini} />
                                    <DetailRow label="Tanggal Masuk" value={mahasiswaDetail.tanggal_masuk} />
                                </div>

                                <div className="ppdikti-verify-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        disabled={verifySaving}
                                        onClick={() => saveVerification(false)}
                                    >
                                        Tandai Belum Verifikasi
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        disabled={verifySaving}
                                        onClick={() => saveVerification(true)}
                                    >
                                        {verifySaving ? 'Menyimpan...' : 'Tandai Terverifikasi PPDIKTI'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}