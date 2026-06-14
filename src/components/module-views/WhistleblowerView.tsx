import React, { useState, useEffect } from 'react';
import {
  Flag, Send, Shield, Clock, AlertTriangle, CheckCircle2, Search,
  Eye, Trash2, ChevronDown, Loader2, Lock, X, Filter
} from 'lucide-react';
import {
  fetchWhistleblowerReports,
  createWhistleblowerReport,
  updateWhistleblowerStatus,
  deleteWhistleblowerReport
} from '../../lib/api';
import { cn } from '../../lib/utils';

const CATEGORIES = ['General', 'Misconduct', 'Safety Concern', 'Harassment', 'Fraud', 'Policy Violation', 'Other'];
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTIONS = ['Pending', 'Reviewing', 'Investigating', 'Resolved', 'Dismissed'];

const urgencyColor = (u: string) => {
  switch (u?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  }
};

const statusColor = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'resolved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'investigating': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'reviewing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'dismissed': return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
    default: return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  }
};

// ============================================================
// STAFF VIEW — Anonymous submission form
// ============================================================
const StaffSubmissionForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [urgency, setUrgency] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await createWhistleblowerReport({ title, description, category, urgency });
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setCategory('General');
      setUrgency('Medium');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      (window as any).showToast?.(err?.response?.data?.error || 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Privacy Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
        <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Anonymous Report</h2>
            <p className="text-white/70 text-sm mt-2 leading-relaxed">
              Your identity is <strong className="text-white">completely protected</strong>. No personal information — including your name, email, or staff ID — is recorded or stored with this report. Only the School Administration will receive the content of your submission.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/50">
          <Lock className="w-3.5 h-3.5" />
          <span>End-to-end anonymous • No identifiers stored • Admin eyes only</span>
        </div>
      </div>

      {/* Success Banner */}
      {submitted && (
        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">Report Submitted Successfully</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">Your anonymous report has been delivered to the School Administration.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 space-y-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Report Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your concern..."
            className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Urgency Level</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about your concern. Be as specific as possible..."
            rows={6}
            className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none leading-relaxed"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !title.trim() || !description.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-sm"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Anonymously...</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Anonymous Report</>
          )}
        </button>
      </form>
    </div>
  );
};

// ============================================================
// ADMIN VIEW — Reports dashboard
// ============================================================
const AdminReportsDashboard: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReport, setViewingReport] = useState<any | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchWhistleblowerReports();
      setReports(data);
    } catch (err) {
      (window as any).showToast?.('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateWhistleblowerStatus(id, newStatus);
      (window as any).showToast?.(`Report status updated to "${newStatus}"`, 'success');
      loadReports();
      if (viewingReport?.id === id) setViewingReport((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err) {
      (window as any).showToast?.('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      await deleteWhistleblowerReport(id);
      (window as any).showToast?.('Report deleted', 'success');
      setViewingReport(null);
      loadReports();
    } catch (err) {
      (window as any).showToast?.('Failed to delete report', 'error');
    }
  };

  const filtered = reports.filter(r => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (filterUrgency !== 'All' && r.urgency !== filterUrgency) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && !r.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    investigating: reports.filter(r => r.status === 'Investigating' || r.status === 'Reviewing').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: Flag },
          { label: 'Pending', value: stats.pending, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: Clock },
          { label: 'Under Review', value: stats.investigating, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: AlertTriangle },
          { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
        ].map((s, i) => (
          <div key={i} className={cn("p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm", s.bg)}>
            <s.icon className={cn("w-5 h-5 mb-2", s.color)} />
            <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold">
            <option value="All">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)} className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold">
            <option value="All">All Urgency</option>
            {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-700">
          <Flag className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold">No reports found</p>
          <p className="text-zinc-400 text-sm mt-1">Adjust your filters or check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              onClick={() => setViewingReport(report)}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", urgencyColor(report.urgency))}>
                      {report.urgency}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest", statusColor(report.status))}>
                      {report.status}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {report.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                    {report.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{report.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(report.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingReport(null)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Report Details</h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Anonymous Submission</p>
                </div>
              </div>
              <button onClick={() => setViewingReport(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", urgencyColor(viewingReport.urgency))}>
                  {viewingReport.urgency} Priority
                </span>
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", statusColor(viewingReport.status))}>
                  {viewingReport.status}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {viewingReport.category}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">{viewingReport.title}</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {new Date(viewingReport.created_at).toLocaleString()}
                </p>
              </div>

              <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{viewingReport.description}</p>
              </div>

              {/* Update Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(viewingReport.id, s)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                        viewingReport.status === s
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 hover:text-indigo-600"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
              <button
                onClick={() => handleDelete(viewingReport.id)}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Report
              </button>
              <button
                onClick={() => setViewingReport(null)}
                className="px-6 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl text-xs hover:bg-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN VIEW — Adapts based on role
// ============================================================
const WhistleblowerView: React.FC<{ role: string }> = ({ role }) => {
  const isAdmin = role === 'SCHOOL_ADMIN';

  return (
    <div className="space-y-6 p-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none shrink-0 ring-2 ring-white/30 dark:ring-white/10">
          <span className="text-white text-sm font-black tracking-wider select-none">WB</span>
        </div>
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {isAdmin ? 'Whistle Blower Reports' : 'Whistle Blower'}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {isAdmin
              ? 'Review and manage anonymous reports from staff members'
              : 'Report concerns anonymously to the School Administration'}
          </p>
        </div>
      </div>

      {isAdmin ? <AdminReportsDashboard /> : <StaffSubmissionForm />}
    </div>
  );
};

export default WhistleblowerView;
