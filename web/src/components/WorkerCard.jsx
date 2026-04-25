import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, MapPin, Star, Briefcase, CheckCircle2, Clock, XCircle, User } from 'lucide-react';

// ── KYC Badge ────────────────────────────────────────────────────────────────
function KYCBadge({ verified, status }) {
  if (verified || status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
        <CheckCircle2 className="w-3 h-3" /> KYC Verified
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest">
        <Clock className="w-3 h-3" /> Under Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-widest">
      <XCircle className="w-3 h-3" /> Not Verified
    </span>
  );
}

// ── Trust Score Ring ──────────────────────────────────────────────────────────
function TrustRing({ score }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <motion.circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-xl font-black tracking-tight leading-none">{pct}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trust</p>
      </div>
    </div>
  );
}

// ── Main WorkerCard ───────────────────────────────────────────────────────────
export default function WorkerCard({ worker, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 animate-pulse">
        <div className="flex gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-slate-100 rounded-full w-1/3" />
            <div className="h-3 bg-slate-100 rounded-full w-1/2" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!worker) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Top gradient accent */}
      <div className="h-1.5 bg-gradient-to-r from-black via-slate-700 to-slate-500" />

      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Profile photo */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-lg bg-slate-100">
              {worker.profile_photo ? (
                <img
                  src={worker.profile_photo}
                  alt={worker.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>
            {worker.kyc_verified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white shadow">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{worker.name || '—'}</h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {worker.worker_id}</p>
              </div>
              <KYCBadge verified={worker.kyc_verified} status={worker.kyc_status} />
            </div>

            {/* Location + Rating */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium mb-4">
              {worker.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {worker.location}
                </span>
              )}
              {worker.rating != null && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {Number(worker.rating).toFixed(1)} rating
                </span>
              )}
              {worker.jobs_completed != null && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" /> {worker.jobs_completed} jobs done
                </span>
              )}
            </div>

            {/* Skills */}
            {worker.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {worker.skills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Trust score ring */}
          <TrustRing score={worker.trust_score ?? 50} />
        </div>
      </div>
    </motion.div>
  );
}
