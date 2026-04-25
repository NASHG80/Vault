import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, Star, Briefcase, Phone, Mail, Clock, CheckCircle2, XCircle, AlertTriangle, Globe
} from 'lucide-react';

const BASE_URL = window.location.origin;

// ─── KYC status config ──────────────────────────────────────────────────
const KYC_STATUS = {
  approved: { label: 'KYC Verified',  color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  pending:  { label: 'KYC Pending',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',  icon: Clock },
  rejected: { label: 'KYC Rejected',  color: 'bg-red-500/20 text-red-400 border-red-500/30',        icon: XCircle },
  new:      { label: 'Unverified',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',     icon: AlertTriangle },
};

// ─── Tier config ───────────────────────────────────────────────────────
const TIER_CONFIG = {
  platinum: { label: 'Platinum Member', gradient: 'from-gray-200 via-white to-gray-300' },
  gold:     { label: 'Gold Member',     gradient: 'from-yellow-200 via-yellow-100 to-yellow-300' },
  silver:   { label: 'Silver Member',   gradient: 'from-gray-300 via-gray-200 to-gray-400' },
  default:  { label: 'Member',          gradient: 'from-gray-200 via-white to-gray-300' },
};

function getTierConfig(role, kycStatus, score) {
  if (score >= 80 || role === 'platinum') return TIER_CONFIG.platinum;
  if (score >= 60 || role === 'gold') return TIER_CONFIG.gold;
  if (score >= 40 || role === 'silver') return TIER_CONFIG.silver;
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
export function Skeleton({ className }) {
  return <div className={`animate-pulse bg-outline/10 rounded-xl ${className}`} />;
}

export function IDCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-7 border border-gray-800 space-y-4 w-full"
      style={{ aspectRatio: '1.586 / 1', background: '#111' }}
    >
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24 bg-gray-800" />
        <Skeleton className="h-4 w-28 bg-gray-800" />
      </div>
      <div className="flex items-center gap-4 mt-4">
        <Skeleton className="w-20 h-20 rounded-xl bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4 bg-gray-800" />
          <Skeleton className="h-3 w-1/2 bg-gray-800" />
          <div className="flex gap-1">
            <Skeleton className="h-4 w-14 rounded-md bg-gray-800" />
            <Skeleton className="h-4 w-16 rounded-md bg-gray-800" />
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div className="space-y-2">
          <Skeleton className="h-2 w-28 bg-gray-800" />
          <Skeleton className="h-12 w-20 bg-gray-800" />
          <Skeleton className="h-1 w-28 rounded-full bg-gray-800" />
        </div>
        <Skeleton className="w-16 h-16 rounded-lg bg-gray-800" />
      </div>
    </div>
  );
}

// ─── Shared Digital ID Card ───────────────────────────────────────────
export default function DigitalIDCard({ user, worker, trustScore, presetUserId, variant = 'worker-dashboard' }) {
  const cardRef = useRef(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const name    = worker?.name || user?.name || '—';
  const email   = user?.email || worker?.email || '';
  const role    = user?.role || worker?.role || 'worker';
  const skills  = worker?.skills || [];
  const phone   = worker?.phone || '';
  const kycStatus = worker?.kyc_status || 'new';
  const score   = trustScore ?? worker?.trust_score ?? 0;
  const photoUrl = worker?.profile_photo || '';
  const jobsDone = worker?.jobs_completed || 0;
  const rating  = 4.8; // Hardcoded rating

  const kycConf  = KYC_STATUS[kycStatus] || KYC_STATUS.new;
  const KycIcon  = kycConf.icon;
  const tierConf = getTierConfig(role, kycStatus, score);

  const userId     = presetUserId || user?.id || worker?.user_id || worker?.worker_id || '';
  const uidDisplay = userId
    ? `FW-${userId.toString().slice(0, 4).toUpperCase()}-${userId.toString().slice(-2).toUpperCase()}`
    : 'FW-XXXX-X0';

  const maskedPhone = phone && phone.length >= 10
    ? phone.replace(/(\d{2})\d{6}(\d{2})/, '$1••••••$2')
    : (phone ? phone : '••••••••••');
  
  const maskedEmail = email && email.includes('@')
    ? email.replace(/(.{2}).+(@.+)/, '$1•••••$2')
    : (email ? email : '•••••@•••.com');

  // Holographic shimmer on mouse move
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePos({ x, y, opacity: 0.18 });
  };

  const handleMouseLeave = () => {
    setGlarePos((p) => ({ ...p, opacity: 0 }));
    setIsHovered(false);
  };

  // Live timestamp
  const [timestamp, setTimestamp] = useState('');
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const opts = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setTimestamp(now.toLocaleString('en-IN', opts).toUpperCase() + ' IST');
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        aspectRatio: '1.586 / 1',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 40%, #1c1c1c 70%, #111 100%)',
        boxShadow: isHovered
          ? '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        transition: 'box-shadow 0.4s ease, transform 0.3s ease',
        transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
      }}
      className="relative rounded-2xl overflow-hidden w-full select-none cursor-default flex flex-col justify-between p-7"
    >
      {/* Brushed metal texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 3px)',
        }}
      />

      {/* Holographic glare */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, transparent 60%)`,
          opacity: glarePos.opacity > 0 ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Subtle silver edge shimmer at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), rgba(255,255,255,0.5), rgba(255,255,255,0.25), transparent)' }}
      />

      {/* ── TOP ROW: Logo + Tier ── */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase mb-0.5">VAULT</p>
          <p
            className="text-[11px] font-black tracking-[0.25em] uppercase"
            style={{
              background: 'linear-gradient(135deg, #d1d5db, #ffffff, #9ca3af)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Premium Digital ID
          </p>
        </div>

        <div className="text-right">
          <p
            className="text-[11px] font-black tracking-[0.2em] uppercase"
            style={{
              background: `linear-gradient(135deg, ${tierConf.gradient.replace('from-', '').replace('via-', '').replace('to-', '')})`,
              background: 'linear-gradient(135deg, #c0c0c0, #ffffff, #a8a8a8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {tierConf.label}
          </p>
          {kycStatus === 'approved' && (
            <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black tracking-widest uppercase ${kycConf.color}`}>
              <KycIcon size={9} />
              {kycConf.label}
            </div>
          )}
        </div>
      </div>

      {/* ── MIDDLE ROW: Photo + Identity ── */}
      <div className="relative z-10 flex items-center gap-5 mt-1">
        {/* Profile photo */}
        <div className="relative flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="rounded-xl object-cover border-2 border-gray-600/60"
              style={{ width: 80, height: 80 }}
            />
          ) : (
            <InitialsAvatar name={name} size={80} />
          )}
          {/* KYC badge on avatar */}
          <div
            className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-md flex items-center justify-center border-2 border-gray-900 ${kycConf.color}`}
          >
            <KycIcon size={9} />
          </div>
        </div>

        {/* Name + UID + Skills */}
        <div className="flex-1 min-w-0">
          <h2
            className="text-2xl font-black tracking-tight leading-tight truncate"
            style={{ color: '#f1f5f9' }}
          >
            {name}
          </h2>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {skills.length > 0 ? (
              skills.slice(0, 1).map((s) => (
                <span key={s} className="text-[10px] text-gray-400 font-semibold">{s}</span>
              ))
            ) : (
              <span className="text-[10px] text-gray-400 font-semibold capitalize">{role}</span>
            )}
            {skills.length > 1 && (
              <span className="text-[10px] text-gray-400 font-semibold">
                · {skills.slice(1, 2).join(', ')}
              </span>
            )}
          </div>

          <p className="text-[10px] font-mono text-gray-600 mt-1">UID: {uidDisplay}</p>

          {/* Skill pills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LOWER MIDDLE: Credit Score + Right Segment ── */}
      <div className="relative z-10 flex items-end justify-between mt-1">
        <div className="flex items-end gap-6">
          {/* Trust / Financial Health Score */}
          <div>
            <p className="text-[9px] font-black tracking-[0.3em] uppercase text-gray-500 mb-0.5">
              Financial Health Score
            </p>
            <div className="flex items-baseline gap-1.5">
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="font-black leading-none"
                style={{
                  fontSize: 56,
                  background: 'linear-gradient(135deg, #e2e8f0, #ffffff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.04em',
                }}
              >
                {score}
              </motion.span>
              <span className="text-base text-gray-600 font-bold italic">/99</span>
            </div>

            {/* Score bar */}
            <div className="mt-1.5 w-28 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(score, 99)}%` }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #6b7280, #e2e8f0)' }}
              />
            </div>
          </div>

          {/* Income verified + Jobs */}
          <div className="space-y-1.5 pb-0.5">
            {kycStatus === 'approved' && (
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-green-400 flex-shrink-0" />
                <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Income Verified</span>
              </div>
            )}
            {jobsDone > 0 && (
              <div className="flex items-center gap-1.5">
                <Briefcase size={10} className="text-gray-500 flex-shrink-0" />
                <span className="text-[10px] text-gray-500 font-semibold">{jobsDone} gigs completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side component based on variant */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {variant === 'worker-dashboard' ? (
            <>
              {/* QR Code linking to profile */}
              <p className="text-[8px] font-black tracking-widest text-gray-600 uppercase">Live Verification</p>
              <Link
                to={userId ? `/worker/profile/${userId}` : '#'}
                target="_blank"
                rel="noreferrer"
                className="block"
                title="Scan to view public profile"
              >
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center border hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.92)', borderColor: 'rgba(255,255,255,0.2)', padding: 2 }}
                >
                  {userId ? (
                    <QRCodeSVG
                      value={`${BASE_URL}/worker/profile/${userId}`}
                      size={52}
                      bgColor="transparent"
                      fgColor="#111111"
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-200 animate-pulse" />
                  )}
                </div>
              </Link>
              <p className="text-[7px] text-gray-700 font-semibold">Scan to View Profile</p>
            </>
          ) : (
            <>
              {/* 5-Star Rating layout for public/hirer views */}
              <p className="text-[8px] font-black tracking-widest text-gray-600 uppercase">Client Rating</p>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg border bg-[#1c1c1c] border-gray-600/50">
                <div className="text-center">
                  <p className="text-lg font-black text-white leading-none mb-1">{rating > 0 ? rating.toFixed(1) : '—'}</p>
                  <div className="flex gap-0.5 justify-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={6} className={rating >= s ? "fill-white text-white" : "fill-gray-600 text-gray-600"} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-700/50 bg-[#1c1c1c] mt-0.5">
                <Globe size={7} className="text-gray-400" />
                <span className="text-[7px] text-gray-400 uppercase tracking-widest font-black">Public</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── BOTTOM STRIP ── */}
      <div
        className="relative z-10 flex items-center justify-between pt-3 mt-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-4">
          {phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={9} className="text-gray-600" />
              <span className="text-[9px] font-mono text-gray-600">{maskedPhone}</span>
            </div>
          )}
          {email && variant === 'worker-dashboard' && (
            <div className="flex items-center gap-1.5">
              <Mail size={9} className="text-gray-600" />
              <span className="text-[9px] font-mono text-gray-600">{maskedEmail}</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <p className="text-[8px] font-mono text-gray-700 leading-tight">
            <span className="text-gray-600 font-black">
              {variant === 'worker-dashboard' ? 'LIVE TIMESTAMP: ' : 'LIVE: '}
            </span>
            {timestamp}
          </p>
          <p className="text-[7px] text-gray-700 uppercase tracking-widest">100% Security Holographic</p>
        </div>
      </div>

      {/* Decorative silver shine bar at bottom */}
      <div
        className="absolute bottom-0 left-8 right-8 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
      />
    </motion.div>
  );
}
