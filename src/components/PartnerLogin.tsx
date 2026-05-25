import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, PieChart, Users, Building2, XCircle, Send, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useLanguage } from '../lib/LanguageContext';

interface PartnerLoginProps {
  onLoginSuccess?: (data: any) => void;
  onBackToLanding?: () => void;
}

export default function PartnerLogin({ onLoginSuccess, onBackToLanding }: PartnerLoginProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Registration form state
  const [regData, setRegData] = useState({
      name: '',
      email: '',
      password: '',
      contact_number: '',
      company_name: '',
      registration_number: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/partner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok) {
          onLoginSuccess?.(data);
        } else {
          setError(data.message || data.error || 'Invalid credentials');
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response from server:', text.substring(0, 200));
        setError(t('partner_login_failed'));
      }
    } catch (err: any) {
      console.error('Login Fetch Error:', err);
      setError(t('partner_login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setRegLoading(true);
      setRegError('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/partner/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regData)
        });

        if (response.ok) {
            setRegSuccess(true);
        } else {
            const data = await response.json().catch(() => null);
            setRegError(data?.error || data?.message || 'Registration failed');
        }
      } catch (err: any) {
          setRegError('Connection failed.');
      } finally {
          setRegLoading(false);
      }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl relative z-10 transition-colors">
        
        {/* Left Side: Info/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={onBackToLanding}>
              <img src="/assets/schoolhub_icon.png" alt="Logo" className="h-10 w-10 group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                {t('partner_portal')}
              </span>
            </div>
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
              {t('grow_network')} <br />
              <span className="text-indigo-600 dark:text-indigo-400">{t('earn_rewards')}</span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-10 max-w-md">
              {t('partner_description')}
            </p>

            <div className="space-y-6">
              {[
                { icon: <PieChart className="w-5 h-5" />, title: t('real_time_tracking'), desc: t('real_time_tracking_desc') },
                { icon: <ShieldCheck className="w-5 h-5" />, title: t('secure_payouts'), desc: t('secure_payouts_desc') },
                { icon: <Building2 className="w-5 h-5" />, title: t('lead_pipeline'), desc: t('lead_pipeline_desc') }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-zinc-900 dark:text-white font-bold">{item.title}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 mt-8">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium italic">
              {t('partner_quote')}
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center relative bg-white dark:bg-zinc-900">
          <button 
            onClick={onBackToLanding}
            className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition-colors"
          >
            {t('back')}
          </button>
          
          <div className="lg:hidden flex justify-center mb-8" onClick={onBackToLanding}>
            <img src="/assets/schoolhub_full_logo.png" alt="Logo" className="h-16 cursor-pointer hover:scale-105 transition-transform" />
          </div>
          
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">{t('login_to_partner')}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4 mb-1 block">{t('email_address')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-zinc-900 dark:text-white placeholder-zinc-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-4 mr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">{t('password')}</label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 transition-colors">{t('forgot_password')}</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-zinc-900 dark:text-white placeholder-zinc-400"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('sign_in_btn')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            {t('no_account')} <button onClick={() => setIsApplyModalOpen(true)} className="text-indigo-600 font-bold hover:underline">{t('become_a_partner')}</button>
          </p>
        </div>
      </div>

      {/* Become a Partner Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsApplyModalOpen(false)} />
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Become a Partner</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 font-medium">Register your consultancy to start earning immediately.</p>
                    </div>
                    <button 
                        onClick={() => setIsApplyModalOpen(false)}
                        className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {regSuccess ? (
                        <div className="text-center py-12 flex flex-col items-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Application Approved</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
                                Your partner account has been successfully created. You can now securely sign in using your credentials.
                            </p>
                            <button 
                                onClick={() => { setIsApplyModalOpen(false); setRegSuccess(false); }}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6">
                            {regError && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
                                    {regError}
                                </div>
                            )}
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Full Name</label>
                                    <input 
                                        type="text" required
                                        value={regData.name} onChange={(e) => setRegData({...regData, name: e.target.value})}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Email Address</label>
                                    <input 
                                        type="email" required
                                        autoComplete="off"
                                        value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Password</label>
                                    <input 
                                        type="password" required minLength={6}
                                        autoComplete="new-password"
                                        value={regData.password} onChange={(e) => setRegData({...regData, password: e.target.value})}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Contact Number</label>
                                    <input 
                                        type="tel" required
                                        value={regData.contact_number} onChange={(e) => setRegData({...regData, contact_number: e.target.value})}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Company / Agency Name</label>
                                    <input 
                                        type="text" 
                                        value={regData.company_name} onChange={(e) => setRegData({...regData, company_name: e.target.value})}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Company Registration #</label>
                                    <input 
                                        type="text" 
                                        value={regData.registration_number} onChange={(e) => setRegData({...regData, registration_number: e.target.value})}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-white"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-4 rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={regLoading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm disabled:opacity-70"
                                >
                                    {regLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Complete Registration <Send size={16} /></>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

