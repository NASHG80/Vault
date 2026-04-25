import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Users,
  BadgeCheck,
  LayoutGrid,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import LenderLayout from "../components/LenderLayout";
import { getPendingLoans, actionLoan } from "../services/api";
import { useTranslation } from "react-i18next";

/* ─── Design tokens ─────────────────────────────────────────────────────────── */
const card =
  "bg-white rounded-3xl border border-[#eeeeef] shadow-[0_4px_24px_rgba(0,0,0,0.04)]";
const labelCls =
  "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block";
const sectionHeadCls =
  "text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 block";

/* ─── Risk derivation ────────────────────────────────────────────────────────── */
function getRisk(trustScore) {
  if (trustScore >= 70) return { label: "Low", color: "text-green-600" };
  if (trustScore >= 40) return { label: "Medium", color: "text-amber-600" };
  return { label: "High", color: "text-red-600" };
}

/* ─── Initials Avatar ────────────────────────────────────────────────────────── */
function InitialsAvatar({ name, size = 56 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-2xl bg-gradient-to-br from-black to-black/70 flex items-center justify-center shadow-lg border border-[#eeeeef] flex-shrink-0"
    >
      <span style={{ fontSize: size * 0.35 }} className="font-black text-white tracking-tight">
        {initials}
      </span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function LenderDashboard() {
  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const fetchLoans = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingLoans();
      setLoanRequests(data || []);
    } catch (err) {
      setError(err.message || "Failed to load loan requests.");
      setLoanRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Compute metrics from loaded loans
  const totalPending = loanRequests.length;
  const totalAmount = loanRequests.reduce((s, l) => s + (l.amount || 0), 0);
  const scores = loanRequests.map((l) => l.public_summary?.trustScore).filter(Boolean);
  const avgTrust = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const withCert = loanRequests.filter((l) => l.certificate_cid).length;

  const metrics = [
    { value: totalPending, label: t('lender.pendingRequests'), icon: Clock },
    { value: `₹${totalAmount.toLocaleString()}`, label: t('lender.totalRequested'), icon: Banknote },
    { value: avgTrust || "—", label: t('lender.avgTrustScore'), icon: ShieldCheck },
    { value: withCert, label: t('lender.withCertificates'), icon: BadgeCheck },
  ];

  const handleAction = async (loanId, action, remark) => {
    try {
      await actionLoan({ loan_id: loanId, action, remark });
      // Remove from the list after action
      setLoanRequests((prev) => prev.filter((l) => l._id !== loanId));
    } catch (err) {
      alert(err.message || "Action failed.");
    }
  };

  return (
    <LenderLayout>
      <main className="pt-10 pb-16 px-10 max-w-[1440px] mx-auto">

        {/* ── Hero Header ── */}
        <section className="mb-10 max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            <span className="px-2.5 py-0.5 bg-[#eeeeef] rounded-full text-black">{t('lender.networkLabel')}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>{t('lender.liveQueue')}</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-5xl font-extrabold tracking-tighter leading-[1.08] mb-4 text-[#1a1c1d]">
            {t('lender.incomingLoans')}
          </motion.h1>
          <p className="text-base text-slate-500 max-w-2xl font-medium leading-relaxed">
            {t('lender.lenderDesc')}
          </p>
        </section>

        {/* ── Metrics Row ── */}
        <section className={`${card} p-6 mb-8 min-h-[120px]`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#eeeeef]">
            {metrics.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-start px-8 py-2 first:pl-4 last:pr-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className={labelCls + " mb-0"}>{label}</span>
                </div>
                <span className="text-3xl font-black tracking-tight text-[#1a1c1d]">
                  {value}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Error Banner ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium mb-8"
          >
            {error}
          </motion.div>
        )}

        {/* ── Loading State ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-4 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="font-bold text-sm uppercase tracking-widest">{t('lender.loadingLoans')}</span>
          </div>
        ) : loanRequests.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {loanRequests.map((loan, idx) => (
              <LoanCard key={loan._id || idx} loan={loan} onAction={handleAction} t={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#eeeeef] mb-16">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-[#1a1c1d]">{t('lender.noLoansPending')}</p>
            <p className="text-sm font-medium text-slate-400 mt-2">{t('lender.allCaughtUp')}</p>
          </div>
        )}

        {/* ── Compliance Footer ── */}
        <footer className="pt-10 border-t border-[#eeeeef] flex flex-col md:flex-row justify-between items-end gap-8 opacity-60 hover:opacity-100 transition-opacity duration-300">
          <div className="max-w-md">
            <span className={sectionHeadCls}>{t('lender.complianceTitle')}</span>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{t('lender.complianceDesc')}</p>
          </div>
          <div className="flex gap-12 text-right">
            <div>
              <span className={labelCls}>{t('lender.queueHealth')}</span>
              <p className="text-sm font-bold text-green-600">{t('lender.queueOptimal')}</p>
            </div>
            <div>
              <span className={labelCls}>{t('lender.portalVersion')}</span>
              <p className="text-sm font-bold font-mono text-[#1a1c1d]">v4.2.0-LND</p>
            </div>
          </div>
        </footer>
      </main>
    </LenderLayout>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function ActionButton({ variant = "outline", children, onClick, disabled }) {
  const base =
    "px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    outline: `${base} border border-[#eeeeef] hover:bg-red-50 hover:border-red-200 hover:text-red-700`,
    solid: `${base} bg-[#1a1c1d] text-white hover:opacity-90 shadow-lg shadow-black/10`,
  };
  return (
    <button className={styles[variant]} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function LoanCard({ loan, onAction, t }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const trustScore = loan.public_summary?.trustScore ?? 0;
  const totalEarnings = loan.public_summary?.totalEarnings ?? 0;
  const platforms = loan.public_summary?.platforms || [];
  const gigs = loan.public_summary?.gigs || [];
  const risk = getRisk(trustScore);

  const APPROVAL_MESSAGE = `Congratulations! Your loan of ₹${Number(loan.amount).toLocaleString()} has been approved. Please visit your nearest branch with the following documents to complete the disbursement:\n\n• Aadhaar Card (Original + Photocopy)\n• PAN Card (Original + Photocopy)\n• 3 Passport-size Photographs\n• Bank Passbook / Cancelled Cheque\n• Income Proof / Salary Slips (Last 3 months)\n• Address Proof (Electricity Bill / Rent Agreement)\n• Loan Application Form (Form 13)\n\nBranch timings: Mon–Sat, 10:00 AM – 4:00 PM.\nRef ID: GT-${loan._id?.slice(-6)?.toUpperCase() || 'XXXX'}`;

  const handleApprove = async () => {
    setActing(true);
    await onAction(loan._id, "approved", APPROVAL_MESSAGE);
    setActing(false);
  };

  const handleReject = async (remark) => {
    setActing(true);
    await onAction(loan._id, "rejected", remark || "Your loan request has been rejected. This may be due to insufficient credit history, incomplete documentation, or unmet eligibility criteria. You may re-apply after 30 days.");
    setActing(false);
    setShowRejectModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-white rounded-3xl border border-[#eeeeef] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-7 flex flex-col justify-between"
      >
        {/* Card header */}
        <div className="flex justify-between items-start mb-7">
          <div className="flex items-center gap-4">
            <InitialsAvatar name={loan.worker_name} size={56} />
            <div>
              <h3 className="text-lg font-extrabold text-[#1a1c1d]">{loan.worker_name}</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                {loan.duration} · {loan.purpose}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('lender.loanAmount')}</span>
            <p className="text-2xl font-black text-[#1a1c1d]">₹{Number(loan.amount).toLocaleString()}</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 p-5 bg-[#f9f9fa] rounded-2xl border border-[#eeeeef] mb-6">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">{t('lender.monthlyEarn')}</span>
            <span className="text-base font-black text-[#1a1c1d]">₹{totalEarnings ? totalEarnings.toLocaleString() : "—"}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">{t('lender.gtScore')}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-[#1a1c1d]">{trustScore || "—"}</span>
              {trustScore > 0 && (<ShieldCheck className="w-4 h-4 text-green-600" fill="currentColor" />)}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">{t('lender.risk')}</span>
            <span className={`text-base font-black ${risk.color}`}>{trustScore > 0 ? risk.label : "—"}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {platforms.length > 0 ? (
            platforms.map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f3f3f4] text-[#1a1c1d] text-[10px] font-black rounded-full border border-[#eeeeef]">
                <span className="w-1 h-1 rounded-full bg-slate-400" />{tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] font-medium text-slate-400 italic">{t('lender.noplatformTags')}</span>
          )}
          {loan.certificate_cid ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-50 text-green-700 text-[10px] font-black rounded-full border border-green-200">
              <BadgeCheck className="w-3 h-3" /> {t('lender.easCert')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-200">
              <AlertTriangle className="w-3 h-3" /> {t('lender.noCert')}
            </span>
          )}
        </div>

        {/* Expandable gig details */}
        {gigs.length > 0 && (
          <div className="mb-6">
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-black transition-colors uppercase tracking-wider">
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? t('lender.hideGigs') : t('lender.showGigs')} ({gigs.length})
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {gigs.map((gig, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#f9f9fa] rounded-xl text-xs">
                        <div>
                          <span className="font-bold">{gig.title}</span>
                          <span className="text-slate-400 ml-2">{gig.platform} · {gig.date}</span>
                        </div>
                        <span className="font-black">${(gig.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Card footer */}
        <div className="flex items-center justify-between pt-5 border-t border-[#eeeeef]">
          {loan.certificate_cid ? (
            <a href={`https://gateway.pinata.cloud/ipfs/${loan.certificate_cid}`} target="_blank" rel="noreferrer"
              className="text-[#1a1c1d] font-semibold text-sm underline underline-offset-4 decoration-slate-300 hover:decoration-black transition-all flex items-center gap-1.5">
              {t('lender.viewDetailedProof')} <ExternalLink size={12} />
            </a>
          ) : (
            <span className="text-sm text-slate-400 font-medium">{t('lender.noProof')}</span>
          )}
          <div className="flex gap-3">
            <ActionButton variant="outline" onClick={() => setShowRejectModal(true)} disabled={acting}>
              {acting ? <Loader2 size={14} className="animate-spin" /> : t('common.reject')}
            </ActionButton>
            <ActionButton variant="solid" onClick={handleApprove} disabled={acting}>
              {acting ? <Loader2 size={14} className="animate-spin" /> : t('common.approve')}
            </ActionButton>
          </div>
        </div>
      </motion.div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <RejectModal
            onClose={() => setShowRejectModal(false)}
            onReject={handleReject}
            workerName={loan.worker_name}
            acting={acting}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Reject Confirmation Modal ─────────────────────────────────────────────── */
function RejectModal({ onClose, onReject, workerName, acting }) {
  const [remark, setRemark] = useState("");
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl border border-[#eeeeef] w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-extrabold text-[#1a1c1d]">{t('lender.rejectLoan')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {t('lender.rejectConfirmText')} <strong>{workerName}</strong>{t('lender.loanApplication')}
        </p>

        <div className="space-y-2 mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('lender.remark')}</label>
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)}
            placeholder={t('lender.remarkPlaceholder')} rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-[#eeeeef] rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
            {t('common.cancel')}
          </button>
          <button onClick={() => onReject(remark)} disabled={acting}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {acting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            {t('common.reject_confirm')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
