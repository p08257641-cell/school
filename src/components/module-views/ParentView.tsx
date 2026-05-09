import React from 'react';
import { 
  User, Mail, Phone, MapPin, ShieldCheck, 
  Users, CreditCard, Bell, Lock, LogOut, Send,
  GraduationCap, ChevronRight, Package
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AcademicModules, ExamModules } from './SchoolAdminView';
import { FinanceModules } from './FinanceView';
import { OperationsModules } from './OperationsView';
import { UserRole, Ward } from '../../types';

export const ParentModules = {
  AcademicInformation: AcademicModules.StudentManagement,
  Attendance: AcademicModules.Attendance,
  Timetable: AcademicModules.Timetable,
  ExamSchedules: ExamModules.ExamSchedules,
  WardResults: ExamModules.ResultsManagement,
  ResultAnalysis: ExamModules.ResultAnalysis,
  InvoicesPayments: FinanceModules.InvoicesPayments,
  HealthMedical: OperationsModules.HealthMedical,
  Transport: OperationsModules.Transport,
  Hostel: OperationsModules.Hostel,
  BehaviorDiscipline: OperationsModules.BehaviorDiscipline,

  FeedbackGrievances: ({ currentUser }: { currentUser: any }) => {
    const [feedbacks, setFeedbacks] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showForm, setShowForm] = React.useState(false);
    const [formData, setFormData] = React.useState({ category: 'General', subject: '', description: '' });
    const apiUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000' : '';

    const fetchFeedbacks = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/comm/feedbacks`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setFeedbacks(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => {
      fetchFeedbacks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const res = await fetch(`${apiUrl}/api/comm/feedbacks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          setShowForm(false);
          setFormData({ category: 'General', subject: '', description: '' });
          fetchFeedbacks();
        } else {
          alert('Failed to submit feedback');
        }
      } catch (e) {
        console.error(e);
        alert('An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Feedback & Grievances</h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors"
          >
            {showForm ? 'Cancel' : 'Submit New'}
          </button>
        </div>

        {showForm && (
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">New Feedback / Grievance</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Transport">Transport</option>
                    <option value="Finance">Finance</option>
                    <option value="Grievance">Grievance</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Subject</label>
                  <input 
                    type="text" 
                    value={formData.subject} 
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-indigo-500"
                    placeholder="Brief subject..."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-indigo-500 min-h-[120px]"
                  placeholder="Provide detailed information..."
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit to Administration'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.map(f => (
            <div key={f.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col h-full shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className={cn("px-3 py-1 rounded-lg text-xs font-bold",
                  f.category === 'Grievance' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  f.category === 'Academic' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  f.category === 'Finance' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}>
                  {f.category}
                </span>
                <span className={cn("px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest",
                  f.status === 'Resolved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                  f.status === 'In Progress' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                  "bg-zinc-50 text-zinc-600 border border-zinc-100"
                )}>
                  {f.status}
                </span>
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-2">{f.subject}</h4>
              <p className="text-sm text-zinc-500 mb-4 whitespace-pre-wrap">{f.description}</p>
              
              {f.reply && (
                <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Admin Reply</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700/50">{f.reply}</p>
                </div>
              )}
              <div className="text-[10px] text-zinc-400 mt-4 text-right">
                {new Date(f.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {!loading && feedbacks.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl border-dashed">
              No feedback or grievances submitted yet.
            </div>
          )}
        </div>
      </div>
    );
  },

  ParentProfile: ({ currentUser, wards = [], onNavigate, onEnableNotifications }: { currentUser: any, wards?: Ward[], onNavigate?: (view: string) => void, onEnableNotifications?: () => void }) => {
    const stats = [
      { label: 'Registered Wards', value: wards.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
      { label: 'Active Status', value: 'Verified', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Account Type', value: 'Parent Portal', icon: User, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="relative overflow-hidden p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="w-40 h-40 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl">
              {currentUser?.profile_pic ? (
                <img src={currentUser.profile_pic} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-5xl font-black">
                  {currentUser?.name?.charAt(0) || 'P'}
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {currentUser?.name || 'Parent Name'}
                </h1>
                <span className="px-4 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg shadow-indigo-200 dark:shadow-none">
                  Parent Account
                </span>
              </div>
              <p className="text-zinc-500 font-medium text-lg flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-5 h-5" />
                {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm group hover:border-indigo-500/50 transition-all">
                  <div className={cn("p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* My Wards */}
            <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                Registered Wards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wards.map((ward, i) => (
                  <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm overflow-hidden">
                        {ward.profile_pic ? (
                          <img src={ward.profile_pic} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{ward.name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{ward.class || 'N/A'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate?.('AcademicInformation')}
                      className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Details */}
            <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { label: 'Full Name', value: currentUser?.name || 'N/A', icon: User },
                  { label: 'Email Address', value: currentUser?.email || 'N/A', icon: Mail },
                  { label: 'Phone Number', value: currentUser?.phone || 'N/A', icon: Phone },
                  { label: 'Home Address', value: currentUser?.address || 'N/A', icon: MapPin },
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

          <div className="space-y-8">
            {/* Quick Link */}
            <div className="p-8 bg-zinc-900 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative">
                <h3 className="text-xl font-bold mb-2">School Store</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Need uniforms or supplies? Browse our inventory catalog and make requests online.</p>
                <button 
                  onClick={() => onNavigate?.('Inventory Request')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Visit Store
                </button>
              </div>
            </div>

            {/* Security */}
            <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Account & Security</h3>
              <div className="space-y-4">
                <button className="flex items-center justify-between w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                      <Lock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Change Password</p>
                      <p className="text-[10px] text-zinc-400 font-medium">Update your credentials</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={onEnableNotifications}
                  className="flex items-center justify-between w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                      <Bell className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Notifications</p>
                      <p className="text-[10px] text-zinc-400 font-medium">Click to enable device alerts</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:5000' : ''}/api/auth/test-push`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                      });
                      const data = await res.json();
                      if (res.ok) alert("Test notification sent!");
                      else alert(data.error || "Failed to send test");
                    } catch (e) {
                      alert("Error sending test");
                    }
                  }}
                  className="flex items-center justify-between w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                      <Send className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Test Notification</p>
                      <p className="text-[10px] text-zinc-400 font-medium">Send a test alert to your device</p>
                    </div>
                  </div>
                </button>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button className="flex items-center gap-3 text-red-600 font-bold text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
