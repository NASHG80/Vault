import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone, User, MapPin, Sparkles, Upload, Shield,
  CheckCircle2, Loader2, AlertCircle, ChevronRight, Plus, X, Eye
} from 'lucide-react';
import { sendOTP, verifyOTP, uploadFile, submitManualKYC, getStoredUser } from '../services/api';
import { useTranslation } from 'react-i18next';

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS_KEYS = ['kyc.phoneVerification', 'kyc.yourDetails', 'kyc.documents'];

const SKILL_SUGGESTIONS = [
  'Delivery', 'Driving', 'Logistics', 'Warehousing', 'Construction',
  'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security',
  'IT Support', 'Data Entry', 'Customer Service', 'Cooking', 'Photography',
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepBar({ current }) {
  const { t } = useTranslation();
  const STEPS = STEPS_KEYS.map(k => t(k));
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                done   ? 'bg-emerald-500 text-white' :
                active ? 'bg-black text-white shadow-lg shadow-black/20' :
                         'bg-slate-100 text-slate-300'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${active ? 'text-black' : 'text-slate-300'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px transition-colors duration-500 mb-4 ${done ? 'bg-emerald-400' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, icon: Icon, children, hint }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
        <Icon className="w-3.5 h-3.5" />{label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{hint}</p>}
    </div>
  );
}

function SkillInput({ skills, onChange }) {
  const [val, setVal] = useState('');
  const add = (s) => { const t = s.trim(); if (t && !skills.includes(t)) onChange([...skills, t]); setVal(''); };
  const remove = (s) => onChange(skills.filter(x => x !== s));
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map(s => (
          <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-full">
            {s}<button type="button" onClick={() => remove(s)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(val); } }}
          placeholder="Type skill + Enter…"
          className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
        />
        <button type="button" onClick={() => add(val)} className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
          <button key={s} type="button" onClick={() => add(s)}
            className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full hover:bg-black hover:text-white transition-all">
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ImageUploadBox({ label, value, onChange, id }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true); setErr('');
    try {
      const data = await uploadFile(file);
      onChange(data.url);
    } catch (e) { setErr(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <div
        onClick={() => ref.current?.click()}
        className={`relative w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
          value ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-black hover:bg-slate-100'
        }`}
      >
        <input id={id} ref={ref} type="file" accept="image/*" className="hidden"
          onChange={e => handleFile(e.target.files?.[0])} />
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        ) : value ? (
          <>
            <img src={value} alt="preview" className="h-full w-full object-cover rounded-2xl" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 hover:opacity-100 transition-opacity">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <>
            <Upload className="w-7 h-7 text-slate-300" />
            <p className="text-xs font-bold text-slate-400">Click to upload</p>
          </>
        )}
      </div>
      {err && <p className="text-[10px] text-red-500 mt-1 font-medium">{err}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KYCManual() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = getStoredUser();

  const [step, setStep]           = useState(0);
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [otpSent, setOtpSent]     = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [fullName, setFullName]   = useState('');
  const [skills, setSkills]       = useState([]);
  const [location, setLocation]   = useState('');

  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [aadhaarUrl, setAadhaarUrl]     = useState('');
  const [selfieUrl, setSelfieUrl]       = useState('');

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // ─ Step 0: OTP ─────────────────────────────────────────
  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError(t('kyc.invalidPhone')); return; }
    setLoading(true); setError('');
    try {
      await sendOTP(digits);
      setOtpSent(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    setLoading(true); setError('');
    try {
      const res = await verifyOTP(digits, otp);
      if (res.verified) { setPhoneVerified(true); setStep(1); }
      else setError(res.reason || t('kyc.incorrectOtp'));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ─ Step 1: Details ──────────────────────────────────────
  const handleDetailsNext = () => {
    if (!fullName.trim()) { setError(t('kyc.nameRequired')); return; }
    if (!skills.length)   { setError(t('kyc.skillRequired')); return; }
    if (!location.trim()) { setError(t('kyc.locationRequired')); return; }
    setError(''); setStep(2);
  };

  // ─ Step 2: Documents + Submit ───────────────────────────
  const handleSubmit = async () => {
    if (!aadhaarLast4 || aadhaarLast4.length !== 4 || !/^\d{4}$/.test(aadhaarLast4)) {
      setError(t('kyc.aadhaarDigitsRequired')); return;
    }
    if (!aadhaarUrl) { setError(t('kyc.aadhaarPhotoRequired')); return; }
    if (!selfieUrl)  { setError(t('kyc.selfieRequired')); return; }

    setLoading(true); setError('');
    try {
      await submitManualKYC({
        user_id:       user?.id || '',
        full_name:     fullName,
        phone:         phone.replace(/\D/g, ''),
        skills,
        location,
        aadhaar_last4: aadhaarLast4,
        aadhaar_image: aadhaarUrl,
        selfie_image:  selfieUrl,
      });
      navigate('/worker/kyc-status');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex items-center justify-center px-4 py-12 font-sans">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-white rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.07)] border border-slate-100 p-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-black/15">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter">{t('kyc.identityVerification')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('kyc.completeSteps')}</p>
        </div>

        <StepBar current={step} />

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-5 text-red-700 text-sm font-medium overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP 0: Phone OTP ── */}
        {step === 0 && (
          <div className="space-y-5">
            <Field label={t('kyc.mobileNumber')} icon={Phone} hint={t('kyc.mobileHint')}>
              <div className="flex gap-2">
                <input
                  id="kyc-phone"
                  type="tel" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210" maxLength={10}
                  className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
                />
                <button
                  id="send-otp-btn"
                  type="button" onClick={handleSendOTP} disabled={loading || otpSent}
                  className="px-5 h-12 bg-black text-white rounded-xl text-sm font-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {otpSent ? t('kyc.resend') : loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('kyc.sendOtp')}
                </button>
              </div>
            </Field>

            {otpSent && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-center">
                  <p className="text-xs font-bold text-emerald-700">
                    OTP sent to +91-{phone.replace(/\D/g, '').replace(/(\d{5})(\d{5})/, '$1-$2')} via SMS
                  </p>
                </div>
                <Field label={t('kyc.enterOtp')} icon={Shield}>
                  <div className="flex gap-2">
                    <input
                      id="kyc-otp"
                      type="text" value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456" maxLength={6}
                      className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all tracking-widest"
                    />
                    <button
                      id="verify-otp-btn"
                      type="button" onClick={handleVerifyOTP} disabled={loading}
                      className="px-5 h-12 bg-black text-white rounded-xl text-sm font-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('kyc.verify')}
                    </button>
                  </div>
                </Field>
              </motion.div>
            )}
          </div>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 1 && (
          <div className="space-y-6">
            <Field label={t('kyc.fullName')} icon={User}>
              <input id="kyc-name" type="text" value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t('kyc.fullNamePlaceholder')}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
              />
            </Field>
            <Field label={t('kyc.skills')} icon={Sparkles} hint={t('kyc.skillsHint')}>
              <SkillInput skills={skills} onChange={setSkills} />
            </Field>
            <Field label={t('kyc.location')} icon={MapPin} hint={t('kyc.locationHint')}>
              <input id="kyc-location" type="text" value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={t('kyc.locationPlaceholder')}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all"
              />
            </Field>
            <button id="details-next-btn" type="button" onClick={handleDetailsNext}
              className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10">
              {t('common.continue')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Documents ── */}
        {step === 2 && (
          <div className="space-y-6">
            <Field label={t('kyc.aadhaarLast4')} icon={Shield} hint={t('kyc.aadhaarHint')}>
              <input id="kyc-aadhaar-last4" type="text" value={aadhaarLast4}
                onChange={e => setAadhaarLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t('kyc.aadhaarPlaceholder')} maxLength={4}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all tracking-widest"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <ImageUploadBox id="kyc-aadhaar-img" label={`📄 ${t('kyc.aadhaarPhoto')}`} value={aadhaarUrl} onChange={setAadhaarUrl} />
              <ImageUploadBox id="kyc-selfie-img"  label={`🤳 ${t('kyc.selfie')}`}        value={selfieUrl}  onChange={setSelfieUrl} />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-medium">
              ⚠️ {t('kyc.docSecurity')}
            </div>

            <button id="kyc-submit-btn" type="button" onClick={handleSubmit} disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-black/10">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('kyc.submitting')}</> : t('kyc.submitReview')}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
