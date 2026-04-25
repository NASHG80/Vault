import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  MapPin,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  IndianRupee,
  Calendar,
  Briefcase,
  Send,
  MessageSquare,
  BadgeCheck,
  Zap,
  Truck, Code, Palette, Wrench, Package, Utensils, Stethoscope,
  GraduationCap, Camera, Headphones, ShoppingCart, Hammer, Cpu,
} from "lucide-react";
import WorkerSidebar from "../components/WorkerSidebar";
import { getJobRequests, updateJobRequest, getStoredUser, recordTransaction } from "../services/api";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 6;

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    pending:   { cls: "bg-black/[0.04] text-black/60 border-black/10",   icon: <Clock className="w-3 h-3" /> },
    accepted:  { cls: "bg-black/[0.06] text-black/70 border-black/10",   icon: <CheckCircle2 className="w-3 h-3" /> },
    completed: { cls: "bg-black/[0.08] text-black/80 border-black/10",   icon: <CheckCircle2 className="w-3 h-3" /> },
    rejected:  { cls: "bg-slate-100 text-slate-400 border-slate-200",    icon: <XCircle className="w-3 h-3" /> },
  };
  const { cls, icon } = cfg[status] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
      {icon}{status}
    </span>
  );
}

// ─── Job Type Icon (maps job title → relevant work icon) ───────────────────────

const JOB_ICON_MAP = [
  { keywords: ["deliver", "courier", "dispatch", "driver", "transport", "fleet", "logistics"], icon: Truck },
  { keywords: ["code", "develop", "react", "node", "python", "software", "web", "app", "frontend", "backend", "fullstack"], icon: Code },
  { keywords: ["design", "figma", "ui", "ux", "graphic", "creative", "logo", "brand"], icon: Palette },
  { keywords: ["repair", "fix", "maintain", "plumb", "electr", "mechanic", "install"], icon: Wrench },
  { keywords: ["warehouse", "inventory", "storage", "pack", "fulfi", "stock"], icon: Package },
  { keywords: ["food", "cook", "chef", "cater", "restaurant", "kitchen"], icon: Utensils },
  { keywords: ["health", "medical", "nurse", "doctor", "care", "pharma"], icon: Stethoscope },
  { keywords: ["teach", "tutor", "train", "mentor", "education", "course"], icon: GraduationCap },
  { keywords: ["photo", "video", "camera", "shoot", "film", "media", "content"], icon: Camera },
  { keywords: ["support", "call", "customer", "helpdesk", "service"], icon: Headphones },
  { keywords: ["sale", "shop", "retail", "market", "ecommerce", "vendor"], icon: ShoppingCart },
  { keywords: ["construct", "build", "civil", "architect", "labour", "labor"], icon: Hammer },
  { keywords: ["data", "ai", "ml", "cloud", "devops", "kubernetes", "docker", "aws"], icon: Cpu },
];

function JobIcon({ jobTitle, size = 44 }) {
  const title = (jobTitle || "").toLowerCase();
  const matched = JOB_ICON_MAP.find(({ keywords }) =>
    keywords.some((kw) => title.includes(kw))
  );
  const Icon = matched?.icon || Briefcase;

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-black/[0.04] border border-black/5 flex items-center justify-center flex-shrink-0"
    >
      <Icon className="w-5 h-5 text-black/50" strokeWidth={1.8} />
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onAction }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(null);

  const handleAction = async (newStatus) => {
    setLoading(newStatus);
    await onAction(job._id, newStatus, job);
    setLoading(null);
  };

  const isPending  = job.status === "pending";
  const isAccepted = job.status === "accepted";
  const isDone     = job.status === "completed";
  const isRejected = job.status === "rejected";

  // Parse reward — strip non-numeric (₹, commas, spaces)
  const rewardNum = job.reward
    ? parseFloat(String(job.reward).replace(/[^0-9.]/g, "")) || null
    : null;
  const rewardDisplay = rewardNum
    ? `₹${rewardNum.toLocaleString("en-IN")}`
    : job.reward || null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-white rounded-2xl border overflow-hidden transition-all ${
        isDone
          ? "border-black/10 shadow-sm"
          : isRejected
          ? "border-slate-100 opacity-60"
          : job.urgent
          ? "border-l-4 border-l-black border-slate-100 shadow-sm"
          : "border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px"
      }`}
    >
      {/* Top color strip for urgent */}
      {job.urgent && (
        <div className="bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-1.5 flex items-center gap-1.5">
          <Zap className="w-3 h-3" /> {t("jobRequest.urgent")} — Immediate Start
        </div>
      )}

      <div className="p-5">
        {/* ── Row 1: Icon + Title + Status + Money ── */}
        <div className="flex items-start gap-3 mb-3">
          <JobIcon jobTitle={job.job_title} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h3 className="text-base font-black tracking-tight leading-snug truncate">
                {job.job_title || "Untitled Job"}
              </h3>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3" /> From employer
            </p>
          </div>

          {/* Money — most prominent element */}
          {rewardDisplay && (
            <div className={`flex-shrink-0 text-right ml-2 ${isDone ? "opacity-50" : ""}`}>
              <p className="text-2xl font-black tracking-tight leading-none text-black">
                {rewardDisplay}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Budget
              </p>
            </div>
          )}
        </div>

        {/* ── Row 2: Meta chips ── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {job.location && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
          )}
          {job.duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <Clock className="w-3 h-3" /> {job.duration}
            </span>
          )}
          {job.skills?.slice(0, 3).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-[11px] font-bold bg-black/5 text-black px-2.5 py-1 rounded-lg">
              {s}
            </span>
          ))}
          {job.skills?.length > 3 && (
            <span className="text-[11px] font-bold text-slate-400">
              +{job.skills.length - 3} more
            </span>
          )}
        </div>

        {/* ── Row 3: Message ── */}
        {job.message && (
          <div className="flex items-start gap-2 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-slate-600 font-medium leading-relaxed line-clamp-2">
              {job.message}
            </p>
          </div>
        )}

        {/* ── Row 4: Completed payment badge ── */}
        {isDone && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-black/[0.03] rounded-xl border border-black/5">
            <BadgeCheck className="w-4 h-4 text-black/60 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] font-black text-black/70 uppercase tracking-wider">
                Job Completed · Payment Recorded
              </p>
              <p className="text-[10px] text-black/50 font-medium mt-0.5">
                {rewardDisplay ? `${rewardDisplay} added to External (Verified) tab` : "Earnings recorded in transactions"}
              </p>
            </div>
          </div>
        )}

        {/* ── Row 5: Action buttons ── */}
        {(isPending || isAccepted) && (
          <div className="flex gap-2 pt-3 border-t border-slate-50">
            {isPending && (
              <>
                <button
                  id={`accept-btn-${job._id}`}
                  onClick={() => handleAction("accepted")}
                  disabled={!!loading}
                  className="flex-1 bg-black text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "accepted" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {t("jobRequest.accept")}
                </button>
                <button
                  id={`reject-btn-${job._id}`}
                  onClick={() => handleAction("rejected")}
                  disabled={!!loading}
                  className="px-5 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "rejected" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  {t("jobRequest.reject")}
                </button>
              </>
            )}

            {isAccepted && (
              <button
                id={`complete-btn-${job._id}`}
                onClick={() => handleAction("completed")}
                disabled={!!loading}
                className="flex-1 bg-black text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading === "completed" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording payment...</>
                ) : (
                  <><BadgeCheck className="w-3.5 h-3.5" /> {t("jobRequest.markComplete")}</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────
function FilterTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
        active
          ? "bg-black text-white shadow-sm"
          : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
      }`}
    >
      {label}
      {count != null && (
        <span className={`text-[10px] font-black ${active ? "text-white/70" : "text-slate-400"}`}>
          ({count})
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JobRequest() {
  const { t } = useTranslation();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("all");
  const [page,    setPage]    = useState(0);

  const currentUser = getStoredUser();

  const fetchJobs = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Not logged in. Please sign in first.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getJobRequests(currentUser.id);
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not fetch job requests.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Accept / Reject / Complete ────────────────────────────────────────────
  const handleAction = async (requestId, newStatus, job) => {
    try {
      await updateJobRequest({ request_id: requestId, status: newStatus });

      // When job is marked complete → record a transaction so it appears
      // in the External (Verified) tab of Transactions
      if (newStatus === "completed" && job) {
        const rewardNum = job.reward
          ? parseFloat(String(job.reward).replace(/[^0-9.]/g, "")) || 0
          : 0;

        try {
          await recordTransaction({
            cid: `job-${requestId}`,          // sentinel CID — no IPFS upload needed
            wallet_address: currentUser?.id || "unknown",
            tx_type: "external",
            // Pass extra metadata for display — backend stores it
            meta: {
              title: job.job_title || "Job Payment",
              platform: `Hirer · ${job.hirer_id?.slice(0, 8) || ""}`,
              amount: String(rewardNum),
              date: new Date().toISOString().split("T")[0],
              category: "inspection",
              isZk: false,
              source: "job_completion",
              job_id: requestId,
            },
          });
        } catch (txErr) {
          // Non-fatal — job still marks complete even if tx recording fails
          console.warn("[VAULT] Could not record job transaction:", txErr.message);
        }
      }

      setJobs((prev) =>
        prev.map((j) => (j._id === requestId ? { ...j, status: newStatus } : j))
      );
    } catch (err) {
      alert(err.message || "Action failed. Please try again.");
    }
  };

  const filtered   = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const counts = ["pending", "accepted", "completed", "rejected"].reduce((acc, s) => {
    acc[s] = jobs.filter((j) => j.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f9f9fa] text-[#1a1c1d] flex flex-col font-sans">
      <WorkerSidebar />

      <main className="ml-0 md:ml-72 pt-16 pb-12 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">

          {/* ── Page Header ── */}
          <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-black tracking-tight mb-1"
              >
                {t("jobRequest.title")}
              </motion.h2>
              <p className="text-sm text-slate-500 font-medium">
                {loading
                  ? t("jobRequest.loadingMsg")
                  : counts.pending > 0
                  ? `${counts.pending} pending · ${counts.accepted} active`
                  : "No pending offers right now"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchJobs}
                className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              </button>
              <div className="text-right">
                <p className="text-3xl font-black">{jobs.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
              </div>
            </div>
          </section>

          {/* ── Filter Bar ── */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <FilterTab
              label="All"
              count={jobs.length}
              active={filter === "all"}
              onClick={() => { setFilter("all"); setPage(0); }}
            />
            {["pending", "accepted", "completed", "rejected"].map((f) => (
              <FilterTab
                key={f}
                label={f}
                count={counts[f]}
                active={filter === f}
                onClick={() => { setFilter(f); setPage(0); }}
              />
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-5 text-red-700 text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* ── Skeleton ── */}
          {loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    </div>
                    <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 w-20 bg-slate-100 rounded-lg" />
                    <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                  </div>
                  <div className="h-14 bg-slate-50 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <Send className="w-10 h-10 mx-auto mb-4 opacity-25" />
              <p className="text-base font-bold">{t("jobRequest.noRequests")}</p>
              <p className="text-sm mt-1 opacity-70">{t("jobRequest.noRequestsDesc")}</p>
            </div>
          )}

          {/* ── Job Grid ── */}
          {!loading && !error && filtered.length > 0 && (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginated.map((job) => (
                  <JobCard key={job._id} job={job} onAction={handleAction} />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* ── Pagination ── */}
          {!loading && filtered.length > PAGE_SIZE && (
            <footer className="mt-10 flex items-center justify-between text-slate-400">
              <p className="text-xs font-medium">
                {t("jobRequest.showing", {
                  from: Math.min(page * PAGE_SIZE + 1, filtered.length),
                  to: Math.min((page + 1) * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold">{page + 1} / {Math.max(totalPages, 1)}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}
