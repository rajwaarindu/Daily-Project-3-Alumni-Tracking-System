import React from 'react';
import { useAppContext } from '../store/AppContext';
import { FileText, Clock, Terminal } from 'lucide-react';

export default function HistoryLog() {
  const { logs } = useAppContext();

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">Riwayat & Audit Log</h1>
        <p className="page-subtitle">Log aktivitas sistem dan jejak bukti pelacakan (Audit Trail)</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-accent-blue" />
            <h2 className="card-title">System Execution Logs</h2>
          </div>
          <div className="text-xs text-muted">Menampilkan {logs.length} log terakhir</div>
        </div>

        <div className="mt-4" style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '600px', overflowY: 'auto' }}>
          {logs.length > 0 ? (
            logs.map(log => (
              <div key={log.id} className="log-entry">
                <div className={`log-dot ${log.type}`}></div>
                <div className="log-content">
                  <div className="log-message">{log.message}</div>
                  <div className="flex items-center gap-1 log-time">
                    <Clock size={10} /> {log.time}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-8">Belum ada riwayat aktivitas</div>
          )}
        </div>
      </div>
    </div>
  );
}
