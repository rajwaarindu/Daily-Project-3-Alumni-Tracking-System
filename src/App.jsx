import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import Sidebar from './components/Sidebar';

// Lazy load pages for now, or import them directly after creating them
import Dashboard from './pages/Dashboard';
import AlumniList from './pages/AlumniList';
import TrackingSim from './pages/TrackingSim';
import ReviewQueue from './pages/ReviewQueue';
import HistoryLog from './pages/HistoryLog';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alumni" element={<AlumniList />} />
              <Route path="/tracking" element={<TrackingSim />} />
              <Route path="/reviews" element={<ReviewQueue />} />
              <Route path="/history" element={<HistoryLog />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}
