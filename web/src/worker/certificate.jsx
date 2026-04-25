import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Verified, Calendar, Layers, Shield, Link as LinkIcon,
  Star, QrCode, ChevronDown, Sparkles, Wallet, Lock,
  Unlock, Loader2, CheckCircle2, Copy, ExternalLink,
  AlertCircle, FileCheck, CheckSquare, Square, Truck,
  Car, Package, Utensils, ArrowLeftRight, Globe,
} from 'lucide-react';
import {
  getConnectedWallet, connectWallet,
  deriveEncryptionKey, decryptData, encryptData,
} from '../services/wallet';
import { fetchFromIPFS, uploadToIPFS } from '../services/pinata';
import { getMyTransactions, publishCertificate } from '../services/api';
import { useTranslation } from 'react-i18next';

// ─── Icon map ──────────────────────────────────────────────────────────
const ICON_MAP = {
  logistics: Truck, rideshare: Car, delivery: Package,
  food: Utensils, inspection: CheckCircle2, default: ArrowLeftRight,
};

// ─── Helpers ───────────────────────────────────────────────────────────
async function sha256(obj) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(obj));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function calcTrustScore(gigs, earnings) {
  const gigScore = Math.min(gigs * 2, 60);
  const earningScore = Math.min(earnings / 100, 40);
  return Math.min(Math.round(gigScore + earningScore), 99);
}

// ─── Steps shown in progress bar ──────────────────────────────────────
const GEN_STEPS_KEYS = [
  'cert.step1', 'cert.step2', 'cert.step3', 'cert.step4', 'cert.step5', 'cert.step6',
];

// ─── Transaction row in the selection list ─────────────────────────────
function TxSelectRow({ tx, selected, onToggle }) {
  const Icon = ICON_MAP[tx.category] || ICON_MAP.default;
  const amount = parseFloat(String(tx.amount).replace(/[^0-9.]/g, '')) || 0;

  return (
    <motion.div
      layout
      onClick={onToggle}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer border transition-all duration-200 select-none ${
        selected
          ? 'bg-black text-white border-black shadow-lg'
          : 'bg-white border-outline/10 hover:border-outline/30 hover:bg-surface-container-low'
      }`}
    >
      {/* checkbox */}
      <div className="flex-shrink-0">
        {selected
          ? <CheckSquare size={18} className="text-white" />
          : <Square size={18} className="text-on-surface-variant/40" />
        }
      </div>

      {/* icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        selected ? 'bg-white/10' : 'bg-surface-container-low'
      }`}>
        <Icon size={16} className={selected ? 'text-white' : 'text-on-surface-variant'} />
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${selected ? 'text-white' : 'text-on-surface'}`}>
          {tx.title}
        </p>
        <p className={`text-[10px] font-semibold truncate ${selected ? 'text-white/60' : 'text-on-surface-variant'}`}>
          {tx.platform || '—'} · {tx.date || '—'}
        </p>
      </div>

      {/* amount */}
      <p className={`text-sm font-black tracking-tight flex-shrink-0 ${selected ? 'text-white' : ''}`}>
        ₹{amount.toFixed(2)}
      </p>

      {/* zk badge */}
      {tx.isZk && (
        <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-full flex-shrink-0 ${
          selected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
        }`}>zkTLS</span>
      )}
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────
export default function CertificatePage() {
  const { t } = useTranslation();
  // wallet
  const [walletAddress, setWalletAddress] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);

  // data loading
  const [allTransactions, setAllTransactions] = useState([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [txLoadError, setTxLoadError] = useState('');

  // selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState('');

  // result
  const [published, setPublished] = useState(false);
  const [proofHash, setProofHash] = useState('');
  const [ipfsCid, setIpfsCid] = useState('');
  const [copied, setCopied] = useState(false);

  // ── restore wallet ────────────────────────────────────────────────
  useEffect(() => {
    getConnectedWallet().then((addr) => { if (addr) setWalletAddress(addr); });
  }, []);

  // ── connect wallet ────────────────────────────────────────────────
  const handleConnectWallet = async () => {
    try {
      setError('');
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── unlock vault + load transactions ─────────────────────────────
  const handleUnlockVault = async () => {
    try {
      setError('');
      setTxLoadError('');
      const key = await deriveEncryptionKey(walletAddress);
      setEncryptionKey(key);
      await loadTransactions(key);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── fetch + decrypt all transactions ─────────────────────────────
  const loadTransactions = async (key) => {
    setLoadingTxs(true);
    setTxLoadError('');
    try {
      const refs = await getMyTransactions();
      const decrypted = await Promise.all(
        refs.map(async (ref) => {
          try {
            const encPayload = await fetchFromIPFS(ref.cid);
            const data = await decryptData(key, encPayload);
            return { ...data, id: ref.id, cid: ref.cid, created_at: ref.created_at };
          } catch {
            return null;
          }
        })
      );
      const valid = decrypted.filter(Boolean);
      setAllTransactions(valid);
      // Select all by default
      setSelectedIds(new Set(valid.map((tx) => tx.id)));
    } catch (err) {
      setTxLoadError(err.message || 'Failed to load transactions.');
    } finally {
      setLoadingTxs(false);
    }
  };

  // ── toggle selection ──────────────────────────────────────────────
  const toggleTx = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === allTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allTransactions.map((tx) => tx.id)));
    }
  };

  // ── derived stats for preview ─────────────────────────────────────
  const selectedTxs = allTransactions.filter((tx) => selectedIds.has(tx.id));
  const totalEarnings = selectedTxs.reduce(
    (sum, tx) => sum + (parseFloat(String(tx.amount).replace(/[^0-9.]/g, '')) || 0), 0
  );
  const trustScore = calcTrustScore(selectedTxs.length, totalEarnings);

  // ── copy helper ───────────────────────────────────────────────────
  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── MAIN: publish flow ────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!encryptionKey || selectedTxs.length === 0) return;
    setIsGenerating(true);
    setCurrentStep(0);
    setError('');
    setPublished(false);
    setProofHash('');
    setIpfsCid('');

    try {
      // Step 1: already have transactions loaded
      setCurrentStep(0);
      await new Promise((r) => setTimeout(r, 300));

      // Step 2: already decrypted
      setCurrentStep(1);
      await new Promise((r) => setTimeout(r, 300));

      // Step 3: build summary from selected transactions
      setCurrentStep(2);
      const platforms = [...new Set(selectedTxs.map((tx) => tx.platform).filter(Boolean))];
      const serial = `VN-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}-XK`;

      // Public summary — what the worker chooses to showcase (PLAINTEXT)
      const publicSummary = {
        serial,
        workerAddress: walletAddress,
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalGigs: selectedTxs.length,
        trustScore,
        platforms,
        period: 'Selected Transactions',
        issueDate: new Date().toISOString(),
        issuer: 'VAULT v1',
        // Individual gigs the worker chose to include (plaintext)
        gigs: selectedTxs.map((tx) => ({
          title: tx.title,
          platform: tx.platform || '—',
          amount: parseFloat(String(tx.amount).replace(/[^0-9.]/g, '')) || 0,
          date: tx.date || '—',
          category: tx.category || 'default',
          isZk: tx.isZk || false,
        })),
      };

      // Step 4: encrypt + hash
      setCurrentStep(3);
      const encryptedCert = await encryptData(encryptionKey, publicSummary);
      const hash = await sha256(publicSummary);
      setProofHash(hash);

      // Step 5: upload encrypted cert to IPFS (optional)
      setCurrentStep(4);
      let cid = null;
      try {
        cid = await uploadToIPFS(encryptedCert, { type: 'certificate', worker: walletAddress });
        setIpfsCid(cid);
      } catch (e) {
        console.warn('[VAULT] IPFS upload skipped:', e.message);
      }

      // Step 6: publish plaintext summary to backend → dashboard can read it
      setCurrentStep(5);
      await publishCertificate({
        proof_hash: hash,
        public_summary: publicSummary,
        platform_tags: platforms,
        period: 'Selected Transactions',
        certificate_cid: cid,
      });

      setPublished(true);
      setCurrentStep(-1);
    } catch (err) {
      console.error('[VAULT] Publish failed:', err);
      setError(err.message || 'Certificate publish failed.');
      setCurrentStep(-1);
    } finally {
      setIsGenerating(false);
    }
  }, [encryptionKey, selectedTxs, walletAddress, totalEarnings, trustScore]);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-20">

      {/* ── LEFT: Config + Transaction Selector ──────────────────── */}
      <section className="lg:col-span-5 space-y-8">

        {/* Heading */}
        <div className="space-y-3">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-[3.5rem] font-black tracking-tighter leading-[0.9]">
            {t('cert.buildTitle')}
          </motion.h2>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-md">
            {t('cert.buildDesc')}
          </p>
        </div>

        {/* Wallet section */}
        <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline/5">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">Wallet & Vault</p>

          {!walletAddress ? (
            <button onClick={handleConnectWallet}
              className="flex items-center gap-3 w-full px-5 py-4 bg-black text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all">
              <Wallet size={16} /> {t('cert.connectWallet')}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-outline/10 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-black tracking-wide font-mono">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </span>
              </div>
              {!encryptionKey ? (
                <button onClick={handleUnlockVault}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
                  <Lock size={14} /> Unlock Vault & Load Transactions
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <Unlock size={14} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700">{t('cert.vaultUnlocked')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading transactions */}
        {loadingTxs && (
          <div className="flex items-center gap-3 px-5 py-4 bg-surface-container-low rounded-2xl border border-outline/5">
            <Loader2 size={16} className="animate-spin text-on-surface-variant" />
            <span className="text-sm font-semibold text-on-surface-variant">{t('cert.decrypting')}</span>
          </div>
        )}

        {/* Transaction selection list */}
        {encryptionKey && !loadingTxs && allTransactions.length > 0 && (
          <div className="space-y-4">
            {/* Header + select all */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                {t('cert.selectTransactions')} ({selectedIds.size}/{allTransactions.length})
              </p>
              <button onClick={toggleAll}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all">
                {selectedIds.size === allTransactions.length ? t('cert.deselectAll') : t('cert.selectAll')}
              </button>
            </div>

            {/* Transaction rows */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {allTransactions.map((tx) => (
                <TxSelectRow
                  key={tx.id}
                  tx={tx}
                  selected={selectedIds.has(tx.id)}
                  onToggle={() => toggleTx(tx.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* No transactions */}
        {encryptionKey && !loadingTxs && allTransactions.length === 0 && (
          <div className="text-center py-10 text-on-surface-variant">
            <Globe size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">{t('cert.noTxFound')}</p>
            <p className="text-xs mt-1">{t('cert.noTxDesc')}</p>
          </div>
        )}

        {/* Error display */}
        <AnimatePresence>
          {(error || txLoadError) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error || txLoadError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress steps (while generating) */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="space-y-2 bg-surface-container-low rounded-2xl p-5 border border-outline/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">{t('cert.publishing')}</p>
                {GEN_STEPS_KEYS.map((key, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      i < currentStep ? 'bg-black text-white' :
                      i === currentStep ? 'border-2 border-primary bg-primary/10' :
                      'bg-surface-container-high'
                    }`}>
                      {i < currentStep && <CheckCircle2 size={12} />}
                      {i === currentStep && <Loader2 size={10} className="animate-spin text-primary" />}
                    </div>
                    <span className={`text-xs font-semibold transition-colors ${
                      i < currentStep ? 'text-on-surface' :
                      i === currentStep ? 'text-primary font-bold' :
                      'text-on-surface-variant/40'
                    }`}>{t(key)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Publish button */}
        <button
          onClick={handlePublish}
          disabled={!encryptionKey || isGenerating || selectedTxs.length === 0}
          className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-4 shadow-2xl shadow-black/20 group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating
            ? <><Loader2 className="animate-spin" size={20} /> {t('cert.publishing')}</>
            : <><span>{t('cert.publishDashboard')}</span><Verified className="group-hover:rotate-12 transition-transform" size={22} /></>
          }
        </button>

        {/* Success panel */}
        <AnimatePresence>
          {published && !isGenerating && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4 bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-green-600" />
                <p className="font-black text-green-800 text-sm uppercase tracking-wider">{t('cert.publishedDashboard')}</p>
              </div>

              {/* Proof hash */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-green-700/60 uppercase tracking-widest">{t('cert.proofHash')}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[10px] font-mono text-green-800 bg-green-100 px-3 py-2 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap">
                    {proofHash}
                  </code>
                  <button onClick={() => handleCopy(proofHash)} className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors">
                    <Copy size={12} className="text-green-700" />
                  </button>
                </div>
                {copied && <p className="text-[10px] text-green-600 font-bold">Copied!</p>}
              </div>

              {/* IPFS link */}
              {ipfsCid && (
                <a href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-[10px] font-mono text-green-700 hover:underline">
                  IPFS: {ipfsCid.slice(0, 20)}...{ipfsCid.slice(-8)} <ExternalLink size={10} />
                </a>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('hirer.jobs'), value: selectedTxs.length },
                  { label: t('hirer.earnings'), value: `₹${totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                  { label: t('hirer.trust'), value: `${trustScore}/99` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-green-100 rounded-xl py-3">
                    <p className="text-[8px] font-black text-green-600 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-black text-green-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── RIGHT: Live Certificate Card Preview ──────────────────── */}
      <section className="lg:col-span-7 flex flex-col pt-4 lg:pt-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tighter flex items-center gap-2">
            <Sparkles size={18} /> Certificate Preview
          </h2>
          <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
            <span className={`w-2 h-2 rounded-full animate-pulse ${published ? 'bg-green-500' : 'bg-amber-400'}`} />
            {published ? t('cert.published') : t('cert.draft')}
          </div>
        </div>

        <div className="flex-1 bg-surface-container-low rounded-[3rem] p-10 flex items-start justify-center border border-outline/5 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent pointer-events-none" />

          <motion.div layout
            className="bg-white w-full max-w-lg rounded-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] p-10 flex flex-col relative overflow-hidden border border-black/[0.04] gap-8">
            {/* Watermark */}
            <div className="absolute -right-24 -bottom-24 opacity-[0.04] pointer-events-none rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Verified size={320} />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black tracking-[0.3em] text-black uppercase">VAULT Official Attestation</p>
                <p className="font-mono text-[9px] text-on-surface-variant/50">SERIAL: VN-DRAFT-XXXX-XK</p>
              </div>
              <div className="bg-surface-container px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <Star size={12} className="fill-black text-black" />
                <span className="text-[9px] font-black uppercase tracking-wider">TRUST: {trustScore}/99</span>
              </div>
            </div>

            {/* Name + desc */}
            <div>
              <h3 className="text-4xl font-black tracking-tighter mb-3">
                {selectedTxs.length} Verified Gigs
              </h3>
              <p className="text-on-surface-variant text-xs font-medium leading-relaxed">
                This certificate attests to <span className="font-black text-black">₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> in verified earnings
                across <span className="font-black text-black">{[...new Set(selectedTxs.map(t => t.platform).filter(Boolean))].join(', ') || 'selected platforms'}</span>.
              </p>
            </div>

            {/* Selected gig list */}
            {selectedTxs.length > 0 && (
              <div className="space-y-1.5 border-t border-outline/10 pt-6 max-h-40 overflow-y-auto">
                {selectedTxs.map((tx, i) => {
                  const Icon = ICON_MAP[tx.category] || ICON_MAP.default;
                  const amt = parseFloat(String(tx.amount).replace(/[^0-9.]/g, '')) || 0;
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-1.5">
                      <div className="w-6 h-6 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                        <Icon size={12} className="text-on-surface-variant" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{tx.title}</p>
                        <p className="text-[9px] text-on-surface-variant">{tx.platform} · {tx.date}</p>
                      </div>
                      <p className="text-xs font-black">₹{amt.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedTxs.length === 0 && (
              <div className="border border-dashed border-outline/20 rounded-xl py-8 text-center text-on-surface-variant/40">
                <p className="text-xs font-bold">Select transactions from the left to preview</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-end border-t border-outline/10 pt-6">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{t('cert.issueDate')}</p>
                <p className="text-xs font-black italic">
                  {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                </p>
              </div>
              <div className="w-14 h-14 bg-surface-container rounded-xl p-2 border border-outline/5">
                <QrCode size="100%" className={published ? 'opacity-80' : 'opacity-10'} />
              </div>
            </div>

            {/* Proof hash (after publish) */}
            {published && proofHash && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-outline/10 pt-4">
                <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">Proof Hash</p>
                <p className="font-mono text-[8px] text-on-surface-variant/60 break-all">{proofHash}</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Badges */}
        <div className="mt-8 flex items-center justify-center space-x-10 opacity-25 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700">
          {[{ icon: Shield, label: 'AES-GCM Encrypted' }, { icon: Layers, label: 'EAS Native' }, { icon: LinkIcon, label: 'IPFS Pinned' }].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={14} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
