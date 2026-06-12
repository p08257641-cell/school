import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Mail, Lock, ArrowRight, Shield, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { login } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

interface LoginProps {
  onLogin: (role: UserRole, user: any) => void;
  onBack: () => void;
  organization?: any;
}

export default function Login({ onLogin, onBack, organization }: LoginProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user.role, data.user);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || t('login_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8 flex flex-col items-center gap-4">
          {organization?.logo ? (
            <img src={organization.logo} alt={organization.name} className="h-16 w-auto object-contain mx-auto mb-2" />
          ) : (
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-2 shadow-lg shadow-indigo-200">
              <Zap className="w-6 h-6" />
            </div>
          )}
          <h1 className="text-3xl font-black tracking-tight mb-2 text-zinc-900 dark:text-white">
            {organization ? `Sign in to ${organization.name}` : t('login_welcome')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
            {organization ? 'Enter your credentials to access your portal' : t('login_tagline')}
          </p>
          {!organization && (
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              {t('school_name_note')}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4 mb-1 block">{t('email_or_phone')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  placeholder={t('email_or_phone') + '...'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-4 mr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">{t('password')}</label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500">{t('forgot_password')}</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <input type="checkbox" id="remember" className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="remember" className="text-xs text-zinc-500 font-medium">{t('remember_me')}</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('sign_in_btn')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-900/30 mb-4">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{t('secure_auth')}</span>
            </div>
            {organization ? (
              <p className="text-xs text-zinc-500">
                Need help? Contact your school administrator.
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                {t('no_account')} <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">{t('contact_sales')}</button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
