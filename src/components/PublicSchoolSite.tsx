import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { submitPublicInquiry } from '../lib/api';
import {
  GraduationCap, Phone, Mail, MapPin, ArrowRight,
  CheckCircle2, LogIn, ChevronDown, Menu, X, Send,
  BookOpen, Users, Award, Shield
} from 'lucide-react';

interface PublicSchoolSiteProps {
  organization: any;
  onGoToLogin: () => void;
}

export default function PublicSchoolSite({ organization, onGoToLogin }: PublicSchoolSiteProps) {
  const [bgIndex, setBgIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    grade: '',
    parent_name: '',
    email: '',
    contact: '',
    message: '',
  });

  // Parse background images (same logic as Login.tsx)
  const bgImages: string[] = React.useMemo(() => {
    if (organization?.background_images) {
      try {
        const parsed = Array.isArray(organization.background_images)
          ? organization.background_images
          : JSON.parse(organization.background_images);
        if (parsed.length > 0) return parsed;
      } catch { /* ignore */ }
    }
    if (organization?.background_image) return [organization.background_image];
    return [];
  }, [organization]);

  // Slideshow rotation
  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % bgImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bgImages]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitPublicInquiry({ ...form, org_id: organization.id });
      setSubmitted(true);
      setForm({ name: '', grade: '', parent_name: '', email: '', contact: '', message: '' });
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const schoolName = organization?.name || 'Our School';
  const schoolEmail = organization?.email || null;
  const schoolContact = organization?.contact_number || null;
  const schoolAddress = organization?.address || null;

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            {organization?.logo ? (
              <img src={organization.logo} alt={schoolName} className="h-9 w-auto object-contain" />
            ) : (
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-black text-zinc-900 text-base tracking-tight truncate max-w-[180px]">
              {schoolName}
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-500">
            <button onClick={() => scrollTo('about')} className="hover:text-zinc-900 transition-colors">About</button>
            <button onClick={() => scrollTo('apply')} className="hover:text-zinc-900 transition-colors">Admissions</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-zinc-900 transition-colors">Contact</button>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              id="portal-login-btn"
              onClick={onGoToLogin}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Portal Login</span>
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100"
              onClick={() => setMenuOpen(v => !v)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden bg-white border-t border-zinc-100 px-5 py-4 flex flex-col gap-4 text-sm font-semibold text-zinc-600"
            >
              <button onClick={() => scrollTo('about')} className="text-left hover:text-zinc-900">About</button>
              <button onClick={() => scrollTo('apply')} className="text-left hover:text-zinc-900">Admissions</button>
              <button onClick={() => scrollTo('contact')} className="text-left hover:text-zinc-900">Contact</button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-16">
        {/* Slideshow background */}
        <div className="absolute inset-0 z-0 bg-zinc-900">
          {bgImages.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: idx === bgIndex ? 0.55 : 0 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/40 to-zinc-900/80" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          {organization?.logo && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              src={organization.logo}
              alt={schoolName}
              className="h-20 w-auto object-contain mx-auto mb-6 drop-shadow-2xl"
            />
          )}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4"
          >
            {schoolName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg md:text-xl text-white/75 font-medium mb-10 max-w-xl mx-auto"
          >
            Shaping the next generation of leaders through quality education, values, and excellence.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              id="apply-now-hero-btn"
              onClick={() => scrollTo('apply')}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-base shadow-2xl shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95"
            >
              Apply for Admission <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-base backdrop-blur-sm border border-white/20 transition-all"
            >
              Learn More <ChevronDown className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/50"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────── */}
      <section className="bg-indigo-600 py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { icon: Users, label: 'Students', value: '500+' },
            { icon: BookOpen, label: 'Programmes', value: '12+' },
            { icon: Award, label: 'Years of Excellence', value: '20+' },
            { icon: Shield, label: 'Certified Staff', value: '100%' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="w-6 h-6 text-indigo-200 mb-1" />
              <p className="text-2xl font-black">{value}</p>
              <p className="text-sm text-indigo-200 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3 block">Who We Are</span>
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight mb-5 leading-tight">
                About {schoolName}
              </h2>
              <p className="text-zinc-500 text-base leading-relaxed mb-6">
                We are a forward-thinking educational institution committed to providing an exceptional learning environment
                where every student can discover their potential and thrive academically, socially, and morally.
              </p>
              <p className="text-zinc-500 text-base leading-relaxed mb-8">
                Our dedicated faculty, modern facilities, and holistic curriculum ensure that students receive a world-class
                education that prepares them for a rapidly changing world.
              </p>
              <button
                onClick={() => scrollTo('apply')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                Apply Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Academic Excellence', desc: 'Rigorous curriculum designed for top performance.' },
                { title: 'Safe Environment', desc: 'A secure, nurturing space for every learner.' },
                { title: 'Skilled Teachers', desc: 'Certified, passionate, and dedicated educators.' },
                { title: 'Modern Facilities', desc: 'Labs, libraries, and tech-enabled classrooms.' },
              ].map(card => (
                <div key={card.title} className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h4 className="font-bold text-zinc-900 text-sm mb-1">{card.title}</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ADMISSION FORM ──────────────────────────────────── */}
      <section id="apply" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3 block">Admissions</span>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight mb-4">
              Apply for Admission
            </h2>
            <p className="text-zinc-500 text-base">
              Fill out the form below and our admissions team will be in touch shortly.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-100 rounded-3xl p-10 text-center"
            >
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-zinc-900 mb-2">Application Received!</h3>
              <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">
                Thank you for your interest in {schoolName}. Our admissions team will contact you soon.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all"
              >
                Submit Another
              </button>
            </motion.div>
          ) : (
            <form
              id="admission-inquiry-form"
              onSubmit={handleSubmit}
              className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl shadow-zinc-100 space-y-5"
            >
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Student Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Grade / Class Applying For</label>
                  <input
                    type="text"
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    placeholder="e.g. Grade 7, JHS 1"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Parent / Guardian Name</label>
                  <input
                    type="text"
                    name="parent_name"
                    value={form.parent_name}
                    onChange={handleChange}
                    placeholder="e.g. Mr. James Doe"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Parent Phone *</label>
                  <input
                    type="tel"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    required
                    placeholder="e.g. +233 24 000 0000"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Parent Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="parent@email.com"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Message (Optional)</label>
                  <textarea
                    name="message"
                    rows={3}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Any additional information or questions..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Submit Application <Send className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── CONTACT ─────────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3 block">Get In Touch</span>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-10">Contact Us</h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {schoolContact && (
              <a href={`tel:${schoolContact}`} className="flex items-center gap-3 text-zinc-600 hover:text-indigo-600 transition-colors group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center group-hover:border-indigo-200 transition-colors">
                  <Phone className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="font-semibold text-sm">{schoolContact}</span>
              </a>
            )}
            {schoolEmail && (
              <a href={`mailto:${schoolEmail}`} className="flex items-center gap-3 text-zinc-600 hover:text-indigo-600 transition-colors group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center group-hover:border-indigo-200 transition-colors">
                  <Mail className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="font-semibold text-sm">{schoolEmail}</span>
              </a>
            )}
            {schoolAddress && (
              <div className="flex items-center gap-3 text-zinc-600">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="font-semibold text-sm">{schoolAddress}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-zinc-900 text-white py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {organization?.logo ? (
              <img src={organization.logo} alt={schoolName} className="h-7 w-auto object-contain brightness-0 invert opacity-70" />
            ) : (
              <GraduationCap className="w-6 h-6 text-zinc-400" />
            )}
            <span className="font-bold text-zinc-300 text-sm">{schoolName}</span>
          </div>
          <p className="text-zinc-500 text-xs">
            © {new Date().getFullYear()} {schoolName}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-xs">Powered by</span>
            <span className="text-indigo-400 font-black text-xs tracking-wide">Skoola</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
