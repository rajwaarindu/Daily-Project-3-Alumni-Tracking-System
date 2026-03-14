import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  CheckSquare, 
  FileText, 
  Settings,
  Radar
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';

export default function Sidebar() {
  const { stats } = useAppContext();
  const location = useLocation();

  const navItems = [
    { section: 'Main Menu' },
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/alumni', label: 'Data Alumni', icon: Users },
    { path: '/tracking', label: 'Pelacakan (Job)', icon: Search },
    { path: '/reviews', label: 'Verifikasi Manual', icon: CheckSquare, badge: stats.needReview },
    
    { section: 'Laporan & Setting' },
    { path: '/history', label: 'Laporan & Riwayat', icon: FileText },
    { path: '/settings', label: 'Sumber & Aturan', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-icon">
            <Radar size={22} color="white" />
          </div>
          <div className="brand-name">AlumTrack AI</div>
        </div>
        <div className="brand-subtitle">Smart Alumni Tracer</div>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item, index) => {
          if (item.section) {
            return (
              <div key={`sec-${index}`} className="nav-section-label mt-4">
                {item.section}
              </div>
            );
          }
          
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink 
              to={item.path} 
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="role-badge">
          <div className="role-avatar">AD</div>
          <div className="role-info">
            <div className="role-name">System Admin</div>
            <div className="role-label">Operator / Reviewer</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
