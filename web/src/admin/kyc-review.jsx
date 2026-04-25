import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, User,
  Phone, MapPin, Loader2, AlertCircle, RefreshCw,
  Flag, FlagOff, Search, Building2, Wallet,
  AlertTriangle, Users, Briefcase, Star, X, LogOut,
} from 'lucide-react';
import {
  getPendingKYC, approveKYC, rejectKYC,
  getAllAdminUsers, flagUser,
} from '../services/api';
import { useTranslation } from 'react-i18next';

// ── Initials Avatar ───────────────────────────────────────────────────────────
function Avatar({ name, size = 52 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-base text-slate-600 flex-shrink-0"
    >
      {initials}
    </div>
  );
}

// ── Role & KYC badge — monochrome only ────────────────────────────────────────
function Badge({ label, icon: Icon, variant = 'default' }) {
  const cls = {
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    strong:  'bg-black text-white border-black',
    outline: 'bg-white text-slate-700 border-slate-300',
    muted:   'bg-slate-50 text-slate-400 border-slate-100',
  }[variant] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${cls}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ── Flag Reason Modal ─────────────────────────────────────────────────────────
function FlagModal({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const isFlagging = !user.flagged;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            {isFlagging
              ? <Flag className="w-5 h-5 text-black" />
              : <FlagOff className="w-5 h-5 text-black" />
            }
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">
              {isFlagging ? 'Flag Account' : 'Unflag Account'}
            </h3>
            <p className="text-sm text-slate-400 font-medium">{user.name}</p>
          </div>
        </div>

        {isFlagging && (
          <div className="mb-5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Reason (optional)
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Suspicious activity, duplicate account..."
              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-black text-white hover:opacity-90 transition-all active:scale-95"
          >
            {isFlagging ? 'Flag User' : 'Unflag User'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── KYC Action Panel ──────────────────────────────────────────────────────────
function KYCPanel({ user, onApprove, onReject }) {
  const [rejectMode, setRejectMode] = useState(false);
  const [remark, setRemark]         = useState('');
  const [busy, setBusy]             = useState(false);
  const id = user._id || user.user_id;

  const handleApprove = async () => {
    setBusy(true);
    try { await approveKYC(id); onApprove(id); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const handleReject = async () => {
    setBusy(true);
    try { await rejectKYC(id, remark); onReject(id); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  if (rejectMode) return (
    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
      <input
        value={remark} onChange={e => setRemark(e.target.value)}
        placeholder="Rejection reason..."
        className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
      />
      <button onClick={handleReject} disabled={busy}
        className="px-4 py-2 bg-black text-white rounded-xl text-sm font-black hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-all active:scale-95">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
        Reject
      </button>
      <button onClick={() => setRejectMode(false)}
        className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
        Cancel
      </button>
    </div>
  );

  return (
    <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
      <button onClick={handleApprove} disabled={busy}
        className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Approve KYC
      </button>
      <button onClick={() => setRejectMode(true)} disabled={busy}
        className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-black hover:border-slate-400 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        <XCircle className="w-4 h-4" /> Reject
      </button>
    </div>
  );
}

// ── User Card ─────────────────────────────────────────────────────────────────
function UserCard({ user, onKYCApprove, onKYCReject, onFlagToggle }) {
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagging, setFlagging]           = useState(false);

  const ROLE_LABELS = { worker: 'Worker', hirer: 'Hirer', lender: 'Lender' };
  const KYC_LABELS  = { approved: 'KYC Approved', pending: 'KYC Pending', rejected: 'KYC Rejected', new: 'Unverified', 'n/a': 'N/A' };

  const handleFlagConfirm = async (reason) => {
    setShowFlagModal(false);
    setFlagging(true);
    try {
      await flagUser({ user_id: user._id || user.user_id, role: user.role, flagged: !user.flagged, reason });
      onFlagToggle(user._id || user.user_id, !user.flagged, reason);
    } catch (e) { alert(e.message); }
    finally { setFlagging(false); }
  };

  return (
    <>
      <AnimatePresence>
        {showFlagModal && (
          <FlagModal user={user} onConfirm={handleFlagConfirm} onClose={() => setShowFlagModal(false)} />
        )}
      </AnimatePresence>

      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={`bg-white rounded-2xl border overflow-hidden transition-all ${
          user.flagged
            ? 'border-black shadow-sm'
            : 'border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px'
        }`}
      >
        {/* Flagged banner */}
        {user.flagged && (
          <div className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 flex items-center gap-2">
            <Flag className="w-3 h-3" /> Flagged
            {user.flag_reason && (
              <span className="opacity-60 normal-case tracking-normal font-medium text-[11px]">
                · {user.flag_reason}
              </span>
            )}
          </div>
        )}

        <div className="p-5">
          {/* Row 1: Avatar + Name + Flag button */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar name={user.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-black tracking-tight leading-tight truncate">
                    {user.name || '—'}
                  </h3>
                  <p className="text-sm text-slate-400 font-mono truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={() => setShowFlagModal(true)}
                  disabled={flagging}
                  title={user.flagged ? 'Unflag user' : 'Flag user'}
                  className="flex-shrink-0 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-slate-400 hover:text-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {flagging
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : user.flagged
                    ? <FlagOff className="w-4 h-4" />
                    : <Flag className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Role + KYC + Trust Score badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge label={ROLE_LABELS[user.role] || user.role} icon={
              user.role === 'hirer' ? Building2 : user.role === 'lender' ? Wallet : User
            } variant="strong" />

            {user.kyc_status !== 'n/a' && (
              <Badge
                label={KYC_LABELS[user.kyc_status] || user.kyc_status}
                icon={
                  user.kyc_status === 'approved' ? CheckCircle2 :
                  user.kyc_status === 'pending'  ? Clock :
                  user.kyc_status === 'rejected' ? XCircle : AlertTriangle
                }
                variant={user.kyc_status === 'approved' ? 'outline' : user.kyc_status === 'pending' ? 'default' : 'muted'}
              />
            )}

            {user.trust_score != null && (
              <Badge label={`Score ${user.trust_score}`} icon={Star} variant="muted" />
            )}
          </div>

          {/* Row 3: Contact + meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500 font-medium mb-3">
            {user.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-300" />{user.phone}
              </span>
            )}
            {user.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-300" />{user.location}
              </span>
            )}
            {user.jobs_completed > 0 && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-300" />{user.jobs_completed} jobs
              </span>
            )}
          </div>

          {/* Row 4: Skills */}
          {user.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {user.skills.slice(0, 5).map(s => (
                <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full">
                  {s}
                </span>
              ))}
              {user.skills.length > 5 && (
                <span className="text-[11px] text-slate-400 font-bold self-center">
                  +{user.skills.length - 5}
                </span>
              )}
            </div>
          )}

          {/* KYC Actions (pending workers only) */}
          {user.role === 'worker' && user.kyc_status === 'pending' && (
            <KYCPanel user={user} onApprove={onKYCApprove} onReject={onKYCReject} />
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Stat Widget ───────────────────────────────────────────────────────────────
function StatWidget({ label, value, icon: Icon, dark = false }) {
  return (
    <div className={`rounded-2xl p-5 border flex items-center gap-4 ${
      dark ? 'bg-black text-white border-black' : 'bg-white text-black border-slate-100 shadow-sm'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        dark ? 'bg-white/10' : 'bg-slate-100'
      }`}>
        <Icon className={`w-5 h-5 ${dark ? 'text-white' : 'text-slate-500'}`} />
      </div>
      <div>
        <p className={`text-3xl font-black tracking-tight leading-none ${dark ? 'text-white' : 'text-black'}`}>
          {value}
        </p>
        <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${dark ? 'text-white/50' : 'text-slate-400'}`}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Filter Pill ───────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
        active
          ? 'bg-black text-white shadow-sm'
          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminKYCReview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allUsers, setAllUsers]     = useState([]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [kycFilter, setKycFilter]   = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');
  const [activeTab, setActiveTab]   = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getAllAdminUsers();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch {
      try {
        const data = await getPendingKYC();
        setAllUsers(Array.isArray(data) ? data.map(w => ({ ...w, role: 'worker' })) : []);
      } catch (e2) {
        setError(e2.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onKYCApprove = (id) =>
    setAllUsers(prev => prev.map(u =>
      (u._id === id || u.user_id === id) ? { ...u, kyc_status: 'approved' } : u
    ));

  const onKYCReject = (id) =>
    setAllUsers(prev => prev.map(u =>
      (u._id === id || u.user_id === id) ? { ...u, kyc_status: 'rejected' } : u
    ));

  const onFlagToggle = (id, newFlagged, reason) =>
    setAllUsers(prev => prev.map(u =>
      (u._id === id || u.user_id === id)
        ? { ...u, flagged: newFlagged, flag_reason: newFlagged ? reason : '' }
        : u
    ));

  // Derived
  const pending = allUsers.filter(u => u.kyc_status === 'pending');
  const flagged = allUsers.filter(u => u.flagged);

  let filtered = activeTab === 'pending_kyc' ? pending : allUsers;
  if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
  if (kycFilter  !== 'all') filtered = filtered.filter(u => u.kyc_status === kycFilter);
  if (flagFilter === 'flagged') filtered = filtered.filter(u => u.flagged);
  if (flagFilter === 'clean')   filtered = filtered.filter(u => !u.flagged);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  }

  const counts = {
    all:    allUsers.length,
    worker: allUsers.filter(u => u.role === 'worker').length,
    hirer:  allUsers.filter(u => u.role === 'hirer').length,
    lender: allUsers.filter(u => u.role === 'lender').length,
  };

  return (
    <div className="min-h-screen bg-[#f9f9fa] font-sans">

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Admin · User Management</h1>
            <p className="text-sm text-slate-400 font-medium">
              {allUsers.length} users · {pending.length} KYC pending · {flagged.length} flagged
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-xl text-sm font-bold hover:bg-slate-200 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-5 bg-slate-100 border border-slate-200 rounded-2xl text-black text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatWidget label="Total Users"  value={counts.all}    icon={Users}     dark />
          <StatWidget label="Workers"      value={counts.worker} icon={User}      />
          <StatWidget label="Hirers"       value={counts.hirer}  icon={Building2} />
          <StatWidget label="Lenders"      value={counts.lender} icon={Wallet}    />
          <StatWidget label="KYC Pending"  value={pending.length} icon={Clock}    />
        </div>

        {/* ── Flagged Alert ── */}
        {flagged.length > 0 && (
          <div className="flex items-center gap-4 p-5 bg-black text-white rounded-2xl">
            <Flag className="w-5 h-5 flex-shrink-0 opacity-70" />
            <div className="flex-1">
              <p className="text-base font-black">
                {flagged.length} account{flagged.length !== 1 ? 's' : ''} flagged
              </p>
              <p className="text-sm text-white/50 font-medium mt-0.5 truncate">
                {flagged.map(u => u.name).join(', ')}
              </p>
            </div>
            <button
              onClick={() => setFlagFilter(f => f === 'flagged' ? 'all' : 'flagged')}
              className="flex-shrink-0 px-4 py-2 bg-white text-black text-xs font-black rounded-xl hover:bg-slate-100 transition-all"
            >
              {flagFilter === 'flagged' ? 'Show All' : 'View Flagged'}
            </button>
          </div>
        )}

        {/* ── Controls ── */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <FilterPill
              label={`All Users (${counts.all})`}
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            />
            <FilterPill
              label={`KYC Pending${pending.length > 0 ? ` (${pending.length})` : ''}`}
              active={activeTab === 'pending_kyc'}
              onClick={() => setActiveTab('pending_kyc')}
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-white border border-slate-200 text-base font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Role */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5">
              {['all', 'worker', 'hirer', 'lender'].map(r => (
                <button key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    roleFilter === r ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : r}
                </button>
              ))}
            </div>

            {/* KYC */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5">
              {['all', 'pending', 'approved', 'rejected'].map(k => (
                <button key={k}
                  onClick={() => setKycFilter(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    kycFilter === k ? 'bg-black text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {k === 'all' ? 'All KYC' : k}
                </button>
              ))}
            </div>

            {/* Flag filter */}
            <button
              onClick={() => setFlagFilter(f =>
                f === 'all' ? 'flagged' : f === 'flagged' ? 'clean' : 'all'
              )}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                flagFilter !== 'all'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              {flagFilter === 'flagged' ? 'Flagged Only' : flagFilter === 'clean' ? 'Clean Only' : 'All Flags'}
            </button>

            <p className="text-sm text-slate-400 font-medium ml-auto">
              <span className="font-black text-black">{filtered.length}</span> / {allUsers.length} shown
            </p>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <CheckCircle2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-xl font-black text-slate-400">
              {allUsers.length === 0 ? 'No users registered yet.' : 'No users match your filters.'}
            </p>
          </div>
        )}

        {/* ── User Grid ── */}
        {!loading && filtered.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(u => (
                <UserCard
                  key={u._id || u.user_id}
                  user={u}
                  onKYCApprove={onKYCApprove}
                  onKYCReject={onKYCReject}
                  onFlagToggle={onFlagToggle}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
