import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useAppContext } from '../store/AppContext';
import { Users, CheckCircle, AlertTriangle, HelpCircle, BadgeCheck } from 'lucide-react';
import { getPpdiktiSummary, pickRandomItems } from '../lib/verifiedAlumni';

export default function Dashboard() {
  const { stats, verifiedAlumni } = useAppContext();

  const data = [
    { name: 'Teridentifikasi', value: stats.identified, color: '#68d391' },
    { name: 'Perlu Verifikasi', value: stats.needReview, color: '#f6ad55' },
    { name: 'Belum Dilacak', value: stats.untracked, color: '#63b3ed' },
    { name: 'Tidak Ditemukan', value: stats.total - (stats.identified + stats.needReview + stats.untracked), color: '#fc8181' },
  ].filter(d => d.value > 0);

  const recentVerified = useMemo(() => pickRandomItems(verifiedAlumni, 3), [verifiedAlumni]);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">Dashboard Pelacakan</h1>
        <p className="page-subtitle">Ringkasan status pelacakan alumni secara keseluruhan</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue"><Users size={20} /></div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Alumni Terdaftar</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle size={20} /></div>
          <div className="stat-value">{stats.identified}</div>
          <div className="stat-label">Teridentifikasi Publik</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><AlertTriangle size={20} /></div>
          <div className="stat-value">{stats.needReview}</div>
          <div className="stat-label">Perlu Verifikasi Manual</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><HelpCircle size={20} /></div>
          <div className="stat-value">{stats.untracked}</div>
          <div className="stat-label">Belum Dilacak</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><BadgeCheck size={20} /></div>
          <div className="stat-value">{verifiedAlumni.length}</div>
          <div className="stat-label">Terverifikasi PPDIKTI</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Distribusi Status</h2>
          </div>
          <div style={{ height: 300 }}>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ background: 'rgba(15,22,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Belum ada data pelacakan</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Alumni Terverifikasi PPDIKTI</h2>
            <span className="badge badge-success">Source of truth: PPDIKTI</span>
          </div>
          {recentVerified.length > 0 ? (
            <div className="table-wrapper">
              <table className="verified-table">
                <thead>
                  <tr>
                    <th>Nama Alumni</th>
                    <th>Data Akademik</th>
                    <th>Status PPDIKTI</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVerified.map((a) => {
                    const summary = getPpdiktiSummary(a);
                    return (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.nama_lengkap}</strong>
                        <div className="text-xs text-muted mt-1">{a.id}</div>
                      </td>
                      <td>
                        <div className="text-sm">{summary.prodi}</div>
                        <div className="text-xs text-muted">{summary.perguruanTinggi}</div>
                        <div className="text-xs text-muted">NIM: {summary.nim}</div>
                      </td>
                      <td>
                        <span className="badge badge-success">Terverifikasi</span>
                        <div className="text-xs text-muted mt-1">{summary.status}</div>
                        <div className="text-xs text-muted">
                          Dicek: {a.ppdikti_checked_at ? new Date(a.ppdikti_checked_at).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <BadgeCheck className="empty-icon" />
              <div className="empty-title">Belum Ada Alumni Terverifikasi</div>
              <div className="empty-desc">Lakukan verifikasi di menu PPDIKTI untuk menampilkan data terverifikasi di dashboard.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
