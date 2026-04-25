import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeftRight, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Truck,
  Car,
  Package,
  Utensils,
  CheckCircle2,
  ShieldCheck,
  Search,
  Wallet,
  Plus,
  Loader2,
  Lock,
  Unlock,
  Upload,
  ScanLine,
  CircleCheck,
  CircleX,
  ImageIcon
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { connectWallet, getConnectedWallet, deriveEncryptionKey, encryptData, decryptData } from '../services/wallet';
import { uploadToIPFS, fetchFromIPFS } from '../services/pinata';
import { recordTransaction, getMyTransactions } from '../services/api';
import { useTranslation } from 'react-i18next';
import ZkTlsImport from './ZkTlsImport';

// ─── Icon map for transaction types ─────────────────────
const ICON_MAP = {
  logistics: Truck,
  rideshare: Car,
  delivery: Package,
  food: Utensils,
  inspection: CheckCircle2,
  default: ArrowLeftRight,
};

// ─── Sub-components ─────────────────────────────────────

const TransactionRow = ({ icon: Icon, title, platform, status, amount, date, isZk }) => (
  <tr className="hover:bg-slate-50 transition-all duration-200 group">
    <td className="px-8 py-6">
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isZk ? 'bg-surface-container text-primary' : 'bg-black text-white'}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="font-bold text-lg tracking-tight">{title}</p>
          <p className="text-sm text-on-surface-variant font-medium">{platform}</p>
        </div>
      </div>
    </td>
    <td className="px-8 py-6 text-on-surface-variant text-sm font-semibold">{date}</td>
    <td className="px-8 py-6 text-right">
      <span className="text-xl font-black tracking-tight">{amount}</span>
    </td>
    <td className="px-8 py-6 text-center">
      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] border transition-all ${isZk 
        ? 'bg-surface-container-low text-on-surface-variant border-outline/10' 
        : 'bg-surface-container-high text-primary border-outline/20'}`}>
        {isZk ? <ShieldCheck size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
        {status}
      </span>
    </td>
  </tr>
);

const TrendingUp = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

// ─── Main Component ─────────────────────────────────────

// Date range options
const DATE_RANGES = [
  { label: 'All Time',    days: null },
  { label: 'Last 7 days',  days: 7   },
  { label: 'Last 30 days', days: 30  },
  { label: 'Last 90 days', days: 90  },
];

export default function TransactionPage() {
  const { t } = useTranslation();
  const [walletAddress, setWalletAddress] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showZkTlsFlow, setShowZkTlsFlow] = useState(false);
  const [zkImporting, setZkImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('external'); // 'internal' | 'external'

  // ─── Filter state ───────────────────────────────────────
  const [dateRangeIdx, setDateRangeIdx] = useState(2); // default: Last 30 days
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('All Platforms');
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);

  // Check wallet on mount
  useEffect(() => {
    getConnectedWallet().then((addr) => {
      if (addr) setWalletAddress(addr);
    });
  }, []);

  // ─── Wallet & Key ──────────────────────────────────────

  const handleConnectWallet = async () => {
    try {
      setError('');
      const addr = await connectWallet();
      setWalletAddress(addr);

      // Derive encryption key
      const key = await deriveEncryptionKey(addr);
      setEncryptionKey(key);

      // Fetch existing transactions
      await loadTransactions(key);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnlockVault = async () => {
    try {
      setError('');
      const key = await deriveEncryptionKey(walletAddress);
      setEncryptionKey(key);
      await loadTransactions(key);
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Load & Decrypt ────────────────────────────────────

  const loadTransactions = async (key) => {
    setLoading(true);
    setError('');
    try {
      const refs = await getMyTransactions();
      console.log(`[VAULT] Backend returned ${refs.length} transaction refs for this worker`);
      
      if (refs.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const decrypted = await Promise.all(
        refs.map(async (ref) => {
          try {
            console.log(`[VAULT] Fetching CID: ${ref.cid} (tx_type: ${ref.tx_type})`);
            // Add a 15s timeout per IPFS fetch so the page doesn't hang
            const fetchPromise = fetchFromIPFS(ref.cid);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('IPFS fetch timed out after 15s')), 15000)
            );
            const encPayload = await Promise.race([fetchPromise, timeoutPromise]);
            console.log('[VAULT] Fetched from IPFS for CID:', ref.cid);
            const data = await decryptData(key, encPayload);
            return { ...data, id: ref.id, cid: ref.cid, created_at: ref.created_at, tx_type: ref.tx_type };
          } catch (decryptErr) {
            console.error('[VAULT] Failed for CID:', ref.cid, decryptErr.message);
            return { id: ref.id, cid: ref.cid, title: '[Encrypted — cannot decrypt]', error: true, tx_type: ref.tx_type };
          }
        })
      );
      
      const successCount = decrypted.filter(d => !d.error).length;
      console.log(`[VAULT] Decrypted ${successCount}/${decrypted.length} transactions successfully`);
      setTransactions(decrypted);
    } catch (err) {
      console.error('[VAULT] loadTransactions failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Encrypt & Upload ──────────────────────────────────

  const handleAddTransaction = async (txData) => {
    setUploading(true);
    setModalError('');
    try {
      console.log('[VAULT] Encrypting transaction data...');
      // 1. Encrypt data client-side
      const encPayload = await encryptData(encryptionKey, txData);
      console.log('[VAULT] Encrypted. Uploading to IPFS...');

      // 2. Upload encrypted JSON to IPFS
      const cid = await uploadToIPFS(encPayload, { worker: walletAddress });
      console.log('[VAULT] Uploaded to IPFS. CID:', cid);

      // 3. Store CID reference in backend
      await recordTransaction({ cid, wallet_address: walletAddress, tx_type: txData.tx_type || 'internal' });
      console.log('[VAULT] CID stored in backend.');

      // 4. Add to local state
      setTransactions((prev) => [{ ...txData, cid }, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      console.error('[VAULT] Transaction error:', err);
      setModalError(err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  // ─── Batch import from zkTLS simulation ─────────────────

  const handleZkTlsBatchImport = async (extractedTxns) => {
    if (!encryptionKey || !walletAddress) {
      setError('Wallet not connected. Please connect and unlock vault first.');
      return;
    }
    setZkImporting(true);
    setError('');
    try {
      for (const txData of extractedTxns) {
        const encPayload = await encryptData(encryptionKey, txData);
        const cid = await uploadToIPFS(encPayload, { worker: walletAddress });
        await recordTransaction({ cid, wallet_address: walletAddress, tx_type: txData.tx_type || 'external' });
        setTransactions((prev) => [{ ...txData, cid }, ...prev]);
      }
    } catch (err) {
      console.error('[VAULT] zkTLS batch import error:', err);
      setError(err.message || 'Failed to import some transactions.');
    } finally {
      setZkImporting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────

  // Also handle job-completion records (no IPFS — direct meta from backend)
  const normalizeJobTx = (tx) => {
    if (tx.meta && tx.source === 'job_completion') {
      return { ...tx, ...tx.meta, isJobPayment: true };
    }
    // Records stored with extra flat meta fields from the recordTransaction call
    if (tx.source === 'job_completion') {
      return { ...tx, isJobPayment: true };
    }
    return tx;
  };

  const allTx = transactions.map(normalizeJobTx);

  // ─── Derive unique platforms for the filter dropdown ───
  const uniquePlatforms = ['All Platforms', ...Array.from(new Set(
    allTx.map(tx => tx.platform).filter(Boolean)
  ))];

  // ─── Apply filters ─────────────────────────────────────
  const selectedRange = DATE_RANGES[dateRangeIdx];
  const cutoff = selectedRange.days
    ? new Date(Date.now() - selectedRange.days * 86400000)
    : null;

  const visibleTx = allTx.filter((tx) => {
    // Tab filter
    const tabOk = activeTab === 'external'
  // Internal = uploaded via VAULT form; External = zkTLS or job completions
  const visibleTx = allTx.filter((tx) =>
    activeTab === 'external'
      ? (tx.isZk || tx.isJobPayment || tx.tx_type === 'external')
      : (!tx.isZk && !tx.isJobPayment && tx.tx_type !== 'external');
    if (!tabOk) return false;

    // Date range filter
    if (cutoff && tx.date) {
      const txDate = new Date(tx.date);
      if (!isNaN(txDate) && txDate < cutoff) return false;
    }

    // Platform filter
    if (platformFilter !== 'All Platforms' && tx.platform !== platformFilter) return false;

    return true;
  });

  const totalVolume = transactions
    .filter((t) => !t.error)
    .reduce((sum, t) => sum + (parseFloat(String(t.amount).replace(/[^0-9.]/g, '')) || 0), 0);

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="max-w-2xl space-y-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black tracking-tighter leading-none"
          >
            Financial Identity & <br />
            <span className="text-on-surface-variant">{t('transaction.title')}</span>
          </motion.h1>
          <p className="text-on-surface-variant text-lg leading-relaxed font-medium">
            {t('transaction.subtitle')}
          </p>
        </div>
        
        {/* Wallet Status */}
        <div className="flex gap-3">
          {!walletAddress ? (
            <button 
              onClick={handleConnectWallet}
              className="flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Wallet size={18} /> {t('cert.connectWallet')}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline/5 flex items-center gap-3 shadow-sm">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-black tracking-wide">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </div>
              {!encryptionKey ? (
                <button 
                  onClick={handleUnlockVault}
                  className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                >
                  <Lock size={14} /> {t('cert.unlockVault')}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowZkTlsFlow(true)}
                    className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10"
                  >
                    <ShieldCheck size={14} /> Import via zkTLS
                  </button>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10"
                  >
                    <Plus size={14} /> {t('transaction.addTransaction')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium"
        >
          {error}
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pt-8 border-t border-outline/10">
        <nav className="flex gap-2 p-1.5 bg-white shadow-sm border border-outline/5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-8 py-3 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${
              activeTab === 'internal'
                ? 'bg-slate-100 text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            Internal (VAULT)
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-8 py-3 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${
              activeTab === 'external'
                ? 'bg-slate-100 text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            External (Verified)
            {allTx.filter(tx => tx.isZk || tx.isJobPayment || tx.tx_type === 'external').length > 0 && (
              <span className="ml-2 bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {allTx.filter(tx => tx.isZk || tx.isJobPayment || tx.tx_type === 'external').length}
              </span>
            )}
          </button>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          {/* ── Date Range filter ── */}
          <div className="relative">
            <button
              onClick={() => { setShowDateMenu(v => !v); setShowPlatformMenu(false); }}
              className="flex items-center gap-2 px-5 py-3 bg-white shadow-sm border border-outline/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              {DATE_RANGES[dateRangeIdx].label} <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {showDateMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 mt-2 left-0 bg-white rounded-2xl shadow-xl border border-outline/10 overflow-hidden min-w-[160px]"
                >
                  {DATE_RANGES.map((r, idx) => (
                    <button
                      key={r.label}
                      onClick={() => { setDateRangeIdx(idx); setShowDateMenu(false); }}
                      className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                        dateRangeIdx === idx
                          ? 'bg-slate-100 text-primary'
                          : 'hover:bg-slate-50 text-on-surface-variant'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Platform filter ── */}
          <div className="relative">
            <button
              onClick={() => { setShowPlatformMenu(v => !v); setShowDateMenu(false); }}
              className="flex items-center gap-2 px-5 py-3 bg-white shadow-sm border border-outline/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              {platformFilter} <Filter size={14} />
            </button>
            <AnimatePresence>
              {showPlatformMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 mt-2 left-0 bg-white rounded-2xl shadow-xl border border-outline/10 overflow-hidden min-w-[180px]"
                >
                  {uniquePlatforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPlatformFilter(p); setShowPlatformMenu(false); }}
                      className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                        platformFilter === p
                          ? 'bg-slate-100 text-primary'
                          : 'hover:bg-slate-50 text-on-surface-variant'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-4 text-on-surface-variant">
          <Loader2 size={24} className="animate-spin" />
          <span className="font-bold text-sm uppercase tracking-widest">{t('cert.decrypting')}</span>
        </div>
      )}

      {/* Vault Locked State */}
      {!encryptionKey && !loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
            <Lock size={32} className="text-on-surface-variant" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">{t('transaction.vaultLocked')}</h3>
            <p className="text-on-surface-variant font-medium max-w-md">
              {t('transaction.vaultLockedDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      {encryptionKey && !loading && (() => {
        const successTx = visibleTx.filter(tx => !tx.error);
        const failedTx = visibleTx.filter(tx => tx.error);
        
        return (
          <div className="space-y-4">
            {/* Decrypt failure banner */}
            {failedTx.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 px-8 py-5 bg-amber-50 border border-amber-200 rounded-2xl"
              >
                <Lock size={18} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    {failedTx.length} transaction{failedTx.length > 1 ? 's' : ''} encrypted with a different wallet
                  </p>
                  <p className="text-xs text-amber-600">
                    These were created using a different MetaMask account. Switch to the original wallet to decrypt, or add new transactions with this wallet.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-2xl shadow-black/[0.03] overflow-hidden border border-outline/5 relative">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/40">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Transaction & Source</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Date</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant text-right">Amount</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant text-center">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/5">
                  {successTx.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-on-surface-variant font-medium">
                        {failedTx.length > 0 
                          ? 'No decryptable transactions for this wallet. Add new transactions with this account.'
                          : activeTab === 'external'
                            ? 'No external transactions yet. Complete a job or import via zkTLS.'
                            : `No internal transactions yet. ${t('transaction.addFirst')}`
                        }
                      </td>
                    </tr>
                  ) : (
                    successTx.map((tx, i) => (
                      <TransactionRow
                        key={tx.id || i}
                        icon={ICON_MAP[tx.category] || ICON_MAP.default}
                        title={tx.title || 'Job Payment'}
                        platform={tx.platform || '—'}
                        status={
                          tx.isJobPayment ? 'JOB COMPLETED'
                            : tx.isZk ? 'zkTLS PROOF'
                            : 'EAS VERIFIED'
                        }
                        amount={`₹${parseFloat(tx.amount || 0).toFixed(2)}`}
                        date={tx.date || '—'}
                        isZk={tx.isZk || tx.isJobPayment || false}
                      />
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-8 py-8 bg-surface-container-low/20 flex items-center justify-between border-t border-outline/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                  Showing {successTx.length} of {transactions.filter(t => !t.error).length} transaction{transactions.filter(t => !t.error).length !== 1 ? 's' : ''}
                  {failedTx.length > 0 && ` · ${failedTx.length} locked`}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats Grid */}
      {encryptionKey && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-12 bg-surface-container-low rounded-[2.5rem] border border-outline/5 flex flex-col justify-between group">
            <div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-8">Verified Monthly Volume</p>
              <h3 className="text-6xl font-black tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">
                ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-10 flex items-center gap-2 text-black font-black text-xs tracking-[0.1em] uppercase">
              <TrendingUp size={14} />
              <span>Off-chain encrypted</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-[2.5rem] p-12 relative overflow-hidden flex items-center border border-outline/10 shadow-sm group">
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-3">Data Privacy</p>
                  <h3 className="text-4xl font-black tracking-tighter italic">End-to-End Encrypted</h3>
                </div>
                <span className="px-5 py-2 bg-black text-white rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl shadow-black/10">
                  IPFS + AES-GCM
                </span>
              </div>
              
              <div className="w-full bg-surface-container rounded-full h-3 mb-6 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="bg-black h-3 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </motion.div>
              </div>
              
              <p className="text-sm text-secondary font-medium leading-relaxed max-w-xl">
                Your transaction data is encrypted with your MetaMask wallet key and stored on IPFS. 
                The backend only stores content hashes — never your actual data.
              </p>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-surface-container/20 rounded-full blur-3xl group-hover:bg-surface-container/40 transition-colors duration-700"></div>
          </div>
        </div>
      )}

      {/* ─── Add Transaction Modal ─── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-10 w-full max-w-lg shadow-2xl border border-outline/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold tracking-tight mb-4">{t('transaction.addTransaction')}</h3>
              {modalError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  {modalError}
                </div>
              )}
              <AddTransactionForm onSubmit={handleAddTransaction} loading={uploading} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── zkTLS Import Flow ─── */}
      <ZkTlsImport
        open={showZkTlsFlow}
        onClose={() => setShowZkTlsFlow(false)}
        onTransactionsExtracted={handleZkTlsBatchImport}
      />

      {/* zkTLS importing indicator */}
      <AnimatePresence>
        {zkImporting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl p-10 max-w-sm text-center shadow-2xl">
              <Loader2 size={32} className="animate-spin mx-auto mb-4 text-emerald-600" />
              <h3 className="text-lg font-black tracking-tight mb-1">Encrypting & Uploading</h3>
              <p className="text-sm text-on-surface-variant font-medium">Storing your verified transactions on IPFS...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add Transaction Form ───────────────────────────────

function AddTransactionForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    platform: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'logistics',
    isZk: false,
    tx_type: 'internal',
  });

  // OCR states
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('idle'); // idle | scanning | verified | failed
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedAmount, setExtractedAmount] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ocrStatus !== 'verified') return;
    onSubmit({ ...form, verification: 'OCR_MATCHED' });
  };

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: val });
    // Reset OCR if amount changes after verification
    if (field === 'amount' && ocrStatus !== 'idle') {
      setOcrStatus('idle');
      setExtractedAmount(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setOcrStatus('idle');
    setExtractedAmount(null);
  };

  const handleVerify = async () => {
    if (!receiptFile || !form.amount) return;
    setOcrStatus('scanning');
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(receiptFile, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const rawText = result.data.text;
      console.log('[OCR] ===== FULL RAW TEXT =====');
      console.log(rawText);
      console.log('[OCR] ========================');

      // Get what user typed
      const userAmount = parseFloat(form.amount);
      // Create multiple string representations to match
      const searchStrings = [
        String(Math.round(userAmount)),           // "10"
        userAmount.toFixed(2),                     // "10.00"
        userAmount.toFixed(1),                     // "10.0"
        String(userAmount),                        // "10"
      ];

      // Simple check: does any of these strings appear in the OCR text?
      const found = searchStrings.some(s => rawText.includes(s));
      
      if (found) {
        console.log('[OCR] MATCH — found user amount in text');
        setExtractedAmount(userAmount);
        setOcrStatus('verified');
      } else {
        console.log('[OCR] NO MATCH — user amount not found in text');
        // Try to find what numbers ARE in the text for error reporting
        const allNumbers = rawText.match(/\d+\.?\d*/g) || [];
        const nums = [...new Set(allNumbers.map(n => parseFloat(n)).filter(n => n > 0))];
        console.log('[OCR] Numbers found in text:', nums);
        setExtractedAmount(nums.length > 0 ? nums[0] : null);
        setOcrStatus('failed');
      }
    } catch (err) {
      console.error('[OCR] Error:', err);
      setOcrStatus('failed');
      setExtractedAmount(null);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setOcrStatus('idle');
    setExtractedAmount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Title</label>
        <input className="w-full bg-surface-container-low rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary transition-all border-none" placeholder="Logistics Delivery #402" value={form.title} onChange={set('title')} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Platform</label>
          <input className="w-full bg-surface-container-low rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary transition-all border-none" placeholder="VAULT Hirer" value={form.platform} onChange={set('platform')} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Amount ($ / ₹)</label>
          <input className="w-full bg-surface-container-low rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary transition-all border-none" placeholder="120.00" type="number" step="0.01" value={form.amount} onChange={set('amount')} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</label>
          <input className="w-full bg-surface-container-low rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary transition-all border-none" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Category</label>
          <select className="w-full bg-surface-container-low rounded-xl p-4 font-medium focus:ring-2 focus:ring-primary transition-all border-none" value={form.category} onChange={set('category')}>
            <option value="logistics">Logistics</option>
            <option value="rideshare">Rideshare</option>
            <option value="delivery">Delivery</option>
            <option value="food">Food</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <input type="checkbox" id="isZk" checked={form.isZk} onChange={set('isZk')} className="w-5 h-5 rounded accent-primary" />
        <label htmlFor="isZk" className="text-sm font-bold text-on-surface-variant">zkTLS Verified (external source)</label>
      </div>

      {/* ─── Receipt Upload & OCR Section ─── */}
      <div className="border-t border-outline/10 pt-5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Upload Payment Proof</label>
        
        {!receiptFile ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-outline/20 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-surface-container-low/50 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Upload size={22} className="text-on-surface-variant group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-bold text-on-surface-variant">Click to upload screenshot</p>
            <p className="text-xs text-outline">PNG, JPG — Receipt / Payment proof</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-outline/10 bg-surface-container-low">
              <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain" />
              <button 
                type="button" 
                onClick={removeReceipt}
                className="absolute top-2 right-2 w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/png,image/jpeg,image/jpg,image/webp" 
          onChange={handleFileSelect}
          className="hidden" 
        />

        {/* Verify Button */}
        {receiptFile && ocrStatus !== 'verified' && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={ocrStatus === 'scanning' || !form.amount}
            className="w-full py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {ocrStatus === 'scanning' ? (
              <><Loader2 size={14} className="animate-spin" /> Scanning receipt... {ocrProgress}%</>
            ) : (
              <><ScanLine size={14} /> Verify Amount from Receipt</>
            )}
          </button>
        )}

        {/* Verification Result */}
        {ocrStatus === 'verified' && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <CircleCheck size={20} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">Amount Verified ✓</p>
              <p className="text-xs text-green-600">Extracted {extractedAmount} matches your input of {form.amount}</p>
            </div>
          </motion.div>
        )}

        {ocrStatus === 'failed' && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <CircleX size={20} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">Amount Mismatch</p>
              <p className="text-xs text-red-600">
                {extractedAmount !== null 
                  ? `Found ${extractedAmount} in receipt, but you entered ${form.amount}` 
                  : 'Could not extract any amount from the image. Try a clearer screenshot.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Submit */}
      <button 
        type="submit" 
        disabled={loading || ocrStatus !== 'verified'}
        className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Encrypting & Uploading...</> : <><Lock size={16} /> Encrypt & Store on IPFS</>}
      </button>
    </form>
  );
}
