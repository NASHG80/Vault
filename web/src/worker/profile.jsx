import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, Star, Verified, Layers, ExternalLink,
  Briefcase, Phone, Mail, AlertTriangle, Clock,
  CheckCircle2, XCircle, Truck, Car, Package, Utensils,
  ArrowLeftRight, User, ChevronRight, ArrowLeft, Globe,
} from 'lucide-react';
import { getWorkerPublicProfile } from '../services/api';
import { useTranslation } from 'react-i18next';
import DigitalIDCard, { IDCardSkeleton } from '../components/DigitalIDCard';

// ─── Icon map ──────────────────────────────────────────────────────────
const ICON_MAP = {
  logistics: Truck, rideshare: Car, delivery: Package,
  food: Utensils, inspection: ShieldCheck, default: ArrowLeftRight,
};

// ─── KYC status config ─────────────────────────────────────────────────
const KYC_STATUS = {
  approved: { label: 'KYC Verified',  color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  pending:  { label: 'KYC Pending',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',  icon: Clock },
  rejected: { label: 'KYC Rejected',  color: 'bg-red-500/20 text-red-400 border-red-500/30',        icon: XCircle },
  new:      { label: 'Unverified',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',     icon: AlertTriangle },
};

// ─── Tier config ───────────────────────────────────────────────────────
const TIER_CONFIG = {
  platinum: { label: 'Platinum Member' },
  gold:     { label: 'Gold Member' },
  silver:   { label: 'Silver Member' },
  default:  { label: 'Member' },
};

function getTierConfig(score) {
  if (score >= 80) return TIER_CONFIG.platinum;
  if (score >= 60) return TIER_CONFIG.gold;
  if (score >= 40) return TIER_CONFIG.silver;
  return TIER_CONFIG.default;
}

// ─── Avatar from initials ─────────────────────────────────────────────
function InitialsAvatar({ name, size = 80 }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : '?';
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center border-2 border-gray-500/40 flex-shrink-0"
    >
      <span style={{ fontSize: size * 0.35 }} className="font-black text-white tracking-tight">
        {initials}
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

// ─── Public Worker ID Card is now DigitalIDCard ─────────────────

// ─── Certificate Summary Card (mirrors dashboard PublishedCertificateCard) ──
function CertificateSummaryCard({ cert }) {
  const summary   = cert.public_summary || {};
  const gigs      = summary.gigs || [];
  const platforms = summary.platforms || cert.platform_tags || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative h-full flex flex-col group"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-black via-black/60 to-transparent flex-shrink-0" />
      <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
        <Verified size={200} />
      </div>

      <div className="p-7 space-y-5 relative z-10 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] font-black tracking-[0.3em] uppercase text-gray-400">VAULT Official Attestation</p>
            <p className="font-mono text-[9px] text-gray-300 mt-0.5">{summary.serial || 'VN-XXXX'}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl shadow-sm">
            <Star size={11} className="fill-black text-black" />
            <span className="text-[9px] font-black uppercase tracking-wider">TRUST: {summary.trustScore ?? '—'}/99</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earnings</p>
            <p className="text-3xl font-black tracking-tighter text-gray-900">
              ₹{(summary.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Verified Gigs</p>
            <p className="text-3xl font-black tracking-tighter text-gray-900">{summary.totalGigs ?? gigs.length}</p>
          </div>
        </div>

        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <span key={p} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[9px] font-black uppercase tracking-wider text-gray-500">
                {p}
              </span>
            ))}
          </div>
        )}

        {gigs.length > 0 && (
          <div className="border-t border-gray-100 pt-4 space-y-2 flex-1 overflow-y-auto max-h-40">
            {gigs.map((gig, i) => {
              const Icon = ICON_MAP[gig.category] || ICON_MAP.default;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-gray-900">{gig.title}</p>
                    <p className="text-[9px] text-gray-400">{gig.platform} · {gig.date}</p>
                  </div>
                  <p className="text-xs font-black text-gray-900">₹{(gig.amount || 0).toFixed(2)}</p>
                  {gig.isZk && <span className="text-[8px] font-black bg-black/10 text-black px-1.5 py-0.5 rounded-full">zkTLS</span>}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-auto">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Issued</p>
            <p className="text-xs font-black italic text-gray-900">
              {new Date(summary.issueDate || cert.published_at).toLocaleDateString('en-US', {
                day: '2-digit', month: 'short', year: 'numeric',
              }).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cert.certificate_cid && (
              <a
                href={`https://gateway.pinata.cloud/ipfs/${cert.certificate_cid}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[9px] font-black text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
              >
                IPFS <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-8 opacity-20 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
          {[{ icon: ShieldCheck, label: 'Encrypted' }, { icon: Layers, label: 'EAS Native' }, { icon: Verified, label: 'On-Chain' }].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={11} /><span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── ID Card Skeleton is in DigitalIDCard ──────────────────────────────

function CertSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ─── Public Worker Profile Page ────────────────────────────────────────
export default function WorkerPublicProfile() {
  const { t } = useTranslation();
  const { userId } = useParams();

  const [worker,  setWorker]  = useState(null);
  const [cert,    setCert]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!userId) {
      setError('No worker ID provided.');
      setLoading(false);
      return;
    }

    getWorkerPublicProfile(userId)
      .then(({ id_card, certificate }) => {
        setWorker(id_card);
        setCert(certificate);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load profile.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const uidDisplay = userId
    ? `FW-${userId.slice(0, 4).toUpperCase()}-${userId.slice(-2).toUpperCase()}`
    : '—';

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8edf5 100%)' }}
    >
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center">
                <Verified size={12} className="text-white" />
              </div>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">
                VAULT Platform
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Worker Public Profile</h1>
            <p className="text-sm text-gray-400 font-medium mt-1">
              Verified, tamper-proof credential — linked via QR code on their digital ID card.
            </p>
          </div>

          <Link to="/worker/dashboard" className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={14} /> {t('common.back')}
          </Link>
        </motion.div>

        {/* ── Content ── */}
        {error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <User size={28} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">{error}</h2>
            <p className="text-sm text-gray-400 font-medium">
              The worker profile you're looking for doesn't exist or is private.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* ── Left: ID Card ── */}
            <div>
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 mb-4">{t('kyc.digitalIdCard')}</p>
              {loading ? (
                <IDCardSkeleton />
              ) : (
                <DigitalIDCard
                  worker={worker}
                  presetUserId={userId}
                  variant="public"
                  trustScore={cert?.public_summary?.trustScore ?? worker?.trust_score ?? null}
                />
              )}

              {/* Trust badges */}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 flex items-center justify-center gap-8 opacity-30 hover:opacity-100 transition-all duration-500"
                >
                  {[{ icon: ShieldCheck, label: 'Encrypted' }, { icon: Layers, label: 'EAS Native' }, { icon: Verified, label: 'On-Chain' }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-gray-600">
                      <Icon size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* ── Right: Certificate ── */}
            <div>
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 mb-4">{t('kyc.certificateSummary')}</p>
              {loading ? (
                <CertSkeleton />
              ) : cert ? (
                <CertificateSummaryCard cert={cert} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center min-h-[280px]"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <Verified size={22} className="text-gray-200" />
                  </div>
                  <p className="text-sm font-black text-gray-900 mb-1">{t('cert.noTxFound')}</p>
                  <p className="text-xs text-gray-400 font-medium max-w-xs">
                    {t('kyc.noCertPublished')}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between"
          >
            <p className="text-[9px] font-black tracking-[0.3em] uppercase text-gray-300">
              VAULT Platform · Tamper-Proof Credential
            </p>
            <p className="text-[9px] font-mono text-gray-300">UID: {uidDisplay}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
