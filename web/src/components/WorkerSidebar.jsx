import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  ArrowLeftRight,
  Briefcase,
  Verified,
  BarChart3,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { getStoredUser, logout } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SideNavItem = ({ to, icon: Icon, children, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
      ${isActive
        ? 'bg-surface-container text-primary font-bold shadow-sm'
        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}
    `}
  >
    <Icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
    <span className="text-sm font-medium tracking-wide">{children}</span>
  </NavLink>
);

// Initials avatar — no external image, no AI-generated content
function InitialsAvatar({ name, size = 48 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : '?';
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-black flex items-center justify-center flex-shrink-0 border-2 border-outline/10"
    >
      <span style={{ fontSize: size * 0.35 }} className="font-black text-white tracking-tight">
        {initials}
      </span>
    </div>
  );
}

export default function WorkerSidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { t, i18n } = useTranslation();
  const name = user?.name || 'Worker';
  const role = user?.role || 'worker';

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleLangChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-gray-100 border-r border-outline/5 flex flex-col p-8 z-50">
      {/* Brand */}
      <div className="text-2xl font-black tracking-tighter mb-12 flex items-center gap-2">
        <img src="/logo.svg" alt="VAULT logo" className="h-8 w-auto flex-shrink-0" />
        VAULT
      </div>

      {/* User profile — initials only, no external image */}
      <div className="flex items-center gap-4 mb-10 px-2">
        <InitialsAvatar name={name} size={48} />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate max-w-[140px]">{name}</p>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold capitalize">{role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <SideNavItem to="/worker" icon={LayoutGrid} end>{t('sidebar.dashboard')}</SideNavItem>
        <SideNavItem to="/worker/transactions" icon={ArrowLeftRight}>{t('sidebar.transactions')}</SideNavItem>
        <SideNavItem to="/worker/certificates" icon={Verified}>{t('sidebar.certificates')}</SideNavItem>
        <SideNavItem to="/worker/jobrequest" icon={Briefcase}>{t('sidebar.jobRequests')}</SideNavItem>
        <SideNavItem to="/worker/analytics" icon={BarChart3}>{t('sidebar.analytics')}</SideNavItem>
      </nav>

      {/* Bottom actions */}
      <div className="pt-6 border-t border-outline/10 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-all w-full text-left"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">{t('sidebar.signOut')}</span>
        </button>
        
        {/* Language Switcher */}
        <div className="mt-4 px-4 pt-4 border-t border-outline/5">
          <select 
            value={i18n.language?.split('-')[0] || 'en'} 
            onChange={handleLangChange}
            className="w-full bg-white text-xs border border-outline/20 rounded-lg p-2 font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
