import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Building2, Plus, Search, Filter,
  CheckCircle2, Clock, XCircle, Send, MessageSquare,
  Wallet, TrendingUp, HelpCircle, LogOut, ChevronRight, Layers, Settings,
  Award, Medal, Printer, GraduationCap
} from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useLanguage } from '../lib/LanguageContext';

interface SchoolLead {
  id: string;
  name: string;
  type: string;
  status: string;
  plan: string;
  email?: string;
  contact_number?: string;
  address?: string;
  custom_domain?: string;
  language?: string;
  timezone?: string;
  created_at: string;
}

export default function PartnerDashboard() {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const [partner, setPartner] = useState<any>(null);
  const [schools, setSchools] = useState<SchoolLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organizations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolLead | null>(null);
  const [systemPlans, setSystemPlans] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [payoutSettings, setPayoutSettings] = useState({
    payout_type: 'BANK',
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: '',
    currency: 'GH₵'
  });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState('');

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Primary School',
    email: '',
    contact_number: '',
    address: '',
    custom_domain: '',
    logo: '',
    signature: '',
    plan: 'Professional',
    language: 'en',
    timezone: 'GMT',
    admin_email: '',
    admin_password: 'zxcv123$$'
  });
  const [rewards, setRewards] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/partner/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPartner(data.partner);
        setSchools(data.schools);
        if (data.support_id) setSuperAdminId(data.support_id);
      }

      const plansRes = await fetch(`${API_BASE_URL}/plans`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const plansData = await plansRes.json();
      if (plansData && plansData.length > 0) {
        setSystemPlans(plansData);
        setFormData(prev => ({ ...prev, plan: prev.plan || plansData[0].name }));
      }

      // Fetch Rewards
      const rewardsRes = await fetch(`${API_BASE_URL}/partners/${data.partner.id}/rewards`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/partner/payout-settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayoutSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to fetch payout settings:', err);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/partner/banks`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data);
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchPayoutSettings();
      fetchBanks();
    }
  }, [activeTab]);

  const resolveAccount = async () => {
    if (!payoutSettings.account_number || !payoutSettings.bank_code) return;

    setIsResolving(true);
    setResolutionError('');
    try {
      const res = await fetch(`${API_BASE_URL}/partner/resolve-account?account_number=${payoutSettings.account_number}&bank_code=${payoutSettings.bank_code}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutSettings(prev => ({ ...prev, account_name: data.account_name }));
      } else {
        setResolutionError(data.error || 'Could not resolve account name');
        setPayoutSettings(prev => ({ ...prev, account_name: '' }));
      }
    } catch (err) {
      setResolutionError('Verification service unavailable');
    } finally {
      setIsResolving(false);
    }
  };

  // Auto-resolve when account number reaches 10 digits (common for banks)
  useEffect(() => {
    if (payoutSettings.account_number?.length === 10 && payoutSettings.bank_code) {
      resolveAccount();
    }
  }, [payoutSettings.account_number, payoutSettings.bank_code]);

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/partner/payout-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payoutSettings)
      });
      if (res.ok) {
        if (payoutSettings.currency) {
          setCurrency(payoutSettings.currency);
        }
        await fetchDashboardData(); // Refresh to get new conversion rates and earnings
        (window as any).showToast?.('Settings saved successfully!', 'success');
      } else {
        (window as any).showToast?.('Unable to save settings. Please try again.', 'error');
      }
    } catch (err) {
      (window as any).showToast?.('Unable to connect to the server. Please check your internet connection.', 'error');
    } finally {
      setPayoutLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);

        // Try to identify Super Admin from messages
        const saMsg = data.find((m: any) => m.sender_role === 'SUPER_ADMIN' || m.receiver_role === 'SUPER_ADMIN');
        if (saMsg && !superAdminId) {
          setSuperAdminId(saMsg.sender_role === 'SUPER_ADMIN' ? saMsg.sender_id : saMsg.receiver_id);
        }
      }
    } catch (err) {
      console.error('Message fetch error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !superAdminId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiver_id: superAdminId,
          receiver_role: 'SUPER_ADMIN',
          subject: 'Support Request',
          content: newMessage
        })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/partner/schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsModalOpen(false);
        fetchDashboardData();
        setFormData({
          name: '', type: 'Primary School', email: '', contact_number: '',
          address: '', custom_domain: '', logo: '', signature: '',
          plan: systemPlans[0]?.name || 'Professional', language: 'en', timezone: 'GMT',
          admin_email: '', admin_password: 'zxcv123$$'
        });
      }
    } catch (err) {
      console.error('Error adding school:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/partner/login';
  };

  const handlePrintCertificate = (reward: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate of Achievement - ${partner.name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
            .certificate-container {
              width: 1056px; height: 816px; background: white; padding: 60px; position: relative; box-sizing: border-box;
              box-shadow: 0 20px 50px rgba(0,0,0,0.1); border: 20px solid #1a1a1a;
            }
            .certificate-inner { border: 2px solid #c5a059; height: 100%; width: 100%; box-sizing: border-box; padding: 40px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; }
            .corner { position: absolute; width: 80px; height: 80px; border: 4px solid #c5a059; }
            .top-left { top: -6px; left: -6px; border-right: none; border-bottom: none; }
            .top-right { top: -6px; right: -6px; border-left: none; border-bottom: none; }
            .bottom-left { bottom: -6px; left: -6px; border-right: none; border-top: none; }
            .bottom-right { bottom: -6px; right: -6px; border-left: none; border-top: none; }
            
            .header { margin-top: 40px; }
            .logo { width: 80px; height: 80px; margin-bottom: 20px; }
            .title { font-family: 'Cinzel', serif; font-size: 48px; color: #1a1a1a; margin-bottom: 10px; letter-spacing: 4px; }
            .subtitle { font-size: 18px; color: #c5a059; text-transform: uppercase; letter-spacing: 6px; font-weight: 700; }
            
            .content { margin-top: 50px; flex: 1; }
            .award-text { font-size: 16px; color: #666; margin-bottom: 20px; font-style: italic; }
            .recipient-name { font-family: 'Great Vibes', cursive; font-size: 64px; color: #1a1a1a; margin-bottom: 20px; }
            .achievement-title { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 15px; }
            .description { font-size: 14px; color: #555; max-width: 600px; line-height: 1.6; margin: 0 auto; }
            
            .footer { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; padding: 0 60px; }
            .signature-block { border-top: 1px solid #1a1a1a; padding-top: 10px; width: 200px; text-align: center; }
            .signature-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #a1a1a1; }
            .date-block { font-size: 14px; color: #1a1a1a; font-weight: 600; }
            
            .seal { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: 120px; height: 120px; opacity: 0.1; background: url('/assets/schoolhub_icon.png') no-repeat center; background-size: contain; filter: grayscale(1); }
            
            @media print {
              body { background: none; min-height: auto; width: 1056px; height: 816px; margin: 0; padding: 0; }
              .certificate-container { box-shadow: none; border: 15px solid #1a1a1a; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="certificate-inner">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
              
              <div class="header">
                 <img src="/assets/schoolhub_icon.png" class="logo" />
                 <div class="subtitle">Certificate of Recognition</div>
                 <div class="title">Partner Excellence Award</div>
              </div>
              
              <div class="content">
                <div class="award-text">This esteemed certificate is proudly presented to</div>
                <div class="recipient-name">${partner.name}</div>
                <div class="achievement-title">${reward.title}</div>
                <div class="description">${reward.description || 'Recognized for outstanding contributions and commitment to the growth of the SchoolHub ecosystem. Your partnership has been instrumental in our shared success.'}</div>
                <div style="margin-top: 30px; font-size: 12px; color: #c5a059; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Verified Criteria: ${reward.criteria || 'Strategic Partnership Development'}</div>
              </div>
              
              <div class="footer">
                <div class="date-block">
                   <div class="signature-label">Date Issued</div>
                   <div>${new Date(reward.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
                
                <div class="signature-block">
                   <div style="font-family: 'Great Vibes', cursive; font-size: 24px; margin-bottom: 5px;">SchoolHub Admin</div>
                   <div class="signature-label">Principal Director</div>
                </div>
              </div>
              
              <div class="seal"></div>
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden lg:flex flex-col transition-colors">
        <div className="p-6 flex items-center gap-3">
          <img src="/assets/schoolhub_icon.png" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight">Partner Hub</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'organizations', label: 'My Organizations', icon: <Building2 size={20} /> },
            { id: 'plans', label: 'System Plans', icon: <Layers size={20} /> },
            { id: 'earnings', label: 'Earnings', icon: <Wallet size={20} /> },
            { id: 'achievements', label: 'Achievements', icon: <Award size={20} /> },
            { id: 'chat', label: 'Support Chat', icon: <MessageSquare size={20} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Header */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between transition-colors">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg md:text-xl font-bold truncate">Welcome back, {partner?.name}</h2>
            <p className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">Your Partner ID: <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-500/10 px-1.5 md:px-2 py-0.5 rounded">{partner?.referral_code}</span></p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={18} /> <span className="hidden sm:inline">Add Organization</span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                <Users size={64} />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 uppercase tracking-widest font-black">Total Organizations</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{schools.length}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <TrendingUp size={14} /> <span>+{schools.filter(s => s.status === 'Active').length} Active</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                <Wallet size={64} />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 uppercase tracking-widest font-black">Total Earnings</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white">
                {partner?.currency || currency} {parseFloat(partner?.converted_total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="mt-4 text-zinc-500 dark:text-zinc-500 text-xs font-medium">Finalized on active provisioning</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                <Clock size={64} />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2 uppercase tracking-widest font-black">Pending Leads</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{schools.filter(s => s.status === 'Pending').length}</h3>
              <p className="text-mt-4 text-zinc-500 dark:text-zinc-500 text-xs font-medium">Awaiting super-admin review</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:to-indigo-900 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h4 className="text-white font-black text-lg">Pro Benefits</h4>
                  <p className="text-indigo-100 text-xs mb-4">You're on the premium partner tier (8% comms)</p>
                </div>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold self-start transition-colors border border-white/10"
                >
                  View Tier Details
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'organizations' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Organization Pipeline</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                    />
                  </div>
                  <button className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-widest font-black border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-6 py-4">Organization Name</th>
                      <th className="px-6 py-4">Plan Selected</th>
                      <th className="px-6 py-4">Submission Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {schools.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-zinc-500 dark:text-zinc-400">
                          <Building2 size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                          <p className="font-medium">No organizations yet. Add your first organization to get started!</p>
                        </td>
                      </tr>
                    ) : (
                      schools.map((school) => (
                        <tr key={school.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-zinc-900 dark:text-white">{school.name}</span>
                              <span className="text-xs text-zinc-500">{school.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${school.plan === 'Enterprise' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' :
                              school.plan === 'Professional' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' :
                                'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/20'
                              }`}>
                              {school.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                            {new Date(school.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 text-xs font-bold ${school.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' :
                              school.status === 'Pending' ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                              }`}>
                              {school.status === 'Active' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                              {school.status}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedSchool(school)}
                              className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Financial Overview</h3>
                    <p className="text-zinc-500 text-sm font-medium">Your platform earnings and commission history</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Total Commission</p>
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white">
                      {partner?.currency || currency} {parseFloat(partner?.converted_total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Payout Rate</p>
                    <h4 className="text-2xl font-black text-indigo-600">8.00%</h4>
                  </div>
                  <div className="p-6 rounded-2xl bg-indigo-600 border border-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none">
                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Next Payout</p>
                    <h4 className="text-2xl font-black text-white">{partner?.currency || currency} 0.00</h4>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">Recent Transactions</h3>
                </div>
                <div className="p-12 text-center text-zinc-500">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No transactions found for this period.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6 shadow-sm">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6">System Plans Overview</h3>
              {systemPlans.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <Layers size={48} className="mx-auto mb-4 text-zinc-300" />
                  <p className="text-zinc-500">Fetching available system plans...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {systemPlans.map(plan => {
                    const modules = Array.isArray(plan.modules) ? plan.modules : JSON.parse(plan.modules || '[]');
                    return (
                      <div key={plan.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative flex flex-col hover:border-indigo-500/50 transition-colors">
                        <h4 className="text-2xl font-black mb-2">{plan.name}</h4>
                        <p className="text-xl font-bold text-indigo-600 mb-6">
                          {partner?.currency || currency} {parseFloat((parseFloat(plan.price) * (partner?.exchange_rate || 1.0)).toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <ul className="space-y-3 flex-1 mb-6">
                          {modules.map((m: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Partner Achievements</h3>
                    <p className="text-zinc-500 mt-2 font-medium max-w-md">Your contribution to our ecosystem is valued. Here are your earned recognitions and badges.</p>
                  </div>
                  <div className="flex -space-x-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-amber-600 shadow-xl">
                      <Award size={28} />
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-blue-600 shadow-xl">
                      <Medal size={28} />
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-emerald-600 shadow-xl">
                      <GraduationCap size={28} />
                    </div>
                  </div>
                </div>
              </div>

              {rewards.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-20 text-center">
                  <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award size={40} className="text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Begin Your Achievement Journey</h4>
                  <p className="text-zinc-500 max-w-sm mx-auto mt-2">Refer your first organization to start earning performance badges and certificates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                      {reward.type === 'Certificate' && (
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePrintCertificate(reward)}
                            className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-colors tooltip"
                            title="Print Certificate"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      )}

                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${reward.type === 'Badge' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 shadow-inner' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 shadow-inner'
                        }`}>
                        {reward.type === 'Badge' ? <Award size={32} /> : <Medal size={32} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${reward.type === 'Badge' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {reward.type}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold">{new Date(reward.issued_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-lg font-black text-zinc-900 dark:text-white mb-2 leading-tight">{reward.title}</h4>
                        <p className="text-sm text-zinc-500 font-medium line-clamp-3 mb-4">{reward.description || 'Recognized for excellent performance and dedication.'}</p>

                        {reward.criteria && (
                          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">EVALUATED ON</p>
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{reward.criteria}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[600px] flex flex-col overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">SA</div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">Super Admin Support</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Live Support</p>
                    </div>
                  </div>
                </div>
                {!superAdminId && <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Connecting...</p>}
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-2">
                    <MessageSquare size={48} className="opacity-20" />
                    <p className="text-sm font-medium">Start a conversation with Super Admin support</p>
                  </div>
                ) : (
                  messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((m: any, i: number) => {
                    const isMe = m.direction === 'sent';
                    return (
                      <div key={m.id || i} className={`p-4 rounded-2xl max-w-[80%] text-sm ${isMe
                        ? 'bg-indigo-600 text-white self-end rounded-tr-sm shadow-sm shadow-indigo-200 dark:shadow-none'
                        : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 self-start rounded-tl-sm'
                        }`}>
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-2 opacity-50 ${isMe ? 'text-indigo-100' : 'text-zinc-500'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !superAdminId}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Partner Settings</h3>
                    <p className="text-zinc-500 text-sm font-medium">Manage your payout settings and account preferences</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSavePayout} className="space-y-6">

                {/* Payout Settings Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-zinc-900 dark:text-white">Payout Method</h4>
                      <p className="text-xs text-zinc-500 font-medium">Configure where you receive your commissions</p>
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                      <button
                        onClick={() => setPayoutSettings({ ...payoutSettings, payout_type: 'BANK' })}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${payoutSettings.payout_type === 'BANK' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500'}`}
                      >
                        Bank Account
                      </button>
                      <button
                        onClick={() => setPayoutSettings({ ...payoutSettings, payout_type: 'MOBILE_MONEY' })}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${payoutSettings.payout_type === 'MOBILE_MONEY' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500'}`}
                      >
                        Mobile Money
                      </button>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          {payoutSettings.payout_type === 'BANK' ? 'Select Bank' : 'Select Provider'}
                        </label>
                        <select
                          required
                          value={payoutSettings.bank_code}
                          onChange={(e) => {
                            const bank = banks.find(b => b.code === e.target.value);
                            setPayoutSettings({ ...payoutSettings, bank_code: e.target.value, bank_name: bank?.name || '' });
                          }}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                        >
                          <option value="">Choose a provider...</option>
                          {(banks || []).filter(b => {
                            const isMomo = b.type === 'mobile_money' || b.type === 'momo' || b.name?.toLowerCase().includes('money') || b.name?.toLowerCase().includes('cash') || ['MTN', 'VODAFONE', 'AIRTEL', 'TIGO'].some(p => b.name?.toUpperCase().includes(p));
                            return payoutSettings.payout_type === 'MOBILE_MONEY' ? isMomo : !isMomo;
                          }).map(bank => (
                            <option key={bank.id} value={bank.code}>{bank.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          {payoutSettings.payout_type === 'BANK' ? 'Account Number' : 'Mobile Number'}
                        </label>
                        <div className="relative">
                          <input
                            type="text" required
                            value={payoutSettings.account_number}
                            onChange={(e) => setPayoutSettings({ ...payoutSettings, account_number: e.target.value, account_name: '' })}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                            placeholder={payoutSettings.payout_type === 'BANK' ? 'e.g. 0581234567' : 'e.g. 0244123456'}
                          />
                          {isResolving && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verification Results */}
                    {(payoutSettings.account_name || resolutionError) && (
                      <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${resolutionError ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        }`}>
                        {resolutionError ? (
                          <>
                            <XCircle size={20} className="shrink-0" />
                            <p className="text-sm font-bold">{resolutionError}</p>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={20} className="shrink-0" />
                            <div className="flex-1">
                              <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Verified Account Name</p>
                              <p className="text-sm font-bold">{payoutSettings.account_name}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Currency Preference Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-lg font-black text-zinc-900 dark:text-white">Display Currency</h4>
                    <p className="text-xs text-zinc-500 font-medium">This will be your preferred currency for all earnings and financial reports.</p>
                  </div>
                  <div className="p-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                          System Currency
                          <span className="text-[10px] text-zinc-400 font-normal italic">(Updates your hub preference)</span>
                        </label>
                        <select
                          value={payoutSettings.currency}
                          onChange={(e) => setPayoutSettings({ ...payoutSettings, currency: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                        >
                          <option value="GH₵">Ghana Cedis (GH₵)</option>
                          <option value="NGN">Nigerian Naira (₦)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                          <option value="GBP">British Pound (£)</option>
                          <option value="CFA">CFA Franc (CFA)</option>
                          <option value="ZAR">South African Rand (ZAR)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Submit Footer */}
                <div className="flex justify-end pt-2 pb-4">
                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {payoutLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Settings size={18} />}
                    Save All Settings
                  </button>
                </div>
              </form>

              {/* Security Note */}
              <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl flex items-start gap-3">
                <HelpCircle size={20} className="text-zinc-400 mt-0.5" />
                <p className="text-xs text-zinc-500 font-medium">
                  We use Paystack's secure verification hub to ensure your payout details are valid.
                  Commissions are paid out on the first week of every month to the account verified above.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around p-2 z-40 pb-safe">
        {[
          { id: 'organizations', label: 'Organizations', icon: <Building2 size={24} /> },
          { id: 'plans', label: 'Plans', icon: <Layers size={24} /> },
          { id: 'earnings', label: 'Earnings', icon: <Wallet size={24} /> },
          { id: 'chat', label: 'Support', icon: <MessageSquare size={24} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={24} /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all ${activeTab === item.id
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
          >
            {item.icon}
            <span className="text-[10px] sm:text-xs">{item.label}</span>
          </button>
        ))}
      </nav>
      {/* Modal - Add School */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
              <div className="pr-4">
                <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Provision New Organization</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm mt-1 font-medium">Create a new organization lead. It will be pending until Super Admin approval.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors shrink-0"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAddSchool} className="flex-1 overflow-y-auto">
              <div className="p-6 md:p-8 space-y-8">
                {/* 1. Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Organization Name</label>
                    <input
                      type="text" required
                      value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm"
                      placeholder="e.g. St. Patrick's School"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Organization Type</label>
                    <select
                      value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm"
                    >
                      <option>Primary School</option>
                      <option>High School</option>
                      <option>University</option>
                      <option>Vocational</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Organization Email</label>
                    <input
                      type="email" required
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm"
                      placeholder="info@school.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Admin Email (Login)</label>
                    <input
                      type="email" required
                      value={formData.admin_email} onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm"
                      placeholder="admin@school.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Initial Admin Password</label>
                    <input
                      type="text"
                      readOnly
                      value={formData.admin_password}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-0 dark:text-zinc-400 transition-all text-sm font-mono cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Custom Domain</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={formData.custom_domain} onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                        placeholder="school-name"
                        className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-l-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                      <span className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-700 border border-l-0 border-zinc-200 dark:border-zinc-700 rounded-r-xl text-zinc-500 text-sm">.schoolhub.com</span>
                    </div>
                  </div>
                </div>

                {/* 2. Branding */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Organization Logo</label>
                    <div className="flex items-center gap-4">
                      {formData.logo && (
                        <img src={formData.logo} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                      )}
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Principal's Signature</label>
                    <div className="flex items-center gap-4">
                      {formData.signature && (
                        <img src={formData.signature} alt="Signature" className="w-12 h-12 rounded-lg object-contain border border-zinc-200 dark:border-zinc-700" />
                      )}
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'signature')}
                        className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Location & Support */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Contact Number</label>
                    <input
                      type="tel" required
                      value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Physical Address</label>
                    <textarea
                      rows={1}
                      value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all text-sm resize-none"
                      placeholder="Full address"
                    />
                  </div>
                </div>

                {/* 4. Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Subscription Plan</label>
                    <select
                      value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {systemPlans.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Default Language</label>
                    <select
                      value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="pt">Portuguese</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Time Zone</label>
                    <select
                      value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="GMT">GMT (Accra)</option>
                      <option value="WAT">WAT (Lagos)</option>
                      <option value="CAT">CAT (Kigali)</option>
                    </select>
                  </div>
                </div>

                {/* Plan Preview Module Area */}
                {formData.plan && systemPlans.length > 0 && (() => {
                  const selected = systemPlans.find(p => p.name === formData.plan);
                  if (!selected) return null;
                  const modules = Array.isArray(selected.modules) ? selected.modules : JSON.parse(selected.modules || '[]');
                  return (
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Features included in {selected.name}</h4>
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{currency} {parseFloat(selected.price).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {modules.map((m: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-6 md:p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 shrink-0">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 dark:shadow-none text-center"
                >
                  Provision New Organization lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - School Details */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSchool(null)} />
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
              <div className="flex items-center gap-3 md:gap-4 pr-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
                  {selectedSchool.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight truncate">{selectedSchool.name}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${selectedSchool.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                    <span className={`w-1 h-1 rounded-full ${selectedSchool.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {selectedSchool.status}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSchool(null)}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors shrink-0"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Plan</p>
                  <p className="font-bold text-zinc-900 dark:text-white">{selectedSchool.plan}</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Type</p>
                  <p className="font-bold text-zinc-900 dark:text-white">{selectedSchool.type}</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Contact Email</p>
                  <p className="font-bold text-zinc-900 dark:text-white">{selectedSchool.email || '—'}</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Contact Number</p>
                  <p className="font-bold text-zinc-900 dark:text-white">{selectedSchool.contact_number || '—'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Physical Address</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{selectedSchool.address || 'No address provided'}</p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Access Details</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-bold text-indigo-600">{selectedSchool.custom_domain ? `${selectedSchool.custom_domain}.schoolhub.com` : 'No custom domain'}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md uppercase">{selectedSchool.language || 'en'}</span>
                    <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md uppercase">{selectedSchool.timezone || 'GMT'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedSchool(null)}
                className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-black text-sm hover:opacity-90 transition-opacity"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

