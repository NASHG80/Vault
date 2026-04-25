/**
 * ZkTlsImport.jsx
 * Simulated "Reclaim Protocol" zkTLS import flow.
 *
 * Flow (all inside a single browser shell):
 *   1)  Browser opens → Reclaim verification page (platform picker)
 *   2)  Pick Uber / Zomato  → navigates to fake login
 *   3)  Login               → navigates to fake dashboard
 *   4)  Extraction overlay  → scanning + ZK proof
 *   5)  Completion          → batch returned to parent
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Lock, ShieldCheck, ChevronRight, Loader2,
  Globe, ArrowLeft, RotateCw, CheckCircle2, Zap,
  Car, Utensils, Package, MapPin, Star, Clock,
  Fingerprint, ScanLine, FileCheck, ExternalLink,
  Search, Truck, CreditCard, ArrowRight,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// HARDCODED TRANSACTION DATA  (the "extracted" results)
// ════════════════════════════════════════════════════════════════

const UBER_TRANSACTIONS = [
  { title: 'UberX Trip — Andheri to BKC',        platform: 'Uber', amount: '385.50',  category: 'rideshare', date: '2024-03-18', isZk: true, tx_type: 'external' },
  { title: 'UberGo Trip — Airport Pickup',        platform: 'Uber', amount: '720.00',  category: 'rideshare', date: '2024-03-17', isZk: true, tx_type: 'external' },
  { title: 'UberX Trip — Dadar to Worli',         platform: 'Uber', amount: '195.00',  category: 'rideshare', date: '2024-03-16', isZk: true, tx_type: 'external' },
  { title: 'Weekly Quest Bonus',                   platform: 'Uber', amount: '1500.00', category: 'rideshare', date: '2024-03-15', isZk: true, tx_type: 'external' },
  { title: 'UberGo Trip — Powai to Thane',        platform: 'Uber', amount: '440.00',  category: 'rideshare', date: '2024-03-14', isZk: true, tx_type: 'external' },
  { title: 'UberXL Trip — South Mumbai',          platform: 'Uber', amount: '610.00',  category: 'rideshare', date: '2024-03-13', isZk: true, tx_type: 'external' },
  { title: 'Surge Bonus — Peak Hours',            platform: 'Uber', amount: '350.00',  category: 'rideshare', date: '2024-03-12', isZk: true, tx_type: 'external' },
];

const ZOMATO_TRANSACTIONS = [
  { title: 'Delivery — Biryani House to Malad',   platform: 'Zomato', amount: '85.00',   category: 'food', date: '2024-03-18', isZk: true, tx_type: 'external' },
  { title: 'Delivery — Pizza Express to Juhu',    platform: 'Zomato', amount: '65.00',   category: 'food', date: '2024-03-17', isZk: true, tx_type: 'external' },
  { title: 'Delivery — Café Mocha to Bandra',     platform: 'Zomato', amount: '55.00',   category: 'food', date: '2024-03-17', isZk: true, tx_type: 'external' },
  { title: 'Incentive — 20 Deliveries Bonus',     platform: 'Zomato', amount: '500.00',  category: 'food', date: '2024-03-16', isZk: true, tx_type: 'external' },
  { title: 'Delivery — Sushi Bar to Powai',       platform: 'Zomato', amount: '95.00',   category: 'food', date: '2024-03-15', isZk: true, tx_type: 'external' },
  { title: 'Delivery — South Indian Hub',         platform: 'Zomato', amount: '72.00',   category: 'food', date: '2024-03-14', isZk: true, tx_type: 'external' },
  { title: 'Rain Surge Bonus',                     platform: 'Zomato', amount: '250.00',  category: 'food', date: '2024-03-13', isZk: true, tx_type: 'external' },
];

const PLATFORM_CONFIG = {
  uber: {
    loginUrl: 'https://auth.uber.com/v2/login',
    dashUrl:  'https://drivers.uber.com/p3/earnings',
    name:     'Uber',
    transactions: UBER_TRANSACTIONS,
  },
  zomato: {
    loginUrl: 'https://www.zomato.com/partner/login',
    dashUrl:  'https://www.zomato.com/partner/earnings',
    name:     'Zomato',
    transactions: ZOMATO_TRANSACTIONS,
  },
};


// ════════════════════════════════════════════════════════════════
// MAIN — EVERYTHING LIVES INSIDE ONE BROWSER SHELL
// ════════════════════════════════════════════════════════════════

export default function ZkTlsImport({ open, onClose, onTransactionsExtracted }) {
  // phase: reclaim | login | dashboard | extracting | done
  const [phase, setPhase] = useState('reclaim');
  const [platform, setPlatform] = useState(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [history, setHistory] = useState([]);

  const reset = () => {
    setPhase('reclaim');
    setPlatform(null);
    setExtractionProgress(0);
    setHistory([]);
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handlePlatformSelect = (p) => {
    setPlatform(p);
    setHistory((h) => [...h, 'reclaim']);
    setPhase('login');
  };

  const handleLogin = () => {
    setHistory((h) => [...h, 'login']);
    setPhase('dashboard');
    // Auto-trigger extraction after showing dashboard briefly
    setTimeout(() => {
      setPhase('extracting');
    }, 2500);
  };

  const handleBack = () => {
    const prev = [...history];
    const last = prev.pop();
    setHistory(prev);
    if (last) {
      setPhase(last);
      if (last === 'reclaim') setPlatform(null);
    }
  };

  // Extraction progress
  useEffect(() => {
    if (phase !== 'extracting') return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setPhase('done'), 600);
      }
      setExtractionProgress(Math.min(progress, 100));
    }, 200);
    return () => clearInterval(interval);
  }, [phase]);

  // Completion → hand off to parent
  useEffect(() => {
    if (phase !== 'done' || !platform) return;
    const cfg = PLATFORM_CONFIG[platform];
    const timer = setTimeout(() => {
      onTransactionsExtracted(cfg.transactions);
      onClose();
      reset();
    }, 2200);
    return () => clearTimeout(timer);
  }, [phase, platform, onTransactionsExtracted, onClose]);

  if (!open) return null;

  // URL bar text
  const getUrl = () => {
    if (phase === 'reclaim') return 'https://verify.reclaimprotocol.org/session/gig-earnings';
    if (!platform) return '';
    const cfg = PLATFORM_CONFIG[platform];
    if (phase === 'login') return cfg.loginUrl;
    return cfg.dashUrl;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      >
        {/* ── The Browser Shell ── */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-[960px] h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col"
        >
          {/* ── Chrome-style browser chrome ── */}
          {/* Tab bar row */}
          <div className="bg-[#dee1e6] flex items-end pt-1.5 px-2 flex-shrink-0 relative">
            {/* Active tab */}
            <div className="flex items-center gap-2 bg-white rounded-t-lg px-4 py-2 min-w-[180px] max-w-[240px] relative z-10 border-t border-x border-gray-200">
              {/* Favicon */}
              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0">
                {phase === 'reclaim' ? (
                  <Fingerprint size={12} className="text-gray-600" />
                ) : platform === 'uber' ? (
                  <span className="text-[10px]">🚗</span>
                ) : platform === 'zomato' ? (
                  <span className="text-[10px]">🍕</span>
                ) : (
                  <Globe size={12} className="text-gray-400" />
                )}
              </div>
              {/* Tab title */}
              <span className="text-[11px] text-gray-700 font-medium truncate flex-1">
                {phase === 'reclaim' ? 'Reclaim Protocol' : platform === 'uber' ? 'Uber - Driver' : 'Zomato - Partner'}
              </span>
              {/* Tab close */}
              <button className="w-4 h-4 rounded-sm hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <X size={10} className="text-gray-400" />
              </button>
            </div>

            {/* New tab button */}
            <button className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-gray-400 ml-1 mb-0.5 transition-colors">
              <span className="text-lg leading-none font-light">+</span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Window controls (Windows-style: right side) */}
            <div className="flex items-center self-stretch -mr-2 mb-0.5">
              <button className="h-full px-3.5 hover:bg-black/5 flex items-center justify-center text-gray-500 transition-colors">
                <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
              </button>
              <button className="h-full px-3.5 hover:bg-black/5 flex items-center justify-center text-gray-500 transition-colors">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><rect x="0.5" y="0.5" width="8" height="8" stroke="currentColor" strokeWidth="1"/></svg>
              </button>
              <button onClick={handleClose} className="h-full px-3.5 hover:bg-[#e81123] hover:text-white flex items-center justify-center text-gray-500 transition-colors rounded-tr-lg">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Toolbar row (omnibox) */}
          <div className="bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
            {/* Nav buttons */}
            <button
              onClick={handleBack}
              disabled={history.length === 0}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:text-gray-300 disabled:cursor-default transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
              <ChevronRight size={16} />
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
              <RotateCw size={14} />
            </button>

            {/* Omnibox */}
            <div className="flex-1 mx-1 bg-[#f1f3f4] rounded-full px-4 py-[7px] flex items-center gap-2.5 hover:bg-[#e8eaed] transition-colors cursor-text group">
              <Lock size={12} className="text-gray-500 flex-shrink-0" />
              <span className="text-[13px] text-gray-700 truncate flex-1 select-all">{getUrl()}</span>
              <Star size={14} className="text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Extensions area */}
            <div className="flex items-center gap-1 ml-1">
              {/* Reclaim extension badge */}
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-full px-2.5 py-1.5 flex-shrink-0">
                <ShieldCheck size={11} className="text-green-400" />
                <span className="text-[10px] text-white font-bold tracking-wide">Reclaim</span>
              </div>
              {/* Profile icon */}
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center ml-1 flex-shrink-0">
                <span className="text-white text-[10px] font-bold">W</span>
              </div>
            </div>
          </div>

          {/* ── Page Content ── */}
          <div className="flex-1 overflow-hidden relative bg-gray-50">
            <AnimatePresence mode="wait">
              {phase === 'reclaim' && (
                <motion.div key="reclaim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <ReclaimLandingPage onSelectPlatform={handlePlatformSelect} />
                </motion.div>
              )}

              {phase === 'login' && platform === 'uber' && (
                <motion.div key="uber-login" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="h-full">
                  <UberLogin onLogin={handleLogin} />
                </motion.div>
              )}
              {phase === 'login' && platform === 'zomato' && (
                <motion.div key="zomato-login" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="h-full">
                  <ZomatoLogin onLogin={handleLogin} />
                </motion.div>
              )}

              {(phase === 'dashboard' || phase === 'extracting') && platform === 'uber' && (
                <motion.div key="uber-dash" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                  <UberDashboard />
                </motion.div>
              )}
              {(phase === 'dashboard' || phase === 'extracting') && platform === 'zomato' && (
                <motion.div key="zomato-dash" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                  <ZomatoDashboard />
                </motion.div>
              )}

              {phase === 'done' && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex items-center justify-center">
                  <CompletionScreen platform={platform} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Extraction Overlay — rendered ON TOP of the dashboard */}
            <AnimatePresence>
              {phase === 'extracting' && (
                <ExtractionOverlay progress={extractionProgress} platformName={PLATFORM_CONFIG[platform]?.name} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


// ════════════════════════════════════════════════════════════════
// RECLAIM PROTOCOL LANDING PAGE  (the first thing inside the browser)
// ════════════════════════════════════════════════════════════════

function ReclaimLandingPage({ onSelectPlatform }) {
  const platforms = [
    { id: 'uber',    name: 'Uber',          sub: 'Driver / Partner Earnings',     color: '#000000', logo: '🚗', badge: 'Popular' },
    { id: 'zomato',  name: 'Zomato',        sub: 'Delivery Partner Payouts',      color: '#e23744', logo: '🍕', badge: 'Popular' },
    { id: null,      name: 'Swiggy',        sub: 'Delivery Partner (Coming soon)', color: '#fc8019', logo: '🛵', badge: null, disabled: true },
    { id: null,      name: 'Amazon Flex',   sub: 'Delivery Driver (Coming soon)',  color: '#ff9900', logo: '📦', badge: null, disabled: true },
    { id: null,      name: 'Ola',           sub: 'Driver Partner (Coming soon)',   color: '#89c540', logo: '🚕', badge: null, disabled: true },
    { id: null,      name: 'Dunzo',         sub: 'Delivery Partner (Coming soon)', color: '#00d084', logo: '📋', badge: null, disabled: true },
  ];

  return (
    <div className="h-full overflow-auto bg-[#0d0d0d]">
      {/* Reclaim Navbar */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Fingerprint size={18} className="text-black" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Reclaim Protocol</span>
          <span className="text-white/30 text-xs font-medium ml-1">v3.2.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-xs font-medium">Powered by zkTLS</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold">Session Active</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-white/70 text-xs font-semibold">Zero-Knowledge Verified · No Credentials Stored</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">
            Verify Your Earnings
          </h1>
          <p className="text-white/50 text-base font-medium max-w-md mx-auto leading-relaxed">
            Select a platform to securely verify your gig earnings. Your login is end-to-end encrypted and never stored on our servers.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search platforms..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-medium placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map((p) => (
            <button
              key={p.name}
              onClick={() => p.id && onSelectPlatform(p.id)}
              disabled={p.disabled}
              className={`group relative flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${
                p.disabled
                  ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                  : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {/* Logo */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${p.color}22` }}
              >
                {p.logo}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm">{p.name}</h3>
                  {p.badge && (
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-md uppercase tracking-wider">{p.badge}</span>
                  )}
                </div>
                <p className="text-white/40 text-xs font-medium mt-0.5 truncate">{p.sub}</p>
              </div>

              {/* Arrow */}
              {!p.disabled && (
                <ArrowRight size={16} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Security footer */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex items-center justify-center gap-6 text-white/20 text-[9px] font-bold uppercase tracking-[0.15em]">
            <span className="flex items-center gap-1.5"><Lock size={9} /> End-to-End Encrypted</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-1.5"><Zap size={9} /> Zero-Knowledge Proof</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-1.5"><ShieldCheck size={9} /> On-Chain Attestation</span>
          </div>
          <p className="text-center text-white/15 text-[10px] mt-4">
            Reclaim Protocol v3.2.1 · TLS Oracle Network · EIP-4844 Compatible
          </p>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// UBER LOGIN
// ════════════════════════════════════════════════════════════════

function UberLogin({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setTimeout(() => onLogin(), 1200);
  };

  return (
    <div className="h-full bg-white flex">
      {/* Left panel */}
      <div className="flex-1 flex flex-col justify-center px-12 max-w-md mx-auto">
        <div className="mb-10">
          <h1 className="text-[28px] font-black tracking-tighter text-black">Uber</h1>
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-[#141414] mb-2 leading-tight">
          What's your phone number?
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          Enter the mobile number linked to your driver account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-stretch border border-gray-300 rounded-lg overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
            <div className="flex items-center px-4 bg-gray-50 border-r border-gray-300 text-sm font-medium text-gray-600">
              🇮🇳 +91
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter mobile number"
              className="flex-1 px-4 py-4 text-base font-medium focus:outline-none"
              maxLength={10}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Verifying...</>
            ) : (
              'Continue →'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button className="mt-4 w-full border border-gray-300 rounded-lg py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
          Continue with Email
        </button>

        <p className="mt-8 text-[11px] text-gray-400 leading-relaxed">
          By proceeding, you consent to get calls, WhatsApp or SMS messages from Uber and its affiliates to the number provided.
        </p>
      </div>

      {/* Right panel — decorative */}
      <div className="hidden lg:block w-[360px] bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black to-zinc-900" />
        <div className="relative z-10 p-12 h-full flex flex-col justify-end">
          <div className="space-y-3 text-white/70 text-sm font-medium">
            <Car size={48} className="text-white mb-6" />
            <p className="text-white text-xl font-bold">Drive & earn on your schedule</p>
            <p>Set your own hours. Be your own boss.</p>
          </div>
        </div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// UBER DASHBOARD
// ════════════════════════════════════════════════════════════════

function UberDashboard() {
  return (
    <div className="h-full bg-[#f6f6f6] overflow-auto">
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-tighter">Uber</h1>
          <nav className="flex items-center gap-4 text-sm font-medium text-white/60">
            <span className="text-white border-b-2 border-white pb-1">Earnings</span>
            <span className="hover:text-white transition-colors cursor-pointer">Trips</span>
            <span className="hover:text-white transition-colors cursor-pointer">Account</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">A</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">This Week's Earnings</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Mar 12 – Mar 18, 2024</p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">+12% vs last week</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-[#141414]">₹4,200.50</span>
            <span className="text-lg text-gray-400 font-medium">total</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
            {[
              { label: 'Trips', value: '24' },
              { label: 'Online Hours', value: '32h' },
              { label: 'Acceptance', value: '89%' },
              { label: 'Rating', value: '4.92 ★' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-black text-[#141414]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#141414]">Recent Trips</h3>
            <span className="text-xs text-gray-400">7 trips this week</span>
          </div>
          <div className="divide-y divide-gray-50">
            {UBER_TRANSACTIONS.map((tx, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Car size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#141414]">{tx.title}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#141414]">₹{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// ZOMATO LOGIN
// ════════════════════════════════════════════════════════════════

function ZomatoLogin({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setTimeout(() => onLogin(), 1200);
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="bg-[#e23744] px-8 py-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white tracking-tight">zomato</span>
          <span className="text-xs font-bold text-white/60">Delivery Partner</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils size={28} className="text-[#e23744]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back!</h2>
            <p className="text-sm text-gray-500">Sign in to your delivery partner account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Mobile Number</label>
              <div className="flex items-stretch border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-[#e23744] transition-colors">
                <div className="flex items-center px-4 bg-gray-50 text-sm font-medium text-gray-500 border-r border-gray-200">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your number"
                  className="flex-1 px-4 py-3.5 text-base font-medium focus:outline-none"
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full bg-[#e23744] text-white font-bold py-3.5 rounded-xl hover:bg-[#c7303b] disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Sending OTP...</>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-gray-400 leading-relaxed">
            By clicking, I accept the <span className="text-[#e23744]">Terms & Conditions</span> and <span className="text-[#e23744]">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// ZOMATO DASHBOARD
// ════════════════════════════════════════════════════════════════

function ZomatoDashboard() {
  return (
    <div className="h-full bg-[#fafafa] overflow-auto">
      <div className="bg-[#e23744] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-tight">zomato</h1>
          <nav className="flex items-center gap-4 text-sm font-medium text-white/60">
            <span className="text-white border-b-2 border-white pb-1">Earnings</span>
            <span className="hover:text-white transition-colors cursor-pointer">Orders</span>
            <span className="hover:text-white transition-colors cursor-pointer">Profile</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">Online</div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">R</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">This Week's Payout</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Mar 12 – Mar 18, 2024</p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Star size={10} className="fill-green-600" /> Top Performer
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-gray-900">₹1,122.00</span>
            <span className="text-lg text-gray-400 font-medium">/week</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
            {[
              { label: 'Deliveries', value: '38' },
              { label: 'Active Hours', value: '28h' },
              { label: 'Avg / Order', value: '₹29.5' },
              { label: 'Rating', value: '4.8 ★' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-black text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recent Deliveries</h3>
            <span className="text-xs text-gray-400">7 deliveries this week</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ZOMATO_TRANSACTIONS.map((tx, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <Package size={16} className="text-[#e23744]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tx.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="flex items-center gap-0.5"><MapPin size={9} /> 3.2 km</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// EXTRACTION OVERLAY
// ════════════════════════════════════════════════════════════════

const EXTRACTION_STEPS = [
  { label: 'Establishing TLS session...',       icon: Lock,          pct: 10 },
  { label: 'Intercepting DOM elements...',      icon: ScanLine,      pct: 25 },
  { label: 'Extracting earnings data...',       icon: Globe,         pct: 45 },
  { label: 'Extracting trip history...',        icon: FileCheck,     pct: 65 },
  { label: 'Generating zero-knowledge proof...', icon: Fingerprint,  pct: 85 },
  { label: 'Verifying TLS certificate chain...', icon: ShieldCheck,  pct: 95 },
  { label: 'Proof generated ✓',                 icon: CheckCircle2, pct: 100 },
];

function ExtractionOverlay({ progress, platformName }) {
  const currentStep = [...EXTRACTION_STEPS].reverse().find((s) => progress >= s.pct) || EXTRACTION_STEPS[0];
  const CurrentIcon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-10 shadow-[0_0_20px_4px_rgba(52,211,153,0.4)]"
        initial={{ top: '0%' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
      />

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Fingerprint size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">Reclaim Protocol</h3>
              <p className="text-white/50 text-[10px] font-medium">Extracting data from {platformName}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Progress</span>
              <span className="text-emerald-400 text-xs font-black">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full relative"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <CurrentIcon size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="text-white/80 text-sm font-medium">{currentStep.label}</span>
          </div>

          <div className="mt-4 space-y-1.5 max-h-28 overflow-y-auto">
            {EXTRACTION_STEPS.filter((s) => progress > s.pct).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-white/30 text-[10px] font-medium">
                <CheckCircle2 size={10} className="text-emerald-500/60" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-white/20 text-[8px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><Lock size={8} /> E2E Encrypted</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Zap size={8} /> Zero Knowledge</span>
            <span>·</span>
            <span className="flex items-center gap-1"><ShieldCheck size={8} /> On-chain</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════════════
// COMPLETION SCREEN
// ════════════════════════════════════════════════════════════════

function CompletionScreen({ platform }) {
  const count = platform === 'uber' ? UBER_TRANSACTIONS.length : ZOMATO_TRANSACTIONS.length;
  const name = platform === 'uber' ? 'Uber' : 'Zomato';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-3xl p-12 max-w-md text-center shadow-2xl"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
        className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 size={40} className="text-emerald-500" />
      </motion.div>
      <h2 className="text-2xl font-black tracking-tight mb-2">Import Successful!</h2>
      <p className="text-sm text-gray-500 font-medium">
        {count} verified transactions from <strong>{name}</strong> are being encrypted and stored on IPFS.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold">
        <Loader2 size={14} className="animate-spin" />
        Processing...
      </div>
    </motion.div>
  );
}
