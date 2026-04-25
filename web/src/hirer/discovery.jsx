import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Search,
  ShieldCheck,
  Eye,
  Zap,
  MapPin,
  X,
  Send,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import HirerLayout from "../components/HirerLayout";
import { searchWorkers, sendJobRequest, getStoredUser, getHirerHistory } from "../services/api";
import DigitalIDCard from "../components/DigitalIDCard";
import { useTranslation } from "react-i18next";

// ── Skill categories for filter panel ────────────────────────────────────────
const SKILL_GROUPS = [
  {
    label: "Engineering",
    skills: ["React", "Node.js", "Python", "TypeScript", "Docker", "Kubernetes", "AWS", "FastAPI"],
  },
  {
    label: "Data & AI",
    skills: ["PyTorch", "TensorFlow", "Pandas", "BigQuery", "Scikit-learn"],
  },
  {
    label: "Design & UX",
    skills: ["Figma", "UI Design", "User Research", "Prototyping"],
  },
  {
    label: "Ops & Logistics",
    skills: ["Fleet Management", "Supply Chain", "DevOps", "Terraform"],
  },
  {
    label: "Web3",
    skills: ["Solidity", "Web3.js", "EVM", "Blockchain"],
  },
];

const ALL_SKILLS = SKILL_GROUPS.flatMap((g) => g.skills);

const SUGGESTIONS = [
  "Senior React developer for a 2-month contract",
  "Data scientist with PyTorch experience, remote",
  "Cloud architect for AWS migration project",
  "Kubernetes expert available this week",
  "Logistics expert in Mumbai",
];

// ── Initials Avatar ───────────────────────────────────────────────────────────
function InitialsAvatar({ name, size = 64 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center flex-shrink-0 shadow-md"
    >
      <span style={{ fontSize: size * 0.35 }} className="font-black text-white tracking-tight">
        {initials}
      </span>
    </div>
  );
}

// ── View Profile Modal (Shows DigitalIDCard directly) ────────────────────────
function ProfileModal({ worker, onClose, onHire }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] relative flex flex-col gap-4"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Digital ID Card */}
        <DigitalIDCard
          worker={worker}
          presetUserId={worker.worker_id}
          variant="public"
        />

        {/* CTA buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => { onClose(); onHire(worker); }}
            disabled={!worker.available}
            className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
          >
            <Send className="w-4 h-4" /> {t('hirer.sendJobRequest')}
          </button>
        </div>

        {!worker.available && (
          <p className="text-center text-xs text-white/60 font-medium -mt-2">
            {t('hirer.workerNotAvailable')}
          </p>
        )}
      </motion.div>
    </div>
  );
}


// ── Hire-Now Modal ────────────────────────────────────────────────────────────
function HireModal({ worker, onClose, hirerId, onSent }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    job_title: "",
    location:  worker?.location || "",
    duration:  "",
    reward:    "",
    message:   "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSend = async () => {
    if (!form.job_title.trim()) { setError(t('hirer.enterJobTitle')); return; }
    setSending(true); setError("");
    try {
      await sendJobRequest({ hirer_id: hirerId, worker_id: worker.worker_id, skills: worker.skills || [], ...form });
      setSent(true);
      if (onSent) onSent(worker.worker_id);
    } catch (err) {
      setError(err.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
      >
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>

        {sent ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('hirer.requestSent')}</h3>
            <p className="text-slate-500 text-sm mb-6">
              {t('hirer.requestSentDesc', { name: worker.name })}
            </p>
            <button onClick={onClose} className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">
              {t('common.done')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <InitialsAvatar name={worker.name} size={48} />
              <div>
                <h3 className="text-lg font-bold">{worker.name}</h3>
                <p className="text-sm text-slate-500">{worker.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: t('hirer.jobTitle'),  name: "job_title", placeholder: t('hirer.jobPlaceholder') },
                { label: t('hirer.location'),  name: "location",  placeholder: t('hirer.locationPlaceholder') },
                { label: t('hirer.duration'),  name: "duration",  placeholder: t('hirer.durationPlaceholder') },
                { label: t('hirer.budget'),    name: "reward",    placeholder: t('hirer.budgetPlaceholder') },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    name={name} value={form[name]} onChange={handleChange} placeholder={placeholder}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('hirer.message')}</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                  placeholder={t('hirer.messagePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-4 text-red-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button onClick={handleSend} disabled={sending}
              className="mt-6 w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('hirer.sending')}</> : <><Send className="w-4 h-4" /> {t('hirer.sendJobRequest')}</>}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Discovery Page ────────────────────────────────────────────────────────────
export default function Discovery() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isSearching,  setIsSearching]  = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [results,      setResults]      = useState([]);
  const [error,        setError]        = useState("");
  const [hireTarget,   setHireTarget]   = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  const [sentRequests, setSentRequests]  = useState(new Set()); // worker_ids with sent requests

  // Skill chip filter
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters,    setShowFilters]    = useState(false);

  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id;

  // ── Sync active requests from DB ─────────────────────────────────────
  const syncActiveRequests = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const hirerHistory = await getHirerHistory(currentUserId);
      const activeIds = new Set(
        (Array.isArray(hirerHistory) ? hirerHistory : [])
          .filter((r) => r.status === "pending" || r.status === "accepted")
          .map((r) => r.worker_id)
      );
      setSentRequests(activeIds);
    } catch {
      // silently ignore — stale UI is better than an error
    }
  }, [currentUserId]);

  // Load active requests on mount
  useEffect(() => {
    syncActiveRequests();
  }, [syncActiveRequests]);

  // Auto-refresh every 30s so the UI stays live
  useEffect(() => {
    const id = setInterval(syncActiveRequests, 30_000);
    return () => clearInterval(id);
  }, [syncActiveRequests]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSearch = useCallback(async () => {
    const hasQuery = query.trim();
    const hasSkills = selectedSkills.length > 0;
    if (!hasQuery && !hasSkills) return;
    setIsSearching(true); setError("");
    try {
      const payload = hasQuery
        ? { prompt: query, skills: selectedSkills.length > 0 ? selectedSkills : undefined }
        : { skills: selectedSkills };

      // Run search + hirer history in parallel
      const [data, hirerHistory] = await Promise.all([
        searchWorkers(payload),
        currentUserId ? getHirerHistory(currentUserId).catch(() => []) : Promise.resolve([]),
      ]);

      setResults(Array.isArray(data) ? data : []);
      setHasSearched(true);

      // Rebuild sentRequests from live DB data
      const activeIds = new Set(
        (Array.isArray(hirerHistory) ? hirerHistory : [])
          .filter((r) => r.status === "pending" || r.status === "accepted")
          .map((r) => r.worker_id)
      );
      setSentRequests(activeIds);
    } catch (err) {
      setError(err.message || "Search failed. Is the backend running?");
    } finally {
      setIsSearching(false);
    }
  }, [query, selectedSkills, currentUserId]);

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const clearSearch = () => {
    setQuery(""); setHasSearched(false); setResults([]); setError(""); setSelectedSkills([]);
  };

  const canSearch = query.trim() || selectedSkills.length > 0;

  return (
    <HirerLayout>
      <section className="max-w-6xl mx-auto px-8 pt-8 pb-16">

        {/* ─── Page Hero ─── */}
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[10px] font-black tracking-widest uppercase">
              <Sparkles className="w-3 h-3" /> {t('hirer.aiPowered')}
            </span>
            {hasSearched && !isSearching && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                · {results.length} {t('hirer.workersMatched')}
              </span>
            )}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-3 leading-[1.05]">
            {t('hirer.findTalent')}
          </h1>
          <p className="text-base text-slate-500 font-medium max-w-xl leading-relaxed">
            {t('hirer.findTalentDesc')}
          </p>
        </motion.header>

        {/* ─── Search Bar ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4">
          <div className="relative flex items-center bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
            <Sparkles className="w-5 h-5 text-slate-300 absolute left-6 flex-shrink-0 pointer-events-none" />
            <input
              id="discovery-search"
              type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Find me a Kubernetes expert for a 3-month remote contract..."
              className="flex-1 h-16 pl-14 pr-6 text-base font-medium text-black placeholder:text-slate-300 bg-transparent focus:outline-none"
            />
            {(query || selectedSkills.length > 0) && (
              <button onClick={clearSearch} className="p-2 mr-2 text-slate-300 hover:text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`m-1 p-3 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                showFilters || selectedSkills.length > 0
                  ? "bg-black text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {selectedSkills.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center flex-shrink-0">
                  {selectedSkills.length}
                </span>
              )}
            </button>
            <button
              id="discovery-search-btn"
              onClick={handleSearch} disabled={!canSearch || isSearching}
              className="m-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2 min-w-[120px] justify-center">
              {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('hirer.matching')}</> : <><Search className="w-4 h-4" /> {t('common.search')}</>}
            </button>
          </div>

          {/* Skill filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  {SKILL_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.skills.map((skill) => {
                          const active = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              onClick={() => toggleSkill(skill)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                active
                                  ? "bg-black text-white"
                                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-black/20 hover:text-black"
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {selectedSkills.length > 0 && (
                    <button onClick={() => setSelectedSkills([])}
                      className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors underline underline-offset-4 mt-1">
                      {t('hirer.clearFilters')}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected skill chips */}
          {!showFilters && selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedSkills.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSkill(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-full text-xs font-bold hover:opacity-80 transition-all"
                >
                  {s} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {/* Suggestion chips — only when no search done */}
          {!hasSearched && selectedSkills.length === 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-full text-xs font-medium text-slate-500 hover:text-black hover:border-black/20 transition-all shadow-sm"
                >
                  <Zap className="w-3 h-3 text-slate-300" /> {s}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── Error Banner ─── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-6 text-red-700 text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Result label ─── */}
        <AnimatePresence>
          {hasSearched && !error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-[10px] font-black tracking-widest uppercase">
                <Sparkles className="w-3 h-3" /> {t('hirer.aiRanked')}
              </span>
                {query && <span className="text-sm font-medium text-slate-400">for &ldquo;{query}&rdquo;</span>}
              </div>
              <button onClick={clearSearch} className="text-xs font-bold text-slate-400 hover:text-black transition-colors underline underline-offset-4">
                {t('hirer.clearSearch')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Skeleton Loader ─── */}
        <AnimatePresence>
          {isSearching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 border border-slate-100 animate-pulse h-72">
                  <div className="flex gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full" />
                    <div className="h-3 bg-slate-100 rounded-full w-4/5" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Empty State ─── */}
        {hasSearched && !isSearching && results.length === 0 && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">{t('hirer.noWorkersFound')}</p>
            <p className="text-sm mt-1">{t('hirer.noWorkersFoundDesc')}</p>
          </motion.div>
        )}

        {/* ─── Worker Cards ─── */}
        {!isSearching && results.length > 0 && (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {results.map((worker, idx) => (
              <TalentCard
                key={worker.worker_id || idx}
                worker={worker}
                rank={hasSearched ? idx + 1 : null}
                onHire={() => setHireTarget(worker)}
                onViewProfile={() => setProfileTarget(worker)}
                requestSent={sentRequests.has(worker.worker_id)}
              />
            ))}
          </motion.div>
        )}
      </section>

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {profileTarget && (
          <ProfileModal
            worker={profileTarget}
            onClose={() => setProfileTarget(null)}
            onHire={(w) => setHireTarget(w)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hireTarget && (
          <HireModal
            worker={hireTarget}
            hirerId={currentUser?.id || ""}
            onClose={() => setHireTarget(null)}
            onSent={(workerId) => setSentRequests((prev) => new Set([...prev, workerId]))}
          />
        )}
      </AnimatePresence>
    </HirerLayout>
  );
}

// ── Talent Card ───────────────────────────────────────────────────────────────
function TalentCard({ worker, rank, onHire, onViewProfile, requestSent }) {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-white p-7 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col group relative overflow-hidden"
    >
      {/* AI Match badge */}
      {rank !== null && worker.match !== undefined && (
        <div className="absolute top-5 right-5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
            worker.match >= 80
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : worker.match >= 60
              ? "bg-sky-50 text-sky-700 border border-sky-200"
              : "bg-slate-50 text-slate-500 border border-slate-200"
          }`}>
            <Sparkles className="w-2.5 h-2.5" /> {worker.match}% match
          </span>
        </div>
      )}

      {/* Request Sent banner */}
      {requestSent && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest z-10">
          <CheckCircle2 className="w-3 h-3" /> Request Sent
        </div>
      )}

      {/* Avatar + name — push down if banner shown */}
      <div className={`flex items-start gap-4 mb-5 ${requestSent ? "mt-7" : ""}`}>
        <div className="relative flex-shrink-0">
          <InitialsAvatar name={worker.name} size={56} />
          {worker.verified && (
            <div className="absolute -bottom-1.5 -right-1.5 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-black fill-black" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-16 pt-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-base font-bold text-black truncate">{worker.name}</h3>
            {worker.verified && (
              <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex-shrink-0">EAS</span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium truncate">{worker.role}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-5 px-4 py-3 bg-[#f9f9fa] rounded-xl">
        {[
          { label: t('hirer.trust'), value: worker.trust_score?.toFixed(0) ?? "—" },
          { label: t('hirer.rating'), value: worker.rating?.toFixed(1) ?? "—" },
          { label: t('hirer.jobs'), value: worker.jobs_completed ?? 0 },
        ].map(({ label, value }, i, arr) => (
          <React.Fragment key={label}>
            <div className="flex-1 text-center">
              <p className="text-base font-black text-black">{value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
            {i < arr.length - 1 && <div className="w-px h-8 bg-slate-200" />}
          </React.Fragment>
        ))}
      </div>

      {/* Location + availability */}
      <div className="flex items-center gap-3 mb-5 text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{worker.location || "Anywhere"}</span>
        <span className={`flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
          worker.available ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${worker.available ? "bg-emerald-500" : "bg-slate-300"}`} />
          {worker.available ? t('hirer.availableShort') : t('hirer.busyShort')}
        </span>
      </div>

      {/* Skills — fixed height, max 3 tags so every card is uniform */}
      <div className="min-h-[40px] flex flex-wrap gap-1.5 mb-6 content-start">
        {(worker.skills || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center h-7 px-3 bg-[#f0f0f1] text-black text-[10px] font-bold rounded-full whitespace-nowrap"
          >{tag}</span>
        ))}
        {(worker.skills || []).length > 3 && (
          <span className="inline-flex items-center h-7 px-3 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full">
            +{worker.skills.length - 3} more
          </span>
        )}
        {(worker.skills || []).length === 0 && (
          <span className="inline-flex items-center h-7 px-3 bg-slate-50 text-slate-300 text-[10px] font-bold rounded-full">No skills listed</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 mt-auto">
        <button
          id={`hire-btn-${worker.worker_id}`}
          onClick={onHire}
          disabled={!worker.available || requestSent}
          className={`flex-1 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
            requestSent
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 disabled:opacity-100"
              : "bg-black text-white hover:opacity-90 disabled:opacity-40"
          }`}
        >
          {requestSent ? (
            <><CheckCircle2 className="w-4 h-4" /> Sent</>
          ) : (
            <>{t('hirer.hirenow')} <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
        <button
          id={`profile-btn-${worker.worker_id}`}
          onClick={onViewProfile}
          className="p-3 bg-[#f0f0f1] rounded-xl hover:bg-slate-200 transition-colors flex-shrink-0"
          title="View profile"
        >
          <Eye className="w-4 h-4 text-black" />
        </button>
      </div>
    </motion.div>
  );
}
