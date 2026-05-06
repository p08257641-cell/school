import React, { useState, useMemo, useEffect } from 'react';
import { HRModules } from './module-views/HRView';
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  School,
  GraduationCap,
  Briefcase,
  BookOpen,
  ClipboardCheck,
  Wallet,
  FileText,
  Calendar,
  Library,
  Bell,
  MapPin,
  Clock,
  Truck,
  Zap,
  Star,
  Check,
  CheckCircle,
  CheckCircle2,
  User,
  UserPlus,
  ChevronRight,
  Bot,
  Settings,
  Gift,
  Download,
  MessageSquare,
  Send,
  History,
  ShoppingCart,
  QrCode,
  Printer,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { cn } from '../lib/utils';
import { Modal } from './UI';
import { DataTable } from './DataTable';
import { verifySMSPurchase, fetchSMSTransactions } from '../lib/api';
import { API_BASE_URL, PAYSTACK_PUBLIC_KEY } from '../constants';
import { motion } from 'motion/react';
import { UserRole, Student, Inquiry, Ward, Book, BorrowRecord } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const pieData = [
  { name: 'Active', value: 400 },
  { name: 'Suspended', value: 300 },
  { name: 'Pending', value: 300 },
];

const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
  onClick?: () => void;
}

function StatCard({ title, value, change, trend, icon: Icon, color, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300",
        onClick && "cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/5 dark:hover:bg-indigo-900/5 scale-100 hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1 uppercase tracking-tight">{value}</h3>
      </div>
    </div>
  );
}



function MessageAlert({ count, onNavigate }: { count: number, onNavigate?: (view: string) => void }) {
  const { t } = useLanguage();
  if (count <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onNavigate?.('Messages')}
      className="p-6 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl shadow-lg shadow-indigo-500/20 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">You have {count} new message{count > 1 ? 's' : ''}</h3>
            <p className="text-indigo-100 text-sm">Click here to view your inbox and respond.</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1">
          <ChevronRight className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function PendingReferralAlert({ count, onNavigate }: { count: number, onNavigate?: (view: string) => void }) {
  if (count <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onNavigate?.('Organizations')}
      className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl shadow-lg cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
            <School className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              {count} Pending Referral{count > 1 ? 's' : ''}
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            </h3>
            <p className="text-amber-600 dark:text-amber-400/80 text-sm font-medium">New school applications require your review and approval.</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1">
          <ChevronRight className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
      </div>
    </motion.div>
  );
}

const checkIsBirthdayTomorrow = (dob: string | Date) => {
  if (!dob) return false;
  const d = new Date(dob);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth();
};

function BirthdayAlert({ items }: { items: { name: string, role: string, isSelf?: boolean }[] }) {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl shadow-lg shadow-rose-500/20 relative overflow-hidden group mb-6"
    >
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              {items.some(i => i.isSelf) ? "Happy Birthday in Advance!" : "Celebrations Tomorrow!"}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {items.map((item, idx) => (
                <span key={idx} className="text-rose-50 px-2 py-0.5 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                  {item.isSelf ? "Your Birthday 🎂" : `${item.name} (${item.role})`}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SuperAdminDashboard({ stats, unreadMessagesCount = 0, onNavigate, organizations = [] }: { stats?: { totalOrganizations: string; activeSubscriptions: string; totalUsers: string; annualRevenue: string }, unreadMessagesCount?: number, onNavigate?: (view: string) => void, organizations?: any[] }) {
  const { currency, t } = useLanguage();
  const pendingCount = organizations.filter(o => o.status === 'Pending').length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
        <PendingReferralAlert count={pendingCount} onNavigate={onNavigate} />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('system_overview')}</h1>
          <p className="text-zinc-500 mt-1">{t('welcome_back_super')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-zinc-800 pr-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            2025/2026
          </div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            System Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_organizations')} value={stats?.totalOrganizations || "1,284"} change="+12.5%" trend="up" icon={Building2} color="bg-indigo-600" />
        <StatCard title={t('active_subscriptions')} value={stats?.activeSubscriptions || "842"} change="+3.2%" trend="up" icon={CreditCard} color="bg-emerald-600" />
        <StatCard title={t('total_users')} value={stats?.totalUsers || "45.2k"} change="-1.4%" trend="down" icon={Users} color="bg-amber-600" />
        <StatCard title={t('annual_revenue')} value={stats?.annualRevenue || `${currency} 1,494,000`} change="+18.7%" trend="up" icon={TrendingUp} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('revenue_growth')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('org_status')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-sm text-zinc-500">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const EXCHANGE_RATES: Record<string, number> = {
  'GH₵': 1.0,
  'GHS': 1.0,
  'USD': 0.075,
  'NGN': 110.0,
  'EUR': 0.07,
  'GBP': 0.06,
  'CFA': 45.0,
  'ZAR': 1.4
};

function SMSPurchasePanel({ organization, onRefresh }: { organization: any, onRefresh?: () => void }) {
  const { currency } = useLanguage();
  const [units, setUnits] = useState(100);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await fetchSMSTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load SMS transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      (window as any).showToast?.('Authentication required.', 'error');
      return;
    }
    const user = JSON.parse(userStr);

    // Attempt to load Paystack script if not present
    if (!(window as any).PaystackPop) {
      try {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      } catch (err) {
        console.error('Failed to load Paystack script:', err);
        (window as any).showToast?.('Could not load payment system. Check your internet connection.', 'error');
        return;
      }
    }

    const publicKey = PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    const PaystackPop = (window as any).PaystackPop;

    if (!publicKey || !PaystackPop) {
      console.error('Paystack initialization check failed:', {
        hasPublicKey: !!publicKey,
        hasPaystackPop: !!PaystackPop,
        envKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
      });
      (window as any).showToast?.(`Payment configuration error. Please contact support.`, 'error');
      return;
    }

    const orgCurrency = organization?.currency || 'GH₵';
    const rate = EXCHANGE_RATES[orgCurrency] || 1.0;
    const unitPriceBase = parseFloat(organization?.sms_unit_price) || 0.1;
    const unitPriceConverted = unitPriceBase * rate;
    const totalAmount = Math.round(units * unitPriceConverted * 100); // in subunits

    setIsProcessing(true);

    const paystackCurrency = (organization?.currency === 'GH₵' || organization?.currency === 'GHS') ? 'GHS' :
      (organization?.currency === '₦' || organization?.currency === 'NGN') ? 'NGN' :
        (organization?.currency === '$' || organization?.currency === 'USD') ? 'USD' :
          organization?.currency || 'GHS';

    console.log('>>> [Paystack] Final Setup Config:', {
      hasKey: !!publicKey,
      email: user.email,
      amount: totalAmount,
      currency: paystackCurrency,
      ref: `SMS-${Math.floor(Math.random() * 1000000000 + 1)}`
    });

    const handler = (window as any).PaystackPop.setup({
      key: publicKey,
      email: user.email,
      amount: totalAmount,
      currency: paystackCurrency,
      ref: `SMS-${Math.floor(Math.random() * 1000000000 + 1)}`,
      metadata: {
        custom_fields: [
          { display_name: "Units", variable_name: "sms_units", value: units },
          { display_name: "Org ID", variable_name: "org_id", value: organization?.id }
        ]
      },
      callback: function (response: any) {
        (async () => {
          try {
            (window as any).showToast?.('Verifying payment...', 'info');
            await verifySMSPurchase(response.reference);
            (window as any).showToast?.('SMS units purchased successfully!', 'success');
            onRefresh?.();
            loadTransactions();
          } catch (err: any) {
            console.error('SMS verify error:', err);
            (window as any).showToast?.(err.response?.data?.error || 'Verification failed', 'error');
          } finally {
            setIsProcessing(false);
          }
        })();
      },
      onClose: () => {
        setIsProcessing(false);
        (window as any).showToast?.('Payment cancelled.', 'info');
      }
    });

    handler.openIframe();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="lg:col-span-1 space-y-6">
        <div className="p-8 bg-zinc-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Buy SMS Units</h3>
                <p className="text-zinc-400 text-xs">Instantly refill your balance</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest block mb-2">Quantity</label>
                <div className="grid grid-cols-2 gap-2">
                  {[100, 500, 1000, 5000].map(val => (
                    <button
                      key={val}
                      onClick={() => setUnits(val)}
                      className={cn(
                        "py-3 rounded-xl font-bold text-sm transition-all border",
                        units === val
                          ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      {val.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={units}
                  onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
                  className="w-full mt-2 bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-amber-600 transition-colors"
                  placeholder="Custom amount..."
                />
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-500 font-medium">Subtotal ({units} units)</span>
                  <span className="text-xs font-bold text-zinc-300">{organization?.currency || 'GH₵'} {(units * (parseFloat(organization?.sms_unit_price) || 0)).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-zinc-300">
                    {organization?.currency || 'GH₵'} {(units * ((parseFloat(organization?.sms_unit_price) || 0) * (EXCHANGE_RATES[organization?.currency || 'GH₵'] || 1.0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-black text-amber-500">
                    {organization?.currency || 'GH₵'} {(units * ((parseFloat(organization?.sms_unit_price) || 0) * (EXCHANGE_RATES[organization?.currency || 'GH₵'] || 1.0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePaystackPayment}
                disabled={isProcessing || units <= 0}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay with Paystack
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-amber-600/10 rounded-full blur-[60px]" />
        </div>
      </div>

      <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
              <History className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Transaction History</h3>
              <p className="text-sm text-zinc-500">Record of SMS distributions and purchases</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-4 py-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</th>
                <th className="px-4 py-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Units</th>
                <th className="px-4 py-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Balance</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-4 h-12 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl" />
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-400 font-medium">No transactions found</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                        tx.type === 'Purchase' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-black text-zinc-900 dark:text-white">
                      +{tx.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-bold text-zinc-500">
                      {tx.new_balance?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Completed</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SchoolAdminDashboard({ stats, invoices = [], payments = [], students = [], classes = [], organization, attendanceHistory = [], activities = [], unreadMessagesCount = 0, onNavigate, onUpdateOrganization, staffList = [], departments = [], initialShowSMS = false }: { stats?: { totalStudents: string; totalStaff: string; attendanceRate: string; feesCollected: string }, invoices?: any[], payments?: any[], students?: any[], classes?: any[], organization?: any, attendanceHistory?: any[], activities?: any[], unreadMessagesCount?: number, onNavigate?: (view: string) => void, onUpdateOrganization?: (data: any) => void, staffList?: any[], departments?: any[], initialShowSMS?: boolean }) {
  const { currency, t } = useLanguage();
  const [showOwingModal, setShowOwingModal] = useState(false);
  const [modalType, setModalType] = useState<'paid' | 'owing'>('owing');
  const [showSMSPanel, setShowSMSPanel] = useState(initialShowSMS);

  useEffect(() => {
    if (initialShowSMS) setShowSMSPanel(true);
  }, [initialShowSMS]);

  // Calculate Attendance Trends from real history
  const attendanceTrendData = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return [];

    const totalStudentsCount = students.filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn').length || 1;

    // Group by date
    const groups: Record<string, { presentIds: Set<string>, rawDate: number }> = {};
    attendanceHistory.forEach(record => {
      // Handle date parsing robustly to avoid timezone shifts
      let d: Date;
      if (typeof record.date === 'string' && record.date.includes('-')) {
        const dateParts = record.date.split('T')[0].split('-');
        d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      } else {
        d = new Date(record.date);
      }
      
      const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!groups[dateKey]) {
        groups[dateKey] = { 
          presentIds: new Set(), 
          rawDate: d.getTime() 
        };
      }

      if (record.status === 'Present') {
        groups[dateKey].presentIds.add(String(record.student_id));
      }
    });

    return Object.entries(groups)
      .map(([name, vals]) => ({
        name,
        value: Math.round((vals.presentIds.size / totalStudentsCount) * 100),
        rawDate: vals.rawDate
      }))
      .sort((a, b) => a.rawDate - b.rawDate)
      .slice(-7); // Last 7 unique days
  }, [attendanceHistory, students]);

  const downloadReport = (title: string, reportData: any[]) => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Student Payment Status
  const studentStatusMap: Record<string, { invoiced: number, paid: number }> = {};
  invoices.forEach(inv => {
    if (!studentStatusMap[inv.student_id]) studentStatusMap[inv.student_id] = { invoiced: 0, paid: 0 };
    studentStatusMap[inv.student_id].invoiced += parseFloat(inv.amount || 0);
  });
  payments.forEach(pay => {
    if (!studentStatusMap[pay.student_id]) studentStatusMap[pay.student_id] = { invoiced: 0, paid: 0 };
    studentStatusMap[pay.student_id].paid += parseFloat(pay.amount || 0);
  });

  let paidCount = 0;
  let owingCount = 0;
  Object.values(studentStatusMap).forEach(stats => {
    if (stats.invoiced > 0) {
      if (stats.paid >= stats.invoiced) paidCount++;
      else owingCount++;
    }
  });

  const paymentStatusData = [
    { name: 'Fully Paid', value: paidCount },
    { name: 'Owing', value: owingCount }
  ];

  const PAYMENT_COLORS = ['#10b981', '#f59e0b'];

  const daysRemaining = useMemo(() => {
    if (!organization?.expiry_date) return null;
    const expiry = new Date(organization.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [organization?.expiry_date]);

  const birthdayItems = useMemo(() => {
    const list: { name: string, role: string }[] = [];
    
    (students || []).forEach(s => {
      if (checkIsBirthdayTomorrow(s.date_of_birth)) {
        list.push({ name: s.name, role: 'Student' });
      }
    });

    (staffList || []).forEach(s => {
      if (checkIsBirthdayTomorrow(s.date_of_birth)) {
        list.push({ name: s.name, role: 'Staff' });
      }
    });

    return list;
  }, [students, staffList]);

  return (
    <div className="space-y-8">
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      <BirthdayAlert items={birthdayItems} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('school_dashboard')}</h1>
          <p className="text-zinc-500 mt-1">{t('school_overview')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-zinc-800 pr-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            {organization?.academic_year || '—'}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest pl-1">
            <Zap className={cn(
              "w-4 h-4",
              daysRemaining === null ? "text-zinc-400" :
                daysRemaining < 5 ? "text-red-500" :
                  daysRemaining < 15 ? "text-amber-500" :
                    "text-emerald-500"
            )} />
            <div className="flex flex-col leading-none">
              <span className="text-zinc-900 dark:text-white">{organization?.plan || 'Free'} Plan</span>
              <span className={cn(
                "text-[9px] mt-0.5",
                daysRemaining === null ? "text-zinc-500" :
                  daysRemaining < 5 ? "text-red-500" :
                    daysRemaining < 15 ? "text-amber-500" :
                      "text-zinc-500"
              )}>
                {daysRemaining === null ? 'No Expiry Set' :
                  daysRemaining < 0 ? 'Expired' :
                    `Expires in ${daysRemaining} days`}
              </span>
            </div>
          </div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            {organization?.current_term || 'Term 1'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_students')} value={stats?.totalStudents || "0"} change="Active" trend="up" icon={GraduationCap} color="bg-blue-600" />
        <StatCard title={t('total_staff')} value={stats?.totalStaff || "0"} change="Verified" trend="up" icon={Briefcase} color="bg-purple-600" />
        <StatCard title={t('fees_collected')} value={stats?.feesCollected || `${currency} 0`} change="Target" trend="up" icon={Wallet} color="bg-emerald-600" />
        <StatCard
          title="SMS Credits"
          value={(organization?.sms_balance || 0).toLocaleString()}
          change={`Price: ${organization?.currency || 'GH₵'}${((parseFloat(organization?.sms_unit_price) || 0) * (EXCHANGE_RATES[organization?.currency || 'GH₵'] || 1.0)).toFixed(4)}/unit`}
          icon={MessageSquare}
          color="bg-amber-600"
          trend="up"
          onClick={() => setShowSMSPanel(!showSMSPanel)}
        />
      </div>

      {showSMSPanel && (
        <div className="mt-8">
          <SMSPurchasePanel
            organization={organization}
            onRefresh={() => onUpdateOrganization?.({ ...organization })}
          />
        </div>
      )}

      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
            <Truck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Transport SMS Alerts</h3>
            <p className="text-sm text-zinc-500">Automated parent notifications on student drop-off.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest",
            organization?.transport_sms_enabled ? "text-emerald-600" : "text-zinc-400"
          )}>
            {organization?.transport_sms_enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={() => onUpdateOrganization?.({
              ...organization,
              transport_sms_enabled: !organization?.transport_sms_enabled
            })}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
              organization?.transport_sms_enabled ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                organization?.transport_sms_enabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Attendance Trends</h3>
              <p className="text-sm text-zinc-500 mt-1">Average student presence over time.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Attendance %</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {attendanceTrendData.length > 0 ? (
                <AreaChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#14b8a6' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={4} fillOpacity={0} />
                </AreaChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                  <ClipboardCheck className="w-12 h-12 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Attendance Data Recorded</p>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Fees Collection</h3>
              <p className="text-sm text-zinc-500 mt-1">Status of student fee payments.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModalType('owing');
                  setShowOwingModal(true);
                }}
                className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-indigo-600 transition-all hover:scale-110"
                title="View Owing Students"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            {paymentStatusData.some(d => d.value > 0) ? (
              <div className="w-full h-full flex items-center">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data, index) => {
                          setModalType(index === 0 ? 'paid' : 'owing');
                          setShowOwingModal(true);
                        }}
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="hidden sm:block pl-8 space-y-4">
                  <div
                    className="space-y-1 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/10 p-2 rounded-xl transition-colors"
                    onClick={() => {
                      setModalType('paid');
                      setShowOwingModal(true);
                    }}
                  >
                    <p className="text-2xl font-black text-emerald-600">{paidCount}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Paid Students</p>
                  </div>
                  <div
                    className="space-y-1 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 p-2 rounded-xl transition-colors"
                    onClick={() => {
                      setModalType('owing');
                      setShowOwingModal(true);
                    }}
                  >
                    <p className="text-2xl font-black text-amber-500">{owingCount}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Owing Students</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center opacity-40">
                <CreditCard className="w-12 h-12 mb-4 text-zinc-300" />
                <p className="text-sm font-medium italic">No fee data recorded for this period.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('recent_activities')}</h3>
              <p className="text-sm text-zinc-500 mt-1">Latest updates from your school staff.</p>
            </div>
            <button
              onClick={() => onNavigate?.('Audit Logs')}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
            {activities.length > 0 ? (
              activities.map((activity, i) => (
                <div key={i} className="flex items-center gap-6 p-4 bg-white dark:bg-zinc-800/20 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-600/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 bg-indigo-50 text-indigo-600 shrink-0")}>
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {activity.user_name || 'System'}
                        <span className="mx-2 text-zinc-400 font-normal">|</span>
                        <span className="text-zinc-500 font-medium">{activity.action_type || 'Activity'}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(activity.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 max-w-full truncate">
                        {activity.details || 'System Log'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/10 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                <Bot className="w-10 h-10 text-zinc-200 mx-auto" />
                <p className="text-zinc-400 font-bold italic text-xs">No recent activities recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showOwingModal}
        onClose={() => setShowOwingModal(false)}
        title={modalType === 'owing' ? "Students with Outstanding Balances" : "Students with Fully Paid Fees"}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {modalType === 'owing' ? 'Following is the list of students who have not completed their fee payments.' : 'Following is the list of students who have completed all their fee payments.'}
            </p>
            <button
              onClick={() => {
                const list = students.filter(s => {
                  const sStats = studentStatusMap[s.id];
                  if (!sStats || sStats.invoiced === 0) return false;
                  return modalType === 'owing' ? sStats.paid < sStats.invoiced : sStats.paid >= sStats.invoiced;
                }).map(s => {
                  const sStats = studentStatusMap[s.id];
                  const studentClass = classes.find((c: any) => c.id === s.class_id);
                  return {
                    'Student Name': s.name,
                    'Class': studentClass?.name || s.class_name || 'N/A',
                    'Section': studentClass?.section || s.class_section || '',
                    'Total Invoiced': sStats.invoiced,
                    'Total Paid': sStats.paid,
                    'Balance': (sStats.invoiced || 0) - (sStats.paid || 0)
                  };
                });
                downloadReport(modalType === 'owing' ? 'Owing Students' : 'Paid Students', list);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>

          <DataTable
            title={modalType === 'owing' ? "Owing Students" : "Paid Students"}
            data={students.filter(s => {
              const sStats = studentStatusMap[s.id];
              if (!sStats || sStats.invoiced === 0) return false;
              return modalType === 'owing' ? sStats.paid < sStats.invoiced : sStats.paid >= sStats.invoiced;
            })}
            columns={[
              { header: 'Student Name', accessor: 'name', className: 'font-bold' },
              {
                header: 'Class',
                accessor: (s: any) => {
                  const studentClass = classes.find((c: any) => c.id === s.class_id);
                  const className = studentClass?.name || s.class_name || 'N/A';
                  const classSection = studentClass?.section || s.class_section || '';
                  return `${className} ${classSection}`.trim();
                }
              },
              {
                header: 'Status',
                accessor: (s: any) => {
                  const sStats = studentStatusMap[s.id];
                  const balance = (sStats.invoiced || 0) - (sStats.paid || 0);
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span className="text-emerald-600">Paid: {currency} {(sStats.paid || 0).toLocaleString()}</span>
                        {balance > 0 && <span className="text-rose-600 text-right">Balance: {currency} {balance.toLocaleString()}</span>}
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all", balance > 0 ? "bg-amber-500" : "bg-emerald-500")}
                          style={{ width: `${Math.min(100, ((sStats.paid || 0) / (sStats.invoiced || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              }
            ]}
            autoModal={false}
          />
        </div>
      </Modal>

    </div>
  );
}

export function HODDashboard({ data, staffList = [], departments = [], organization, user, unreadMessagesCount = 0, onNavigate, onUpdateOrganization }: { data?: any, staffList?: any[], departments?: any[], organization?: any, user?: any, unreadMessagesCount?: number, onNavigate?: (view: string) => void, onUpdateOrganization?: (data: any) => void }) {
  const { t } = useLanguage();

  // Use real data or empty defaults
  const staffPerformanceData = data?.performanceHistory || [];
  const departmentMetrics = data?.metrics || [];
  const stats = data?.stats || {
    totalStaff: 0,
    totalStudents: 0,
    avgPerformance: 0,
    pendingTasks: 0
  };

  return (
    <div className="space-y-8">
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('department_overview')}</h1>
        <p className="text-zinc-500 mt-1">{data?.departmentName || t('science_dept_mgmt')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_staff')} value={stats.totalStaff.toString()} change="+1" trend="up" icon={Users} color="bg-blue-600" />
        <StatCard title={t('total_students')} value={stats.totalStudents.toString()} change="+12" trend="up" icon={GraduationCap} color="bg-indigo-600" />
        <StatCard title={t('avg_performance')} value={`${stats.avgPerformance}${stats.avgPerformance.toString().includes('%') ? '' : '%'}`} change="+2.4%" trend="up" icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title={t('pending_tasks')} value={stats.pendingTasks.toString()} change="-2" trend="up" icon={ClipboardCheck} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Staff Performance Chart */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('staff_performance')}</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 text-zinc-500">
                <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                Performance
              </span>
              <span className="flex items-center gap-1 text-zinc-500">
                <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                Attendance
              </span>
              <span className="flex items-center gap-1 text-zinc-500">
                <div className="w-3 h-3 bg-amber-600 rounded"></div>
                Workload
              </span>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [`${value}%`, name === 'performance' ? 'Performance' : name === 'attendance' ? 'Attendance' : 'Workload']}
                />
                <Bar dataKey="performance" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="workload" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Metrics */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Department Metrics</h3>
          <div className="space-y-6">
            {departmentMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-900 dark:text-white">{metric.label}</span>
                  <span className="text-zinc-500">{metric.value}% / {metric.target}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-1000"
                    style={{
                      width: `${metric.value}%`,
                      backgroundColor: metric.color,
                      boxShadow: `0 0 10px ${metric.color}40`
                    }}
                  ></div>
                  <div
                    className="absolute top-0 h-3 w-1 bg-white/50 rounded-full"
                    style={{ left: `${metric.target}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Top Performer</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">
                {staffPerformanceData.length > 0
                  ? staffPerformanceData.reduce((prev: any, current: any) => (prev.performance > current.performance) ? prev : current).name
                  : '—'}
              </p>
              <p className="text-sm text-zinc-500">
                Performance: {staffPerformanceData.length > 0
                  ? Math.round(staffPerformanceData.reduce((prev: any, current: any) => (prev.performance > current.performance) ? prev : current).performance)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Best Attendance</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">
                {staffPerformanceData.length > 0
                  ? staffPerformanceData.reduce((prev: any, current: any) => (prev.attendance > current.attendance) ? prev : current).name
                  : '—'}
              </p>
              <p className="text-sm text-zinc-500">
                Attendance: {staffPerformanceData.length > 0
                  ? Math.round(staffPerformanceData.reduce((prev: any, current: any) => (prev.attendance > current.attendance) ? prev : current).attendance)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Workload Balance</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">
                {staffPerformanceData.length > 0
                  ? staffPerformanceData.reduce((prev: any, current: any) => (prev.workload > current.workload) ? prev : current).name
                  : '—'}
              </p>
              <p className="text-sm text-zinc-500">
                Avg workload: {staffPerformanceData.length > 0
                  ? Math.round(staffPerformanceData.reduce((prev: any, current: any) => (prev.workload > current.workload) ? prev : current).workload)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <HRModules.Organogram
          staff={staffList}
          departments={departments}
          organization={organization}
          scopedDeptId={user?.department_id}
          strictDepartmentView={true}
          isReadOnly={true}
          onUpdateOrganization={onUpdateOrganization}
        />
      </div>
    </div>
  );
}

export function StaffDashboard({ staffData, user, organization, onNavigate, staffList = [], departments = [], unreadMessagesCount = 0, onUpdateOrganization }: { staffData?: any, user?: any, organization?: any, onNavigate?: (view: string) => void, staffList?: any[], departments?: any[], unreadMessagesCount?: number, onUpdateOrganization?: (data: any) => void }) {
  const { t } = useLanguage();
  const [showDigitalID, setShowDigitalID] = useState(false);


  const stats = {
    classes: staffData?.classes?.length || 0,
    students: staffData?.students?.length || 0,
    attendance: staffData?.attendance?.length > 0
      ? `${Math.round((staffData.attendance.filter((a: any) => a.status === 'Present').length / staffData.attendance.length) * 100)}%`
      : '0%',
    lessonNotes: staffData?.lessonNotes?.length || 0
  };

  // Compute latest appraisal score
  const latestReview = useMemo(() => {
    const reviews = staffData?.performanceReviews || [];
    if (reviews.length === 0) return null;
    return reviews.sort((a: any, b: any) => new Date(b.review_date || b.created_at || 0).getTime() - new Date(a.review_date || a.created_at || 0).getTime())[0];
  }, [staffData?.performanceReviews]);

  const appraisalScore = latestReview
    ? parseFloat(latestReview.overall_score || latestReview.score || latestReview.rating || 0)
    : null;

  const upcomingClasses = staffData?.timetable
    ? staffData.timetable
      .filter((t: any) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        // Case-insensitive comparison and handling potential short forms
        return (t.day_of_week || '').toLowerCase() === today.toLowerCase() ||
          (t.day_of_week || '').toLowerCase() === today.slice(0, 3).toLowerCase();
      })
      .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
      .slice(0, 3)
    : [];

  const birthdayItems = useMemo(() => {
    const list: { name: string, role: string, isSelf?: boolean }[] = [];
    
    // Check self
    if (checkIsBirthdayTomorrow(user?.date_of_birth)) {
      list.push({ name: user.name || 'You', role: 'Staff', isSelf: true });
    }

    // Check students I teach
    (staffData?.students || []).forEach((s: any) => {
      if (checkIsBirthdayTomorrow(s.date_of_birth)) {
        list.push({ name: s.name, role: 'Student' });
      }
    });

    return list;
  }, [user, staffData?.students]);

  return (
    <div className="space-y-8">
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      <BirthdayAlert items={birthdayItems} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('staff_portal')}</h1>
          <p className="text-zinc-500 mt-1">{t('welcome_back')}, {user?.name || user?.username || 'Staff'}</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-zinc-800 pr-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            {organization?.academic_year || '—'}
          </div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            {organization?.current_term || 'Term 1'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('my_classes')} value={stats.classes.toString()} change="0" trend="up" icon={BookOpen} color="bg-indigo-600" />
        <StatCard title={t('total_students')} value={stats.students.toString()} change="0" trend="up" icon={Users} color="bg-blue-600" />
        <StatCard title={t('avg_attendance')} value={stats.attendance} change="0" trend="up" icon={ClipboardCheck} color="bg-emerald-600" />
        <StatCard
          title={t('appraisal_score')}
          value={appraisalScore !== null ? `${appraisalScore}%` : '—'}
          change={latestReview ? (latestReview.review_date || latestReview.created_at || '').split('T')[0] : t('no_review')}
          trend="up"
          icon={Star}
          color="bg-amber-600"
          onClick={() => onNavigate?.('Performance')}
        />
        <div 
          onClick={() => onNavigate?.('Gallery')}
          className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full -translate-y-12 translate-x-12 -z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-purple-600">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">View Gallery</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">School Gallery</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-purple-600 transition-colors" />
            </div>
          </div>
        </div>
        <div 
          onClick={() => setShowDigitalID(true)}

          className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full -translate-y-12 translate-x-12 -z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-indigo-600">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{t('digital_id')}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{t('show_to_scan')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDigitalID}
        onClose={() => setShowDigitalID(false)}
        title={t('my_digital_id')}
        maxWidth="max-w-md"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden; }
            #staff-id-card-print, #staff-id-card-print * { visibility: visible; }
            #staff-id-card-print {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 85.6mm;
              height: 135mm;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 2rem;
              background: white;
            }
          }
        `}} />
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div id="staff-id-card-print" className="w-full max-w-[300px] min-h-[480px] bg-white border border-zinc-200 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col p-6 mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {organization?.logo ? (
                  <img src={organization.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <School className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-left min-w-0">
                <h4 className="text-[10px] font-black text-zinc-900 uppercase leading-tight truncate">{organization?.name || 'BytzGo Academy'}</h4>
                <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-widest">{t('staff_id_card')}</p>
              </div>
            </div>

            {/* Profile */}
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-28 h-28 rounded-3xl bg-zinc-50 border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
                {user?.profile_pic ? (
                  <img src={user.profile_pic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-200">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-zinc-900 uppercase leading-tight">{user?.name}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Staff'}</p>
              </div>

              {/* QR Code */}
              <div className="mt-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(user?.email || user?.id)}&margin=0`}
                  alt="Staff QR Code"
                  className="w-32 h-32"
                />
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-3">{user?.email?.split('@')[0]}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-zinc-100">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{t('scan_for_attendance')}</p>
            </div>
          </div>
          
          <p className="text-sm text-zinc-500 px-4">
            {t('staff_id_desc')}
          </p>
          
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => window.print()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold transition-all hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> {t('print_full_card')}
            </button>
            <button
              onClick={() => setShowDigitalID(false)}
              className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold transition-all hover:bg-zinc-200"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Appraisal Score Detail */}
      {latestReview && (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-xl">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('appraisal_score')}</h3>
                <p className="text-xs text-zinc-500">{t('appraisal_score_desc')}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('Performance')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
              {t('view')} {t('all')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
              <p className="text-5xl font-black text-amber-600">{appraisalScore !== null ? appraisalScore : 0}<span className="text-2xl">%</span></p>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">{t('overall_score')}</p>
              <p className="text-[10px] text-zinc-400 mt-1">
                {latestReview.review_period || latestReview.period || (latestReview.review_date || latestReview.created_at || '').split('T')[0]}
              </p>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4">
              {[
                { label: t('teaching_quality'), key: 'teaching_quality', fallback: 'quality_score' },
                { label: t('communication_quality'), key: 'communication', fallback: 'communication_score' },
                { label: t('punctuality'), key: 'punctuality', fallback: 'punctuality_score' },
                { label: t('teamwork'), key: 'teamwork', fallback: 'teamwork_score' },
                { label: t('initiative'), key: 'initiative', fallback: 'initiative_score' },
              ].map(({ label, key, fallback }) => {
                const val = parseFloat(latestReview[key] || latestReview[fallback] || 0);
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{val > 0 ? `${val}%` : '—'}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-amber-500 transition-all duration-700"
                        style={{ width: `${Math.min(val, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {latestReview.comments && (
            <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-1">{t('reviewer_comments')}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{latestReview.comments}</p>
            </div>
          )}

        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Class Attendance Trend</h3>
            <TrendingUp className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="h-[240px]">
            {staffData?.attendanceTrends && staffData.attendanceTrends.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={staffData.attendanceTrends}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <BarChart className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500 italic">No attendance data available for the last 5 days.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('upcoming_classes')}</h3>
          <div className="space-y-4">
            {upcomingClasses.length > 0 ? upcomingClasses.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">{item.subject_name}</p>
                    <p className="text-xs text-zinc-500">{item.class_name} {item.class_section} {item.room ? `| ${item.room}` : ''}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-indigo-600">{item.start_time?.slice(0, 5)}</span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <Calendar className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-500 italic">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <HRModules.Organogram
          staff={staffList}
          departments={departments}
          organization={organization}
          scopedDeptId={user?.department_id}
          strictDepartmentView={true}
          isReadOnly={true}
          onUpdateOrganization={onUpdateOrganization}
        />
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {staffData?.recentActivity && staffData.recentActivity.length > 0 ? (
            staffData.recentActivity.map((activity: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors">
                <div className={cn(
                  "p-2 rounded-lg",
                  activity.type === 'birthday' ? "bg-rose-100 text-rose-600 dark:bg-rose-900/20" :
                    activity.type === 'leave' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
                      activity.type === 'attendance' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20" : "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                )}>
                  {activity.type === 'birthday' ? <Gift className="w-4 h-4" /> :
                    activity.type === 'leave' ? <Calendar className="w-4 h-4" /> :
                      activity.type === 'attendance' ? <ClipboardCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{activity.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(activity.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <Zap className="w-8 h-8 text-zinc-300 mb-3" />
              <p className="text-sm text-zinc-500 italic">No recent activity to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParentDashboard({
  wards = [],
  selectedWardId,
  onWardSelect,
  attendance = [],
  invoices = [],
  timetable = [],
  announcements = [],
  meetings = [],
  organization,
  unreadMessagesCount = 0,
  onNavigate
}: {
  wards?: any[],
  selectedWardId: string | null,
  onWardSelect: (id: string) => void,
  attendance?: any[],
  invoices?: any[],
  timetable?: any[],
  announcements?: any[],
  meetings?: any[],
  organization?: any,
  unreadMessagesCount?: number,
  onNavigate?: (view: string) => void
}) {
  const { currency, t } = useLanguage();
  const selectedWard = wards.find(w => w.id === selectedWardId) || wards[0];

  if (!selectedWard) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
          <Users className="w-8 h-8" />
        </div>
        <p className="text-zinc-500 font-medium">{t('no_wards_found')}</p>
      </div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Resolve outstanding fees for the selected ward
  const wardInvoices = invoices.filter(inv => String(inv.student_id) === String(selectedWard.id));
  const outstandingFees = wardInvoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue' || inv.status === 'Partial')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const nextInvoice = wardInvoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
    .sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime())[0];

  const wardAnnouncements = announcements.filter(ann => 
    ann.target_audience === 'ALL' || 
    ann.target_audience === 'PARENT' || 
    (ann.target_audience === 'CLASS' && String(ann.class_id) === String(selectedWard.class_id))
  );

  const wardMeetings = meetings.filter(m => 
    m.target_audience === 'ALL' || 
    m.target_audience === 'PARENT' || 
    (m.target_audience === 'CLASS' && String(m.class_id) === String(selectedWard.class_id))
  );

  const totalNotices = wardAnnouncements.length + wardMeetings.length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />

      {/* Hero Welcome & Ward Selection */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                {selectedWard.profile_pic ? (
                  <img
                    src={selectedWard.profile_pic}
                    alt={selectedWard.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center rounded-2xl">
                    <User className="w-12 h-12 md:w-16 md:h-16 text-indigo-400 dark:text-indigo-500" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-indigo-600 border-4 border-white dark:border-zinc-900 rounded-full flex items-center justify-center shadow-lg">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-3 h-3 text-amber-500" />
                {t('parent_portal')} • {organization?.academic_year || '—'}
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 text-zinc-900 dark:text-white">
                {selectedWard.name.split(' ')[0]}'s {t('progress')}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg font-medium max-w-xl leading-relaxed">
                {t('monitoring_progress').replace('{name}', selectedWard.name)}. Currently in <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedWard.class || 'Class'}</span>.
              </p>
            </div>
          </div>


          {wards.length > 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center lg:text-left">{t('switch_ward')}</p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {wards.map(ward => (
                  <button
                    key={ward.id}
                    onClick={() => onWardSelect(ward.id)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-sm font-bold transition-all border active:scale-95",
                      selectedWardId === ward.id
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500/50"
                    )}
                  >
                    {ward.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{selectedWard.avgGrade}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{t('avg_grade')}</p>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
              GPA
            </div>
          </div>
        </div>

        <div className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-rose-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{currency} {outstandingFees.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{t('outstanding')}</p>
            </div>
            <div className={cn(
              "text-[10px] font-bold px-2 py-1 rounded-lg",
              outstandingFees > 0 ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
            )}>
              {outstandingFees > 0 ? 'Pending' : 'Cleared'}
            </div>
          </div>
        </div>

        <div className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-amber-600">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{totalNotices}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{t('notices')}</p>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
              Update
            </div>
          </div>
        </div>

        <div className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => onNavigate?.('Gallery')}>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-purple-600">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">View</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Gallery</p>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600">
              Projects
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Chart */}
          <motion.div variants={itemVariants} className="p-5 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('academic_performance')}</h3>
                <p className="text-xs md:text-sm text-zinc-500 font-medium">Recent subject results and assessment trends.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 md:w-3 md:h-3 bg-indigo-600 rounded-full"></span>
                <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score %</span>
              </div>
            </div>
            <div className="h-[200px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedWard.performanceData}>
                  <defs>
                    <linearGradient id="parentColorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#parentColorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Today's Schedule Timeline */}
          <motion.div variants={itemVariants} className="p-5 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('todays_schedule')}</h3>
                <p className="text-xs md:text-sm text-zinc-500 font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>


            <div className="space-y-0 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
              {(() => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const today = days[new Date().getDay()];
                const wardSchedule = timetable?.filter((t: any) =>
                  t.day_of_week === today && String(t.class_id) === String(selectedWard.class_id)
                ).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)) || [];

                if (wardSchedule.length === 0) {
                  return (
                    <div className="pl-16 py-4 text-zinc-500 text-sm italic">
                      No classes scheduled for today.
                    </div>
                  );
                }

                return wardSchedule.map((item: any, i: number) => (
                  <div key={i} className="relative pl-16 pb-8 last:pb-0 group">
                    <div className="absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-900 z-10 bg-indigo-600 transition-all group-hover:scale-125"></div>
                    <div className="p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{item.start_time} - {item.end_time}</span>
                          </div>
                          <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{item.subject_name || 'Subject'}</h4>
                          <p className="text-xs text-zinc-500 mt-1">{item.teacher_name || 'Instructor'} • Room {item.room || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          {/* Financial Overview Card */}
          <motion.div variants={itemVariants} className="p-6 md:p-8 bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] text-white overflow-hidden shadow-2xl relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold">{t('fee_status')}</h3>
                  <p className="text-zinc-400 text-[10px] md:text-xs tracking-wide">Current billing overview</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('outstanding_balance')}</span>
                    <span className="text-xl md:text-2xl font-black text-emerald-500">{currency} {outstandingFees.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: outstandingFees > 0 ? `${Math.min(100, (outstandingFees / 5000) * 100)}%` : '100%' }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between text-[10px] md:text-xs">
                    <span className="text-zinc-400 font-medium">{t('payment_status')}</span>
                    <span className="font-bold text-emerald-400">{selectedWard.feesPaid}</span>
                  </div>
                  <div className="flex justify-between text-[10px] md:text-xs">
                    <span className="text-zinc-400 font-medium">{t('next_due_date')}</span>
                    <span className="font-bold">{nextInvoice ? new Date(nextInvoice.due_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* Recent Notices */}
          <motion.div variants={itemVariants} className="p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] shadow-sm">
            <h3 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-8">{t('notices')}</h3>

            <div className="space-y-6">
              {[...wardAnnouncements, ...wardMeetings].length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No recent notices.</p>
              ) : (
                [...wardAnnouncements, ...wardMeetings].slice(0, 4).map((item, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                        {item.priority || item.status || 'Notice'}
                      </span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                        {new Date(item.created_at || item.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-1">{item.title}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.content || item.description}</p>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => onNavigate?.('Announcements')}
              className="w-full mt-8 py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all border border-zinc-100 dark:border-zinc-800"
            >
              {t('view_all')}
            </button>
          </motion.div>

          {/* Quick Contact Card */}
          <motion.div variants={itemVariants} className="p-8 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-white tracking-tight">{t('contact_teacher')}</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Class Teacher</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Have questions about {selectedWard.name.split(' ')[0]}'s progress? Send a direct message to the class teacher.
            </p>
            <button
              onClick={() => onNavigate?.('Messages')}
              className="w-full py-3 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-800"
            >
              Send Message
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}


export function FinanceDashboard({ 
  invoices = [], 
  payments = [], 
  expenses = [] 
}: { 
  invoices?: any[], 
  payments?: any[], 
  expenses?: any[] 
}) {
  const { currency, t } = useLanguage();
  
  const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingFees = invoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue' || inv.status === 'Partial')
    .reduce((sum, inv) => {
      const amount = parseFloat(inv.amount) || 0;
      // This is a simplification; ideally we'd subtract payments linked to this invoice
      return sum + amount;
    }, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const chartData = useMemo(() => {
    // Basic aggregation by month for the last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        name: months[d.getMonth()],
        value: 0,
        month: d.getMonth(),
        year: d.getFullYear()
      };
    }).reverse();

    payments.forEach(p => {
      const pDate = new Date(p.created_at || p.date);
      const mIdx = last6Months.findIndex(m => m.month === pDate.getMonth() && m.year === pDate.getFullYear());
      if (mIdx !== -1) {
        last6Months[mIdx].value += (parseFloat(p.amount) || 0);
      }
    });

    return last6Months;
  }, [payments]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('finance_portal')}</h1>
        <p className="text-zinc-500 mt-1">{t('manage_finance_ops')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_revenue')} value={`${currency} ${totalRevenue.toLocaleString()}`} change="0%" trend="up" icon={Wallet} color="bg-emerald-600" />
        <StatCard title={t('pending_fees')} value={`${currency} ${pendingFees.toLocaleString()}`} change="0%" trend="up" icon={CreditCard} color="bg-amber-600" />
        <StatCard title={t('annual_expenses')} value={`${currency} ${totalExpenses.toLocaleString()}`} change="0%" trend="down" icon={TrendingUp} color="bg-rose-600" />
        <StatCard title={t('scholarships')} value="0" change="0" trend="up" icon={GraduationCap} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('revenue_overview')}</h3>
          <div className="h-[300px]">
            {chartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 italic text-sm">
                No revenue data available for the last 6 months.
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {payments.length > 0 || expenses.length > 0 ? (
              [...payments.map(p => ({ ...p, type: 'income', desc: p.description || 'Payment Received' })), 
               ...expenses.map(e => ({ ...e, type: 'expense', desc: e.description || e.category }))]
                .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
                .slice(0, 4)
                .map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">{tx.desc}</p>
                      <p className="text-xs text-zinc-500">{new Date(tx.created_at || tx.date).toLocaleDateString()}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                    )}>{tx.type === 'income' ? '+' : '-'}{currency} {(parseFloat(tx.amount) || 0).toLocaleString()}</span>
                  </div>
                ))
            ) : (
              <div className="py-12 text-center text-zinc-400 italic text-sm">
                No recent transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export function BusDriverDashboard({ routes = [], onDropOff, onPickUp }: { routes?: any[], onDropOff?: (studentId: string) => Promise<void>, onPickUp?: (studentId: string) => Promise<void> }) {
  const { t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState<any>(routes.length === 1 ? routes[0] : null);
  const [routeStudents, setRouteStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tripMode, setTripMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'routes' | 'history'>('routes');

  useEffect(() => { if (selectedRoute) loadStudents(selectedRoute.id); }, [selectedRoute]);
  useEffect(() => { if (sidebarTab === 'history') loadHistory(); }, [sidebarTab]);
  useEffect(() => { if (routes.length === 1 && !selectedRoute) setSelectedRoute(routes[0]); }, [routes]);

  const loadStudents = async (id: string) => {
    setIsLoadingStudents(true);
    try { const { fetchRouteStudents } = await import('../lib/api'); setRouteStudents(await fetchRouteStudents(id)); }
    catch (err) { console.error(err); }
    finally { setIsLoadingStudents(false); }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try { const { fetchTransportHistory } = await import('../lib/api'); setHistory(await fetchTransportHistory()); }
    catch (err) { console.error(err); }
    finally { setIsLoadingHistory(false); }
  };

  const pickedCount = routeStudents.filter(s => s.transport_status === 'picked_up').length;
  const droppedCount = routeStudents.filter(s => s.transport_status === 'dropped').length;
  const totalStudents = routeStudents.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{t('transport_portal')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('route_overview')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Morning / Afternoon Toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
          <button onClick={() => setTripMode('pickup')} className={cn(
            "flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all",
            tripMode === 'pickup' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}>
            <ArrowUp className="w-4 h-4" /> <span className="hidden sm:inline">Morning</span> Pickup
          </button>
          <button onClick={() => setTripMode('dropoff')} className={cn(
            "flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all",
            tripMode === 'dropoff' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}>
            <ArrowDown className="w-4 h-4" /> <span className="hidden sm:inline">Afternoon</span> Drop-off
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title={t('total_routes')} value={routes.length.toString()} change="Active" trend="up" icon={Truck} color="bg-indigo-600" />
        <StatCard title="On Route" value={totalStudents.toString()} change={selectedRoute?.route_name || '—'} trend="up" icon={Users} color="bg-zinc-700" />
        <StatCard title="Picked Up" value={`${pickedCount}/${totalStudents}`} change={totalStudents > 0 ? `${Math.round(pickedCount/totalStudents*100)}%` : '0%'} trend="up" icon={ArrowUp} color="bg-blue-600" />
        <StatCard title="Dropped Off" value={`${droppedCount}/${totalStudents}`} change={totalStudents > 0 ? `${Math.round(droppedCount/totalStudents*100)}%` : '0%'} trend="up" icon={ArrowDown} color="bg-emerald-600" />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SIDEBAR */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button onClick={() => setSidebarTab('routes')} className={cn("flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", sidebarTab === 'routes' ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Routes</button>
            <button onClick={() => setSidebarTab('history')} className={cn("flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", sidebarTab === 'history' ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>History</button>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            {sidebarTab === 'routes' ? (
              <div className="p-3 space-y-1.5 max-h-[55vh] overflow-y-auto custom-scrollbar">
                {routes.length > 0 ? routes.map((route, i) => (
                  <button key={i} onClick={() => setSelectedRoute(route)} className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    selectedRoute?.id === route.id ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/50" : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", selectedRoute?.id === route.id ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400")}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{route.route_name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{route.vehicle_number || route.vehicle_no || '—'}</p>
                    </div>
                  </button>
                )) : (<div className="py-10 text-center text-zinc-400 italic text-xs">No routes assigned.</div>)}
              </div>
            ) : (
              <div className="p-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Activity Log</span>
                  <button onClick={loadHistory} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                    <RefreshCw className={cn("w-3.5 h-3.5", isLoadingHistory && "animate-spin")} />
                  </button>
                </div>
                <div className="space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 italic text-xs">No history yet.</div>
                  ) : history.slice(0, 50).map((entry, i) => (
                    <div key={entry.id || i} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5", entry.action === 'pick_up' ? 'bg-blue-500' : 'bg-emerald-500')}>
                        {entry.action === 'pick_up' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{entry.student_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={cn("text-[8px] font-black uppercase px-1 py-px rounded", entry.action === 'pick_up' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500')}>
                            {entry.action === 'pick_up' ? 'Pick' : 'Drop'}
                          </span>
                          <span className="text-[9px] text-zinc-400 truncate">{entry.location}</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 mt-0.5">{entry.created_at ? new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-9">
          <div className={cn(
            "rounded-[2rem] border shadow-sm overflow-hidden transition-colors",
            tripMode === 'pickup'
              ? "bg-gradient-to-b from-blue-50/30 to-white dark:from-blue-950/10 dark:to-zinc-900 border-blue-100 dark:border-blue-900/30"
              : "bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/10 dark:to-zinc-900 border-emerald-100 dark:border-emerald-900/30"
          )}>
            <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", tripMode === 'pickup' ? 'bg-blue-600' : 'bg-emerald-600')}>
                    {tripMode === 'pickup' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">{tripMode === 'pickup' ? '🌅 Morning Pickup' : '🌆 Afternoon Drop-off'}</h3>
                    <p className="text-xs text-zinc-500">{selectedRoute ? selectedRoute.route_name : 'Select a route'}{selectedRoute && totalStudents > 0 && ` — ${tripMode === 'pickup' ? pickedCount : droppedCount} of ${totalStudents} done`}</p>
                  </div>
                </div>
                {selectedRoute && (
                  <button onClick={() => loadStudents(selectedRoute.id)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors">
                    <RefreshCw className={cn("w-4 h-4", isLoadingStudents && "animate-spin")} />
                  </button>
                )}
              </div>
              {selectedRoute && totalStudents > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-zinc-200/60 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${((tripMode === 'pickup' ? pickedCount : droppedCount) / totalStudents) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className={cn("h-full rounded-full", tripMode === 'pickup' ? 'bg-blue-500' : 'bg-emerald-500')} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6">
              {isLoadingStudents ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className={cn("w-10 h-10 border-4 border-t-transparent rounded-full animate-spin", tripMode === 'pickup' ? 'border-blue-600' : 'border-emerald-600')} />
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Loading Manifest...</p>
                </div>
              ) : !selectedRoute ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-3"><MapPin className="w-7 h-7 text-zinc-300" /></div>
                  <p className="text-sm text-zinc-500 font-medium">Select a route to view students</p>
                  <p className="text-xs text-zinc-400 mt-1">Choose from the sidebar</p>
                </div>
              ) : routeStudents.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 italic text-sm">No students assigned to this route.</div>
              ) : (
                <div className="space-y-2.5">
                  {routeStudents.map((student) => {
                    const isDone = (tripMode === 'pickup' && student.transport_status === 'picked_up') || (tripMode === 'dropoff' && student.transport_status === 'dropped');
                    return (
                      <motion.div key={student.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
                        "flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all",
                        isDone ? "bg-zinc-50/50 dark:bg-zinc-800/20 border-zinc-100 dark:border-zinc-800" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-md"
                      )}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-sm", isDone ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100 dark:border-indigo-800/50")}>
                            {student.name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <h4 className={cn("font-bold text-sm truncate", isDone ? "text-zinc-400" : "text-zinc-900 dark:text-white")}>{student.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{student.pickup_location || 'Standard Stop'}</span>
                              {student.transport_status === 'picked_up' && <span className="flex items-center gap-0.5 text-[9px] font-black text-blue-500 uppercase"><CheckCircle2 className="w-2.5 h-2.5" /> On Board</span>}
                              {student.transport_status === 'dropped' && <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-500 uppercase"><CheckCircle2 className="w-2.5 h-2.5" /> Home</span>}
                            </div>
                          </div>
                        </div>
                        <button disabled={actionId === student.id || isDone} onClick={async () => {
                          setActionId(student.id);
                          try { if (tripMode === 'pickup') await onPickUp?.(student.id); else await onDropOff?.(student.id); await loadStudents(selectedRoute.id); } finally { setActionId(null); }
                        }} className={cn(
                          "px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all shrink-0 ml-2",
                          isDone ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default"
                            : tripMode === 'pickup' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95"
                            : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95"
                        )}>
                          {actionId === student.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            : isDone ? (tripMode === 'pickup' ? '✓ Aboard' : '✓ Home')
                            : (tripMode === 'pickup' ? 'Pick Up' : 'Drop Off')}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function LibrarianDashboard({ books = [], bookLoans = [] }: { books?: any[], bookLoans?: BorrowRecord[] }) {
  const { t } = useLanguage();
  
  const totalBooks = books.reduce((sum, b) => sum + (b.total_copies || 0), 0);
  const booksIssued = bookLoans.filter(l => l.status === 'Issued' || l.status === 'Overdue').length;
  const overdueBooks = bookLoans.filter(l => l.status === 'Overdue').length;
  const activeMembers = new Set(bookLoans.map(l => l.student_id || l.user_id)).size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('library_management')}</h1>
        <p className="text-zinc-500 mt-1">{t('central_library_overview')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_books')} value={totalBooks.toLocaleString()} change="0" trend="up" icon={Library} color="bg-indigo-600" />
        <StatCard title={t('books_issued')} value={booksIssued.toString()} change="0%" trend="up" icon={BookOpen} color="bg-emerald-600" />
        <StatCard title={t('overdue_books')} value={overdueBooks.toString()} change="0" trend="up" icon={Clock} color="bg-rose-600" />
        <StatCard title={t('active_members')} value={activeMembers.toString()} change="0" trend="up" icon={Users} color="bg-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('recent_issues')}</h3>
          <div className="space-y-4">
            {bookLoans.length > 0 ? (
              bookLoans
                .sort((a, b) => new Date(b.loan_date || '').getTime() - new Date(a.loan_date || '').getTime())
                .slice(0, 4)
                .map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">{item.book_title || 'Unknown Book'}</p>
                      <p className="text-xs text-zinc-500">{item.user_name || 'Unknown User'}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      item.status === 'Returned' ? "bg-emerald-50 text-emerald-600" : item.status === 'Overdue' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>{item.status}</span>
                  </div>
                ))
            ) : (
              <div className="py-12 text-center text-zinc-400 italic text-sm">
                No recent book issues.
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">New Acquisitions</h3>
          <div className="space-y-4">
            {books.length > 0 ? (
              books
                .sort((a: any, b: any) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                .slice(0, 3)
                .map((book, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">{book.title}</p>
                      <p className="text-xs text-zinc-500">{book.author} • {book.category}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-12 text-center text-zinc-400 italic text-sm">
                No books in the catalog.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export function HRDashboard({ staff = [], attendance = [], leaveRequests = [] }: { staff?: any[], attendance?: any[], leaveRequests?: any[] }) {
  const { t } = useLanguage();

  const totalStaff = staff.length;
  const onLeave = leaveRequests.filter(r => r.status === 'Approved' && new Date(r.start_date) <= new Date() && new Date(r.end_date) >= new Date()).length;
  const todayAttendance = attendance.filter(a => a.date?.split('T')[0] === new Date().toISOString().split('T')[0]);
  const attendanceRate = totalStaff > 0 ? Math.round((todayAttendance.filter(a => a.status === 'Present').length / totalStaff) * 100) : 0;
  const pendingLeave = leaveRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">HR Overview</h1>
        <p className="text-zinc-500 mt-1">Manage staff, payroll, and recruitment.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Staff" value={totalStaff.toString()} change="0" trend="up" icon={Users} color="bg-blue-600" />
        <StatCard title="Attendance Rate" value={`${attendanceRate}%`} change="0%" trend="up" icon={ClipboardCheck} color="bg-emerald-600" />
        <StatCard title="On Leave" value={onLeave.toString()} change="0" trend="up" icon={Calendar} color="bg-amber-600" />
        <StatCard title="Pending Leave" value={pendingLeave.toString()} change="0" trend="up" icon={Briefcase} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Staff Distribution</h3>
          <div className="space-y-4">
            {staff.length > 0 ? (
              Object.entries(staff.reduce((acc: any, s: any) => {
                acc[s.department_name || 'Other'] = (acc[s.department_name || 'Other'] || 0) + 1;
                return acc;
              }, {})).map(([dept, count]: [string, any]) => (
                <div key={dept} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{dept}</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{count}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(count / totalStaff) * 100}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-zinc-400 italic text-sm">
                No staff records found.
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Activities</h3>
          <div className="space-y-6">
            {leaveRequests.length > 0 ? (
              leaveRequests
                .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                .slice(0, 3)
                .map((request, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 text-amber-500">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-900 dark:text-white">
                        <span className="font-bold">{request.staff_name || 'Staff'}</span> requested leave: {request.leave_type}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{new Date(request.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-12 text-center text-zinc-400 italic text-sm">
                No recent activities.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export function NonStaffDashboard({ tasks = [] }: { tasks?: any[] }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('support_staff_portal')}</h1>
        <p className="text-zinc-500 mt-1">{t('welcome_back_schedule')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('assigned_tasks')} value={tasks.length.toString()} change="0" trend="up" icon={ClipboardCheck} color="bg-indigo-600" />
        <StatCard title={t('completed')} value="0" change="0" trend="up" icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title={t('shift_hours')} value="—" change="—" trend="up" icon={Clock} color="bg-blue-600" />
        <StatCard title={t('notifications')} value="0" change="0" trend="up" icon={Bell} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('today_tasks')}</h3>
          <div className="space-y-4">
            {tasks.length > 0 ? tasks.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{item.task}</p>
                  <p className="text-xs text-zinc-500">{item.time}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase px-2 py-1 rounded-lg",
                  item.priority === 'High' ? "bg-red-50 text-red-600" : item.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>{item.priority}</span>
              </div>
            )) : (
              <div className="py-12 text-center text-zinc-400 italic text-sm">
                No tasks assigned for today.
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Staff Announcements</h3>
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 italic text-sm">
              No new announcements.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export function StudentDashboard({
  onNavigate,
  user,
  students = [],
  attendance = [],
  invoices = [],
  timetable = [],
  organization,
  unreadMessagesCount = 0
}: {
  onNavigate?: (view: string) => void,
  user?: any,
  students?: any[],
  attendance?: any[],
  invoices?: any[],
  timetable?: any[],
  organization?: any,
  unreadMessagesCount?: number
}) {
  const { currency, t } = useLanguage();

  const student = students.find(s => s.email === user?.email);
  const studentAttendance = attendance.filter(a => a.student_id === student?.id);
  const attendanceRate = studentAttendance.length > 0
    ? Math.round((studentAttendance.filter(a => a.status === 'Present').length / studentAttendance.length) * 100)
    : 0;

  const outstandingFees = invoices
    .filter(inv => inv.student_id === student?.id && (inv.status === 'Pending' || inv.status === 'Overdue'))
    .reduce((sum, inv) => {
      const amount = parseFloat(inv.amount.toString().replace(/[^\d.]/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      {/* Hero Welcome Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
              {(student?.profile_pic || student?.previous_school_profile_pic || user?.profile_pic) ? (
                <img
                  src={student?.profile_pic || student?.previous_school_profile_pic || user?.profile_pic}
                  alt={student?.name || user?.name}
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center rounded-2xl">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-zinc-400 dark:text-zinc-500" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-emerald-500 border-4 border-white dark:border-zinc-900 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-0 py-1 bg-transparent rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4 border-none text-zinc-600 dark:text-zinc-400">
              <Zap className="w-3 h-3 text-amber-500" />
              {t('academic_year')} {organization?.academic_year || '—'}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 text-zinc-900 dark:text-white">
              {t('welcome_back')}, {student?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg font-medium max-w-xl leading-relaxed">
              You're doing great! Your attendance is at <span className="text-indigo-600 dark:text-indigo-400 font-bold">{attendanceRate}%</span> and your profile is <span className="text-indigo-600 dark:text-indigo-400 font-bold">up to date</span>.
            </p>


            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <button
                onClick={() => onNavigate?.('Personal Information')}
                className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg"
              >
                {t('view_full_profile')}
              </button>
              <button
                onClick={() => onNavigate?.('Ask AI')}
                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
              >
                {t('ask_omniai')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('attendance'), value: `${attendanceRate}%`, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: attendanceRate >= 90 ? 'Excellent' : 'Good' },
          { label: t('current_gpa'), value: student?.gpa || '0.0', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: 'Academic' },
          { label: t('outstanding_fees'), value: `${currency} ${outstandingFees.toLocaleString()}`, icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', trend: outstandingFees > 0 ? 'Pending' : 'Cleared' },
          { label: t('upcoming_exams'), value: '0', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: 'View Schedule' },
          { label: 'Gallery', value: 'View', icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', trend: 'Achievements', onClick: () => onNavigate?.('Gallery') },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={stat.onClick}
            className={cn(
              "group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
              stat.onClick && "cursor-pointer"
            )}
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight truncate max-w-[120px]">{stat.value}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
              <div className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", stat.bg, stat.color)}>
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          {/* Today's Schedule - Timeline Style */}
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('todays_schedule')}</h3>
                <p className="text-sm text-zinc-500 font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('Timetable')}
                className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                {t('full_timetable')}
              </button>
            </div>

            <div className="space-y-0 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
              {(() => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const today = days[new Date().getDay()];



                // We need timetable prop here. I'll add it to the component signature in the next step or here.
                // Assuming timetable is passed as part of props.

                const mySchedule = timetable?.filter((t: any) =>
                  t.day_of_week === today && String(t.class_id) === String(student?.class_id)
                ).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)) || [];

                if (mySchedule.length === 0) {
                  return (
                    <div className="pl-16 py-4 text-zinc-500 text-sm italic">
                      No classes scheduled for today.
                    </div>
                  );
                }

                return mySchedule.map((item: any, i: number) => {
                  const now = new Date();
                  const [startH, startM] = item.start_time.split(':').map(Number);
                  const [endH, endM] = item.end_time.split(':').map(Number);

                  const start = new Date(); start.setHours(startH, startM, 0);
                  const end = new Date(); end.setHours(endH, endM, 0);

                  let status = 'Upcoming';
                  if (now > end) status = 'Completed';
                  else if (now >= start && now <= end) status = 'Ongoing';

                  return (
                    <div key={i} className="relative pl-16 pb-8 last:pb-0 group">
                      <div className={cn(
                        "absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-900 z-10 transition-all group-hover:scale-125",
                        status === 'Completed' ? "bg-emerald-500" :
                          status === 'Ongoing' ? "bg-indigo-600 animate-ping" : "bg-zinc-200 dark:bg-zinc-700"
                      )}></div>
                      {status === 'Ongoing' && (
                        <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-indigo-600 z-10"></div>
                      )}

                      <div className={cn(
                        "p-5 rounded-3xl border transition-all duration-300",
                        status === 'Ongoing'
                          ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                          : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{item.start_time} - {item.end_time}</span>
                            </div>
                            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{item.subject_name || 'Subject'}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <Building2 className="w-3.5 h-3.5" />
                                {item.room || 'N/A'}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <User className="w-3.5 h-3.5" />
                                {item.teacher_name || 'Instructor'}
                              </div>
                            </div>
                          </div>

                          {status === 'Ongoing' && (
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                              Join Class
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Assignments & Performance Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Assignments</h3>
                <button onClick={() => onNavigate?.('Assignments')} className="text-xs font-bold text-indigo-600">View All</button>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Calculus Set 4', due: 'Tomorrow', color: 'bg-rose-500' },
                  { title: 'Physics Report', due: 'Mar 10', color: 'bg-amber-500' },
                  { title: 'History Essay', due: 'Mar 12', color: 'bg-indigo-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className={cn("w-2 h-10 rounded-full", item.color)}></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.title}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Due: {item.due}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-8">Attendance Trend</h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {[40, 70, 45, 90, 65, 85, 92].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-1000",
                        i === 6 ? "bg-indigo-600" : "bg-zinc-100 dark:bg-zinc-800"
                      )}
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">This Week</span>
                </div>
                <span className="text-xs font-black text-zinc-900 dark:text-white">92.4% Avg</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          {/* Exam Countdown Card */}
          <div className="relative p-8 bg-zinc-900 rounded-[2.5rem] text-white overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Exam Countdown</span>
              </div>

              <h3 className="text-2xl font-black mb-2 tracking-tight">Physics Mid-term</h3>
              <p className="text-zinc-400 text-sm mb-8">Review Chapter 4: Thermodynamics and Chapter 5: Electromagnetism.</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { val: '03', unit: 'Days' },
                  { val: '14', unit: 'Hours' },
                  { val: '42', unit: 'Mins' },
                ].map((t, i) => (
                  <div key={i} className="text-center p-3 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xl font-black">{t.val}</p>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t.unit}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate?.('Study Materials')}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/40 active:scale-95"
              >
                Open Study Guide
              </button>
            </div>
          </div>

          {/* Announcements - Editorial Style */}
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-8">Announcements</h3>
            <div className="space-y-8">
              {[
                { title: 'Sports Day Postponed', date: 'Mar 5', desc: 'Due to heavy rain forecast, the annual sports meet has been moved to next Friday.', category: 'Events' },
                { title: 'New Library Rules', date: 'Mar 1', desc: 'Starting next week, library hours will be extended until 8:00 PM on weekdays.', category: 'Library' },
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-2">{item.title}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate?.('Announcements')}
              className="w-full mt-8 py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
            >
              View All News
            </button>
          </div>

          {/* AI Tutor Quick Access */}
          <div className="p-8 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-white tracking-tight">OmniAI Tutor</h4>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Online Now</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              "Hi Daniel! I noticed you're studying Physics. Need help with Thermodynamics equations?"
            </p>
            <div className="flex gap-2">
              <button onClick={() => onNavigate?.('Ask AI')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all">Chat Now</button>
              <button className="p-3 bg-white dark:bg-zinc-900 text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:text-indigo-600 transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function OldPartnerDashboard() {
  const { currency, t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchool, setNewSchool] = React.useState({
    name: '', type: 'K-12', email: '', contact_number: '', admin_email: '', admin_password: ''
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { fetchPartnerDashboard } = await import('../lib/api');
      const res = await fetchPartnerDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { partnerCreateSchool } = await import('../lib/api');
      await partnerCreateSchool(newSchool);
      setShowAddModal(false);
      loadDashboard();
      (window as any).showToast?.('School added successfully', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err?.response?.data?.error || 'Failed to add school', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Partner Portal</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-zinc-500">{t('manage_your_referrals_and_provision_schools')}</p>
            {data?.partner?.company_name && (
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">{data.partner.company_name}</span>
                <span className="text-[10px] text-zinc-400 font-medium">({data.partner.registration_number})</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Building2 className="w-5 h-5" />
          Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Earnings" value={`${currency} ${data?.partner?.total_earnings || 0}`} change="+0%" trend="up" icon={Wallet} color="bg-emerald-600" />
        <StatCard title="Referred Schools" value={data?.schools?.length || "0"} change="+1" trend="up" icon={School} color="bg-indigo-600" />
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-widest mb-2">Referral Code</p>
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <span className="text-2xl font-black text-indigo-600 tracking-widest">{data?.partner?.referral_code}</span>
            <button onClick={() => {
              navigator.clipboard.writeText(data?.partner?.referral_code || '');
              (window as any).showToast?.('Copied!', 'success');
            }} className="p-2 text-indigo-400 hover:text-indigo-600">
              <ClipboardCheck className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-8">Referred Schools</h3>
        {data?.schools?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-4">School Name</th>
                  <th className="py-4">Type</th>
                  <th className="py-4">Plan</th>
                  <th className="py-4">Created At</th>
                  <th className="py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.schools.map((school: any) => (
                  <tr key={school.id} className="text-sm border-zinc-100 dark:border-zinc-800">
                    <td className="py-4 font-bold text-zinc-900 dark:text-white">{school.name}</td>
                    <td className="py-4 text-zinc-500">{school.type}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
                        {school.plan}
                      </span>
                    </td>
                    <td className="py-4 text-zinc-500">{new Date(school.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-900/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {school.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Building2 className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 font-medium">You haven't referred any schools yet.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 text-indigo-600 font-bold hover:underline">Add your first school</button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">Provision New School</h2>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">School Name</label>
                <input required type="text" value={newSchool.name} onChange={e => setNewSchool({ ...newSchool, name: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Lincoln High" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Type</label>
                  <select value={newSchool.type} onChange={e => setNewSchool({ ...newSchool, type: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500">
                    <option>K-12</option>
                    <option>Primary</option>
                    <option>Secondary</option>
                    <option>University</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Contact Number</label>
                  <input required type="text" value={newSchool.contact_number} onChange={e => setNewSchool({ ...newSchool, contact_number: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">School General Email</label>
                <input required type="email" value={newSchool.email} onChange={e => setNewSchool({ ...newSchool, email: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-4">First Admin Account</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Admin Email</label>
                    <input required type="email" value={newSchool.admin_email} onChange={e => setNewSchool({ ...newSchool, admin_email: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Admin Password</label>
                    <input required type="password" value={newSchool.admin_password} onChange={e => setNewSchool({ ...newSchool, admin_password: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none">Provision School</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
