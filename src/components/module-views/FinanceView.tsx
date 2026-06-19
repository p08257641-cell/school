import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle,
  Plus,
  Wallet,
  CreditCard,
  Coffee,
  Shirt,
  ShoppingCart,
  FileText,
  GraduationCap,
  TrendingUp,
  History,
  Eye,
  ArrowLeft,
  Award,
  BarChart3,
  PieChart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Users,
  Download,
  FileUp,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Star,
  UserCheck,
  Check,
  X,
  MessageSquare,
  Send,
  School,
  ExternalLink
} from 'lucide-react';
import { sendBulkSMS } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';
import { downloadFeeTemplate, parseFeeExcel } from '../../lib/excel';
import bulkBg from '../../image/New folder/bulk operations.png';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { cn } from '../../lib/utils';
import { Student, UserRole, Ward } from '../../types';
import { DataTable } from '../DataTable';
import { SearchableSelect, Modal } from '../UI';
import { DocumentBuilder } from '../AdminModules';

const CardHeaderBackground: React.FC<{ src: string; opacityClass?: string }> = ({ src, opacityClass = "opacity-40 dark:opacity-25" }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    // If already cached by the browser, naturalWidth > 0 and complete = true
    // so onLoad will never fire — detect this and mark as loaded immediately
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <img
        ref={imgRef}
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        loading="lazy"
        decoding="async"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
          loaded ? opacityClass : "opacity-0"
        )}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 animate-pulse">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin opacity-50" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/20 dark:from-zinc-900/95 dark:via-zinc-900/70 dark:to-zinc-900/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/50 dark:from-zinc-900/40 dark:via-transparent dark:to-zinc-900/50" />
    </div>
  );
};


const getInvoiceHtml = (invoiceOrInvoices: any | any[], student: any, organization: any, currency: string, payments: any[]) => {
  const invoices = Array.isArray(invoiceOrInvoices) ? invoiceOrInvoices : [invoiceOrInvoices];
  const studentPays = (payments || []);
  
  let totalBilled = 0;
  let totalPaid = 0;
  
  const rows = invoices.map(inv => {
    const amount = parseFloat(inv.amount || 0);
    const paid = studentPays
      .filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id))
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    
    totalBilled += amount;
    totalPaid += paid;
    
    return `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #1e293b;">${inv.description || 'School Fees'}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${inv.academic_year || ''} - ${inv.term || ''}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">ID: #${inv.id.split('-')[0].toUpperCase()}</div>
        </td>
        <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
          ${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join('');

  const balanceDue = totalBilled - totalPaid;
  const isPaid = balanceDue <= 0;
  const isPartial = totalPaid > 0 && !isPaid;
  
  const docTitle = invoices.length > 1 ? 'CONSOLIDATED INVOICE' : (isPaid ? 'RECEIPT' : 'INVOICE');
  const statusLabel = isPaid ? 'PAID IN FULL' : isPartial ? 'PARTIAL PAYMENT' : 'PAYMENT DUE';
  const statusBadgeBg = isPaid ? '#dcfce7' : '#fef3c7';
  const statusBadgeColor = isPaid ? '#10b981' : '#b45309';
  const statusBadgeBorder = isPaid ? '#bbf7d0' : '#fde68a';

  return `
    <div class="invoice-page">
      <div class="receipt-container">
        <div class="header">
          <div class="school-info">
            ${organization?.logo ? `<img src="${organization.logo}" style="max-height: 48px; margin-bottom: 12px;" />` : ''}
            <h2>${organization?.name || 'School Name'}</h2>
            <p>${organization?.address || 'School Address'}</p>
          </div>
          <div class="receipt-title">
            <h1>${docTitle}</h1>
            <p>${invoices.length === 1 ? '#' + invoices[0].id.split('-')[0].toUpperCase() : 'Multiple'}</p>
            <div class="status-badge" style="background: ${statusBadgeBg}; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeBorder}; font-size: 10px; padding: 4px 12px; border-radius: 999px; font-weight: 800;">${statusLabel}</div>
          </div>
        </div>
        <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
          <div class="info-block">
            <label style="display: block; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Billed To</label>
            <p style="margin: 0; font-weight: 700; color: #1e293b;">${student?.name}</p>
            <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Class: ${student?.class_name || 'N/A'}</p>
          </div>
          <div class="info-block" style="text-align: right;">
            <label style="display: block; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Date Generated</label>
            <p style="margin: 0; font-weight: 700; color: #1e293b;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 12px; background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Description</th>
              <th style="text-align: right; padding: 12px; background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div style="margin-top: 32px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; padding: 16px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Billed</span>
            <span style="font-size: 16px; font-weight: 800; color: #1e293b;">${currency} ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 16px 24px; background: #fff; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 12px; color: #059669; font-weight: 700; text-transform: uppercase;">Amount Paid</span>
            <span style="font-size: 16px; font-weight: 800; color: #059669;">${currency} ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 16px 24px; background: ${isPaid ? '#f0fdf4' : '#fef2f2'};">
            <span style="font-size: 12px; color: ${isPaid ? '#059669' : '#dc2626'}; font-weight: 800; text-transform: uppercase;">${isPaid ? 'Fully Settled' : 'Balance Due'}</span>
            <span style="font-size: 20px; font-weight: 800; color: ${isPaid ? '#059669' : '#dc2626'};">${currency} ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div class="footer" style="margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div class="thank-you" style="font-size: 14px; color: #64748b; font-style: italic;">${isPaid ? 'Thank you for your payment!' : 'Please pay by the due date. Thank you!'}</div>
          <div class="signature-box" style="text-align: center;">
            ${organization?.signature ? `<img src="${organization.signature}" style="max-height: 48px; margin-bottom: 8px;" />` : '<div style="height: 48px;"></div>'}
            <div style="width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px;"></div>
            <div style="font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const getReceiptHtml = (receipt: any, student: any, organization: any, currency: string) => {
  return `
    <div class="receipt-container">
      <div class="header">
        <div class="school-info">
          ${organization?.logo ? `<img src="${organization.logo}" style="max-height: 48px; margin-bottom: 12px;" />` : ''}
          <h2>${organization?.name || 'School Name'}</h2>
          <p>${organization?.address || 'School Address'}</p>
        </div>
        <div class="receipt-title">
          <h1>RECEIPT</h1>
          <p>#${(receipt.transaction_id || receipt.id || '').split('-')[0].toUpperCase()}</p>
          <div class="status-badge" style="display: inline-block; padding: 6px 12px; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 10px; font-weight: 800; border: 1px solid #bbf7d0;">PAID IN FULL</div>
        </div>
      </div>
      <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <div class="info-block">
          <label style="display: block; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Paid By</label>
          <p style="margin: 0; font-weight: 700; color: #1e293b;">${receipt.student_name || student?.name || 'N/A'}</p>
          <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Class: ${receipt.class_name || student?.class_name || 'N/A'}</p>
        </div>
        <div class="info-block" style="text-align: right;">
          <label style="display: block; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Payment Date</label>
          <p style="margin: 0; font-weight: 700; color: #1e293b;">${new Date(receipt.date || receipt.created_at || receipt.payment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 12px; background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Description</th>
            <th style="text-align: right; padding: 12px; background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9;">
              <strong style="color: #1e293b;">${receipt.description || 'School Fees Payment'}</strong>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${receipt.payment_method || 'General Payment'}</div>
            </td>
            <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">
              ${currency} ${parseFloat(receipt.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; background: #f0fdf4; border-radius: 12px; margin-top: 32px; border: 1px solid #bbf7d0;">
        <span style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase;">Total Paid</span>
        <span style="font-size: 28px; font-weight: 800; color: #10b981;">${currency} ${parseFloat(receipt.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="footer" style="margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div class="thank-you" style="font-size: 14px; color: #64748b; font-style: italic;">Thank you for your payment!</div>
        <div class="signature-box" style="text-align: center;">
          ${organization?.signature ? `<img src="${organization.signature}" style="max-height: 48px; margin-bottom: 8px;" />` : '<div style="height: 48px;"></div>'}
          <div style="width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px;"></div>
          <div style="font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Authorized Signatory</div>
        </div>
      </div>
    </div>
  `;
};


export const FinanceModules = {
  FeeStructure: ({ classes, students, data, onSave, onDelete, role, organization }: { classes: any[], students: Student[], data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, role?: string, organization?: any }) => {
    const { t, currency } = useLanguage();
    const [targetType, setTargetType] = useState<'none' | 'class' | 'students'>('none');
    const activeStudents = students.filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn');

    const renderFeeStructureForm = (item?: any, isViewOnly?: boolean) => (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('fee_name')}</label>
          <input
            type="text"
            name="name"
            defaultValue={item?.name}
            disabled={isViewOnly}
            placeholder={t('fee_name')}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('amount_label')} ({currency})</label>
            <input
              type="number"
              name="amount"
              defaultValue={item?.amount}
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('frequency')}</label>
            <select
              name="period"
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              defaultValue={item?.period || "Termly"}
            >
              <option value="Monthly">{t('monthly')}</option>
              <option value="Termly">{t('termly')}</option>
              <option value="Yearly">{t('yearly')}</option>
              <option value="One-time">{t('one_time')}</option>
            </select>
          </div>
        </div>

        {isViewOnly && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('assigned_classes')}</label>
              <div className="flex flex-wrap gap-2">
                {item?.assigned_classes && item.assigned_classes.length > 0 ? (
                  item.assigned_classes.map((c: any) => (
                    <span key={c.id} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium">
                      {c.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-400 itallic">{t('no_classes_assigned')}</span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('assigned_students')}</label>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t('students_assigned_count').replace('{count}', (item?.assignment_count || 0).toString())}
              </p>
            </div>
          </div>
        )}

        {!isViewOnly && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-3">{t('instant_assignment')}</label>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('assign_to')}</label>
                <select
                  name="target_type"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">{t('dont_assign_yet')}</option>
                  <option value="class">{t('entire_class')}</option>
                  <option value="students">{t('specific_students')}</option>
                </select>
              </div>

              {targetType === 'class' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Class(es)</label>
                  <SearchableSelect
                    name="class_ids"
                    multiple
                    placeholder="Choose Class(es)..."
                    options={classes.map(c => ({ value: c.id, label: c.name }))}
                    disabled={isViewOnly}
                  />
                </div>
              )}

              {targetType === 'students' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Students</label>
                  <SearchableSelect
                    name="student_ids"
                    multiple
                    placeholder="Choose Student(s)..."
                    options={activeStudents.map(s => ({ value: s.id, label: `${s.name} (${s.class_name || s.class || 'N/A'})` }))}
                    disabled={isViewOnly}
                  />
                </div>
              )}

              {targetType !== 'none' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                      <input
                        type="text"
                        name="academic_year"
                        defaultValue={organization?.academic_year || ""}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                      <select
                        name="term"
                        defaultValue={organization?.current_term || ""}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Term...</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('due_date')}</label>
                    <input
                      type="date"
                      name="due_date"
                      disabled={isViewOnly}
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
                    <input
                      type="checkbox"
                      name="notify_via_sms"
                      id="notify_via_sms_fs"
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="notify_via_sms_fs" className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider cursor-pointer">
                      Notify Parents via SMS
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <DataTable
        title={t('fees_assignment')}
        data={data || []}
        onSave={onSave}
        onDelete={onDelete}
        renderDetails={(item) => (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {item.period}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('fee_structure')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('amount_label')}</p>
                <p className="text-2xl font-black text-indigo-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('assigned_students')}</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.assignment_count || 0}</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('assigned_classes')}</label>
                <div className="flex flex-wrap gap-2">
                  {item.assigned_classes && item.assigned_classes.length > 0 ? item.assigned_classes.map((c: any) => (
                    <span key={c.id} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {c.name}
                    </span>
                  )) : <span className="text-xs text-zinc-400 italic">No classes assigned</span>}
                </div>
              </div>
            </div>
          </div>
        )}
        columns={[
          { header: 'Name', accessor: 'name', className: 'font-bold' },
          {
            header: 'Amount',
            accessor: (item) => `${currency} ${parseFloat(item.amount).toLocaleString()}`
          },
          { header: 'Period', accessor: 'period', className: 'hidden sm:table-cell' },
          {
            header: 'Assigned Classes',
            className: 'hidden md:table-cell',
            accessor: (item) => (
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {item.assigned_classes && Array.isArray(item.assigned_classes) && item.assigned_classes.length > 0 ? (
                  item.assigned_classes.map((c: any) => (
                    <span key={c.id} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                      {c.name}
                    </span>
                  ))
                ) : '-'}
              </div>
            )
          },
          ...(role === 'STUDENT' ? [] : [{
            header: 'Students',
            accessor: (item: any) => item.assignment_count,
            className: 'text-center'
          }])
        ]}
        onAdd={onSave ? () => setTargetType('none') : undefined}
        renderForm={renderFeeStructureForm}
      />
    );
  },
  ClassFees: ({ classes, feeStructures, onGenerate, organization }: { classes: any[], feeStructures: any[], onGenerate: (data: any) => void, organization?: any }) => {
    const { t, currency } = useLanguage();
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
    const [academicYear, setAcademicYear] = useState(organization?.academic_year || "");
    const [term, setTerm] = useState(organization?.current_term || "");
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [notifyViaSMS, setNotifyViaSMS] = useState(false);
    const [customSMSMessage, setCustomSMSMessage] = useState(`Dear Parent, a new fee of {{CURRENCY}}{{AMOUNT}} for {{FEE_NAME}} has been assigned to {{STUDENT_NAME}}. Please settle by {{DUE_DATE}}.`);

    const feeOptions = feeStructures.map(f => ({
      value: f.id,
      label: f.name,
      sublabel: `${currency} ${f.amount}`
    }));

    const classOptions = classes.map(c => ({
      value: c.id,
      label: c.name
    }));

    return (
      <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
        <h2 className="text-xl font-bold mb-6">{t('generate_class_fees')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Class(es)</label>
            <SearchableSelect
              name="class_ids"
              options={classOptions}
              multiple={true}
              onValueChange={(val) => setSelectedClassIds(val as string[])}
              placeholder="Choose Class(es)..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fee Types</label>
            <SearchableSelect
              name="fee_structure_id"
              options={feeOptions}
              multiple={true}
              onValueChange={(val) => setSelectedFeeIds(val as string[])}
              placeholder="Choose Fee(s)..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Term...</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl mb-8 max-w-md">
          <input
            type="checkbox"
            id="notify_via_sms_cf"
            checked={notifyViaSMS}
            onChange={(e) => setNotifyViaSMS(e.target.checked)}
            className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="notify_via_sms_cf" className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider cursor-pointer">
            Notify Parents via SMS
          </label>
        </div>

        {notifyViaSMS && (
          <div className="space-y-1.5 mb-8 max-w-2xl">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Custom SMS Message</label>
            <textarea
              value={customSMSMessage}
              onChange={(e) => setCustomSMSMessage(e.target.value)}
              placeholder="Enter custom SMS message..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Available variables: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{STUDENT_NAME}}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{FEE_NAME}}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{AMOUNT}}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{CURRENCY}}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{DUE_DATE}}"}</code>
            </p>
          </div>
        )}
        <button
          onClick={() => {
            if (selectedFeeIds.length === 0) return;
            onGenerate({
              class_ids: selectedClassIds,
              fee_structure_ids: selectedFeeIds,
              due_date: dueDate,
              term: term,
              academic_year: academicYear,
              notify_via_sms: notifyViaSMS,
              custom_sms_message: customSMSMessage
            });
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
          disabled={selectedFeeIds.length === 0}
        >
          {selectedClassIds.length > 0
            ? `Generate Invoices for ${selectedClassIds.length} Selected Class(es)`
            : `Generate Invoices using Assigned Classes`}
        </button>
      </div>
    );
  },
  FeeManagement: ({ students, feeStructures, data, invoices, payments, scholarships, onSave, onDelete, onRecordPayment, organization, documentTemplates, onRefreshTemplates, onNavigate }: { students: Student[], feeStructures: any[], data?: any[], invoices?: any[], payments?: any[], scholarships?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onRecordPayment?: (data: any) => void, organization?: any, documentTemplates?: any[], onRefreshTemplates?: () => Promise<void>, onNavigate?: (view: string) => void }) => {
    const { t, currency } = useLanguage();
    const activeStudents = students.filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [paymentModalData, setPaymentModalData] = useState<any>(null);
    const [bulkMode, setBulkMode] = useState<'payment' | 'invoice'>('payment');
    const [importPreviewItems, setImportPreviewItems] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);
    const [bulkPrintConfig, setBulkPrintConfig] = useState<{
      mode: 'all' | 'class' | 'selected';
      targetClass?: string;
      selectedStudents: string[];
    }>({ mode: 'all', selectedStudents: [] });
    const [isBulkSMSModalOpen, setIsBulkSMSModalOpen] = useState(false);
    const [smsSending, setSmsSending] = useState(false);
    const [smsMessageTemplate, setSmsMessageTemplate] = useState(`Dear Parent, {{STUDENT_NAME}} has an outstanding balance of {{CURRENCY}} {{AMOUNT_OWING}}. Please settle at your earliest convenience. Thank you, {{SCHOOL_NAME}}.`);

    const handlePrintInvoice = (invoice: any, studentOverride?: any) => {
      const student = studentOverride || selectedStudent;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const invoiceHtml = getInvoiceHtml(invoice, student, organization, currency, payments || []);
        
        printWindow.document.write(`
          <html>
            <head>
              <title>${invoice.id.split('-')[0].toUpperCase()}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
              <style>
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
                .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; margin-bottom: 40px; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                .school-info h2 { margin: 0 0 4px 0; font-weight: 800; font-size: 24px; color: #1e1b4b; }
                .school-info p { margin: 0; color: #64748b; font-size: 14px; }
                .receipt-title { text-align: right; }
                .receipt-title h1 { margin: 0; font-size: 36px; font-weight: 800; color: #e2e8f0; letter-spacing: 2px; text-transform: uppercase; }
                .receipt-title p { margin: 8px 0 0 0; font-size: 14px; color: #475569; font-weight: 600; }
                .status-badge { display: inline-block; padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-top: 8px; border: 1px solid #fde68a; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                .info-block label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
                .info-block p { margin: 0; font-size: 15px; font-weight: 600; color: #1e293b; }
                .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                .table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; border-radius: 8px 8px 0 0; }
                .table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }
                .footer { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
                .signature-box { text-align: center; }
                .signature-line { width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
                .signature-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
                .thank-you { font-size: 14px; color: #64748b; font-style: italic; }
              </style>
            </head>
            <body>
              ${invoiceHtml}
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };

    const handlePrintReceipt = (receipt: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const receiptHtml = getReceiptHtml(receipt, selectedStudent, organization, currency);
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${receipt.transaction_id || receipt.id}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
              <style>
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
                .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
              </style>
            </head>
            <body>
              ${receiptHtml}
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };

    const handleBulkPrint = () => {
      let targets = data || [];
      if (bulkPrintConfig.mode === 'class') {
        targets = targets.filter(s => s.class_name === bulkPrintConfig.targetClass);
      } else if (bulkPrintConfig.mode === 'selected') {
        targets = targets.filter(s => bulkPrintConfig.selectedStudents.includes(s.id));
      }

      const targetsWithDebt = targets.filter(student => {
        const studentInvoices = (invoices || []).filter(inv => String(inv.student_id) === String(student.id));
        return studentInvoices.some(inv => {
          const amount = parseFloat(inv.amount || 0);
          const status = (inv.status || '').toLowerCase().trim();
          if (status === 'paid') return false;
          const paid = (payments || [])
            .filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id))
            .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
          return paid < amount;
        });
      });

      if (targetsWithDebt.length === 0) {
        (window as any).showToast?.('No students with outstanding balances found in selection.', 'info');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let allHtml = '';
        targetsWithDebt.forEach(student => {
          const studentInvoices = (invoices || []).filter(inv => String(inv.student_id) === String(student.id));
          const unpaidInvoices = studentInvoices.filter(inv => {
            const amount = parseFloat(inv.amount || 0);
            const status = (inv.status || '').toLowerCase().trim();
            if (status === 'paid') return false;
            const paid = (payments || [])
              .filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id))
              .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
            return paid < amount;
          });
          
          allHtml += getInvoiceHtml(unpaidInvoices, student, organization, currency, payments || []);
        });

        printWindow.document.write(`
          <html>
            <head>
              <title>Bulk Invoices - ${new Date().toLocaleDateString()}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
              <style>
                @media print { 
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; background: #fff; } 
                  .invoice-page { page-break-after: always; padding: 40px; }
                }
                body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; }
                .invoice-page { margin-bottom: 60px; }
                .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                .school-info h2 { margin: 0 0 4px 0; font-weight: 800; font-size: 24px; color: #1e1b4b; }
                .school-info p { margin: 0; color: #64748b; font-size: 14px; }
                .receipt-title { text-align: right; }
                .receipt-title h1 { margin: 0; font-size: 36px; font-weight: 800; color: #e2e8f0; letter-spacing: 2px; text-transform: uppercase; }
                .receipt-title p { margin: 8px 0 0 0; font-size: 14px; color: #475569; font-weight: 600; }
                .status-badge { display: inline-block; padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-top: 8px; border: 1px solid #fde68a; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                .info-block label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
                .info-block p { margin: 0; font-size: 15px; font-weight: 600; color: #1e293b; }
                .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                .table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; border-radius: 8px 8px 0 0; }
                .table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }
                .footer { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
                .signature-box { text-align: center; }
                .signature-line { width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
                .signature-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
                .thank-you { font-size: 14px; color: #64748b; font-style: italic; }
              </style>
            </head>
            <body>
              ${allHtml}
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
        setIsBulkPrintModalOpen(false);
      }
    };

    const handleBulkSMS = async () => {
      let targets = data || [];
      if (bulkPrintConfig.mode === 'class') {
        targets = targets.filter(s => s.class_name === bulkPrintConfig.targetClass);
      } else if (bulkPrintConfig.mode === 'selected') {
        targets = targets.filter(s => bulkPrintConfig.selectedStudents.includes(s.id));
      }

      const targetsWithDebt = targets.filter(student => {
        const studentInvoices = (invoices || []).filter(inv => String(inv.student_id) === String(student.id));
        return studentInvoices.some(inv => {
          const amount = parseFloat(inv.amount || 0);
          const status = (inv.status || '').toLowerCase().trim();
          if (status === 'paid') return false;
          const paid = (payments || [])
            .filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id))
            .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
          return paid < amount;
        });
      });

      if (targetsWithDebt.length === 0) {
        (window as any).showToast?.('No students with outstanding balances found in selection.', 'info');
        return;
      }

      // Prepare messages
      const messagesToSend = targetsWithDebt.map(student => {
        const studentInvoices = (invoices || []).filter(inv => String(inv.student_id) === String(student.id));
        const totalBilled = studentInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
        const totalPaid = (payments || [])
          .filter((p: any) => String(p.student_id) === String(student.id))
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
        
        const balance = totalBilled - totalPaid;

        const token = btoa(`${student.id}|${organization?.id}`);
        const publicLink = `${window.location.origin}/?view=FeeHistory&token=${token}`;
        
        let message = smsMessageTemplate
          .replace('{{STUDENT_NAME}}', student.name)
          .replace('{{AMOUNT_OWING}}', balance.toLocaleString(undefined, { minimumFractionDigits: 2 }))
          .replace('{{CURRENCY}}', currency)
          .replace('{{SCHOOL_NAME}}', organization?.name || 'the School');

        message += `\nView history: ${publicLink}`;

        return {
          recipient: student.contact || student.secondary_parent_contact || '',
          message: message
        };
      }).filter(m => m.recipient);

      if (messagesToSend.length === 0) {
        (window as any).showToast?.('No contact numbers found for selected students.', 'warning');
        return;
      }

      // Check balance (assuming 1 unit per message for simplicity, or handle more complex on backend)
      const creditsNeeded = messagesToSend.length;
      if ((organization?.sms_balance || 0) < creditsNeeded) {
        (window as any).showToast?.(`Insufficient SMS balance. Need ${creditsNeeded} credits, have ${organization?.sms_balance || 0}.`, 'error');
        return;
      }

      setSmsSending(true);
      try {
        await sendBulkSMS({ messages: messagesToSend });
        (window as any).showToast?.(`Successfully queued ${messagesToSend.length} messages for delivery.`, 'success');
        setIsBulkSMSModalOpen(false);
      } catch (error) {
        console.error('SMS send error:', error);
        (window as any).showToast?.(error, 'error');
      } finally {
        setSmsSending(false);
      }
    };

    const renderFeeAssignmentForm = (item?: any) => {
      const studentOptions = students.map(s => ({
        value: s.id,
        label: s.name,
        sublabel: s.class
      }));

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Student</label>
            <SearchableSelect
              name="student_id"
              options={studentOptions}
              defaultValue={item?.id}
              placeholder="Choose Student..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fee Type</label>
            <select
              name="fee_structure_id"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose Fee...</option>
              {feeStructures.map(f => <option key={f.id} value={f.id}>{f.name} ({currency} {f.amount})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
              <input
                type="text"
                name="academic_year"
                defaultValue={organization?.academic_year || ""}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
              <select
                name="term"
                defaultValue={organization?.current_term || ""}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Term...</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              name="due_date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <input type="hidden" name="target_type" value="students" />
        </div>
      );
    };

    if (selectedStudent) {
      const studentInvoices = (invoices || []).filter(inv => inv.student_id === selectedStudent.id);
      const studentPayments = (payments || []).filter(p => p.student_id === selectedStudent.id);

      return (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Summary
          </button>

          <div className="p-4 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[2.5rem]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white">{selectedStudent.name}</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedStudent.class_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('outstanding_balance')}</p>
                <h3 className={cn(
                  "text-3xl font-black mt-1",
                  parseFloat(selectedStudent.outstanding_amount) > 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {currency} {parseFloat(selectedStudent.outstanding_amount).toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <FileText className="w-4 h-4 text-indigo-600" /> {t('invoices')}
                </h4>
                <div className="space-y-4">
                  {studentInvoices.length > 0 ? studentInvoices.map((inv: any) => {
                    const paidForInvoice = studentPayments
                      .filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id))
                      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
                    const invoiceAmount = parseFloat(inv.amount || 0);
                    const balanceDue = invoiceAmount - paidForInvoice;
                    const computedStatus = paidForInvoice >= invoiceAmount ? 'Paid' : paidForInvoice > 0 ? 'Partial' : 'Pending';

                    return (
                      <div key={inv.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{inv.description || "General Fee"}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase h-fit",
                              computedStatus === 'Paid' ? "bg-emerald-50 text-emerald-600" : computedStatus === 'Partial' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {computedStatus}
                            </span>
                            <button
                              onClick={() => handlePrintInvoice(inv)}
                              className="p-1 px-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              {computedStatus === 'Paid' ? t('print_receipt') : t('print_invoice')}
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700 grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Billed</p>
                            <p className="text-xs font-black text-zinc-800 dark:text-white">{currency}{invoiceAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Paid</p>
                            <p className="text-xs font-black text-emerald-600">{currency}{paidForInvoice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Balance</p>
                            <p className={cn("text-xs font-black", balanceDue > 0 ? "text-rose-600" : "text-emerald-600")}>{currency}{balanceDue.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-zinc-400 py-4">No invoices found</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <History className="w-4 h-4 text-emerald-600" /> {t('payment_history')}
                </h4>
                <div className="space-y-2">
                  {studentPayments.length > 0 ? studentPayments.map((p: any) => (
                    <div key={p.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold text-emerald-600">+ {currency} {parseFloat(p.amount).toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{p.method} • {p.description || "Payment"} • {new Date(p.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.transaction_id && <span className="text-[10px] text-zinc-400 font-mono">#{p.transaction_id}</span>}
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg hover:text-indigo-600 transition-colors"
                          title="Print Receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )) : <p className="text-sm text-zinc-400 py-4">No payments recorded</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Award className="w-4 h-4 text-amber-500" /> {t('scholarships')}
                </h4>
                <div className="space-y-2">
                  {selectedStudent.total_scholarships > 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex justify-between items-center border border-amber-100 dark:border-amber-900/20">
                      <div>
                        <p className="text-sm font-bold text-amber-600">Active Scholarships</p>
                        <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Total Credit Applied</p>
                      </div>
                      <span className="text-sm font-bold text-amber-600">- {currency} {parseFloat(selectedStudent.total_scholarships).toLocaleString()}</span>
                    </div>
                  ) : <p className="text-sm text-zinc-400 py-4">No active scholarships</p>}
                </div>
              </div>
            </div>

          </div>
        </div>
      );
    }

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setIsImporting(true);
        const records = await parseFeeExcel(file, bulkMode, students, feeStructures);
        setImportPreviewItems(records);
      } catch (err) {
        (window as any).showToast?.('Could not read the Excel file. Please check the format and try again.', 'error');
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };

    const confirmBulkOperation = async () => {
      const validRecords = importPreviewItems.filter(r => r.isValid);
      if (validRecords.length === 0) return;

      setIsImporting(true);
      try {
        let successCount = 0;
        for (const record of validRecords) {
          if (bulkMode === 'payment') {
            if (onRecordPayment) {
              await onRecordPayment({
                student_id: record.student_id,
                amount: record.amount,
                method: record.method,
                date: record.date,
                transaction_id: record.transaction_id,
                description: record.description,
                academic_year: organization?.academic_year,
                term: organization?.current_term
              });
              successCount++;
            }
          } else {
            if (onSave) {
              await onSave({
                student_id: record.student_id,
                fee_structure_id: record.fee_structure_id,
                amount: record.amount,
                due_date: record.due_date,
                academic_year: record.academic_year || organization?.academic_year,
                term: record.term || organization?.current_term,
                target_type: 'students'
              });
              successCount++;
            }
          }
        }
        (window as any).showToast?.(`Successfully processed ${successCount} records!`, 'success');
        setImportPreviewItems([]);
        onRefreshTemplates?.(); // Refresh data
      } catch (err) {
        (window as any).showToast?.('Some records failed to process. Please check the imported data.', 'error');
      } finally {
        setIsImporting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-top-4">
          <CardHeaderBackground src={bulkBg} />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Bulk Operations</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Smarter fee management & printing</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex gap-2">
              <button
                onClick={() => setIsBulkPrintModalOpen(true)}
                className="flex items-center gap-2 group px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Bulk Print
              </button>
              <button
                onClick={() => setIsBulkSMSModalOpen(true)}
                className="flex items-center gap-2 group px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
              >
                <MessageSquare className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Send SMS
              </button>
            </div>

            <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setBulkMode('payment')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  bulkMode === 'payment' ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Record Payments
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('invoice')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  bulkMode === 'invoice' ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Bulk Billing
              </button>
            </div>

            <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => downloadFeeTemplate(bulkMode, students, feeStructures)}
                className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-600 transition-colors"
                title="Download current student list as template"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Template
              </button>

              <label className="relative cursor-pointer">
                <input type="file" accept=".xlsx,.xls" onChange={handleFileImport} className="hidden" />
                <div className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none">
                  Upload & Preview
                </div>
              </label>
            </div>
          </div>
        </div>

        <DataTable
          title={t('student_fees_overview')}
          data={data || []}
          onSave={onSave}
          autoViewModal={false}
          columns={[
            { header: 'Student', accessor: 'name', className: 'font-bold' },
            { header: 'Class', accessor: (item: any) => item.status === 'Alumni' ? 'Alumni' : item.class_name },
            { header: 'Total Invoiced', accessor: (item: any) => `${currency} ${parseFloat(item.total_invoiced || 0).toLocaleString()}`, className: 'hidden lg:table-cell' },
            { header: 'Total Paid', accessor: (item: any) => `${currency} ${parseFloat(item.total_paid || 0).toLocaleString()}`, className: 'hidden md:table-cell' },
            { header: 'Scholarships', accessor: (item: any) => `${currency} ${parseFloat(item.total_scholarships || 0).toLocaleString()}`, className: 'hidden lg:table-cell' },
            {
              header: 'Outstanding',
              accessor: (item: any) => (
                <span className={cn(
                  "font-bold",
                  parseFloat(item.outstanding_amount) > 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {currency} {parseFloat(item.outstanding_amount || 0).toLocaleString()}
                </span>
              )
            },
          ]}
          onAdd={onSave ? () => { } : undefined}
          renderForm={renderFeeAssignmentForm}
          extraActions={(item) => (
            <button
              onClick={() => setSelectedStudent(item)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              {t('view_breakdown')}
            </button>
          )}
        />

        <Modal
          isOpen={!!paymentModalData}
          onClose={() => setPaymentModalData(null)}
          title={t('record_payment')}
        >
          <form className="space-y-4 p-6" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            if (onRecordPayment) {
              onRecordPayment({
                student_id: selectedStudent?.id,
                invoice_id: paymentModalData?.id,
                amount: formData.get('amount'),
                method: formData.get('method'),
                date: formData.get('date'),
                transaction_id: formData.get('transaction_id'),
                description: paymentModalData?.description || 'Fees Payment',
                term: formData.get('term'),
                academic_year: formData.get('academic_year')
              });
              setPaymentModalData(null);
            }
          }}>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 mb-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Paying For</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{paymentModalData?.description || 'School Fee'}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-zinc-500">Invoice Amount: {currency} {parseFloat(paymentModalData?.amount || 0).toLocaleString()}</p>
              </div>
              {(() => {
                const invoiceLinkedPaid = (payments || [])
                  .filter((p: any) =>
                    (p.invoice_id && String(p.invoice_id) === String(paymentModalData?.id)) ||
                    (p.invoiceId && String(p.invoiceId) === String(paymentModalData?.id))
                  )
                  .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

                const unlinkedPaid = (payments || [])
                  .filter((p: any) =>
                    !p.invoice_id && !p.invoiceId &&
                    String(p.student_id) === String(paymentModalData?.student_id)
                  )
                  .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

                const alreadyPaid = invoiceLinkedPaid + unlinkedPaid;
                const balance = parseFloat(paymentModalData?.amount || 0) - alreadyPaid;

                return (
                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
                    <div className="flex justify-between items-center text-emerald-600">
                      <p className="text-[10px] font-bold uppercase tracking-wider">Already Paid</p>
                      <p className="text-xs font-black font-serif">{currency} {alreadyPaid.toLocaleString()}</p>
                    </div>
                    {unlinkedPaid > 0 && (
                      <p className="text-[9px] text-zinc-400 italic">Includes {currency} {unlinkedPaid.toLocaleString()} unallocated student payments</p>
                    )}
                    <div className="flex justify-between items-center text-rose-600">
                      <p className="text-[10px] font-bold uppercase tracking-wider">Balance Due</p>
                      <p className="text-xs font-black font-serif">{currency} {balance.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount Paying ({currency})</label>
              <input type="number" name="amount" defaultValue={paymentModalData?.amount} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
              <select name="method" defaultValue="Cash" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
              <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                <input type="text" name="academic_year" defaultValue={paymentModalData?.academic_year || organization?.academic_year} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                <input type="text" name="term" defaultValue={paymentModalData?.term || organization?.current_term} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transaction ID (Optional)</label>
              <input type="text" name="transaction_id" placeholder="Optional" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setPaymentModalData(null)} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none">Record Payment</button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isBulkPrintModalOpen}
          onClose={() => setIsBulkPrintModalOpen(false)}
          title="Bulk Print Invoices"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Print Configuration</p>
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'class', 'selected'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBulkPrintConfig(prev => ({ ...prev, mode }))}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      bulkPrintConfig.mode === mode
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                    )}
                  >
                    {mode === 'all' ? 'All Students' : mode === 'class' ? 'By Class' : 'Selected'}
                  </button>
                ))}
              </div>
            </div>

            {bulkPrintConfig.mode === 'class' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Class</label>
                <select
                  value={bulkPrintConfig.targetClass}
                  onChange={(e) => setBulkPrintConfig(prev => ({ ...prev, targetClass: e.target.value }))}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose Class...</option>
                  {Array.from(new Set((data || []).map(s => s.class_name))).filter(Boolean).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {bulkPrintConfig.mode === 'selected' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Students</label>
                <SearchableSelect
                  multiple
                  name="bulk_students"
                  placeholder="Search and select students..."
                  options={(data || []).map(s => ({ value: s.id, label: s.name, sublabel: s.class_name }))}
                  defaultValue={bulkPrintConfig.selectedStudents}
                  onValueChange={(val) => setBulkPrintConfig(prev => ({ ...prev, selectedStudents: val as string[] }))}
                />
              </div>
            )}

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This will generate a single printable document with one invoice per page for the selected students. The most recent invoice for each student will be included.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsBulkPrintModalOpen(false)}
                className="flex-1 py-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPrint}
                className="flex-[2] bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Generate Bulk Invoices
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isBulkSMSModalOpen}
          onClose={() => setIsBulkSMSModalOpen(false)}
          title="Send Bulk SMS Notifications"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="p-4 sm:p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl sm:rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Available Balance</p>
                  <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-none mt-1">{organization?.sms_balance || 0} Credits</p>
                </div>
              </div>
              <button 
                className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
                onClick={() => {
                  setIsBulkSMSModalOpen(false);
                  onNavigate?.('Dashboard');
                }}
              >
                Top Up
              </button>
            </div>

            <div className="space-y-4 p-2">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Recipient Group</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['all', 'class', 'selected'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setBulkPrintConfig(prev => ({ ...prev, mode }))}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        bulkPrintConfig.mode === mode
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100"
                          : "bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-emerald-300"
                      )}
                    >
                      {mode === 'all' ? 'All Debtors' : mode === 'class' ? 'By Class' : 'Selected'}
                    </button>
                  ))}
                </div>
              </div>

              {bulkPrintConfig.mode === 'class' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Class</label>
                  <select
                    value={bulkPrintConfig.targetClass}
                    onChange={(e) => setBulkPrintConfig(prev => ({ ...prev, targetClass: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Choose Class...</option>
                    {Array.from(new Set((data || []).map(s => s.class_name))).filter(Boolean).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {bulkPrintConfig.mode === 'selected' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Students</label>
                  <SearchableSelect
                    multiple
                    name="bulk_sms_students"
                    placeholder="Search and select students..."
                    options={(data || []).map(s => ({ value: s.id, label: s.name, sublabel: s.class_name }))}
                    defaultValue={bulkPrintConfig.selectedStudents}
                    onValueChange={(val) => setBulkPrintConfig(prev => ({ ...prev, selectedStudents: val as string[] }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex justify-between">
                  <span>Message Template</span>
                  <span className="text-[10px] text-zinc-400 normal-case italic">Use {'{{STUDENT_NAME}}'}, {'{{AMOUNT_OWING}}'}</span>
                </label>
                <textarea
                  value={smsMessageTemplate}
                  onChange={(e) => setSmsMessageTemplate(e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                  placeholder="Type your message here..."
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleBulkSMS}
                disabled={smsSending}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {smsSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Messages...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Broadcast SMS Notifications
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-zinc-400 mt-4 font-bold uppercase tracking-widest">
                Each message consumes 1 unit per 160 characters
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={importPreviewItems.length > 0}
          onClose={() => setImportPreviewItems([])}
          title={bulkMode === 'payment' ? "Review Payment Upload" : "Review Bulk Billing"}
          maxWidth="max-w-5xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Verify Records</p>
                <p className="text-[10px] font-bold text-indigo-700/70 dark:text-indigo-400">Total {importPreviewItems.length} records detected. Rows with errors will be skipped.</p>
              </div>
            </div>

            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Student</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">{bulkMode === 'payment' ? 'Amount' : 'Fee Type'}</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Identification</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {importPreviewItems.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-bold">{item.student_name}</td>
                      <td className="px-4 py-3">
                        {bulkMode === 'payment' ? (
                          <span className="text-emerald-600 font-bold">{currency} {item.amount}</span>
                        ) : (
                          <span className="font-bold">{item.fee_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.student_id ? (
                          <span className="text-zinc-600 dark:text-zinc-400">ID: {item.admission_no}</span>
                        ) : (
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Unknown Admission No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.isValid ? (
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Ready</span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Invalid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setImportPreviewItems([])}
                className="flex-1 py-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkOperation}
                className="flex-[2] bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
                disabled={isImporting || !importPreviewItems.some(s => s.isValid)}
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                Confirm & Process {importPreviewItems.filter(s => s.isValid).length} Records
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
  DailyCollections: ({ students, data, invoices, onSave, onDelete, organization, documentTemplates, onRefreshTemplates }: { students: Student[], data?: any[], invoices?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, organization?: any, documentTemplates?: any[], onRefreshTemplates?: () => Promise<void> }) => {
    const { t, currency } = useLanguage();
    const activeStudents = students.filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn');
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const renderCollectionForm = (item?: any) => {
      const studentOptions = [
        { value: '', label: 'Unallocated / Standalone Collection', sublabel: 'General' },
        ...activeStudents.map(s => ({
          value: s.id,
          label: s.name,
          sublabel: s.class
        }))
      ];

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</label>
            <SearchableSelect
              name="student_id"
              options={studentOptions}
              defaultValue={item?.student_id}
              placeholder="Select Student..."
              onValueChange={(val) => {
                // Trigger refresh or state update if needed for invoice selection
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Allocated To (Invoice)</label>
            <select
              name="invoice_id"
              defaultValue={item?.invoice_id}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unallocated Collection</option>
              {item?.student_id && (invoices || []).filter((inv: any) => inv.student_id === item.student_id).map((inv: any) => (
                <option key={inv.id} value={inv.id}>{inv.description} ({currency} {inv.amount})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description / Source</label>
            <input
              type="text"
              name="description"
              defaultValue={item?.description}
              placeholder="e.g. Sunday Offering, Donation"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={item?.date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Method</label>
              <select
                name="method"
                defaultValue={item?.method || "Cash"}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</label>
              <input
                type="number"
                name="amount"
                defaultValue={item?.amount}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transaction ID</label>
              <input
                type="text"
                name="transaction_id"
                defaultValue={item?.transaction_id}
                placeholder="Optional"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>
      );
    };

    const handlePrint = (receipt: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printHtml = `
            <html>
              <head>
                <title>Receipt - ${receipt.transaction_id || receipt.id.split('-')[0].toUpperCase()}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                  body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
                  .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                  .school-info h2 { margin: 0 0 4px 0; font-weight: 800; font-size: 24px; color: #1e1b4b; }
                  .school-info p { margin: 0; color: #64748b; font-size: 14px; }
                  .receipt-title { text-align: right; }
                  .receipt-title h1 { margin: 0; font-size: 36px; font-weight: 800; color: #e2e8f0; letter-spacing: 2px; text-transform: uppercase; }
                  .receipt-title p { margin: 8px 0 0 0; font-size: 14px; color: #475569; font-weight: 600; }
                  .status-badge { display: inline-block; padding: 6px 12px; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-top: 8px; border: 1px solid #bbf7d0; }
                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                  .info-block label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
                  .info-block p { margin: 0; font-size: 15px; font-weight: 600; color: #1e293b; }
                  .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                  .table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
                  .table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }
                  .table tr:last-child td { border-bottom: none; }
                  .amount-row { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; background: #f8fafc; border-radius: 12px; margin-top: 32px; border: 1px solid #e2e8f0; }
                  .amount-row .label { font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                  .amount-row .value { font-size: 28px; font-weight: 800; color: #4f46e5; }
                  .footer { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
                  .signature-box { text-align: center; }
                  .signature-line { width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
                  .signature-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
                  .thank-you { font-size: 14px; color: #64748b; font-style: italic; }
                </style>
              </head>
              <body>
                <div class="receipt-container">
                  <div class="header">
                    <div class="school-info">
                      ${organization?.logo ? `<img src="${organization.logo}" style="max-height: 48px; margin-bottom: 12px;" />` : ''}
                      <h2>${organization?.name || 'School Name'}</h2>
                      <p>${organization?.address || 'School Address'}</p>
                    </div>
                    <div class="receipt-title">
                      <h1>RECEIPT</h1>
                      <p>#${receipt.transaction_id || receipt.id.split('-')[0].toUpperCase()}</p>
                      <div class="status-badge">PAID IN FULL</div>
                    </div>
                  </div>
                  <div class="info-grid">
                    <div class="info-block">
                      <label>Billed To</label>
                      <p>${receipt.student_name}</p>
                      <p style="font-size: 13px; color: #64748b; font-weight: 400; margin-top: 2px;">Class: ${receipt.class_name}</p>
                    </div>
                    <div class="info-block" style="text-align: right;">
                      <label>Payment Date</label>
                      <p>${new Date(receipt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <label style="margin-top: 12px;">Academic Year / Term</label>
                      <p>${receipt.academic_year || organization?.academic_year || 'N/A'} - ${receipt.term || organization?.current_term || 'N/A'}</p>
                      <label style="margin-top: 12px;">Payment Method</label>
                      <p>${receipt.method}</p>
                    </div>
                  </div>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong style="color: #1e293b;">${receipt.description || 'School Fees Payment'}</strong>
                        </td>
                        <td style="text-align: right; font-weight: 600; color: #334155;">${currency} ${parseFloat(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="amount-row">
                    <div class="label">Total Paid</div>
                    <div class="value">${currency} ${parseFloat(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div class="footer">
                    <div class="thank-you">Thank you for your payment!</div>
                    <div class="signature-box">
                      ${organization?.signature ? `<img src="${organization.signature}" style="max-height: 48px; margin-bottom: 8px;" />` : '<div style="height: 48px;"></div>'}
                      <div class="signature-line"></div>
                      <div class="signature-label">Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.print();
      }
    };

    return (
      <div className="space-y-6">
        <DataTable
          title={t('daily_collections')}
          data={data || []}
          onSave={onSave}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.student_name || 'Walk-in Collection'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {item.method}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Collection Amount</p>
                  <p className="text-2xl font-black text-emerald-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Status</p>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase">
                    {item.status || 'Received'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Transaction ID</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-black font-mono">#{item.transaction_id || 'N/A'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Reference</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-medium">{String(item.id || '').substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}
          onEdit={(item) => { }}
          columns={[
            { header: 'Source/Student', accessor: (item: any) => item.student_name || 'Walk-in / General', className: 'font-bold' },
            { header: 'Description', accessor: (item: any) => item.description || 'Collection' },
            { header: `Amount (${currency})`, accessor: 'amount' },
            { header: 'Date', accessor: (item: any) => new Date(item.date).toLocaleDateString() },
            { header: 'Method', accessor: 'method' },
            {
              header: 'Status',
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>
                  {item.status || 'Received'}
                </span>
              )
            },
          ]}
          onAdd={onSave ? () => { } : undefined}
          renderForm={renderCollectionForm}
          extraActions={(item) => (
            <button
              onClick={() => handlePrint(item)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Print Receipt
            </button>
          )}
        />
      </div>
    );
  },
  Stocks: ({ students = [], data = [], requests = [], onSave, onDelete, onSaveRequest, onDeleteRequest }: { students?: Student[], data?: any[], requests?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onSaveRequest?: (data: any) => void, onDeleteRequest?: (item: any) => void }) => {
    const { t, currency } = useLanguage();
    const activeStudents = students.filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn');


    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          {requests.filter(r => r.status === 'Pending').length > 0 && (
            <button
              onClick={async () => {
                if (!confirm(`Are you sure you want to approve all ${requests.filter(r => r.status === 'Pending').length} pending requests? This will also generate invoices for each.`)) return;
                const pending = requests.filter(r => r.status === 'Pending');
                let successCount = 0;
                for (const req of pending) {
                  try {
                    await onSaveRequest?.({ ...req, status: 'Approved' });
                    successCount++;
                  } catch (err) {
                    console.error("Failed to approve request in bulk:", err);
                  }
                }
                (window as any).showToast?.(`Successfully approved ${successCount} requests!`, 'success');
              }}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve All Pending ({requests.filter(r => r.status === 'Pending').length})
            </button>
          )}
        </div>

        <DataTable
            title="Purchase Requests"
            data={requests || []}
            onDelete={onDeleteRequest}
            onSave={onSaveRequest}
            onAdd={() => {}}
            renderDetails={(item) => {
              const student = students.find(s => String(s.id) === String(item.student_id));
              const stockItem = data.find(d => d.item_name === item.item_name);
              const isPending = item.status === 'Pending';
              const isApproved = item.status === 'Approved';
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.item_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          isApproved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        )}>
                          {item.status || 'Pending'}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Purchase Request</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Requested By</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{student?.name || 'Unknown Student'}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">{student?.class || 'N/A'} {student?.section || ''}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Request Date</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">
                        {item.created_at || item.date ? new Date(item.created_at || item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Item Ordered</p>
                      <p className="text-lg font-black text-indigo-600">{item.item_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Quantity</p>
                      <p className="text-lg font-black text-zinc-900 dark:text-white">{item.quantity || 1}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Unit Price</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{currency}{Number(stockItem?.price || item.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Total Price</p>
                      <p className="text-lg font-black text-indigo-700 dark:text-indigo-400">{currency}{Number(item.total_price || item.price || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {item.id && (
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest text-center">
                        Reference: #{String(item.id).substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              );
            }}
            renderForm={(item, isViewOnly) => (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select Student</label>
                  <select 
                    name="student_id" 
                    defaultValue={item?.student_id} 
                    disabled={isViewOnly} 
                    required 
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Student...</option>
                    {(activeStudents || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.class} {s.section})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Item Name</label>
                    <select 
                      name="item_name" 
                      defaultValue={item?.item_name} 
                      disabled={isViewOnly} 
                      required 
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Item...</option>
                      {(data || []).map(i => (
                        <option key={i.id} value={i.item_name}>{i.item_name} ({currency}{i.price})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Quantity</label>
                    <input 
                      type="number" 
                      name="quantity" 
                      defaultValue={item?.quantity || 1} 
                      min="1"
                      disabled={isViewOnly} 
                      required 
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {!item?.id && (
                   <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                     <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Note</p>
                     <p className="text-xs text-zinc-500 mt-1 italic">Adding a request as an admin will set it to 'Pending' status by default. You can approve it immediately after creation to generate an invoice.</p>
                   </div>
                )}
              </div>
            )}
            columns={[
              { header: 'Date', accessor: (item: any) => new Date(item.created_at || item.date).toLocaleDateString() },
              { header: 'Student', accessor: (item: any) => {
                const student = students.find(s => String(s.id) === String(item.student_id));
                return (
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">{student?.name || 'Unknown Student'}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{student?.class || 'N/A'}</p>
                  </div>
                );
              }},
              { header: 'Item Ordered', accessor: (item: any) => (
                <div>
                  <p className="font-bold text-indigo-600">{item.item_name}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Qty: {item.quantity || 1}</p>
                </div>
              )},
              { header: 'Status', accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    item.status === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    item.status === 'Approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  )}>
                    {item.status || 'Pending'}
                  </span>
                  {item.status === 'Pending' && onSaveRequest && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Approve this request and fulfill order?')) return;
                          try {
                            await onSaveRequest({ ...item, status: 'Approved' });
                            (window as any).showToast?.('Request approved and fulfilled!', 'success');
                          } catch (err) {
                            (window as any).showToast?.(err, 'error');
                          }
                        }}
                        className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                        title="Approve & Fulfill"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Reject this request?')) return;
                          try {
                            await onSaveRequest({ ...item, status: 'Rejected' });
                            (window as any).showToast?.('Request rejected', 'info');
                          } catch (err) {
                            (window as any).showToast?.(err, 'error');
                          }
                        }}
                        className="p-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition-colors shadow-lg shadow-rose-500/20"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )},
              { header: 'Total Price', accessor: (item: any) => `${currency} ${(parseFloat(item.total_price || item.price) || 0).toLocaleString()}` },
            ]}
          />
      </div>
    );
  },

  InvoicesPayments: ({ role, students, wards, selectedWardId: propSelectedWardId, data, payments, feeStructures, inventoryItems = [], organization, onSave, onDelete, onRecordPayment, onWardSelect, canEdit, canDelete }: { role?: UserRole, students?: Student[], wards?: any[], selectedWardId?: string, data?: any[], payments?: any[], feeStructures?: any[], inventoryItems?: any[], organization?: any, onSave?: (data: any) => void, onDelete?: (item: any) => void, onRecordPayment?: (data: any) => void, onWardSelect?: (id: string) => void, canEdit?: (item: any) => boolean, canDelete?: (item: any) => boolean }) => {
    const { t, currency } = useLanguage();
    const [localSelectedWardId, setLocalSelectedWardId] = useState("");
    
    // Sync with prop if provided
    useEffect(() => {
      if (propSelectedWardId) setLocalSelectedWardId(propSelectedWardId);
      else if (wards && wards.length > 0) setLocalSelectedWardId(wards[0].id);
    }, [propSelectedWardId, wards]);

    const selectedWardId = propSelectedWardId || localSelectedWardId;
    const [paymentModalData, setPaymentModalData] = useState<any>(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

    const filteredData = role === 'PARENT' ? (data || []).filter(d => (d.student_id || d.studentId) === selectedWardId) : (data || []);

    const groupedByStudent = useMemo(() => {
      const map = new Map();
      filteredData.forEach((inv: any) => {
        const studentId = inv.student_id;
        if (!studentId) return;
        if (!map.has(studentId)) {
          map.set(studentId, {
            student_id: studentId,
            student_name: inv.student_name,
            invoices: [],
            totalBilled: 0,
            id: studentId
          });
        }
        const student = map.get(studentId);
        student.invoices.push(inv);
        student.totalBilled += parseFloat(inv.amount || 0);
      });

      return Array.from(map.values()).map((student: any) => {
        const totalPaid = (payments || [])
          .filter((p: any) => {
            const hasInv = p.invoice_id || p.invoiceId;
            return hasInv && student.invoices.some((i: any) => String(i.id) === String(hasInv));
          })
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
        
        // Also consider invoices marked as 'Paid' but without explicit receipt records
        const implicitPaid = student.invoices
          .filter((inv: any) => {
            const isMarkedPaid = inv.status && inv.status.toLowerCase().trim() === 'paid';
            if (!isMarkedPaid) return false;
            // Check if it already has matching payments to avoid double counting
            const alreadyHasPayment = (payments || []).some(p => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id));
            return !alreadyHasPayment;
          })
          .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0);

        student.totalPaid = totalPaid + implicitPaid;
        student.balanceOwing = Math.max(0, student.totalBilled - student.totalPaid);
        return student;
      });
    }, [filteredData, payments]);

    const handlePrintInvoice = (invoice: any, studentOverride?: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const invoiceHtml = getInvoiceHtml(invoice, studentOverride, organization, currency, payments || []);
        
        printWindow.document.write(`
          <html>
            <head>
              <title>${invoice.id?.split('-')[0].toUpperCase() || 'INVOICE'}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
              <style>
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
                .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; margin-bottom: 40px; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                .school-info h2 { margin: 0 0 4px 0; font-weight: 800; font-size: 24px; color: #1e1b4b; }
                .school-info p { margin: 0; color: #64748b; font-size: 14px; }
                .receipt-title { text-align: right; }
                .receipt-title h1 { margin: 0; font-size: 36px; font-weight: 800; color: #e2e8f0; letter-spacing: 2px; text-transform: uppercase; }
                .receipt-title p { margin: 8px 0 0 0; font-size: 14px; color: #475569; font-weight: 600; }
                .status-badge { display: inline-block; padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-top: 8px; border: 1px solid #fde68a; }
                .footer { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
                .signature-box { text-align: center; }
                .signature-line { width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
                .signature-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
                .thank-you { font-size: 14px; color: #64748b; font-style: italic; }
              </style>
            </head>
            <body>
              ${invoiceHtml}
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };

    const handlePrintReceipt = (item: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const receiptHtml = getReceiptHtml(item, null, organization, currency);
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${item.transaction_id || item.id}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
              <style>
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
                .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
              </style>
            </head>
            <body>
              ${receiptHtml}
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };

    const InvoiceFormContent = ({ item, isViewOnly }: any) => {
      const [selectedFee, setSelectedFee] = useState<any>(null);
      const [selectedDebt, setSelectedDebt] = useState<any>(null);
      const [selectedStudent, setSelectedStudent] = useState<any>(null);

      useEffect(() => {
        if (item?.student_id) {
          const student = (students || []).find(s => s.id === item.student_id);
          setSelectedStudent(student || null);
        }
      }, [item]);

      const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const student = (students || []).find(s => s.id === e.target.value);
        setSelectedStudent(student || null);
        setSelectedDebt(null);
        setSelectedFee(null);
      };

      const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val.startsWith('debt_')) {
          const debtId = val.replace('debt_', '');
          const debt = (data || []).find(d => String(d.id) === String(debtId));
          setSelectedDebt(debt || null);
          setSelectedFee(null);
          setSelectedFee({ name: debt?.invoice_description, amount: debt?.amount }); // Temporary to trigger UI update
        } else if (val.startsWith('stock_')) {
          const stockId = val.replace('stock_', '');
          const item = (inventoryItems || []).find(i => String(i.id) === String(stockId));
          setSelectedFee({ name: item?.item_name, amount: item?.price });
          setSelectedDebt(null);
        } else {
          const fee = (feeStructures || []).find(f => f.id === val);
          setSelectedFee(fee || null);
          setSelectedDebt(null);
        }
      };

      const studentPendingDebts = selectedStudent
        ? (data || []).filter(inv => {
          const studentIdMatch = String(inv.student_id) === String(selectedStudent.id);
          const statusMatch = String(inv.status).toLowerCase().trim() === 'pending';
          return studentIdMatch && statusMatch;
        })
        : [];

      if (isViewOnly && item) {
        const isPaid = item.status === 'Paid' || item.status === 'Completed';
        return (
          <div className="space-y-8 p-4">
            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-6">
              <div>
                <h1 className="text-2xl font-black text-indigo-600 tracking-tight uppercase">
                  {isPaid ? 'Official Receipt' : 'Invoice'}
                </h1>
                <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-widest">
                  ID: {item.id ? String(item.id).substring(0, 8).toUpperCase() : 'N/A'}
                </p>
              </div>
              <div className={cn(
                "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                isPaid ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"
              )}>
                {item.status}
              </div>
            </div>

            {/* Document Body */}
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">{t('billed_to')}</label>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">{item.student_name}</p>
                  <p className="text-sm text-zinc-500 font-medium">Class: {item.student_class || 'N/A'}</p>
                  <p className="text-sm text-zinc-500 font-medium">Admission No: {item.student_admission_no || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">{t('description')}</label>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.invoice_description}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Issue Date</label>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Due Date</label>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Payment Method</label>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.payment_method || 'N/A'}</p>
                  {item.payment_reference && (
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">Ref: {item.payment_reference}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-sm font-black text-zinc-500 uppercase tracking-wider">Total Amount</span>
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{currency} {item.amount}</span>
            </div>

            {/* Footer / Actions */}
            <div className="flex justify-between items-center pt-4">
              <p className="text-[10px] text-zinc-400 italic">This is an official document of the school.</p>
              <button
                type="button"
                onClick={() => handlePrintReceipt(item)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Print Document
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</label>
            <select
              name="student_id"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              defaultValue={item?.student_id || ""}
              onChange={handleStudentChange}
            >
              <option value="">Select Student...</option>
              {((students || []).filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn')).map(s => <option key={s.id} value={s.id}>{s.name} — {s.class || "No Class"}</option>)}
            </select>
          </div>

          {selectedStudent && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Student Info</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-white mt-0.5">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Class</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-white mt-0.5">{selectedStudent.class || "N/A"}</p>
                </div>
                {studentPendingDebts.length > 0 && (
                  <div className="ml-auto text-right">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pending Items</p>
                    <p className="text-sm font-black text-rose-600 mt-0.5">{studentPendingDebts.length} Unpaid</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Item Paying For</label>
            <select
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={handleItemChange}
              defaultValue=""
            >
              <option value="">Choose item / specific debt...</option>
              {studentPendingDebts.length > 0 && (
                <optgroup label="Pending Invoices / Inventory Debts">
                  {studentPendingDebts.map(d => (
                    <option key={d.id} value={`debt_${d.id}`}>
                      {d.invoice_description || 'Unnamed Debt'} — {currency} {d.amount}
                    </option>
                  ))}
                </optgroup>
              )}
               <optgroup label="Standard Fees Structures">
                {(feeStructures || []).map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {currency} {f.amount}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Stocks / Inventory Items">
                {(inventoryItems || []).map(i => (
                  <option key={`stock_${i.id}`} value={`stock_${i.id}`}>
                    {i.item_name} {i.size ? `(${i.size})` : ''} — {currency} {i.price} (Stock: {i.quantity || i.stock || 0})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
              <input
                type="text"
                name="academic_year"
                placeholder="e.g. 2023/2024"
                defaultValue={item?.academic_year || organization?.academic_year || ""}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
              <select
                name="term"
                defaultValue={item?.term || organization?.current_term || ""}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Term (Optional)</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
            <input
              type="text"
              name="description"
              placeholder="e.g. Tuition Fee - Term 1"
              defaultValue={item?.invoice_description || selectedDebt?.invoice_description || selectedFee?.name || ""}
              key={`${selectedDebt?.id}-${selectedFee?.id}`}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount ({currency})</label>
              <input
                type="number"
                name="amount"
                defaultValue={selectedDebt?.amount || selectedFee?.amount || item?.amount}
                key={`amount-${selectedDebt?.id}-${selectedFee?.id}`}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                name="due_date"
                defaultValue={selectedDebt?.due_date ? new Date(selectedDebt.due_date).toISOString().split('T')[0] : (item?.due_date ? new Date(item.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">Payment Recording</label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
                <select
                  name="payment_method"
                  className="w-full px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  defaultValue="Cash"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reference / ID</label>
                <input
                  type="text"
                  name="payment_reference"
                  placeholder="Optional"
                  className="w-full px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
              <select
                name="status"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue={item?.status || "Paid"}
              >
                <option value="Pending">Pending / Invoiced Only</option>
                <option value="Paid">Mark as Paid Immediately</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <input type="hidden" name="id" value={selectedDebt?.id || item?.id || ""} />
        </div>
      );
    };

    const renderInvoiceForm = (item?: any, isViewOnly?: boolean) => <InvoiceFormContent item={item} isViewOnly={isViewOnly} />;

    if (role === 'PARENT') {
      const ward = groupedByStudent.find(s => String(s.id) === String(selectedWardId)) || groupedByStudent[0];
      const wardPayments = (payments || []).filter(p => {
        const invId = p.invoice_id || p.invoiceId;
        return invId && (filteredData || []).some(inv => String(inv.id) === String(invId));
      });

      return (
        <div className="space-y-8">
          {wards && wards.length > 1 && (
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 w-fit shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Ward</span>
                <select
                  value={selectedWardId}
                  onChange={(e) => {
                    setLocalSelectedWardId(e.target.value);
                    onWardSelect?.(e.target.value);
                  }}
                  className="bg-transparent text-sm font-bold outline-none pr-6 cursor-pointer text-zinc-900 dark:text-white"
                >
                  {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {ward ? (
            <div className="space-y-8">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-4">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Amount Billed</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{currency} {ward.totalBilled.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Amount Paid</p>
                  <p className="text-3xl font-black text-emerald-600 tracking-tight">{currency} {ward.totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-zinc-900 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rose-400 mb-4">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Remaining Balance</p>
                    <p className="text-3xl font-black text-white tracking-tight">{currency} {ward.balanceOwing.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                  Outstanding Invoices
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ward.invoices.map((inv: any) => {
                    const paid = (payments || []).filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id)).reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
                    const isMarkedPaid = inv.status && inv.status.toLowerCase().trim() === 'paid';
                    const bal = isMarkedPaid ? 0 : Math.max(0, parseFloat(inv.amount || 0) - paid);
                    const isFullyPaid = bal <= 0 || isMarkedPaid;

                    return (
                      <div key={inv.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 inline-block">
                              ID: {String(inv.id).substring(0, 8).toUpperCase()}
                            </span>
                            <h4 className="text-lg font-black text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {inv.invoice_description || 'General Fees'}
                            </h4>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            isFullyPaid ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {isFullyPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Amount</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{currency}{parseFloat(inv.amount || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Due Date</p>
                            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {!isFullyPaid && (
                          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Balance Due</p>
                              <p className="text-lg font-black text-rose-600">{currency}{bal.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Payments */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-emerald-600 rounded-full"></div>
                  Payment History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wardPayments.length > 0 ? wardPayments.map((p: any, i: number) => (
                    <div key={i} className="p-5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-zinc-900 dark:text-white">{currency}{parseFloat(p.amount || 0).toLocaleString()}</p>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(p.payment_date || p.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{p.description || 'Fees Payment'}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 tracking-widest">{p.payment_method || 'Payment'}</p>
                      </div>
                      <button 
                        onClick={() => handlePrintReceipt(p)}
                        className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
                        title="Download Receipt"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-full py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-300">
                        <DollarSign className="w-8 h-8" />
                      </div>
                      <p className="text-zinc-500 font-medium">No payment history found yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-400">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No Billing Records</h3>
              <p className="text-zinc-500 mt-2">We couldn't find any invoice or payment history for this student.</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {wards && wards.length > 1 && (
          <div className="flex items-center gap-2 mb-4 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
            <span className="text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Ward:</span>
            <select
              value={selectedWardId}
              onChange={(e) => {
                setLocalSelectedWardId(e.target.value);
                onWardSelect?.(e.target.value);
              }}
              className="bg-transparent text-sm font-bold outline-none pr-4"
            >
              {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <DataTable
          title={t('invoices_and_payments')}
          data={groupedByStudent}
          onSave={onSave}
          onDelete={undefined}
          canEdit={canEdit}
          canDelete={canDelete}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-none">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.student_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-600">
                      Client Profile
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Billed</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">{currency}{item.totalBilled.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Paid</p>
                  <p className="text-xl font-black text-emerald-600">{currency}{item.totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Balance</p>
                  <p className="text-xl font-black text-rose-600">{currency}{item.balanceOwing.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-bold mb-3 uppercase text-zinc-500">Invoices Breakdown</h4>
                <div className="space-y-2">
                  {item.invoices.map((inv: any) => {
                    const paid = (payments || []).filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id)).reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
                    const bal = parseFloat(inv.amount || 0) - paid;
                    return (
                      <div key={inv.id} className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-zinc-900 dark:text-white">{inv.invoice_description || 'General Fees'}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Billed: {currency}{parseFloat(inv.amount || 0).toLocaleString()} • Due: {currency}{bal.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            bal <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {bal <= 0 ? 'Paid' : 'Pending'}
                          </span>
                          <button
                            onClick={() => handlePrintInvoice(inv, item)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Print Invoice/Receipt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          onEdit={(role === 'STUDENT') ? undefined : (item) => { }}
          columns={[
            { header: 'Student Name', accessor: 'student_name', className: 'font-bold' },
            { header: `Total Billed`, accessor: (item: any) => `${currency} ${item.totalBilled.toLocaleString()}` },
            { header: `Total Paid`, accessor: (item: any) => `${currency} ${item.totalPaid.toLocaleString()}` },
            {
              header: `Balance Owing`,
              accessor: (item: any) => <span className={item.balanceOwing > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>{currency} {item.balanceOwing.toLocaleString()}</span>
            },
            {
              header: 'Status',
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.balanceOwing <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                )}>
                  {item.balanceOwing <= 0 ? 'Full Paid' : 'Pending'}
                </span>
              )
            },
          ]}
          onAdd={onSave ? () => { } : undefined}
          renderForm={renderInvoiceForm}
          extraActions={(item) => (
            <div className="flex gap-2">
              {item.balanceOwing > 0 && onRecordPayment && (
                <button
                  onClick={() => {
                    setPaymentModalData(item);
                    setSelectedInvoiceId("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                  title="Make Payment"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Pay</span>
                </button>
              )}
            </div>
          )}
        />

        <Modal
          isOpen={!!paymentModalData}
          onClose={() => {
            setPaymentModalData(null);
            setSelectedInvoiceId("");
          }}
          title={t('record_payment')}
        >
          <form className="space-y-4 p-6" onSubmit={(e) => {
            e.preventDefault();
            if (!selectedInvoiceId) return;
            const formData = new FormData(e.currentTarget);
            if (onRecordPayment) {
              const inv = paymentModalData?.invoices?.find((i: any) => String(i.id) === String(selectedInvoiceId));
              onRecordPayment({
                student_id: paymentModalData?.student_id,
                invoice_id: selectedInvoiceId,
                amount: formData.get('amount'),
                method: formData.get('method'),
                date: formData.get('date'),
                transaction_id: formData.get('transaction_id'),
                description: inv?.invoice_description || 'Fees Payment',
                term: formData.get('term'),
                academic_year: formData.get('academic_year')
              });
              setPaymentModalData(null);
              setSelectedInvoiceId("");
            }
          }}>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 mb-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Client: {paymentModalData?.student_name}</p>

              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Select Invoice to Pay</label>
                  <select
                    name="invoice_id"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Pending Invoice --</option>
                    {paymentModalData?.invoices.map((inv: any) => {
                      const paid = (payments || []).filter((p: any) => String(p.invoice_id) === String(inv.id) || String(p.invoiceId) === String(inv.id)).reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
                      const bal = parseFloat(inv.amount || 0) - paid;
                      if (bal > 0) {
                        return <option key={inv.id} value={inv.id}>{inv.invoice_description} - Bal: {currency}{bal}</option>;
                      }
                      return null;
                    })}
                  </select>
                </div>

                {(() => {
                  if (!selectedInvoiceId) return null;
                  const inv = paymentModalData?.invoices.find((i: any) => String(i.id) === String(selectedInvoiceId));
                  if (!inv) return null;

                  const invoiceLinkedPaid = (payments || [])
                    .filter((p: any) =>
                      (p.invoice_id && String(p.invoice_id) === String(inv.id)) ||
                      (p.invoiceId && String(p.invoiceId) === String(inv.id))
                    )
                    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

                  const balance = parseFloat(inv.amount || 0) - invoiceLinkedPaid;

                  return (
                    <div className="space-y-1 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center text-zinc-600">
                        <p className="text-[10px] font-bold uppercase tracking-wider">Total Billed</p>
                        <p className="text-xs font-black font-serif">{currency} {parseFloat(inv.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center text-emerald-600">
                        <p className="text-[10px] font-bold uppercase tracking-wider">Already Paid</p>
                        <p className="text-xs font-black font-serif">{currency} {invoiceLinkedPaid.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center text-rose-600 mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider">Balance Due</p>
                        <p className="text-xs font-black font-serif">{currency} {balance.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount Paying ({currency})</label>
              <input type="number" name="amount" defaultValue={(() => {
                if (!selectedInvoiceId) return 0;
                const inv = paymentModalData?.invoices.find((i: any) => String(i.id) === String(selectedInvoiceId));
                if (!inv) return 0;
                const invoiceLinkedPaid = (payments || [])
                  .filter((p: any) => (p.invoice_id && String(p.invoice_id) === String(inv.id)) || (p.invoiceId && String(p.invoiceId) === String(inv.id)))
                  .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
                const bal = parseFloat(inv.amount || 0) - invoiceLinkedPaid;
                return bal > 0 ? bal : 0;
              })()} key={selectedInvoiceId} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
              <select name="method" defaultValue="Cash" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
              <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                <input type="text" name="academic_year" defaultValue={paymentModalData?.academic_year || organization?.academic_year} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                <input type="text" name="term" defaultValue={paymentModalData?.term || organization?.current_term} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transaction ID (Optional)</label>
              <input type="text" name="transaction_id" placeholder="Optional" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setPaymentModalData(null)} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none">Record Payment</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  Scholarships: ({ students, scholarshipTypes, data, onSave, onDelete, onSaveType, onDeleteType }: { students: Student[], scholarshipTypes: any[], data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onSaveType?: (data: any) => void, onDeleteType?: (item: any) => void }) => {
    const { t, currency } = useLanguage();
    const renderScholarshipTypeForm = (item?: any) => (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Type Name</label>
          <input
            type="text"
            name="name"
            defaultValue={item?.name}
            placeholder="e.g. Academic Excellence"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Default Amount</label>
          <input
            type="number"
            name="amount"
            defaultValue={item?.amount}
            placeholder="e.g. 1000"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    );

    const renderScholarshipForm = (item?: any) => (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</label>
          <select
            name="student_id"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={item?.student_id || ""}
          >
            <option value="">Select Student...</option>
            {students.filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Scholarship Type</label>
          <select
            name="type_id"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={item?.type_id || ""}
            onChange={(e) => {
              const type = scholarshipTypes.find(t => t.id === e.target.value);
              if (type) {
                const amountInput = e.target.closest('form')?.querySelector('input[name="amount"]') as HTMLInputElement;
                if (amountInput) {
                  amountInput.value = type.amount;
                }
              }
            }}
          >
            <option value="">Select Type...</option>
            {scholarshipTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({currency} {t.amount})</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount ({currency})</label>
          <input
            type="number"
            name="amount"
            defaultValue={item?.amount}
            placeholder="Override default amount..."
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
          <select
            name="status"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={item?.status || "Active"}
          >
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>
    );

    return (
      <div className="space-y-8">
        <DataTable
          title={t('scholarship_types')}
          data={scholarshipTypes || []}
          onSave={onSaveType}
          onDelete={onDeleteType}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Scholarship Classification</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Standard Disbursement Amount</p>
                <p className="text-3xl font-black text-indigo-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-2 italic">Eligibility Criteria / Description</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium"> This scholarship type defines a predefined financial aid package that can be assigned to eligible students during billing cycles.</p>
              </div>
            </div>
          )}
          onEdit={() => { }}
          columns={[
            { header: 'Type Name', accessor: 'name', className: 'font-bold' },
            { header: 'Default Amount', accessor: (item: any) => `${currency} ${item.amount}`, className: 'text-indigo-600 font-bold' },
          ]}
          onAdd={onSaveType ? () => { } : undefined}
          renderForm={renderScholarshipTypeForm}
        />

        <DataTable
          title={t('scholarships_and_financial_aid')}
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.student_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                      item.status === 'Active' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {item.status || 'Active'}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{item.type_name || 'Assigned Aid'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Awarded Amount</p>
                  <p className="text-2xl font-black text-indigo-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Application Date</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">{new Date(item.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Award Status & Notes</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">This student has been granted {item.type_name || 'financial aid'} covering {currency} {parseFloat(item.amount).toLocaleString()} of their billable fees.</p>
              </div>
            </div>
          )}
          onEdit={(item) => { }}
          columns={[
            { header: 'Student', accessor: 'student_name', className: 'font-bold' },
            { header: 'Scholarship Type', accessor: (item: any) => item.type_name || item.type },
            { header: 'Amount', accessor: (item: any) => `${currency} ${item.amount}`, className: 'text-indigo-600 font-bold' },
            {
              header: 'Status',
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Active' ? "bg-emerald-50 text-emerald-600" :
                    item.status === 'Pending' ? "bg-amber-50 text-amber-600" : "bg-zinc-100 text-zinc-600"
                )}>
                  {item.status || 'Active'}
                </span>
              )
            },
          ]}
          onAdd={onSave ? () => { } : undefined}
          renderForm={renderScholarshipForm}
        />
      </div>
    );
  },
  ExpensesBudget: ({ data, budgets, organization, onSave, onDelete, onSaveBudget }: { data?: any[], budgets?: any[], organization?: any, onSave?: (data: any) => void, onDelete?: (item: any) => void, onSaveBudget?: (data: any) => void }) => {
    const { t, currency } = useLanguage();
    const categories = ['Salary', 'Utilities', 'Maintenance', 'Supplies', 'Marketing', 'Other'];
    const totalSpent = (data || []).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const totalBudget = (budgets || []).reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const [isManagingBudget, setIsManagingBudget] = useState(false);

    const getCategorySpent = (cat: string) =>
      (data || []).filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const getCategoryBudget = (cat: string) =>
      (budgets || []).find(b => b.category === cat)?.amount || 0;

    const handlePrintVoucher = (item: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Expenditure Voucher - ${item.id || 'NEW'}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
              <style>
                @page { size: portrait; margin: 0; }
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; background: #fff; }
                .voucher-container { 
                  border: 2px solid #1f2937; 
                  padding: 40px; 
                  max-width: 800px; 
                  margin: auto; 
                  position: relative;
                }
                .header { 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center; 
                  margin-bottom: 40px; 
                  border-bottom: 2px solid #1f2937;
                  padding-bottom: 20px;
                }
                .header h1 { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
                .info-grid { 
                  display: grid; 
                  grid-template-columns: 1fr 1fr; 
                  gap: 30px; 
                  margin-bottom: 40px;
                }
                .info-item { border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
                .info-item label { display: block; font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
                .info-item p { margin: 0; font-size: 14px; font-weight: 700; }
                .amount-box {
                  border: 2px solid #1f2937;
                  padding: 20px;
                  text-align: center;
                  margin-bottom: 40px;
                }
                .amount-box h2 { margin: 0; font-size: 32px; font-weight: 900; }
                .sig-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 20px;
                  margin-top: 60px;
                }
                .sig-item { text-align: center; border-top: 1px solid #1f2937; padding-top: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
                .principal-sig {
                  font-family: 'Dancing Script', cursive;
                  font-size: 20px;
                  color: #1f2937;
                  margin-bottom: -10px;
                }
              </style>
            </head>
            <body>
              <div class="voucher-container">
                <div class="header">
                  <div>
                    <h2 style="margin: 0; font-size: 14px; font-weight: 900;">${organization?.name || 'School Management'}</h2>
                    <h1>Payment Voucher</h1>
                    <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 700; color: #6b7280;">Voucher No: VO-${(item.id || 'TEMP').substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; font-size: 14px; font-weight: 900;">Expenditure Authorization</p>
                    <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">Financial Year 2024</p>
                  </div>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <label>Payment Date</label>
                    <p>${new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div class="info-item">
                    <label>Category</label>
                    <p>${item.category}</p>
                  </div>
                  <div class="info-item" style="grid-column: span 2;">
                    <label>Expenditure Description</label>
                    <p>${item.description || 'General School Expense'}</p>
                  </div>
                </div>

                <div class="amount-box">
                  <p style="font-size: 10px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; color: #6b7280;">Amount Authorized</p>
                  <h2>${currency} ${parseFloat(item.amount).toLocaleString()}</h2>
                </div>

                <div style="font-size: 12px; font-style: italic; color: #4b5563; margin-bottom: 40px;">
                  Being payment for the items/services described above as authorized by the school administration.
                </div>

                <div class="sig-grid">
                  <div class="sig-item">Prepared By</div>
                  <div class="sig-item">
                    <div class="principal-sig">${organization?.principal_name || 'Principal'}</div>
                    Authorized By
                  </div>
                  <div class="sig-item">Receiver's Signature</div>
                </div>
              </div>
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <div className="flex items-center gap-3 mb-4 opacity-80">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{t('total_budget')}</p>
            </div>
            <h3 className="text-2xl font-black">{currency} {totalBudget.toLocaleString()}</h3>
            <p className="text-[10px] font-bold mt-2 opacity-60">Allocated Funds</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-rose-600 to-pink-700 text-white rounded-3xl shadow-lg shadow-rose-200 dark:shadow-none">
            <div className="flex items-center gap-3 mb-4 opacity-80">
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowDownRight className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{t('spent_to_date')}</p>
            </div>
            <h3 className="text-2xl font-black">{currency} {totalSpent.toLocaleString()}</h3>
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }} />
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl shadow-lg shadow-emerald-200 dark:shadow-none">
            <div className="flex items-center gap-3 mb-4 opacity-80">
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{t('remaining')}</p>
            </div>
            <h3 className="text-2xl font-black">{currency} {Math.max(0, totalBudget - totalSpent).toLocaleString()}</h3>
            <p className="text-[10px] font-bold mt-2 opacity-60">Available Balance</p>
          </div>

          <div className="p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col justify-center">
            <button
              onClick={() => setIsManagingBudget(true)}
              className="group w-full h-full p-6 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-900 dark:hover:bg-white text-zinc-900 dark:text-white hover:text-white dark:hover:text-zinc-900 rounded-[1.4rem] transition-all duration-300 flex flex-col items-center justify-center gap-2"
            >
              <div className="p-3 bg-white dark:bg-zinc-900 group-hover:bg-white/20 rounded-2xl shadow-sm transition-colors">
                <Target className="w-6 h-6 text-indigo-600 group-hover:text-white" />
              </div>
              <span className="font-bold text-sm">{t('manage_budgets')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable
              title={t('recent_expenses')}
              data={data || []}
              onSave={onSave}
              onDelete={onDelete}
              onEdit={(item) => { }}
              columns={[
                { header: 'Date', accessor: (item: any) => new Date(item.date).toLocaleDateString() },
                { header: 'Category', accessor: 'category', className: 'font-bold' },
                { header: 'Description', accessor: 'description' },
                {
                  header: 'Amount',
                  accessor: (item: any) => (
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-rose-600">{currency} {parseFloat(item.amount).toLocaleString()}</span>
                      {item.isAuto && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-1 rounded-sm mt-0.5">System Generated</span>
                      )}
                    </div>
                  )
                },
              ]}
              onAdd={onSave ? () => { } : undefined}
              renderForm={(item, isViewOnly) => {
                if (isViewOnly && item) {
                  return (
                    <div className="space-y-8 p-4">
                      {/* Expenditure Voucher Header */}
                      <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-6">
                        <div>
                          <h1 className="text-2xl font-black text-rose-600 tracking-tight uppercase">Payment Voucher</h1>
                          <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-widest">
                            Ref: VO-${item.id ? item.id.substring(0, 8).toUpperCase() : 'TEMP'}
                          </p>
                        </div>
                        <div className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-black uppercase tracking-widest">
                          Authorized
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Expenditure Date</label>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Expense Category</label>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.category}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Description / Purpose</label>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                          "{item.description || 'No description provided'}"
                        </p>
                      </div>

                      <div className="bg-zinc-900 dark:bg-white p-6 rounded-2xl flex justify-between items-center text-white dark:text-zinc-900">
                        <span className="text-sm font-black uppercase tracking-wider opacity-60">Total Amount Payable</span>
                        <span className="text-3xl font-black tracking-tight">{currency} {parseFloat(item.amount).toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] text-zinc-400 italic">This expenditure record is system-tracked and authorized.</p>
                        <button
                          type="button"
                          onClick={() => handlePrintVoucher(item)}
                          className="px-6 py-2 bg-zinc-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Print Voucher
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                      <select
                        name="category"
                        defaultValue={item?.category || 'Other'}
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.filter(c => c !== 'Salary').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('amount_label')} ({currency})</label>
                      <input
                        type="number"
                        name="amount"
                        defaultValue={item?.amount}
                        disabled={isViewOnly}
                        required
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                      <input
                        type="date"
                        name="date"
                        defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        disabled={isViewOnly}
                        required
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('description')}</label>
                      <textarea
                        name="description"
                        defaultValue={item?.description}
                        disabled={isViewOnly}
                        rows={3}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                );
              }}
            />
          </div>

          <div className="space-y-6">
            <div className="p-8 bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-200 dark:shadow-none">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                {t('budget_utilization')}
              </h3>
              <div className="space-y-8">
                {categories.map(cat => {
                  const spent = getCategorySpent(cat);
                  const budget = getCategoryBudget(cat);
                  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                  const isOver = spent > budget && budget > 0;
                  const isCritical = percent > 85;

                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-wider text-zinc-400">{cat}</p>
                          <p className="text-xs font-bold">
                            {currency} {spent.toLocaleString()} <span className="opacity-40">/ {budget.toLocaleString()}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-lg font-black tracking-tighter leading-none",
                            isOver ? "text-rose-400" : isCritical ? "text-amber-400" : "text-white"
                          )}>
                            {Math.round(percent)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 flex justify-end items-center px-1",
                            isOver ? "bg-gradient-to-r from-rose-600 to-rose-400" :
                              isCritical ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                                "bg-gradient-to-r from-indigo-600 to-indigo-400"
                          )}
                          style={{ width: `${percent}%` }}
                        >
                          {percent > 20 && <div className="w-1 h-1 bg-white rounded-full opacity-50 shadow-sm" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {isManagingBudget && (
          <Modal
            isOpen={isManagingBudget}
            title={t('manage_budgets')}
            onClose={() => setIsManagingBudget(false)}
          >
            <div className="space-y-4 p-1">
              {categories.map(cat => (
                <form
                  key={cat}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    onSaveBudget?.({ category: cat, amount: formData.get('amount') });
                  }}
                  className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                  <label className="flex-1 text-sm font-bold text-zinc-700 dark:text-zinc-300">{cat}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">{currency}</span>
                    <input
                      type="number"
                      name="amount"
                      defaultValue={getCategoryBudget(cat)}
                      className="w-32 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  },
  FinancialReports: ({ invoices, payments, expenses, budgets, inventorySales = [], transportAssignments = [], hostelAssignments = [] }: { invoices?: any[], payments?: any[], expenses?: any[], budgets?: any[], inventorySales?: any[], transportAssignments?: any[], hostelAssignments?: any[] }) => {
    const { t, currency } = useLanguage();
    const totalPayments = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalInvoiced = (invoices || []).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netPosition = totalPayments - totalExpenses;
    const collectionRate = totalInvoiced > 0 ? (totalPayments / totalInvoiced) * 100 : 0;

    const pendingInventoryRevenue = (inventorySales || [])
      .filter(r => r.status === 'Pending')
      .reduce((sum, r) => sum + (parseFloat(r.total_price || r.price) || 0), 0);

    const pendingTransportRevenue = (transportAssignments || [])
      .filter(a => a.transport_status === 'Pending')
      .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);

    const pendingHostelRevenue = (hostelAssignments || [])
      .filter(a => a.hostel_status === 'Pending')
      .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
    
    const projectedRevenue = pendingInventoryRevenue + pendingTransportRevenue + pendingHostelRevenue;
    const totalPotentialRevenue = totalInvoiced + projectedRevenue;

    // Monthly Data Aggregation
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    const monthlyData = last6Months.map((month, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString('default', { month: 'short' });
      const mNum = d.getMonth();
      const yNum = d.getFullYear();

      const mPayments = (payments || []).filter(p => {
        const pd = new Date(p.date || p.created_at);
        return pd.getMonth() === mNum && pd.getFullYear() === yNum;
      }).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const mExpenses = (expenses || []).filter(e => {
        const ed = new Date(e.date || e.created_at);
        return ed.getMonth() === mNum && ed.getFullYear() === yNum;
      }).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      return { name: mLabel, income: mPayments, expenses: mExpenses };
    }).reverse();

    const expenseByCategory = (expenses || []).reduce((acc: any, curr: any) => {
      acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount || 0);
      return acc;
    }, {});

    const pieData = Object.keys(expenseByCategory).map(cat => ({
      name: cat,
      value: expenseByCategory[cat]
    }));

    // Student Payment Status Data
    const studentStatusMap: Record<string, { invoiced: number, paid: number }> = {};
    (invoices || []).forEach(inv => {
      if (!studentStatusMap[inv.student_id]) studentStatusMap[inv.student_id] = { invoiced: 0, paid: 0 };
      studentStatusMap[inv.student_id].invoiced += parseFloat(inv.amount || 0);
    });
    (payments || []).forEach(pay => {
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

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const PAYMENT_COLORS = ['#10b981', '#f59e0b'];

    const downloadCSV = (title: string, data: any[]) => {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row =>
        Object.values(row).map(val => `"${val}"`).join(',')
      ).join('\n');
      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleDownload = (type: string) => {
      let reportData: any[] = [];
      let title = "";

      if (type === 'income') {
        title = "Income Statement";
        reportData = (payments || []).map(p => ({
          Date: new Date(p.date || p.created_at).toLocaleDateString(),
          Student: p.student_name || 'N/A',
          Amount: p.amount,
          Method: p.method,
          Reference: p.transaction_id
        }));
      } else if (type === 'balance') {
        title = "Balance Sheet Summary";
        reportData = [
          { Item: 'Total Revenue', Amount: totalPayments },
          { Item: 'Total Expenses', Amount: totalExpenses },
          { Item: 'Net Position', Amount: netPosition },
          { Item: 'Invoiced Amount', Amount: totalInvoiced },
          { Item: 'Collection Rate', Amount: `${Math.round(collectionRate)}%` }
        ];
      } else if (type === 'variance') {
        title = "Budget Variance Report";
        reportData = (budgets || []).map(b => {
          const spent = (expenses || []).filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          return {
            Category: b.category,
            Budget: b.amount,
            Actual: spent,
            Variance: b.amount - spent,
            Utilization: `${Math.round((spent / b.amount) * 100)}%`
          };
        });
      }

      if (reportData.length > 0) {
        downloadCSV(title, reportData);
      }
    };

    return (
      <div className="space-y-6">
        {/* Financial Health Section */}
        <div className="p-8 bg-zinc-900 dark:bg-black rounded-[2.5rem] text-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-1">Financial Health Dashboard</h3>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Revenue Projection & Collection Analytics</p>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Total Potential Revenue</p>
                  <p className="text-lg font-black">{currency} {totalPotentialRevenue.toLocaleString()}</p>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: '100%' }} />
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Invoiced + Pending Requests</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Actual Collections</p>
                  <p className="text-lg font-black text-indigo-400">{currency} {totalPayments.toLocaleString()}</p>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${totalPotentialRevenue > 0 ? (totalPayments / totalPotentialRevenue) * 100 : 0}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase italic">{totalPotentialRevenue > 0 ? Math.round((totalPayments / totalPotentialRevenue) * 100) : 0}% of potential realized</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">Projected (Pending)</p>
                  <p className="text-lg font-black text-amber-400">{currency} {projectedRevenue.toLocaleString()}</p>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${totalPotentialRevenue > 0 ? (projectedRevenue / totalPotentialRevenue) * 100 : 0}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Future income from open requests</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('total_revenue')}</p>
            <h3 className="text-2xl font-black text-emerald-600">{currency} {totalPayments.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-widest">From {payments?.length || 0} Transactions</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('total_expenses')}</p>
            <h3 className="text-2xl font-black text-rose-600">{currency} {totalExpenses.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-widest">{expenses?.length || 0} Records Found</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('net_position')}</p>
            <h3 className={cn(
              "text-2xl font-black",
              netPosition >= 0 ? "text-indigo-600" : "text-rose-600"
            )}>
              {currency} {netPosition.toLocaleString()}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-widest">{netPosition >= 0 ? 'Surplus' : 'Deficit'} Balance</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('collection_rate')}</p>
            <h3 className="text-2xl font-black text-amber-500">{Math.round(collectionRate)}%</h3>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-8 flex items-center justify-between">
              {t('income_vs_expenses')}
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-8 flex items-center justify-between">
              {t('expense_distribution')}
              <PieChart className="w-5 h-5 text-rose-600" />
            </h3>
            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-8 flex items-center justify-between">
              {t('fee_collection_status')}
              <Users className="w-5 h-5 text-emerald-600" />
            </h3>
            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </RePieChart>
              </ResponsiveContainer>
              <div className="hidden sm:block pl-8 space-y-4">
                <div className="space-y-1">
                  <p className="text-2xl font-black text-emerald-600">{paidCount}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Students Paid</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-amber-500">{owingCount}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Students Owing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              {t('downloadable_reports')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <button
                onClick={() => handleDownload('income')}
                className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold mb-1">Income Statement</h4>
                    <p className="text-xs text-zinc-500">Detailed P&L for the current period.</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleDownload('balance')}
                className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold mb-1">Balance Sheet</h4>
                    <p className="text-xs text-zinc-500">Assets vs Liabilities overview.</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleDownload('variance')}
                className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold mb-1">Budget Variance</h4>
                    <p className="text-xs text-zinc-500">Analysis of budget vs actual spend.</p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
  FeeHistoryPreview: ({ data }: { data: any }) => {
    const { student, organization, invoices = [], payments = [], scholarships = [] } = data || {};
    const { t, currency } = useLanguage();

    if (!student || !organization) {
      return (
        <div className="flex flex-col items-center justify-center p-12 min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-center max-w-md">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Record Incomplete</h2>
            <p className="text-zinc-500 text-sm mb-6">We could not retrieve the complete student or school profile for this link.</p>
            <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200">Return to Portal</button>
          </div>
        </div>
      );
    }

    const totalBilled = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const totalScholarships = scholarships.reduce((sum: number, s: any) => sum + parseFloat(s.amount || s.type_amount || 0), 0);
    const balanceDue = totalBilled - totalPaid - totalScholarships;

    return (
      <div className="bg-zinc-100 dark:bg-zinc-950 p-2 sm:p-6 md:p-12 min-h-screen font-sans">
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-[1rem] sm:rounded-[2rem]">
            {/* Document Header */}
            <div className="p-8 sm:p-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-6">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
                    {organization?.logo ? (
                      <img src={organization.logo} className="w-full h-full object-contain p-2" />
                    ) : (
                      <School className="w-10 h-10" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-2">{organization?.name}</h1>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">{organization?.address || 'Official Financial Record'}</p>
                  </div>
                </div>
                <div className="md:text-right space-y-4">
                  <div className="flex items-center justify-end gap-3 flex-wrap">
                    <div className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">
                      Official Fee Statement
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="no-print flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Statement Date</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* School Link for Parents */}
            {organization?.custom_domain && (
              <div className="text-center py-4 bg-zinc-50/50 dark:bg-zinc-800/10">
                <a
                  href={`https://${organization.custom_domain}.skoola.online`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800 text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Login to Parent Portal for Full Details</span>
                  <span className="sm:hidden">Parent Portal Login</span>
                </a>
              </div>
            )}

            {/* Student Info */}
            <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-zinc-900">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bill To</p>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase">{student?.name}</h2>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{student?.class_name || 'N/A'}</p>
                <p className="text-xs font-medium text-zinc-400">{student?.student_id || student?.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={cn("text-xs font-black uppercase", balanceDue <= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {balanceDue <= 0 ? 'Clear' : 'Outstanding'}
                  </p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Paid</p>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">{currency} {totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary Table */}
            <div className="px-8 sm:p-12 pb-8">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b-2 border-zinc-100 dark:border-zinc-800">
                       <th className="py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</th>
                       <th className="py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                     <tr className="group">
                       <td className="py-6 font-bold text-zinc-700 dark:text-zinc-300">Total Invoiced Fees</td>
                       <td className="py-6 text-right font-black text-zinc-900 dark:text-white">{currency} {totalBilled.toLocaleString()}</td>
                     </tr>
                     <tr className="group">
                       <td className="py-6 font-bold text-zinc-700 dark:text-zinc-300">Total Scholarships / Discounts</td>
                       <td className="py-6 text-right font-black text-indigo-600">({currency} {totalScholarships.toLocaleString()})</td>
                     </tr>
                     <tr className="group">
                       <td className="py-6 font-bold text-zinc-700 dark:text-zinc-300">Total Payments Made</td>
                       <td className="py-6 text-right font-black text-emerald-600">({currency} {totalPaid.toLocaleString()})</td>
                     </tr>
                   </tbody>
                   <tfoot>
                     <tr className={cn(
                       "border-t-4",
                       balanceDue <= 0 ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-rose-500 bg-rose-50/30 dark:bg-rose-900/10"
                     )}>
                       <td className="py-6 px-4 text-sm font-black uppercase tracking-widest">Balance Due</td>
                       <td className={cn(
                         "py-6 px-4 text-right text-2xl font-black",
                         balanceDue <= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                       )}>
                         {currency} {balanceDue.toLocaleString()}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
            </div>

            {/* Detailed History */}
            <div className="p-8 sm:p-12 border-t border-zinc-100 dark:border-zinc-800 space-y-12">
               <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Transaction History</h3>
                 <div className="space-y-4">
                    {[...invoices.map(i => ({...i, type: 'invoice'})), ...payments.map(p => ({...p, type: 'payment'}))]
                      .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-4 border-b border-zinc-50 dark:border-zinc-800/50">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                              {item.type === 'invoice' ? (item.description || 'Fee Invoice') : 'Payment Received'}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                              {new Date(item.date || item.created_at).toLocaleDateString()} • {item.type === 'invoice' ? 'Debit' : `Credit (${item.method})`}
                            </p>
                          </div>
                          <p className={cn(
                            "text-sm font-black",
                            item.type === 'invoice' ? "text-zinc-900 dark:text-white" : "text-emerald-600"
                          )}>
                            {item.type === 'invoice' ? '' : '-'}{currency} {parseFloat(item.amount).toLocaleString()}
                          </p>
                        </div>
                      ))}
                 </div>
               </div>
            </div>

            {/* Footer */}
            <div className="p-8 sm:p-12 bg-zinc-50 dark:bg-zinc-800/20 text-center">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Thank you for your partnership with {organization?.name}</p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="w-24 h-px bg-zinc-200 dark:border-zinc-700 mb-2 mx-auto" />
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Accounts Dept</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-px bg-zinc-200 dark:border-zinc-700 mb-2 mx-auto" />
                  <p className="text-[9px] font-black text-zinc-400 uppercase">School Stamp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .min-h-screen { min-height: auto !important; padding: 0 !important; }
            .shadow-xl { shadow: none !important; border: none !important; }
          }
        `}} />
      </div>
    );
  }
};
