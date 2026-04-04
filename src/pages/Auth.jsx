import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Database, Lock, Mail, Sparkles, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

export default function Auth() {
  const navigate = useNavigate();
  const { authUser, signIn, signUp } = useAppContext();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authUser) {
      navigate('/', { replace: true });
    }
  }, [authUser, navigate]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password harus sama.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === 'signin') {
        await signIn({ email: form.email, password: form.password });
      } else {
        await signUp({ name: form.name, email: form.email, password: form.password });
      }

      navigate('/', { replace: true });
    } catch (authError) {
      setError(authError.message || 'Autentikasi gagal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page animate-fade">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-brand">
            <div className="auth-mark">
              <Users size={22} color="white" />
            </div>
            <div>
              <div className="auth-brand-name">AlumTrack AI</div>
              <div className="auth-brand-subtitle">Smart Alumni Tracer</div>
            </div>
          </div>

          <div className="auth-kicker">
            <Sparkles size={13} />
            Halaman autentikasi
          </div>

          <h1 className="auth-title">Masuk untuk mengelola pelacakan alumni secara aman.</h1>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <Database size={16} />
              <span>Data akun tersimpan ke <strong>Database dengan keamanan tinggi</strong></span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => handleModeChange('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => handleModeChange('signup')}
            >
              Sign Up
            </button>
          </div>

          <div className="auth-card-title">{mode === 'signin' ? 'Masuk ke dashboard' : 'Buat akun baru'}</div>
          <div className="auth-card-subtitle">
            {mode === 'signin'
              ? 'Gunakan akun yang sudah terdaftar untuk masuk ke sistem.'
              : 'Daftarkan akun baru agar data login tersimpan ke database SQLite lokal.'}
          </div>

          {error && <div className="auth-alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <div className="search-box">
                  <UserPlus size={16} className="text-muted" />
                  <input
                    type="text"
                    placeholder="Contoh: Andi Pratama"
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="search-box">
                <Mail size={16} className="text-muted" />
                <input
                  type="email"
                  placeholder="nama@kampus.ac.id"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="search-box">
                <Lock size={16} className="text-muted" />
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  required
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Konfirmasi Password</label>
                <div className="search-box">
                  <Lock size={16} className="text-muted" />
                  <input
                    type="password"
                    placeholder="Ulangi password"
                    value={form.confirmPassword}
                    onChange={(event) => handleChange('confirmPassword', event.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-actions">
              <div className="auth-note">
                {mode === 'signin'
                  ? 'Belum punya akun? Pindah ke Sign Up untuk membuat akun baru.'
                  : 'Sudah punya akun? Pindah ke Sign In untuk masuk.'}
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Daftar'}
                {!isSubmitting && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}