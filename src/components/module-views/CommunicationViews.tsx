import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { Bell, Plus, Trash2, ShieldAlert, Users, GraduationCap, UserCircle, Calendar, MapPin, Clock, MessageSquare, Smartphone, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Modal } from '../UI';
import { API_BASE_URL } from '../../constants';

export function Announcements({ role, students = [], staff = [], organization }: { role: string; students?: any[]; staff?: any[]; organization?: any }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'announcements' | 'meetings'>('announcements');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'ALL',
    priority: 'Normal',
    class_id: '',
    scheduled_for: '',
    send_sms: false
  });
  const [meetingFormData, setMeetingFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    target_audience: 'ALL',
    class_id: '',
    location: ''
  });

  const canManage = role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'HOD';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [annRes, meetRes, classRes] = await Promise.all([
        fetch(`${API_BASE_URL}/announcements`, { headers }),
        fetch(`${API_BASE_URL}/meetings`, { headers }),
        fetch(`${API_BASE_URL}/academic/classes`, { headers })
      ]);

      if (annRes.ok) setAnnouncements(await annRes.json());
      if (meetRes.ok) setMeetings(await meetRes.json());
      if (classRes.ok) setClasses(await classRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        (window as any).showToast?.('Announcement created!', 'success');
        setIsModalOpen(false);
        setFormData({ title: '', content: '', target_audience: 'ALL', priority: 'Normal', class_id: '', scheduled_for: '', send_sms: false });
        fetchData();
      } else {
        const error = await res.json();
        (window as any).showToast?.(error, 'error');
      }
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meetingFormData)
      });
      if (res.ok) {
        (window as any).showToast?.('Meeting scheduled!', 'success');
        setIsMeetingModalOpen(false);
        setMeetingFormData({ title: '', description: '', start_time: '', end_time: '', target_audience: 'ALL', class_id: '', location: '' });
        fetchData();
      } else {
        const error = await res.json();
        (window as any).showToast?.(error, 'error');
      }
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        (window as any).showToast?.('Announcement deleted', 'success');
        fetchData();
      }
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/meetings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        (window as any).showToast?.('Meeting cancelled', 'success');
        fetchData();
      }
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'STUDENT': return <GraduationCap className="w-4 h-4" />;
      case 'STAFF': return <ShieldAlert className="w-4 h-4" />;
      case 'PARENT': return <UserCircle className="w-4 h-4" />;
      case 'CLASS': return <Calendar className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRecipientCount = () => {
    const { target_audience, class_id } = formData;
    if (target_audience === 'STAFF') return staff.length;
    if (target_audience === 'STUDENT' || target_audience === 'PARENT') return students.length;
    if (target_audience === 'CLASS') return students.filter(s => s.class_id === class_id).length;
    return (staff.length + students.length); // ALL
  };

  const recipientCount = getRecipientCount();
  const smsBalance = organization?.sms_balance || 0;
  const hasEnoughBalance = smsBalance >= recipientCount;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            {t('Communication')}
          </h2>
          <div className="flex items-center gap-4 mt-4 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('announcements')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'announcements' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500"
              )}
            >
              Announcements
            </button>
            <button 
              onClick={() => setActiveTab('meetings')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'meetings' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500"
              )}
            >
              Meetings
            </button>
          </div>
        </div>
        {canManage && (
          <button 
            onClick={() => activeTab === 'announcements' ? setIsModalOpen(true) : setIsMeetingModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'announcements' ? 'Broadcast Announcement' : 'Schedule Meeting'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {activeTab === 'announcements' ? (
          announcements.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Bell className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Announcements Yet</h3>
              <p className="text-zinc-500">There are no active announcements to display.</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div 
                key={ann.id} 
                className={cn(
                  "p-4 sm:p-6 rounded-2xl border transition-all hover:shadow-md animate-in slide-in-from-bottom-2",
                  ann.priority === 'High' 
                    ? "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          ann.target_audience === 'ALL' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                          ann.target_audience === 'STAFF' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          ann.target_audience === 'STUDENT' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          ann.target_audience === 'PARENT' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {getAudienceIcon(ann.target_audience)}
                          {ann.target_audience === 'ALL' ? 'Everyone' : 
                           ann.target_audience === 'CLASS' ? `Class: ${ann.class_name}` : 
                           ann.target_audience}
                        </span>
                        {ann.priority === 'High' && (
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            Urgent
                          </span>
                        )}
                        {ann.scheduled_for && new Date(ann.scheduled_for) > new Date() && (
                          <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Scheduled: {new Date(ann.scheduled_for).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{ann.title}</h3>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 pt-2">
                      <span className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                          {ann.sender_name?.charAt(0) || 'A'}
                        </div>
                        {ann.sender_name || 'System Admin'}
                      </span>
                      <span>•</span>
                      <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {canManage && (
                    <button 
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          meetings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Calendar className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Meetings Scheduled</h3>
              <p className="text-zinc-500">There are no upcoming meetings to display.</p>
            </div>
          ) : (
            meetings.map((meet) => (
              <div 
                key={meet.id} 
                className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md transition-all animate-in slide-in-from-bottom-2"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {getAudienceIcon(meet.target_audience)}
                        {meet.target_audience === 'ALL' ? 'Everyone' : 
                         meet.target_audience === 'CLASS' ? `Class: ${meet.class_name}` : 
                         meet.target_audience}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {meet.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{meet.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{meet.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Date & Time</p>
                          <p className="font-semibold">{new Date(meet.start_time).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Location</p>
                          <p className="font-semibold">{meet.location || 'TBA'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <button 
                      onClick={() => handleDeleteMeeting(meet.id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Broadcast Announcement">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g., Parent-Teacher Meeting Tomorrow"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Content</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Write the details of the announcement..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Target Audience</label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">Everyone</option>
                <option value="STAFF">Staff Only</option>
                <option value="STUDENT">All Students</option>
                <option value="PARENT">All Parents</option>
                <option value="CLASS">Specific Class</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="Normal">Normal</option>
                <option value="High">High (Urgent)</option>
              </select>
            </div>
          </div>

          {formData.target_audience === 'CLASS' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Select Class</label>
              <select
                required
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="">Select a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Schedule Delivery (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[10px] text-zinc-500">Leave blank to broadcast immediately.</p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Send as SMS</p>
                  <p className="text-[10px] text-zinc-500">Broadcast as a text message to phones</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.send_sms}
                  onChange={(e) => setFormData({ ...formData, send_sms: e.target.checked })}
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.send_sms && (
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-zinc-500">SMS Balance:</span>
                  <span className={cn("font-bold", smsBalance < 10 ? "text-red-500" : "text-emerald-500")}>
                    {smsBalance} credits
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Required Credits:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {recipientCount} (1 per recipient)
                  </span>
                </div>

                {!hasEnoughBalance && (
                  <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/20 text-[10px] leading-tight">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <p>Insufficient SMS balance to send to all {recipientCount} recipients. Please top up your balance.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
              Broadcast Now
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} title="Schedule New Meeting">
        <form onSubmit={handleMeetingSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Meeting Title</label>
            <input
              type="text"
              required
              value={meetingFormData.title}
              onChange={(e) => setMeetingFormData({ ...meetingFormData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g., Staff General Meeting"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea
              rows={3}
              value={meetingFormData.description}
              onChange={(e) => setMeetingFormData({ ...meetingFormData, description: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Agenda or further details..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Start Time</label>
              <input
                type="datetime-local"
                required
                value={meetingFormData.start_time}
                onChange={(e) => setMeetingFormData({ ...meetingFormData, start_time: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">End Time</label>
              <input
                type="datetime-local"
                value={meetingFormData.end_time}
                onChange={(e) => setMeetingFormData({ ...meetingFormData, end_time: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Location / Link</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={meetingFormData.location}
                onChange={(e) => setMeetingFormData({ ...meetingFormData, location: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., Staff Room or Google Meet Link"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Target Audience</label>
              <select
                value={meetingFormData.target_audience}
                onChange={(e) => setMeetingFormData({ ...meetingFormData, target_audience: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">Everyone</option>
                <option value="STAFF">Staff Only</option>
                <option value="STUDENT">All Students</option>
                <option value="PARENT">All Parents</option>
                <option value="CLASS">Specific Class</option>
              </select>
            </div>
            {meetingFormData.target_audience === 'CLASS' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Select Class</label>
                <select
                  required
                  value={meetingFormData.class_id}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, class_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800 mt-6">
            <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-5 py-2.5 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
              Schedule Meeting
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function FeedbackManagement({ students = [], staff = [] }: { students?: any[]; staff?: any[] }) {
  const { t } = useLanguage();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState('Pending');

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/comm/feedbacks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFeedbacks(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/comm/feedbacks/${selectedFeedback.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          admin_reply: replyText || null
        })
      });
      if (res.ok) {
        (window as any).showToast?.('Feedback updated successfully', 'success');
        setSelectedFeedback(null);
        fetchFeedbacks();
      } else {
        const err = await res.json();
        (window as any).showToast?.(err.error, 'error');
      }
    } catch (err) {
      console.error(err);
      (window as any).showToast?.('Failed to update feedback', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          Feedback & Grievances
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 font-bold text-sm text-zinc-600 dark:text-zinc-400">
              Recent Feedbacks
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[600px] overflow-y-auto custom-scrollbar">
              {feedbacks.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No feedbacks received yet.</div>
              ) : (
                feedbacks.map(fb => (
                  <button
                    key={fb.id}
                    onClick={() => {
                      setSelectedFeedback(fb);
                      setStatus(fb.status);
                      setReplyText(fb.admin_reply || '');
                    }}
                    className={cn(
                      "w-full p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
                      selectedFeedback?.id === fb.id ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                        fb.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                        fb.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {fb.status}
                      </span>
                      <span className="text-xs text-zinc-400">{new Date(fb.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{fb.category}</p>
                    <p className="text-xs text-zinc-500 mt-1 truncate">{fb.description}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedFeedback ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
                      {selectedFeedback.category}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      from Parent ID: {selectedFeedback.parent_id}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 mt-2 tracking-widest">Submitted on {new Date(selectedFeedback.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl mb-6">
                <p className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedFeedback.description}</p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                  Admin Response
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Update Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 mt-4">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reply to Parent</label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Enter your response here. This will be visible to the parent."
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl resize-none text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setSelectedFeedback(null)} className="px-5 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors uppercase tracking-widest">
                    Close
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-colors shadow-sm uppercase tracking-widest">
                    Save Updates
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Select a Feedback</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">Choose a feedback from the list to view details and provide a response.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
