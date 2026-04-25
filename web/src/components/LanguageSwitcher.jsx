import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

/**
 * Compact language switcher — works on landing, login, signup, and dashboard.
 * @param {'light'|'dark'} variant — 'light' on dark backgrounds, 'dark' (default) on white.
 */
export default function LanguageSwitcher({ variant = 'dark' }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.split('-')[0] || 'en';

  const handleChange = (e) => i18n.changeLanguage(e.target.value);

  const base =
    variant === 'light'
      ? 'bg-white/10 text-white border-white/20 focus:ring-white/20'
      : 'bg-surface-container-low text-on-surface border-outline/10 focus:ring-black/10';

  return (
    <div className="flex items-center gap-1.5">
      <Globe size={14} className={variant === 'light' ? 'text-white/60' : 'text-on-surface-variant'} />
      <select
        value={current}
        onChange={handleChange}
        className={`text-xs font-bold tracking-wide rounded-lg px-2 py-1.5 border cursor-pointer focus:outline-none focus:ring-2 transition-all appearance-none ${base}`}
      >
        <option value="en">EN</option>
        <option value="hi">हिं</option>
        <option value="mr">मरा</option>
      </select>
    </div>
  );
}
