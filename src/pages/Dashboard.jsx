import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useAppContext } from '../store/AppContext';
import { Users, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export default function Dashboard() {
  const { stats, alumni } = useAppContext();

  const data = [
    { name: 'Teridentifikasi', value: stats.identified, color: '#68d391' },
    { name: 'Perlu Verifikasi', value: stats.needReview, color: '#f6ad55' },
    { name: 'Belum Dilacak', value: stats.untracked, color: '#63b3ed' },
    { name: 'Tidak Ditemukan', value: stats.total - (stats.identified + stats.needReview + stats.untracked), color: '#fc8181' },
  ].filter(d => d.value > 0);

  const recentIdentified = alumni.filter(a => a.status_pelacakan === 'Teridentifikasi dari sumber publik').slice(0, 5);

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
            <h2 className="card-title">Terbaru Teridentifikasi</h2>
          </div>
          {recentIdentified.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nama Alumni</th>
                    <th>Instansi / Jabatan</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIdentified.map(a => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.nama_lengkap}</strong>
                        <div className="text-xs text-muted mt-1">{a.id}</div>
                      </td>
                      <td>
                        <div className="text-sm">{a.hasil?.jabatan || '-'}</div>
                        <div className="text-xs text-muted">{a.hasil?.instansi || '-'}</div>
                      </td>
                      <td>{a.last_tracked_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle className="empty-icon" />
              <div className="empty-title">Belum Ada Tembuan</div>
              <div className="empty-desc">Jalankan job pelacakan untuk mulai menemukan profil alumni.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
