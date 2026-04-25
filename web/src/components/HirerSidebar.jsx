import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, Search, Receipt } from 'lucide-react';
import { logout, getStoredUser } from '../services/api';
import { useTranslation } from 'react-i18next';

const SideNavItem = ({ to, icon: Icon, children, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group
      ${isActive
        ? 'bg-[#f5f5f7] text-black shadow-sm font-bold ring-1 ring-black/5'
        : 'text-slate-500 hover:bg-slate-50 hover:text-black font-medium'}
    `}
  >
    <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
    <span className="tracking-tight">{children}</span>
  </NavLink>
);

function InitialsAvatar({ name, size = 36 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : 'H';
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-black flex items-center justify-center flex-shrink-0"
    >
      <span style={{ fontSize: size * 0.38 }} className="font-black text-white tracking-tight">
        {initials}
      </span>
    </div>
  );
}

export default function HirerSidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { i18n } = useTranslation();
  const name = user?.name || 'Hirer';
  const email = user?.email || '';

  const handleLangChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-40 shadow-[1px_0_0_0_#e5e7eb]">

      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="VAULT logo" className="h-8 w-auto flex-shrink-0" />
          <div>
            <h2 className="text-base font-black tracking-tighter leading-none">VAULT</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Hirer Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] px-4 pt-1 pb-3">Main</p>
        <SideNavItem to="/hirer/discovery" icon={Search} end>Find Workers</SideNavItem>
        <SideNavItem to="/hirer/history" icon={Receipt}>Payment History</SideNavItem>
      </nav>

      {/* User Profile + Sign Out */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-4 space-y-1">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <InitialsAvatar name={name} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black truncate">{name}</p>
            <p className="text-[10px] text-slate-400 truncate">{email || 'VAULT Hirer'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
        {/* Language Switcher */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <select 
            value={i18n.language?.split('-')[0] || 'en'} 
            onChange={handleLangChange}
            className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer"
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
