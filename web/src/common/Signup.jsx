import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, HelpCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, verifyOtp, getWorkerStatus } from '../services/api';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

// ─── OTP Input Component ─────────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const inputsRef = useRef([]);
  const digits = value.split('');

  const handleChange = (idx, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    onChange(next.join(''));
    if (char && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          inputMode="numeric" maxLength={1}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
};

// ─── Main Signup Component ───────────────────────────────────────────
const Signup = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('worker');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser({ name, email, password, role: selectedRole });
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || t('signup.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError(t('signup.otpRequired')); return; }
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp({ email, otp });
      const { role, id } = data.user;
      if (role === 'hirer') { navigate('/hirer/discovery'); return; }
      if (role === 'lender') { navigate('/lender'); return; }
      if (role === 'admin')  { navigate('/admin/kyc'); return; }
      const kyc = await getWorkerStatus(id).catch(() => ({ status: 'new' }));
      if (kyc.status === 'approved') navigate('/worker/dashboard');
      else navigate('/worker/kyc-manual');
    } catch (err) {
      setError(err.message || t('signup.otpFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await registerUser({ name, email, password, role: selectedRole });
      setOtp('');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || t('signup.resendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans antialiased overflow-x-hidden">
      <header className="fixed top-0 left-0 w-full z-10 bg-surface/80 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-8 py-6 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary">
            <img src="/logo.svg" alt="VAULT logo" className="h-7 w-auto" />
            {t('common.brand')}
          </Link>
          <div className="flex items-center gap-5">
            <LanguageSwitcher />
            <a className="text-on-surface-variant text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity" href="#">{t('signup.help')}</a>
            <Link className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all duration-200 text-sm" to="/login">{t('common.signIn')}</Link>
          </div>
        </div>
      </header>

      <main className="flex min-h-screen pt-20">
        <section className="hidden lg:flex flex-[1.2] items-center justify-center p-20 bg-surface-container-low border-r border-outline-variant/30">
          <div className="max-w-2xl">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-[4rem] font-bold tracking-[-0.03em] leading-[1.05] text-primary mb-6">
              {t('signup.newStandard')}
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xl text-on-surface-variant font-medium mb-12 max-w-lg">
              {t('signup.buildRep')}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-6 mb-16">
              <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow">
                <div className="text-4xl font-bold mb-1 tracking-tight">99.8%</div>
                <div className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">{t('signup.identityVerified')}</div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow">
                <div className="text-4xl font-bold mb-1 tracking-tight">₹1.5L Cr+</div>
                <div className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">{t('signup.gigLiquidity')}</div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center px-6 py-12 lg:py-24 bg-surface-container-lowest">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md p-10 md:p-14 rounded-3xl ambient-shadow border border-outline-variant/10 bg-white">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold tracking-tight text-primary mb-2">{t('signup.createAccount')}</h2>
                  <p className="text-on-surface-variant font-medium">{t('signup.buildIdentity')}</p>
                  {error && <p className="mt-4 text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
                </div>
                <form className="space-y-6" onSubmit={handleRequestOtp}>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('signup.fullName')}</label>
                    <input className="w-full bg-surface-container-low border-none rounded-xl p-4 text-on-surface placeholder:text-outline font-medium focus:ring-2 focus:ring-primary transition-all"
                      placeholder={t('signup.fullNamePlaceholder')} type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('signup.email')}</label>
                    <input className="w-full bg-surface-container-low border-none rounded-xl p-4 text-on-surface placeholder:text-outline font-medium focus:ring-2 focus:ring-primary transition-all"
                      placeholder={t('signup.emailPlaceholder')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('signup.password')}</label>
                    <input className="w-full bg-surface-container-low border-none rounded-xl p-4 text-on-surface placeholder:text-outline font-medium focus:ring-2 focus:ring-primary transition-all"
                      placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('signup.selectRole')}</label>
                    <div className="flex flex-wrap gap-2">
                      {['worker', 'hirer', 'lender'].map((role) => (
                        <button key={role}
                          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 capitalize ${selectedRole === role ? 'bg-primary text-on-primary ambient-shadow' : 'border border-outline-variant bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:border-primary/30'}`}
                          type="button" onClick={() => setSelectedRole(role)}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6">
                    <button type="submit" disabled={loading}
                      className="block w-full text-center bg-primary text-on-primary py-4 rounded-xl font-bold text-lg ambient-shadow hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                      {loading ? t('signup.sendingOtp') : t('signup.continueEmail')}
                    </button>
                  </div>
                </form>
                <footer className="mt-10 pt-8 border-t border-outline-variant/20 text-center">
                  <p className="text-on-surface-variant font-medium">
                    {t('signup.alreadyAccount')}
                    <Link className="text-primary font-bold hover:underline underline-offset-4 decoration-2 ml-1" to="/login">{t('common.login')}</Link>
                  </p>
                </footer>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md p-10 md:p-14 rounded-3xl ambient-shadow border border-outline-variant/10 bg-white">
                <button onClick={() => { setStep(1); setOtp(''); setError(''); }}
                  className="flex items-center gap-2 text-on-surface-variant hover:text-primary text-sm font-semibold mb-8 transition-colors group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  {t('common.back')}
                </button>
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-primary mb-2">{t('signup.checkEmail')}</h2>
                  <p className="text-on-surface-variant font-medium">{t('signup.sentCode')}</p>
                  <p className="text-primary font-bold mt-1">{email}</p>
                </div>
                {error && <p className="mb-6 text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg text-center">{error}</p>}
                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">{t('signup.enterOtp')}</label>
                    <OtpInput value={otp} onChange={setOtp} />
                  </div>
                  <button type="submit" disabled={loading || otp.length < 6}
                    className="block w-full text-center bg-primary text-on-primary py-4 rounded-xl font-bold text-lg ambient-shadow hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? t('signup.verifying') : t('signup.verifyCreate')}
                  </button>
                </form>
                <div className="mt-8 text-center">
                  <p className="text-on-surface-variant text-sm mb-2">{t('signup.didntReceive')}</p>
                  <button onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline underline-offset-4 decoration-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? t('signup.resendIn', { count: resendCooldown }) : t('signup.resendOtp')}
                  </button>
                </div>
                <p className="mt-6 text-center text-xs text-on-surface-variant/60 font-medium">{t('signup.otpExpires')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-10 py-8 hidden lg:block pointer-events-none">
        <div className="max-w-7xl mx-auto px-12 flex items-center justify-start gap-8 pointer-events-auto">
          <a className="flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors group" href="#">
            <HelpCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{t('common.helpCenter')}</span>
          </a>
          <a className="flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors group" href="#">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{t('common.privacyPolicy')}</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Signup;