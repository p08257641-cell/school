import React from 'react';
import { 
  User, Mail, Shield, ShieldCheck, Activity, 
  Building2, Users, Receipt, Globe, 
  Settings, Lock, Bell, LogOut,
  TrendingUp, CreditCard, PieChart,
  GraduationCap, Briefcase, Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProfileProps {
  currentUser: any;
  orgCount?: number;
  partnerCount?: number;
  totalUsers?: number;
  studentsCount?: number;
  staffCount?: number;
  departmentsCount?: number;
  organization?: any;
}

export const Profile = ({ 
  currentUser, 
  orgCount = 0, 
  partnerCount = 0, 
  totalUsers = 0,
  studentsCount = 0,
  staffCount = 0,
  departmentsCount = 0,
  organization
}: ProfileProps) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const stats = isSuperAdmin ? [
    { label: 'Organizations', value: orgCount, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Partners', value: partnerCount, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'System Users', value: totalUsers, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ] : [
    { label: 'Total Students', value: studentsCount, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total Staff', value: staffCount, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Departments', value: departmentsCount, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -ml-32 -mb-32" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl transition-transform duration-500 group-hover:scale-105">
              {currentUser?.profile_pic ? (
                <img 
                  src={currentUser.profile_pic} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-5xl font-black">
                  {currentUser?.name?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 animate-bounce">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                {currentUser?.name || (isSuperAdmin ? 'Super Administrator' : 'School Administrator')}
              </h1>
              <span className="px-4 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg shadow-indigo-200 dark:shadow-none">
                {currentUser?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            <p className="text-zinc-500 font-medium text-lg flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-5 h-5" />
              {currentUser?.email || 'admin@schoolgo.com'}
            </p>
            {!isSuperAdmin && organization && (
              <p className="text-zinc-400 font-bold text-sm flex items-center justify-center md:justify-start gap-2 uppercase tracking-widest mt-1">
                <Building2 className="w-4 h-4 text-indigo-500" />
                {organization.name}
              </p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800" />
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  +12
                </div>
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {isSuperAdmin ? 'Platform Activity Leader' : 'School Administration Team'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
                <div className={cn("p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value.toLocaleString()}</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
              <User className="w-6 h-6 text-indigo-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { label: 'Full Name', value: currentUser?.name || 'N/A', icon: User },
                { label: 'Email Address', value: currentUser?.email || 'N/A', icon: Mail },
                { label: 'System Access', value: isSuperAdmin ? 'Root / Global' : 'Organization Administrative', icon: Shield },
                { label: 'Account Tier', value: isSuperAdmin ? 'Enterprise Elite' : (organization?.plan || 'Premium'), icon: TrendingUp },
                { label: 'Platform Status', value: 'Active / Verified', icon: Globe },
                { label: 'Member Since', value: currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2024', icon: Receipt },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <item.icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.label}</p>
                    <p className="font-bold text-zinc-900 dark:text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Security */}
        <div className="space-y-8">
          <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <h3 className="text-xl font-bold mb-2">{isSuperAdmin ? 'Platform Master' : 'School Admin'}</h3>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                {isSuperAdmin 
                  ? 'You have complete control over all organizations, partners, and system modules.'
                  : 'You have full administrative oversight of your school, staff, and student records.'}
              </p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20">
                View Audit Logs
              </button>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Security & Identity</h3>
            <div className="space-y-4">
              <button className="flex items-center justify-between w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group text-left">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Change Password</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Keep your access secure</p>
                  </div>
                </div>
              </button>
              
              <button className="flex items-center justify-between w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group text-left">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                    <Bell className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Push Notifications</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Manage your alerts</p>
                  </div>
                </div>
              </button>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button className="flex items-center gap-3 text-red-600 font-bold text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                  <LogOut className="w-4 h-4" />
                  Sign Out of Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
