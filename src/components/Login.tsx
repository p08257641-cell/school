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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Background Image - static (no fade-in animation on load) */}
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: 'url(/school_login_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* White gradient overlay to fade the image into the white background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white via-white/50 to-white/10" />

      {/* Login Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Logo / Header */}
        <div className="text-center mb-6 flex flex-col items-center gap-3">
          {organization?.logo ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              src={organization.logo}
              alt={organization.name}
              className="h-20 w-auto object-contain mx-auto drop-shadow-md"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-100"
            >
              <Zap className="w-7 h-7" />
            </motion.div>
          )}

          {/* Only show heading for non-subdomain (generic) login */}
          {!organization && (
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-black tracking-tight text-zinc-900"
            >
              {t('login_welcome')}
            </motion.h1>
          )}

          {organization && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-zinc-800 text-sm font-semibold tracking-wide"
            >
              {organization.name}
            </motion.p>
          )}

          {!organization && (
            <p className="text-zinc-500 text-sm">
              {t('login_tagline')}
            </p>
          )}
        </div>

        {/* Light Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-[2rem] p-8 shadow-2xl shadow-indigo-950/5">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4 mb-1 block">
                {t('email_or_phone')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/60 border border-zinc-200/60 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-zinc-800 placeholder-zinc-400/80 backdrop-blur-sm"
                  placeholder={t('email_or_phone') + '...'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-4 mr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">
                  {t('password')}
                </label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 transition-colors">
                  {t('forgot_password')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/60 border border-zinc-200/60 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-zinc-800 placeholder-zinc-400/80 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
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
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
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

          <div className="mt-7 pt-7 border-t border-zinc-100 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 mb-4">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">{t('secure_auth')}</span>
            </div>
            {organization ? (
              <p className="text-xs text-zinc-500">
                Need help? Contact your school administrator.
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                {t('no_account')}{' '}
                <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">
                  {t('contact_sales')}
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
