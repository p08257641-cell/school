import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  MessageSquare,
  Users,
  BarChart3,
  Smartphone,
  Mail,
  Lock,
  X,
  MessageCircle,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import kasanowLogo from '../image/logo.jpg';
import ohenebaLogo from '../image/oheneba_logo.png';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';
import { registerPartner, loginPartner, requestDemo } from '../lib/api';
import { UserRole } from '../types';
import { Modal } from './UI';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: (role: UserRole, user: any) => void;
  onPartnerLogin?: () => void;
}

export default function LandingPage({ onGetStarted, onLogin, onPartnerLogin }: LandingPageProps) {
  const { language, setLanguage, currency, t } = useLanguage();
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [isPartnerSubmitted, setIsPartnerSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState(0); // 0: Home, 1: Solutions, 2: Pricing
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isDemoSubmitted, setIsDemoSubmitted] = useState(false);
  const [demoData, setDemoData] = useState({ school_name: '', contact_email: '' });
  const [demoLoading, setDemoLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms'>('privacy');

  // Partner Lead Form State
  const [partnerLeadData, setPartnerLeadData] = useState({
    email: '',
    company_name: '',
    country: '',
    acceptedTerms: false
  });
  const [partnerLoading, setPartnerLoading] = useState(false);

  useEffect(() => {
    // Scroll to top when section changes
    const mainEl = document.getElementById('landing-main-content');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeSection]);

  const handlePolicyClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const text = target.textContent?.toLowerCase() || '';
      if (text.includes('privacy') || text.includes('confidentialité') || text.includes('privacidade') || text.includes('faragha') || text.includes('خصوصية')) {
        setPolicyType('privacy');
        setShowPolicyModal(true);
      } else {
        setPolicyType('terms');
        setShowPolicyModal(true);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const parallaxVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans selection:bg-indigo-100 selection:text-indigo-900 relative flex flex-col">
      {/* Gradient Background Elements */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu"
      >
        <motion.div
          animate="animate"
          variants={parallaxVariants}
          className="absolute top-[10%] left-[5%] w-32 md:w-64 h-32 md:h-64 bg-indigo-500/5 blur-[60px] md:blur-[100px] rounded-full"
        />
        <motion.div
          animate="animate"
          variants={{
            animate: {
              y: [0, 30, 0],
              transition: { duration: 7, repeat: Infinity, ease: "easeInOut" }
            }
          }}
          className="absolute bottom-[10%] right-[5%] w-48 md:w-96 h-48 md:h-96 bg-emerald-500/5 blur-[80px] md:blur-[120px] rounded-full"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-[1px] border-zinc-100/50 dark:border-zinc-800/20 [mask-image:radial-gradient(circle,white,transparent_70%)]" />
      </motion.div>

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/skoola_icon.png"
              alt="Skoola"
              className="w-12 h-12 md:w-16 md:h-16 object-contain group-hover:rotate-12 transition-transform"
            />
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex items-center gap-4 md:gap-6">
              <button
                onClick={() => setActiveSection(0)}
                className={cn("text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors", activeSection === 0 ? "text-indigo-600" : "text-zinc-400 hover:text-zinc-600")}
              >
                {t('navbar_home')}
              </button>
              <button
                onClick={() => setActiveSection(1)}
                className={cn("text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors", activeSection === 1 ? "text-indigo-600" : "text-zinc-400 hover:text-zinc-600")}
              >
                {t('navbar_solutions')}
              </button>
              <button
                onClick={() => setActiveSection(2)}
                className={cn("text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors", activeSection === 2 ? "text-indigo-600" : "text-zinc-400 hover:text-zinc-600")}
              >
                {t('navbar_pricing')}
              </button>
              <button
                onClick={onPartnerLogin}
                className="text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Partner Login
              </button>
            </div>

            <div className="relative group flex items-center">
              <button className="flex items-center gap-1 text-zinc-500 hover:text-indigo-600 transition-colors">
                <Globe className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest hidden sm:inline-block">{language}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {['en', 'fr', 'pt', 'sw', 'ar'].map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang as any)} className="block w-full text-left px-4 py-2 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 uppercase">
                    {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : lang === 'pt' ? 'Português' : lang === 'sw' ? 'Swahili' : 'العربية'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="px-4 md:px-5 py-1.5 md:py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {t('navbar_sign_in')}
            </button>
          </div>
        </div>
      </nav>

      <main
        id="landing-main-content"
        className="relative pt-14 md:pt-16 transform-gpu flex-1"
      >
        <AnimatePresence mode="wait">
          {activeSection === 0 ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="w-full relative"
            >
              {/* Hero Centered Section */}
              <div className="max-w-7xl mx-auto px-6 md:px-6 min-h-[calc(100vh-theme(spacing.20))] flex flex-col justify-center py-10 relative overflow-hidden">
                {/* Decorative Background Glows */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <motion.div
                    animate={{ y: [0, -40, 0], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, 40, 0], opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full"
                  />
                </div>

                <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 lg:gap-16 relative z-10 w-full max-w-5xl mx-auto mt-4 md:mt-0">
                  {/* Hero Header Area (Plain Text, Side-by-Side) */}
                  <div className="flex-1 w-full md:w-[55%] md:max-w-[500px] space-y-4 md:space-y-8 flex flex-col items-start text-left">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-900/30"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{t('next_gen_platform')}</span>
                    </motion.div>

                    <h1 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[0.95] md:leading-[0.9]" dangerouslySetInnerHTML={{ __html: t('hero_title').replace('School', '<span class="text-indigo-600">School</span>').replace('école', '<span class="text-indigo-600">école</span>').replace('escola', '<span class="text-indigo-600">escola</span>').replace('Shule', '<span class="text-indigo-600">Shule</span>').replace('مدرستك', '<span class="text-indigo-600">مدرستك</span>') }} />

                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed hidden sm:block">
                      {t('hero_subtitle')}
                    </p>

                    <div className="flex flex-wrap gap-2 md:gap-4 pt-2 w-full">
                      <button
                        onClick={onGetStarted}
                        className="flex-1 sm:flex-none px-5 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold text-[11px] sm:text-sm hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                      >
                        {t('get_started')}
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 w-full sm:w-auto">
                      <div className="flex -space-x-2 md:-space-x-3">
                        {[1, 2, 3].map(i => (
                          <img
                            key={i}
                            src={`https://picsum.photos/seed/user${i}/100/100`}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-zinc-950 object-cover"
                            referrerPolicy="no-referrer"
                            alt="User"
                          />
                        ))}
                      </div>
                      <div className="text-[10px] md:text-xs">
                        <p className="font-black leading-tight">{t('join_schools')}</p>
                        <p className="text-zinc-400">{t('trusted_globally')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Grow with Skoola Card */}
                  <div className="relative w-full md:w-[45%] flex-1 md:max-w-[420px] mt-4 md:mt-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-4 md:p-6">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <Users className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                        </div>
                      </div>

                      <div className="space-y-4 md:space-y-6">
                        <div>
                          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1 md:mb-2">{t('partner_program')}</p>
                          <h3 className="text-2xl md:text-3xl font-black leading-tight">{t('grow_with_omnischool')}</h3>
                          <p className="text-xs md:text-sm text-zinc-500 mt-1 md:mt-2">{t('partner_description')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                          <div className="p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl md:rounded-2xl border border-zinc-100 dark:border-zinc-700">
                            <p className="text-[8px] md:text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1">{t('total_rewards')}</p>
                            <p className="text-lg md:text-xl font-black">{currency} 24.5k</p>
                          </div>
                          <div className="p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl md:rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                            <p className="text-[8px] md:text-[9px] text-indigo-600 font-bold uppercase tracking-widest mb-1">{t('active_schools')}</p>
                            <p className="text-lg md:text-xl font-black">12</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsPartnerSubmitted(false);
                            setShowPartnerModal(true);
                          }}
                          className="w-full py-3 md:py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          {t('become_a_partner')}
                        </button>
                      </div>

                      {/* Decorative Parallax Circles */}
                      <motion.div
                        animate={{ y: [0, 10, 0], x: [0, 5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -bottom-10 -right-10 w-24 md:w-32 h-24 md:h-32 bg-indigo-500/10 rounded-full blur-2xl"
                      />
                    </motion.div>

                    {/* Floating Stats */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="hidden sm:flex absolute -top-4 -left-4 md:-top-6 md:-left-6 p-3 md:p-4 bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 items-center gap-2 md:gap-3"
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 md:w-4 md:h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[7px] md:text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Attendance</p>
                        <p className="text-xs md:text-sm font-black">98.4%</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

              </div>

              {/* Partners Section (Infinite Marquee) */}
              <div className="py-8 md:py-16 border-t border-zinc-100 dark:border-zinc-800/50 text-center overflow-hidden relative z-10 bg-zinc-50/50 dark:bg-zinc-900/50">
                <p className="text-xs md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-8 md:mb-12 opacity-80">{t('strategic_partners')}</p>

                <div className="relative flex overflow-hidden group py-4">
                  <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="flex items-center gap-12 md:gap-32 whitespace-nowrap min-w-full"
                  >
                    {[...Array(4)].map((_, i) => (
                      <React.Fragment key={i}>
                        <div className="flex items-center gap-4 group/partner cursor-default opacity-60 hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden flex items-center justify-center border border-blue-100/50 dark:border-blue-800/50 group-hover/partner:scale-110 group-hover/partner:-rotate-6 transition-all duration-500 shadow-lg shadow-blue-500/5">
                            <img src={kasanowLogo} alt="Kasanow Logo" className="w-full h-full object-contain" />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm md:text-base font-black tracking-tight uppercase leading-none text-zinc-900 dark:text-white">Kasanow</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">SMS</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 group/partner cursor-default opacity-60 hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden flex items-center justify-center border border-amber-100/50 dark:border-amber-800/50 group-hover/partner:scale-110 group-hover/partner:rotate-6 transition-all duration-500 shadow-lg shadow-amber-500/5">
                            <img src={ohenebaLogo} alt="Oheneba Media Logo" className="w-full h-full object-contain" />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm md:text-base font-black tracking-tight uppercase leading-none text-zinc-900 dark:text-white">Oheneba</span>
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Media</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 group/partner cursor-default opacity-60 hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-800/50 group-hover/partner:scale-110 group-hover/partner:-rotate-6 transition-all duration-500 shadow-lg shadow-indigo-500/5">
                            <Globe className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm md:text-base font-black tracking-tight uppercase leading-none text-zinc-900 dark:text-white">EduGlobal</span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Network</span>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </motion.div>

                  {/* Gradient Masks */}
                  <div className="absolute inset-y-0 left-0 w-32 md:w-48 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-32 md:w-48 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
                </div>
              </div>
            </motion.div>
          ) : activeSection === 1 ? (
            <motion.div
              key="solutions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="max-w-7xl mx-auto px-6 md:px-6 py-20 md:py-32"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {[
                  { icon: Shield, title: t('feature_secure_data_title'), desc: t('feature_secure_data_desc') },
                  { icon: Zap, title: t('feature_performance_title'), desc: t('feature_performance_desc') },
                  { icon: Globe, title: t('feature_multi_school_title'), desc: t('feature_multi_school_desc') },
                  { icon: Smartphone, title: t('feature_mobile_title'), desc: t('feature_mobile_desc') },
                  { icon: BarChart3, title: t('feature_ai_insights_title'), desc: t('feature_ai_insights_desc') },
                  { icon: MessageSquare, title: t('feature_chat_title'), desc: t('feature_chat_desc') }
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] hover:border-indigo-500/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group cursor-default"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm">
                      <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h3 className="font-extrabold text-lg md:text-xl mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : activeSection === 2 ? (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="max-w-7xl mx-auto px-6 md:px-6 py-20 md:py-32"
            >
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-5xl font-black tracking-tight mb-4">{t('pricing_title')}</h2>
                <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                  {t('pricing_subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {[
                  {
                    name: t('starter_plan'),
                    features: [
                      t('students_limit').replace('{count}', '200'),
                      t('basic_attendance'),
                      t('gradebook'),
                      t('parent_portal_feature'),
                      'Simple Fee Tracking',
                      'Automated Email Alerts',
                      'Secure Cloud Backups'
                    ]
                  },
                  {
                    name: t('professional_plan'),
                    popular: true,
                    features: [
                      t('students_limit').replace('{count}', '1000'),
                      t('finance_mgmt'),
                      t('hr_payroll'),
                      t('mobile_app_access'),
                      'Advanced Academic Analytics',
                      'Transport & Hostel Management',
                      'Fee Collection',
                      'Teacher Lesson Planning'
                    ]
                  },
                  {
                    name: t('enterprise_plan'),
                    features: [
                      t('unlimited_students'),
                      t('multi_campus_support'),
                      t('custom_ai_insights'),
                      t('priority_support'),
                      'Custom Report Card Engine',
                      'API Access & Integrations',
                      'Dedicated Account Manager',
                      'White-label Custom Branding'
                    ]
                  }
                ].map((plan, i) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "p-6 md:p-10 bg-white dark:bg-zinc-900 border rounded-[2rem] md:rounded-[3rem] shadow-xl relative overflow-hidden flex flex-col hover:scale-[1.03] hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group",
                      plan.popular ? "border-indigo-400 ring-4 ring-indigo-500/10" : "border-zinc-100 dark:border-zinc-800"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg ring-4 ring-indigo-600/20">
                        {t('top_choice')}
                      </div>
                    )}
                    <h3 className="text-2xl md:text-3xl font-black mb-3 group-hover:text-indigo-600 transition-colors">{plan.name}</h3>
                    <div className="mb-6">
                      <p className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">{t('type')}</p>
                      <p className="text-2xl md:text-3xl font-black text-indigo-600 italic">{t('contact_for_quote')}</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map(feature => (
                        <li key={feature} className="flex items-center gap-2 text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        setIsDemoSubmitted(false);
                        setShowDemoModal(true);
                      }}
                      className={cn(
                        "w-full py-4 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all hover:scale-[1.02] active:scale-[0.98]",
                        plan.popular ? "bg-indigo-600 text-white" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      )}
                    >
                      {t('request_demo')}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Bottom Marquee / Footer Bar */}
      {activeSection === 0 && (
        <div className="w-full py-3 md:py-4 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-t border-zinc-200/50 dark:border-zinc-800/50 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-6 md:px-6 flex items-center justify-between text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <p>{t('all_rights_reserved')}</p>
            <div className="flex gap-4 md:gap-6">
              <button
                onClick={(e) => { e.preventDefault(); setPolicyType('privacy'); setShowPolicyModal(true); }}
                className="hover:text-indigo-600 transition-colors"
              >
                {t('privacy')}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setPolicyType('terms'); setShowPolicyModal(true); }}
                className="hover:text-indigo-600 transition-colors"
              >
                {t('terms')}
              </button>
              <a href="mailto:hello@bytzforge.com" className="hidden sm:block hover:text-indigo-600 transition-colors">{t('support')}</a>
            </div>
          </div>
        </div>
      )}

      {/* Partner Modal */}
      <AnimatePresence>
        {showPartnerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPartnerModal(false)}
              className="absolute inset-0 bg-zinc-950/90"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setShowPartnerModal(false)}
                className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 md:p-12 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {!isPartnerSubmitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 md:space-y-6"
                    >
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto">
                          <Users className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                          {t('become_a_partner')}
                        </h3>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                          {t('join_partner_desc')}
                        </p>
                      </div>

                      <form
                        className="space-y-3 md:space-y-4 text-left"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!partnerLeadData.acceptedTerms) {
                            (window as any).showToast?.('Please accept the terms and conditions', 'error');
                            return;
                          }
                          setPartnerLoading(true);
                          // Simulate a submission for lead generation
                          setTimeout(() => {
                            setPartnerLoading(false);
                            setIsPartnerSubmitted(true);
                          }, 1500);
                        }}
                      >
                        <div>
                          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-3 md:ml-4 mb-1 block">{t('company_name')}</label>
                          <input
                            required
                            type="text"
                            value={partnerLeadData.company_name}
                            onChange={e => setPartnerLeadData({ ...partnerLeadData, company_name: e.target.value })}
                            className="w-full px-5 md:px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            placeholder="e.g. Acme Solutions"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-3 md:ml-4 mb-1 block">{t('business_email')}</label>
                          <input
                            required
                            type="email"
                            value={partnerLeadData.email}
                            onChange={e => setPartnerLeadData({ ...partnerLeadData, email: e.target.value })}
                            className="w-full px-5 md:px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            placeholder="partners@acme.com"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-3 md:ml-4 mb-1 block">{t('country')}</label>
                          <input
                            required
                            type="text"
                            value={partnerLeadData.country}
                            onChange={e => setPartnerLeadData({ ...partnerLeadData, country: e.target.value })}
                            className="w-full px-5 md:px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            placeholder="e.g. Ghana"
                          />
                        </div>

                        <div className="flex items-start gap-3 px-1 py-2">
                          <input
                            required
                            type="checkbox"
                            id="terms"
                            checked={partnerLeadData.acceptedTerms}
                            onChange={e => setPartnerLeadData({ ...partnerLeadData, acceptedTerms: e.target.checked })}
                            className="mt-1 w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <label
                            htmlFor="terms"
                            onClick={handlePolicyClick}
                            className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium cursor-pointer"
                            dangerouslySetInnerHTML={{ __html: t('agree_terms').replace('{terms}', `<a href="#" class="policy-link text-emerald-600 font-bold hover:underline">${t('partner_terms')}</a>`).replace('{privacy}', `<a href="#" class="policy-link text-emerald-600 font-bold hover:underline">${t('privacy')}</a>`) }}
                          />

                        </div>

                        <button
                          type="submit"
                          disabled={partnerLoading}
                          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                          {partnerLoading ? t('submitting') : t('apply_partnership')}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-6 py-8"
                    >
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">{t('application_received')}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {t('application_success_msg')}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPartnerModal(false)}
                        className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                      >
                        Close
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Demo Request Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-zinc-950/90"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 md:p-12 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {!isDemoSubmitted ? (
                    <motion.div
                      key="demo-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center space-y-4 md:space-y-6"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto">
                        <Zap className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight">{t('request_demo')}</h3>
                      <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                        {t('request_demo_desc')}
                      </p>

                      <form
                        className="space-y-3 md:space-y-4 text-left"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!demoData.school_name || !demoData.contact_email) return;
                          setDemoLoading(true);
                          try {
                            await requestDemo(demoData);
                            setIsDemoSubmitted(true);
                          } catch (error) {
                            console.error('Demo request failed:', error);
                            (window as any).showToast?.('Failed to request demo. Please try again.', 'error');
                          } finally {
                            setDemoLoading(false);
                          }
                        }}
                      >
                        <div>
                          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-3 md:ml-4 mb-1 md:mb-2 block">{t('school_name')}</label>
                          <input
                            required
                            type="text"
                            className="w-full px-5 md:px-6 py-3 md:py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="St. Andrews Academy"
                            value={demoData.school_name}
                            onChange={(e) => setDemoData({ ...demoData, school_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-3 md:ml-4 mb-1 md:mb-2 block">{t('contact_email')}</label>
                          <input
                            required
                            type="email"
                            className="w-full px-5 md:px-6 py-3 md:py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="admin@school.com"
                            value={demoData.contact_email}
                            onChange={(e) => setDemoData({ ...demoData, contact_email: e.target.value })}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={demoLoading}
                          className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {demoLoading ? 'Submitting...' : t('schedule_demo')}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="demo-success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-6 py-8"
                    >
                      <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">Demo Requested!</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          We've received your request. One of our education specialists will reach out to you within 24 hours to schedule your demo.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDemoModal(false)}
                        className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                      >
                        Close
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title={policyType === 'privacy' ? t('privacy_policy_title') : t('partner_terms_title')}
      >
        <div className="space-y-6 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
          <p>
            {policyType === 'privacy' ? t('privacy_policy_content') : t('partner_terms_content')}
          </p>
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <a
              href={policyType === 'privacy' ? '/Skoola_Privacy_Policy.pdf' : '/Skoola_Terms_of_Service.pdf'}
              download={policyType === 'privacy' ? 'Skoola_Privacy_Policy.pdf' : 'Skoola_Terms_of_Service.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"></path>
              </svg>
              {policyType === 'privacy' ? 'Download Official Privacy Policy (PDF)' : 'Download Official Terms of Service (PDF)'}
            </a>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      {activeSection !== 0 && (
        <footer className="border-t border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
                <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">Skoola</span>
              </div>

              <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-400">
                <button onClick={() => { setPolicyType('privacy'); setShowPolicyModal(true); }} className="hover:text-indigo-600 transition-colors">{t('privacy_policy_title')}</button>
                <button onClick={() => { setPolicyType('terms'); setShowPolicyModal(true); }} className="hover:text-indigo-600 transition-colors">{t('partner_terms_title')}</button>
                <a href="mailto:hello@bytzforge.com" className="hover:text-indigo-600 transition-colors">{t('support')}</a>
              </div>

              <p className="text-[10px] md:text-xs text-zinc-400 font-medium">
                © 2026 Skoola. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
