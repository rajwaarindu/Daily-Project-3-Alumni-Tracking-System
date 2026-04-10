/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MOCK_LOGS, MOCK_REVIEWS, MOCK_SOURCES } from './MockData';
import { selectVerifiedAlumni } from '../lib/verifiedAlumni';

const AppContext = createContext();
const DETAIL_ALUMNI_TABLE = 'detail-alumni';

const normalizeStringList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const toDateOnly = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split('T')[0];
};

const normalizeAlumniRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    nama_lengkap: row.nama_lengkap || '',
    variasi_nama: normalizeStringList(row.variasi_nama),
    afiliasi_kata_kunci: normalizeStringList(row.afiliasi_kata_kunci),
    konteks_kata_kunci: normalizeStringList(row.konteks_kata_kunci),
    status_pelacakan: row.status_pelacakan || 'Belum Dilacak',
    last_tracked_date: row.last_tracked_date || null,
    hasil: row.hasil || null,
    ppdikti_verified: Boolean(row.ppdikti_verified),
    ppdikti_checked_at: row.ppdikti_checked_at || null,
    ppdikti_detail: row.ppdikti_detail || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
};

const buildAlumniPayload = (payload = {}) => {
  const preparedPayload = {
    nama_lengkap: String(payload.nama_lengkap || '').trim(),
    variasi_nama: normalizeStringList(payload.variasi_nama),
    afiliasi_kata_kunci: normalizeStringList(payload.afiliasi_kata_kunci),
    konteks_kata_kunci: normalizeStringList(payload.konteks_kata_kunci),
    status_pelacakan: String(payload.status_pelacakan || '').trim() || 'Belum Dilacak',
    last_tracked_date: payload.last_tracked_date ?? null,
    hasil: payload.hasil ?? null,
    ppdikti_verified: Boolean(payload.ppdikti_verified),
    ppdikti_checked_at: payload.ppdikti_checked_at ?? null,
    ppdikti_detail: payload.ppdikti_detail ?? null,
  };

  if (Object.prototype.hasOwnProperty.call(payload, 'id')) {
    preparedPayload.id = String(payload.id);
  }

  return preparedPayload;
};

const normalizePpdiktiSelection = (payload) => {
  if (!payload) {
    return null;
  }

  const normalized = normalizeAlumniRow(payload);
  return normalized ? {
    id: normalized.id,
    nama_lengkap: normalized.nama_lengkap,
    afiliasi_kata_kunci: normalized.afiliasi_kata_kunci,
    konteks_kata_kunci: normalized.konteks_kata_kunci,
    ppdikti_detail: normalized.ppdikti_detail,
    ppdikti_verified: normalized.ppdikti_verified,
    selected_at: new Date().toISOString(),
  } : null;
};

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [alumni, setAlumni] = useState([]);
  const [sources, setSources] = useState(MOCK_SOURCES);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [verifiedShowcaseAlumni, setVerifiedShowcaseAlumni] = useState([]);
  const [verifiedShowcaseLoading, setVerifiedShowcaseLoading] = useState(false);
  const [selectedPpdiktiAlumni, setSelectedPpdiktiAlumni] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setAuthUser(user ? {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email,
            createdAt: user.created_at,
            lastLoginAt: user.last_sign_in_at,
          } : null);
        }
      } catch {
        if (isMounted) {
          setAuthUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      const user = session?.user;
      setAuthUser(user ? {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email,
        createdAt: user.created_at,
        lastLoginAt: user.last_sign_in_at,
      } : null);
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadAlumni = async () => {
    setAlumniLoading(true);
    try {
      const { data, error } = await supabase
        .from(DETAIL_ALUMNI_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Gagal memuat data alumni dari Supabase.');
      }

      const normalizedRows = Array.isArray(data)
        ? data.map(normalizeAlumniRow).filter(Boolean)
        : [];
      setAlumni(normalizedRows);
    } finally {
      setAlumniLoading(false);
    }
  };

  const loadVerifiedShowcase = async () => {
    setVerifiedShowcaseLoading(true);
    try {
      const { data, error } = await supabase
        .from(DETAIL_ALUMNI_TABLE)
        .select('*')
        .eq('ppdikti_verified', true)
        .order('ppdikti_checked_at', { ascending: false, nullsFirst: false })
        .limit(8);

      if (error) {
        throw new Error(error.message || 'Gagal memuat data verifikasi PPDIKTI.');
      }

      const normalizedRows = Array.isArray(data)
        ? data.map(normalizeAlumniRow).filter(Boolean)
        : [];
      setVerifiedShowcaseAlumni(selectVerifiedAlumni(normalizedRows));
    } finally {
      setVerifiedShowcaseLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!authUser) {
      setAlumni([]);
      return;
    }

    loadAlumni().catch((error) => {
      addLog(error.message || 'Gagal memuat data alumni dari database.', 'error');
    });
  }, [authReady, authUser]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    loadVerifiedShowcase().catch(() => {
      setVerifiedShowcaseAlumni([]);
    });
  }, [authReady]);

  const verifiedAlumni = useMemo(() => selectVerifiedAlumni(alumni), [alumni]);
  const publicVerifiedAlumni = useMemo(() => {
    if (verifiedAlumni.length > 0) {
      return verifiedAlumni;
    }

    return selectVerifiedAlumni(verifiedShowcaseAlumni);
  }, [verifiedAlumni, verifiedShowcaseAlumni]);

  // Stats
  const stats = {
    total: alumni.length,
    identified: alumni.filter(a => a.status_pelacakan === 'Teridentifikasi dari sumber publik').length,
    needReview: alumni.filter(a => a.status_pelacakan === 'Perlu Verifikasi Manual' || reviews.some(r => r.alumni_id === a.id)).length,
    untracked: alumni.filter(a => a.status_pelacakan === 'Belum Dilacak').length
  };

  const addLog = (message, type = 'info') => {
    const newLog = {
      id: Date.now(),
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const updateAlumniStatus = (id, status, hasil = null) => {
    const trackedDate = toDateOnly(new Date().toISOString());

    setAlumni(prev => prev.map(a =>
      a.id === id
        ? { ...a, status_pelacakan: status, hasil: hasil || a.hasil, last_tracked_date: trackedDate }
        : a
    ));
    addLog(`Status profil ${alumni.find(a => a.id === id)?.nama_lengkap} diperbarui menjadi ${status}`, 'success');

    supabase
      .from(DETAIL_ALUMNI_TABLE)
      .update({
        status_pelacakan: status,
        hasil: hasil ?? undefined,
        last_tracked_date: trackedDate,
      })
      .eq('id', String(id))
      .then(({ error }) => {
        if (error) {
          addLog(error.message || 'Gagal sinkronisasi status alumni ke Supabase.', 'error');
        }
      });
  };

  const addAlumni = async (newAlumni) => {
    const payload = buildAlumniPayload({
      ...newAlumni,
      status_pelacakan: newAlumni.status_pelacakan || 'Belum Dilacak',
      ppdikti_verified: Boolean(newAlumni.ppdikti_verified),
      ppdikti_checked_at: newAlumni.ppdikti_checked_at || null,
      ppdikti_detail: newAlumni.ppdikti_detail || null,
    });

    const { data, error } = await supabase
      .from(DETAIL_ALUMNI_TABLE)
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Gagal menambah data alumni di Supabase.');
    }

    const normalized = normalizeAlumniRow(data);
    setAlumni(prev => [normalized, ...prev]);
    addLog(`Alumni baru ditambahkan: ${normalized.nama_lengkap}`, 'info');
    return normalized;
  };

  const updateAlumni = async (id, updatedData) => {
    const payload = buildAlumniPayload(updatedData);
    delete payload.id;

    const { data, error } = await supabase
      .from(DETAIL_ALUMNI_TABLE)
      .update(payload)
      .eq('id', String(id))
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Gagal memperbarui data alumni di Supabase.');
    }

    const normalized = normalizeAlumniRow(data);
    setAlumni(prev => prev.map(a => a.id === String(id) ? normalized : a));
    addLog(`Data alumni diperbarui: ${normalized.nama_lengkap || id}`, 'info');
    return normalized;
  };

  const deleteAlumni = async (id) => {
    const target = alumni.find(a => a.id === id);
    const { error } = await supabase
      .from(DETAIL_ALUMNI_TABLE)
      .delete()
      .eq('id', String(id));

    if (error) {
      throw new Error(error.message || 'Gagal menghapus data alumni di Supabase.');
    }

    setAlumni(prev => prev.filter(a => a.id !== id));
    if (target) {
      addLog(`Data alumni dihapus: ${target.nama_lengkap}`, 'warning');
    }
  };

  const verifyAlumniPpdikti = async (id, verified, detail = null) => {
    const checkedAt = new Date().toISOString();
    const payload = {
      ppdikti_verified: Boolean(verified),
      ppdikti_checked_at: checkedAt,
      ppdikti_detail: detail ?? null,
    };

    const { data, error } = await supabase
      .from(DETAIL_ALUMNI_TABLE)
      .update(payload)
      .eq('id', String(id))
      .select('*');

    if (error) {
      throw new Error(error.message || 'Gagal menyimpan verifikasi PPDIKTI di Supabase.');
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data alumni tidak ditemukan di tabel detail-alumni. Pilih alumni dari antrian PPDIKTI terlebih dahulu.');
    }

    if (data.length > 1) {
      throw new Error('Ditemukan lebih dari satu baris untuk ID alumni yang sama. Pastikan kolom id unik.');
    }

    const normalized = normalizeAlumniRow(data[0]);
    setAlumni(prev => prev.map(a => a.id === String(id) ? normalized : a));
    addLog(
      `Verifikasi PPDIKTI untuk ${normalized.nama_lengkap}: ${verified ? 'Terverifikasi' : 'Belum Terverifikasi'}`,
      verified ? 'success' : 'warning'
    );

    return normalized;
  };

  const selectAlumniForPpdikti = (payload) => {
    setSelectedPpdiktiAlumni(normalizePpdiktiSelection(payload));
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message || 'Autentikasi gagal.');
    }

    const user = data.user;
    const normalizedUser = {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email,
      createdAt: user.created_at,
      lastLoginAt: user.last_sign_in_at,
    };

    setAuthUser(normalizedUser);
    return normalizedUser;
  };

  const signUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Registrasi gagal.');
    }

    const user = data.user;
    const normalizedUser = user ? {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || name || 'User',
      email: user.email,
      createdAt: user.created_at,
      lastLoginAt: user.last_sign_in_at,
    } : null;

    if (normalizedUser) {
      setAuthUser(normalizedUser);
    }

    return normalizedUser;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message || 'Gagal logout.');
    }

    setAuthUser(null);
  };

  const value = {
    authUser,
    authReady,
    signIn,
    signUp,
    logout,
    alumni, setAlumni,
    verifiedAlumni,
    publicVerifiedAlumni,
    verifiedShowcaseLoading,
    sources, setSources,
    reviews, setReviews,
    logs, setLogs,
    alumniLoading,
    loadAlumni,
    stats,
    addLog,
    updateAlumniStatus,
    addAlumni,
    updateAlumni,
    deleteAlumni,
    verifyAlumniPpdikti,
    selectedPpdiktiAlumni,
    selectAlumniForPpdikti
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
