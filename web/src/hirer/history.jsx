import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Receipt,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Users,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import HirerLayout from "../components/HirerLayout";
import { getLoanHistory } from "../services/api";
import { useTranslation } from "react-i18next";

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  approved: {
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    classes: "bg-red-50 text-red-600 border border-red-200",
    dot: "bg-red-500",
    label: "Rejected",
  },
};

// ─── Initials Avatar ───────────────────────────────────────────────────────
function InitialsAvatar({ name, size = 40 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-gradient-to-br from-black to-black/70 flex items-center justify-center flex-shrink-0 shadow-sm"
    >
      <span style={{ fontSize: size * 0.35 }} className="font-black text-white tracking-tight">
        {initials}
      </span>
    </div>
  );
}

// ─── Expandable gig details ────────────────────────────────────────────────
function GigDetails({ gigs }) {
  const [open, setOpen] = useState(false);
  if (!gigs || gigs.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-black transition-colors uppercase tracking-wider"
      >
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {open ? "Hide" : "Show"} {gigs.length} gigs
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {gigs.map((g, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] px-2 py-1 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700 truncate max-w-[160px]">{g.title}</span>
                  <span className="font-black text-slate-900 ml-2 flex-shrink-0">₹{(g.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function HirerHistory() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLoanHistory();
      setRecords(data || []);
    } catch (err) {
      setError(err.message || "Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ── Derived metrics ────────────────────────────────────────────────
  const approved = records.filter((r) => r.status === "approved");
  const rejected = records.filter((r) => r.status === "rejected");

  const totalPaid = approved.reduce((s, r) => s + (r.amount || 0), 0);
  const uniqueWorkers = new Set(records.map((r) => r.worker_user_id)).size;
  const avgAmount = approved.length > 0 ? totalPaid / approved.length : 0;

  const summaryStats = [
    {
      label: t('history.totalPaid'),
      value: `₹${totalPaid.toLocaleString("en-IN")}`,
      sub: `${approved.length} loan${approved.length !== 1 ? "s" : ""} approved`,
      icon: Wallet,
    },
    {
      label: t('hirer.jobsDone'),
      value: records.length,
      sub: "Total applications reviewed",
      icon: Receipt,
    },
    {
      label: t('hirer.aiRanked'),
      value: uniqueWorkers,
      sub: "Distinct applicants",
      icon: Users,
    },
    {
      label: t('lender.avgTrustScore'),
      value: avgAmount > 0 ? `₹${Math.round(avgAmount).toLocaleString("en-IN")}` : "—",
      sub: "Per approved loan",
      icon: TrendingUp,
    },
  ];

  // ── Filter ─────────────────────────────────────────────────────────
  const statuses = ["All", "approved", "rejected"];
  const filtered =
    filter === "All" ? records : records.filter((r) => r.status === filter);

  return (
    <HirerLayout>
      <section className="max-w-6xl mx-auto">

        {/* ─── Page Heading ─── */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[10px] font-black tracking-widest uppercase">
              <Receipt className="w-3 h-3" />
              {t('hirer.paymentHistory')}
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 leading-[1.05]">
                {t('hirer.paymentHistory')}
              </h1>
              <p className="text-base text-slate-500 font-medium max-w-xl leading-relaxed">
                {t('lender.complianceDesc')}
              </p>
            </div>
            <button onClick={fetchHistory} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50 flex-shrink-0">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              {t('common.retry')}
            </button>
          </div>
        </motion.header>

        {/* ─── Summary Stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </p>
                <div className="w-8 h-8 bg-[#f3f3f4] rounded-xl flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-black" />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {stat.sub}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ─── Error Banner ─── */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium mb-6"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* ─── Filter Bar ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-6 flex-wrap"
        >
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === s
                  ? "bg-black text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-black hover:border-black/20"
              }`}
            >
              {s === "All" ? "All" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 font-medium italic">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </motion.div>

        {/* ─── Loading ─── */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-4 text-slate-400">
            <Loader2 size={22} className="animate-spin" />
          <span className="text-sm font-bold uppercase tracking-widest">{t('lender.loadingLoans')}</span>
          </div>
        )}

        {/* ─── History Table ─── */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden mb-16"
          >
            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-8 py-4 bg-[#f9f9fa] border-b border-slate-100">
              {[t('history.transaction'), t('history.date'), t('history.amount'), t('history.status')].map((h) => (
                <p key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {h}
                </p>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {filtered.map((record, idx) => {
                const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.approved;
                const StatusIcon = cfg.icon;
                const gigs = record.public_summary?.gigs || [];
                const trustScore = record.public_summary?.trustScore;
                const actionedDate = record.actioned_at
                  ? new Date(record.actioned_at).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })
                  : new Date(record.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    });

                return (
                  <motion.div
                    key={record._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * idx }}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-8 py-5 items-start hover:bg-[#fafafa] transition-colors group"
                  >
                    {/* Worker */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <InitialsAvatar name={record.worker_name} size={40} />
                        {record.certificate_cid && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-md p-0.5 shadow-sm">
                            <ShieldCheck className="w-2.5 h-2.5 text-black fill-black" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-black truncate">{record.worker_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {trustScore ? (
                            <span className="text-[9px] font-black text-slate-500 flex items-center gap-0.5">
                              <BadgeCheck size={9} className="text-emerald-600" />
                              Trust: {trustScore}/99
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                              <AlertTriangle size={9} className="text-amber-500" />
                              No cert
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Purpose + gig detail toggle */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-black truncate">{record.purpose}</p>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />{record.duration}
                      </p>
                      <GigDetails gigs={gigs} />
                    </div>

                    {/* Actioned date */}
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{actionedDate}</p>

                    {/* Amount */}
                    <div>
                      <p className="text-sm font-black tracking-tight text-black">
                        ₹{Number(record.amount).toLocaleString("en-IN")}
                      </p>
                      {record.certificate_cid && (
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${record.certificate_cid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-0.5 text-[9px] font-black text-slate-400 hover:text-black transition-colors uppercase tracking-wider"
                        >
                          EAS Cert <ExternalLink size={8} />
                        </a>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${cfg.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {record.lender_remark && (
                        <p className="text-[9px] text-slate-400 font-medium italic max-w-[120px] truncate" title={record.lender_remark}>
                          "{record.lender_remark}"
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && !loading && (
              <div className="py-20 text-center">
                <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-base">
                  {filter === "All" ? t('history.noHistory') : `No ${STATUS_CONFIG[filter]?.label || filter} records.`}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {filter === "All"
                    ? "Approve or reject loan applications from the Dashboard to see them here."
                    : "Try changing the filter."}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Footer ─── */}
        <footer className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-start gap-6 opacity-70 hover:opacity-100 transition-opacity">
          <div className="max-w-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">
              Ledger Compliance
            </p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              All payment records are backed by Ethereum Attestation Service (EAS) certificates
              submitted by workers. Data is pulled live from the VAULT backend.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Ledger Version
            </p>
            <p className="text-sm font-black font-mono text-black">v2.1.0-HIR</p>
          </div>
        </footer>
      </section>
    </HirerLayout>
  );
}
