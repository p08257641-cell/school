import React, { useState, useEffect, useMemo } from 'react';
import { UserRole } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Globe,
  Briefcase,
  DollarSign,
  Coins,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Award,
  Medal,
  GraduationCap,
  Camera,
  Brain,
  Zap,
  Search,
  Filter,
  Check,
  X,
  Shield,
  User,
  Mail,
  CreditCard,
  Settings as SettingsIcon,
  MessageSquare,
  Send,
  Printer,
  Eye,
  Fingerprint,
  TrendingUp,
  Palette,
  RotateCw,
  RefreshCw,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import { DataTable } from './DataTable';
import { Modal, ConfirmationModal } from './UI';
import {
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
  createOrganization,
  fetchReceipts,
  fetchOrganizations,
  updateModule,
  fetchPlatformUsers,
  updateSubscription,
  deleteSubscription,
  deletePlatformUser,
  createSubscription,
  registerPlatformUser,
  fetchOrganization,
  updateOrganization,
  fetchDocumentTemplates,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  fetchPartners,
  createPartnerAdmin,
  updatePartner,
  deletePartnerAdmin,
  approvePartner,
  resetPartnerPassword,
  resetUserPassword,
  awardPartnerReward,
  fetchPartnerRewards,
  deletePartnerReward,
  syncPublicHolidays,
  saveAIKey,
  fetchAIKeys,
  generateAIResponse
} from '../lib/api';
import { API_BASE_URL, PAYSTACK_PUBLIC_KEY } from '../constants';

export function UsersManagement({ data, onRefresh, organizations = [] }: { data?: any[], onRefresh?: () => void, organizations?: any[] }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SCHOOL_ADMIN',
    org_id: '',
    password: 'zxcv123$$'
  });

  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('zxcv123$$');

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, user: any | null }>({
    isOpen: false,
    user: null
  });

  const [viewingUser, setViewingUser] = useState<any | null>(null);

  const handleAdd = () => {
    setFormData({ name: '', email: '', role: 'SCHOOL_ADMIN', org_id: '', password: 'zxcv123$$' } as any);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerPlatformUser(formData);
      (window as any).showToast?.('User created successfully!', 'success');
      setIsModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to create user:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleDeleteClick = (user: any) => {
    setDeleteConfirm({ isOpen: true, user });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.user) return;
    try {
      await deletePlatformUser(deleteConfirm.user.id);
      (window as any).showToast?.('User deleted successfully!', 'success');
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete user:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <DataTable
        title="Platform Users"
        data={data || []}
        onAdd={handleAdd}
        onDelete={handleDeleteClick}
        onView={(user) => setViewingUser(user)}
        extraActions={(user) => (
          <button
            onClick={() => setResetPasswordUser(user)}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Reset Password
          </button>
        )}
        columns={[
          { header: 'Name', accessor: 'name', className: 'font-bold' },
          {
            header: 'Role',
            accessor: (item: any) => (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase">
                {item.role.replace('_', ' ')}
              </span>
            )
          },
          { header: 'Organization', accessor: 'org_name', className: 'text-zinc-500' },
          { header: 'Joined', accessor: (item: any) => new Date(item.created_at).toLocaleDateString() }
        ]}
      />

      <Modal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details" maxWidth="max-w-2xl">
        {viewingUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
                {viewingUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{viewingUser.name}</h3>
                <p className="text-zinc-500 font-medium">{viewingUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Platform Role</p>
                <p className="font-bold text-indigo-600">{viewingUser.role.replace('_', ' ')}</p>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Organization</p>
                <p className="font-bold text-zinc-900 dark:text-white">{viewingUser.org_name || 'System / Platform'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Member Since</p>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">{new Date(viewingUser.created_at).toLocaleDateString()}</p>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Account Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="font-bold text-emerald-600">Active</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setResetPasswordUser(viewingUser);
                  setViewingUser(null);
                }}
                className="px-4 py-2 bg-amber-50 text-amber-600 font-bold rounded-xl text-xs flex items-center gap-2"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Change Password
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!resetPasswordUser}
        onClose={() => {
          setResetPasswordUser(null);
          setNewPassword('zxcv123$$');
        }}
        title="Reset User Password"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-sm text-amber-800 font-medium">
              You are resetting the password for <span className="font-bold">{resetPasswordUser?.name}</span> ({resetPasswordUser?.email}).
              The system default is <span className="font-bold">zxcv123$$</span>.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">New Password</label>
            <div className="relative">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new secure password"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                onClick={() => setNewPassword(Math.random().toString(36).slice(-10))}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-900"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setResetPasswordUser(null);
                setNewPassword('zxcv123$$');
              }}
              className="px-4 py-2 text-sm font-bold text-zinc-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!newPassword) return (window as any).showToast?.('Please enter a password', 'error');
                try {
                  await resetUserPassword(resetPasswordUser.id, { password: newPassword });
                  (window as any).showToast?.('Password reset successfully!', 'success');
                  setResetPasswordUser(null);
                  setNewPassword('zxcv123$$');
                } catch (err) {
                  console.error('Failed to reset password:', err);
                  (window as any).showToast?.(err, 'error');
                }
              }}
              className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-200"
            >
              Update Password
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Platform User">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Password</label>
              <input
                type="password"
                value={(formData as any).password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value } as any)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
                <option value="FINANCE">Finance</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Organization</label>
              <select
                value={formData.org_id}
                onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="">None (Platform)</option>
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-zinc-500">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Create User</button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete user ${deleteConfirm.user?.name}? This action cannot be undone and will remove all associated logs and records.`}
      />
    </div>
  );
}

export function CreateOrganization({ onRefresh }: { onRefresh?: () => void }) {
  return <OrganizationForm onRefresh={onRefresh} />;
}

export function EditOrganization({ organization, onRefresh, onBack }: { organization: any, onRefresh?: () => void, onBack?: () => void }) {
  return <OrganizationForm initialData={organization} isEdit onRefresh={onRefresh} onBack={onBack} />;
}

function OrganizationForm({ initialData, isEdit = false, onRefresh, onBack }: { initialData?: any, isEdit?: boolean, onRefresh?: () => void, onBack?: () => void }) {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'Primary School',
    email: initialData?.email || '',
    contact_number: initialData?.contact_number || '',
    address: initialData?.address || '',
    custom_domain: initialData?.custom_domain || '',
    logo: initialData?.logo || '',
    signature: initialData?.signature || '',
    plan: initialData?.plan || '',
    status: initialData?.status || 'Active',
    language: initialData?.language || 'en',
    timezone: initialData?.timezone || 'GMT',
    term_start_date: initialData?.term_start_date || '',
    term_end_date: initialData?.term_end_date || '',
    attendance_include_weekends: initialData?.attendance_include_weekends || false,
    attendance_total_days: initialData?.attendance_total_days || 0,
    late_time: initialData?.late_time || '08:00:00'
  });

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
    const loadPlans = async () => {
      try {
        const data = await fetchPlans();
        setPlans(data);
        if (data.length > 0 && !formData.plan) {
          setFormData(prev => ({ ...prev, plan: data[0].name }));
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    };
    loadPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && initialData?.id) {
        await updateOrganization(initialData.id, formData);
        (window as any).showToast?.(t('organization') + ' updated successfully!', 'success');
      } else {
        await createOrganization(formData);
        (window as any).showToast?.(t('create_organization') + ' successfully!', 'success');
        // Reset form if not editing
        setFormData({
          name: '',
          type: 'Primary School',
          email: '',
          contact_number: '',
          address: '',
          custom_domain: '',
          logo: '',
          signature: '',
          plan: plans[0]?.name || '',
          status: 'Active',
          language: 'en',
          timezone: 'GMT',
          term_start_date: '',
          term_end_date: '',
          attendance_include_weekends: false,
          attendance_total_days: 0,
          late_time: '08:00:00'
        });
      }
      onRefresh?.();
      onBack?.();
    } catch (err: any) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} organization:`, err);
      (window as any).showToast?.(err, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{isEdit ? t('edit_organization') : t('create_new_organization')}</h2>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Back to List
            </button>
          )}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('organization_name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. St. Patrick's School"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('organization_type')}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isEdit}
              >
                <option>Primary School</option>
                <option>High School</option>
                <option>University</option>
                <option>Vocational</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('admin_email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@school.com"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('custom_domain')}</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  placeholder="school-name"
                  className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-l-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isEdit}
                />
                <span className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-700 border border-l-0 border-zinc-200 dark:border-zinc-700 rounded-r-xl text-zinc-500 text-sm">.schoolhub.com</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('school_logo')}</label>
              <div className="flex items-center gap-4">
                {formData.logo && (
                  <img src={formData.logo} alt="Logo Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Principal's Signature</label>
              <div className="flex items-center gap-4">
                {formData.signature && (
                  <img src={formData.signature} alt="Signature Preview" className="w-12 h-12 rounded-lg object-contain border border-zinc-200 dark:border-zinc-700" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'signature')}
                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('contact_number')}</label>
              <input
                type="tel"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('physical_address')}</label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full address"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isEdit}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('subscription_plan')}</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
                <option value="Demo Request">Demo Request</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('default_language')}</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isEdit}
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="pt">Portuguese</option>
                <option value="sw">Swahili</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('time_zone')}</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isEdit}
              >
                <option value="GMT">GMT (Accra, Abidjan)</option>
                <option value="WAT">WAT (Lagos, Luanda)</option>
                <option value="CAT">CAT (Harare, Kigali)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">{t('academic_attendance_settings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('term_start_date')}</label>
                <input
                  type="date"
                  value={formData.term_start_date}
                  onChange={(e) => setFormData({ ...formData, term_start_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('term_end_date')}</label>
                <input
                  type="date"
                  value={formData.term_end_date}
                  onChange={(e) => setFormData({ ...formData, term_end_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('total_school_days')}</label>
                <input
                  type="number"
                  value={formData.attendance_total_days}
                  onChange={(e) => setFormData({ ...formData, attendance_total_days: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 90"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Late After (Time)</label>
                <input
                  type="time"
                  step="1"
                  value={formData.late_time}
                  onChange={(e) => setFormData({ ...formData, late_time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  id="include_weekends"
                  checked={formData.attendance_include_weekends}
                  onChange={(e) => setFormData({ ...formData, attendance_include_weekends: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="include_weekends" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {t('include_weekends_in_attendance')}
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                {t('cancel')}
              </button>
            )}
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              {isEdit ? t('update_organization') : t('create_organization')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export function ChoosePlan() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchPlans();
        setPlans(data);
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">{t('choose_subscription_plan')}</h2>
        <p className="text-zinc-500">{t('choose_plan_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={cn(
            "relative p-8 rounded-3xl border transition-all hover:shadow-xl flex flex-col",
            plan.name === 'Professional' ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" :
              plan.name === 'Enterprise' ? "bg-zinc-900 dark:bg-zinc-950 text-white border-zinc-800" :
                "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          )}>
            {plan.is_popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-widest">
                Most Popular
              </span>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$ {parseFloat(plan.price).toLocaleString()}</span>
                <span className="text-sm opacity-60">/{plan.period}</span>
              </div>
              <p className="text-sm mt-4 opacity-70">{plan.description}</p>
            </div>

            <div className="space-y-4 flex-1 mb-8">
              <p className="text-xs font-bold uppercase tracking-widest opacity-50">Included Modules</p>
              {(Array.isArray(plan.modules) ? plan.modules : JSON.parse(plan.modules || '[]')).map((mod: string) => (
                <div key={mod} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm">{mod}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => (window as any).showToast?.(`Selected ${plan.name} plan!`, 'success')}
              className={cn(
                "w-full py-4 rounded-2xl font-bold transition-all",
                plan.name === 'Enterprise'
                  ? "bg-white text-zinc-900 hover:bg-zinc-100"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlansManagement({ data, onAdd, onRefresh, systemModules = [] }: { data?: any[]; onAdd?: () => void, onRefresh?: () => void, systemModules?: any[] }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    price: '',
    period: 'monthly',
    description: '',
    modules: [],
    is_popular: false,
    commission_amount: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, plan: any | null }>({
    isOpen: false,
    plan: null
  });

  const [viewingPlan, setViewingPlan] = useState<any | null>(null);

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      ...plan,
      modules: Array.isArray(plan.modules) ? plan.modules : JSON.parse(plan.modules || '[]')
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: '',
      period: 'monthly',
      description: '',
      modules: [],
      is_popular: false,
      commission_amount: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, formData);
        (window as any).showToast?.('Plan updated successfully!', 'success');
      } else {
        await createPlan(formData);
        (window as any).showToast?.('Plan created successfully!', 'success');
      }
      setIsModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to save plan:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  const toggleModule = (moduleName: string) => {
    setFormData((prev: any) => ({
      ...prev,
      modules: prev.modules.includes(moduleName)
        ? prev.modules.filter((m: string) => m !== moduleName)
        : [...prev.modules, moduleName]
    }));
  };

  const handleDeleteClick = (plan: any) => {
    setDeleteConfirm({ isOpen: true, plan });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.plan) return;
    try {
      await deletePlan(deleteConfirm.plan.id);
      (window as any).showToast?.('Plan template deleted successfully!', 'success');
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete plan:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  return (
    <>
      <DataTable
        title="Plan Templates"
        data={data || []}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onView={(plan) => setViewingPlan(plan)}
        autoModal={false}
        columns={[
          { header: 'Plan Name', accessor: 'name', className: 'font-bold' },
          {
            header: 'Price',
            accessor: (item) => `${parseFloat(item.price).toLocaleString()} / ${item.period}`
          }
        ]}
      />

      <Modal isOpen={!!viewingPlan} onClose={() => setViewingPlan(null)} title="Plan Details" maxWidth="max-w-2xl">
        {viewingPlan && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{viewingPlan.name}</h3>
                <p className="text-indigo-600 font-bold">$ {parseFloat(viewingPlan.price).toLocaleString()} / {viewingPlan.period}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1">Partner Commission</p>
                <p className="text-lg font-black text-emerald-600">$ {parseFloat(viewingPlan.commission_amount || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Description</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                {viewingPlan.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Included Modules</p>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase">
                  {(Array.isArray(viewingPlan.modules) ? viewingPlan.modules : JSON.parse(viewingPlan.modules || '[]')).length} Total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                {(Array.isArray(viewingPlan.modules) ? viewingPlan.modules : JSON.parse(viewingPlan.modules || '[]')).map((mod: string) => (
                  <div key={mod} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">{mod}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingPlan(null)}
                className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlan ? "Edit Plan Template" : "Add Plan Template"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Plan Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Price ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-emerald-600">Partner Commission ($)</label>
              <input
                type="number"
                value={formData.commission_amount}
                onChange={(e) => setFormData({ ...formData, commission_amount: e.target.value })}
                className="w-full px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-sm font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Billing Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_popular"
                checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <label htmlFor="is_popular" className="text-sm font-medium">Mark as Popular</label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Include Modules</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {systemModules.map((mod: any) => (
                <div key={mod.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`mod-${mod.id}`}
                    checked={formData.modules.includes(mod.name)}
                    onChange={() => toggleModule(mod.name)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <label htmlFor={`mod-${mod.id}`} className="text-xs">{mod.name}</label>
                </div>
              ))}
              {/* Fallback for common modules if table is empty */}
              {systemModules.length === 0 && ['Student Management', 'Attendance', 'Finance & Fees', 'Exam Management', 'Library System', 'HR & Payroll', 'Transport & Hostel', 'AI Insights', 'Custom Domain'].map((mod) => (
                <div key={mod} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`mod-fb-${mod}`}
                    checked={formData.modules.includes(mod)}
                    onChange={() => toggleModule(mod)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <label htmlFor={`mod-fb-${mod}`} className="text-xs">{mod}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-zinc-500">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Save Plan</button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Plan Template"
        message={`Are you sure you want to delete the "${deleteConfirm.plan?.name}" plan template? Organizations currently on this plan will not be affected, but no new organizations can subscribe to it.`}
      />
    </>
  );
}

export function SchoolBilling({
  currentSubscription,
  plans = [],
  organization
}: {
  currentSubscription: any;
  plans: any[];
  organization: any;
}) {
  const { t } = useLanguage();
  useEffect(() => {
    console.log('>>> [Paystack] Script status:', typeof (window as any).PaystackPop !== 'undefined' ? 'LOADED' : 'NOT LOADED');
    (window as any).debugPaystack = () => {
      if (plans.length > 0) {
        handlePaystackPayment(plans[0]);
      } else {
        (window as any).showToast?.('No plans loaded to test with.', 'error');
      }
    };
  }, [plans]);

  const handlePaystackPayment = (plan: any) => {
    console.log('>>> [Paystack] Beginning payment process for plan:', plan.name);
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('>>> [Paystack] No user found in localStorage');
      (window as any).showToast?.('Authentication required to pay.', 'error');
      return;
    }
    const user = JSON.parse(userStr);
    const publicKey = PAYSTACK_PUBLIC_KEY || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

    if (!publicKey) {
      console.error('>>> [Paystack] Public Key missing (VITE_PAYSTACK_PUBLIC_KEY)');
      (window as any).showToast?.('Payment configuration error: Public key missing.', 'error');
      return;
    }

    if (!(window as any).PaystackPop) {
      console.error('>>> [Paystack] PaystackPop library not loaded');
      (window as any).showToast?.('Payment library not loaded. Please refresh the page.', 'error');
      return;
    }

    if (!organization || !organization.id) {
      console.error('>>> [Paystack] Organization data missing');
      (window as any).showToast?.('Institution data not loaded. Please wait a moment and try again.', 'error');
      return;
    }

    const orgCurrency = organization?.currency || 'GH₵';
    const paystackCurrency = (orgCurrency === 'GH₵' || orgCurrency === 'GHS') ? 'GHS' :
      (orgCurrency === '₦' || orgCurrency === 'NGN') ? 'NGN' :
        (orgCurrency === '$' || orgCurrency === 'USD') ? 'USD' :
          orgCurrency || 'GHS';

    try {
      console.log('>>> [Paystack] Initializing PaystackPop for:', user.email);
      console.log('>>> [Paystack] Public Key:', publicKey);

      const setupConfig = {
        key: publicKey,
        email: user.email,
        amount: Math.round(parseFloat(plan.price) * 100), // Amount in subunits
        currency: paystackCurrency,
        ref: `SUB-${Math.floor(Math.random() * 1000000000 + 1)}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Plan Name",
              variable_name: "plan_name",
              value: plan.name
            },
            {
              display_name: "Organization ID",
              variable_name: "org_id",
              value: organization.id
            }
          ]
        },
        callback: function (response: any) {
          (async () => {
            console.log('>>> [Paystack] Payment success callback received:', response);
            (window as any).showToast?.('Payment successful! Finalizing renewal...', 'success');

            try {
              const token = localStorage.getItem('token');
              const verifyRes = await fetch(`${API_BASE_URL}/subscriptions/verify-paystack`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  reference: response.reference,
                  planId: plan.id
                })
              });

              if (verifyRes.ok) {
                (window as any).showToast?.('Subscription renewed successfully!', 'success');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                const errData = await verifyRes.json();
                throw new Error(errData.error || 'Verification failed');
              }
            } catch (err: any) {
              console.error('>>> [Paystack] Verification failed:', err);
              (window as any).showToast?.(err, 'error');
            }
          })();
        },
        onClose: function () {
          console.log('>>> [Paystack] User closed checkout modal');
          (window as any).showToast?.('Payment cancelled.', 'info');
        }
      };

      console.log('>>> [Paystack] Final Setup Config:', setupConfig);

      if (typeof (window as any).PaystackPop === 'undefined') {
        throw new Error('Paystack library (PaystackPop) is not defined. Please check your internet connection or disable ad-blockers.');
      }

      const handler = (window as any).PaystackPop.setup(setupConfig);
      handler.openIframe();
    } catch (err: any) {
      console.error('>>> [Paystack] Fatal error opening modal:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section / Current Status */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Manage Your <br />Subscription
            </h2>
            <p className="text-zinc-400 max-w-md">
              View your current plan details and available upgrades for {organization?.name}.
            </p>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 p-8 rounded-3xl w-full md:w-auto min-w-[300px] shadow-2xl">
            <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-[0.2em] mb-4">Current Active Plan</p>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">{currentSubscription?.plan || 'Free Tier'}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{currentSubscription?.status || 'Active'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-zinc-700/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Renewal Date</span>
                <span className="font-bold text-zinc-200">
                  {currentSubscription?.expiry_date
                    ? new Date(currentSubscription.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Billed Amount</span>
                <span className="font-bold text-zinc-200">{organization?.currency || 'GH₵'} {parseFloat(currentSubscription?.amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-5%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Plans Section */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Available Plans</h3>
          <p className="text-zinc-500 italic">Explore our feature-rich plans designed to scale with your institution's growing needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentSubscription?.plan;
            return (
              <div key={plan.id} className={cn(
                "relative p-8 rounded-[2rem] border transition-all duration-500 flex flex-col group",
                plan.is_popular
                  ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 scale-105 shadow-xl shadow-indigo-100 dark:shadow-none"
                  : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
              )}>
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{plan.name}</h4>
                    {isCurrent && (
                      <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-lg uppercase tracking-widest">
                        Your Plan
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">{organization?.currency || 'GH₵'} {parseFloat(plan.price).toLocaleString()}</span>
                    <span className="text-zinc-500 font-bold text-sm">/{plan.period === 'monthly' ? 'mo' : plan.period === 'yearly' ? 'yr' : 'fixed'}</span>
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed h-10">{plan.description}</p>
                </div>

                <div className="space-y-4 flex-1 mb-8">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Key Features</p>
                  {(Array.isArray(plan.modules) ? plan.modules : JSON.parse(plan.modules || '[]')).slice(0, 6).map((mod: string) => (
                    <div key={mod} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{mod}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePaystackPayment(plan)}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02]",
                    isCurrent
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none"
                  )}
                >
                  {isCurrent ? "Renew Current Plan" : "Pay with Paystack"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Section */}
      <div id="contact-support-footer" className="bg-indigo-600 rounded-[2rem] p-8 sm:p-12 text-white text-center space-y-8 shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-black tracking-tight uppercase">Ready to Renew or Upgrade?</h3>
          <p className="text-indigo-100 font-medium">
            Subscription management is handled by our platform administrators. Please contact your Super Admin to finalize any changes to your subscription plan.
          </p>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@schoolhub.com"
              className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-50 transition-colors"
            >
              Contact Support
            </a>
            <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
              or reach out via internal messaging
            </div>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-white/5 rounded-full" />
      </div>
    </div>
  );
}

export function SubscriptionPlans({ data, onRefresh, organizations = [], plans = [] }: { data?: any[], onRefresh?: () => void, organizations?: any[], plans?: any[] }) {
  const { t, currency } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [formData, setFormData] = useState({
    org_id: '',
    plan_name: '',
    status: 'Active',
    expiry_date: '',
    amount: '',
    payment_method: 'Bank Transfer'
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, sub: any | null }>({
    isOpen: false,
    sub: null
  });

  const [viewingSub, setViewingSub] = useState<any | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingSub, setRenewingSub] = useState<any>(null);

  const handlePrintSubscriptionReceipt = (sub: any) => {
    const org = organizations.find(o => o.id === sub.org_id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Subscription Receipt - ${sub.org_name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #18181b; padding: 40px; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; border-bottom: 2px solid #f4f4f5; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #4f46e5; }
            .receipt-title { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em; color: #18181b; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 60px; }
            .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; margin-bottom: 8px; }
            .value { font-size: 16px; font-weight: 600; color: #18181b; }
            .amount-box { background: #f8fafc; padding: 32px; border-radius: 24px; text-align: right; margin-top: 40px; border: 1px solid #f1f5f9; }
            .amount-label { font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 4px; }
            .amount-value { font-size: 36px; font-weight: 900; color: #4f46e5; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print { .no-print { display: none; } body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">OMNISCHOOL</div>
              <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Smart School Management Ecosystem</div>
            </div>
            <div class="receipt-title">RECEIPT</div>
          </div>

          <div class="grid">
            <div>
              <div class="section-title">Billed To</div>
              <div class="value">${sub.org_name}</div>
              <div style="font-size: 14px; color: #71717a;">${org?.address || 'N/A'}</div>
              <div style="font-size: 14px; color: #71717a;">${org?.email || ''}</div>
            </div>
            <div style="text-align: right;">
              <div class="section-title">Receipt Details</div>
              <div class="value">No: SUB-${sub.id.slice(0, 8).toUpperCase()}</div>
              <div style="font-size: 14px; color: #71717a;">Date: ${new Date().toLocaleDateString()}</div>
              <div style="font-size: 14px; color: #71717a;">Status: PAID</div>
            </div>
          </div>

          <div style="border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 16px; text-align: left; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Description</th>
                  <th style="padding: 16px; text-align: right; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Period</th>
                  <th style="padding: 16px; text-align: right; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-weight: 700; color: #1e293b;">Software Subscription Renewal</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Plan: ${sub.plan}</div>
                  </td>
                  <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <div style="font-weight: 600;">Renewal Period</div>
                    <div style="font-size: 13px; color: #64748b;">Expires: ${new Date(sub.expiry_date).toLocaleDateString()}</div>
                  </td>
                  <td style="padding: 24px 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">
                    ${sub.currency || 'GH₵'} ${parseFloat(sub.amount || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="amount-box">
            <div class="amount-label">Total Amount Paid</div>
            <div class="amount-value">${sub.currency || 'GH₵'} ${parseFloat(sub.amount || 0).toLocaleString()}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 8px; font-weight: 600;">Payment Method: ${sub.payment_method}</div>
          </div>

          <div class="footer">
            <p>Thank you for choosing OmniSchool. This is a computer generated receipt.</p>
            <p>&copy; ${new Date().getFullYear()} OmniSchool Management Systems. All rights reserved.</p>
          </div>

          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleEdit = (sub: any) => {
    setEditingSub(sub);
    setFormData({
      org_id: sub.org_id,
      plan_name: sub.plan,
      status: sub.status,
      expiry_date: sub.expiry_date ? new Date(sub.expiry_date).toISOString().split('T')[0] : '',
      amount: sub.amount?.toString() || '',
      payment_method: sub.payment_method || 'Bank Transfer'
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSub(null);
    setFormData({
      org_id: '',
      plan_name: '',
      status: 'Active',
      expiry_date: '',
      amount: '',
      payment_method: 'Bank Transfer'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (sub: any) => {
    setDeleteConfirm({ isOpen: true, sub });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.sub) return;
    try {
      await deleteSubscription(deleteConfirm.sub.id);
      (window as any).showToast?.('Subscription deleted successfully!', 'success');
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete subscription:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await updateSubscription(editingSub.id, formData);
        (window as any).showToast?.('Subscription updated successfully!', 'success');
      } else {
        await createSubscription(formData);
        (window as any).showToast?.('Subscription created successfully!', 'success');
      }
      setIsModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to save subscription:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('subscription_plans')}</h2>
          <p className="text-zinc-500">{t('subscription_plans_desc')}</p>
        </div>
      </div>

      <DataTable
        title="Active Subscriptions"
        data={data || []}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onView={(sub) => setViewingSub(sub)}
        autoModal={false}
        columns={[
          { header: 'Organization', accessor: 'org_name', className: 'font-bold' },
          { header: 'Plan', accessor: 'plan' },
          { header: 'Amount', accessor: (item: any) => `${item.currency || currency} ${parseFloat(item.amount || 0).toLocaleString()}`, className: 'font-bold' },
          {
            header: 'Status',
            accessor: (item: any) => (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {item.status}
              </span>
            )
          },
        ]}
        extraActions={(sub: any) => (
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setRenewingSub(sub);
                setFormData({
                  org_id: sub.org_id,
                  plan_name: sub.plan,
                  status: 'Active',
                  expiry_date: sub.expiry_date ? new Date(sub.expiry_date).toISOString().split('T')[0] : '',
                  amount: sub.amount?.toString() || '',
                  payment_method: sub.payment_method || 'Bank Transfer'
                });
                setIsRenewModalOpen(true);
              }}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-emerald-600 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Renew Subscription
            </button>
            <button
              onClick={() => handlePrintSubscriptionReceipt(sub)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        )}
      />

      <Modal isOpen={!!viewingSub} onClose={() => setViewingSub(null)} title="Subscription Details">
        {viewingSub && (
          <div className="space-y-6">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1">Organization</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{viewingSub.org_name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Current Plan</p>
                <p className="font-bold text-indigo-600">{viewingSub.plan}</p>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Status</p>
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", viewingSub.status === 'Active' ? "bg-emerald-500" : "bg-red-500")} />
                  <p className={cn("font-bold", viewingSub.status === 'Active' ? "text-emerald-600" : "text-red-600")}>{viewingSub.status}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Amount</p>
                <p className="font-bold text-zinc-900 dark:text-white">$ {parseFloat(viewingSub.amount).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Payment Method</p>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">{viewingSub.payment_method}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 space-y-1">
              <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Expiry Date</p>
              <p className="font-bold text-indigo-700 dark:text-indigo-400">
                {viewingSub.expiry_date ? new Date(viewingSub.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No expiry set'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSub(null)}
                className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSub ? "Edit Subscription" : "Add New Subscription"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Select Organization</label>
            <select
              value={formData.org_id}
              onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              required
            >
              <option value="">Choose an organization</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Select Plan</label>
            <select
              value={formData.plan_name}
              onChange={(e) => {
                const selectedPlan = plans.find((p: any) => p.name === e.target.value);
                setFormData({
                  ...formData,
                  plan_name: e.target.value,
                  amount: selectedPlan ? selectedPlan.price.toString() : formData.amount
                });
              }}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              required
            >
              <option value="">Choose a plan</option>
              {plans.map((plan: any) => (
                <option key={plan.id} value={plan.name}>{plan.name} - {currency} {parseFloat(plan.price).toLocaleString()}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Amount ($)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-zinc-500">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Create Subscription</button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription record? This action will remove the billing entry from the database."
      />

      <Modal isOpen={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Subscription">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await updateSubscription(renewingSub.id, formData);
            (window as any).showToast?.('Subscription renewed successfully!', 'success');
            setIsRenewModalOpen(false);
            onRefresh?.();
          } catch (err) {
            console.error('Failed to renew subscription:', err);
            (window as any).showToast?.(err, 'error');
          }
        }} className="space-y-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 mb-4">
            <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1">Renewing for</p>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{renewingSub?.org_name}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Plan</label>
              <select
                value={formData.plan_name}
                onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                {plans.map((p: any) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">New Amount ($)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">New Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsRenewModalOpen(false)} className="px-4 py-2 text-sm font-bold text-zinc-500">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm">Submit Renewal</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function BillingHistory({ data }: { data?: any[] }) {
  const { t, currency } = useLanguage();

  const transactions = (data || []).map(sub => ({
    id: `TX-${sub.id.split('-')[0].toUpperCase()}`,
    org: sub.org_name,
    date: new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' }),
    amount: `${sub.currency || currency} ${parseFloat(sub.amount).toLocaleString()}`,
    status: sub.status === 'Active' ? 'Paid' : sub.status,
    method: sub.payment_method || 'Bank Transfer'
  }));

  return (
    <DataTable
      title={t('billing_history')}
      data={transactions}
      columns={[
        { header: t('transaction_id'), accessor: 'id', className: 'font-mono text-xs' },
        { header: t('organization'), accessor: 'org', className: 'font-bold' },
        { header: t('date'), accessor: 'date' },
        { header: t('amount'), accessor: 'amount', className: 'font-bold text-zinc-900 dark:text-white' },
        {
          header: t('status'),
          accessor: (item) => (
            <span className={cn(
              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              item.status === 'Paid' || item.status === 'Active' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" :
                item.status === 'Pending' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20" :
                  "bg-red-50 text-red-600 dark:bg-red-900/20"
            )}>
              {item.status}
            </span>
          )
        },
        { header: t('method'), accessor: 'method' },
      ]}
    />
  );
}

export function ModuleManagement({ data, onRefresh }: { data?: any[], onRefresh?: () => void }) {
  const { t } = useLanguage();

  const handleToggle = async (mod: any) => {
    try {
      await updateModule(mod.id, { status: mod.status === 'Enabled' ? 'Disabled' : 'Enabled' });
      (window as any).showToast?.(`${mod.name} ${mod.status === 'Enabled' ? 'disabled' : 'enabled'} successfully!`, 'success');
      onRefresh?.();
    } catch (err) {
      console.error('Failed to toggle module:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('module_control')}</h2>
        <p className="text-zinc-500">{t('module_management_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data || []).map((mod) => (
          <div key={mod.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                mod.status === 'Enabled' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
              )}>
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-900 dark:text-white">{mod.name}</h3>
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 rounded-full uppercase font-bold tracking-wider">{mod.category}</span>
                </div>
                <p className="text-sm text-zinc-500">{mod.description || 'System core module'}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(mod)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                mod.status === 'Enabled' ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                mod.status === 'Enabled' ? "right-1" : "left-1"
              )}></div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditLogs({ data }: { data?: any[] }) {
  const { t } = useLanguage();

  return (
    <DataTable
      title={t('audit_logs')}
      data={data || []}
      itemsPerPage={20}
      columns={[
        { header: t('user'), accessor: 'user_name', className: 'font-bold' },
        {
          header: 'Role',
          accessor: (item: any) => (
            <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-bold text-zinc-600 uppercase">
              {item.user_role || 'User'}
            </span>
          )
        },
        { header: t('action'), accessor: 'action', className: 'text-primary font-semibold' },
        { header: 'Details', accessor: 'details' },
        { header: 'IP Address', accessor: 'ip_address', className: 'text-xs text-zinc-400' },
        {
          header: t('time'),
          accessor: (item: any) => new Date(item.created_at || item.timestamp).toLocaleString(),
          className: 'text-xs whitespace-nowrap'
        },
      ]}
    />
  );
}

export function Messages({ students = [], staff = [], partners = [], subjects = [], classes = [], onRefreshUnreadCount }: { students?: any[], staff?: any[], partners?: any[], subjects?: any[], classes?: any[], onRefreshUnreadCount?: () => void }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [draftContact, setDraftContact] = useState<any | null>(null);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserRole(u.role);
      setUserId(u.id);
    }
  }, []);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Group messages into conversations based on the "other" person
  const groupedConversations = useMemo(() => {
    const map = new Map<string, { id: string, name: string, role: string, msgs: any[] }>();
    messages.forEach(m => {
      const isSent = m.direction === 'sent';
      const otherId = isSent ? m.receiver_id : m.sender_id;
      const otherRole = isSent ? m.receiver_role : m.sender_role;
      const otherName = m.other_person_name || 'Unknown User';

      if (!map.has(otherId)) {
        map.set(otherId, { id: otherId, name: otherName, role: otherRole, msgs: [] });
      }
      map.get(otherId)!.msgs.push(m);
    });

    // Sort conversations by latest message
    const arr = Array.from(map.values());
    arr.forEach(c => c.msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    arr.sort((a, b) => {
      const latestA = a.msgs[a.msgs.length - 1];
      const latestB = b.msgs[b.msgs.length - 1];
      return new Date(latestB.created_at).getTime() - new Date(latestA.created_at).getTime();
    });
    return arr;
  }, [messages]);

  const availableContacts = useMemo(() => {
    const contacts: any[] = [];
    const addedIds = new Set<string>();

    const addContact = (id: string, name: string, role: string, type: string, email?: string) => {
      const key = type === 'PARENT' ? email || id : id;
      if (!addedIds.has(key)) {
        addedIds.add(key);
        contacts.push({ id, name, role, type, email, initials: name ? name.charAt(0).toUpperCase() : '?' });
      }
    };

    if (userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN') {
      staff.forEach(s => addContact(s.id, s.name, s.role, 'STAFF', s.email));
      students.forEach(s => addContact(s.id, s.name, 'STUDENT', 'STUDENT', s.email));
      partners.forEach(p => addContact(p.id, p.name, 'PARTNER', 'PARTNER', p.email));
      students.forEach(s => {
        if (s.parent_email) addContact(s.id, s.parent_name || 'Parent of ' + s.name, 'PARENT', 'PARENT', s.parent_email);
      });
    } else if (userRole === 'STUDENT') {
      const myStudent = students.find(s => s.email === JSON.parse(localStorage.getItem('user') || '{}')?.email);
      if (myStudent) {
        const studentClassId = myStudent.class_id;
        const studentClass = classes.find((c: any) => String(c.id) === String(studentClassId));
        if (studentClass?.class_teacher_id) {
          const ct = staff.find(s => String(s.id) === String(studentClass.class_teacher_id));
          if (ct) addContact(ct.id, ct.name, ct.role, 'STAFF', ct.email);
        }
        subjects.filter((s: any) => String(s.class_id) === String(studentClassId) || (Array.isArray(s.classes) && s.classes.some((c: any) => String(c.id) === String(studentClassId))))
          .forEach(s => {
            const st = staff.find(stf => String(stf.id) === String(s.teacher_id));
            if (st) addContact(st.id, st.name, st.role, 'STAFF', st.email);
          });
      }
    } else if (userRole === 'PARENT') {
      staff.filter(s => s.role === 'SCHOOL_ADMIN').forEach(s => addContact(s.id, s.name, s.role, 'ADMIN', s.email));

      const userE = JSON.parse(localStorage.getItem('user') || '{}')?.email;
      const myWards = students.filter(s => s.parent_email === userE);

      myWards.forEach(ward => {
        const studentClassId = ward.class_id;
        const studentClass = classes.find((c: any) => String(c.id) === String(studentClassId));
        if (studentClass?.class_teacher_id) {
          const ct = staff.find(s => String(s.id) === String(studentClass.class_teacher_id));
          if (ct) addContact(ct.id, ct.name, ct.role, 'STAFF', ct.email);
        }
        subjects.forEach(s => {
          if (String(s.class_id) === String(studentClassId) || (Array.isArray(s.classes) && s.classes.some((c: any) => String(c.id) === String(studentClassId)))) {
            const st = staff.find(stf => String(stf.id) === String(s.teacher_id));
            if (st) addContact(st.id, st.name, st.role, 'STAFF', st.email);
          }
        });
      });
    } else if (userRole === 'STAFF') {
      const myStaffId = JSON.parse(localStorage.getItem('user') || '{}')?.staff_id;
      if (myStaffId) {
        const classIdsTeach = new Set<string>();
        const myClassRec = classes.find((c: any) => String(c.class_teacher_id) === String(myStaffId));
        if (myClassRec) classIdsTeach.add(String(myClassRec.id));

        subjects.filter((s: any) => String(s.teacher_id) === String(myStaffId)).forEach(s => {
          if (s.class_id) classIdsTeach.add(String(s.class_id));
          if (Array.isArray(s.classes)) s.classes.forEach((c: any) => classIdsTeach.add(String(c.id)));
        });

        students.filter(s => classIdsTeach.has(String(s.class_id))).forEach(s => {
          if (s.parent_email) addContact(s.id, s.parent_name || 'Parent of ' + s.name, 'PARENT', 'PARENT', s.parent_email);
        });
      }
    }

    return contacts.filter(c => String(c.id) !== String(userId));
  }, [students, staff, subjects, classes, userRole, userId]);

  const filteredContacts = availableContacts.filter(c =>
    c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const activeChat = useMemo(() => {
    if (activeChatId) {
      return groupedConversations.find(c => c.id === activeChatId);
    } else if (draftContact) {
      return {
        id: draftContact.id,
        name: draftContact.name,
        role: draftContact.role,
        msgs: []
      };
    }
    return null;
  }, [activeChatId, draftContact, groupedConversations]);

  useEffect(() => {
    if (activeChat && activeChat.msgs.length > 0) {
      const unreadReceived = activeChat.msgs.filter((m: any) => m.direction === 'received' && !m.is_read);
      if (unreadReceived.length > 0) {
        const markAllRead = async () => {
          const token = localStorage.getItem('token');
          await Promise.all(unreadReceived.map((m: any) =>
            fetch(`${API_BASE_URL}/messages/${m.id}/read`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ));
          onRefreshUnreadCount?.();
          loadMessages(); // Refresh local message list too
        };
        markAllRead();
      }
    }
  }, [activeChatId, activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: activeChat.id,
          receiver_role: activeChat.role,
          subject: 'Direct Message',
          content: newMessage
        })
      });
      if (res.ok) {
        setNewMessage('');
        setDraftContact(null);
        if (!activeChatId) {
          setActiveChatId(activeChat.id); // Convert draft to active chat
        }
        loadMessages();
      } else {
        const errData = await res.json().catch(() => ({}));
        (window as any).showToast?.(errData.error || 'Unable to send your message. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.msgs]);

  // Mark as read when opening a chat
  useEffect(() => {
    if (activeChatId) {
      const chat = groupedConversations.find(c => c.id === activeChatId);
      if (chat) {
        const unreadMsgs = chat.msgs.filter(m => m.direction === 'received' && !m.is_read);
        if (unreadMsgs.length > 0) {
          const token = localStorage.getItem('token');
          Promise.all(unreadMsgs.map(m =>
            fetch(`${API_BASE_URL}/messages/${m.id}/read`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` }
            })
          )).then(() => loadMessages());
        }
      }
    }
  }, [activeChatId, groupedConversations]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-900 dark:text-white">Messages</h3>
            <button
              onClick={() => setIsContactsOpen(true)}
              className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              title="New Message"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder={t('search_conversations')} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {groupedConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No messages yet.</div>
          ) : (
            groupedConversations.map((chat) => {
              const latestMsg = chat.msgs[chat.msgs.length - 1];
              const isUnread = latestMsg.direction === 'received' && !latestMsg.is_read;
              const timeString = new Date(latestMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={cn(
                    "p-4 border-b border-zinc-50 dark:border-zinc-800/50 cursor-pointer transition-colors relative",
                    activeChatId === chat.id ? "bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn("font-bold text-sm", isUnread ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-white")}>
                      {chat.name}
                    </h4>
                    <span className="text-[10px] text-zinc-400">{timeString}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={cn("text-xs truncate max-w-[85%]", isUnread ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-500")}>
                      {latestMsg.direction === 'sent' ? 'You: ' : ''}{latestMsg.content}
                    </p>
                    {isUnread && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Pane */}
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold uppercase">
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">{activeChat.name}</h4>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{activeChat.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6">
              {activeChat.msgs.map((msg, i) => {
                const isSent = msg.direction === 'sent';
                return (
                  <div key={i} className={cn("flex", isSent ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] p-4 rounded-2xl",
                      isSent ? "bg-indigo-600 text-white rounded-tr-none" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className={cn(
                        "text-[10px] mt-2 block",
                        isSent ? "text-indigo-200" : "text-zinc-400"
                      )}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('type_your_message')}
                  className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Your Messages</h3>
            <p className="text-zinc-500 max-w-sm">Select a conversation from the sidebar to view and send messages.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isContactsOpen} onClose={() => setIsContactsOpen(false)} title="New Message">
        <div className="flex flex-col h-[60vh]">
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search contacts by name or role..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No contacts found.</div>
            ) : (
              filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => {
                    const existingChat = groupedConversations.find(c => c.id === contact.id);
                    if (existingChat) {
                      setActiveChatId(existingChat.id);
                      setDraftContact(null);
                    } else {
                      setActiveChatId(null);
                      setDraftContact(contact);
                    }
                    setIsContactsOpen(false);
                  }}
                  className="w-full p-4 flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {contact.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">{contact.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{contact.type === 'STAFF' ? contact.role : contact.type}</p>
                    </div>
                  </div>
                  <MessageSquare className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ReceiptsManagement({ data }: { data?: any[] }) {
  const { t, currency } = useLanguage();

  const handlePrint = (receipt: any) => {
    const logoUrl = receipt.logo_url || 'https://via.placeholder.com/150?text=School+Logo';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receipt.id}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #4f46e5;
              --secondary: #6366f1;
              --zinc-50: #fafafa;
              --zinc-100: #f4f4f5;
              --zinc-200: #e4e4e7;
              --zinc-800: #27272a;
              --zinc-900: #18181b;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Outfit', sans-serif; 
              color: var(--zinc-900);
              line-height: 1.5;
              padding: 40px;
              background: #fff;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid var(--zinc-100);
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 40px;
              position: relative;
            }
            .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.025em; }
            .header p { opacity: 0.8; font-size: 14px; }
            .header .receipt-number {
              position: absolute;
              top: 40px;
              right: 40px;
              text-align: right;
            }
            .receipt-number div { font-size: 10px; text-transform: uppercase; font-weight: 700; opacity: 0.6; margin-bottom: 4px; }
            .receipt-number span { font-family: monospace; font-size: 16px; font-weight: 600; }

            .content { padding: 40px; }
            .grid { display: grid; grid-cols: 2; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--zinc-400); margin-bottom: 12px; letter-spacing: 0.05em; }
            .info-block p { font-weight: 600; font-size: 15px; color: var(--zinc-800); }
            .info-block span { display: block; font-size: 13px; color: var(--zinc-500); margin-top: 4px; }

            table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 40px 0; border-radius: 12px; overflow: hidden; border: 1px solid var(--zinc-100); }
            th { background: var(--zinc-50); padding: 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--zinc-500); }
            td { padding: 20px 16px; border-top: 1px solid var(--zinc-100); font-size: 14px; }
            .amount-col { text-align: right; font-weight: 700; }

            .total-section { 
              background: var(--zinc-50); 
              padding: 24px; 
              border-radius: 16px; 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
            }
            .total-label { font-weight: 700; font-size: 16px; }
            .total-amount { font-size: 24px; font-weight: 800; color: var(--primary); }

            .footer { 
              margin-top: 60px; 
              padding-top: 24px; 
              border-top: 1px solid var(--zinc-100); 
              text-align: center; 
              font-size: 12px; 
              color: var(--zinc-400); 
            }
            .seal {
              margin: 40px auto;
              width: 80px;
              height: 80px;
              border: 4px solid var(--zinc-100);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(-15deg);
              font-weight: 800;
              font-size: 10px;
              color: var(--zinc-200);
              text-transform: uppercase;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
              .receipt-container { box-shadow: none; border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>SchoolHub RBMS - Subscription Services</p>
              <div class="receipt-number">
                <div>Receipt Number</div>
                <span>#${receipt.id.split('-')[0].toUpperCase()}</span>
              </div>
            </div>

            <div class="content">
              <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                <div class="info-block">
                  <div class="section-title">Billed To</div>
                  <p>${receipt.org_name}</p>
                  <span>${receipt.email || ''}</span>
                </div>
                <div class="info-block" style="text-align: right;">
                  <div class="section-title">Payment Date</div>
                  <p>${new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <span>${receipt.payment_method}</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Plan</th>
                    <th class="amount-col">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Subscription Service</strong><br/>
                      <span style="font-size: 12px; color: #666;">Full implementation of selected modules</span>
                    </td>
                    <td>${receipt.plan}</td>
                    <td class="amount-col">${receipt.currency || currency} ${parseFloat(receipt.amount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-label">Total Amount Paid</div>
                <div class="total-amount">${receipt.currency || currency} ${parseFloat(receipt.amount).toLocaleString()}</div>
              </div>

              <div class="seal">
                Verified<br/>Payment
              </div>

              <div class="footer">
                <p>This is a computer-generated receipt and requires no signature.</p>
                <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} SchoolHub RBMS - Powered by Zencoder Inc.</p>
              </div>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <DataTable
      title="Payment Receipts"
      data={data || []}
      columns={[
        { header: 'ID', accessor: (item) => item.id.split('-')[0].toUpperCase(), className: 'font-mono text-xs' },
        { header: 'Organization', accessor: 'org_name', className: 'font-bold' },
        { header: 'Plan', accessor: 'plan' },
        { header: 'Date', accessor: (item) => new Date(item.created_at).toLocaleDateString() },
        { header: 'Amount', accessor: (item) => `${item.currency || currency} ${parseFloat(item.amount).toLocaleString()}`, className: 'font-bold' },
      ]}
      extraActions={(item) => (
        <button
          onClick={() => handlePrint(item)}
          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      )}
    />
  );
}

export function Settings({ role }: { role?: UserRole }) {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [branding, setBranding] = useState({
    logo: '',
    signature: ''
  });
  const [groqKey, setGroqKey] = useState('');
  const [aiStatus, setAiStatus] = useState<'checking' | 'active' | 'outdated' | 'error'>('checking');
  const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);

  const handleSyncHolidays = async () => {
    setIsSyncingHolidays(true);
    try {
      await syncPublicHolidays();
      (window as any).showToast?.('National holidays synced successfully!', 'success');
    } catch (err) {
      console.error('Failed to sync holidays:', err);
      (window as any).showToast?.('Failed to sync holidays. Please try again.', 'error');
    } finally {
      setIsSyncingHolidays(false);
    }
  };

  useEffect(() => {
    const loadOrg = async () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.org_id) {
          try {
            const org = await fetchOrganization(user.org_id);
            setOrganization(org);
            setBranding({
              logo: org.logo || '',
              signature: org.signature || ''
            });
            // Diagnostics: Check if AI routes even exist using axios instance
            try {
              const testRes = await generateAIResponse('ping');
              setIsAiConfigured(true);
              setAiStatus('active');
            } catch (err: any) {
              if (err.response?.status === 503) {
                setIsAiConfigured(false);
                setAiStatus('active'); // Route exists but key is missing
              } else if (err.response?.status === 404) {
                setAiStatus('outdated');
              } else {
                setAiStatus('error');
              }
            }

            // Fetch Groq Key separately using axios instance
            try {
              const keys = await fetchAIKeys();
              if (keys.length > 0) setGroqKey(keys[0].api_key);
            } catch (err) {
              console.error('Failed to fetch AI keys:', err);
            }
          } catch (err) {
            console.error('Failed to fetch organization:', err);
          }
        }
      }
    };
    if (role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') {
      loadOrg();
    }
  }, [role]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSaveGroqKey = async () => {
    const trimmedKey = groqKey.trim();
    if (!trimmedKey) {
      (window as any).showToast?.('Please enter an API key first', 'error');
      return;
    }
    try {
      await saveAIKey(trimmedKey);
      setGroqKey(trimmedKey);
      if (organization) {
        setOrganization({ ...organization, gemini_api_key: trimmedKey });
      }
      (window as any).showToast?.('Groq API Key saved successfully!', 'success');
      
      // Refresh AI configuration status using axios instance
      try {
        await generateAIResponse('ping');
        setIsAiConfigured(true);
      } catch (err: any) {
        setIsAiConfigured(err.response?.status !== 503);
      }
    } catch (err: any) {
      console.error('Failed to save Groq key:', err);
      (window as any).showToast?.(err.friendlyMessage || 'Failed to save key', 'error');
    }
  };
  const handleSave = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      await updateOrganization(organization.id, {
        ...organization,
        ...branding,
        gemini_api_key: groqKey,
        currency,
        language
      });

      // Update global context only if this is NOT a Super Admin setting a specific school's details,
      // or if it's the school admin themselves.
      if (role !== 'SUPER_ADMIN') {
        setCurrency(currency);
        setLanguage(language as any);
      }

      (window as any).showToast?.(t('save_changes') + ' successful!', 'success');

    } catch (err) {
      console.error('Failed to update organization branding:', err);
      (window as any).showToast?.(err, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t('settings')}</h2>
          <p className="text-sm text-zinc-500">{t('settings_desc')}</p>
        </div>
        <div className="p-8 space-y-8">
          {(role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">AI Configuration</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">Backend Status:</span>
                  {aiStatus === 'checking' && <div className="text-[10px] text-zinc-400 animate-pulse">Checking...</div>}
                  {aiStatus === 'active' && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><span className="text-[10px] text-emerald-500 font-bold uppercase">Online</span></div>}
                  {aiStatus === 'outdated' && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /><span className="text-[10px] text-amber-500 font-bold uppercase">Update Required</span></div>}
                  {aiStatus === 'error' && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full" /><span className="text-[10px] text-red-500 font-bold uppercase">Error</span></div>}
                </div>
              </div>

              {aiStatus === 'outdated' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-600 leading-relaxed">
                  <span className="font-bold block mb-1">⚠️ Backend Sync Required</span>
                  Your frontend is trying to use Groq AI features, but the backend server doesn't have the latest updates yet.
                  Please <strong>push your changes</strong> and wait for the Render deployment to finish.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">School Logo</label>
                  <div className="flex items-center gap-6 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 overflow-hidden shadow-sm">
                      {branding.logo ? (
                        <img src={branding.logo} alt="School Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-zinc-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-zinc-500 mb-3 uppercase font-bold tracking-tight">Best in 512x512 PNG/JPG</p>
                      <input
                        type="file"
                        id="logo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                      />
                      <label
                        htmlFor="logo-upload"
                        className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-indigo-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                      >
                        {branding.logo ? 'Change Logo' : 'Upload Logo'}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Principal's Signature</label>
                  <div className="flex items-center gap-6 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 overflow-hidden shadow-sm">
                      {branding.signature ? (
                        <img src={branding.signature} alt="Signature" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-zinc-300 font-mono text-xs italic">Sign</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-zinc-500 mb-3 uppercase font-bold tracking-tight">Transparent PNG preferred</p>
                      <input
                        type="file"
                        id="sig-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'signature')}
                      />
                      <label
                        htmlFor="sig-upload"
                        className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-indigo-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                      >
                        {branding.signature ? 'Change Signature' : 'Upload Signature'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Configuration
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Groq AI API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      placeholder="Enter your Groq API Key..."
                      className="w-full pl-4 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm dark:text-white"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveGroqKey}
                    className="px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap text-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save Key
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 italic mt-1">
                  Enter your Groq API Key to enable high-speed AI features. Configuration is saved securely in your organization settings.
                </p>
              </div>
            </div>

            <div className="p-6 mt-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isAiConfigured ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                  )}>
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">AI Engine Status</h4>
                    <p className="text-xs text-zinc-500">
                      {isAiConfigured
                        ? "OmniAI is powered by Groq and ready."
                        : "AI service not configured. Please save your Groq API key above."}
                    </p>
                  </div>
                </div>
                {isAiConfigured ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Active
                  </div>
                ) : (
                  <div className="text-amber-600 font-bold text-xs uppercase tracking-wider">
                    Offline
                  </div>
                )}
              </div>
            </div>
          </section>

          {role === 'SCHOOL_ADMIN' && (
            <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                Attendance Device Integration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Device Service URL</label>
                  <input
                    type="url"
                    value={organization?.attendance_api_url || ''}
                    onChange={(e) => setOrganization({ ...organization, attendance_api_url: e.target.value })}
                    placeholder="https://api.attendance-device.local"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Endpoint for the physical attendance terminal synchronization.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">API Access Token</label>
                  <input
                    type="password"
                    value={organization?.attendance_api_key || ''}
                    onChange={(e) => setOrganization({ ...organization, attendance_api_key: e.target.value })}
                    placeholder="Enter security token..."
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Used to authenticate requests from the portal to your device.</p>
                </div>
              </div>
            </section>
          )}

          {role === 'SCHOOL_ADMIN' && (
            <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('academic_attendance_settings')}
                </h3>
                <button
                  onClick={handleSyncHolidays}
                  disabled={isSyncingHolidays}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3 h-3", isSyncingHolidays && "animate-spin")} />
                  {isSyncingHolidays ? 'Syncing...' : 'Sync National Holidays'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('term_start_date')}</label>
                  <input
                    type="date"
                    value={organization?.term_start_date || ''}
                    onChange={(e) => setOrganization({ ...organization, term_start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('term_end_date')}</label>
                  <input
                    type="date"
                    value={organization?.term_end_date || ''}
                    onChange={(e) => setOrganization({ ...organization, term_end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('total_school_days')}</label>
                  <input
                    type="number"
                    value={organization?.attendance_total_days || 0}
                    onChange={(e) => setOrganization({ ...organization, attendance_total_days: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 90"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('late_arrival_threshold')}</label>
                  <input
                    type="time"
                    step="1"
                    value={organization?.late_time || '08:00:00'}
                    onChange={(e) => setOrganization({ ...organization, late_time: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Attendance scans after this time will be marked as "Late".</p>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="include_weekends"
                    checked={organization?.attendance_include_weekends || false}
                    onChange={(e) => setOrganization({ ...organization, attendance_include_weekends: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="include_weekends" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {t('include_weekends_in_attendance')}
                  </label>
                </div>
              </div>
            </section>
          )}

          {role === 'SCHOOL_ADMIN' && (
            <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Promotion Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Auto-Promotion Trigger Term</label>
                  <select
                    value={organization?.promotion_trigger_term || ''}
                    onChange={(e) => setOrganization({ ...organization, promotion_trigger_term: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None (Manual Only)</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 italic">Select the term that marks the end of the academic year for progression.</p>
                </div>
              </div>
            </section>
          )}

          {(role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{t('academic_config')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('academic_year')}</label>
                  <select
                    value={organization?.academic_year || '2023/2024'}
                    onChange={(e) => setOrganization({ ...organization, academic_year: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="2023/2024">2023/2024</option>
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('term_semester')}</label>
                  <select
                    value={organization?.current_term || 'Term 1'}
                    onChange={(e) => setOrganization({ ...organization, current_term: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Term 1">{t('term')} 1</option>
                    <option value="Term 2">{t('term')} 2</option>
                    <option value="Term 3">{t('term')} 3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    {t('system_language')}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en">English (US)</option>
                    <option value="fr">French</option>
                    <option value="pt">Portuguese</option>
                    <option value="sw">Swahili</option>
                    <option value="ar">Arabic</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 italic">{t('system_language_desc')}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-zinc-400" />
                    System Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GH₵">Ghana Cedis (GH₵)</option>
                    <option value="₦">Nigerian Naira (₦)</option>
                    <option value="$">US Dollar ($)</option>
                    <option value="€">Euro (€)</option>
                    <option value="£">British Pound (£)</option>
                    <option value="CFA">CFA Franc (CFA)</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 italic">This symbol will be used for all financial displays in the system.</p>
                </div>
              </div>
            </section>
          )}

          {role === 'SCHOOL_ADMIN' && (
            <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Default Sender ID</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={organization?.sms_sender_id || ''}
                    onChange={(e) => setOrganization({ ...organization, sms_sender_id: e.target.value.toUpperCase() })}
                    placeholder="e.g., OMNISCHOOL"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-wider"
                  />
                  <p className="text-[10px] text-zinc-500 italic">This ID will appear as the sender of your school's SMS messages. Max 11 characters.</p>
                </div>
              </div>
            </section>
          )}

          {role === 'SCHOOL_ADMIN' && (
            <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" />
                Admission Number Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Prefix</label>
                  <input
                    type="text"
                    value={organization?.admission_no_prefix || ''}
                    onChange={(e) => setOrganization({ ...organization, admission_no_prefix: e.target.value })}
                    placeholder="e.g., ADM-"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Letters before the number.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Starting Number</label>
                  <input
                    type="number"
                    value={organization?.admission_no_start_from || ''}
                    onChange={(e) => setOrganization({ ...organization, admission_no_start_from: parseInt(e.target.value) || 1 })}
                    placeholder="e.g., 001"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Sequential start counter.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Suffix</label>
                  <input
                    type="text"
                    value={organization?.admission_no_suffix || ''}
                    onChange={(e) => setOrganization({ ...organization, admission_no_suffix: e.target.value })}
                    placeholder="e.g., -24"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Letters after the number.</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Next Admission Number Preview:</span>
                <span className="font-mono text-lg font-bold text-indigo-700 dark:text-indigo-400">
                  {`${organization?.admission_no_prefix || ''}${organization?.admission_no_start_from || 1}${organization?.admission_no_suffix || ''}`}
                </span>
              </div>
            </section>
          )}

          {role === 'SUPER_ADMIN' && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{t('platform_branding')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('platform_name')}</label>
                  <input type="text" defaultValue="SchoolHub RBMS" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('support_email')}</label>
                  <input type="email" defaultValue="support@schoolhub.com" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex items-center gap-6 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{t('platform_logo')}</h4>
                  <p className="text-xs text-zinc-500 mb-2">{t('platform_logo_desc')}</p>
                  <button className="text-xs font-bold text-indigo-600 hover:underline">{t('upload_logo')}</button>
                </div>
              </div>
            </section>
          )}

          {role === 'SUPER_ADMIN' && (
            <section className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{t('security_access')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t('two_factor')}</h4>
                    <p className="text-xs text-zinc-500">{t('two_factor_desc')}</p>
                  </div>
                  <button className="w-12 h-6 bg-indigo-600 rounded-full relative transition-colors">
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t('org_reg')}</h4>
                    <p className="text-xs text-zinc-500">{t('org_reg_desc')}</p>
                  </div>
                  <button className="w-12 h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full relative transition-colors">
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className="pt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading || (!organization && role === 'SCHOOL_ADMIN')}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('save_changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentBuilder({ data = [], onRefresh, organization, lockedType, hideTypeSelect }: { data?: any[], onRefresh?: () => void, organization?: any, lockedType?: string, hideTypeSelect?: boolean }) {
  const { currency, t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'layers'>('content');
  const [activeSection, setActiveSection] = useState<'header' | 'body' | 'footer'>('body');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: lockedType || 'Receipt',
    layout_config: {
      content: '',
      headerText: '',
      footerText: '',
      styles: '',
      pageSettings: {
        padding: 60,
        margin: 20,
        lineHeight: 1.6,
        fontSize: '14px',
        fontFamily: 'serif',
        textColor: '#18181b'
      }
    }
  });

  // Filter templates if lockedType is provided
  const filteredData = lockedType
    ? data.filter(item => item.type === lockedType)
    : data;


  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, item: any | null }>({
    isOpen: false,
    item: null
  });

  const variablesByType: Record<string, string[]> = {
    'Receipt': ['{{student_name}}', '{{admission_no}}', '{{class_name}}', '{{date}}', '{{amount}}', '{{fee_type}}', '{{transaction_id}}', '{{school_name}}', '{{school_address}}', '{{school_logo}}', '{{principal_signature}}'],
    'Invoice': ['{{student_name}}', '{{admission_no}}', '{{class_name}}', '{{date}}', '{{due_date}}', '{{total_amount}}', '{{outstanding_amount}}', '{{school_name}}', '{{school_address}}', '{{school_logo}}', '{{principal_signature}}'],
    'OfferLetter': ['{{staff_name}}', '{{position}}', '{{salary}}', '{{join_date}}', '{{department}}', '{{school_name}}', '{{school_logo}}', '{{principal_signature}}'],
    'ExitLetter': ['{{staff_name}}', '{{exit_date}}', '{{reason}}', '{{school_name}}', '{{school_logo}}', '{{principal_signature}}'],
    'Custom': ['{{date}}', '{{school_name}}', '{{school_logo}}', '{{principal_signature}}']
  };

  const PRE_TEXT_TEMPLATES: Record<string, string> = {
    'Invoice': `
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #4f46e5; font-size: 32px; margin-bottom: 5px;">INVOICE</h1>
        <p style="color: #666; font-weight: bold;">Date: {{date}} | Due: {{due_date}}</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fafafa;">
        <div>
          <h4 style="color: #4f46e5; margin-bottom: 10px;">BILL TO:</h4>
          <p><strong>{{student_name}}</strong></p>
          <p>Admission: {{admission_no}}</p>
        </div>
        <div style="text-align: right;">
          <h4 style="color: #4f46e5; margin-bottom: 10px;">SCHOOL:</h4>
          <p><strong>{{school_name}}</strong></p>
          <p>{{school_address}}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <tr style="background: #4f46e5; color: white;">
          <th style="padding: 12px; text-align: left;">Fee Description</th>
          <th style="padding: 12px; text-align: right;">Amount</th>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px;">Academic Fees & Tuition</td>
          <td style="padding: 12px; text-align: right;">{{total_amount}}</td>
        </tr>
      </table>
      <div style="text-align: right; margin-left: auto; width: 300px; padding: 20px; background: #f8fafc; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Total Amount:</span>
          <strong>{{total_amount}}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; color: #e11d48; border-top: 1px solid #ddd; pt: 10px; mt: 10px;">
          <span>Outstanding Balance:</span>
          <strong>{{outstanding_amount}}</strong>
        </div>
      </div>
    `,
    'Receipt': `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin-bottom: 5px;">RECEIPT</h1>
        <p style="color: #666;">No: {{transaction_id}}</p>
      </div>
      <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 20px; border-radius: 12px; background: #fafafa;">
        <p>Received with thanks from <strong>{{student_name}}</strong> ({{admission_no}})</p>
        <p>Class: <strong>{{class_name}}</strong></p>
      </div>
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 2px solid #4f46e5;">
            <th style="text-align: left; padding: 10px;">Description</th>
            <th style="text-align: right; padding: 10px;">Amount</th>
          </tr>
          <tr>
            <td style="padding: 10px;">{{fee_type}}</td>
            <td style="text-align: right; padding: 10px; font-weight: bold;">{{amount}}</td>
          </tr>
        </table>
      </div>
      <div style="margin-top: 50px; text-align: center;">
        <p>Date: {{date}}</p>
        <p>Authorized Signature: {{principal_signature}}</p>
      </div>
    `,
    'OfferLetter': `
      <div style="text-align: right; margin-bottom: 40px;">
        <p>{{school_name}}</p>
        <p>{{school_address}}</p>
        <p>{{date}}</p>
      </div>
      <p>Dear <strong>{{staff_name}}</strong>,</p>
      <h2 style="color: #4f46e5; margin-top: 30px;">RE: OFFER OF APPOINTMENT - {{position}}</h2>
      <p style="margin-top: 20px;">We are pleased to offer you the position of <strong>{{position}}</strong> in the <strong>{{department}}</strong> at {{school_name}}, starting from {{join_date}}.</p>
      <p>Your remuneration package will be <strong>{{salary}}</strong> per month plus associated benefits as discussed.</p>
      <div style="margin-top: 40px;">
        <p>Sincerely,</p>
        <div style="margin-top: 20px;">{{principal_signature}}</div>
        <p><strong>The Principal</strong></p>
      </div>
    `,
    'ExitLetter': `
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #1e1b4b;">SERVICE CLEARANCE & EXIT LETTER</h2>
        <hr style="border: 1px solid #eee;"/>
      </div>
      <p>Date: {{date}}</p>
      <p>To Whom It May Concern,</p>
      <p style="margin-top: 20px;">This is to certify that <strong>{{staff_name}}</strong> has completed all necessary clearance processes following their exit on <strong>{{exit_date}}</strong>.</p>
      <p>Reason for exit: {{reason}}</p>
      <p>We confirm that all school properties have been returned and financial obligations have been settled.</p>
      <div style="margin-top: 50px;">
        <p>Signed:</p>
        <div style="margin-top: 10px;">{{principal_signature}}</div>
        <p><strong>{{school_name}} Management</strong></p>
      </div>
    `
  };

  const handleAdd = () => {
    setEditingItem(null);
    const type = lockedType || 'Receipt';
    setFormData({
      name: '',
      type,
      layout_config: {
        content: PRE_TEXT_TEMPLATES[type] || '',
        headerText: organization?.logo ? `<img src="${organization.logo}" style="max-height: 80px;" alt="Logo" />` : '<h1>' + (organization?.name || 'School Header') + '</h1>',
        footerText: '<p style="text-align: center;">' + (organization?.address || 'School Footer Address') + '</p>',
        styles: ''
      }
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      type: item.type || lockedType || 'Receipt',
      layout_config: item.layout_config || { content: '', headerText: '', footerText: '', styles: '' }
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDocumentTemplate(editingItem.id, formData);
        (window as any).showToast?.('Template updated successfully!', 'success');
      } else {
        await createDocumentTemplate(formData);
        (window as any).showToast?.('Template created successfully!', 'success');
      }
      setIsModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to save template:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleDeleteClick = (item: any) => {
    setDeleteConfirm({ isOpen: true, item });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      await deleteDocumentTemplate(deleteConfirm.item.id);
      (window as any).showToast?.('Template deleted successfully!', 'success');
      setDeleteConfirm({ isOpen: false, item: null });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete template:', err);
      (window as any).showToast?.(err, 'error');
    }
  };

  const syncActiveSection = () => {
    // Determine which element to sync based on active section
    let elementId = 'template-canvas';
    let field: 'content' | 'headerText' | 'footerText' = 'content';

    if (activeSection === 'header') {
      elementId = 'header-canvas';
      field = 'headerText';
    } else if (activeSection === 'footer') {
      elementId = 'footer-canvas';
      field = 'footerText';
    }

    const el = document.getElementById(elementId);
    if (el) {
      setIsSaving(true);
      setFormData(prev => ({
        ...prev,
        layout_config: {
          ...prev.layout_config,
          [field]: el.innerHTML
        }
      }));
      // Visual feedback
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const insertVariable = (variable: string) => {
    let elementId = 'template-canvas';
    if (activeSection === 'header') elementId = 'header-canvas';
    else if (activeSection === 'footer') elementId = 'footer-canvas';

    const el = document.getElementById(elementId);
    if (el) el.focus();

    document.execCommand('insertText', false, ' ' + variable + ' ');
    setTimeout(syncActiveSection, 10);
  };

  const applyStyle = (command: string, value: string = '') => {
    // Focus the correct area before applying
    let elementId = 'template-canvas';
    if (activeSection === 'header') elementId = 'header-canvas';
    else if (activeSection === 'footer') elementId = 'footer-canvas';

    const el = document.getElementById(elementId);
    if (el) el.focus();

    document.execCommand(command, false, value);
    // Sync after a tiny delay to allow execCommand to finish
    setTimeout(syncActiveSection, 10);
  };

  const handlePreview = () => {
    const sampleData: Record<string, any> = {
      'Receipt': {
        '{{student_name}}': 'John Doe',
        '{{admission_no}}': 'ADM-2023-001',
        '{{class_name}}': 'Grade 5A',
        '{{date}}': new Date().toLocaleDateString(),
        '{{amount}}': `${currency} 1,200.00`,
        '{{fee_type}}': 'Tuition Fees',
        '{{transaction_id}}': 'TXN12345678',
      },
      'OfferLetter': {
        '{{staff_name}}': 'Jane Smith',
        '{{position}}': 'Senior Teacher',
        '{{salary}}': `${currency} 3,500.00`,
        '{{join_date}}': new Date().toLocaleDateString(),
        '{{department}}': 'Science Department',
      },
      'ExitLetter': {
        '{{staff_name}}': 'Robert Brown',
        '{{exit_date}}': new Date().toLocaleDateString(),
        '{{reason}}': 'Resignation for personal growth',
      },
      'Custom': {
        '{{date}}': new Date().toLocaleDateString(),
      }
    };

    const type = formData.type as keyof typeof sampleData;
    const data = sampleData[type] || {};

    // Add common organization variables
    data['{{school_name}}'] = organization?.name || 'Your School Name';
    data['{{school_address}}'] = organization?.address || '123 School Street, Accra';
    data['{{school_logo}}'] = organization?.logo ? `<img src="${organization.logo}" style="max-height: 80px; display: block; margin: 0 auto;" alt="Logo" />` : '<div style="height: 80px; background: #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999;">[LOGO PLACEHOLDER]</div>';
    data['{{principal_signature}}'] = organization?.signature ? `<img src="${organization.signature}" style="max-height: 50px;" alt="Signature" />` : '<div style="height: 50px; width: 150px; border-bottom: 1px dashed #ccc; margin-top: 10px;">[SIGNATURE]</div>';

    let body = formData.layout_config.content || '';
    Object.entries(data).forEach(([key, value]) => {
      body = body.split(key).join(value as string);
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Preview: ${formData.name}</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 50px; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; border: 1px solid #eee; margin-top: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; min-height: 40px; }
              .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666; text-align: center; min-height: 30px; }
              .preview-badge { position: absolute; top: 10px; right: 10px; background: #fef3c7; color: #b45309; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: bold; border: 1px solid #fde68a; }
              ${formData.layout_config.styles || ''}
              @media print { body { border: none; box-shadow: none; margin-top: 0; } .preview-badge { display: none; } }
            </style>
          </head>
          <body>
            <div class="preview-badge">PREVIEW MODE</div>
            <div class="header">${formData.layout_config.headerText || ''}</div>
            <div class="template-body">${body}</div>
            <div class="footer">${formData.layout_config.footerText || ''}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Document & Receipt Builder</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus size={20} />
          Create Template
        </button>
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[40px] text-center shadow-inner">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20 animate-bounce">
            <Plus size={48} />
          </div>
          <h3 className="text-2xl font-black mb-3">Your Design Studio is Ready</h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-10 text-sm leading-relaxed">
            Every professional school needs beautiful documents. Click the big button below to launch the **Visual Studio** and create your first design.
          </p>
          <button
            onClick={handleAdd}
            className="group flex items-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95"
          >
            <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            CREATE YOUR FIRST TEMPLATE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <div key={item.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1">{item.name}</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{item.type}</p>
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
                <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Editing: ${formData.name || 'Untitled'}` : "New Document Studio"}
        maxWidth="max-w-[95vw]"
        maxHeight="max-h-[95vh]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-[85vh]">
          {/* Main Studio Workspace */}
          <div className="flex-1 flex overflow-hidden bg-zinc-950 relative">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}></div>

            {/* Floating Left Toolbar - Tools & Layers */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-16 flex flex-col gap-4 z-40">
              <div className="p-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={cn(
                    "p-3 rounded-xl transition-all group relative",
                    activeTab === 'content' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <FileText size={20} />
                  <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Content Tools</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className={cn(
                    "p-3 rounded-xl transition-all group relative",
                    activeTab === 'design' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Palette size={20} />
                  <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Visual Design</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('layers')}
                  className={cn(
                    "p-3 rounded-xl transition-all group relative",
                    activeTab === 'layers' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Search size={20} />
                  <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Explorer</span>
                </button>
              </div>
            </div>

            {/* Right: Studio Inspector */}
            <div className="absolute right-6 top-6 bottom-6 w-[340px] flex flex-col bg-zinc-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500 z-40">
              {/* Header Tabs */}
              <div className="flex border-b border-white/5 p-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all",
                    activeTab === 'content' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all",
                    activeTab === 'design' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Design
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 max-h-[calc(95vh-140px)]">
                {/* Template Identity */}
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Template Name (e.g. Q1 Invoice)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                  />
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-400 outline-none"
                  >
                    <option value="Receipt">Receipt</option>
                    <option value="OfferLetter">Offer Letter</option>
                    <option value="ExitLetter">Exit Letter</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {activeTab === 'content' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Available Tokens</label>
                    <div className="grid grid-cols-1 gap-2">
                      {variablesByType[formData.type]?.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v)}
                          className="text-left px-4 py-2.5 bg-white/5 hover:bg-indigo-600/20 text-xs text-zinc-300 hover:text-indigo-300 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between group"
                        >
                          <span>{v.replace('{{', '').replace('}}', '').replace('_', ' ')}</span>
                          <Plus size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'design' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Page Padding</label>
                          <span className="text-[10px] text-indigo-400 font-mono">{formData.layout_config.pageSettings?.padding}px</span>
                        </div>
                        <input
                          type="range" min="0" max="100" step="5"
                          value={formData.layout_config.pageSettings?.padding || 60}
                          onChange={e => setFormData({ ...formData, layout_config: { ...formData.layout_config, pageSettings: { ...formData.layout_config.pageSettings!, padding: parseInt(e.target.value) } } })}
                          className="w-full accent-indigo-600 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Line Spacing</label>
                          <span className="text-[10px] text-indigo-400 font-mono">{formData.layout_config.pageSettings?.lineHeight}</span>
                        </div>
                        <input
                          type="range" min="1" max="2.5" step="0.1"
                          value={formData.layout_config.pageSettings?.lineHeight || 1.6}
                          onChange={e => setFormData({ ...formData, layout_config: { ...formData.layout_config, pageSettings: { ...formData.layout_config.pageSettings!, lineHeight: parseFloat(e.target.value) } } })}
                          className="w-full accent-indigo-600 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Text Style</label>
                        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                          <input
                            type="color"
                            value={formData.layout_config.pageSettings?.textColor || '#18181b'}
                            onChange={e => setFormData({ ...formData, layout_config: { ...formData.layout_config, pageSettings: { ...formData.layout_config.pageSettings!, textColor: e.target.value } } })}
                            className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                          />
                          <span className="text-[10px] text-zinc-400">Color</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Font Family</label>
                        <select
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                          value={formData.layout_config.pageSettings?.fontFamily}
                          onChange={e => setFormData({ ...formData, layout_config: { ...formData.layout_config, pageSettings: { ...formData.layout_config.pageSettings!, fontFamily: e.target.value } } })}
                        >
                          <option value="serif">Formal (Serif)</option>
                          <option value="sans-serif">Modern (Sans)</option>
                          <option value="monospace">Mono</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-2 h-2 rounded-full", isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          {isSaving ? "Syncing Workspace..." : "Synced to Cloud"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed italic">Changes are captured instantly.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer (Sticky) */}
              <div className="p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 mt-auto">
                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <Check size={24} />
                  SAVE & PUBLISH DESIGN
                </button>
              </div>
            </div>

            {/* Center Canvas / Workspace */}
            <div className="flex-1 flex flex-col items-center overflow-y-auto p-20 custom-scrollbar relative z-10">
              {/* Floating Center Actions */}
              <div className="mb-12 flex items-center gap-2 px-6 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl opacity-80 hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => applyStyle('bold')} className="p-2 text-zinc-400 hover:text-white transition-colors" title="Bold"><span className="font-bold font-serif">B</span></button>
                <button type="button" onClick={() => applyStyle('italic')} className="p-2 text-zinc-400 hover:text-white transition-colors" title="Italic"><span className="italic font-serif">I</span></button>
                <button type="button" onClick={() => applyStyle('underline')} className="p-2 text-zinc-400 hover:text-white transition-colors" title="Underline"><span className="underline font-serif">U</span></button>
                <div className="w-px h-4 bg-white/10 mx-2" />
                <button type="button" onClick={() => applyStyle('justifyLeft')} className="p-2 text-zinc-400 hover:text-white transition-colors"><FileText size={16} /></button>
                <button type="button" onClick={() => applyStyle('justifyCenter')} className="p-2 text-zinc-400 hover:text-white transition-colors"><Briefcase size={16} /></button>
                <button type="button" onClick={() => applyStyle('justifyRight')} className="p-2 text-zinc-400 hover:text-white transition-colors"><Send size={16} /></button>
                <div className="w-px h-4 bg-white/10 mx-2" />
                <button type="button" onClick={handlePreview} className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 ml-2">
                  <Eye size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Preview PDF</span>
                </button>
              </div>

              {/* The "Paper" */}
              <div className="relative group/canvas">
                <div className={cn(
                  "mx-auto w-[800px] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-lg min-h-[1100px] flex flex-col overflow-hidden transition-all duration-300 transform",
                  "ring-1 ring-white/5 ring-inset"
                )}>
                  {/* Header Block */}
                  <div
                    onClick={() => setActiveSection('header')}
                    className={cn(
                      "outline-none relative transition-all cursor-text text-center",
                      activeSection === 'header' ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/10" : "hover:bg-zinc-50"
                    )}
                    style={{ padding: `${formData.layout_config.pageSettings?.padding}px` }}
                  >
                    <div
                      id="header-canvas"
                      contentEditable
                      onBlur={syncActiveSection}
                      onInput={syncActiveSection}
                      dangerouslySetInnerHTML={{ __html: formData.layout_config.headerText }}
                      className="outline-none"
                    />
                    {activeSection === 'header' && <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold uppercase rounded rounded-bl-none">Header Section</div>}
                  </div>

                  {/* Body Block */}
                  <div
                    onClick={() => setActiveSection('body')}
                    className={cn(
                      "flex-1 outline-none relative transition-all cursor-text",
                      activeSection === 'body' ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/5" : "hover:bg-zinc-50/50"
                    )}
                    style={{
                      padding: `${formData.layout_config.pageSettings?.padding}px`,
                      lineHeight: formData.layout_config.pageSettings?.lineHeight,
                      fontFamily: formData.layout_config.pageSettings?.fontFamily,
                      color: formData.layout_config.pageSettings?.textColor
                    }}
                  >
                    <div
                      id="template-canvas"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={syncActiveSection}
                      onInput={syncActiveSection}
                      dangerouslySetInnerHTML={{ __html: formData.layout_config.content }}
                      className="outline-none min-h-[600px] prose prose-zinc max-w-none prose-p:my-2 prose-h2:text-indigo-600 prose-strong:text-indigo-900"
                      style={{
                        color: 'inherit',
                        fontFamily: 'inherit'
                      }}
                    />
                    {activeSection === 'body' && <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold uppercase rounded rounded-bl-none">Main Canvas</div>}
                  </div>

                  {/* Footer Block */}
                  <div
                    onClick={() => setActiveSection('footer')}
                    className={cn(
                      "min-h-[120px] border-t border-zinc-100 outline-none relative transition-all cursor-text text-center text-xs text-zinc-500",
                      activeSection === 'footer' ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/10" : "hover:bg-zinc-50"
                    )}
                    style={{ padding: `${formData.layout_config.pageSettings?.padding}px` }}
                  >
                    <div
                      id="footer-canvas"
                      contentEditable
                      onBlur={syncActiveSection}
                      onInput={syncActiveSection}
                      dangerouslySetInnerHTML={{ __html: formData.layout_config.footerText }}
                      className="outline-none"
                    />
                    {activeSection === 'footer' && <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold uppercase rounded rounded-bl-none">Footer Area</div>}
                  </div>
                </div>

                {/* Visual Rulers */}
                <div className="absolute -left-12 top-0 bottom-0 w-8 border-r border-white/5 opacity-50 flex flex-col justify-between py-4 text-[8px] text-zinc-600 font-mono">
                  {[...Array(10)].map((_, i) => <span key={i}>{(i + 1) * 10}cm</span>)}
                </div>
              </div>
              <style dangerouslySetInnerHTML={{ __html: formData.layout_config.styles }} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        message={`Are you sure you want to delete the template "${deleteConfirm.item?.name}"?`}
      />
    </div>
  );
}

export function PartnersManagement({ onRefresh }: { onRefresh?: () => void }) {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [viewingPartner, setViewingPartner] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: 'zxcv123$$', contact_number: '', company_name: '', registration_number: '', status: 'Active', language: 'en', currency: 'GH₵'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, partner: any | null }>({ isOpen: false, partner: null });
  const [resetConfirm, setResetConfirm] = useState<{ isOpen: boolean, partner: any | null }>({ isOpen: false, partner: null });
  const [rewardModal, setRewardModal] = useState<{ isOpen: boolean, partner: any | null }>({ isOpen: false, partner: null });

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await fetchPartners();
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPartners(); }, []);

  const handleAdd = () => {
    setEditingPartner(null);
    setFormData({ name: '', email: '', password: 'zxcv123$$', contact_number: '', company_name: '', registration_number: '', status: 'Active', language: 'en', currency: 'GH₵' });
    setIsModalOpen(true);
  };

  const handleEdit = (partner: any) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name, email: partner.email, password: '', contact_number: partner.contact_number || '',
      company_name: partner.company_name || '', registration_number: partner.registration_number || '', status: partner.status || 'Active', language: partner.language || 'en', currency: partner.currency || 'GH₵'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPartner) {
        await updatePartner(editingPartner.id, formData);
        (window as any).showToast?.('Partner updated successfully!', 'success');
      } else {
        await createPartnerAdmin(formData);
        (window as any).showToast?.('Partner created successfully!', 'success');
      }
      setIsModalOpen(false);
      loadPartners();
    } catch (err: any) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleApprove = async (partner: any) => {
    try {
      await approvePartner(partner.id);
      (window as any).showToast?.(`${partner.name} approved!`, 'success');
      loadPartners();
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.partner) return;
    try {
      await deletePartnerAdmin(deleteConfirm.partner.id);
      (window as any).showToast?.('Partner deleted!', 'success');
      loadPartners();
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleConfirmReset = async () => {
    if (!resetConfirm.partner) return;
    try {
      await resetPartnerPassword(resetConfirm.partner.id);
      (window as any).showToast?.(`Password for ${resetConfirm.partner.name} reset to zxcv123$$`, 'success');
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      Pending: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      Suspended: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
    };
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${colors[status] || colors.Pending}`}>{status}</span>;
  };

  return (
    <div className="space-y-8">
      <DataTable
        title="Partner Management"
        data={partners}
        onAdd={handleAdd}
        onEdit={handleEdit}
        autoModal={false}
        autoViewModal={false}
        onDelete={(p: any) => setDeleteConfirm({ isOpen: true, partner: p })}
        onView={(p: any) => setViewingPartner(p)}
        columns={[
          { header: 'Name', accessor: 'name', className: 'font-bold' },
          { header: 'Company', accessor: 'company_name', className: 'text-zinc-500' },
          { header: 'Email', accessor: 'email', className: 'text-zinc-500' },
          { header: 'Status', accessor: (item: any) => statusBadge(item.status || 'Pending') },
          { header: 'Referral Code', accessor: 'referral_code', className: 'font-mono text-indigo-600' },
          { header: 'Earnings', accessor: (item: any) => `${item.currency || 'GH₵'} ${parseFloat(item.converted_total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
        ]}
        extraActions={(p: any) => (
          <button
            onClick={() => setRewardModal({ isOpen: true, partner: p })}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 rounded-lg transition-colors"
          >
            <Award className="w-4 h-4" />
            Awards & Rewards
          </button>
        )}
      />

      {/* View Partner Details */}
      <Modal isOpen={!!viewingPartner} onClose={() => setViewingPartner(null)} title="Partner Details" maxWidth="max-w-2xl">
        {viewingPartner && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
                {viewingPartner.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{viewingPartner.name}</h3>
                <p className="text-zinc-500 font-medium">{viewingPartner.email}</p>
              </div>
              <div className="ml-auto">{statusBadge(viewingPartner.status || 'Pending')}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Company</p>
                <p className="font-bold text-zinc-900 dark:text-white">{viewingPartner.company_name || '—'}</p>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Referral Code</p>
                <p className="font-bold font-mono text-indigo-600">{viewingPartner.referral_code}</p>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Total Earnings</p>
                <p className="font-bold text-emerald-600">
                  GH₵ {parseFloat(viewingPartner.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {viewingPartner.currency && viewingPartner.currency !== 'GH₵' && (
                    <span className="block text-[10px] text-zinc-500 font-medium">
                      ≈ {viewingPartner.currency} {parseFloat(viewingPartner.converted_total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Joined</p>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">{new Date(viewingPartner.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Payout Information Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                <CreditCard className="w-3 h-3" />
                Payout Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Method</p>
                  <p className="font-bold text-zinc-900 dark:text-white capitalize">
                    {viewingPartner.payout_type?.replace('_', ' ').toLowerCase() || 'Not Configured'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Bank / Provider</p>
                  <p className="font-bold text-zinc-900 dark:text-white">{viewingPartner.bank_name || '—'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Account / Mobile Number</p>
                  <p className="font-bold text-zinc-900 dark:text-white font-mono">{viewingPartner.account_number || '—'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Account Name</p>
                  <p className="font-bold text-emerald-600">{viewingPartner.account_name || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {viewingPartner.status !== 'Active' && (
                <button onClick={() => { handleApprove(viewingPartner); setViewingPartner(null); }} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors">Approve</button>
              )}
              <button onClick={() => { setResetConfirm({ isOpen: true, partner: viewingPartner }); setViewingPartner(null); }} className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm hover:bg-amber-600 transition-colors">Reset Password</button>
              <button onClick={() => setViewingPartner(null)} className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Partner Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPartner ? 'Edit Partner' : 'Add New Partner'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Email</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
            </div>
          </div>
          {!editingPartner && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Password</label>
              <input type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" placeholder="Default: zxcv123$$" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Contact Number</label>
              <input type="tel" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Company Name</label>
              <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Registration #</label>
              <input type="text" value={formData.registration_number} onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Language</label>
              <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="pt">Portuguese</option>
                <option value="sw">Swahili</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Currency</label>
              <select value={(formData as any).currency || 'GH₵'} onChange={(e) => setFormData({ ...formData, currency: e.target.value } as any)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                <option value="GH₵">Ghana Cedis (GH₵)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="NGN">Nigerian Naira (NGN)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="CFA">CFA Franc (CFA)</option>
                <option value="ZAR">South African Rand (ZAR)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-zinc-500">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">{editingPartner ? 'Update Partner' : 'Create Partner'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Partner"
        message={`Are you sure you want to delete partner "${deleteConfirm.partner?.name}"? This action cannot be undone.`}
      />

      <PartnerRewardsModal
        isOpen={rewardModal.isOpen}
        partner={rewardModal.partner}
        onClose={() => setRewardModal({ ...rewardModal, isOpen: false })}
      />

      <ConfirmationModal
        isOpen={resetConfirm.isOpen}
        onClose={() => setResetConfirm({ ...resetConfirm, isOpen: false })}
        onConfirm={handleConfirmReset}
        title="Reset Partner Password"
        message={`Are you sure you want to reset the password for "${resetConfirm.partner?.name}" back to the default (zxcv123$$)?`}
      />
    </div>
  );
}

function PartnerRewardsModal({ partner, isOpen, onClose }: { partner: any, isOpen: boolean, onClose: () => void }) {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ type: 'Certificate', title: '', description: '', criteria: '' });

  const loadRewards = async () => {
    try {
      setLoading(true);
      const data = await fetchPartnerRewards(partner.id);
      setRewards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen && partner) loadRewards(); }, [isOpen, partner]);

  const handleAward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await awardPartnerReward(partner.id, formData);
      (window as any).showToast?.('Reward awarded successfully!', 'success');
      setIsAdding(false);
      setFormData({ type: 'Certificate', title: '', description: '', criteria: '' });
      loadRewards();
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePartnerReward(id);
      (window as any).showToast?.('Reward revoked!', 'success');
      loadRewards();
    } catch (err) {
      (window as any).showToast?.(err, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rewards & Achievements: ${partner?.name}`} maxWidth="max-w-xl">
      <div className="space-y-6">
        {isAdding ? (
          <form onSubmit={handleAward} className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Award New Recognition</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider ml-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Certificate">Certificate</option>
                  <option value="Badge">Badge</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider ml-1">Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Platinum Partner" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider ml-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Details about this achievement..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider ml-1">Criteria</label>
              <input type="text" value={formData.criteria} onChange={e => setFormData({ ...formData, criteria: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Over 50 successful referrals" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5">Award Now</button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Achievement History</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-0.5">{rewards.length} AWARDS ISSUED</p>
            </div>
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"><Plus className="w-3.5 h-3.5" /> New Reward</button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-zinc-500 font-medium">Loading achievements...</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-zinc-300 dark:text-zinc-500" />
            </div>
            <p className="text-zinc-900 dark:text-white font-bold">No Rewards Yet</p>
            <p className="text-sm text-zinc-500 max-w-[200px] mx-auto mt-1 italic">Recognize this partner's growth with a badge or certificate.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {rewards.map(reward => (
              <div key={reward.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${reward.type === 'Badge' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                    {reward.type === 'Badge' ? <Award className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-zinc-900 dark:text-white text-sm">{reward.title}</h5>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${reward.type === 'Badge' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{reward.type}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{reward.criteria || 'Standard Performance Achievement'}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{new Date(reward.issued_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(reward.id)} className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
