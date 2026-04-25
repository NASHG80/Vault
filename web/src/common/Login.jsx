import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, getWorkerStatus } from '../services/api';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      const { role, id } = data.user;
      if (role === 'hirer') { navigate('/hirer/discovery'); return; }
      if (role === 'lender') { navigate('/lender'); return; }
      if (role === 'admin')  { navigate('/admin/kyc'); return; }
      try {
        const kyc = await getWorkerStatus(id);
        if (kyc.status === 'approved') navigate('/worker/dashboard');
        else if (kyc.status === 'pending') navigate('/worker/kyc-status');
        else if (kyc.status === 'rejected') navigate('/worker/kyc-status');
        else navigate('/worker/kyc-manual');
      } catch (kycErr) {
        navigate('/worker/kyc-manual');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      <section className="hidden md:flex md:w-1/2 bg-surface-container-low p-16 flex-col justify-between items-start border-r border-outline-variant/10">
        <div className="w-full">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-24 flex items-center gap-2">
            <img src="/logo.svg" alt="VAULT logo" className="h-8 w-auto" />
            <span className="text-primary font-bold tracking-tighter text-2xl">{t('common.brand')}</span>
          </motion.div>
          <div className="max-w-md">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="text-[3.5rem] font-extrabold text-primary leading-[1.1] tracking-tight mb-8">
              {t('login.welcomeBack')}
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-on-surface-variant text-lg leading-relaxed mb-12">
              {t('login.tagline')}
            </motion.p>
          </div>
        </div>

        <div className="w-full relative py-12">
          <motion.div initial={{ scale: 0.8, rotate: -5, opacity: 0 }} animate={{ scale: 1, rotate: 3, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="aspect-square w-64 bg-white rounded-2xl ambient-shadow flex items-center justify-center overflow-hidden border border-outline-variant/20">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
            <div className="w-32 h-32 border-4 border-primary/10 rounded-full flex items-center justify-center">
              <div className="w-20 h-20 bg-primary/5 rounded-lg transform rotate-45"></div>
            </div>
            <div className="absolute bottom-4 right-4"><ShieldCheck className="text-primary/20 w-8 h-8" /></div>
          </motion.div>
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }}
            className="absolute -bottom-4 right-12 bg-white p-6 rounded-xl ambient-shadow border border-outline-variant/10">
            <span className="block text-primary font-bold text-3xl tracking-tighter">99.9%</span>
            <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">{t('common.identityUptime')}</span>
          </motion.div>
        </div>

        <footer className="text-[12px] text-on-surface-variant font-medium uppercase tracking-widest mt-auto">
          {t('common.copyright')}
        </footer>
      </section>

      <section className="flex-1 bg-surface-container-lowest flex items-center justify-center p-6 md:p-12 relative">
        {/* Language Switcher — top right */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md">
          <div className="md:hidden mb-12 flex justify-center items-center gap-2">
            <img src="/logo.svg" alt="VAULT logo" className="h-8 w-auto" />
            <span className="text-primary font-bold tracking-tighter text-3xl">{t('common.brand')}</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-lowest p-8 md:p-12 rounded-xl ambient-shadow border border-outline-variant/10">
            <header className="mb-10">
              <h2 className="text-2xl font-bold text-primary tracking-tight mb-2">{t('login.signInTitle')}</h2>
              <p className="text-on-surface-variant text-sm font-medium">{t('login.signInSubtitle')}</p>
              {error && <p className="mt-4 text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
            </header>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="email">{t('login.emailLabel')}</label>
                <input className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/10 text-on-surface placeholder:text-outline/50 text-sm transition-all"
                  id="email" placeholder={t('login.emailPlaceholder')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="password">{t('login.passwordLabel')}</label>
                  <a className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">{t('login.forgotPassword')}</a>
                </div>
                <input className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/10 text-on-surface placeholder:text-outline/50 text-sm transition-all"
                  id="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="pt-4 space-y-4">
                <button className="w-full py-4 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-all active:scale-[0.98] duration-200 disabled:opacity-50" type="submit" disabled={loading}>
                  {loading ? t('login.signingIn') : t('login.loginBtn')}
                </button>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-outline">{t('common.or')}</span>
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                </div>
                <button className="w-full py-4 bg-transparent border border-outline-variant/50 text-primary font-bold rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98] duration-200 flex items-center justify-center gap-3" type="button">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  {t('login.continueGoogle')}
                </button>
              </div>
            </form>
          </motion.div>
          <div className="mt-12 text-center">
            <p className="text-on-surface-variant text-sm font-medium">
              {t('login.noAccount')} <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" to="/signup">{t('login.signUp')}</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;