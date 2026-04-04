import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { useAppContext } from './store/AppContext';
import Sidebar from './components/Sidebar';
import Auth from './pages/Auth';

// Lazy load pages for now, or import them directly after creating them
import Dashboard from './pages/Dashboard';
import AlumniList from './pages/AlumniList';
import TrackingSim from './pages/TrackingSim';
import ReviewQueue from './pages/ReviewQueue';
import HistoryLog from './pages/HistoryLog';
import Settings from './pages/Settings';
import PPDIKTI from './pages/Ppdikti';

function LoadingScreen() {
  return (
    <div className="auth-loading">
      <div className="auth-loading-card">
        <div className="auth-loading-spinner"></div>
        <div>
          <div className="auth-loading-title">Memuat sesi...</div>
          <div className="auth-loading-subtitle">Menyiapkan autentikasi dan data aplikasi.</div>
        </div>
      </div>
    </div>
  );
}

function PrivateRoutes() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alumni" element={<AlumniList />} />
          <Route path="/tracking" element={<TrackingSim />} />
          <Route path="/reviews" element={<ReviewQueue />} />
          <Route path="/ppdikti" element={<PPDIKTI />} />
          <Route path="/history" element={<HistoryLog />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

function AppRouter() {
  const { authReady, authUser } = useAppContext();

  if (!authReady) {
    return <LoadingScreen />;
  }

  return authUser ? <PrivateRoutes /> : <PublicRoutes />;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppRouter />
      </Router>
    </AppProvider>
  );
}
