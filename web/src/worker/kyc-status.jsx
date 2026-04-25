import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, XCircle, CheckCircle2, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { getWorkerStatus, getStoredUser } from '../services/api';
import { useTranslation } from 'react-i18next';

export default function KYCStatus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = getStoredUser();
  const [status, setStatus] = useState('pending');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);

  // Poll every 5 s — auto-redirect when approved
  useEffect(() => {
    const check = async () => {
      if (!user?.id) return;
      try {
        const data = await getWorkerStatus(user.id);
        setStatus(data.status);
        if (data.admin_remark) setRemark(data.admin_remark);
        if (data.status === 'approved') {
          setTimeout(() => navigate('/worker/dashboard'), 1500);
        }
      } catch (_) {}
      finally { setLoading(false); }
    };

    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [user?.id, navigate]);

  const Config = {
    pending: {
      icon: Clock,
      iconClass: 'text-amber-500',
      bg: 'bg-amber-50 border-amber-200',
      title: t('kycStatus.pendingTitle'),
      body: t('kycStatus.pendingBody'),
      spinner: true,
    },
    approved: {
      icon: CheckCircle2,
      iconClass: 'text-emerald-500',
      bg: 'bg-emerald-50 border-emerald-200',
      title: t('kycStatus.approvedTitle'),
      body: t('kycStatus.approvedBody'),
      spinner: false,
    },
    rejected: {
      icon: XCircle,
      iconClass: 'text-red-500',
      bg: 'bg-red-50 border-red-200',
      title: t('kycStatus.rejectedTitle'),
      body: remark || t('kycStatus.rejectedBody'),
      spinner: false,
    },
  };

  const cfg = Config[status] || Config.pending;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-[#f9f9fa] flex items-center justify-center px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`bg-white rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.07)] border p-12 w-full max-w-md text-center ${cfg.bg}`}
      >
        {loading ? (
          <Loader2 className="w-12 h-12 animate-spin text-slate-300 mx-auto" />
        ) : (
          <>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className={`w-20 h-20 mx-auto mb-6 ${cfg.iconClass}`} />
            </motion.div>

            <h1 className="text-2xl font-black tracking-tighter mb-3">{cfg.title}</h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">{cfg.body}</p>

            {cfg.spinner && (
              <div className="w-10 h-10 mx-auto rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-6" />
            )}

            {status === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                {t('kycStatus.pollingLabel')}
              </div>
            )}

            {status === 'rejected' && (
              <button id="retry-kyc-btn" onClick={() => navigate('/worker/kyc-manual')}
                className="mt-4 inline-flex items-center gap-2 px-7 py-3 bg-black text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10">
                <RefreshCw className="w-4 h-4" /> {t('kycStatus.resubmit')}
              </button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
