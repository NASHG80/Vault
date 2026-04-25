import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt, FileText, ShieldCheck, TrendingUp,
  Package, Truck, ChevronRight, Verified,
  Star, Layers, ExternalLink, ArrowLeftRight, Car,
  Utensils, MapPin, Phone, Briefcase, AlertTriangle,
  Clock, CheckCircle2, XCircle, User, Mail, Banknote,
  X, Loader2, IndianRupee,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { getMyPublishedCertificate, getWorkerIDCardByUserId, getMe, getStoredUser, applyForLoan, getMyLoans } from '../services/api';
import DigitalIDCard, { IDCardSkeleton } from '../components/DigitalIDCard';

const BASE_URL = window.location.origin;

// ─── Icon map ──────────────────────────────────────────────────────────
const ICON_MAP = {
  logistics: Truck, rideshare: Car, delivery: Package,
  food: Utensils, inspection: ShieldCheck, default: ArrowLeftRight,
};

// ─── KYC status config ──────────────────────────────────────────────────

// ─── Sub-components ────────────────────────────────────────────────────
const ActionCard = ({ icon: Icon, title, description, to }) => (
  <Link to={to} className="group bg-white p-6 rounded-2xl border border-outline/10 hover:shadow-xl hover:shadow-black/5 hover:border-outline/20 transition-all duration-300">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 border border-outline/10 group-hover:bg-black group-hover:text-white transition-all duration-300">
      <Icon size={24} />
    </div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
  </Link>
);

// ─── PREMIUM Worker ID Card is now in DigitalIDCard ─────────────────

// ─── Published Certificate Card ────────────────────────────────────────
function PublishedCertificateCard({ cert }) {
  const summary = cert.public_summary;
  const gigs = summary?.gigs || [];
  const platforms = summary?.platforms || cert.platform_tags || [];

  return (
    <div className="group relative h-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-outline/5 shadow-sm overflow-hidden relative h-full flex flex-col"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-black via-black/60 to-transparent flex-shrink-0" />
        <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
          <Verified size={200} />
        </div>

        <div className="p-7 space-y-5 relative z-10 flex-1 flex flex-col">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black tracking-[0.3em] uppercase text-on-surface-variant">VAULT Official Attestation</p>
              <p className="font-mono text-[9px] text-on-surface-variant/40 mt-0.5">{summary?.serial || 'VN-XXXX'}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-xl shadow-sm">
              <Star size={11} className="fill-black text-black" />
              <span className="text-[9px] font-black uppercase tracking-wider">TRUST: {summary?.trustScore ?? '—'}/99</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Total Earnings</p>
              <p className="text-3xl font-black tracking-tighter">
                ₹{(summary?.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Verified Gigs</p>
              <p className="text-3xl font-black tracking-tighter">{summary?.totalGigs ?? gigs.length}</p>
            </div>
          </div>

          {platforms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((p) => (
                <span key={p} className="px-2.5 py-1 bg-surface-container-low border border-outline/10 rounded-full text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                  {p}
                </span>
              ))}
            </div>
          )}

          {gigs.length > 0 && (
            <div className="border-t border-outline/10 pt-4 space-y-2 flex-1 overflow-y-auto max-h-40">
              {gigs.map((gig, i) => {
                const Icon = ICON_MAP[gig.category] || ICON_MAP.default;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                      <Icon size={12} className="text-on-surface-variant" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{gig.title}</p>
                      <p className="text-[9px] text-on-surface-variant">{gig.platform} · {gig.date}</p>
                    </div>
                    <p className="text-xs font-black">₹{(gig.amount || 0).toFixed(2)}</p>
                    {gig.isZk && <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">zkTLS</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center border-t border-outline/10 pt-4 mt-auto">
            <div>
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Issued</p>
              <p className="text-xs font-black italic">
                {new Date(summary?.issueDate || cert.published_at).toLocaleDateString('en-US', {
                  day: '2-digit', month: 'short', year: 'numeric'
                }).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {cert.certificate_cid && (
                <a href={`https://gateway.pinata.cloud/ipfs/${cert.certificate_cid}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[9px] font-black text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider">
                  IPFS <ExternalLink size={9} />
                </a>
              )}
              <Link to="/worker/certificates"
                className="flex items-center gap-1 text-[9px] font-black bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-all uppercase tracking-wider">
                Update <ChevronRight size={9} />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-3 flex items-center justify-center gap-8 opacity-20 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
        {[{ icon: ShieldCheck, label: 'Encrypted' }, { icon: Layers, label: 'EAS Native' }, { icon: Verified, label: 'On-Chain' }].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon size={11} /><span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── No certificate placeholder ────────────────────────────────────────
function NoCertificatePlaceholder() {
  return (
    <Link to="/worker/certificates"
      className="group flex flex-col items-center justify-center text-center border-2 border-dashed border-outline/20 rounded-2xl p-10 hover:border-black/30 hover:bg-surface-container-low transition-all h-full min-h-[280px]">
      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-all">
        <Verified size={24} className="opacity-30 group-hover:opacity-100" />
      </div>
      <p className="text-sm font-black mb-1">No Certificate Published</p>
      <p className="text-xs text-on-surface-variant font-medium max-w-xs">
        Select your transactions and publish to display your credential here.
      </p>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-primary">
        Generate Certificate <ChevronRight size={14} />
      </div>
    </Link>
  );
}

// ─── Loan Application Modal ───────────────────────────────────────────
function LoanApplicationModal({ open, onClose, hasCert, t }) {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('6 months');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError('Enter a valid amount.'); return; }
    if (!purpose.trim()) { setError('Purpose is required.'); return; }
    setSubmitting(true); setError('');
    try {
      await applyForLoan({ amount: num, duration, purpose: purpose.trim() });
      setSuccess(true);
      setTimeout(() => { onClose(true); setSuccess(false); setAmount(''); setPurpose(''); }, 1500);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={() => onClose(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl border border-outline/10 w-full max-w-lg p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => onClose(false)} className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
              <Banknote size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{t('dashboard.applyLoan')}</h2>
              <p className="text-xs text-on-surface-variant">{t('dashboard.certAttachedAuto')}</p>
            </div>
          </div>

          {!hasCert && (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5 text-amber-700 text-xs font-semibold">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {t('dashboard.noCertWarning')}
              <Link to="/worker/certificates" className="underline font-black ml-1">{t('dashboard.generateOne')}</Link>
            </div>
          )}

          {success ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-10">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-lg font-black">{t('dashboard.appSubmitted')}</p>
              <p className="text-sm text-on-surface-variant mt-1">{t('dashboard.appSubmittedDesc')}</p>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">{error}</div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">{t('dashboard.loanAmount')}</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <input
                    id="loan-amount"
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Repayment Duration</label>
                <select
                  id="loan-duration"
                  value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all bg-white"
                >
                  {['3 months', '6 months', '9 months', '12 months', '18 months', '24 months'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Purpose</label>
                <textarea
                  id="loan-purpose"
                  value={purpose} onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Why do you need this loan?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all resize-none"
                />
              </div>

              <button
                id="loan-submit-btn"
                onClick={handleSubmit} disabled={submitting}
                className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit Application →'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── My Loan Status Card ──────────────────────────────────────────────
function MyLoanCard({ loan }) {
  const statusConf = {
    pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700', border: 'border-amber-200', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700', border: 'border-green-200', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',     border: 'border-red-200',   icon: XCircle },
  };
  const s = statusConf[loan.status] || statusConf.pending;
  const SIcon = s.icon;
  const hasMessage = loan.lender_remark && loan.lender_remark.trim();

  return (
    <div className="py-4 border-b border-outline/5 last:border-0 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{loan.purpose}</p>
          <p className="text-[10px] text-on-surface-variant">{loan.duration} · {new Date(loan.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black">₹{Number(loan.amount).toLocaleString()}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${s.color}`}>
            <SIcon size={10} />{s.label}
          </span>
        </div>
      </div>

      {/* Lender message */}
      {loan.status === 'pending' && (
        <div className="flex items-center gap-2 text-[10px] text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
          <Clock size={12} className="flex-shrink-0 animate-pulse" />
          <span>Awaiting review from lender...</span>
        </div>
      )}

      {loan.status === 'approved' && hasMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 size={14} className="flex-shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider">Lender Message</span>
          </div>
          <p className="text-xs text-green-800 font-medium leading-relaxed whitespace-pre-line">
            {loan.lender_remark}
          </p>
        </div>
      )}

      {loan.status === 'rejected' && hasMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle size={14} className="flex-shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider">Lender Message</span>
          </div>
          <p className="text-xs text-red-800 font-medium leading-relaxed whitespace-pre-line">
            {loan.lender_remark}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [publishedCert, setPublishedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certLoading, setCertLoading] = useState(true);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [myLoans, setMyLoans] = useState([]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);

    const userId = storedUser?.id;

    Promise.all([
      getMe().then((u) => {
        setUser(u);
        return u;
      }).catch(() => storedUser),

      userId
        ? getWorkerIDCardByUserId(userId).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([_u, w]) => {
        setWorker(w);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getMyPublishedCertificate()
      .then((cert) => setPublishedCert(cert))
      .catch(() => setPublishedCert(null))
      .finally(() => setCertLoading(false));

    // Load my loan applications
    getMyLoans().then(setMyLoans).catch(() => setMyLoans([]));
  }, []);


  const refreshLoans = () => getMyLoans().then(setMyLoans).catch(() => {});

  const trustScore = publishedCert?.public_summary?.trustScore ?? worker?.trust_score ?? null;

  return (
    <div className="space-y-12 pb-20">

      {/* ── ID Card + Certificate side-by-side ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Worker ID Card */}
        {loading ? (
          <IDCardSkeleton />
        ) : (
          <DigitalIDCard user={user} worker={worker} trustScore={trustScore} variant="worker-dashboard" />
        )}

        {/* Published Certificate */}
        <div className="h-full">
          {certLoading ? (
            <div className="flex items-center justify-center min-h-[280px] text-on-surface-variant/30">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-outline/20 border-t-black rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading certificate...</p>
              </div>
            </div>
          ) : publishedCert ? (
            <PublishedCertificateCard cert={publishedCert} />
          ) : (
            <NoCertificatePlaceholder />
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ActionCard icon={Receipt} title={t('dashboard.viewTransactions')} description={t('dashboard.viewTransactionsDesc')} to="/worker/transactions" />
        <ActionCard icon={FileText} title={t('dashboard.generateCert')} description={t('dashboard.generateCertDesc')} to="/worker/certificates" />
        <ActionCard icon={ShieldCheck} title={t('dashboard.verifyEarnings')} description={t('dashboard.verifyEarningsDesc')} to="/worker/transactions" />
        {/* Apply for Loan — special card */}
        <button
          onClick={() => setLoanModalOpen(true)}
          className="group bg-white text-black p-6 rounded-2xl border border-outline/10 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 text-left"
        >
          <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center mb-6 border border-outline/10 group-hover:bg-black group-hover:text-white transition-all duration-300">
            <Banknote size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2">{t('dashboard.applyLoan')}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">{t('dashboard.applyLoanDesc')}</p>
        </button>
      </section>

      {/* ── Apply for Loan CTA ── */}
      <section>
        <motion.button
          id="apply-loan-btn"
          onClick={() => setLoanModalOpen(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full group relative overflow-hidden bg-black text-white rounded-3xl p-8 flex items-center justify-between shadow-xl shadow-black/10 border border-white/5 hover:opacity-95 transition-all duration-300"
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <Banknote size={26} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black tracking-tight">{t('dashboard.applyLoanBtn')}</h3>
              <p className="text-sm text-white/60 font-medium mt-0.5">{t('dashboard.applyLoanBtnDesc')}</p>
            </div>
          </div>
          <ChevronRight size={24} className="relative z-10 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </motion.button>
      </section>

      <LoanApplicationModal
        open={loanModalOpen}
        onClose={(submitted) => { setLoanModalOpen(false); if (submitted) refreshLoans(); }}
        hasCert={!!publishedCert}
        t={t}
      />

      {/* ── My Loan Applications (horizontal scroll) ── */}
      {myLoans.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black tracking-[0.3em] uppercase text-black/40">My Loan Applications</h3>
            <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest bg-black/5 px-2 py-1 rounded-md">{myLoans.length} Application{myLoans.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {myLoans.map((loan) => {
              const statusConf = {
                pending:  { label: 'Pending',  dot: 'bg-amber-400', iconColor: 'text-amber-500' },
                approved: { label: 'Approved', dot: 'bg-green-500', iconColor: 'text-green-500', icon: CheckCircle2 },
                rejected: { label: 'Rejected', dot: 'bg-red-500',   iconColor: 'text-red-500',   icon: XCircle },
              };
              const s = statusConf[loan.status] || statusConf.pending;
              const hasMessage = loan.lender_remark && loan.lender_remark.trim();
              const MsgIcon = s.icon;

              return (
                <div
                  key={loan._id}
                  className="flex-shrink-0 w-[360px] snap-center lg:snap-start bg-white rounded-[28px] border border-black/5 shadow-xl shadow-black/[0.03] p-7 flex flex-col group hover:shadow-2xl hover:shadow-black/[0.05] hover:border-black/10 transition-all duration-500"
                >
                  {/* Status badge & top icon */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black border border-black/5">
                      <Banknote size={20} className="opacity-80" />
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/5 text-black border border-black/5">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>

                  {/* Body / Amount */}
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-1.5">{loan.duration}</p>
                    <p className="text-4xl font-black tracking-tighter text-black mb-1">₹{Number(loan.amount).toLocaleString()}</p>
                    <p className="text-sm font-bold text-black/80 truncate">{loan.purpose}</p>
                  </div>

                  {/* Dynamic Message Area */}
                  <div className="mt-auto pt-5 border-t border-black/5">
                    {loan.status === 'pending' ? (
                      <div>
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                          <Clock size={12} className={`${s.iconColor} animate-pulse`} /> Under Review
                        </p>
                        <p className="text-xs text-black/60 font-medium leading-relaxed">
                          The lender is reviewing your gig history and verified certificate.
                        </p>
                      </div>
                    ) : hasMessage ? (
                      <div>
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                          <MsgIcon size={12} className={s.iconColor} /> Lender Message
                        </p>
                        <p className="text-xs text-black/70 font-medium leading-[1.6] line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                          {loan.lender_remark}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Absolute subtle footer data */}
                  <div className="absolute top-8 left-24 right-32 flex justify-end pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest">
                      {new Date(loan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}




    </div>
  );
}