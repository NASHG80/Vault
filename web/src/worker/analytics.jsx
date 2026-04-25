import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  RefreshCw, ShieldCheck, Award, Lightbulb,
  Building2, Wallet, CheckCircle2, ArrowUpRight,
  ExternalLink, Clock, MapPin, Zap,
  Loader2, AlertTriangle, Target, Info,
} from 'lucide-react';
import { getWorkerAnalyticsData, getWorkerAIInsights } from '../services/api';
import { useTranslation } from 'react-i18next';

// ─── Score label — monochrome only ────────────────────────────────────────────
function scoreLabel(s) {
  if (s >= 75) return { label: 'Excellent', ring: '#000000', badge: 'bg-black text-white border-black' };
  if (s >= 55) return { label: 'Good',      ring: '#404040', badge: 'bg-slate-800 text-white border-slate-800' };
  if (s >= 35) return { label: 'Fair',      ring: '#9ca3af', badge: 'bg-slate-200 text-slate-700 border-slate-300' };
  return              { label: 'Poor',      ring: '#d1d5db', badge: 'bg-slate-100 text-slate-500 border-slate-200' };
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function ScoreGauge({ score, label, max = 100, description }) {
  const cfg  = scoreLabel(score);
  const r    = 58;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(score / max, 1);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <svg width="152" height="152" className="-rotate-90">
          <circle cx="76" cy="76" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <motion.circle
            cx="76" cy="76" r={r} fill="none"
            stroke={cfg.ring} strokeWidth="10"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - pct * circ }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="text-5xl font-black tracking-tighter text-black"
          >
            {score}
          </motion.span>
          <span className="text-sm font-bold text-slate-400">/ {max}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-black text-black">{label}</p>
        <span className={`inline-block mt-2 px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded-full border ${cfg.badge}`}>
          {cfg.label}
        </span>
        {description && (
          <p className="text-sm text-slate-400 font-medium mt-3 leading-relaxed max-w-[200px] mx-auto">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Loan Eligibility Bar ─────────────────────────────────────────────────────
function LoanBar({ eligible, maxAmount, reason }) {
  const brackets = [10000, 25000, 50000, 100000, 200000];
  const labels   = ['₹10K', '₹25K', '₹50K', '₹1L', '₹2L'];
  const pct      = Math.min((maxAmount / 200000) * 100, 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${eligible ? 'bg-black' : 'bg-slate-300'}`} />
          <span className="text-lg font-black text-black">
            {eligible ? 'Loan Eligible' : 'Not Yet Eligible'}
          </span>
        </div>
        <span className="text-3xl font-black tracking-tighter text-black">
          ₹{(maxAmount / 1000).toFixed(0)}K
        </span>
      </div>

      <div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
            className={`h-full rounded-full ${eligible ? 'bg-black' : 'bg-slate-300'}`}
          />
        </div>
        <div className="flex justify-between mt-2.5">
          {brackets.map((b, i) => (
            <span key={b} className={`text-xs font-black ${maxAmount >= b ? 'text-black' : 'text-slate-300'}`}>
              {labels[i]}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500 font-medium leading-relaxed bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
        {reason}
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ className }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

// ─── Score Legend Popover ─────────────────────────────────────────────────────
function ScoreLegend() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShow(v => !v)}
        className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-black transition-colors uppercase tracking-widest"
      >
        <Info size={13} /> What's the difference?
      </button>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-7 right-0 z-20 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4"
        >
          <div>
            <p className="text-sm font-black text-black mb-1.5">🤖 AI Credit Score</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Generated by Groq AI by analysing your <strong className="text-black">full profile snapshot</strong> from
              MongoDB — jobs completed, acceptance rate, KYC status, EAS certificate
              earnings, and loan history. Represents your <strong className="text-black">overall financial credibility</strong>.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-black text-black mb-1.5">🛡️ Platform Trust Score</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Calculated by the <strong className="text-black">VAULT platform</strong>. Updates every time
              you complete a job, accept a request, or get rated. Based purely on your{' '}
              <strong className="text-black">on-platform activity</strong>.
            </p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
          >
            Close ✕
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 flex-shrink-0">
        <Icon size={20} className="text-black" />
      </div>
      <div>
        <p className="text-lg font-black text-black">{label}</p>
        {sub && <p className="text-sm text-slate-400 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Priority badge — monochrome ──────────────────────────────────────────────
function priorityCfg(p) {
  if (p === 'high')   return { badge: 'bg-black text-white border-black',          dot: 'bg-black',      lbl: 'High Impact' };
  if (p === 'medium') return { badge: 'bg-slate-200 text-slate-700 border-slate-300', dot: 'bg-slate-500', lbl: 'Medium Impact' };
  return                     { badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300', lbl: 'Low Impact' };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkerAnalytics() {
  const { t } = useTranslation();

  const [data,          setData]          = useState(null);
  const [insights,      setInsights]      = useState(null);
  const [loadingData,   setLoadingData]   = useState(true);
  const [loadingAI,     setLoadingAI]     = useState(false);
  const [dataErr,       setDataErr]       = useState(null);
  const [aiErr,         setAiErr]         = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchData = useCallback(async () => {
    setLoadingData(true); setDataErr(null);
    try   { const r = await getWorkerAnalyticsData(); setData(r); }
    catch (e) { setDataErr(e.message || 'Failed to load profile data'); }
    finally   { setLoadingData(false); }
  }, []);

  const refreshAI = useCallback(async () => {
    setLoadingAI(true); setAiErr(null);
    try   { const r = await getWorkerAIInsights(); setInsights(r); setLastRefreshed(new Date()); }
    catch (e) { setAiErr(e.message || 'Failed to generate AI insights'); }
    finally   { setLoadingAI(false); }
  }, []);

  useEffect(() => { fetchData(); refreshAI(); }, [fetchData, refreshAI]);

  const trustScore  = data?.trust_score  ?? 0;
  const creditScore = insights?.credit_score ?? 0;

  return (
    <div className="space-y-10 pb-20">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-black tracking-[0.35em] uppercase text-slate-400 mb-2">
            VAULT · Analytics
          </p>
          <h1 className="text-4xl font-black tracking-tight text-black leading-tight">
            Financial Analytics<br />
            <span className="text-slate-400">&amp; AI Insights</span>
          </h1>
          <p className="text-base text-slate-400 font-medium mt-3 max-w-xl leading-relaxed">
            Real-time scores powered by your live MongoDB profile — government schemes,
            loan eligibility and a personalised improvement roadmap.
          </p>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={refreshAI}
            disabled={loadingAI}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-black text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={15} className={loadingAI ? 'animate-spin' : ''} />
            {loadingAI ? 'Generating…' : 'Refresh AI Insights'}
          </motion.button>
          {lastRefreshed && (
            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Clock size={10} /> {lastRefreshed.toLocaleTimeString('en-IN')}
            </p>
          )}
        </div>
      </div>

      {/* ── Errors ── */}
      {dataErr && (
        <div className="flex items-center gap-3 p-5 bg-slate-100 border border-slate-200 rounded-2xl text-black text-sm font-medium">
          <AlertTriangle size={18} className="flex-shrink-0 text-slate-500" /> {dataErr}
        </div>
      )}
      {aiErr && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-5 rounded-2xl border bg-slate-50 border-slate-200 text-black"
        >
          <Clock size={18} className="mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <p className="font-black text-sm mb-1">
              {aiErr.toLowerCase().includes('rate limit') ? 'AI Rate Limit Reached' : 'AI Insight Error'}
            </p>
            <p className="text-sm text-slate-500">{aiErr}</p>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — Scores + Loan Eligibility
      ══════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-black tracking-[0.3em] uppercase text-slate-400">
            Scores &amp; Eligibility
          </p>
          <ScoreLegend />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* AI Credit Score */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 self-start mb-4">
              🤖 AI Credit Score
            </p>
            {loadingAI ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 size={32} className="animate-spin text-slate-300" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Analysing…</p>
              </div>
            ) : (
              <ScoreGauge
                score={creditScore}
                label="AI Credit Score"
                description="Groq AI assessment of your overall financial credibility based on your full profile."
              />
            )}
          </div>

          {/* Platform Trust Score */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 self-start mb-4">
              🛡️ Platform Trust Score
            </p>
            {loadingData ? (
              <Skel className="w-36 h-36 rounded-full mt-4" />
            ) : (
              <ScoreGauge
                score={trustScore}
                label="Platform Trust Score"
                max={99}
                description="VAULT platform score that grows with every completed job and positive rating."
              />
            )}
          </div>

          {/* Loan Eligibility */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">
              💳 Loan Eligibility
            </p>
            {loadingAI ? (
              <div className="space-y-4">
                <Skel className="h-6 w-3/4" />
                <Skel className="h-3 w-full" />
                <Skel className="h-3 w-5/6" />
                <Skel className="h-16 w-full mt-2" />
              </div>
            ) : insights?.loan_eligibility ? (
              <LoanBar
                eligible={insights.loan_eligibility.eligible}
                maxAmount={insights.loan_eligibility.max_amount}
                reason={insights.loan_eligibility.reason}
              />
            ) : (
              <p className="text-sm text-slate-400 font-medium text-center py-10">
                Refresh AI Insights to see your loan eligibility
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — Financial Summary + Profile Snapshot
      ══════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Financial Summary — dark card */}
        <div className="bg-black rounded-2xl p-8 text-white">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-7">
            AI Financial Summary
          </p>
          {loadingAI ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between border-b border-white/10 pb-5">
                  <Skel className="h-3 w-32 bg-white/10" />
                  <Skel className="h-5 w-20 bg-white/10" />
                </div>
              ))}
            </div>
          ) : insights?.financial_summary ? (
            <div className="space-y-5">
              <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                    Est. Monthly Income
                  </p>
                  <p className="text-5xl font-black tracking-tighter">
                    ₹{(insights.financial_summary.monthly_estimate / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Trajectory</p>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight
                      size={18}
                      className={
                        insights.financial_summary.growth_trajectory === 'growing'   ? 'text-white' :
                        insights.financial_summary.growth_trajectory === 'declining' ? 'text-white/40 rotate-90' :
                        'text-white/30'
                      }
                    />
                    <span className="text-lg font-black capitalize">
                      {insights.financial_summary.growth_trajectory}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-base font-bold text-white/60">Financial Risk Level</p>
                <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white">
                  {insights.financial_summary.risk_level}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-base text-white/30 font-medium text-center py-10">
              Refresh AI Insights to see your financial summary
            </p>
          )}
        </div>

        {/* Profile Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">
            Your Profile Snapshot
          </p>
          {loadingData ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <Skel key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: 'KYC Status',
                  value: data?.kyc_verified ? 'Verified ✓' : (data?.kyc_status ?? '—'),
                  Icon: ShieldCheck,
                  ok: data?.kyc_verified,
                },
                { label: 'Location',  value: data?.location || '—',                        Icon: MapPin },
                { label: 'Skills',    value: data?.skills?.join(', ') || 'None listed',     Icon: Award },
                {
                  label: 'Availability',
                  value: data?.available ? 'Available for work' : 'Currently busy',
                  Icon: Clock,
                  ok: data?.available,
                },
                {
                  label: 'EAS Certificate',
                  value: data?.has_certificate
                    ? `Published · ${data.platform_tags?.join(', ') || '—'}`
                    : 'Not yet published',
                  Icon: Zap,
                  ok: data?.has_certificate,
                },
              ].map(({ label, value, Icon, ok }) => (
                <div key={label} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    ok === true  ? 'bg-black'      :
                    ok === false ? 'bg-slate-200'  : 'bg-slate-100'
                  }`}>
                    <Icon size={16} className={ok === true ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                    <p className="text-base font-bold text-black truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — What Should I Improve?
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <SectionHeading
          icon={Lightbulb}
          label="What Should I Improve?"
          sub="AI-personalised action plan based on your live MongoDB profile"
        />

        {loadingAI ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skel key={i} className="h-36" />)}
          </div>
        ) : insights?.improvement_tips?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.improvement_tips.map((tip, i) => {
              const cfg = priorityCfg(tip.priority);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i }}
                  className="p-6 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-base font-black text-black leading-tight">{tip.title}</p>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest flex-shrink-0 border ${cfg.badge}`}>
                      {cfg.lbl}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">{tip.action}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{tip.impact}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-14">
            <Target size={36} className="mx-auto mb-4 text-slate-200" />
            <p className="text-base font-black text-slate-400">
              Click "Refresh AI Insights" to get your personalised action plan
            </p>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — Government Schemes
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <SectionHeading
          icon={Building2}
          label="Personalised Government Schemes"
          sub="Schemes matched to your skills, location and income level by AI"
        />

        {loadingAI ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5].map(i => <Skel key={i} className="h-52" />)}
          </div>
        ) : insights?.government_policies?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.government_policies.map((policy, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * i }}
                className="p-6 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border bg-slate-100 text-slate-600 border-slate-200">
                    {policy.category}
                  </span>
                  {policy.scheme_id && (
                    <span className="text-[9px] font-mono text-slate-300">{policy.scheme_id}</span>
                  )}
                </div>

                <p className="text-base font-black text-black leading-tight">{policy.name}</p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
                  {policy.benefit}
                </p>

                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Eligibility
                  </p>
                  <p className="text-sm text-black font-medium">{policy.eligibility}</p>
                </div>

                {policy.apply_url && (
                  <a
                    href={policy.apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
                  >
                    Apply Now <ExternalLink size={11} />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <Building2 size={36} className="mx-auto mb-4 text-slate-200" />
            <p className="text-base font-black text-slate-400 mb-5">
              Government schemes will appear after refreshing AI insights
            </p>
            <button
              onClick={refreshAI}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-black rounded-2xl hover:opacity-80 transition-all uppercase tracking-widest"
            >
              <RefreshCw size={13} /> Generate Now
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
