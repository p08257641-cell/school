import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowRightCircle,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  Edit,
  Eye,
  FileText,
  Fingerprint,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  School,
  School as SchoolIcon,
  Search,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
  Video,
  X,
  Zap,
  Settings,
  Briefcase,
  Save,
  Send,
  BellRing,
  LogOut
} from 'lucide-react';
import TimetableEntryModal from '../modals/TimetableEntryModal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { Student, UserRole, Inquiry, Application, Acceptance, ReportCardTemplate, ReportCardSection } from '../../types';
import { Modal } from '../UI';
import { API_BASE_URL } from '../../constants';
import { useLanguage } from '../../lib/LanguageContext';
import { downloadStudentTemplate, parseStudentExcel } from '../../lib/excel';
import { Download, FileUp } from 'lucide-react';
import { fetchCalendarEvents, createCalendarEvent, deleteCalendarEvent, syncPublicHolidays, sendBulkSMS } from '../../lib/api';

const SectionEditor: React.FC<{ section: ReportCardSection, onUpdate: (s: ReportCardSection) => void, onRemove: () => void }> = ({ section, onUpdate, onRemove }) => {
  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            className="text-sm font-bold bg-transparent outline-none border-b border-transparent focus:border-indigo-500"
          />
        </div>
        <button onClick={onRemove} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-zinc-400">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(e) => onUpdate({ ...section, enabled: e.target.checked })}
            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          Enabled
        </label>
        <span>Type: {section.type}</span>
      </div>

      {section.type === 'AcademicResults' && section.enabled && (
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700/50 space-y-4">
          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Table Columns & Order</p>
          <div className="grid grid-cols-1 gap-1">
            {(section.settings?.columnOrder || [
              'showClassScore', 'showExamScore', 'showTotalScore', 'showGrade', 'showSubjectRank', 'showPercentage'
            ]).map((key: string, idx: number) => {
              const options: Record<string, string> = {
                showClassScore: 'Class Score (CA)',
                showExamScore: 'Exams Score',
                showTotalScore: 'Total Score',
                showGrade: 'Grade',
                showSubjectRank: 'Subject Position / Rank',
                showPercentage: 'Percentage (%)'
              };
              if (!options[key]) return null;

              // Check if we should show a Max Score input for this column
              const hasMaxSetting = key === 'showClassScore' || key === 'showExamScore';
              const maxKey = key === 'showClassScore' ? 'classScoreMax' : 'examScoreMax';

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg group border border-transparent hover:border-indigo-200">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={!!section.settings?.[key]}
                        onChange={(e) => onUpdate({
                          ...section,
                          settings: { ...(section.settings || {}), [key]: e.target.checked }
                        })}
                        className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors uppercase">{options[key]}</span>
                    </label>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const newOrder = [...(section.settings.columnOrder || ['showClassScore', 'showExamScore', 'showTotalScore', 'showGrade', 'showSubjectRank', 'showPercentage'])];
                          if (idx > 0) {
                            [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
                            onUpdate({ ...section, settings: { ...section.settings, columnOrder: newOrder } });
                          }
                        }}
                        className="p-1 hover:bg-white rounded text-zinc-400 hover:text-indigo-600"
                      >
                        <Zap className="w-3 h-3 -rotate-90" />
                      </button>
                      <button
                        onClick={() => {
                          const newOrder = [...(section.settings.columnOrder || ['showClassScore', 'showExamScore', 'showTotalScore', 'showGrade', 'showSubjectRank', 'showPercentage'])];
                          if (idx < newOrder.length - 1) {
                            [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
                            onUpdate({ ...section, settings: { ...section.settings, columnOrder: newOrder } });
                          }
                        }}
                        className="p-1 hover:bg-white rounded text-zinc-400 hover:text-indigo-600"
                      >
                        <Zap className="w-3 h-3 rotate-90" />
                      </button>
                    </div>
                  </div>

                  {hasMaxSetting && section.settings?.[key] && (
                    <div className="pl-9 pb-2 flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">Max Marks:</span>
                      <input
                        type="number"
                        value={section.settings?.[maxKey] || (key === 'showClassScore' ? 30 : 70)}
                        onChange={(e) => onUpdate({
                          ...section,
                          settings: {
                            ...(section.settings || {}),
                            [maxKey]: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-16 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
            {[
              { key: 'showRanking', label: 'Overall Ranking' },
              { key: 'showPosition', label: 'Overall Position' },
              { key: 'showAttendance', label: 'Include Attendance' },
              { key: 'showAverage', label: 'Average' }
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!section.settings?.[opt.key]}
                  onChange={(e) => onUpdate({
                    ...section,
                    settings: { ...(section.settings || {}), [opt.key]: e.target.checked }
                  })}
                  className="w-3.5 h-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-700 uppercase transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {section.type === 'PrincipalSignature' && section.enabled && (
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700/50 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Signature Title</label>
            <input
              type="text"
              value={section.settings?.signatureTitle || 'Headmaster / Principal Signature'}
              onChange={(e) => onUpdate({
                ...section,
                settings: { ...(section.settings || {}), signatureTitle: e.target.value }
              })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Headmaster Signature"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Signature Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={section.settings?.signatureUrl || ''}
                onChange={(e) => onUpdate({
                  ...section,
                  settings: { ...(section.settings || {}), signatureUrl: e.target.value }
                })}
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
              <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!section.settings?.showDate}
              onChange={(e) => onUpdate({
                ...section,
                settings: { ...(section.settings || {}), showDate: e.target.checked }
              })}
              id={`date-${section.id}`}
              className="w-3.5 h-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor={`date-${section.id}`} className="text-[10px] font-bold text-zinc-500 uppercase cursor-pointer">Show Date Line</label>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReportCardPreview = ({ template, organization, student, onClose }: { template: ReportCardTemplate, organization?: any, student?: any, onClose: () => void }) => {
  const currentStudent = student || {
    name: 'Samuel Kwesi Baidoo',
    id: 'STU-2024-0042',
    grade: 'Junior High 3',
    term: 'Term 2, 2024',
    attendance: '62 / 64 days',
    results: [
      { subject: 'Mathematics', classScore: 28, examScore: 60, score: 88, grade: 'A', rank: '2nd', remark: 'Excellent' },
      { subject: 'English Language', classScore: 29, examScore: 63, score: 92, grade: 'A', rank: '1st', remark: 'Outstanding' },
      { subject: 'Integrated Science', classScore: 24, examScore: 52, score: 76, grade: 'B', rank: '5th', remark: 'Very Good' },
      { subject: 'Social Studies', classScore: 26, examScore: 58, score: 84, grade: 'A', rank: '3rd', remark: 'Excellent' },
      { subject: 'ICT', classScore: 30, examScore: 65, score: 95, grade: 'A', rank: '1st', remark: 'Exceptional' }
    ]
  };

  const isTwoColumn = template.layout?.columns === 2;
  const primaryColor = template.layout?.primaryColor || '#4f46e5'; // Default indigo-600
  const accentColor = template.layout?.accentColor || '#818cf8'; // Default indigo-400
  const fontFamily = template.layout?.fontFamily || 'serif';
  const titleStyle = template.layout?.titleStyle || 'classic';

  const themeStyles = {
    fontFamily: fontFamily === 'serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' :
      fontFamily === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' :
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    primary: primaryColor,
    accent: accentColor
  };

  const content = (
    <div className="bg-zinc-50 dark:bg-zinc-800/20 p-2 md:p-8 min-h-screen">
      <div
        className="bg-white dark:bg-zinc-900 mx-auto shadow-2xl space-y-8 print:p-0 print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-6 md:p-[20mm] relative rounded-[2rem] md:rounded-none"
        style={{ fontFamily: themeStyles.fontFamily }}
      >
          {/* Header */}
          <div className={cn(
            "flex flex-col sm:flex-row justify-between items-start gap-6 pb-6",
            titleStyle === 'bold' ? "border-b-8" : "border-b-4"
          )} style={{ borderColor: themeStyles.primary }}>
            <div className="space-y-2">
              {template.layout?.showLogo && (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white border border-zinc-100 dark:border-zinc-800 shadow-sm mb-4 overflow-hidden">
                  {organization?.logo ? (
                    <img src={organization.logo} alt="School Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white" style={{ backgroundColor: themeStyles.primary }}>
                      <SchoolIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
              )}
              <h1 className={cn(
                "tracking-tighter uppercase leading-none",
                titleStyle === 'classic' ? "text-2xl md:text-3xl font-black italic" :
                  titleStyle === 'modern' ? "text-3xl md:text-4xl font-light tracking-[0.2em]" :
                    "text-3xl md:text-5xl font-black"
              )} style={{ color: themeStyles.primary }}>
                Academic Progress Report
              </h1>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{organization?.name || 'Springfield Academy'}</p>
              {organization?.support_email && (
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{organization.support_email}</p>
              )}
            </div>
            <div className="text-right space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">{currentStudent.term}</p>
            </div>
          </div>

          {/* Sections Grid */}
          <div className={cn("grid gap-8", isTwoColumn ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
            {template.sections?.filter(s => s.enabled).map((section) => (
              <div key={section.id} className={cn("space-y-4", section.type === 'AcademicResults' && !isTwoColumn && "col-span-full")}>
                <h3
                  className="text-xs font-black uppercase tracking-[0.2em] border-b pb-2"
                  style={{ color: themeStyles.accent, borderColor: `${themeStyles.accent}20` }}
                >
                  {section.title}
                </h3>

                {section.type === 'StudentInfo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-400 uppercase">Student Name</p>
                      <p className="font-black text-zinc-900 dark:text-white uppercase">{currentStudent.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-400 uppercase">Student ID</p>
                      <p className="font-black text-zinc-900 dark:text-white uppercase">{currentStudent.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-400 uppercase">Grade Level</p>
                      <p className="font-black text-zinc-900 dark:text-white uppercase">{currentStudent.grade}</p>
                    </div>
                    {currentStudent.classPosition && (
                      <div className="space-y-1">
                        <p className="font-bold text-zinc-400 uppercase">Class Position</p>
                        <p className="font-black text-indigo-600 uppercase italic">{currentStudent.classPosition}</p>
                      </div>
                    )}
                    {currentStudent.rankPercentile && (
                      <div className="space-y-1">
                        <p className="font-bold text-zinc-400 uppercase">Rank Percentile</p>
                        <p className="font-black text-emerald-600 uppercase">{currentStudent.rankPercentile}</p>
                      </div>
                    )}
                  </div>
                )}

                {section.type === 'AcademicResults' && (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-[10px] sm:text-xs min-w-[500px] sm:min-w-full">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-2 font-black uppercase tracking-wider">Subject</th>
                          {(section.settings?.columnOrder || ['showClassScore', 'showExamScore', 'showTotalScore', 'showGrade', 'showSubjectRank', 'showPercentage'])
                            .filter((key: string) => section.settings?.[key])
                            .map((key: string) => {
                              const headers: Record<string, string> = {
                                showClassScore: 'Class',
                                showExamScore: 'Exam',
                                showTotalScore: 'Total',
                                showGrade: 'Grade',
                                showSubjectRank: 'Rank',
                                showPercentage: '%'
                              };
                              return <th key={key} className="px-4 py-2 font-black uppercase tracking-wider text-center">{headers[key]}</th>;
                            })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {currentStudent.results.map((res, i) => (
                          <tr key={i} className="hover:bg-zinc-50/50">
                            <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">{res.subject}</td>
                            {(section.settings?.columnOrder || ['showClassScore', 'showExamScore', 'showTotalScore', 'showGrade', 'showSubjectRank', 'showPercentage'])
                              .filter((key: string) => section.settings?.[key])
                              .map((key: string) => {
                                if (key === 'showClassScore') return <td key={key} className="px-4 py-3 text-center text-zinc-500">{res.classScore}</td>;
                                if (key === 'showExamScore') return <td key={key} className="px-4 py-3 text-center text-zinc-500">{res.examScore}</td>;
                                if (key === 'showTotalScore') return <td key={key} className="px-4 py-3 text-center font-black">{res.score}</td>;
                                if (key === 'showGrade') return (
                                  <td key={key} className="px-4 py-3 text-center">
                                    <span className="px-2 py-0.5 rounded font-black" style={{ backgroundColor: `${themeStyles.primary}10`, color: themeStyles.primary }}>{res.grade}</span>
                                  </td>
                                );
                                if (key === 'showSubjectRank') return <td key={key} className="px-4 py-3 text-center text-indigo-600 font-bold italic">{res.rank}</td>;
                                if (key === 'showPercentage') return <td key={key} className="px-4 py-3 text-center text-zinc-400 font-bold">{res.score}%</td>;
                                return null;
                              })}
                          </tr>
                        ))}
                      </tbody>
                      {(section.settings?.showTotalScore || section.settings?.showAverage) && (
                        <tfoot className="bg-zinc-50/50 dark:bg-zinc-800/50 border-t-2 border-zinc-100 dark:border-zinc-700">
                          <tr>
                            <td className="px-4 py-3 font-black uppercase tracking-wider">Academic Summary</td>
                            {(section.settings?.columnOrder || ['showClassScore', 'showExamScore', 'showTotalScore', 'showGrade', 'showSubjectRank', 'showPercentage'])
                              .filter((key: string) => section.settings?.[key])
                              .map((key: string) => {
                                if (key === 'showClassScore') return <td key={key} className="px-4 py-3 text-center font-bold text-zinc-400">{currentStudent.results.reduce((a, b) => a + (b.classScore || 0), 0)}</td>;
                                if (key === 'showExamScore') return <td key={key} className="px-4 py-3 text-center font-bold text-zinc-400">{currentStudent.results.reduce((a, b) => a + (b.examScore || 0), 0)}</td>;
                                if (key === 'showTotalScore') return <td key={key} className="px-4 py-3 text-center font-black" style={{ color: themeStyles.primary }}>{section.settings?.showTotalScore ? currentStudent.results.reduce((a, b) => a + b.score, 0) : ''}</td>;
                                if (key === 'showGrade') return <td key={key} className="px-4 py-3 text-center font-black">-</td>;
                                if (key === 'showSubjectRank') return <td key={key} className="px-4 py-3 text-center font-black">-</td>;
                                if (key === 'showPercentage') return <td key={key} className="px-4 py-3 text-center font-black text-zinc-400">AVG</td>;
                                return null;
                              })}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                    {(section.settings?.showRanking || section.settings?.showPosition || section.settings?.showAttendance) && (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {section.settings?.showPosition && (
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Class Position</p>
                            <p className="text-lg font-black" style={{ color: themeStyles.primary }}>{currentStudent.classPosition || '—'}</p>
                          </div>
                        )}
                        {section.settings?.showRanking && (
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Rank Percentile</p>
                            <p className="text-lg font-black text-zinc-900 dark:text-white">{currentStudent.rankPercentile || '—'}</p>
                          </div>
                        )}
                        {section.settings?.showAttendance && (
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Attendance</p>
                            <p className="text-lg font-black text-emerald-600">{currentStudent.attendance || '—'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {section.type === 'Attendance' && (
                  <div
                    className="p-4 rounded-2xl border flex items-center justify-between"
                    style={{ backgroundColor: `${themeStyles.primary}05`, borderColor: `${themeStyles.primary}20` }}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5" style={{ color: themeStyles.primary }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase" style={{ color: themeStyles.primary }}>Academic Attendance</p>
                        <p className="text-lg font-black text-zinc-900 dark:text-white">{currentStudent.attendance}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase" style={{ color: themeStyles.primary }}>Excellent</p>
                  </div>
                )}

                {section.type === 'Remarks' && (
                  <div className="space-y-4">
                    {currentStudent.teacherRemark || currentStudent.principalRemark ? (
                      <>
                        {currentStudent.teacherRemark && (
                          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                            <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Class Teacher's Remark</p>
                            <p className="leading-relaxed text-sm italic text-zinc-600 dark:text-zinc-400">
                              "{currentStudent.teacherRemark}"
                            </p>
                          </div>
                        )}
                        {currentStudent.principalRemark && (
                          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                            <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Principal's Remark</p>
                            <p className="leading-relaxed text-sm italic text-zinc-600 dark:text-zinc-400">
                              "{currentStudent.principalRemark}"
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700 leading-relaxed text-sm italic text-zinc-400">
                        Remarks pending for {currentStudent.name}.
                      </div>
                    )}
                  </div>
                )}

                {section.type === 'PrincipalSignature' && (
                  <div className="pt-8 space-y-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-20 flex flex-col items-center justify-end w-64 border-b-2 border-zinc-200 dark:border-zinc-800 pb-2">
                        {organization?.signature ? (
                          <img
                            src={organization.signature}
                            alt="Principal Signature"
                            className="max-h-16 object-contain"
                          />
                        ) : section.settings?.signatureUrl ? (
                          <img
                            src={section.settings?.signatureUrl}
                            alt="Signature"
                            className="max-h-16 object-contain"
                          />
                        ) : (
                          <div className="h-12 w-full"></div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                          {section.settings?.signatureTitle || 'Headmaster / Principal Signature'}
                        </p>
                        {section.settings?.showDate && (
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                            Date: {new Date().toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Promotion Status */}
          {currentStudent.promotionStatus && (
            <div
              className="mt-8 p-6 rounded-2xl border-2 flex items-center gap-4"
              style={{
                backgroundColor: currentStudent.promotionStatus === 'Promoted' || currentStudent.promotionStatus === 'Manually Promoted'
                  ? '#ecfdf5' : currentStudent.promotionStatus === 'Alumni' ? '#eff6ff' : '#fef2f2',
                borderColor: currentStudent.promotionStatus === 'Promoted' || currentStudent.promotionStatus === 'Manually Promoted'
                  ? '#86efac' : currentStudent.promotionStatus === 'Alumni' ? '#93c5fd' : '#fca5a5'
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: currentStudent.promotionStatus === 'Promoted' || currentStudent.promotionStatus === 'Manually Promoted'
                    ? '#dcfce7' : currentStudent.promotionStatus === 'Alumni' ? '#dbeafe' : '#fee2e2'
                }}
              >
                {currentStudent.promotionStatus === 'Promoted' || currentStudent.promotionStatus === 'Manually Promoted'
                  ? <TrendingUp className="w-6 h-6" style={{ color: '#16a34a' }} />
                  : currentStudent.promotionStatus === 'Alumni'
                    ? <GraduationCap className="w-6 h-6" style={{ color: '#2563eb' }} />
                    : <AlertCircle className="w-6 h-6" style={{ color: '#dc2626' }} />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{
                  color: currentStudent.promotionStatus === 'Promoted' || currentStudent.promotionStatus === 'Manually Promoted'
                    ? '#16a34a' : currentStudent.promotionStatus === 'Alumni' ? '#2563eb' : '#dc2626'
                }}>
                  {currentStudent.promotionStatus === 'Promoted' || currentStudent.promotionStatus === 'Manually Promoted'
                    ? `Promoted to ${currentStudent.promotedTo || 'Next Class'}`
                    : currentStudent.promotionStatus === 'Alumni'
                      ? 'Graduated — Alumni'
                      : 'Retained — Repeat Year'}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#71717a' }}>
                  Academic Year: {currentStudent.academicYear || '—'}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 border-t border-zinc-100 dark:border-zinc-800 mt-12">
            <div className="space-y-2">
              <div className="h-16 flex flex-col items-start justify-end w-48 border-b-2 border-zinc-400 pb-2">
                {organization?.signature && (
                  <img src={organization.signature} alt="Principal Signature" className="max-h-12 object-contain" />
                )}
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Principal Signature</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-zinc-900 dark:text-white mb-1 uppercase">{organization?.name || 'Springfield Academy'}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Report Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    );

    // If student is provided from props (likely the public view), don't wrap in Modal
    if (student) {
      return content;
    }

    return (
      <Modal isOpen={true} onClose={onClose} title={`Preview: ${template.name}`} maxWidth="max-w-[1000px]" maxHeight="max-h-[90vh]">
        {content}
      </Modal>
    );
};

const GradingLevelList = ({ initialLevels = [], onChange }: { initialLevels?: any[], onChange: (levels: any[]) => void }) => {
  const [levels, setLevels] = useState<any[]>(initialLevels.length > 0 ? initialLevels : [
    { grade: 'A', min_score: 90, max_score: 100, description: 'Excellent' },
    { grade: 'B', min_score: 80, max_score: 89, description: 'Very Good' },
    { grade: 'C', min_score: 70, max_score: 79, description: 'Good' },
    { grade: 'D', min_score: 60, max_score: 69, description: 'Pass' },
    { grade: 'F', min_score: 0, max_score: 59, description: 'Fail' }
  ]);

  useEffect(() => {
    onChange(levels);
  }, [levels]);

  const addLevel = () => {
    setLevels([...levels, { grade: '', min_score: 0, max_score: 0, description: '' }]);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const updateLevel = (index: number, field: string, value: any) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase text-zinc-500 tracking-wider">Grade Levels</h4>
        <button
          type="button"
          onClick={addLevel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Grade
        </button>
      </div>
      <div className="space-y-2">
        {levels.map((level, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-1">
            <div className="col-span-1 sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Grade</label>
              <input
                type="text"
                value={level.grade}
                onChange={(e) => updateLevel(index, 'grade', e.target.value)}
                placeholder="A"
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Min %</label>
              <input
                type="number"
                value={level.min_score}
                onChange={(e) => updateLevel(index, 'min_score', parseFloat(e.target.value))}
                placeholder="0"
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Max %</label>
              <input
                type="number"
                value={level.max_score}
                onChange={(e) => updateLevel(index, 'max_score', parseFloat(e.target.value))}
                placeholder="100"
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-1 sm:col-span-5 space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Comment / Description</label>
              <input
                type="text"
                value={level.description}
                onChange={(e) => updateLevel(index, 'description', e.target.value)}
                placeholder="Excellent"
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-1 sm:col-span-1 pt-1 sm:pt-5 flex justify-end">
              <button
                type="button"
                onClick={() => removeLevel(index)}
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                title="Remove Level"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdmissionsModules = {
  Inquiries: ({ data, onConvert, onSave, onDelete }: { data: Inquiry[], onConvert: (item: Inquiry) => void, onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const { t } = useLanguage();
    const [viewItem, setViewItem] = useState<Inquiry | null>(null);

    return (
      <>
        <DataTable<Inquiry>
          title="Student Inquiries"
          data={data}
          onSave={onSave}
          onDelete={onDelete}
          onView={setViewItem}
          detailsMaxWidth="max-w-4xl"
          renderDetails={(item) => (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Header Section */}
              <div className="relative p-8 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                    {item.profile_pic || item.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic ? (
                      <img src={item.profile_pic || item.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic} className="w-full h-full object-cover" />
                    ) : (
                      item.name.charAt(0)
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="space-y-4 flex-1 text-center md:text-left w-full">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{item.name}</h3>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className="px-4 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm flex items-center gap-2">
                        <GraduationCap className="w-3 h-3 text-indigo-500" />
                        {item.grade}
                      </span>
                      <span className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm flex items-center gap-2 border",
                        item.status === 'Converted' ? "bg-indigo-50/80 text-indigo-600 border-indigo-200/50 dark:bg-indigo-900/30 dark:border-indigo-800" : "bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800"
                      )}>
                        {item.status === 'Converted' ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {item.status || 'New'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                    <User className="w-3.5 h-3.5" /> Contact Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                      <div className="space-y-2 w-full">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                            <Users className="w-3 h-3" />
                          </span>
                          Primary Parent Name
                        </p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.parent_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                      <div className="space-y-2 w-full">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                            <Phone className="w-3 h-3" />
                          </span>
                          Primary Contact
                        </p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.contact || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-indigo-50/10 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/30 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                      <div className="space-y-2 w-full">
                        <p className="text-[10px] font-bold uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-white dark:bg-zinc-800 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Zap className="w-3 h-3" />
                          </span>
                          {t('religion')}
                        </p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 uppercase tracking-wider">{item.religion || 'N/A'}</p>
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mt-4">
                      <Users className="w-3.5 h-3.5" /> {t('secondary_parent_details')}
                    </h4>

                    <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                      <div className="space-y-2 w-full">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                            <Users className="w-3 h-3" />
                          </span>
                          {t('secondary_parent_name')}
                        </p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                      <div className="space-y-2 w-full">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                            <Phone className="w-3 h-3" />
                          </span>
                          {t('secondary_parent_contact')}
                        </p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_contact || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                      <div className="space-y-2 w-full">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                            <Mail className="w-3 h-3" />
                          </span>
                          {t('secondary_parent_email')}
                        </p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 truncate max-w-full">{item.secondary_parent_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Follow-up Notes
                  </h4>
                  <div className="space-y-4 max-h-[25rem] overflow-y-auto pr-2 scrollbar-none">
                    {item.comments && item.comments.length > 0 ? (
                      item.comments.map((comment) => (
                        <div key={comment.id} className="p-5 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-3 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                            <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">{comment.author}</span>
                            <span className="text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-lg">{new Date(comment.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center flex flex-col items-center justify-center space-y-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <MessageSquare className="w-10 h-10 text-zinc-300" />
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">No notes recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {item.status !== 'Converted' && (
                <div className="pt-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/50 to-transparent dark:from-zinc-900/50 pointer-events-none" />
                  <button
                    onClick={() => {
                      setViewItem(null);
                      onConvert(item);
                    }}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 dark:shadow-none"
                  >
                    <UserPlus className="w-4 h-4" /> Convert to Application
                  </button>
                </div>
              )}
            </div>
          )}
          renderForm={(item) => (
            <div className="space-y-10 max-w-2xl mx-auto py-4">
              {/* Student Portrait (Direct DB Storage) */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 dark:border-indigo-900/20 pb-2">Inquiry Lead Portrait</h4>
                <div className="flex flex-col items-center gap-6 p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-inner">
                  <div className="w-32 h-32 rounded-[2rem] bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
                    {(item as any)?.profile_pic || (item as any)?.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic ? (
                      <img src={(item as any)?.profile_pic || (item as any)?.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-zinc-400" />
                    )}
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block text-center">Capture Lead Photo</label>
                    <input
                      type="file"
                      name="previous_school_profile_pic"
                      accept="image/*"
                      className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Prospective Student</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Candidate Full Name</label>
                    <input type="text" name="name" defaultValue={item?.name} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-base outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-bold" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gender</label>
                      <select name="gender" defaultValue={item?.gender} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                      <input type="date" name="date_of_birth" defaultValue={item?.date_of_birth?.split('T')[0]} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Grade</label>
                      <input type="text" name="grade" defaultValue={item?.grade} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Previous School</label>
                      <input type="text" name="previous_school" defaultValue={item?.previous_school} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Entrance Exam Score</label>
                      <input type="text" name="entrance_exam_score" defaultValue={item?.entrance_exam_score} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Inquiry Date</label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Parent / Guardian Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Parent / Guardian Contact</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('religion')}</label>
                      <select name="religion" defaultValue={item?.religion} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="">Select Religion</option>
                        <option value="Christian">Christian</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Other">Other</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">{t('parent_guardian_details')}</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Parent Name</label>
                      <input type="text" name="parent_name" defaultValue={item?.parent_name} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Contact</label>
                      <input type="text" name="contact" defaultValue={item?.contact} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Email</label>
                      <input type="email" name="email" defaultValue={item?.email} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent Email</label>
                      <input type="email" name="parent_email" defaultValue={item?.parent_email} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Parent Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">{t('secondary_parent_details')}</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_name')}</label>
                    <input type="text" name="secondary_parent_name" defaultValue={item?.secondary_parent_name} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_email')}</label>
                      <input type="email" name="secondary_parent_email" defaultValue={item?.secondary_parent_email} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_contact')}</label>
                      <input type="text" name="secondary_parent_contact" defaultValue={item?.secondary_parent_contact} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Status & Notes */}
              <div className="space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="p-8 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-700 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block text-center mb-2">Lead Engagement Level</label>
                    <select
                      name="status"
                      defaultValue={item?.status || 'New'}
                      className="w-full px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white font-black text-center outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="New">New Lead</option>
                      <option value="Contacted">Active Engagement</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block text-center mb-2">Latest Interaction Note</label>
                    <textarea
                      name="new_comment"
                      placeholder="Type details of the last call or visit..."
                      className="w-full px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-28"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          columns={[
            { header: 'Student Name', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Grade', accessor: 'grade' },
            {
              header: 'Date',
              accessor: (item) => item.date ? new Date(item.date).toLocaleDateString() : 'N/A'
            },
            {
              header: 'Status',
              accessor: (item) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Contacted' ? "bg-emerald-50 text-emerald-600" :
                    item.status === 'Converted' ? "bg-indigo-50 text-indigo-600" :
                      "bg-zinc-50 text-zinc-600"
                )}>
                  {item.status || 'New'}
                </span>
              )
            },
          ]}
          extraActions={(item) => (
            item.status !== 'Converted' && (
              <button
                onClick={() => onConvert(item)}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Convert
              </button>
            )
          )}
          onAdd={onSave ? () => { } : undefined}
          onEdit={onSave ? () => { } : undefined}
        />

        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Inquiry Details"
          maxWidth="max-w-3xl"
          maxHeight="max-h-[85vh]"
        >
          {viewItem && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="relative p-7 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10" />
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                <div className="relative flex items-center gap-6 z-10">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {(viewItem as any).profile_pic || (viewItem as any).previous_school_profile_pic || (viewItem as any).previousSchoolProfilePic ? (
                      <img src={(viewItem as any).profile_pic || (viewItem as any).previous_school_profile_pic || (viewItem as any).previousSchoolProfilePic} className="w-full h-full object-cover" />
                    ) : viewItem.name.charAt(0)}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewItem.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-indigo-500" /> {viewItem.grade}
                      </span>
                      <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                        viewItem.status === 'Converted' ? "bg-indigo-50/80 text-indigo-600 border-indigo-200/50 dark:bg-indigo-900/30 dark:border-indigo-800" : "bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800"
                      )}>
                        <Activity className="w-3 h-3" /> {viewItem.status || 'New'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Contact Information
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Parent Name', value: viewItem.parent_name, icon: <Users className="w-3 h-3" /> },
                      { label: 'Phone', value: viewItem.contact, icon: <Phone className="w-3 h-3" /> },
                      { label: 'Student Email', value: viewItem.email, icon: <MessageSquare className="w-3 h-3" /> },
                      { label: 'Parent Email', value: viewItem.parent_email || (viewItem as any).parentEmail, icon: <Mail className="w-3 h-3" /> },
                      { label: 'Inquiry Date', value: viewItem.date ? new Date(viewItem.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', icon: <Calendar className="w-3 h-3" /> },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
                        <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors shrink-0">{icon}</span>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{label}</p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm truncate">{value || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-up History */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Follow-up History
                  </h4>
                  {viewItem.comments && viewItem.comments.length > 0 ? (
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {viewItem.comments.map((comment) => (
                        <div key={comment.id} className="p-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 space-y-2 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors shadow-sm">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                            <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">{comment.author}</span>
                            <span className="text-zinc-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <MessageSquare className="w-8 h-8 text-zinc-300" />
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest text-center">No notes recorded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {viewItem.status !== 'Converted' && (
                <button
                  onClick={() => { setViewItem(null); onConvert(viewItem); }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  <UserPlus className="w-4 h-4" /> Convert to Application
                </button>
              )}
            </div>
          )}
        </Modal>
      </>
    );
  },
  Applications: ({ data, feeStructures = [], onConvert, onSave, onDelete }: { data: Application[], feeStructures?: any[], onConvert: (item: Application) => void, onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const { t } = useLanguage();
    const [viewItem, setViewItem] = useState<Application | null>(null);
    const [dynamicScores, setDynamicScores] = useState<Array<{ subject: string, score: string }>>([]);
    const [activeFields, setActiveFields] = useState<Set<string>>(new Set());
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedFeeId, setSelectedFeeId] = useState<string>('');

    const availableExtras = [
      { id: 'previousSchool', label: 'Previous School', db: 'previous_school' },
      { id: 'previousGrade', label: 'Previous Grade', db: 'previous_grade' },
      { id: 'previousGPA', label: 'Previous GPA', db: 'previous_gpa' },
      { id: 'interviewScore', label: 'Interview Score', db: 'interview_score' },
    ];

    useEffect(() => {
      if (viewItem) {
        setSelectedGrade(viewItem.grade);
        const initialActiveFields = new Set<string>();
        availableExtras.forEach(extra => {
          if ((viewItem as any)?.[extra.id] || (viewItem as any)?.[extra.db]) {
            initialActiveFields.add(extra.id);
          }
        });
        setActiveFields(initialActiveFields);

        // Try to find a default fee
        const grade = viewItem.grade;
        const defaultFee = feeStructures.find(f =>
          f.name.toLowerCase().includes('entrance') ||
          f.name.toLowerCase().includes('admission') ||
          (grade && (f.name.toLowerCase().includes(grade.toLowerCase()) || grade.toLowerCase().includes(f.name.toLowerCase())))
        );
        if (defaultFee) setSelectedFeeId(defaultFee.id);
      }
    }, [viewItem, feeStructures]);

    const getFeeAmount = () => {
      if (selectedFeeId) {
        const fee = feeStructures.find(f => f.id === selectedFeeId);
        return fee ? fee.amount : '0.00';
      }
      const grade = selectedGrade || (viewItem?.grade || '');
      const fee = feeStructures.find(f =>
        f.name.toLowerCase().includes('entrance') ||
        f.name.toLowerCase().includes('admission') ||
        (grade && (f.name.toLowerCase().includes(grade.toLowerCase()) || grade.toLowerCase().includes(f.name.toLowerCase())))
      );
      return fee ? fee.amount : '0.00';
    };

    return (
      <>
        <DataTable<Application>
          title="Student Applications"
          data={data}
          onSave={onSave}
          onDelete={onDelete}
          onView={setViewItem}
          renderDetails={(item) => (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Header Section */}
              <div className="relative p-8 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                    {item.profile_pic || item.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic ? (
                      <img src={item.profile_pic || item.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic} className="w-full h-full object-cover" />
                    ) : (
                      item.name.charAt(0)
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="space-y-4 flex-1 text-center md:text-left w-full">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{item.name}</h3>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className="px-4 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm flex items-center gap-2">
                        <GraduationCap className="w-3 h-3 text-indigo-500" />
                        {item.grade}
                      </span>
                      <span className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm flex items-center gap-2 border",
                        item.status === 'Accepted' ? "bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800" : "bg-indigo-50/80 text-indigo-600 border-indigo-200/50 dark:bg-indigo-900/30 dark:border-indigo-800"
                      )}>
                        {item.status === 'Accepted' ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {item.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Student Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
                        <div className="space-y-1 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Gender</p>
                          <p className="font-black text-zinc-900 dark:text-white">{item.gender || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/50 flex justify-between items-center hover:border-indigo-200 transition-all shadow-sm group">
                        <div className="space-y-1 w-full">
                          <p className="text-[10px] font-bold uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Religion
                          </p>
                          <p className="font-black text-indigo-900 dark:text-white uppercase tracking-wider pl-5">{item.religion || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
                        <div className="space-y-1 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Date of Birth</p>
                          <p className="font-black text-zinc-900 dark:text-white">{item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 w-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-indigo-600/70 dark:text-indigo-400 tracking-widest flex items-center gap-2 mb-2">
                          <SchoolIcon className="w-3 h-3" /> Previous School
                        </p>
                        <p className="font-black text-indigo-900 dark:text-indigo-100 text-base">{item.previous_school || (item as any).previousSchool || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5" /> Entrance Performance
                    </h4>
                    <div className="relative group p-6 rounded-[2rem] bg-indigo-600 text-white overflow-hidden shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-[1.02] transition-transform duration-300">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors" />
                      <div className="relative z-10 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Overall Entrance Score</span>
                        <span className="text-3xl font-black">{item.entrance_exam_score || 'TBD'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {['math_score', 'english_score', 'science_score', 'interview_score'].map(f => (
                        (item as any)[f] && (
                          <div key={f} className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors shadow-sm">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{f.replace('_score', '').replace('_', ' ')}</span>
                            <span className="text-lg font-black text-zinc-900 dark:text-white">{(item as any)[f]}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Guardian & Contact
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Users className="w-3 h-3" />
                            </span>
                            Parent Name
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.parent_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Phone className="w-3 h-3" />
                            </span>
                            Contact Phone
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.contact || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <MessageSquare className="w-3 h-3" />
                            </span>
                            Student Email
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 truncate max-w-full">{item.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-indigo-50/10 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/30 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-indigo-600/70 dark:text-indigo-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-white dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Mail className="w-3 h-3" />
                            </span>
                            Parent Email
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 truncate max-w-full">{item.parent_email || (item as any).parentEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mt-4">
                      <Users className="w-3.5 h-3.5" /> {t('secondary_parent_details')}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Users className="w-3 h-3" />
                            </span>
                            {t('secondary_parent_name')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Phone className="w-3 h-3" />
                            </span>
                            {t('secondary_parent_contact')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_contact || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-indigo-50/10 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/30 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-indigo-600/70 dark:text-indigo-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-white dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Mail className="w-3 h-3" />
                            </span>
                            {t('secondary_parent_email')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 truncate max-w-full">{item.secondary_parent_email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.custom_scores && Object.keys(item.custom_scores).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" /> Additional Scores
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(item.custom_scores).map(([subject, score]) => (
                          <div key={subject} className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{subject}</span>
                            <span className="text-lg font-black text-zinc-900 dark:text-white">{score as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {item.status !== 'Accepted' && (
                <div className="pt-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/50 to-transparent dark:from-zinc-900/50 pointer-events-none" />
                  <button
                    onClick={() => {
                      setViewItem(null);
                      onConvert(item);
                    }}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 dark:shadow-none"
                  >
                    <ArrowRightCircle className="w-4 h-4" /> Finalize & Convert to Acceptance
                  </button>
                </div>
              )}
            </div>
          )}
          renderForm={(item) => (
            <div className="space-y-10 max-w-2xl mx-auto py-4">
              {/* Profile Picture Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 dark:border-indigo-900/20 pb-2">Student Portrait</h4>
                <div className="flex flex-col items-center gap-6 p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-inner">
                  <div className="w-32 h-32 rounded-[2rem] bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
                    {item?.profile_pic || item?.previous_school_profile_pic ? (
                      <img src={item.profile_pic || item.previous_school_profile_pic} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-zinc-400" />
                    )}
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block text-center">Upload Student Photo</label>
                    <input
                      type="file"
                      name="previous_school_profile_pic"
                      accept="image/*"
                      className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Personal Details</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Full Name</label>
                    <input type="text" name="name" defaultValue={item?.name} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-base outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gender</label>
                      <select name="gender" defaultValue={item?.gender} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                      <input type="date" name="date_of_birth" defaultValue={(item?.date_of_birth || (item as any)?.dateOfBirth)?.split('T')[0]} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('religion')}</label>
                      <select name="religion" defaultValue={item?.religion} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="">Select Religion</option>
                        <option value="Christian">Christian</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Other">Other</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Background */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Academic Background</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Grade / Class</label>
                    <input type="text" name="grade" defaultValue={item?.grade} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Previous School / Institution</label>
                    <input type="text" name="previous_school" defaultValue={item?.previous_school || (item as any)?.previousSchool} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Entrance Examination Score</label>
                    <input type="text" name="entrance_exam_score" defaultValue={item?.entrance_exam_score} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Parent / Guardian Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Guardian Contact</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Guardian Full Name</label>
                    <input type="text" name="parent_name" defaultValue={item?.parent_name} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone Number</label>
                      <input type="text" name="contact" defaultValue={item?.contact} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Email Address</label>
                      <input type="email" name="email" defaultValue={item?.email} placeholder="student@email.com" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent Email Address</label>
                      <input type="email" name="parent_email" defaultValue={item?.parent_email || (item as any)?.parentEmail} placeholder="parent@email.com" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">{t('secondary_parent_details')}</h4>
                    <div className="space-y-1.5 mb-4">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_name')}</label>
                      <input type="text" name="secondary_parent_name" defaultValue={item?.secondary_parent_name} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_email')}</label>
                        <input type="email" name="secondary_parent_email" defaultValue={item?.secondary_parent_email} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_contact')}</label>
                        <input type="text" name="secondary_parent_contact" defaultValue={item?.secondary_parent_contact} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="p-6 bg-zinc-900 dark:bg-zinc-950 rounded-[2rem] shadow-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block text-center mb-2">Internal Processing Status</label>
                    <select name="status" defaultValue={item?.status} className="w-full px-6 py-4 bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 rounded-2xl text-white font-black text-center outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                      <option value="Pending">Pending Review</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          columns={[
            { header: 'Student Name', accessor: 'name', className: 'font-bold' },
            { header: 'Grade', accessor: 'grade' },
            { header: 'Status', accessor: 'status' },
            { header: 'Decision', accessor: (item) => (item as any).decision || 'Pending' },
          ]}
          extraActions={(item) => (
            item.status !== 'Accepted' && (
              <button
                onClick={() => onConvert(item)}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
              >
                <ArrowRightCircle className="w-4 h-4" />
                Convert
              </button>
            )
          )}
          onAdd={onSave ? () => { } : undefined}
          onEdit={onSave ? () => { } : undefined}
        />

        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Application Details"
          maxWidth="max-w-3xl"
          maxHeight="max-h-[85vh]"
        >
          {viewItem && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="relative p-7 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-transparent dark:from-violet-500/10 dark:via-indigo-500/10" />
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />
                <div className="relative flex items-center gap-6 z-10">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-violet-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {viewItem.profile_pic || viewItem.previous_school_profile_pic || (viewItem as any)?.previousSchoolProfilePic ? (
                      <img src={viewItem.profile_pic || viewItem.previous_school_profile_pic || (viewItem as any)?.previousSchoolProfilePic} className="w-full h-full object-cover" />
                    ) : viewItem.name.charAt(0)}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewItem.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-violet-500" /> Grade {viewItem.grade}
                      </span>
                      <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                        viewItem.status === 'Accepted' ? "bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800" : "bg-zinc-50/80 text-zinc-500 border-zinc-200/50 dark:bg-zinc-800/80 dark:border-zinc-700"
                      )}>
                        <CheckCircle2 className="w-3 h-3" /> {viewItem.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Contact & Status */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Contact & Status
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Parent Name', value: viewItem.parent_name },
                      { label: 'Phone', value: viewItem.contact || (viewItem as any)?.parentPhone || (viewItem as any)?.parent_phone },
                      { label: 'Email', value: viewItem.email || (viewItem as any)?.parentEmail || (viewItem as any)?.parent_email },
                      { label: 'Religion', value: viewItem.religion },
                      { label: 'Decision', value: (viewItem as any)?.decision || 'Pending' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-900/50 transition-all shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{label}</p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm mt-1 truncate">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Secondary Parent Information */}
                  <h4 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] flex items-center gap-2 mt-6">
                    <Users className="w-3.5 h-3.5" /> Secondary Guardian
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Secondary Name', value: viewItem.secondary_parent_name },
                      { label: 'Secondary Contact', value: viewItem.secondary_parent_contact },
                      { label: 'Secondary Email', value: viewItem.secondary_parent_email },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-900/50 transition-all shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{label}</p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm mt-1 truncate">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Academic Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Academic Details
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Gender', value: viewItem.gender },
                      { label: 'Date of Birth', value: (viewItem.date_of_birth || (viewItem as any)?.dateOfBirth) ? new Date(viewItem.date_of_birth || (viewItem as any)?.dateOfBirth).toLocaleDateString('en-GB') : undefined },
                      { label: 'Entrance Exam Score', value: viewItem.entrance_exam_score || (viewItem as any)?.entranceExamScore },
                      { label: 'Previous School', value: viewItem.previous_school || (viewItem as any)?.previousSchool },
                    ].filter(item => item.value).map(({ label, value }) => (
                      <div key={label} className="p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-900/50 transition-all shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{label}</p>
                        <p className="font-black text-zinc-900 dark:text-white text-sm mt-1 truncate">{value}</p>
                      </div>
                    ))}
                    {Object.entries(viewItem.custom_scores || {}).map(([subject, score]) => (
                      <div key={subject} className="p-4 rounded-[1.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-widest">{subject}</p>
                        <p className="font-black text-indigo-700 dark:text-indigo-300 text-sm mt-1">{score as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </>
    );
  },
  Acceptance: ({ data, classes = [], feeStructures = [], onConvert, onSave, onDelete, title = "Admission Acceptance", showBulkActions = false }: { data: Acceptance[], classes?: any[], feeStructures?: any[], onConvert: (item: Acceptance) => void, onSave?: (data: any) => void, onDelete?: (item: any) => void, title?: string, showBulkActions?: boolean }) => {
    const { currency } = useLanguage();
    const { t } = useLanguage();
    const [viewItem, setViewItem] = useState<Acceptance | null>(null);
    const [importPreviewItems, setImportPreviewItems] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [dynamicScores, setDynamicScores] = useState<Array<{ subject: string, score: string }>>([]);
    const [activeFields, setActiveFields] = useState<Set<string>>(new Set());
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const availableExtras = [
      { id: 'previousSchool', label: 'Previous School', db: 'previous_school' },
      { id: 'previousGrade', label: 'Previous Grade', db: 'previous_grade' },
      { id: 'previousGPA', label: 'Previous GPA', db: 'previous_gpa' },
      { id: 'interviewScore', label: 'Interview Score', db: 'interview_score' },
    ];

    useEffect(() => {
      if (viewItem) {
        setSelectedGrade(viewItem.grade);
        setSelectedClassId(viewItem.class_id || (viewItem as any).class || '');
        const initialActiveFields = new Set<string>();
        availableExtras.forEach(extra => {
          if ((viewItem as any)?.[extra.id] || (viewItem as any)?.[extra.db]) {
            initialActiveFields.add(extra.id);
          }
        });
        setActiveFields(initialActiveFields);

        // Try to find a default fee
        const grade = viewItem.grade;
        const defaultFee = feeStructures.find(f =>
          f.name.toLowerCase().includes('entrance') ||
          f.name.toLowerCase().includes('admission') ||
          (grade && (f.name.toLowerCase().includes(grade.toLowerCase()) || grade.toLowerCase().includes(f.name.toLowerCase())))
        );
        if (defaultFee) setSelectedFeeIds([defaultFee.id]);
        else setSelectedFeeIds([]);
      }
    }, [viewItem]);

    useEffect(() => {
      if (selectedClassId) {
        const classFees = feeStructures.filter(f => f.class_id === selectedClassId);
        if (classFees.length > 0) {
          setSelectedFeeIds(classFees.map(f => f.id));
        } else {
          setSelectedFeeIds([]);
        }
      }
    }, [selectedClassId, feeStructures]);

    const getFeeAmount = () => {
      if (selectedFeeIds.length > 0) {
        const total = selectedFeeIds.reduce((sum, id) => {
          const fee = feeStructures.find(f => f.id === id);
          return sum + (fee ? parseFloat(fee.amount) : 0);
        }, 0);
        return total.toFixed(2);
      }
      const grade = selectedGrade || (viewItem?.grade || '');
      const fee = feeStructures.find(f =>
        f.name.toLowerCase().includes('entrance') ||
        f.name.toLowerCase().includes('admission') ||
        (grade && (f.name.toLowerCase().includes(grade.toLowerCase()) || grade.toLowerCase().includes(f.name.toLowerCase())))
      );
      return fee ? fee.amount : '0.00';
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        const records = await parseStudentExcel(file, classes);
        setImportPreviewItems(records);
      } catch (err) {
        (window as any).showToast?.('Could not read the Excel file. Please use the provided template.', 'error');
      } finally {
        setIsImporting(false);
        e.target.value = ''; // Reset input
      }
    };

    const confirmBulkEnrollment = async () => {
      if (!onSave) return;

      const studentsToEnroll = importPreviewItems.filter(s => s.name && s.class_id);
      if (studentsToEnroll.length === 0) {
        (window as any).showToast?.('No valid students found to enroll.', 'warning');
        return;
      }

      setIsImporting(true);
      try {
        let successCount = 0;
        for (const student of studentsToEnroll) {
          // Find first matching fee for the class if not specified
          const classFees = feeStructures.filter(f => f.class_id === student.class_id);
          const feeIds = classFees.length > 0 ? classFees.map(f => f.id) : [];
          const totalAmount = classFees.reduce((sum, f) => sum + parseFloat(f.amount), 0).toFixed(2);

          const enrollmentData = {
            ...student,
            fee_ids: feeIds,
            fee_amount: totalAmount,
            decision: 'Enrolled'
          };
          delete enrollmentData.id; // Remove temp ID
          delete enrollmentData.class_name;

          await onSave(enrollmentData);
          successCount++;
        }
        (window as any).showToast?.(`Successfully enrolled ${successCount} students!`, 'success');
        setImportPreviewItems([]);
      } catch (err) {
        (window as any).showToast?.('Some students failed to enroll. Please refresh and check.', 'error');
      } finally {
        setIsImporting(false);
      }
    };

    return (
      <>
        {showBulkActions && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Bulk Enrollment</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Enroll multiple students at once via Excel</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => downloadStudentTemplate(classes)}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>

              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={isImporting}
                />
                <div className={cn(
                  "flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all group-hover:bg-indigo-700 active:scale-95",
                  isImporting && "opacity-50 cursor-not-allowed"
                )}>
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Import from Excel
                </div>
              </label>
            </div>
          </div>
        )}

        <DataTable<Acceptance>
          title={title}
          data={data}
          onSave={onSave}
          onDelete={onDelete}
          onView={setViewItem}
          renderDetails={(item) => (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Header Section */}
              <div className="relative p-8 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                    {item.profile_pic || item.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic ? (
                      <img src={item.profile_pic || item.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic} className="w-full h-full object-cover" />
                    ) : (
                      item.name.charAt(0)
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="space-y-4 flex-1 text-center md:text-left w-full">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{item.name}</h3>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className="px-4 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm flex items-center gap-2">
                        <GraduationCap className="w-3 h-3 text-indigo-500" />
                        {item.grade}
                      </span>
                      <span className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm flex items-center gap-2 border",
                        item.decision === 'Enrolled' ? "bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800" : "bg-indigo-50/80 text-indigo-600 border-indigo-200/50 dark:bg-indigo-900/30 dark:border-indigo-800"
                      )}>
                        {item.decision === 'Enrolled' ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {item.decision || 'Accepted'}
                      </span>
                      <span className="px-4 py-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm flex items-center gap-2">
                        <Fingerprint className="w-3 h-3 text-zinc-400" />
                        ID: {item.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Financial Summary
                    </h4>
                    <div className="relative group p-8 rounded-[2rem] bg-zinc-900 dark:bg-black text-white hover:bg-zinc-800 dark:hover:bg-zinc-900 transition-colors shadow-2xl shadow-zinc-200 dark:shadow-none overflow-hidden">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-colors" />
                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-400 uppercase tracking-widest">Total Admission Fees</span>
                          <span className="text-3xl font-black text-white">{currency} {item.fee_amount || (item as any)?.feeAmount || '0.00'}</span>
                        </div>
                        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enrollment Status</span>
                          <span className={cn(
                            "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest",
                            item.decision === 'Enrolled' ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                          )}>{item.decision || 'Accepted'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" /> Academic Placement
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <div className="space-y-1 w-full">
                          <p className="text-[10px] font-bold uppercase text-indigo-600/70 dark:text-indigo-400 tracking-widest flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Assigned Class
                          </p>
                          <p className="font-black text-indigo-900 dark:text-indigo-100 text-lg">
                            {classes.find(c => c.id === item.class_id || c.id === (item as any)?.class)?.name || 'Needs Assignment'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center items-center shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Entrance Score</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-white">{item.entrance_exam_score || 'N/A'}</span>
                        </div>
                        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center items-center shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Gender</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-white">{item.gender || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> {t('parent_guardian_details')}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Users className="w-3 h-3" />
                            </span>
                            {t('primary_parent_name')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.parent_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Phone className="w-3 h-3" />
                            </span>
                            {t('primary_parent_contact')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.contact || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <MessageSquare className="w-3 h-3" />
                            </span>
                            Student Email
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 truncate max-w-full">{item.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-indigo-50/10 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/30 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-indigo-600/70 dark:text-indigo-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-white dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Mail className="w-3 h-3" />
                            </span>
                            Parent Email
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 truncate max-w-full">{item.parent_email || (item as any).parentEmail || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-indigo-50/10 dark:bg-indigo-900/10 border border-indigo-100/30 flex justify-between items-center group transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-white dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Zap className="w-3 h-3" />
                            </span>
                            {t('religion')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 uppercase tracking-wider">{item.religion || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mt-6">
                      <Users className="w-3.5 h-3.5" /> {t('secondary_parent_details')}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Users className="w-3 h-3" />
                            </span>
                            {t('secondary_parent_name')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Phone className="w-3 h-3" />
                            </span>
                            {t('secondary_parent_contact')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_contact || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Mail className="w-3" />
                            </span>
                            {t('secondary_parent_email')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 truncate max-w-full">{item.secondary_parent_email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(item.interview_score || item.interviewScore) && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Interview Notes
                      </h4>
                      <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 shadow-sm relative overflow-hidden group hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl group-hover:bg-amber-500/20 transition-colors" />
                        <p className="relative z-10 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium italic">
                          "{item.interview_score || item.interviewScore}"
                        </p>
                      </div>
                    </div>
                  )}

                  {item.custom_scores && Object.keys(item.custom_scores).length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(item.custom_scores).map(([subject, score]) => (
                        <div key={subject} className="p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{subject}</span>
                          <span className="text-sm font-black text-zinc-900 dark:text-white">{score as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {item.decision !== 'Enrolled' && (
                <div className="pt-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/50 to-transparent dark:from-zinc-900/50 pointer-events-none" />
                  <button
                    onClick={() => {
                      if (!selectedClassId && !item.class_id && !(item as any).class) {
                        (window as any).showToast?.("Please assign a class before enrollment.", "error");
                        return;
                      }
                      const finalFees = selectedFeeIds.length > 0 ? selectedFeeIds : [];
                      if (finalFees.length === 0) {
                        (window as any).showToast?.("Please select at least one admission fee.", "error");
                        return;
                      }

                      setViewItem(null);
                      onConvert({
                        ...item,
                        class_id: selectedClassId || item.class_id || (item as any).class,
                        fee_ids: finalFees,
                        fee_amount: getFeeAmount()
                      });
                    }}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 dark:shadow-none"
                  >
                    <ArrowRight className="w-4 h-4" /> Complete Enrollment & Create Student Record
                  </button>
                </div>
              )}
            </div>
          )}
          renderForm={(item) => (
            <div className="space-y-12 max-w-2xl mx-auto py-6">
              {/* Student Portrait (Direct DB Storage) */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 dark:border-indigo-900/20 pb-2">Verified Student Portrait</h4>
                <div className="flex flex-col items-center gap-8 p-10 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-[3rem] border border-indigo-100/50 dark:border-indigo-800/50 shadow-inner group">
                  <div className="w-40 h-40 rounded-[2.5rem] bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-700 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    {item?.profile_pic || item?.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic ? (
                      <img src={item?.profile_pic || item?.previous_school_profile_pic || (item as any)?.previousSchoolProfilePic} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-indigo-200 dark:text-indigo-900" />
                    )}
                  </div>
                  <div className="w-full space-y-3 text-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Required for Student ID Card</p>
                    <input
                      type="file"
                      name="previous_school_profile_pic"
                      accept="image/*"
                      className="w-full text-xs text-zinc-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Identity Verification</h4>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Legal Name</label>
                    <input type="text" name="name" defaultValue={item?.name} className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-lg font-black text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                      <input type="date" name="date_of_birth" defaultValue={(item?.date_of_birth || (item as any)?.dateOfBirth)?.split('T')[0]} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gender</label>
                      <select name="gender" defaultValue={item?.gender} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('religion')}</label>
                      <select name="religion" defaultValue={item?.religion} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="">Select Religion</option>
                        <option value="Christian">Christian</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Other">Other</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Previous Institution</label>
                    <input type="text" name="previous_school" defaultValue={item?.previous_school || (item as any)?.previousSchool} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Admission & Academic Placement */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 dark:border-indigo-900/20 pb-2">Admission & Academic Placement</h4>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Admission Status</label>
                      <select name="decision" defaultValue={item?.decision || 'Enrolled'} className="w-full px-5 py-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="Accepted">Accepted</option>
                        <option value="Waitlisted">Waitlisted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Enrolled">Enrolled</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assigned Class/Grade</label>
                      <select
                        name="class_id"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls: any) => (
                          <option key={cls.id} value={cls.id}>{cls.name} {cls.section}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Obligations */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100 dark:border-amber-900/20 pb-2">Financial Obligations</h4>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Applicable Admission Fees</label>
                    <div className="grid grid-cols-1 gap-3 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 max-h-56 overflow-y-auto custom-scrollbar">
                      {feeStructures.map((fee: any) => (
                        <label key={fee.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white dark:hover:bg-zinc-800 cursor-pointer group transition-all border border-transparent hover:border-indigo-100 shadow-sm hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              name="fee_ids"
                              value={fee.id}
                              checked={selectedFeeIds.includes(fee.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedFeeIds(prev => [...prev, fee.id]);
                                else setSelectedFeeIds(prev => prev.filter(id => id !== fee.id));
                              }}
                              className="w-5 h-5 rounded-lg border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{fee.name}</span>
                          </div>
                          <span className="text-xs font-black text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">{currency} {parseFloat(fee.amount).toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Computed Total Fee</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="fee_amount"
                          value={getFeeAmount()}
                          readOnly
                          className="w-full px-5 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-xl font-black text-amber-700 text-center outline-none shadow-sm"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CreditCard className="w-5 h-5 text-amber-500 opacity-50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent / Guardian Details */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 dark:border-indigo-900/20 pb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Parent / Guardian Details
                </h4>
                <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/5 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent / Guardian Full Name *</label>
                    <input required type="text" name="parent_name" defaultValue={item?.parent_name} placeholder="e.g. Mr. James Doe" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent Phone Number *</label>
                      <input required type="tel" name="contact" defaultValue={item?.contact} placeholder="e.g. 0244123456" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Email Address</label>
                      <input type="email" name="email" defaultValue={item?.email} placeholder="student@email.com" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent Email Address</label>
                      <input type="email" name="parent_email" defaultValue={item?.parent_email} placeholder="parent@email.com" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/20 space-y-4">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('secondary_parent_details')}</h5>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_name')}</label>
                      <input type="text" name="secondary_parent_name" defaultValue={item?.secondary_parent_name} placeholder="e.g. Mrs. Mary Doe" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_contact')}</label>
                        <input type="tel" name="secondary_parent_contact" defaultValue={item?.secondary_parent_contact} placeholder="e.g. 0244987654" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_email')}</label>
                        <input type="email" name="secondary_parent_email" defaultValue={item?.secondary_parent_email} placeholder="secondary@email.com" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          columns={[
            { header: 'Student Name', accessor: 'name', className: 'font-bold' },
            { header: 'Grade', accessor: 'grade' },
            {
              header: 'Assigned Class',
              accessor: (item) => {
                const cls = classes.find(c => c.id === item.class_id || c.id === (item as any)?.class);
                return cls ? `${cls.name} ${cls.section || ''}`.trim() : 'Not Assigned';
              }
            },
            { header: 'Admission Total', accessor: (item) => `${currency} ${item.fee_amount || (item as any)?.feeAmount || '0.00'}` },
          ]}
          extraActions={(item) => (
            item.decision !== 'Enrolled' && (
              <button
                onClick={() => {
                  const classId = item.class_id || (item as any).class;
                  const feeAmount = item.fee_amount || (item as any).feeAmount;

                  if (!classId) {
                    (window as any).showToast?.("Please assign a class first (Edit this record).", "error");
                    return;
                  }
                  if (!feeAmount || feeAmount <= 0) {
                    (window as any).showToast?.("Please select admission fees first (Edit this record).", "error");
                    return;
                  }

                  setViewItem(null);
                  onConvert(item);
                }}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Enroll
              </button>
            )
          )}
          onAdd={onSave ? () => { } : undefined}
          onEdit={onSave ? () => { } : undefined}
        />

        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Acceptance Details"
          maxWidth="max-w-4xl"
          maxHeight="max-h-[85vh]"
        >
          {viewItem && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Header Section */}
              <div className="relative p-8 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                    {(viewItem as any).profile_pic || (viewItem as any).previous_school_profile_pic || (viewItem as any).previousSchoolProfilePic ? (
                      <img src={(viewItem as any).profile_pic || (viewItem as any).previous_school_profile_pic || (viewItem as any).previousSchoolProfilePic} className="w-full h-full object-cover" />
                    ) : (
                      viewItem.name.charAt(0)
                    )}
                  </div>

                  <div className="space-y-4 flex-1 text-center md:text-left w-full">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewItem.name}</h3>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className="px-4 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm flex items-center gap-2">
                        <GraduationCap className="w-3 h-3 text-indigo-500" />
                        {viewItem.grade} {viewItem.section ? `- ${viewItem.section}` : ''}
                      </span>
                      <span className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm flex items-center gap-2 border",
                        viewItem.decision === 'Enrolled' ? "bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800" : "bg-indigo-50/80 text-indigo-600 border-indigo-200/50 dark:bg-indigo-900/30 dark:border-indigo-800"
                      )}>
                        {viewItem.decision === 'Enrolled' ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {viewItem.decision || 'Accepted'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Financial Summary
                    </h4>
                    <div className="relative group p-8 rounded-[2rem] bg-zinc-900 dark:bg-black text-white hover:bg-zinc-800 dark:hover:bg-zinc-900 transition-colors shadow-2xl overflow-hidden">
                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-400 uppercase tracking-widest">Enrollment Fee Total</span>
                          <span className="text-3xl font-black text-white">{currency} {viewItem.fee_amount || (viewItem as any).feeAmount || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" /> Academic Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
                        <div className="space-y-1 w-full">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Assigned Class</p>
                          <p className="font-black text-zinc-900 dark:text-white">
                            {classes.find(c => c.id === viewItem.class_id)?.name || viewItem.class || 'Not Assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 shadow-sm">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Entrance Score</span>
                          <span className="text-xl font-black text-zinc-900 dark:text-white">{viewItem.entrance_exam_score || 'N/A'}</span>
                        </div>
                        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 shadow-sm">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Previous School</span>
                          <span className="text-sm font-black text-zinc-900 dark:text-white truncate">{viewItem.previous_school || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Personal & Contact
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Parent Name', value: viewItem.parent_name, icon: <Users className="w-3 h-3" /> },
                        { label: 'Contact Phone', value: viewItem.contact || (viewItem as any).parentPhone, icon: <Phone className="w-3 h-3" /> },
                        { label: 'Email Address', value: viewItem.email, icon: <MessageSquare className="w-3 h-3" /> },
                        { label: 'Gender', value: viewItem.gender, icon: <UserCircle className="w-3 h-3" /> },
                        { label: 'Religion', value: viewItem.religion, icon: <Zap className="w-3 h-3" /> },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="p-5 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
                          <span className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors shrink-0">{icon}</span>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{label}</p>
                            <p className="font-black text-zinc-900 dark:text-white text-sm truncate">{value || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mt-6">
                      <Users className="w-3.5 h-3.5" /> Secondary Guardian Details
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Secondary Name', value: viewItem.secondary_parent_name, icon: <Users className="w-3" /> },
                        { label: 'Secondary Contact', value: viewItem.secondary_parent_contact, icon: <Phone className="w-3" /> },
                        { label: 'Secondary Email', value: viewItem.secondary_parent_email, icon: <Mail className="w-3" /> },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="p-5 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm">
                          <span className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors shrink-0">{icon}</span>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{label}</p>
                            <p className="font-black text-zinc-900 dark:text-white text-sm truncate">{value || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {viewItem.decision !== 'Enrolled' && (
                <button
                  onClick={() => { setViewItem(null); onConvert(viewItem); }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  <ArrowRight className="w-4 h-4" /> Enroll & Create Student record
                </button>
              )}
            </div>
          )}
        </Modal>

        <Modal
          isOpen={importPreviewItems.length > 0}
          onClose={() => setImportPreviewItems([])}
          title="Review Student Import"
          maxWidth="max-w-5xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase">Verification Required</p>
                <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-400">Please review the detected records below. Rows with missing classes cannot be enrolled.</p>
              </div>
            </div>

            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Student Name</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Admission No</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Detected Class</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {importPreviewItems.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-bold">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-500">{item.admission_no}</td>
                      <td className="px-4 py-3">
                        {item.class_id ? (
                          <span className="text-emerald-600 font-bold">{item.class_name}</span>
                        ) : (
                          <span className="text-rose-500 font-bold italic">Class not found: "{item.class_name}"</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.class_id ? (
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Ready</span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-[10px] font-black uppercase">Error</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setImportPreviewItems([])}
                className="flex-1 py-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkEnrollment}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                disabled={isImporting || !importPreviewItems.some(s => s.class_id)}
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Enroll {importPreviewItems.filter(s => s.class_id).length} Students
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

export const AdmitStudentView = ({
  classes = [],
  feeStructures = [],
  students = [],
  inquiries = [],
  preselectedInquiry = null,
  onNavigate,
  onAdmit,
  onSaveEnquiry,
}: {
  classes?: any[];
  feeStructures?: any[];
  students?: any[];
  inquiries?: any[];
  preselectedInquiry?: any;
  onNavigate?: (view: string) => void;
  onAdmit: (data: any) => void;
  onSaveEnquiry?: (data: any) => void;
}) => {
  const { t, currency } = useLanguage();
  const [activeTab, setActiveTab] = useState<'admit' | 'bulk'>('admit');
  const [editingInquiry, setEditingInquiry] = useState<any>(preselectedInquiry);
  const [purpose, setPurpose] = useState<'admit' | 'enquiry'>(preselectedInquiry ? 'enquiry' : 'admit');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [importPreviewItems, setImportPreviewItems] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [enrollModalItem, setEnrollModalItem] = useState<any>(null);
  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollFeeIds, setEnrollFeeIds] = useState<string[]>([]);

  // Sync editingInquiry when preselectedInquiry changes (e.g. from View All -> Convert)
  useEffect(() => {
    if (preselectedInquiry) {
      setEditingInquiry(preselectedInquiry);
      setPurpose('enquiry');
    }
  }, [preselectedInquiry]);

  useEffect(() => {
    if (enrollClassId) {
      const classFees = feeStructures.filter(f => f.class_id === enrollClassId);
      if (classFees.length > 0) setEnrollFeeIds(classFees.map(f => f.id));
      else setEnrollFeeIds([]);
    }
  }, [enrollClassId, feeStructures]);

  const handleEnrollModalSubmit = async () => {
    if (!enrollModalItem || !enrollClassId) return;
    const totalFees = enrollFeeIds.reduce((sum, id) => {
      const fee = feeStructures.find(f => f.id === id);
      return sum + (fee ? parseFloat(fee.amount) : 0);
    }, 0).toFixed(2);

    setIsSubmitting(true);
    try {
      await onAdmit({
        ...enrollModalItem,
        class_id: enrollClassId,
        fee_ids: enrollFeeIds,
        fee_amount: totalFees,
        decision: 'Enrolled',
        date_enrolled: new Date().toISOString().split('T')[0]
      });
      (window as any).showToast?.('Student enrolled successfully!', 'success');
      setEnrollModalItem(null);
    } catch (err: any) {
      (window as any).showToast?.(err, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        (window as any).showToast?.('Image is too large. Max 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePic(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  // Auto-select fees when class changes
  useEffect(() => {
    if (selectedClassId) {
      const classFees = feeStructures.filter(f => f.class_id === selectedClassId);
      if (classFees.length > 0) {
        setSelectedFeeIds(classFees.map(f => f.id));
      } else {
        setSelectedFeeIds([]);
      }
    }
  }, [selectedClassId, feeStructures]);

  const getTotalFees = () => {
    return selectedFeeIds.reduce((sum, id) => {
      const fee = feeStructures.find(f => f.id === id);
      return sum + (fee ? parseFloat(fee.amount) : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: any = {};
    fd.forEach((val, key) => { data[key] = val; });

    if (purpose === 'admit') {
      if (!selectedClassId) {
        (window as any).showToast?.('Please select a class.', 'error');
        return;
      }
      data.class_id = selectedClassId;
      data.fee_ids = selectedFeeIds;
      data.fee_amount = getTotalFees();
      data.date_enrolled = new Date().toISOString().split('T')[0];
    }

    if (profilePic) {
      data.profile_pic = profilePic;
    }


    setIsSubmitting(true);
    try {
      if (purpose === 'enquiry') {
        onSaveEnquiry?.({ ...data, id: editingInquiry?.id });
        setEditingInquiry(null);
        (window as any).showToast?.(`Enquiry for ${data.name} saved.`, 'success');
      } else {
        await onAdmit({ ...data, source_inquiry_id: editingInquiry?.id });
      }
      form.reset();
      setSelectedClassId('');
      setSelectedFeeIds([]);
      setShowOptional(false);
      setProfilePic(null);
    } catch (err: any) {
      (window as any).showToast?.(err, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const { parseStudentExcel } = await import('../../lib/excel');
      const parsed = await parseStudentExcel(file, classes);
      setImportPreviewItems(parsed);
    } catch (err: any) {
      (window as any).showToast?.('Could not read the Excel file. Please check the format.', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const confirmBulkAdmit = async () => {
    if (!importPreviewItems.length) return;
    setIsImporting(true);
    try {
      const valid = importPreviewItems.filter(s => s.class_id);
      for (const item of valid) {
        await onAdmit({ ...item, date_enrolled: new Date().toISOString().split('T')[0] });
      }
      (window as any).showToast?.(`Successfully admitted ${valid.length} students!`, 'success');
      setImportPreviewItems([]);
    } catch (err) {
      (window as any).showToast?.('Something went wrong during bulk admission. Please try again.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const todayAdmitted = students.filter(s => s.date_enrolled === new Date().toISOString().split('T')[0]).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none">
                <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Admit Student</h1>
                <p className="text-zinc-500 font-bold text-sm md:text-base">Enrol new students or save enquiries for follow-up.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Today</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{todayAdmitted}</p>
              </div>
              <div className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl text-center">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{students.length}</p>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl w-full sm:w-fit mt-8 border border-zinc-200/50 dark:border-zinc-700/50">
            <button
              onClick={() => setActiveTab('admit')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                activeTab === 'admit'
                  ? "bg-white text-indigo-600 shadow-md dark:bg-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50 dark:hover:bg-zinc-900/50"
              )}
            >
              Admit One
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                activeTab === 'bulk'
                  ? "bg-white text-indigo-600 shadow-md dark:bg-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50 dark:hover:bg-zinc-900/50"
              )}
            >
              Bulk Import
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'admit' ? (
        <form key={editingInquiry?.id || 'new'} onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {editingInquiry && (
            <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-indigo-600" />
                <p className="text-sm font-black text-indigo-900 dark:text-white uppercase tracking-widest">Editing Enquiry: {editingInquiry.name}</p>
              </div>
              <button type="button" onClick={() => setEditingInquiry(null)} className="text-xs font-black text-rose-600 uppercase tracking-widest hover:text-rose-800 transition-colors">Cancel Edit</button>
            </div>
          )}
          {/* Purpose Toggle */}
          <div className="flex flex-wrap items-center gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-full sm:w-fit">
            <button type="button" onClick={() => setPurpose('admit')} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", purpose === 'admit' ? "bg-indigo-600 text-white shadow-md" : "text-zinc-500 hover:text-zinc-700")}>
              Admit Now
            </button>
            <button type="button" onClick={() => setPurpose('enquiry')} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", purpose === 'enquiry' ? "bg-amber-500 text-white shadow-md" : "text-zinc-500 hover:text-zinc-700")}>
              Enquiry Only
            </button>
          </div>

          {purpose === 'enquiry' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Enquiry mode — student will NOT be enrolled. Details are saved for follow-up.</p>
            </div>
          )}

          {/* Student Details Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900/20 pb-2">
              <User className="w-3.5 h-3.5" /> Student Details
            </h3>

            {/* Profile Picture Upload Section */}
            <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-700">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-indigo-200 transition-all">
                  {profilePic ? (
                    <img src={profilePic} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-zinc-200" />
                  )}
                </div>
                {profilePic && (
                  <button
                    type="button"
                    onClick={() => setProfilePic(null)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white">Student Photograph</h4>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">PNG, JPG or JPEG. Max 2MB.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <label className="cursor-pointer px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    Choose Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  {profilePic && (
                    <button
                      type="button"
                      onClick={() => setProfilePic(null)}
                      className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name *</label>
                <input required type="text" name="name" defaultValue={editingInquiry?.name || ''} placeholder="e.g. John Doe" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gender</label>
                <select name="gender" defaultValue={editingInquiry?.gender || ''} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                <input type="date" name="date_of_birth" defaultValue={editingInquiry?.date_of_birth?.split('T')[0] || editingInquiry?.dateOfBirth?.split('T')[0] || ''} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('religion')}</label>
                <select name="religion" defaultValue={editingInquiry?.religion || ''} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                  <option value="">Select Religion</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Other">Other</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Email</label>
                <input type="email" name="email" defaultValue={editingInquiry?.email || editingInquiry?.student_email || ''} placeholder="student@email.com" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {purpose === 'enquiry' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Grade / Class</label>
                  <select name="grade" defaultValue={editingInquiry?.grade || ''} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                    <option value="">Select grade...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>)}
                    {!classes.some(c => c.id === editingInquiry?.grade) && editingInquiry?.grade && <option value={editingInquiry.grade}>{editingInquiry.grade}</option>}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Class Assignment & Fees — only shown in Admit mode */}
          {purpose === 'admit' && (
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900/20 pb-2">
                <GraduationCap className="w-3.5 h-3.5" /> Class & Fees
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assign to Class *</label>
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>)}
                    {purpose === 'enquiry' && editingInquiry?.grade && <option value="manual">{editingInquiry.grade}</option>}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fee Status</label>
                  <select name="fee_status" defaultValue="Pending" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>
              {feeStructures.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Admission Fees</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {feeStructures.filter(f => !selectedClassId || f.class_id === selectedClassId || !f.class_id).map(fee => (
                      <label key={fee.id} className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md",
                        selectedFeeIds.includes(fee.id) ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                      )}>
                        <input type="checkbox" checked={selectedFeeIds.includes(fee.id)} onChange={(e) => {
                          if (e.target.checked) setSelectedFeeIds(prev => [...prev, fee.id]);
                          else setSelectedFeeIds(prev => prev.filter(id => id !== fee.id));
                        }} className="w-4 h-4 rounded text-indigo-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{fee.name}</p>
                          <p className="text-xs text-zinc-500">{currency} {parseFloat(fee.amount).toLocaleString()}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedFeeIds.length > 0 && (
                    <div className="p-4 bg-zinc-900 dark:bg-black rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Admission Fees</span>
                      <span className="text-2xl font-black text-white">{currency} {getTotalFees().toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Parent / Guardian Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900/20 pb-2">
              <Users className="w-3.5 h-3.5" /> Parent / Guardian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent / Guardian Name {purpose === 'admit' ? '*' : ''}</label>
                <input type="text" name="parent_name" defaultValue={editingInquiry?.parent_name || editingInquiry?.parentName || ''} required={purpose === 'admit'} placeholder="e.g. Mr. James Doe" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent Phone</label>
                <input type="tel" name="contact" defaultValue={editingInquiry?.contact || ''} placeholder="e.g. 0244123456" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parent Email</label>
                <input type="email" name="parent_email" defaultValue={editingInquiry?.parent_email || ''} placeholder="parent@email.com" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Optional/Additional Details Toggle */}
          <button type="button" onClick={() => setShowOptional(!showOptional)} className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">
            <ChevronDown className={cn("w-4 h-4 transition-transform", showOptional ? "rotate-180" : "")} />
            {showOptional ? 'Hide' : 'Show'} Additional Details
          </button>

          {showOptional && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Secondary Guardian */}
              <div className="space-y-6 p-6 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('secondary_parent_details')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_name')}</label>
                    <input type="text" name="secondary_parent_name" defaultValue={editingInquiry?.secondary_parent_name || ''} placeholder="e.g. Mrs. Mary Doe" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_contact')}</label>
                    <input type="tel" name="secondary_parent_contact" defaultValue={editingInquiry?.secondary_parent_contact || ''} placeholder="e.g. 0244987654" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_email')}</label>
                    <input type="email" name="secondary_parent_email" defaultValue={editingInquiry?.secondary_parent_email || ''} placeholder="secondary@email.com" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Academic Background */}
              <div className="space-y-6 p-6 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Academic Background</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Previous School</label>
                    <input type="text" name="previous_school" defaultValue={editingInquiry?.previous_school || ''} placeholder="e.g. Sunrise Academy" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Entrance Exam Score</label>
                    <input type="text" name="entrance_exam_score" defaultValue={editingInquiry?.entrance_exam_score || ''} placeholder="e.g. 85%" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60",
              purpose === 'admit'
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
                : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200 dark:shadow-none"
            )}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {purpose === 'admit' ? 'Admit Student' : 'Save Enquiry'}
          </button>
        </form>
      ) : (
        /* Bulk Import Tab */
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-4 py-8">
            <div className="w-20 h-20 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center">
              <Upload className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Bulk Student Import</h3>
            <p className="text-zinc-500 font-medium max-w-md mx-auto">Upload an Excel file with student data. Make sure columns include: Name, Class, Parent Name, Contact.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={() => downloadStudentTemplate(classes)}
                className="inline-flex items-center gap-2 px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                <Download className="w-4 h-4" /> Template
              </button>
              <label className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none">
                <Upload className="w-4 h-4" />
                {isImporting ? 'Processing...' : 'Upload Excel File'}
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleBulkImport} disabled={isImporting} />
              </label>
            </div>
          </div>

          {importPreviewItems.length > 0 && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Review {importPreviewItems.length} records below. Rows with unmatched classes will be skipped.</p>
              </div>
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-black uppercase tracking-widest">Name</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest">Gender</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest">Parent</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest">Contact</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest">Class</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {importPreviewItems.map((item, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 font-bold">{item.name}</td>
                        <td className="px-4 py-3">{item.gender || '-'}</td>
                        <td className="px-4 py-3">{item.parent_name || '-'}</td>
                        <td className="px-4 py-3">{item.contact || '-'}</td>
                        <td className="px-4 py-3">{item.class_id ? <span className="text-emerald-600 font-bold">{item.class_name}</span> : <span className="text-rose-500 font-bold italic">Not found: "{item.class_name}"</span>}</td>
                        <td className="px-4 py-3">{item.class_id ? <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Ready</span> : <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase">Error</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setImportPreviewItems([])} className="flex-1 py-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors">Cancel</button>
                <button onClick={confirmBulkAdmit} disabled={isImporting || !importPreviewItems.some(s => s.class_id)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Admit {importPreviewItems.filter(s => s.class_id).length} Students
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table Section — conditional based on purpose */}
      {purpose === 'enquiry' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-lg mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">Recent Enquiries</h3>
            <button
              onClick={() => onNavigate?.('Student Inquiries')}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 flex items-center gap-2"
            >
              <List className="w-3.5 h-3.5" /> View All
            </button>
          </div>
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500">Name</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500">Decision/Grade</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500">Date Added</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[...inquiries].sort((a, b) => new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime()).slice(0, 10).map((inquiry, i) => {
                  return (
                    <tr key={inquiry.id || i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{inquiry.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase bg-amber-50 text-amber-600 dark:bg-amber-900/20">
                          {inquiry.grade || 'Enquiry'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {inquiry.date ? new Date(inquiry.date).toLocaleDateString() : (inquiry.created_at ? new Date(inquiry.created_at).toLocaleDateString() : '-')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingInquiry(inquiry);
                              setPurpose('enquiry');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-indigo-600 transition-colors"
                            title="Edit Enquiry"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEnrollModalItem({ ...inquiry, source_inquiry_id: inquiry.id })}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" /> Admit Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {inquiries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 font-medium">No recent enquiries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-lg mt-8">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6">Recently Admitted Students</h3>
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500">Name</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500">Admission No</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500">Class</th>
                  <th className="px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-500">Enrolled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[...students].sort((a, b) => new Date(b.date_enrolled || b.created_at || 0).getTime() - new Date(a.date_enrolled || a.created_at || 0).getTime()).slice(0, 10).map((student, i) => {
                  const cls = classes.find(c => c.id === student.class_id);
                  const className = cls ? `${cls.name} ${cls.section || ''}`.trim() : (student.class || 'Assigned');
                  return (
                    <tr key={student.id || i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{student.name}</td>
                      <td className="px-6 py-4 text-zinc-500">{student.admission_no || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase">
                          {className}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {student.date_enrolled ? new Date(student.date_enrolled).toLocaleDateString() : (student.created_at ? new Date(student.created_at).toLocaleDateString() : '-')}
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 font-medium">No students enrolled today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!enrollModalItem}
        onClose={() => setEnrollModalItem(null)}
        title={`Admit Student: ${enrollModalItem?.name}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Academic Placement</h4>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assign Class *</label>
              <select
                value={enrollClassId}
                onChange={(e) => setEnrollClassId(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 overflow-hidden"
              >
                <option value="">Select Class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name} {cls.section}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Admission Fees</h4>
            {feeStructures.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 max-h-48 overflow-y-auto custom-scrollbar">
                {feeStructures.map((fee: any) => (
                  <label key={fee.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 cursor-pointer transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={enrollFeeIds.includes(fee.id)}
                        onChange={(e) => {
                          if (e.target.checked) setEnrollFeeIds(prev => [...prev, fee.id]);
                          else setEnrollFeeIds(prev => prev.filter(id => id !== fee.id));
                        }}
                        className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{fee.name}</span>
                    </div>
                    <span className="text-xs font-black text-zinc-900 dark:text-white">{currency} {parseFloat(fee.amount).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No fee structures defined.</p>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setEnrollModalItem(null)}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleEnrollModalSubmit}
              disabled={!enrollClassId || isSubmitting}
              className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Admit & Keep Student
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export const AcademicModules = {
  StudentManagement: ({ data, role, onSave, onDelete, onRefresh, results = [], exams = [], classes = [], gradingScales = [] }: { data: Student[], role?: UserRole, onSave?: (data: any) => void, onDelete?: (item: any) => void, onRefresh?: () => void, results?: any[], exams?: any[], classes?: any[], gradingScales?: any[] }) => {
    const { t } = useLanguage();
    const [viewItem, setViewItem] = useState<Student | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'academic'>('overview');

    const getGrade = (score: number, classId: string) => {
      // Find scale assigned to this class
      const scale = gradingScales.find(s => s.assigned_classes?.some((c: any) => c.id === classId)) || gradingScales[0];
      if (!scale || !scale.levels || scale.levels.length === 0) {
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
      }
      const level = [...scale.levels].sort((a, b) => b.min_score - a.min_score).find((l: any) => score >= l.min_score);
      return level ? level.grade : 'F';
    };

    const getGroupedResults = (studentId: string, studentClassId: string) => {
      const studentResults = results.filter(r => String(r.student_id) === String(studentId));
      const groups: Record<string, any[]> = {};

      studentResults.forEach(r => {
        const exam = exams.find(e => e.id === r.exam_id);
        const termName = exam?.term_name || exam?.semester_name || 'General';
        const classInfo = classes.find(c => c.id === (r.class_id || studentClassId));
        const className = classInfo ? `${classInfo.name} ${classInfo.section || ''}` : 'Academic Record';
        const groupKey = `${termName} - ${className}`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(r);
      });
      return groups;
    };

    const [manualPromoStudent, setManualPromoStudent] = useState<Student | null>(null);
    const [promoReason, setPromoReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleManualPromotion = async () => {
      if (!manualPromoStudent || !promoReason.trim()) {
        (window as any).showToast?.('Please provide a reason for manual promotion.', 'warning');
        return;
      }

      setProcessing(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/academic/promotion/manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            student_id: manualPromoStudent.id,
            reason: promoReason,
            academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
          })
        });

        if (res.ok) {
          (window as any).showToast?.(`Successfully promoted ${manualPromoStudent.name}!`, 'success');
          setManualPromoStudent(null);
          setPromoReason('');
          onRefresh?.();
        } else {
          const error = await res.json();
          (window as any).showToast?.(error, 'error');
        }
      } catch (err) {
        console.error('Failed to process promotion:', err);
        (window as any).showToast?.(err, 'error');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <>
        <DataTable<Student>
          title="Student Management"
          data={data}
          onRefresh={onRefresh}
          detailsMaxWidth="max-w-4xl"
          columns={[
            { header: 'Student Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
            { header: 'Admission No.', accessor: 'admission_no', className: 'text-zinc-500 font-medium' },
            {
              header: 'Class/Grade',
              accessor: (item: any) => {
                const cls = classes?.find((c: any) => c.id === item.class_id);
                if (cls) {
                  return `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`.trim();
                }
                const className = item.class || item.grade || 'N/A';
                return item.section ? `${className} - ${item.section}` : className;
              },
              className: 'font-bold text-zinc-900 dark:text-white'
            },
            {
              header: 'Enrolled On',
              accessor: (item: any) => item.date_enrolled ? new Date(item.date_enrolled).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
              className: 'text-zinc-500 font-medium'
            },
          ]}
          onSave={onSave}
          onDelete={onDelete}
          // onView remove to allow DataTable internal modal to work with renderDetails
          // onView={setViewItem}
          renderDetails={(item) => (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Header Section */}
              <div className="relative p-8 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
                  <div className="w-32 h-32 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                    {item.profile_pic || item.previous_school_profile_pic || (item as any).previousSchoolProfilePic ? (
                      <img
                        src={item.profile_pic || item.previous_school_profile_pic || (item as any).previousSchoolProfilePic}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      item.name.charAt(0)
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="space-y-4 flex-1 text-center md:text-left w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <h3 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{item.name}</h3>
                      {(role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') && item.status !== 'Alumni' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to withdraw ${item.name}? This will remove them from active student lists.`)) {
                                onSave?.({ ...item, status: 'Withdrawn' });
                              }
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 hover:scale-105 active:scale-95 transition-all font-black text-xs shadow-sm uppercase tracking-widest shrink-0 border border-red-100 dark:border-red-800"
                          >
                            <LogOut className="w-4 h-4" /> Withdraw
                          </button>
                          <button
                            onClick={() => setManualPromoStudent(item)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl hover:scale-105 active:scale-95 transition-all font-black text-xs shadow-xl uppercase tracking-widest shrink-0"
                          >
                            <TrendingUp className="w-4 h-4" /> Promote
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <div className="px-4 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 border border-zinc-200/50 dark:border-zinc-700/50">
                        <Fingerprint className="w-3 h-3 text-indigo-500" />
                        ID: {item.id.slice(0, 8)}
                      </div>

                      <div className="px-4 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-sm shadow-sm flex items-center gap-2">
                        <GraduationCap className="w-3 h-3" />
                        {(() => {
                          const cls = classes?.find((c: any) => c.id === item.class_id);
                          if (cls) {
                            return `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`.trim();
                          }
                          return `${item.class} ${item.section ? `- ${item.section}` : ''}`.trim();
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl w-fit mx-auto md:mx-0 border border-zinc-200/50 dark:border-zinc-700/50">
                <button
                  onClick={() => setActiveDetailTab('overview')}
                  className={cn(
                    "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                    activeDetailTab === 'overview'
                      ? "bg-white text-indigo-600 shadow-md dark:bg-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveDetailTab('academic')}
                  className={cn(
                    "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                    activeDetailTab === 'academic'
                      ? "bg-white text-indigo-600 shadow-md dark:bg-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  Academic History
                </button>
              </div>

              {activeDetailTab === 'overview' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                      <User className="w-3.5 h-3.5" /> Personal Profile
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Calendar className="w-3 h-3" />
                            </span>
                            Date of Birth
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">
                            {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not Specified'}
                          </p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Users className="w-3 h-3" />
                            </span>
                            Primary Parent
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.parent_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-indigo-50/10 dark:bg-indigo-900/10 border border-indigo-100/30 flex justify-between items-center group transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-white dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Zap className="w-3 h-3" />
                            </span>
                            {t('religion')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11 uppercase tracking-wider">{item.religion || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Layers className="w-3 h-3" />
                            </span>
                            Current Section
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">
                            {item.section || 'Not Assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                              <Phone className="w-3 h-3" />
                            </span>
                            Parent Contact
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">
                            {item.contact || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                      <Users className="w-3.5 h-3.5" /> {t('secondary_parent_details')}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Users className="w-3" />
                            </span>
                            {t('secondary_parent_name')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 transition-colors">
                              <Phone className="w-3" />
                            </span>
                            {t('secondary_parent_contact')}
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">{item.secondary_parent_contact || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                      <School className="w-3.5 h-3.5" /> Academic Background
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-3 group hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase text-indigo-600/70 dark:text-indigo-400 tracking-widest flex items-center gap-2 mb-2">
                            <SchoolIcon className="w-3 h-3" /> Previous Institution
                          </p>
                          <p className="font-black text-indigo-900 dark:text-indigo-100 text-lg leading-tight">{item.previous_school || 'Private Application'}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-xl hover:shadow-emerald-100 dark:hover:shadow-none transition-all duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 transition-colors">
                              <ShieldCheck className="w-3 h-3" />
                            </span>
                            Enrollment Date
                          </p>
                          <p className="font-black text-zinc-900 dark:text-white text-sm pl-11">
                            {item.date_enrolled ? new Date(item.date_enrolled).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pre-Migration'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group relative p-8 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:scale-105 transition-all duration-300 overflow-hidden cursor-default shadow-sm hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors scale-150" />
                      <div className="relative z-10 space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-[0.2em] drop-shadow-sm">Average Score</p>
                        <h4 className="text-4xl font-black text-indigo-700 dark:text-indigo-300 drop-shadow-sm">
                          {(results.filter(r => String(r.student_id) === String(item.id)).reduce((sum, r) => sum + (parseFloat(r.marks_obtained || r.score) || 0), 0) /
                            (results.filter(r => String(r.student_id) === String(item.id)).length || 1)).toFixed(1)}<span className="text-2xl text-indigo-500 dark:text-indigo-400">%</span>
                        </h4>
                      </div>
                    </div>
                    <div className="group relative p-8 rounded-[2.5rem] bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:scale-105 transition-all duration-300 overflow-hidden cursor-default shadow-sm hover:shadow-xl hover:shadow-emerald-100 dark:hover:shadow-none">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors scale-150" />
                      <div className="relative z-10 space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-[0.2em] drop-shadow-sm">Exams Taken</p>
                        <h4 className="text-4xl font-black text-emerald-700 dark:text-emerald-300 drop-shadow-sm">
                          {new Set(results.filter(r => String(r.student_id) === String(item.id)).map(r => r.exam_id)).size}
                        </h4>
                      </div>
                    </div>
                    <div className="group relative p-8 rounded-[2.5rem] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:scale-105 transition-all duration-300 overflow-hidden cursor-default shadow-sm hover:shadow-xl hover:shadow-amber-100 dark:hover:shadow-none">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors scale-150" />
                      <div className="relative z-10 space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-[0.2em] drop-shadow-sm">Performance</p>
                        <h4 className="text-3xl font-black text-amber-700 dark:text-amber-400 uppercase tracking-tighter drop-shadow-sm">
                          {parseFloat((results.filter(r => String(r.student_id) === String(item.id)).reduce((sum, r) => sum + (parseFloat(r.marks_obtained || r.score) || 0), 0) /
                            (results.filter(r => String(r.student_id) === String(item.id)).length || 1)).toFixed(1)) >= 70 ? 'Excellent' :
                            parseFloat((results.filter(r => String(r.student_id) === String(item.id)).reduce((sum, r) => sum + (parseFloat(r.marks_obtained || r.score) || 0), 0) /
                              (results.filter(r => String(r.student_id) === String(item.id)).length || 1)).toFixed(1)) >= 50 ? 'Good' : 'Average'}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {Object.keys(getGroupedResults(item.id, item.class_id)).length > 0 ? (
                      Object.entries(getGroupedResults(item.id, item.class_id)).map(([groupKey, groupResults]) => (
                        <div key={groupKey} className="space-y-4">
                          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-2 px-2">
                            {groupKey}
                          </h4>
                          <div className="rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden shadow-sm bg-white dark:bg-zinc-900 transition-all hover:shadow-md">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-sm">
                                <tr>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 dark:border-zinc-800">Subject</th>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 dark:border-zinc-800 w-1/3">Score</th>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase text-zinc-400 tracking-widest text-right border-b border-zinc-100 dark:border-zinc-800">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {(groupResults as any[]).map((record, idx) => (
                                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                    <td className="px-8 py-5">
                                      <p className="font-bold text-zinc-900 dark:text-white text-[13px]">{record.subject_name || record.subject || 'Subject'}</p>
                                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{record.exam_name || exams.find(e => e.id === record.exam_id)?.name || 'Exam'}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                      <div className="flex items-center gap-4">
                                        <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden min-w-[80px]">
                                          <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000 group-hover:bg-indigo-500"
                                            style={{ width: `${Math.min(100, parseFloat(record.marks_obtained || record.score) || 0)}%` }}
                                          />
                                        </div>
                                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs">{Math.round(record.marks_obtained || record.score)}%</span>
                                      </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                      <span className={cn(
                                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors",
                                        (parseFloat(record.marks_obtained || record.score) || 0) >= 70 ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 border border-emerald-100 dark:border-transparent dark:bg-emerald-900/30" :
                                          (parseFloat(record.marks_obtained || record.score) || 0) >= 50 ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 border border-indigo-100 dark:border-transparent dark:bg-indigo-900/30" :
                                            "bg-red-50 text-red-600 group-hover:bg-red-100 border border-red-100 dark:border-transparent dark:bg-red-900/30"
                                      )}>
                                        {getGrade(parseFloat(record.marks_obtained || record.score) || 0, record.class_id || item.class_id)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-24 text-center space-y-5 bg-zinc-50/50 dark:bg-zinc-800/10 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-[2rem] mx-auto flex items-center justify-center shadow-sm">
                          <GraduationCap className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-bold tracking-wide">No academic history records found for this student.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          renderForm={(item) => (
            <div className="space-y-10 max-w-2xl mx-auto py-4">
              {/* Student Photo Upload */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 dark:border-indigo-900/20 pb-2">Student Photo</h4>
                <div className="flex flex-col items-center gap-6 p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-inner">
                  <div className="w-32 h-32 rounded-[2rem] bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
                    {(item as any)?.profile_pic || (item as any)?.previous_school_profile_pic ? (
                      <img src={(item as any)?.profile_pic || (item as any)?.previous_school_profile_pic} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-zinc-400" />
                    )}
                  </div>
                  <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block text-center">Upload Student Photo</label>
                    <input
                      type="file"
                      name="previous_school_profile_pic"
                      accept="image/*"
                      className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Student Personal Information */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Student Information</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Full Name *</label>
                    <input required type="text" name="name" defaultValue={item?.name} placeholder="e.g. John Doe" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-base outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-bold" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Email *</label>
                      <input required type="email" name="email" defaultValue={item?.email} placeholder="student@school.com" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('religion')}</label>
                      <select name="religion" defaultValue={item?.religion} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="">Select Religion</option>
                        <option value="Christian">Christian</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Other">Other</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gender</label>
                      <select name="gender" defaultValue={item?.gender || ''} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                      <input type="date" name="date_of_birth" defaultValue={item?.date_of_birth ? new Date(item.date_of_birth).toISOString().split('T')[0] : ''} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class / Grade *</label>
                      <select required name="class_id" defaultValue={item?.class_id || ''} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="">Select Class</option>
                        {classes.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date Enrolled</label>
                      <input type="date" name="date_enrolled" defaultValue={item?.date_enrolled ? new Date(item.date_enrolled).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Previous School</label>
                    <input type="text" name="previous_school" defaultValue={item?.previous_school} placeholder="Name of previous school (if any)" className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Parent / Guardian Details */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 dark:border-indigo-900/20 pb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Parent / Guardian Details
                </h4>
                <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/5 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Parent Full Name *</label>
                    <input required type="text" name="parent_name" defaultValue={item?.parent_name} placeholder="e.g. Mr. James Doe" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Parent Phone *</label>
                      <input required type="tel" name="contact" defaultValue={item?.contact} placeholder="e.g. 0244123456" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Parent Email</label>
                      <input type="email" name="parent_email" defaultValue={item?.parent_email} placeholder="parent@email.com" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/20 space-y-4">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('secondary_parent_details')}</h5>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_name')}</label>
                      <input type="text" name="secondary_parent_name" defaultValue={item?.secondary_parent_name} placeholder="e.g. Mrs. Mary Doe" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_contact')}</label>
                        <input type="tel" name="secondary_parent_contact" defaultValue={item?.secondary_parent_contact} placeholder="e.g. 0244987654" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('secondary_parent_email')}</label>
                        <input type="email" name="secondary_parent_email" defaultValue={item?.secondary_parent_email} placeholder="secondary@email.com" className="w-full px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          onAdd={onSave ? () => { } : undefined}
          onEdit={onSave ? () => { } : undefined}
        />

        {/* Manual Promotion Modal */}
        <Modal
          isOpen={!!manualPromoStudent}
          onClose={() => setManualPromoStudent(null)}
          title="Manual Student Promotion"
          maxWidth="max-w-lg"
        >
          <div className="space-y-5">
            {/* Student info hero */}
            <div className="relative p-6 bg-indigo-600 rounded-[2rem] overflow-hidden flex items-center gap-5">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl shrink-0">
                {manualPromoStudent?.name.charAt(0)}
              </div>
              <div className="relative z-10">
                <h4 className="font-black text-white text-lg uppercase tracking-tight">{manualPromoStudent?.name}</h4>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Current Class: {manualPromoStudent?.class || 'N/A'}</p>
              </div>
            </div>

            {/* Next class indicator */}
            {(() => {
              const currentClass = classes.find(c => c.id === manualPromoStudent?.class_id);
              const nextClass = classes.find(c => c.id === currentClass?.next_class_id) ||
                classes.find(c => (c.order || c.sort_order || 0) === ((currentClass?.order || currentClass?.sort_order || 0) + 1)) ||
                classes.filter(c => c.id !== manualPromoStudent?.class_id)[0];
              return nextClass ? (
                <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400 uppercase tracking-widest">Promoting To</p>
                    <p className="font-black text-emerald-700 dark:text-emerald-300 text-base">{nextClass.name} {nextClass.section || ''}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Next Class</p>
                    <p className="font-bold text-zinc-500 text-sm">Auto-determined by promotion rules</p>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Promotion Reason *</label>
              <textarea
                value={promoReason}
                onChange={(e) => setPromoReason(e.target.value)}
                placeholder="Enter reason for manual promotion (e.g. Merit-based, Academic Excellence)..."
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[90px] font-medium resize-none"
              />
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                Manual promotion overrides automatic eligibility rules. An audit log will be created for this action.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setManualPromoStudent(null)}
                className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleManualPromotion}
                disabled={processing || !promoReason.trim()}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                {processing ? 'Processing...' : 'Confirm Promotion'}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  },
  AlumniManagement: ({ students = [], onRefresh, role, invoices = [], payments = [], onSaveStudent, onDelete, organization, onUpdateOrganization }: { students?: Student[], onRefresh?: () => void, role?: UserRole, invoices?: any[], payments?: any[], onSaveStudent?: (data: any) => void, onDelete?: (type: string, item: any) => void, organization?: any, onUpdateOrganization?: (data: any) => void }) => {
    const alumni = useMemo(() => students.filter(s => s.status === 'Alumni'), [students]);
    const [certStudent, setCertStudent] = useState<any>(null);
    const [certBody, setCertBody] = useState('');
    const [certDate, setCertDate] = useState(new Date().toISOString().split('T')[0]);
    const [certLeavingDate, setCertLeavingDate] = useState('');
    const [certTitle, setCertTitle] = useState('SCHOOL LEAVING CERTIFICATE');
    const [certRefNo, setCertRefNo] = useState('');
    const [showDesign, setShowDesign] = useState(false);

    const defaultDesign = { borderColor: '#1e3a5f', accentColor: '#c9a94e', titleColor: '#1e3a5f', bodyColor: '#333333' };
    const savedDesign = organization?.cert_template || {};
    const [design, setDesign] = useState({ ...defaultDesign, ...savedDesign });

    useEffect(() => {
      if (organization?.cert_template) setDesign({ ...defaultDesign, ...organization.cert_template });
    }, [organization?.cert_template]);

    const saveDesign = () => {
      if (onUpdateOrganization) onUpdateOrganization({ cert_template: design });
    };

    const openCertificate = (student: any) => {
      setCertStudent(student);
      setCertRefNo(`SLC/${new Date().getFullYear()}/${student.admission_no || student.id?.slice(0, 6)}`);
      setCertLeavingDate('');
      const pro = student.gender === 'Female' ? 'her' : 'his';
      const sub = student.gender === 'Female' ? 'she' : 'he';
      const pos = student.gender === 'Female' ? 'Her' : 'His';
      setCertBody(
        `This is to certify that ${student.name}, bearing Admission Number ${student.admission_no || 'N/A'}, ` +
        `was a bonafide student of ${organization?.name || 'this institution'} from the date of admission ` +
        `${student.date_enrolled ? new Date(student.date_enrolled).toLocaleDateString() : '_______________'} ` +
        `to the date of leaving {LEAVING_DATE}.\n\n` +
        `During ${pro} stay in the school, ${sub} was in ${student.class || '_______________'} class. ` +
        `${pos} conduct and character were found to be GOOD.\n\n` +
        `We wish ${pro === 'her' ? 'her' : 'him'} all the best in ${pro} future endeavours.`
      );
    };

    const resolvedBody = certBody.replace('{LEAVING_DATE}', certLeavingDate ? new Date(certLeavingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '_______________');

    const handlePrint = () => {
      const w = window.open('', '_blank');
      if (!w) return;
      const dateStr = new Date(certDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const logoHtml = organization?.logo ? '<img src="' + organization.logo + '" style="width:60px;height:60px;object-fit:contain;margin-bottom:4px" />' : '';
      const sigHtml = organization?.signature ? '<img src="' + organization.signature + '" style="height:40px;object-fit:contain;margin-bottom:4px" />' : '<div style="height:40px"></div>';
      const html = [
        '<html><head><title>' + certTitle + ' - ' + (certStudent?.name || '') + '</title>',
        '<style>',
        '@page{size:A4 landscape;margin:0}',
        'html,body{margin:0;padding:0;width:297mm;height:210mm;overflow:hidden;font-family:Georgia,serif}',
        'body{display:flex;align-items:center;justify-content:center;background:#fff}',
        '.p{width:287mm;height:200mm;padding:10mm;border:3px double ' + design.borderColor + ';position:relative;box-sizing:border-box}',
        '.i{border:1.5px solid ' + design.accentColor + ';padding:8mm;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;box-sizing:border-box}',
        '.c{position:absolute;width:24px;height:24px}',
        '.c1{top:6mm;left:6mm;border-top:2px solid ' + design.accentColor + ';border-left:2px solid ' + design.accentColor + '}',
        '.c2{top:6mm;right:6mm;border-top:2px solid ' + design.accentColor + ';border-right:2px solid ' + design.accentColor + '}',
        '.c3{bottom:6mm;left:6mm;border-bottom:2px solid ' + design.accentColor + ';border-left:2px solid ' + design.accentColor + '}',
        '.c4{bottom:6mm;right:6mm;border-bottom:2px solid ' + design.accentColor + ';border-right:2px solid ' + design.accentColor + '}',
        '.sn{font-size:20px;font-weight:900;color:' + design.titleColor + ';text-transform:uppercase;letter-spacing:3px}',
        '.sa{font-size:9px;color:#666;letter-spacing:1px}',
        '.ct{font-size:22px;font-weight:900;color:' + design.titleColor + ';text-transform:uppercase;letter-spacing:5px;border-top:2px solid ' + design.accentColor + ';border-bottom:2px solid ' + design.accentColor + ';padding:6px 24px}',
        '.cb{font-size:13px;line-height:1.8;color:' + design.bodyColor + ';text-align:justify;max-width:92%;white-space:pre-line}',
        '.ft{display:flex;justify-content:space-between;width:90%;align-items:flex-end}',
        '.fc{text-align:center}',
        '.fc .ln{width:140px;border-bottom:1px solid #333;margin-bottom:4px}',
        '.fc .lb{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#555}',
        '</style></head><body>',
        '<div class="p">',
        '<div class="c c1"></div><div class="c c2"></div><div class="c c3"></div><div class="c c4"></div>',
        '<div class="i">',
        '<div style="text-align:center">' + logoHtml + '<div class="sn">' + (organization?.name || 'School Name') + '</div><div class="sa">' + (organization?.address || '') + '</div></div>',
        '<div class="ct">' + certTitle + '</div>',
        '<div style="font-size:9px;color:#888;letter-spacing:2px">REF: ' + certRefNo + '</div>',
        '<div class="cb">' + resolvedBody + '</div>',
        '<div class="ft">',
        '<div class="fc"><div style="font-size:10px;color:#555;margin-bottom:4px">' + dateStr + '</div><div class="ln"></div><div class="lb">Date</div></div>',
        '<div class="fc">' + sigHtml + '<div class="ln"></div><div class="lb">Head of School</div></div>',
        '<div class="fc"><div style="height:40px"></div><div class="ln"></div><div class="lb">School Stamp</div></div>',
        '</div></div></div></body></html>'
      ].join('');
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 600);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => onRefresh?.()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh List
          </button>
        </div>
        <DataTable<Student>
          title="Alumni Management"
          data={alumni}
          columns={[
            { header: 'Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
            { header: 'Admission No', accessor: 'admission_no', className: 'font-medium' },
            { header: 'Last Class', accessor: (item) => item.class || 'N/A' },
            { header: 'Email', accessor: 'email', className: 'text-zinc-500' },
            {
              header: 'Status',
              accessor: (item) => (
                <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 italic shadow-sm">
                  {item.status}
                </span>
              )
            },
          ]}
          onView={() => { }}
          extraActions={(item) => (
            <button
              onClick={() => openCertificate(item)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
            >
              <Award className="w-4 h-4" />
              Generate Certificate
            </button>
          )}
        />

        {/* Certificate Editor & Preview Modal */}
        <Modal
          isOpen={!!certStudent}
          onClose={() => setCertStudent(null)}
          title="School Certificate / Testimonial"
          maxWidth="max-w-6xl"
        >
          {certStudent && (
            <div className="space-y-6">
              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Certificate Title</label>
                  <input
                    type="text"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reference No.</label>
                  <input
                    type="text"
                    value={certRefNo}
                    onChange={(e) => setCertRefNo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date of Leaving</label>
                  <input
                    type="date"
                    value={certLeavingDate}
                    onChange={(e) => setCertLeavingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date of Issue</label>
                  <input
                    type="date"
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Certificate Body (Editable)</label>
                  <textarea
                    value={certBody}
                    onChange={(e) => setCertBody(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                  <p className="text-[9px] text-zinc-400 italic">Tip: Use {'{LEAVING_DATE}'} in the body text — it will be replaced by the Date of Leaving above.</p>
                </div>
              </div>

              {/* Design Settings (collapsible) */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <button
                  onClick={() => setShowDesign(!showDesign)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Template Design Settings</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showDesign ? 'rotate-180' : ''}`} />
                </button>
                {showDesign && (
                  <div className="p-4 space-y-4 bg-white dark:bg-zinc-900">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Border Color</label>
                        <input type="color" value={design.borderColor} onChange={(e) => setDesign({ ...design, borderColor: e.target.value })} className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Accent / Gold</label>
                        <input type="color" value={design.accentColor} onChange={(e) => setDesign({ ...design, accentColor: e.target.value })} className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Title Color</label>
                        <input type="color" value={design.titleColor} onChange={(e) => setDesign({ ...design, titleColor: e.target.value })} className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Body Text</label>
                        <input type="color" value={design.bodyColor} onChange={(e) => setDesign({ ...design, bodyColor: e.target.value })} className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={saveDesign} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all">
                        <Save className="w-3.5 h-3.5" />
                        Save as Default Template
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Print Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setCertStudent(null)}
                  className="px-6 py-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-bold transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none order-1 sm:order-2"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </button>
              </div>

              {/* Certificate Preview (responsive) */}
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white hidden sm:block">
                <div style={{ width: '860px', aspectRatio: '297/210', margin: '0 auto', padding: '24px', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                  <div style={{ width: '100%', height: '100%', border: `3px double ${design.borderColor}`, position: 'relative', padding: '20px' }}>
                    <div style={{ position: 'absolute', top: 14, left: 14, width: 20, height: 20, borderTop: `2px solid ${design.accentColor}`, borderLeft: `2px solid ${design.accentColor}` }} />
                    <div style={{ position: 'absolute', top: 14, right: 14, width: 20, height: 20, borderTop: `2px solid ${design.accentColor}`, borderRight: `2px solid ${design.accentColor}` }} />
                    <div style={{ position: 'absolute', bottom: 14, left: 14, width: 20, height: 20, borderBottom: `2px solid ${design.accentColor}`, borderLeft: `2px solid ${design.accentColor}` }} />
                    <div style={{ position: 'absolute', bottom: 14, right: 14, width: 20, height: 20, borderBottom: `2px solid ${design.accentColor}`, borderRight: `2px solid ${design.accentColor}` }} />
                    <div style={{ border: `1.5px solid ${design.accentColor}`, padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ textAlign: 'center' }}>
                        {organization?.logo && <img src={organization.logo} alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain', marginBottom: 3 }} />}
                        <div style={{ fontSize: 17, fontWeight: 900, color: design.titleColor, textTransform: 'uppercase', letterSpacing: 3 }}>{organization?.name || 'School Name'}</div>
                        <div style={{ fontSize: 8, color: '#666', letterSpacing: 1 }}>{organization?.address || ''}</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: design.titleColor, textTransform: 'uppercase', letterSpacing: 4, borderTop: `2px solid ${design.accentColor}`, borderBottom: `2px solid ${design.accentColor}`, padding: '4px 18px' }}>{certTitle}</div>
                      <div style={{ fontSize: 8, color: '#888', letterSpacing: 2 }}>REF: {certRefNo}</div>
                      <div style={{ fontSize: 11, lineHeight: '1.8', color: design.bodyColor, textAlign: 'justify', maxWidth: '92%', whiteSpace: 'pre-line' }}>{resolvedBody}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '90%', alignItems: 'flex-end' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: '#555', marginBottom: 3 }}>{new Date(certDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          <div style={{ width: 120, borderBottom: '1px solid #333', marginBottom: 3 }} />
                          <div style={{ fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#555' }}>Date</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          {organization?.signature && <img src={organization.signature} alt="Sig" style={{ height: 30, objectFit: 'contain', marginBottom: 3 }} />}
                          <div style={{ width: 120, borderBottom: '1px solid #333', marginBottom: 3 }} />
                          <div style={{ fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#555' }}>Head of School</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ height: 30 }} />
                          <div style={{ width: 120, borderBottom: '1px solid #333', marginBottom: 3 }} />
                          <div style={{ fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#555' }}>School Stamp</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Certificate Preview */}
              <div className="block sm:hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white p-4 space-y-4" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                <div className="text-center space-y-2 pb-3" style={{ borderBottom: `2px solid ${design.accentColor}` }}>
                  {organization?.logo && <img src={organization.logo} alt="Logo" className="w-12 h-12 object-contain mx-auto" />}
                  <div style={{ fontSize: 14, fontWeight: 900, color: design.titleColor, textTransform: 'uppercase', letterSpacing: 2 }}>{organization?.name || 'School Name'}</div>
                  <div style={{ fontSize: 8, color: '#666' }}>{organization?.address || ''}</div>
                </div>
                <div className="text-center py-2" style={{ fontSize: 14, fontWeight: 900, color: design.titleColor, textTransform: 'uppercase', letterSpacing: 3, borderBottom: `2px solid ${design.accentColor}` }}>{certTitle}</div>
                <div style={{ fontSize: 8, color: '#888', letterSpacing: 2, textAlign: 'center' }}>REF: {certRefNo}</div>
                <div style={{ fontSize: 11, lineHeight: '1.8', color: design.bodyColor, textAlign: 'justify', whiteSpace: 'pre-line' }}>{resolvedBody}</div>
                <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: `1px solid ${design.accentColor}` }}>
                  <div className="text-center">
                    <div style={{ fontSize: 8, color: '#555', marginBottom: 2 }}>{new Date(certDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div style={{ borderBottom: '1px solid #333', marginBottom: 2 }} />
                    <div style={{ fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#555' }}>Date</div>
                  </div>
                  <div className="text-center">
                    {organization?.signature && <img src={organization.signature} alt="Sig" className="h-5 object-contain mx-auto mb-1" />}
                    <div style={{ borderBottom: '1px solid #333', marginBottom: 2 }} />
                    <div style={{ fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#555' }}>Head of School</div>
                  </div>
                  <div className="text-center">
                    <div className="h-5" />
                    <div style={{ borderBottom: '1px solid #333', marginBottom: 2 }} />
                    <div style={{ fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#555' }}>Stamp</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  },
  DepartmentManagement: ({ data, staff = [], subjects = [], onSave, onDelete }: { data?: any[], staff?: any[], subjects?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'graphical'>('graphical');
    const [editingItem, setEditingItem] = useState<any | null>(null);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Departmental Overview</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Manage academic & administrative departments</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('graphical')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'graphical' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            {onSave && (
              <button
                onClick={() => setEditingItem({})}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                Add Department
              </button>
            )}
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-x-auto">
            <DataTable
              title="Department List"
              data={data || []}
              onSave={onSave}
              onDelete={onDelete}
              onView={setViewItem}
              columns={[
                { header: 'Department', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
                { header: 'Head of Dept', accessor: 'head_name', className: 'text-zinc-600 dark:text-zinc-400 font-medium' },
                { header: 'Staff Count', accessor: (item) => <span className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-black text-[10px] text-zinc-500 uppercase tracking-widest">{item.staff_count || 0} Members</span> },
              ]}
              renderForm={(item) => (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Department Name</label>
                    <input
                      required
                      type="text"
                      name="name"
                      defaultValue={item?.name}
                      placeholder="e.g. Science Department"
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Head of Department</label>
                    <select
                      name="hod_id"
                      defaultValue={item?.hod_id}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select HOD</option>
                      {staff.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description (Optional)</label>
                    <textarea
                      name="description"
                      defaultValue={item?.description}
                      placeholder="Describe the department's focus..."
                      rows={3}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}
              onAdd={onSave ? () => { } : undefined}
              onEdit={onSave ? (item) => setEditingItem(item) : undefined}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.map((dept) => (
              <div 
                key={dept.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 hover:border-indigo-500 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                {/* Status indicator decoration */}
                <div className="absolute top-8 right-8 w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Briefcase className="w-5 h-5 text-zinc-400" />
                </div>

                <div className="flex flex-col gap-6">
                  {/* Department Icon & Title */}
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight line-clamp-1">{dept.name}</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1 italic">Academic Infrastructure</p>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 space-y-1">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Users className="w-4 h-4" />
                        <span className="text-lg font-black">{dept.staff_count || 0}</span>
                      </div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total Staff</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Layers className="w-4 h-4" />
                        <span className="text-lg font-black">Active</span>
                      </div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Status</p>
                    </div>
                  </div>

                  {/* HOD Section */}
                  <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between group/hod">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                        <UserCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Head of Dept</p>
                        <p className="text-xs font-black text-indigo-900 dark:text-indigo-100 uppercase truncate max-w-[120px]">
                          {dept.head_name || 'Not Assigned'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewItem(dept)}
                      className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-indigo-600 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={() => setEditingItem(dept)}
                      className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Manage
                    </button>
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(dept)}
                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Department Profile"
          maxWidth="max-w-4xl"
        >
          {viewItem && (
            <div className="space-y-8 p-2">
              <div className="flex items-center gap-8 pb-8 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-100 dark:shadow-none border-4 border-white dark:border-zinc-800">
                  <Building2 className="w-12 h-12" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewItem.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-700">ID: {viewItem.id.slice(0, 8)}</span>
                    <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-800/50">
                      HOD: {viewItem.head_name || 'Not Assigned'}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800/50">
                      {viewItem.staff_count || 0} Total Staff
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2"> Assigned Staff Member </h4>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {staff.filter(s => s.department_id === viewItem.id).length > 0 ? (
                        staff.filter(s => s.department_id === viewItem.id).map(s => (
                          <div key={s.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-indigo-100 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 text-xs font-bold border border-zinc-100 dark:border-zinc-800 shadow-sm">
                              {s.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-zinc-900 dark:text-white text-sm">{s.name}</p>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{s.role}</p>
                            </div>
                            {s.id === viewItem.hod_id && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 text-[8px] font-black uppercase border border-amber-100">HOD</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                          <Users className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No Staff Assigned</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2"> Associated Subjects </h4>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {subjects.filter(s => s.department_id === viewItem.id).length > 0 ? (
                        subjects.filter(s => s.department_id === viewItem.id).map(s => (
                          <div key={s.id} className="p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-800/30 flex items-center gap-4 group hover:border-indigo-400 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-800 shadow-sm">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-zinc-900 dark:text-white text-sm">{s.name}</p>
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{s.code}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                          <BookOpen className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No Subjects Found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={editingItem?.id ? "Edit Department" : "Add New Department"}
        >
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const values: any = {};
              formData.forEach((value, key) => {
                values[key] = value;
              });
              if (onSave) {
                await onSave({ ...editingItem, ...values });
                setEditingItem(null);
              }
            }}
            className="p-6 space-y-6"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Department Name</label>
              <input
                required
                type="text"
                name="name"
                defaultValue={editingItem?.name}
                placeholder="e.g. Science Department"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Head of Department</label>
              <select
                name="hod_id"
                defaultValue={editingItem?.hod_id}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select HOD</option>
                {staff.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description (Optional)</label>
              <textarea
                name="description"
                defaultValue={editingItem?.description}
                placeholder="Describe the department's focus..."
                rows={3}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                {editingItem?.id ? "Update Department" : "Create Department"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  ClassManagement: ({ data, staff = [], students = [], gradingScales = [], reportCardTemplates = [], role, onSave, onDelete }: { data?: any[], staff?: any[], students?: any[], gradingScales?: any[], reportCardTemplates?: ReportCardTemplate[], role?: UserRole, onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'graphical'>('graphical');
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const classColumns = role === 'STAFF'
      ? [
        { header: 'Class Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
        { header: 'Section', accessor: 'section' },
        {
          header: 'Number of Students',
          accessor: (item: any) => students.filter((s: any) => s.class_id === item.id).length,
          className: 'font-bold text-indigo-600'
        },
      ]
      : [
        { header: 'Class Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
        { header: 'Section', accessor: 'section' },
        { header: 'Teacher', accessor: 'class_teacher_name', className: 'text-indigo-600 font-medium' },
        {
          header: 'Promotion Flow',
          accessor: (item: any) => (
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-zinc-400" />
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-lg",
                item.next_class_name ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-zinc-50 text-zinc-400"
              )}>
                {item.next_class_name || 'Alumni'}
              </span>
            </div>
          )
        },
      ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
              <GraduationCap className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Classroom Directory</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Manage class teachers, student capacities & promotion flows</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('graphical')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'graphical' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            {onSave && role !== 'STAFF' && (
              <button
                onClick={() => setEditingItem({})}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                Add Class
              </button>
            )}
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Total Classes</p>
                </div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{data?.length || 0}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <DataTable
                title="Class List"
                data={data || []}
                onSave={onSave}
                onDelete={onDelete}
                onView={setViewItem}
                onEdit={onSave && role !== 'STAFF' ? (item) => setEditingItem(item) : undefined}
                columns={classColumns}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.map((cls) => {
              const studentCount = students.filter((s: any) => s.class_id === cls.id).length;
              return (
                <div 
                  key={cls.id}
                  className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 hover:border-indigo-500 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                >
                  <div className="flex flex-col gap-6">
                    {/* Class Icon & Title */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-4">
                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                          <School className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{cls.name}</h3>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1">Section: {cls.section || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                          {studentCount} Students
                        </div>
                      </div>
                    </div>

                    {/* Teacher & Promotion Section */}
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                          <UserCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Class Teacher</p>
                          <p className="text-xs font-black text-zinc-900 dark:text-white uppercase truncate">
                            {cls.class_teacher_name || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Promotion Flow</p>
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-100 uppercase">{cls.name}</span>
                          <ArrowRight className="w-3 h-3 text-indigo-400" />
                          <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-lg uppercase",
                            cls.next_class_name ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm" : "text-indigo-300"
                          )}>
                            {cls.next_class_name || 'Alumni'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => setViewItem(cls)}
                        className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      {onSave && role !== 'STAFF' && (
                        <button 
                          onClick={() => setEditingItem(cls)}
                          className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && role !== 'STAFF' && (
                        <button 
                          onClick={() => onDelete(cls)}
                          className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Class Details"
          maxWidth="max-w-4xl"
        >
          {viewItem && (
            <div className="space-y-8 p-4">
              <div className="flex items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{viewItem.name} {viewItem.section}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rank: {viewItem.rank || 0}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">ID: {viewItem.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Academic Info</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-500">Capacity</span>
                        <span className="text-zinc-900 dark:text-white font-bold">{viewItem.capacity || 0} Seats</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-500">Current Rank</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">{viewItem.rank || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="font-bold text-zinc-500">Class Teacher</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{viewItem.class_teacher_name || 'Not Assigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Promotion Logic</h4>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Promotes To</p>
                      <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                        {viewItem.next_class_name || 'Graduation (Final Class)'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Students in Class ({students.filter((s: any) => s.class_id === viewItem.id).length})</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {students.filter((s: any) => s.class_id === viewItem.id).length > 0 ? (
                      students.filter((s: any) => s.class_id === viewItem.id).map((student: any) => (
                        <div key={student.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">{student.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{student.student_id || student.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <Users className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No Students Found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={editingItem?.id ? "Edit Class" : "Add New Class"}
        >
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const values: any = {};
              formData.forEach((value, key) => {
                values[key] = value;
              });
              if (onSave) {
                await onSave({ ...editingItem, ...values });
                setEditingItem(null);
              }
            }}
            className="p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  defaultValue={editingItem?.name}
                  placeholder="e.g. Grade 10"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Section / Stream</label>
                <input
                  required
                  type="text"
                  name="section"
                  defaultValue={editingItem?.section}
                  placeholder="e.g. A, Science, Blue"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class Teacher</label>
                <select
                  name="class_teacher_id"
                  defaultValue={editingItem?.class_teacher_id}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Assign Teacher</option>
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  defaultValue={editingItem?.capacity}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Promotion Rank (Order)</label>
                <input
                  type="number"
                  name="rank"
                  defaultValue={editingItem?.rank}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 10 for Grade 10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Promotes To</label>
                <select
                  name="next_class_id"
                  defaultValue={editingItem?.next_class_id}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">End of Journey (None)</option>
                  {data?.filter(c => c.id !== editingItem?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                {editingItem?.id ? "Update Class" : "Create Class"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  SubjectManagement: ({ data, staff = [], classes = [], students = [], departments = [], currentStaff, role, onSave, onDelete }: { data?: any[], staff?: any[], classes?: any[], students?: any[], departments?: any[], currentStaff?: any, role?: UserRole, onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'graphical'>('graphical');
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const subjectColumns = role === 'STAFF'
      ? [
        { header: 'Subject Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
        { header: 'Code', accessor: 'code', className: 'font-mono text-xs text-indigo-600' },
        { header: 'Classes', accessor: (item: any) => item.classes && item.classes.length > 0 ? item.classes.map((c: any) => `${c.name} ${c.section}`).join(', ') : (item.class_name ? `${item.class_name} ${item.class_section || ''}` : 'N/A') },
      ]
      : [
        { header: 'Subject Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
        { header: 'Code', accessor: 'code', className: 'font-mono text-xs text-indigo-600' },
        { header: 'Teacher', accessor: 'teacher_name' },
        { header: 'Classes', accessor: (item: any) => item.classes && item.classes.length > 0 ? item.classes.map((c: any) => `${c.name} ${c.section}`).join(', ') : (item.class_name ? `${item.class_name} ${item.class_section || ''}` : 'N/A') },
        { header: 'Department', accessor: 'department_name' },
      ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
              <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Curriculum Inventory</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Manage subjects, teacher assignments & departmental links</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('graphical')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'graphical' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            {onSave && role !== 'STAFF' && (
              <button
                onClick={() => setEditingItem({})}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            )}
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Total Subjects</p>
                </div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{data?.length || 0}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <DataTable
                title="Subject List"
                data={data || []}
                onSave={onSave}
                onDelete={onDelete}
                onView={setViewItem}
                onEdit={onSave && role !== 'STAFF' ? (item) => setEditingItem(item) : undefined}
                columns={subjectColumns}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.map((subject) => (
              <div 
                key={subject.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 hover:border-indigo-500 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                <div className="flex flex-col gap-6">
                  {/* Subject Icon & Title */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 dark:border-indigo-800">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{subject.name}</h3>
                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">{subject.code || 'NO-CODE'}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      {subject.department_name || 'General'}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                        <UserCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Subject Teacher</p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white uppercase truncate">
                          {subject.teacher_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Target Classes</p>
                      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                        {subject.classes && subject.classes.length > 0 ? (
                          subject.classes.map((cls: any) => (
                            <div key={cls.id} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-lg border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-wider">
                              {cls.name} {cls.section}
                            </div>
                          ))
                        ) : (
                          subject.class_name ? (
                            <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-lg border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-wider">
                              {subject.class_name} {subject.class_section}
                            </div>
                          ) : (
                            <p className="text-[10px] text-zinc-400 italic pl-1">No classes assigned</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={() => setViewItem(subject)}
                      className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                    {onSave && role !== 'STAFF' && (
                      <button 
                        onClick={() => setEditingItem(subject)}
                        className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && role !== 'STAFF' && (
                      <button 
                        onClick={() => onDelete(subject)}
                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Subject Analysis"
          maxWidth="max-w-4xl"
        >
          {viewItem && (
            <div className="space-y-8 p-2">
              <div className="relative p-8 rounded-[2.5rem] overflow-hidden group border border-amber-100/80 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-900/10 backdrop-blur-xl flex items-center gap-6">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />
                <div className="w-20 h-20 rounded-[1.5rem] bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-200 dark:shadow-none shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewItem.name}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-white/80 dark:bg-zinc-800/80 text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
                      Code: {viewItem.code || 'N/A'}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-amber-100/80 dark:bg-amber-900/30 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest border border-amber-200/50 dark:border-amber-800/50 shadow-sm">
                      ID: {viewItem.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Academic info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" /> Academic Info
                  </h4>
                  <div className="space-y-3">
                    <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors shadow-sm">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Assigned Teacher</p>
                        <p className="font-black text-zinc-900 dark:text-white">{viewItem.teacher_name || 'Not Assigned'}</p>
                      </div>
                    </div>
                    <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors shadow-sm">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Department</p>
                        <p className="font-black text-zinc-900 dark:text-white">{viewItem.department_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Classes assigned */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Assigned Classes
                  </h4>
                  <div className="p-5 rounded-[1.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 min-h-[100px]">
                    {viewItem.classes && viewItem.classes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewItem.classes.map((c: any) => (
                          <span key={c.id} className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black uppercase tracking-wide">
                            {c.name} {c.section}
                          </span>
                        ))}
                      </div>
                    ) : viewItem.class_name ? (
                      <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black uppercase tracking-wide inline-block">
                        {viewItem.class_name} {viewItem.class_section || ''}
                      </span>
                    ) : (
                      <p className="text-sm text-zinc-400 italic font-medium">No classes assigned yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Students in class — only for STAFF role */}
              {role === 'STAFF' && viewItem.class_id && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Students in Class
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {students.filter((s: any) => s.class_id === viewItem.class_id).length > 0 ? (
                      students.filter((s: any) => s.class_id === viewItem.class_id).map((student: any) => (
                        <div key={student.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-[11px] font-black shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{student.name}</p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{student.student_id || student.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-2 text-xs font-bold text-zinc-400 uppercase italic text-center py-6">No students assigned to this class</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={editingItem?.id ? "Edit Subject" : "Add New Subject"}
          maxWidth="max-w-4xl"
        >
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const values: any = {};
              formData.forEach((value, key) => {
                if (key === 'class_ids') {
                  if (!values[key]) values[key] = [];
                  values[key].push(value);
                } else {
                  values[key] = value;
                }
              });
              if (onSave) {
                await onSave({ ...editingItem, ...values });
                setEditingItem(null);
              }
            }}
            className="p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Subject Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  defaultValue={editingItem?.name}
                  placeholder="e.g. Mathematics"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Subject Code (Optional)</label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editingItem?.code}
                  placeholder="e.g. MATH-101"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assigned Teacher</label>
                <select
                  name="teacher_id"
                  defaultValue={editingItem?.teacher_id}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Teacher</option>
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Department</label>
                <select
                  name="department_id"
                  defaultValue={editingItem?.department_id}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assigned Classes</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl max-h-48 overflow-y-auto">
                {classes.map((c: any) => (
                  <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="class_ids"
                      value={c.id}
                      defaultChecked={editingItem?.classes?.some((sc: any) => sc.id === c.id) || editingItem?.class_id === c.id}
                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors uppercase">{c.name} {c.section}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                {editingItem?.id ? "Update Subject" : "Create Subject"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  Timetable: ({
    data = [],
    classes = [],
    subjects = [],
    staff = [],
    departments = [],
    currentStaff,
    role,
    onSave,
    onDelete,
    selectedClassId: initialClassId
  }: {
    data?: any[],
    classes?: any[],
    subjects?: any[],
    staff?: any[],
    departments?: any[],
    currentStaff?: any,
    role?: UserRole,
    onSave?: (data: any) => void,
    onDelete?: (item: any) => void,
    selectedClassId?: string
  }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || classes[0]?.id || '');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(role === 'STAFF' ? 'list' : 'grid');

    useEffect(() => {
      if (initialClassId) {
        setSelectedClassId(initialClassId);
      } else if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id);
      }
    }, [classes, initialClassId]);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Dynamic time slots based on data + defaults
    const defaultSlots = [
      '08:00 - 09:00', '09:00 - 10:00', '10:00 - 10:30', '10:30 - 11:30',
      '11:30 - 12:30', '12:30 - 13:30', '13:30 - 14:30', '14:30 - 15:30'
    ];

    const dataSlots = Array.from(new Set(data.filter(item => role === 'STAFF' || item.class_id === selectedClassId).map(item =>
      `${item.start_time?.slice(0, 5)} - ${item.end_time?.slice(0, 5)}`
    )));

    const timeSlots = Array.from(new Set([...defaultSlots, ...dataSlots])).sort();

    const classTimetable = role === 'STAFF' ? data : data.filter(item => item.class_id === selectedClassId);

    const getEntry = (day: string, slot: string) => {
      return classTimetable.find(item =>
        item.day_of_week === day &&
        `${item.start_time?.slice(0, 5)} - ${item.end_time?.slice(0, 5)}` === slot
      );
    };

    const handleGeneratePDF = () => {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const className = selectedClass ? `${selectedClass.name} ${selectedClass.section}` : 'Timetable';
      window.print(); // Simple browser print as a placeholder for PDF
    };

    const handleSave = (entryData: any) => {
      // Teacher Conflict Check
      if (entryData.teacher_id && entryData.type === 'Lesson') {
        const teacher = staff.find(s => String(s.id).toLowerCase() === String(entryData.teacher_id).toLowerCase());
        const conflict = (data || []).find(e =>
          String(e.teacher_id).toLowerCase() === String(entryData.teacher_id).toLowerCase() &&
          e.day_of_week === entryData.day_of_week &&
          e.id !== editingItem?.id &&
          (
            (entryData.start_time <= e.start_time && entryData.end_time > e.start_time) ||
            (entryData.start_time < e.end_time && entryData.end_time >= e.end_time) ||
            (e.start_time <= entryData.start_time && e.end_time >= entryData.end_time)
          )
        );

        if (conflict) {
          const confirm = window.confirm(
            `Teacher ${teacher?.name || 'this staff member'} is already assigned to another class during this time. Do you want to proceed anyway? This will cause a schedule conflict.`
          );
          if (!confirm) return;
        }
      }

      onSave?.({ ...entryData, class_id: selectedClassId, id: editingItem?.id });
      setShowForm(false);
      setEditingItem(null);
    };

    return (
      <div className="space-y-6">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { 
              size: landscape;
              margin: 10mm;
            }
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            th, td {
              font-size: 8px !important;
              padding: 4px !important;
              word-break: break-word !important;
            }
            .bg-zinc-50\/50, .bg-zinc-50\/20, .bg-indigo-50\/50 {
              background-color: transparent !important;
              border: 1px solid #e5e7eb !important;
            }
          }
        `}} />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              {role === 'STAFF' ? 'My Teaching Schedule' : 'Timetable Management'}
            </h2>
            <p className="text-sm text-zinc-500 font-medium">
              {role === 'STAFF' ? 'View your weekly teaching schedule across classes.' : 'Manage weekly schedules and lesson plans.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {role === 'STAFF' && (
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    viewMode === 'list' ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm" : "text-zinc-500"
                  )}
                >
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    viewMode === 'grid' ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm" : "text-zinc-500"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Grid
                </button>
              </div>
            )}
            {role !== 'STAFF' && role !== 'STUDENT' && (
              <>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              </>
            )}
            <button
              onClick={handleGeneratePDF}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate PDF
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm print:shadow-none print-container">
          <div className="p-6 md:p-10 border-b border-zinc-100 dark:border-zinc-800 hidden print:block">
            <h1 className="text-3xl font-black text-zinc-900">
              {role === 'STAFF'
                ? `${staff.find(s => s.id === data[0]?.teacher_id)?.name || 'Staff'}'s Personal Timetable`
                : `${classes.find(c => c.id === selectedClassId)?.name} ${classes.find(c => c.id === selectedClassId)?.section} Timetable`
              }
            </h1>
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest mt-2">Academic Session 2023/2024</p>
          </div>

          {viewMode === 'list' ? (
            <div className="p-6 space-y-8">
              {days.map(day => {
                const dayEntries = classTimetable.filter(e => e.day_of_week === day)
                  .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

                if (dayEntries.length === 0) return null;

                return (
                  <div key={day} className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">{day}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayEntries.map((entry, idx) => (
                        <div key={idx} className={cn(
                          "p-4 rounded-2xl border transition-all",
                          entry.type?.includes('Break')
                            ? "bg-zinc-50/50 border-zinc-100 dark:bg-zinc-800/20 dark:border-zinc-800"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm"
                        )}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                <Clock className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-black text-zinc-900 dark:text-white">
                                {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}
                              </span>
                            </div>
                            {entry.type?.includes('Break') && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest">
                                {entry.type}
                              </span>
                            )}
                          </div>

                          {!entry.type?.includes('Break') && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400">{entry.subject_name}</h4>
                              <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                                  <Layers className="w-3 h-3" />
                                  {entry.class_name} {entry.class_section}
                                </div>
                                {entry.room && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                                    <Building2 className="w-3 h-3" />
                                    {entry.room}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {classTimetable.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-300">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest italic">No schedule found for this week</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 w-32">Time</th>
                    {days.map(day => (
                      <th key={day} className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 min-w-[150px]">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, i) => (
                    <tr key={i} className="group">
                      <td className="p-4 border-b border-r border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-zinc-400 bg-zinc-50/20 dark:bg-zinc-800/10">{slot}</td>
                      {days.map(day => {
                        const entry = getEntry(day, slot);

                        if (entry?.type === 'Short Break' || entry?.type === 'Lunch Break') {
                          return (
                            <td key={day} className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-center relative group/item">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">{entry.type}</span>
                              {role !== 'STAFF' && role !== 'STUDENT' && (
                                <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 flex gap-1 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setEditingItem(entry);
                                      setShowForm(true);
                                    }}
                                    className="p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-indigo-600"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => onDelete?.(entry)}
                                    className="p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="p-2 border-b border-zinc-100 dark:border-zinc-800 group-hover:bg-zinc-50/30 dark:group-hover:bg-zinc-800/10 transition-colors">
                            {entry ? (
                              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl relative group/item">
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{entry.subject_name}</p>
                                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    {role === 'STAFF' ? (
                                      <><Layers className="w-3 h-3" /> {entry.class_name} {entry.class_section}</>
                                    ) : (
                                      <><User className="w-3 h-3" /> {entry.teacher_name}</>
                                    )}
                                  </p>
                                  {entry.room && (
                                    <p className="text-[9px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-wider">
                                      <Building2 className="w-3 h-3" /> {entry.room}
                                    </p>
                                  )}
                                </div>
                                {role !== 'STAFF' && role !== 'STUDENT' && (
                                  <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 flex gap-1 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setEditingItem(entry);
                                        setShowForm(true);
                                      }}
                                      className="p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-indigo-600"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => onDelete?.(entry)}
                                      className="p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-rose-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              role !== 'STAFF' && role !== 'STUDENT' && (
                                <div className="h-full min-h-[60px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setEditingItem({ day_of_week: day, time_slot: slot });
                                      setShowForm(true);
                                    }}
                                    className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <TimetableEntryModal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSave={handleSave}
          staff={staff}
          subjects={subjects}
          days={days}
          role={role}
          editingItem={editingItem}
          selectedClassId={selectedClassId}
        />
      </div>
    );
  },
  Attendance: ({ role, wards, selectedWardId: propSelectedWardId, onWardSelect, data = [], onSave, onDelete, students = [], staffList = [], organization, onUpdateOrganization }: { role?: UserRole, wards?: any[], selectedWardId?: string | null, onWardSelect?: (id: string) => void, data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, students?: any[], staffList?: any[], organization?: any, onUpdateOrganization?: (data: any) => void }) => {
    const [viewingStudent, setViewingStudent] = useState<any>(null);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('Entire Term');
    const [selectedWardId, setLocalSelectedWardId] = useState(propSelectedWardId || wards?.[0]?.id || "");


    const loadCalendarEvents = async () => {
      try {
        const events = await fetchCalendarEvents();
        setCalendarEvents(events || []);
      } catch (err) {
        console.error('Failed to load calendar events', err);
      }
    };

    const availableMonths = useMemo(() => {
      const monthsSet = new Set<string>();
      (data || []).forEach(item => {
        if (item.date) {
          const d = new Date(item.date);
          monthsSet.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
        }
      });
      return ['Entire Term', ...Array.from(monthsSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())];
    }, [data]);

    const termStartDate = organization?.term_start_date ? new Date(organization.term_start_date).toISOString().split('T')[0] : '';
    const termEndDate = organization?.term_end_date ? new Date(organization.term_end_date).toISOString().split('T')[0] : '';
    const totalSchoolDays = organization?.attendance_total_days || 0;
    const includeWeekends = organization?.attendance_include_weekends || false;


    useEffect(() => {
      loadCalendarEvents();
    }, []);

    const holidays = useMemo(() => {
      return calendarEvents.filter(e => e.event_type === 'Holiday');
    }, [calendarEvents]);

    const calculatedTermDays = useMemo(() => {
      if (!termStartDate || !termEndDate) return null;
      const start = new Date(termStartDate);
      const end = new Date(termEndDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null;
      
      let validDays = 0;
      const curr = new Date(start);
      while (curr <= end) {
        const dayOfWeek = curr.getDay();
        const skipWeekend = !includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6);
        if (!skipWeekend) {
          const dateStr = curr.toISOString().split('T')[0];
          const isHoliday = holidays.some(h => {
            const hStart = h.start_date.split('T')[0];
            const hEnd = h.end_date ? h.end_date.split('T')[0] : hStart;
            return dateStr >= hStart && dateStr <= hEnd;
          });
          if (!isHoliday) validDays++;
        }
        curr.setDate(curr.getDate() + 1);
      }
      return validDays;
    }, [termStartDate, termEndDate, includeWeekends, holidays]);

    // We no longer sync local state here, we rely on organization props directly.

    // Settings are now managed in global organization settings.

    useEffect(() => {
      if (propSelectedWardId) setLocalSelectedWardId(propSelectedWardId);
    }, [propSelectedWardId]);

    useEffect(() => {
      if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
        setSelectedMonth(availableMonths[0]);
      }
    }, [availableMonths, selectedMonth]);

    const filteredData = useMemo(() => {
      return (data || []).filter(item => {
        if (!item.date) return false;
        if (selectedMonth === 'Entire Term') return true;
        const d = new Date(item.date);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth;
      });
    }, [data, selectedMonth]);

    const aggregatedData = useMemo(() => {
      if (role !== 'SCHOOL_ADMIN' && role !== 'HOD') return filteredData;

      let dynamicDenominator = totalSchoolDays;

      if (selectedMonth !== 'Entire Term') {
        const [monthName, yearStr] = selectedMonth.split(' ');
        const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
        const year = parseInt(yearStr);
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        
        let validDays = 0;
        for (let i = 1; i <= daysInMonth; i++) {
          const d = new Date(year, monthIndex, i);
          const dayOfWeek = d.getDay();
          
          if (!includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
            continue;
          }

          const dateStr = d.toISOString().split('T')[0];
          const isHoliday = holidays.some(h => {
             const start = h.start_date.split('T')[0];
             const end = h.end_date ? h.end_date.split('T')[0] : start;
             return dateStr >= start && dateStr <= end;
          });

          if (!isHoliday) {
            validDays++;
          }
        }
        dynamicDenominator = validDays;
      } else if (termStartDate && termEndDate) {
        const start = new Date(termStartDate);
        const end = new Date(termEndDate);
        let validDays = 0;
        const curr = new Date(start);
        
        while (curr <= end) {
          const dayOfWeek = curr.getDay();
          const skipWeekend = !includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6);
          
          if (!skipWeekend) {
            const dateStr = curr.toISOString().split('T')[0];
            const isHoliday = holidays.some(h => {
              const hStart = h.start_date.split('T')[0];
              const hEnd = h.end_date ? h.end_date.split('T')[0] : hStart;
              return dateStr >= hStart && dateStr <= hEnd;
            });
            if (!isHoliday) validDays++;
          }
          curr.setDate(curr.getDate() + 1);
        }
        dynamicDenominator = validDays;
      }

      return students.map(student => {
        const studentRecords = (data || []).filter(r => 
          String(r.student_id) === String(student.id) &&
          (selectedMonth === 'Entire Term' || new Date(r.date).toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth)
        );
        const present = studentRecords.filter(r => r.status === 'Present').length;
        
        const denominator = dynamicDenominator > 0 ? dynamicDenominator : (totalSchoolDays > 0 ? totalSchoolDays : studentRecords.length);
        const percentage = denominator > 0 ? Math.min(100, Math.round((present / denominator) * 100)) : 0;
        const absent = denominator > 0 ? Math.max(0, denominator - present) : studentRecords.length - present;
        
        return {
          ...student,
          student_name: student.name,
          presentCount: present,
          absentCount: absent,
          attendancePercentage: percentage,
          totalRecords: denominator
        };
      });
    }, [students, data, selectedMonth, role, filteredData, includeWeekends, holidays, totalSchoolDays, termStartDate, termEndDate]);

    const stats = useMemo(() => {
      if (filteredData.length === 0) return { present: 0, absent: 0, presentPercentage: 0, absentPercentage: 0 };
      const present = filteredData.filter(a => a.status === 'Present').length;
      const presentPercentage = Math.round((present / filteredData.length) * 100);
      return { 
        present, 
        absent: filteredData.length - present, 
        presentPercentage,
        absentPercentage: 100 - presentPercentage
      };
    }, [filteredData]);

    const mainColumns = useMemo(() => {
      if (role === 'SCHOOL_ADMIN' || role === 'HOD') {
        return [
          { header: 'Student', accessor: 'name', className: 'font-bold' },
          { header: 'Admission No', accessor: 'admission_no' },
          { 
            header: 'Attendance', 
            accessor: (item: any) => (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden w-24">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.attendancePercentage >= 80 ? "bg-emerald-500" :
                      item.attendancePercentage >= 60 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${item.attendancePercentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-zinc-900 dark:text-white w-8">{item.attendancePercentage}%</span>
              </div>
            )
          },
          { 
            header: 'Records', 
            accessor: (item: any) => (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[10px] font-bold">
                  {item.presentCount}P
                </span>
                <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-[10px] font-bold">
                  {item.absentCount}A
                </span>
              </div>
            )
          }
        ];
      }

      return [
        { header: 'Date', accessor: 'date', className: 'font-bold' },
        {
          header: 'Status',
          accessor: (item: any) => (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              item.status === 'Present' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {item.status}
            </span>
          )
        },
        { header: 'Check In', accessor: (item: any) => item.checkIn || item.check_in || '—' },
        { header: 'Remarks', accessor: (item: any) => item.remark || item.remarks || '—', className: 'text-zinc-500 italic' },
      ];
    }, [role]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Attendance Tracking</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time presence monitoring</p>
            </div>
            {role === 'PARENT' && wards && wards.length > 1 && (
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setLocalSelectedWardId(e.target.value);
                  onWardSelect?.(e.target.value);
                }}
                className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 mr-4">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 rounded-xl text-center min-w-[80px]">
                <p className="text-[9px] font-bold text-emerald-600 uppercase">Present</p>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{stats.presentPercentage}%</p>
              </div>
              <div className="p-3 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-800/30 rounded-xl text-center min-w-[80px]">
                <p className="text-[9px] font-bold text-rose-600 uppercase">Absent</p>
                <p className="text-sm font-black text-rose-700 dark:text-rose-400">{stats.absentPercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        </div>


        <DataTable
          title={role === 'STAFF' ? "My Attendance Log" : "Attendance Log"}
          data={aggregatedData}
          columns={mainColumns}
          autoModal={role !== 'PARENT' && role !== 'STUDENT'}
          autoViewModal={role !== 'PARENT' && role !== 'STUDENT'}
          extraActions={(role === 'SCHOOL_ADMIN' || role === 'HOD') ? (item) => (
            <button
              onClick={() => setViewingStudent(item)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              View History
            </button>
          ) : undefined}
        />

        <Modal
          isOpen={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          title={`Attendance History: ${viewingStudent?.name}`}
          maxWidth="max-w-4xl"
        >
          <div className="p-6">
            <DataTable
              title={`${viewingStudent?.name}'s Records`}
              data={(data || []).filter((r: any) => 
                String(r.student_id) === String(viewingStudent?.id) && 
                (selectedMonth === 'Entire Term' || !selectedMonth || new Date(r.date).toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth)
              )}
              columns={[
                { header: 'Date', accessor: 'date', className: 'font-bold' },
                {
                  header: 'Status',
                  accessor: (item: any) => (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      item.status === 'Present' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {item.status}
                    </span>
                  )
                },
                { 
                  header: 'Clock In', 
                  accessor: (item: any) => {
                    const val = item.clock_in || item.check_in || item.checkIn;
                    if (!val) return '—';
                    try {
                      return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } catch (e) {
                      return val;
                    }
                  }
                },
                { 
                  header: 'Clock Out', 
                  accessor: (item: any) => {
                    const val = item.clock_out || item.check_out || item.checkOut;
                    if (!val) return '—';
                    try {
                      return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } catch (e) {
                      return val;
                    }
                  }
                },
                { header: 'Remarks', accessor: (item: any) => item.remark || item.remarks || '—', className: 'text-zinc-500 italic' },
              ]}
            />
          </div>
        </Modal>
      </div>
    );
  },


  StudentIDCards: ({ students = [], classes = [], organization }: { students?: any[], classes?: any[], organization?: any }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const filteredStudents = useMemo(() => {
      let result = students;
      
      if (selectedClassId === 'unassigned') {
        result = result.filter(s => !s.class_id);
      } else if (selectedClassId) {
        result = result.filter(s => s.class_id === selectedClassId);
      }

      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(s => 
          (s.name || '').toLowerCase().includes(lowerSearch) || 
          (s.admission_no || '').toLowerCase().includes(lowerSearch)
        );
      }

      return result;
    }, [students, selectedClassId, searchTerm]);

    const toggleStudent = (id: string) => {
      setSelectedStudents(prev =>
        prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
      );
    };

    const handlePrint = () => {
      window.print();
    };

    return (
      <div className="space-y-6">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { size: portrait; margin: 10mm; }
            body * { visibility: hidden; }
            .id-card-print-area, .id-card-print-area * { visibility: visible; }
            .id-card-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15mm;
              padding: 0;
            }
            .no-print { display: none !important; }
            .id-card-container { break-inside: avoid; margin-bottom: 20mm; display: contents; }
          }
        `}} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">ID Card Generator</h2>
            <p className="text-sm text-zinc-500 font-medium">Generate professional dual-sided student identification cards.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[200px] lg:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="flex-1 lg:flex-none px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="">All Students ({students.length})</option>
              <option value="unassigned">No Class Assigned ({students.filter(s => !s.class_id).length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.section}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedStudents(filteredStudents.map(s => s.id))}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95"
              >
                Select All
              </button>
              <button
                onClick={handlePrint}
                disabled={selectedStudents.length === 0}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
                <span>({selectedStudents.length})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 no-print">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              onClick={() => toggleStudent(student.id)}
              className={cn(
                "p-4 bg-white dark:bg-zinc-900 border-2 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]",
                selectedStudents.includes(student.id)
                  ? "border-indigo-600 ring-4 ring-indigo-50"
                  : "border-zinc-100 dark:border-zinc-800"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                  {student.profile_pic || student.previous_school_profile_pic ? (
                    <img src={student.profile_pic || student.previous_school_profile_pic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-zinc-900 dark:text-white truncate uppercase">{student.name}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{student.admission_no}</p>
                </div>
                {selectedStudents.includes(student.id) && (
                  <div className="ml-auto w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* PRINT AREA - HIDDEN IN UI */}
        <div className="hidden id-card-print-area">
          {students.filter(s => selectedStudents.includes(s.id)).map(student => (
            <div key={student.id} className="id-card-container">
              {/* FRONT SIDE */}
              <div className="w-[85.6mm] h-[54mm] bg-white border border-zinc-200 rounded-[12px] relative overflow-hidden flex flex-col p-4 shadow-sm mb-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3 border-b border-zinc-100 pb-2">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {organization?.logo ? (
                      <img src={organization.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <SchoolIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-black text-zinc-900 uppercase leading-tight truncate">{organization?.name || 'Global Excellence Academy'}</h4>
                    <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-widest">Student Identification Card</p>
                  </div>
                </div>

                {/* Main Info */}
                <div className="flex gap-4 items-center flex-1">
                  <div className="w-20 h-24 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden flex-shrink-0 shadow-inner">
                    {student.profile_pic || student.previous_school_profile_pic ? (
                      <img src={student.profile_pic || student.previous_school_profile_pic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-200">
                        <User className="w-10 h-10" />
                      </div>
                    )}

                  </div>
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="space-y-0.5">
                      <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Student Name</p>
                      <p className="text-[11px] font-black text-zinc-900 uppercase truncate leading-tight">{student.name}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-0.5">
                        <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Admission No</p>
                        <p className="text-[9px] font-black text-zinc-900 uppercase">{student.admission_no}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Grade / Class</p>
                        <p className="text-[9px] font-black text-zinc-900 uppercase">{classes.find(c => c.id === student.class_id)?.name || 'Grade 10'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accent Footer */}
                <div className="absolute bottom-0 right-0 left-0 h-1.5 bg-indigo-600"></div>

                {/* Front Side QR Code */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-white p-1 border border-zinc-100 shadow-sm rounded-lg overflow-hidden z-10">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.admission_no || student.id)}`}
                    alt="Student QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full -translate-y-12 translate-x-12 -z-10"></div>
              </div>

              {/* BACK SIDE */}
              <div className="w-[85.6mm] h-[54mm] bg-white border border-zinc-200 rounded-[12px] relative overflow-hidden flex flex-col p-6 shadow-sm items-center justify-center text-center">
                {/* Disclaimer / Info */}
                <div className="mb-6 space-y-2">
                  <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                    This card remains the property of {organization?.name || 'the academy'}.
                    If found, please return to the school administration office.
                  </p>
                  <p className="text-[6px] font-medium text-zinc-400">
                    {organization?.address || '123 School Lane, Educational District'}
                  </p>
                </div>

                {/* Barcode / QR Code Section */}
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-16 h-16 bg-white p-1 border border-zinc-100 shadow-sm rounded-lg overflow-hidden">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.admission_no || student.id)}`}
                      alt="Student QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[7px] font-black text-zinc-900 uppercase tracking-[0.3em] font-mono leading-none">{student.admission_no || student.id.slice(0, 12)}</p>
                    <p className="text-[5px] font-bold text-zinc-400 uppercase tracking-widest text-center">Scan for Attendance</p>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="mt-2 w-full max-w-[200px]">
                  <div className="h-8 border-b border-zinc-300 relative flex items-center justify-center mb-1">
                    <span className="italic text-[12px] text-zinc-300 font-serif opacity-50">Principal Signature</span>
                  </div>
                  <p className="text-[8px] font-black text-zinc-900 uppercase tracking-widest">Authorized Signatory</p>
                </div>

                {/* Accent Decor */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-zinc-50 rounded-full -translate-y-10 translate-x-10 -z-10"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-zinc-50 rounded-full translate-y-10 -translate-x-10 -z-10"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  PromotionGraduation: ({ onRefresh }: { onRefresh?: () => void }) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'audit' | 'bulk'>('settings');
    const [settings, setSettings] = useState<any[]>([]);
    const [auditResults, setAuditResults] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [manualPromoStudent, setManualPromoStudent] = useState<any | null>(null);
    const [promoReason, setPromoReason] = useState('');

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/academic/promotion/settings`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecords = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/academic/promotion/records`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (err) {
        console.error('Failed to fetch records:', err);
      } finally {
        setLoading(false);
      }
    };

    const runAudit = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/academic/promotion/audit`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        if (res.ok) {
          const data = await res.json();
          setAuditResults(data);
          (window as any).showToast?.(`Audit completed for ${data.length} students.`, 'success');
        } else {
          const error = await res.json();
          (window as any).showToast?.(error, 'error');
        }
      } catch (err) {
        console.error('Failed to run audit:', err);
        (window as any).showToast?.(err, 'error');
      } finally {
        setLoading(false);
      }
    };

    const updateClassSettings = async (classId: string, updates: any) => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/academic/promotion/settings/${classId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(updates)
        });
        if (res.ok) {
          (window as any).showToast?.('Settings updated successfully!', 'success');
          fetchSettings();
        }
      } catch (err) {
        console.error('Failed to update settings:', err);
      }
    };

    const processBulkPromotion = async () => {
      const year = window.prompt('Enter Academic Year (e.g. 2025/2026):', '2025/2026');
      if (!year) return;

      if (!window.confirm('Are you sure you want to process bulk promotion for ALL eligible students? This action will update student positions and statuses.')) return;

      setProcessing(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/academic/promotion/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ academic_year: year })
        });
        const result = await res.json();
        if (res.ok) {
          (window as any).showToast?.(`Success! Promoted: ${result.promoted}, Alumni: ${result.alumni}, Retained: ${result.retained}`, 'success');
          fetchRecords();
          onRefresh?.();
        } else {
          (window as any).showToast?.(result.error || 'Something went wrong with the promotion. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Failed to process promotion:', err);
      } finally {
        setProcessing(false);
      }
    };

    const handleManualPromotion = async () => {
      if (!manualPromoStudent || !promoReason.trim()) {
        (window as any).showToast?.('Please provide a reason for manual promotion.', 'warning');
        return;
      }

      setProcessing(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/academic/promotion/manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            student_id: manualPromoStudent.student_id,
            reason: promoReason,
            academic_year: '2023/2024' // Default or dynamic
          })
        });

        if (res.ok) {
          (window as any).showToast?.(`Successfully promoted ${manualPromoStudent.student_name}!`, 'success');
          setManualPromoStudent(null);
          setPromoReason('');
          runAudit(); // Refresh audit
          fetchRecords(); // Refresh history
          onRefresh?.();
        } else {
          const error = await res.json();
          (window as any).showToast?.(error, 'error');
        }
      } catch (err) {
        console.error('Failed to manually promote student:', err);
        (window as any).showToast?.(err, 'error');
      } finally {
        setProcessing(false);
      }
    };

    useEffect(() => {
      if (activeTab === 'settings') fetchSettings();
      if (activeTab === 'bulk') fetchRecords();
      if (activeTab === 'audit') setAuditResults([]);
    }, [activeTab]);

    // Compute Promotion Summary from audit results
    const promoSummary = useMemo(() => {
      if (!auditResults.length) return [];
      const summary: Record<string, { from: string, to: string, count: number, total: number }> = {};

      auditResults.forEach(res => {
        const key = `${res.class_name}->${res.next_class_name || 'Alumni'}`;
        if (!summary[key]) {
          summary[key] = { from: res.class_name, to: res.next_class_name || 'Alumni', count: 0, total: 0 };
        }
        summary[key].total++;
        if (res.eligible) summary[key].count++;
      });

      return Object.values(summary);
    }, [auditResults]);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Promotion & Graduation</h2>
              <p className="text-sm text-zinc-500 font-medium">Manage student progression based on total academic performance averages.</p>
            </div>
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {[
              { id: 'settings', label: 'Settings', icon: SchoolIcon },
              { id: 'audit', label: 'Audit', icon: ClipboardCheck },
              { id: 'bulk', label: 'Process', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settings.map((cls) => (
                  <div key={cls.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-indigo-300 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">RANK: {cls.rank}</span>
                    </div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-tight">{cls.name} {cls.section}</h3>

                    <div className="mb-6">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Promotes To:</label>
                      <select
                        value={cls.next_class_id || ''}
                        onChange={(e) => updateClassSettings(cls.id, { next_class_id: e.target.value || 'null' })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Alumni / Graduation</option>
                        {settings.filter(c => c.id !== cls.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Average Total (%)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0" max="100"
                              value={cls.promotion_threshold}
                              onChange={(e) => updateClassSettings(cls.id, { promotion_threshold: parseInt(e.target.value) || 0 })}
                              className="w-12 bg-indigo-600 text-white text-[10px] font-black rounded-lg px-2 py-0.5 text-center outline-none"
                            />
                            <span className="text-[10px] font-black text-indigo-600">%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={cls.promotion_threshold || 0}
                          onChange={(e) => updateClassSettings(cls.id, { promotion_threshold: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && settings.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                      <Layers className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">No Classes Defined</h3>
                      <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto mt-2">Please add classes in the Academic Management module before configuring promotion rules.</p>
                    </div>
                  </div>
                )}
                {loading && (
                  <div className="col-span-full py-20 text-center animate-pulse">
                    <Zap className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Loading Settings...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-8">
              <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="relative z-10 flex-1">
                  <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Run Readiness Audit</h2>
                  <p className="text-indigo-100 font-medium text-sm leading-relaxed max-w-xl">
                    Calculating cumulative averages for all students. No data will be modified.
                  </p>
                </div>
                <button
                  onClick={runAudit}
                  disabled={loading}
                  className="relative z-10 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Zap className="w-4 h-4 animate-spin text-amber-500" /> : <ClipboardCheck className="w-4 h-4" />}
                  {loading ? 'Performing Audit...' : 'Run Audit Now'}
                </button>
                <div className="absolute top-0 right-0 p-10 opacity-10">
                  <TrendingUp className="w-48 h-48" />
                </div>
              </div>

              {promoSummary.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
                  <div className="col-span-full mb-2">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-4">
                      Promotion Summary Visualization
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    </h3>
                  </div>
                  {promoSummary.map((sum, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <span className="text-[10px] font-black uppercase text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{sum.from}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-300" />
                        <span className="text-[10px] font-black uppercase text-indigo-600 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">{sum.to}</span>
                      </div>
                      <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{sum.count}</span>
                        <span className="text-sm font-bold text-zinc-500 tracking-tight">/ {sum.total} Students</span>
                      </div>
                      <div className="mt-3 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden relative z-10">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-1000"
                          style={{ width: `${(sum.count / sum.total) * 100}%` }}
                        />
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <GraduationCap className="w-24 h-24 rotate-12" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {auditResults.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Student</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Class</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Performance</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Final Status</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {auditResults.map((res, i) => (
                        <tr key={i} className={cn(
                          "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors",
                          !res.next_class_id && "bg-amber-50/20 dark:bg-amber-900/10"
                        )}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{res.student_name}</p>
                            <p className="text-[10px] font-bold text-zinc-400">{res.student_email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400">{res.class_name}</span>
                              {!res.next_class_id && (
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-1">Grade 12 Graduation Candidate</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-lg font-black tracking-tighter",
                                res.cumulative_average >= res.promotion_threshold ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {res.cumulative_average.toFixed(1)}%
                              </span>
                              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                              <span className="text-[10px] font-bold text-zinc-400">Target: {res.promotion_threshold}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn(
                              "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border",
                              res.status === 'Eligible' || res.status === 'Manually Promoted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                res.status === 'Graduating' ? "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm" :
                                  "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                              {res.status === 'Eligible' || res.status === 'Manually Promoted' ? <CheckCircle className="w-3 h-3" /> :
                                res.status === 'Graduating' ? <ShieldCheck className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {res.status}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setManualPromoStudent(res)}
                              className="p-2 hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 rounded-lg transition-colors group"
                              title="Manual Promotion Override"
                            >
                              <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && auditResults.length === 0 && (
                <div className="py-20 text-center space-y-4 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                    <ClipboardCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Ready for Audit</h3>
                    <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto mt-2">Click "Run Audit Now" to calculate promotion eligibility based on current scores.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-12">
              <div className="bg-rose-600 rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-2xl shadow-rose-200 dark:shadow-none">
                <div className="relative z-10 flex-1">
                  <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Finalize Academic Progression</h2>
                  <p className="text-rose-100 font-medium text-sm leading-relaxed max-w-xl italic">
                    WARNING: This will process promotions, graduation, and retention for all students. Actions are irreversible. Ensure audit is reviewed.
                  </p>
                </div>
                <button
                  onClick={processBulkPromotion}
                  disabled={processing}
                  className="relative z-10 px-6 py-3 bg-white text-rose-600 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50"
                >
                  {processing ? <Zap className="w-5 h-5 animate-spin text-amber-500" /> : <ShieldCheck className="w-5 h-5" />}
                  {processing ? 'Processing...' : 'Run Bulk Promotion'}
                </button>
                <div className="absolute -bottom-10 -right-10 opacity-10">
                  <GraduationCap className="w-64 h-64" />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight px-2 flex items-center gap-3">
                  <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                  Promotion History & Audit Logs
                </h3>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Student</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Journey</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Performance</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Note / Reason</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Action</th>
                        <th className="px-6 py-4 font-black uppercase text-zinc-400 text-[10px] tracking-widest">Processed On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {records.length > 0 ? records.map((rec, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{rec.student_name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 italic">AY {rec.academic_year}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase text-zinc-500 px-2 py-1 bg-zinc-100 rounded-lg">{rec.from_class_name}</span>
                              <ChevronRight className="w-3 h-3 text-zinc-400" />
                              <span className="text-[10px] font-black uppercase text-indigo-600 px-2 py-1 bg-indigo-50 rounded-lg">{rec.to_class_name || 'Alumni'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-emerald-600">{parseFloat(rec.cumulative_average).toFixed(1)}%</span>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Avg Score</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 max-w-[150px] truncate" title={rec.reason || rec.promotion_reason}>
                              {rec.reason || rec.promotion_reason || <span className="opacity-30 italic">N/A</span>}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                              rec.status === 'Promoted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                rec.status === 'Alumni' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                  "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-zinc-600 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 opacity-50" />
                              {new Date(rec.processed_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center opacity-20">
                              <TrendingUp className="w-16 h-16 mb-4" />
                              <p className="text-xs font-black uppercase tracking-[0.2em]">No promotion records found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Promotion Modal */}
        <Modal
          isOpen={!!manualPromoStudent}
          onClose={() => setManualPromoStudent(null)}
          title="Manual Promotion Override"
          maxWidth="max-w-2xl"
        >
          {manualPromoStudent && (
            <div className="space-y-6">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">{manualPromoStudent.student_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{manualPromoStudent.class_name}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-300" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      {manualPromoStudent.next_class_name || 'Alumni / Graduation'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Reason for Promotion</label>
                <textarea
                  value={promoReason}
                  onChange={(e) => setPromoReason(e.target.value)}
                  placeholder="e.g. Exceptional merit performance, special consideration..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setManualPromoStudent(null)}
                  className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualPromotion}
                  disabled={processing || !promoReason.trim()}
                  className="flex-[2] px-4 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Zap className="w-4 h-4 animate-spin text-amber-500" /> : <ShieldCheck className="w-4 h-4" />}
                  {processing ? 'Processing...' : 'Confirm Promotion'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  },

};

const ExamScheduleForm = ({ item, subjects, classes, organization }: any) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(item?.subject_id || "");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    item?.class_id
      ? [String(item.class_id)]
      : (item?.class_ids ? item.class_ids.map(String) : [])
  );

  const selectedSubject = subjects.find((s: any) => String(s.id) === String(selectedSubjectId));
  const firstClassId = selectedClassIds[0];
  const previewSubject = subjects.find((s: any) =>
    s.name === selectedSubject?.name && String(s.class_id) === String(firstClassId)
  ) || selectedSubject;
  const autoTeacherName = previewSubject?.teacher_name || 'N/A';

  // Auto-set all classes that have this subject name
  useEffect(() => {
    if (selectedSubject?.name) {
      const targetName = selectedSubject.name.toLowerCase().trim();
      const allClassIdsForSubject: string[] = [];

      subjects
        .filter((s: any) => s.name?.toLowerCase().trim() === targetName)
        .forEach((s: any) => {
          if (s.classes && Array.isArray(s.classes)) {
            s.classes.forEach((c: any) => allClassIdsForSubject.push(String(c.id)));
          } else if (s.class_id) {
            allClassIdsForSubject.push(String(s.class_id));
          }
        });

      const uniqueClassIds = Array.from(new Set(allClassIdsForSubject));
      if (uniqueClassIds.length > 0) {
        setSelectedClassIds(uniqueClassIds);
      }
    } else {
      setSelectedClassIds([]);
    }
  }, [selectedSubjectId, selectedSubject, subjects]);

  return (
    <div className="space-y-4">
      <input type="hidden" name="subject" value={selectedSubject?.name || ''} />
      <input type="hidden" name="term" value={item?.term || (organization as any)?.current_term || ''} />
      <input type="hidden" name="academic_year" value={item?.academic_year || (organization as any)?.academic_year || ''} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Subject</label>
          <select
            name="subject_id"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Subject</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.class_name || 'Generic'})</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Classes</label>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl max-h-[150px] overflow-y-auto space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setSelectedClassIds(classes.map((c: any) => c.id))}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Select All
              </button>
              <span className="text-zinc-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedClassIds([])}
                className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:underline"
              >
                Clear
              </button>
            </div>
            {classes.map((c: any) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedClassIds.includes(String(c.id))}
                  onChange={(e) => {
                    const idStr = String(c.id);
                    if (e.target.checked) {
                      setSelectedClassIds([...selectedClassIds, idStr]);
                    } else {
                      setSelectedClassIds(selectedClassIds.filter(id => String(id) !== idStr));
                    }
                  }}
                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                  {c.name} {c.section || ''}
                </span>
              </label>
            ))}
          </div>
          <input type="hidden" name="class_ids" value={JSON.stringify(selectedClassIds)} />
          <p className="text-[10px] text-zinc-400 font-medium">{selectedClassIds.length} classes selected for this schedule.</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase">Supervisor / Teacher</label>
        <input
          type="text"
          value={autoTeacherName}
          disabled
          className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none text-zinc-500 cursor-not-allowed font-medium"
        />
        <p className="text-[10px] text-zinc-400">Auto-populated based on the selected subject's assigned teacher.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Exam Type</label>
          <select name="type" defaultValue={item?.type || 'Final Exam'} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="Mid-Term">Mid-Term</option>
            <option value="Final Exam">Final Exam</option>
            <option value="Class Test">Class Test</option>
            <option value="Mock Exam">Mock Exam</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Room</label>
          <input type="text" name="room" defaultValue={item?.room} placeholder="e.g. Hall A" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Date</label>
          <input type="date" name="date" defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : ''} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Time</label>
          <input
            type="time"
            name="time"
            defaultValue={(() => {
              if (!item?.time) return '';
              // Handle format '09:00 AM' -> '09:00', '02:00 PM' -> '14:00'
              const match = item.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
              if (match) {
                let [_, hours, mins, modifier] = match;
                if (hours === '12') hours = '00';
                if (modifier.toUpperCase() === 'PM') hours = (parseInt(hours, 10) + 12).toString();
                return `${hours.padStart(2, '0')}:${mins}`;
              }
              return item.time;
            })()}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>
    </div>
  );
};

const ExamDetailView = ({ item, subjects, classes, onEdit, onNavigate }: any) => {
  const selectedSubjectId = item.subject_id || (subjects.find((s: any) => s.name === (item.subject || item.subject_name))?.id);
  const selectedSubject = subjects.find((s: any) => String(s.id) === String(selectedSubjectId)) || { name: item.subject_name || item.subject };
  const teacherName = selectedSubject?.teacher_name || 'Not assigned';

  // Format Date and Time Status
  const getStatusInfo = () => {
    if (!item.date) return { status: 'Not Scheduled', color: 'bg-zinc-100 text-zinc-500', icon: <Loader2 className="w-3.5 h-3.5" /> };

    const now = new Date();
    const examDate = new Date(`${item.date.split('T')[0]}T${item.time || "00:00"}`);

    // Check if it's today
    const isToday = now.toDateString() === examDate.toDateString();

    if (examDate < now && !isToday) {
      return { status: 'Completed', color: 'bg-stone-100 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800', icon: <CheckCircle2 className="w-3.5 h-3.5" />, pulse: false };
    } else if (isToday) {
      return { status: 'In Progress', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30', icon: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />, pulse: true };
    } else {
      return { status: 'Upcoming', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30', icon: <Clock className="w-3.5 h-3.5" />, pulse: false };
    }
  };

  const statusInfo = getStatusInfo();
  let formattedDate = 'Not Scheduled';
  if (item.date) {
    const dateObj = new Date(item.date);
    formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Dynamic Glassmorphism Header Section */}
      <div className="relative p-8 rounded-[2.5rem] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-500/5 to-transparent dark:from-indigo-600/10 dark:via-purple-500/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-bl-[10rem] -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] transition-all hover:scale-105">
                <Award className="w-3.5 h-3.5" />
                {item.type || 'Examination'}
              </span>
              <span className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm", statusInfo.color)}>
                {statusInfo.icon}
                {statusInfo.status}
              </span>
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none lowercase drop-shadow-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {selectedSubject.name}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-3 lowercase flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Examination Details & Schedule Instance
              </p>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[2rem] border border-white/40 dark:border-white/5 shadow-xl shadow-zinc-200/20 dark:shadow-none hover:scale-105 transition-transform duration-500">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 mb-3 group-hover:rotate-12 transition-transform">
              <Calendar className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">{item.time || '--:--'}</p>
          </div>
        </div>
      </div>

      {/* Revamped Interactive Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 mb-4 group-hover:-translate-y-1 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Scheduled Date</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{formattedDate}</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-4 group-hover:-translate-y-1 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Start Time</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{item.time || 'TBD'}</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 mb-4 group-hover:-translate-y-1 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Venue / Room</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{item.room || 'Not Set'}</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 mb-4 group-hover:-translate-y-1 transition-transform">
            <UserCircle className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Supervisor</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{teacherName}</p>
        </div>
      </div>

      {/* Dynamic Participating Classes */}
      <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group mx-2">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-50 dark:from-zinc-800 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
            <Users className="w-4 h-4" />
          </div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Participating Classes</label>
        </div>

        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 scrollbar-hide">
          {(item.class_ids || []).map((cid: string) => {
            const cls = classes.find((c: any) => String(c.id) === String(cid));
            return (
              <div key={cid} className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group/pill cursor-default">
                <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover/pill:scale-150 transition-transform" />
                <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  {cls?.name} {cls?.section || ''}
                </span>
              </div>
            );
          })}
          {(item.class_ids || []).length === 0 && (
            <div className="px-5 py-3 bg-white/50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-xs font-bold text-zinc-400 italic">
              No classes assigned yet.
            </div>
          )}
        </div>
      </div>

      {/* Action Bar Refinement */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 px-2">
        <button
          onClick={onEdit}
          className="flex-1 px-8 py-4 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl flex items-center justify-center gap-3 group/btn"
        >
          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover/btn:bg-indigo-50 dark:group-hover/btn:bg-indigo-900/30 group-hover/btn:text-indigo-600 transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </div>
          Edit Schedule
        </button>
        <button
          onClick={() => onNavigate?.("Results Management")}
          className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all hover:-translate-y-1 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center justify-center gap-3 group/btn"
        >
          Manage Results
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:translate-x-1 group-hover/btn:bg-white group-hover/btn:text-indigo-600 transition-all">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </div>
  );
};

export const ExamModules = {
  ExamSchedules: ({
    role,
    wards,
    organization,
    data,
    subjects = [],
    classes = [],
    onSave,
    onDelete,
    currentUser,
    staffList = [],
    onNavigate,
    selectedWardId: propSelectedWardId,
    onWardSelect,
  }: {
    role?: UserRole;
    wards?: any[];
    organization?: any;
    data?: any[];
    subjects?: any[];
    classes?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    currentUser?: any;
    staffList?: any[];
    onNavigate?: (view: string) => void;
    selectedWardId?: string | null;
    onWardSelect?: (id: string) => void;
  }) => {
    const [viewMode, setViewMode] = useState<'list' | 'timetable'>('list');
    const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedWardId, setLocalSelectedWardId] = useState(propSelectedWardId || wards?.[0]?.id || "");

    useEffect(() => {
      if (propSelectedWardId) setLocalSelectedWardId(propSelectedWardId);
    }, [propSelectedWardId]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isEditingModal, setIsEditingModal] = useState(false);

    const scheduleData = useMemo(() => {
      const exams = data || [];
      if (role === "SCHOOL_ADMIN" || role === "HR") return exams;

      // For HOD and STAFF, subjects is already filtered in App.tsx
      // We filter exams to match those subjects
      const subjectIds = new Set(subjects.map((s) => String(s.id).toLowerCase()));
      return exams.filter((exam) => {
        const sId = exam.subject_id || exam.subjectId;
        return sId && subjectIds.has(String(sId).toLowerCase());
      });
    }, [data, role, subjects]);

    const handlePrintSchedule = () => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const schoolName = organization?.name || "Our School";
      const principalName = organization?.principal_name || 'The Principal';
      const logoUrl = organization?.logo;
      const signatureUrl = organization?.signature;

      const html = `
        <html>
          <head>
            <title>Official Exam Schedule - ${schoolName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #18181b; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f4f4f5; padding-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 15px; }
              .logo { width: 80px; height: 80px; object-contain; margin-bottom: 5px; }
              .school-name { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em; color: #4f46e5; margin-bottom: 5px; }
              .document-title { font-size: 16px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f8fafc; text-align: left; padding: 12px 15px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border: 1px solid #e2e8f0; }
              td { padding: 12px 15px; font-size: 12px; border: 1px solid #e2e8f0; font-weight: 500; }
              .exam-type { font-weight: 800; color: #4f46e5; }
              .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
              .signature-block { text-align: center; width: 220px; display: flex; flex-direction: column; align-items: center; }
              .signature-img { max-height: 60px; object-contain; margin-bottom: -10px; }
              .signature-line { border-top: 1px solid #18181b; margin-top: 10px; padding-top: 5px; font-size: 10px; font-weight: 800; text-transform: uppercase; width: 100%; }
              .principal-sig { font-family: 'Dancing Script', cursive; font-size: 24px; color: #1e1b4b; margin-bottom: -10px; }
              .stamp-placeholder { width: 100px; height: 100px; border: 3px dashed #e2e8f0; border-radius: 50%; display: flex; items-center; justify-content: center; font-size: 8px; font-weight: 900; color: #e2e8f0; text-transform: uppercase; transform: rotate(-15deg); }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ''}
              <div class="school-name">${schoolName}</div>
              <div class="document-title">Official Examination Schedule</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Room</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(exam => `
                  <tr>
                    <td>${exam.date ? new Date(exam.date).toLocaleDateString() : ''}</td>
                    <td>${exam.time}</td>
                    <td><strong>${exam.subject_name || exam.subject}</strong></td>
                    <td>${exam.class_name} ${exam.class_section || ''}</td>
                    <td>${exam.room}</td>
                    <td class="exam-type">${exam.type}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <div class="stamp-placeholder">School Stamp</div>
              <div class="signature-block">
                ${signatureUrl
          ? `<img src="${signatureUrl}" class="signature-img" alt="Principal Signature" />`
          : `<div class="principal-sig">${principalName}</div>`
        }
                <div class="signature-line">Principal's Signature</div>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    };

    const goToPrevious = () => {
      const newDate = new Date(currentDate);
      if (filterType === 'day') newDate.setDate(newDate.getDate() - 1);
      else if (filterType === 'month') newDate.setMonth(newDate.getMonth() - 1);
      else if (filterType === 'week') newDate.setDate(newDate.getDate() - 7);
      else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
      setCurrentDate(newDate);
    };

    const goToNext = () => {
      const newDate = new Date(currentDate);
      if (filterType === 'day') newDate.setDate(newDate.getDate() + 1);
      else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + 1);
      else if (filterType === 'week') newDate.setDate(newDate.getDate() + 7);
      else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
      setCurrentDate(newDate);
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderTimetable = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);

      const filteredData = (scheduleData || []).filter((item) => {
        if (!item.date) return false;
        const d = new Date(item.date);
        if (filterType === 'day') return d.toDateString() === currentDate.toDateString();
        if (filterType === 'month') return d.getMonth() === month && d.getFullYear() === year;
        if (filterType === 'year') return d.getFullYear() === year;
        if (filterType === 'week') {
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return d >= startOfWeek && d <= endOfWeek;
        }
        return true;
      });

      if (filterType === 'day') {
        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-bl-[10rem] -mr-32 -mt-32" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none animate-in fade-in zoom-in duration-500">
                  <Calendar className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-2">
                    {currentDate.toLocaleDateString(undefined, { weekday: 'long' })}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em]">
                      {currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    <span className="text-xs font-bold text-zinc-400">
                      {filteredData.length} Examinations Scheduled
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative space-y-8 before:absolute before:left-[47px] before:top-2 before:bottom-2 before:w-1 before:bg-gradient-to-b before:from-indigo-100 before:via-indigo-500/20 before:to-transparent dark:before:from-indigo-900/50 dark:before:via-indigo-500/10">
              {filteredData.sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((exam, idx) => {
                const now = new Date();
                const examTime = exam.time || "00:00";
                const isPast = new Date(`${currentDate.toISOString().split('T')[0]}T${examTime}`) < now;

                return (
                  <div key={idx} className="flex items-start gap-8 relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-500 z-10",
                        isPast ? "bg-emerald-500 border-white dark:border-zinc-900" : "bg-white dark:bg-zinc-900 border-indigo-600"
                      )}>
                        {isPast && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{exam.time}</span>
                    </div>

                    <div className="flex-1 group">
                      <div className="p-8 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[3rem] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none">
                                {exam.type}
                              </span>
                              <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full text-[9px] font-black uppercase tracking-widest">
                                Room {exam.room}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors">
                                {exam.subject_name || exam.subject}
                              </h4>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                  <Users className="w-4 h-4" />
                                  {exam.class_name} {exam.class_section || ''}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                  <Clock className="w-4 h-4" />
                                  Duration: 2h 30m
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                            <button
                              onClick={() => {
                                setEditingItem(exam);
                                setIsEditingModal(false);
                              }}
                              className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (onNavigate) {
                                  onNavigate("Results Management");
                                } else {
                                  // Fallback if onNavigate not provided
                                  setEditingItem(exam);
                                  setIsEditingModal(false);
                                }
                              }}
                              className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                            >
                              <ArrowRightCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredData.length === 0 && (
                <div className="py-24 text-center space-y-6 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-700">
                  <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-200 shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <Clock className="w-12 h-12" />
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">No Exams Today</h3>
                    <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">Relax and breathe! There are no examinations scheduled for this calendar date.</p>
                  </div>
                  {(role === "SCHOOL_ADMIN" || role === "HOD") && (
                    <button
                      onClick={() => setViewMode("list")}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"
                    >
                      Create Schedule
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (filterType === 'month' || filterType === 'week') {
        const days = [];
        let labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        if (filterType === 'month') {
          for (let i = 0; i < firstDay; i++) days.push(null);
          for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        } else {
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
          }
        }

        return (
          <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[3rem] p-10 shadow-2xl overflow-x-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="min-w-[1000px]">
              <div className="grid grid-cols-7 gap-6 text-center mb-10">
                {labels.map(day => (
                  <div key={day} className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 flex flex-col items-center gap-2">
                    {day}
                    <div className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-6">
                {days.map((date, i) => {
                  if (date === null) return <div key={`empty-${i}`} className="aspect-video bg-zinc-50/20 dark:bg-zinc-800/20 rounded-[2rem] border border-dashed border-zinc-100 dark:border-zinc-800/50" />;

                  const dateStr = date.toISOString().split('T')[0];
                  const exams = filteredData.filter(e => e.date && e.date.startsWith(dateStr));
                  const isToday = new Date().toDateString() === date.toDateString();

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setCurrentDate(date);
                        setFilterType('day');
                      }}
                      className={cn(
                        "group min-h-[160px] p-5 rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 hover:shadow-2xl hover:z-20",
                        isToday
                          ? "bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-200 dark:shadow-none text-white overflow-hidden relative"
                          : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-400 shadow-sm"
                      )}
                    >
                      {isToday && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700" />}

                      <div className="flex items-center justify-between mb-1 relative">
                        <span className={cn(
                          "text-base font-black w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-500",
                          isToday ? "bg-white text-indigo-600 scale-110 shadow-lg" : "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                        )}>{date.getDate()}</span>
                        {filterType === 'week' && <span className={cn("text-[10px] font-black uppercase tracking-widest", isToday ? "text-white/70" : "text-zinc-400")}>{date.toLocaleDateString(undefined, { month: 'short' })}</span>}
                        {!isToday && exams.length > 0 && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                      </div>

                      <div className="flex flex-col gap-2 overflow-y-auto max-h-[120px] scrollbar-hide relative">
                        {exams.map((exam, idx) => (
                          <div key={idx} className={cn(
                            "p-3 rounded-2xl transition-all duration-300 border flex flex-col gap-1",
                            isToday ? "bg-white/10 border-white/20" : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 shadow-sm group-hover:border-indigo-100"
                          )}>
                            <p className={cn("text-[10px] font-black truncate leading-tight uppercase tracking-tight", isToday ? "text-white" : "text-zinc-900 dark:text-white")}>
                              {exam.subject_name || exam.subject}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p className={cn("text-[9px] font-bold truncate", isToday ? "text-white/70" : "text-zinc-400")}>
                                {exam.time} • {exam.room}
                              </p>
                              <div className={cn("w-1.5 h-1.5 rounded-full", exam.type.toLowerCase().includes('final') ? "bg-red-400" : "bg-indigo-400")} />
                            </div>
                          </div>
                        ))}
                        {exams.length === 0 && !isToday && (
                          <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500">
                            <Plus className="w-6 h-6 text-indigo-200 dark:text-indigo-900/50" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((exam, idx) => (
            <div key={idx} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{exam.type}</span>
              </div>
              <h4 className="font-bold text-lg mb-1">{exam.subject_name || exam.subject}</h4>
              <p className="text-zinc-500 text-sm mb-4 font-medium">{exam.class_name} {exam.class_section || ''}</p>
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {new Date(exam.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  {exam.time}
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Room: {exam.room}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(exam);
                      setIsEditingModal(false);
                    }}
                    className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigate) {
                        onNavigate("Results Management");
                      } else {
                        setEditingItem(exam);
                        setIsEditingModal(false);
                      }
                    }}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    Results
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-zinc-400">No exams scheduled for this {filterType}</h3>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-12">
        <div className="relative p-8 md:p-12 bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm group">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{organization?.academic_year || 'Academic Calender'}</span>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4 leading-none lowercase">
                  Examination<br /><span className="text-zinc-400 dark:text-zinc-500 font-light">Schedules</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-sm leading-relaxed lowercase text-lg">
                  Visualize academic assessments across departments with real-time tracking and official reporting.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePrintSchedule}
                className="px-8 py-4 bg-white hover:bg-zinc-50 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-zinc-200/50 flex items-center gap-3 group/btn border border-zinc-100"
              >
                <Printer className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                Print Schedule
              </button>
              {(role === "SCHOOL_ADMIN" || role === "HOD") && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-indigo-500/20 flex items-center gap-3 group/btn"
                >
                  <Plus className="w-4 h-4 group-hover/btn:scale-125 transition-transform" />
                  Add Examination
                </button>
              )}
              {viewMode === 'timetable' && (
                <div className="flex items-center gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-inner">
                  {['day', 'week', 'month'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type as any)}
                      className={cn(
                        "px-6 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        filterType === type ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4">
            {role === 'PARENT' && wards && wards.length > 1 && (
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-indigo-400 transition-colors">
                <span className="text-[10px] font-black text-zinc-400 ml-2 uppercase tracking-[0.2em]">Ward:</span>
                <select
                  value={selectedWardId}
                  onChange={(e) => {
                    setLocalSelectedWardId(e.target.value);
                    onWardSelect?.(e.target.value);
                  }}
                  className="bg-transparent text-sm font-black text-zinc-900 dark:text-white outline-none pr-4 cursor-pointer"
                >
                  {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-inner">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-3 rounded-xl transition-all duration-300",
                  viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-lg text-indigo-600 scale-105" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('timetable')}
                className={cn(
                  "p-3 rounded-xl transition-all duration-300",
                  viewMode === 'timetable' ? "bg-white dark:bg-zinc-700 shadow-lg text-indigo-600 scale-105" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {viewMode === 'timetable' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button onClick={goToPrevious} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-bold px-2 whitespace-nowrap">
                  {filterType === 'day' && currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {filterType === 'month' && currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  {filterType === 'week' && `Week of ${currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                  {filterType === 'year' && currentDate.getFullYear()}
                </span>
                <button onClick={goToNext} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          )}
        </div>

        {viewMode === 'list' ? (
          <DataTable
            title="Exam Schedules"
            data={scheduleData}
            autoModal={false}
            onView={(item) => {
              setEditingItem(item);
              setIsEditingModal(false);
            }}
            onEdit={(item) => {
              setEditingItem(item);
              setIsEditingModal(true);
            }}
            onSave={
              role === "STUDENT" || role === "STAFF"
                ? undefined
                : async (formData) => {
                  const classIdsJson = formData.class_ids;
                  const classIds = classIdsJson ? (typeof classIdsJson === 'string' ? JSON.parse(classIdsJson) : classIdsJson) : [];
                  if (classIds.length === 0) {
                    (window as any).showToast?.("Please select at least one class.", "error");
                    return;
                  }
                  const payload = {
                    ...formData,
                    class_ids: classIds,
                  };
                  await onSave?.(payload);
                }
            }
            onDelete={
              role === "STUDENT" || role === "STAFF" ? undefined : onDelete
            }
            onAdd={
              role === "SCHOOL_ADMIN" || role === "HOD" ? () => setIsAddModalOpen(true) : undefined
            }
            columns={[
              { header: 'Subject', accessor: (item) => item.subject_name || item.subject, className: 'font-bold' },
              { header: 'Class', accessor: (item) => `${item.class_name || 'N/A'} ${item.class_section || ''}` },
              { header: 'Date', accessor: (item) => item.date ? new Date(item.date).toLocaleDateString() : 'N/A' },
              { header: 'Time', accessor: 'time' },
              { header: 'Room', accessor: 'room' },
              { header: 'Type', accessor: 'type' },
            ]}
            renderForm={(item) => <ExamScheduleForm item={item} subjects={subjects} classes={classes} organization={organization} />}
          />
        ) : renderTimetable()}

        {editingItem && (
          <Modal
            isOpen={true}
            onClose={() => {
              setEditingItem(null);
              setIsEditingModal(false);
            }}
            title={isEditingModal ? `Edit Examination: ${editingItem.subject || editingItem.subject_name}` : `Examination Details`}
            maxWidth="max-w-[700px]"
          >
            <div className="p-6">
              {isEditingModal ? (
                <>
                  <ExamScheduleForm
                    item={editingItem}
                    subjects={subjects}
                    classes={classes}
                  />
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditingModal(false)}
                      className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                    >
                      Back to View
                    </button>
                    <button
                      onClick={async () => {
                        const form = document.querySelector('form') as HTMLFormElement;
                        if (form) {
                          const formData = new FormData(form);
                          const data = Object.fromEntries(formData.entries());
                          const classIds = Array.from(form.querySelectorAll('input[name="class_ids"]:checked')).map(cb => (cb as HTMLInputElement).value);

                          await onSave?.({
                            ...editingItem,
                            ...data,
                            class_ids: classIds
                          });
                          setEditingItem(null);
                          setIsEditingModal(false);
                        }
                      }}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <ExamDetailView
                  item={editingItem}
                  subjects={subjects}
                  classes={classes}
                  onEdit={() => setIsEditingModal(true)}
                  onNavigate={onNavigate}
                />
              )}
            </div>
          </Modal>
        )}

        {isAddModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsAddModalOpen(false)}
            title="Add New Examination"
            footer={
              <>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const form = document.getElementById(
                      "add-exam-form",
                    ) as HTMLFormElement;
                    if (form) {
                      const formData = new FormData(form);
                      const values: any = {};
                      formData.forEach((value, key) => {
                        if (key !== "class_id" && key !== "class_ids") {
                          values[key] = value;
                        }
                      });

                      const classIdsJson = formData.get('class_ids') as string;
                      const classIds = classIdsJson ? JSON.parse(classIdsJson) : [];

                      if (classIds.length === 0) {
                        (window as any).showToast?.("Please select at least one class.", "error");
                        return;
                      }

                      if (onSave) {
                        await onSave({ ...values, class_ids: classIds });
                      }
                    }
                    setIsAddModalOpen(false);
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Add Schedule
                </button>
              </>
            }
          >
            <form id="add-exam-form" onSubmit={(e) => e.preventDefault()}>
              <ExamScheduleForm subjects={subjects} classes={classes} organization={organization} />
            </form>
          </Modal>
        )}
      </div>
    );
  },
  ResultsManagement: ({ role, data = [], wards = [], selectedWardId: propSelectedWardId, onWardSelect, classes = [], students = [], exams = [], reportCardTemplates = [], remarkTemplates = [], organization, onSaveResults, subjects = [], staffList = [], currentUser }: { role?: UserRole, data?: any[], wards?: any[], selectedWardId?: string | null, onWardSelect?: (id: string) => void, classes?: any[], students?: any[], exams?: any[], reportCardTemplates?: any[], remarkTemplates?: any[], organization?: any, onSaveResults?: (data: any) => Promise<void>, subjects?: any[], staffList?: any[], currentUser?: any }) => {
    const [localSelectedWardId, setLocalSelectedWardId] = useState(propSelectedWardId || wards?.[0]?.id || "");

    useEffect(() => {
      if (propSelectedWardId) setLocalSelectedWardId(propSelectedWardId);
    }, [propSelectedWardId]);

    const selectedWardId = propSelectedWardId || localSelectedWardId;
    const [showTopPerformers, setShowTopPerformers] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [scoreDetails, setScoreDetails] = useState<Record<string, Record<string, number>>>({});
    const [remarks, setRemarks] = useState<Record<string, string>>({});
    const [performanceGroupBy, setPerformanceGroupBy] = useState<'class' | 'subject'>('class');
    const [selectedPerformanceGroup, setSelectedPerformanceGroup] = useState<any | null>(null);
    const [showReportCard, setShowReportCard] = useState<any | null>(null);
    const [showClassRemarks, setShowClassRemarks] = useState(false);
    const [selectedClassRemarksId, setSelectedClassRemarksId] = useState("");
    const [terminalRemarks, setTerminalRemarks] = useState<Record<string, { teacher_remark: string, principal_remark?: string }>>({});
    const [selectedAcademicYear, setSelectedAcademicYear] = useState((organization as any)?.academic_year || "");
    const [selectedTerm, setSelectedTerm] = useState((organization as any)?.current_term || "");
    const [showBroadcaster, setShowBroadcaster] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastProgress, setBroadcastProgress] = useState(0);
    const [promotionRecords, setPromotionRecords] = useState<any[]>([]);

    useEffect(() => {
      const loadPromotionRecords = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/academic/promotion/records`, {
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
          });
          if (res.ok) {
            const data = await res.json();
            setPromotionRecords(data);
          }
        } catch (err) {
          console.error('Failed to fetch promotion records:', err);
        }
      };
      loadPromotionRecords();
    }, []);

    const hodDeptId = useMemo(() => {
      if (role !== 'HOD') return null;
      const hod = (staffList || []).find(s => String(s.email).toLowerCase().trim() === String(currentUser?.email).toLowerCase().trim());
      return hod?.department_id ? String(hod.department_id).toLowerCase() : null;
    }, [role, staffList, currentUser]);

    const results = data || [];
    const filteredResults = results.filter((r: any) => exams.some((e: any) => String(e.id) === String(r.exam_id)));

    // Calculate Ranks and Percentages locally
    const processedResults = useMemo(() => {
      const groups: Record<string, any[]> = {};

      // We always process all results for correct ranking
      results.forEach((r: any) => {
        if (!groups[r.exam_id]) groups[r.exam_id] = [];
        groups[r.exam_id].push({ ...r, score: parseFloat(String(r.score)) || 0 });
      });

      const allProcessed: any[] = [];
      Object.keys(groups).forEach(examId => {
        const examGroup = groups[examId];
        const exam = exams.find((e: any) => String(e.id) === String(examId));
        const cls = exam ? classes.find((c: any) => String(c.id) === String(exam.class_id)) : null;
        const tmpl = cls ? reportCardTemplates.find((t: any) => String(t.id) === String(cls.report_card_template_id)) : null;
        const acSec = tmpl?.sections?.find((s: any) => s.type === 'AcademicResults' && s.enabled);

        let maxTotal = 100;
        if (acSec?.settings) {
          maxTotal = (acSec.settings.classScoreMax || 30) + (acSec.settings.examScoreMax || 70);
        }

        examGroup.sort((a, b) => (b.score || 0) - (a.score || 0));

        examGroup.forEach((res, index) => {
          if (index > 0 && res.score === examGroup[index - 1].score) {
            res.rank = examGroup[index - 1].rank;
          } else {
            res.rank = index + 1;
          }
          res.percentage = `${((res.score || 0) / maxTotal * 100).toFixed(1)}%`;
        });
        allProcessed.push(...examGroup);
      });
      return allProcessed;
    }, [filteredResults, exams, classes, reportCardTemplates]);

    // Calculate Summary (Student-Subject Grouped) - UNFILTERED version for stats/ranks
    const fullSummarizedResults = useMemo(() => {
      const summaryMap: Record<string, any> = {};

      results.forEach((r: any) => {
        const exam = exams.find(e => String(e.id) === String(r.exam_id));
        if (!exam) return;

        const subjectId = r.subject_id || exam?.subject_id;
        const classId = r.class_id || exam?.class_id;

        const key = `${r.student_id}-${subjectId}`;
        if (!summaryMap[key]) {
          const cls = classes.find(c => String(c.id) === String(classId));
          summaryMap[key] = {
            id: key,
            student_id: r.student_id,
            student_name: r.student_name,
            subject_id: subjectId,
            subject_name: r.subject_name || r.subject || exam?.subject_name || exam?.subject || exam?.title || 'Subject',
            class_id: classId,
            class_name: (r.class_name || cls?.name || 'Class') + (r.class_section || cls?.section ? ` ${r.class_section || cls?.section}` : ''),
            term: exam?.term || (organization as any)?.current_term || 'Current Term',
            academic_year: (organization as any)?.academic_year || 'Current Year',
            caScore: 0,
            midTermScore: 0,
            examScore: 0,
            otherScore: 0,
          };
        }

        const entry = summaryMap[key];
        const type = (r.exam_type || exam?.type || exam?.name || '').toLowerCase();
        const score = parseFloat(String(r.score)) || 0;

        // Priority 1: Check score_details for breakdown (if entered by staff)
        const details = typeof r.score_details === 'string' ? JSON.parse(r.score_details) : r.score_details;
        if (details && (details.showClassScore !== undefined || details.showExamScore !== undefined)) {
          entry.caScore += parseFloat(String(details.showClassScore || 0)) || 0;
          entry.examScore += parseFloat(String(details.showExamScore || 0)) || 0;
        }
        // Priority 2: Fallback to string-based categorization of the total score
        else if (type.includes('class score') || type.includes('ca') || type.includes('class test') || type.includes('assignment') || type.includes('project') || type.includes('test')) {
          entry.caScore += score;
        } else if (type.includes('mid-term') || type.includes('midterm')) {
          entry.midTermScore += score;
        } else if (type.includes('final exam') || type.includes('exam')) {
          entry.examScore += score;
        } else {
          entry.caScore += score; // Fallback to CA for any other assessment type
        }
      });

      const summaryList = Object.values(summaryMap).map(s => {
        const total = s.caScore + s.midTermScore + s.examScore + s.otherScore;
        const cls = classes.find((c: any) => String(c.id) === String(s.class_id));
        const tmpl = cls ? reportCardTemplates.find((t: any) => String(t.id) === String(cls.report_card_template_id)) : null;
        const acSec = tmpl?.sections?.find((sec: any) => sec.type === 'AcademicResults' && sec.enabled);
        const maxTotal = acSec?.settings ? (acSec.settings.classScoreMax || 30) + (acSec.settings.examScoreMax || 70) : 100;

        return {
          ...s,
          totalScore: total,
          maxTotal,
          grade: total >= 70 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : total >= 40 ? 'D' : 'F'
        };
      });

      const skeyMap: Record<string, any[]> = {};
      summaryList.forEach(s => {
        const k = `${s.subject_id}-${s.class_id}`;
        if (!skeyMap[k]) skeyMap[k] = [];
        skeyMap[k].push(s);
      });

      Object.values(skeyMap).forEach(group => {
        group.sort((a, b) => b.totalScore - a.totalScore);
        group.forEach((s, i) => {
          if (i > 0 && s.totalScore === group[i - 1].totalScore) s.rank = group[i - 1].rank;
          else s.rank = i + 1;
        });
      });

      return summaryList;
    }, [results, exams, classes, reportCardTemplates, organization]);

    // FILTERED version for actual table display
    const summarizedResults = useMemo(() => {
      let filtered = fullSummarizedResults;

      if (role === 'HOD' && hodDeptId) {
        const deptSubjectIds = new Set(
          (subjects || [])
            .filter(sub => sub.department_id && String(sub.department_id).toLowerCase() === hodDeptId)
            .map(sub => String(sub.id).toLowerCase())
        );
        filtered = filtered.filter(s => s.subject_id && deptSubjectIds.has(String(s.subject_id).toLowerCase()));
      }

      if (role === 'PARENT' || role === 'STUDENT') {
        return filtered.filter(s => String(s.student_id) === String(selectedWardId));
      }
      return filtered;
    }, [fullSummarizedResults, role, selectedWardId, hodDeptId, subjects]);

    const performanceSummaryGroups = useMemo(() => {
      const groups: Record<string, any> = {};
      summarizedResults.forEach((r: any) => {
        let key = '';
        let name = '';

        if (performanceGroupBy === 'class') {
          key = String(r.class_id);
          name = r.class_name || 'Unassigned';
        } else {
          key = String(r.subject_id);
          name = r.subject_name || 'Unassigned';
        }

        if (!groups[key]) {
          groups[key] = {
            id: key,
            name,
            studentCount: new Set(summarizedResults.filter(sr => {
              if (performanceGroupBy === 'class') return String(sr.class_id) === key;
              return String(sr.subject_id) === key;
            }).map(sr => sr.student_id)).size,
            avgScore: 0,
            _total: 0,
            _count: 0
          };
        }
        groups[key]._total += r.totalScore;
        groups[key]._count++;
        groups[key].avgScore = (groups[key]._total / groups[key]._count).toFixed(1);
      });
      return Object.values(groups);
    }, [summarizedResults, performanceGroupBy]);

    const overallClassRanks = useMemo(() => {
      const classGroups: Record<string, Record<string, { total: number, name: string, subjectCount: number }>> = {};
      summarizedResults.forEach(sr => {
        if (!classGroups[sr.class_id]) classGroups[sr.class_id] = {};
        if (!classGroups[sr.class_id][sr.student_id]) {
          classGroups[sr.class_id][sr.student_id] = { total: 0, name: sr.student_name, subjectCount: 0 };
        }
        classGroups[sr.class_id][sr.student_id].total += sr.totalScore;
        classGroups[sr.class_id][sr.student_id].subjectCount += 1;
      });

      const finalRanks: Record<string, any> = {};
      Object.entries(classGroups).forEach(([classId, students]) => {
        const sorted = Object.entries(students)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.total - a.total);

        const count = sorted.length;
        finalRanks[classId] = {};
        sorted.forEach((s, i) => {
          let rank = i + 1;
          if (i > 0 && s.total === sorted[i - 1].total) {
            rank = finalRanks[classId][sorted[i - 1].id].rank;
          }
          const topPercentile = Math.ceil((rank / count) * 100);
          finalRanks[classId][s.id] = {
            rank,
            count,
            percentile: `Top ${topPercentile}%`
          };
        });
      });
      return finalRanks;
    }, [summarizedResults]);

    // Calculate Top Performers across academic calendars
    const topPerformersRecord = useMemo(() => {
      const yearTermMap: Record<string, any> = {};

      summarizedResults.forEach(r => {
        const key = `${r.academic_year}-${r.term}`;
        if (!yearTermMap[key]) {
          yearTermMap[key] = {
            year: r.academic_year,
            term: r.term,
            byClass: {} as Record<string, any>,
            bySubject: {} as Record<string, any>
          };
        }

        const cal = yearTermMap[key];

        // Best in Class logic
        if (!cal.byClass[r.class_id] || r.totalScore > cal.byClass[r.class_id].totalScore) {
          cal.byClass[r.class_id] = r;
        }

        // Best in Subject logic
        if (!cal.bySubject[r.subject_id] || r.totalScore > cal.bySubject[r.subject_id].totalScore) {
          cal.bySubject[r.subject_id] = r;
        }
      });

      return yearTermMap;
    }, [summarizedResults]);

    const academicYears = useMemo(() => Array.from(new Set(fullSummarizedResults.map(r => r.academic_year))), [fullSummarizedResults]);
    const academicTerms = useMemo(() => Array.from(new Set(fullSummarizedResults.map(r => r.term))), [fullSummarizedResults]);

    // Role-based view logic removed to allow full access to results and report cards for parents/students

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
              <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight truncate">Academic Results</h2>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">{performanceGroupBy} summary — {(organization as any)?.academic_year || '2025/2026'}</p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Primary View Tabs */}
            <div className="flex items-center p-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-[1.25rem] sm:rounded-[2rem] border border-zinc-200/50 dark:border-zinc-700/50 overflow-x-auto no-scrollbar scroll-smooth w-full lg:w-auto shadow-inner">
              <button
                onClick={() => {
                  setShowTopPerformers(false);
                  setShowClassRemarks(false);
                  setShowBroadcaster(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-[1rem] sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                  (!showTopPerformers && !showClassRemarks && !showBroadcaster) 
                    ? "bg-white dark:bg-zinc-700 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.1)] dark:shadow-none text-indigo-600 scale-105" 
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/30"
                )}
              >
                <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Summary
              </button>
              
              {((role as any) === 'SCHOOL_ADMIN' || (role as any) === 'HOD') && (
                <button
                  onClick={() => {
                    setShowTopPerformers(true);
                    setShowClassRemarks(false);
                    setShowBroadcaster(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-[1rem] sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                    showTopPerformers 
                      ? "bg-white dark:bg-zinc-700 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.1)] dark:shadow-none text-indigo-600 scale-105" 
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/30"
                  )}
                >
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Top Performance
                </button>
              )}

              {classes.some((c: any) => {
                const tcId = String(c.class_teacher_id || '').toLowerCase();
                const uId = String(currentUser?.id || '').toLowerCase();
                const uEmail = String(currentUser?.email || '').toLowerCase().trim();
                return tcId && (tcId === uId || tcId === uEmail);
              }) && (
                <button
                  onClick={() => {
                    setShowClassRemarks(true);
                    setShowTopPerformers(false);
                    setShowBroadcaster(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-[1rem] sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                    (showClassRemarks && !showTopPerformers && !showBroadcaster) 
                      ? "bg-white dark:bg-zinc-700 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.1)] dark:shadow-none text-indigo-600 scale-105" 
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/30"
                  )}
                >
                  <ArrowRightCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Remarks
                </button>
              )}

              {((role as any) === 'SCHOOL_ADMIN' || (role as any) === 'HOD') && (
                <button
                  onClick={() => {
                    setShowBroadcaster(true);
                    setShowClassRemarks(false);
                    setShowTopPerformers(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-[1rem] sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                    showBroadcaster 
                      ? "bg-white dark:bg-zinc-700 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.1)] dark:shadow-none text-indigo-600 scale-105" 
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/30"
                  )}
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Broadcaster
                </button>
              )}
            </div>

            {/* Secondary Grouping Toggle */}
            {!showBroadcaster && !showTopPerformers && !showClassRemarks && (
              <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 w-full lg:w-auto self-end lg:self-center">
                <button
                  onClick={() => setPerformanceGroupBy('class')}
                  className={cn(
                    "flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    performanceGroupBy === 'class' ? "bg-white dark:bg-zinc-700 shadow-md text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  By Class
                </button>
                <button
                  onClick={() => setPerformanceGroupBy('subject')}
                  className={cn(
                    "flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    performanceGroupBy === 'subject' ? "bg-white dark:bg-zinc-700 shadow-md text-indigo-600" : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  By Subject
                </button>
              </div>
            )}
          </div>
        </div>

        {showBroadcaster ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Result Broadcaster</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">Audit completeness and notify parents via SMS.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl sm:rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">SMS Balance</p>
                    <p className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">{organization?.sms_balance || 0} Units</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <select
                      value={selectedClassRemarksId}
                      onChange={(e) => setSelectedClassRemarksId(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl sm:rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    >
                      <option value="">-- Select Class to Audit --</option>
                      <option value="all">ALL CLASSES (School-wide)</option>
                      {classes.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>
                      ))}
                    </select>
                  </div>

                  {selectedClassRemarksId && (() => {
                    const isAll = selectedClassRemarksId === 'all';
                    const classStudents = isAll ? students : students.filter((s: any) => String(s.class_id) === String(selectedClassRemarksId));
                    const classSubjects = isAll ? subjects : subjects.filter((sub: any) => String(sub.class_id) === String(selectedClassRemarksId));
                    
                    // Total Expected: For each class, students in that class * subjects for that class
                    let totalExpected = 0;
                    if (isAll) {
                      classes.forEach((c: any) => {
                        const sCount = students.filter((s: any) => String(s.class_id) === String(c.id)).length;
                        const subCount = subjects.filter((sub: any) => String(sub.class_id) === String(c.id)).length;
                        totalExpected += sCount * subCount;
                      });
                    } else {
                      totalExpected = classStudents.length * classSubjects.length;
                    }

                    const classResults = isAll ? summarizedResults : summarizedResults.filter((r: any) => String(r.class_id) === String(selectedClassRemarksId));
                    const completeness = totalExpected > 0 ? (classResults.length / totalExpected) * 100 : 0;
                    
                    return (
                      <div className="p-4 sm:p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl sm:rounded-[2rem] border border-zinc-100 dark:border-zinc-800 space-y-4 sm:space-y-6">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Class Readiness</h4>
                          <span className={cn(
                            "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            completeness === 100 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {completeness.toFixed(1)}% Ready
                          </span>
                        </div>
                        
                        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              completeness === 100 ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-indigo-500"
                            )}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Uploaded</p>
                            <p className="text-lg font-black text-zinc-900 dark:text-white">{classResults.length}</p>
                          </div>
                          <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Expected</p>
                            <p className="text-lg font-black text-zinc-900 dark:text-white">{totalExpected}</p>
                          </div>
                        </div>

                        {completeness < 100 && (
                          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
                              Some results are still missing. We recommend broadcasting only when 100% of results are uploaded to avoid parental confusion.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-6">
                  <div className="p-4 sm:p-8 bg-indigo-600 rounded-xl sm:rounded-[2.5rem] text-white space-y-4 sm:space-y-6 shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <BellRing className="w-6 h-6" />
                        <h4 className="text-lg font-black uppercase tracking-tight">Broadcast Message</h4>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 mb-2">Sample Template</p>
                        <p className="text-sm font-medium leading-relaxed italic">
                          "Dear Parent, your ward's results for {selectedTerm} are ready. View here: {window.location.origin}/?view=Result&token=..."
                        </p>
                      </div>

                        <button
                        disabled={!selectedClassRemarksId || isBroadcasting}
                        onClick={async () => {
                          const isAll = selectedClassRemarksId === 'all';
                          const targetStudents = isAll ? students : students.filter((s: any) => String(s.class_id) === String(selectedClassRemarksId));
                          const studentsWithContact = targetStudents.filter((s: any) => s.contact);
                          
                          if (studentsWithContact.length === 0) {
                            (window as any).showToast?.("No students with parent contacts found for selection.", "error");
                            return;
                          }

                          if ((organization?.sms_balance || 0) < studentsWithContact.length) {
                            (window as any).showToast?.(`Insufficient SMS credits (${organization?.sms_balance || 0}) to broadcast to ${studentsWithContact.length} students.`, "error");
                            return;
                          }

                          if (!window.confirm(`Broadcast SMS to ${studentsWithContact.length} parents across ${isAll ? 'all classes' : 'the selected class'}?`)) return;

                          setIsBroadcasting(true);
                          setBroadcastProgress(0);
                          
                          try {
                            const messages = targetStudents
                              .filter((s: any) => s.contact)
                              .map((s: any) => {
                                const token = btoa(`${s.id}|${selectedTerm}|${selectedAcademicYear}|${currentUser?.org_id || (organization as any)?.id}`);
                                const link = `${window.location.origin}/?view=Result&token=${token}`;
                                return {
                                  recipient: s.contact as string,
                                  message: `Dear Parent, your ward ${s.name}'s results for ${selectedTerm} are ready. View here: ${link}`
                                };
                              });

                            const uniqueRecipientsCount = new Set(messages.map(m => m.recipient)).size;

                            // Split into chunks if there are many contacts to avoid payload limits
                            const chunkSize = 100;
                            for (let i = 0; i < messages.length; i += chunkSize) {
                              const chunk = messages.slice(i, i + chunkSize);
                              await sendBulkSMS({ messages: chunk });
                              setBroadcastProgress(Math.round(((i + chunk.length) / messages.length) * 100));
                            }

                            (window as any).showToast?.(`Broadcast sent successfully to ${uniqueRecipientsCount} parents!`, "success");
                          } catch (err: any) {
                            (window as any).showToast?.(err?.message || "Broadcast failed", "error");
                          } finally {
                            setTimeout(() => {
                              setIsBroadcasting(false);
                              setBroadcastProgress(0);
                            }, 2000);
                          }
                        }}
                        className={cn(
                          "w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-2 sm:gap-3",
                          (!selectedClassRemarksId || isBroadcasting) 
                            ? "bg-white/20 text-white/50 cursor-not-allowed" 
                            : "bg-white text-indigo-600 hover:bg-indigo-50 hover:-translate-y-1 active:translate-y-0"
                        )}
                      >
                        {isBroadcasting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Broadcasting {broadcastProgress}%
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Launch Broadcast
                          </>
                        )}
                      </button>
                    </div>
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                      <Send className="w-48 h-48 rotate-12" />
                    </div>
                  </div>

                  {selectedClassRemarksId && (
                    <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl sm:rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-4 sm:p-6">
                      <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">
                        Target Recipients ({selectedClassRemarksId === 'all' ? students.length : students.filter((s: any) => String(s.class_id) === String(selectedClassRemarksId)).length})
                      </h5>
                      <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2">
                        {(selectedClassRemarksId === 'all' ? students : students.filter((s: any) => String(s.class_id) === String(selectedClassRemarksId))).map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-[11px] font-bold text-zinc-600">{s.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400">{s.contact || 'No Contact'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : showTopPerformers ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200 dark:shadow-none">
              <div className="relative z-10 space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight">Top Performers Record</h3>
                <p className="text-indigo-100 font-medium text-sm">Recognizing excellence across all classes and subjects.</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 relative z-10">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <Calendar className="w-4 h-4 opacity-70" />
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="bg-transparent text-sm font-bold outline-none border-none focus:ring-0"
                  >
                    <option value="" className="text-zinc-900">All Years</option>
                    {academicYears.map(year => <option key={year} value={year} className="text-zinc-900">{year}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <Layers className="w-4 h-4 opacity-70" />
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="bg-transparent text-sm font-bold outline-none border-none focus:ring-0"
                  >
                    <option value="" className="text-zinc-900">All Terms</option>
                    {academicTerms.map(term => <option key={term} value={term} className="text-zinc-900">{term}</option>)}
                  </select>
                </div>
                <div className="flex items-center p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <button
                    onClick={() => setPerformanceGroupBy('class')}
                    className={cn("px-4 py-1 rounded-lg text-[10px] font-black uppercase transition-all", performanceGroupBy === 'class' ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white")}
                  >
                    Class
                  </button>
                  <button
                    onClick={() => setPerformanceGroupBy('subject')}
                    className={cn("px-4 py-1 rounded-lg text-[10px] font-black uppercase transition-all", performanceGroupBy === 'subject' ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white")}
                  >
                    Subject
                  </button>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Trophy className="w-64 h-64 rotate-12" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
              {(() => {
                const resultsToShow = [];
                const calKeys = Object.keys(topPerformersRecord).filter(k => {
                  const [y, t] = k.split('-');
                  if (selectedAcademicYear && y !== selectedAcademicYear) return false;
                  if (selectedTerm && t !== selectedTerm) return false;
                  return true;
                });

                calKeys.forEach(k => {
                  const cal = topPerformersRecord[k];
                  const winners = performanceGroupBy === 'class' ? Object.values(cal.byClass) : Object.values(cal.bySubject);
                  resultsToShow.push(...winners);
                });

                if (resultsToShow.length === 0) {
                  return (
                    <div className="col-span-full py-20 text-center space-y-4 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300 shadow-sm">
                        <Search className="w-10 h-10" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">No Top Performers Found</h4>
                        <p className="text-xs text-zinc-500 font-medium mt-2">Adjust your filters or ensure results have been calculated for the selected period.</p>
                      </div>
                    </div>
                  );
                }

                return resultsToShow.map((winner: any, i) => (
                  <div key={i} className="group p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all duration-500 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />

                    <div className="relative space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform duration-500 border border-indigo-100 dark:border-indigo-800/10 shadow-sm">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Rank 1</p>
                          <h4 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{winner.totalScore}%</h4>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg uppercase tracking-widest">{winner.academic_year}</span>
                          <span className="text-[9px] font-black text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg uppercase tracking-widest">{winner.term}</span>
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors uppercase truncate">{winner.student_name}</h3>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                          {performanceGroupBy === 'class' ? <Building2 className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                          {performanceGroupBy === 'class' ? winner.class_name : winner.subject_name}
                        </p>
                      </div>
                    </div>

                    <div className="relative pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Grade Achieved</span>
                        <span className={cn(
                          "text-lg font-black",
                          winner.grade === 'A' ? "text-emerald-600" :
                            winner.grade === 'B' ? "text-blue-600" : "text-amber-600"
                        )}>{winner.grade}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(j => (
                          <div key={j} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Award className={cn("w-4 h-4", j === 1 ? "text-amber-400" : j === 2 ? "text-zinc-400" : "text-amber-700")} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        ) : (showClassRemarks && !showTopPerformers) ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Select Your Assigned Class</label>
              <select
                value={selectedClassRemarksId}
                onChange={(e) => setSelectedClassRemarksId(e.target.value)}
                className="w-full max-w-xl px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose a Class --</option>
                {classes.filter((c: any) => {
                  const tcId = String(c.class_teacher_id || '').toLowerCase();
                  const uId = String(currentUser?.id || '').toLowerCase();
                  const uStaffId = String(currentUser?.staff_id || '').toLowerCase();
                  const uUid = String(currentUser?.uid || '').toLowerCase();
                  const uUserId = String(currentUser?.user_id || '').toLowerCase();
                  const uEmail = String(currentUser?.email || '').toLowerCase().trim();
                  const uName = String(currentUser?.name || '').toLowerCase().trim();
                  const tcName = String(c.class_teacher || c.teacher_name || '').toLowerCase().trim();

                  return tcId && (
                    tcId === uId ||
                    tcId === uStaffId ||
                    tcId === uUid ||
                    tcId === uUserId ||
                    tcId === uEmail ||
                    (uName && tcName && tcName.includes(uName)) ||
                    (uName && tcId === uName)
                  );
                }).map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section || ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedClassRemarksId && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {students.filter((s: any) => String(s.class_id) === String(selectedClassRemarksId)).map((student: any) => (
                    <div key={student.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-sm font-black">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">{student.name}</span>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Terminal Record</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Teacher's Remark
                          </label>
                          <select
                            value={terminalRemarks[student.id]?.teacher_remark || ''}
                            onChange={(e) => setTerminalRemarks(prev => ({
                              ...prev,
                              [student.id]: { ...(prev[student.id] || {}), teacher_remark: e.target.value }
                            }))}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">-- Choose Template --</option>
                            {remarkTemplates?.map((rt: any) => {
                              const remarkText = rt.remark || rt.description || rt.title || rt.name || rt.text;
                              return (
                                <option key={rt.id} value={remarkText}>
                                  {remarkText}
                                </option>
                              );
                            })}
                          </select>
                          <textarea
                            value={terminalRemarks[student.id]?.teacher_remark || ''}
                            onChange={(e) => setTerminalRemarks(prev => ({
                              ...prev,
                              [student.id]: { ...(prev[student.id] || {}), teacher_remark: e.target.value }
                            }))}
                            placeholder="Enter detailed remark..."
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Principal's Suggestion
                          </label>
                          <textarea
                            value={terminalRemarks[student.id]?.principal_remark || ''}
                            onChange={(e) => setTerminalRemarks(prev => ({
                              ...prev,
                              [student.id]: { ...(prev[student.id] || {}), principal_remark: e.target.value }
                            }))}
                            placeholder="Principal's remark suggestion..."
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 min-h-[126px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={async () => {
                      const resultsToSave = students
                        .filter((s: any) => String(s.class_id) === String(selectedClassRemarksId))
                        .map((s: any) => ({
                          student_id: s.id,
                          class_id: selectedClassRemarksId,
                          teacher_remark: terminalRemarks[s.id]?.teacher_remark || '',
                          principal_remark: terminalRemarks[s.id]?.principal_remark || '',
                          type: 'terminal_remark'
                        }))
                        .filter(r => r.teacher_remark || r.principal_remark);

                      if (resultsToSave.length === 0) {
                        (window as any).showToast?.('Please enter at least one remark.', 'warning');
                        return;
                      }

                      try {
                        if (onSaveResults) {
                          await onSaveResults({ type: 'terminal_remarks', results: resultsToSave });
                          (window as any).showToast?.('Remarks saved successfully!', 'success');
                        }
                      } catch (err: any) {
                        (window as any).showToast?.(err, 'error');
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Submit Remarks
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!selectedPerformanceGroup ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {performanceSummaryGroups.map((group: any) => (
                    <div key={group.id} className="group p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all duration-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />

                      <div className="relative space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform duration-500">
                            {performanceGroupBy === 'class' ? <Building2 className="w-7 h-7" /> : performanceGroupBy === 'subject' ? <BookOpen className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Avg. Score</p>
                            <h4 className="text-3xl font-black text-zinc-900 dark:text-white leading-none tracking-tight">{group.avgScore}</h4>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{group.name}</h3>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Type: {performanceGroupBy.toUpperCase()}</p>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex-1">
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-1">Impact</p>
                            <p className="text-xs font-black text-zinc-900 dark:text-white">{group.studentCount} Results Recorded</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-4">
                          {((role as any) === 'PARENT' || (role as any) === 'STUDENT') ? (
                            <button
                              onClick={() => {
                                const termResults = summarizedResults.filter(r => performanceGroupBy === 'term' ? r.term === group.name : (performanceGroupBy === 'class' ? String(r.class_name) === String(group.name) : String(r.subject_name) === String(group.name)));
                                const item = termResults[0];
                                if (!item) return;
                                const rankData = overallClassRanks[item.class_id]?.[item.student_id];
                                setShowReportCard({
                                  name: item.student_name,
                                  id: item.admission_no || item.student_id || String(item.id).slice(0, 8),
                                  grade: item.class_name,
                                  class_id: item.class_id,
                                  term: item.term,
                                  academicYear: item.academic_year,
                                  classPosition: rankData ? `${rankData.rank}${['st', 'nd', 'rd'][rankData.rank - 1] || 'th'} / ${rankData.count}` : '—',
                                  rankPercentile: rankData?.percentile || '—',
                                  attendance: '—',
                                  results: termResults.map(sr => ({
                                    subject: sr.subject_name,
                                    classScore: sr.caScore,
                                    examScore: sr.examScore,
                                    score: sr.totalScore,
                                    grade: sr.grade,
                                    rank: `${sr.rank}${['st', 'nd', 'rd'][sr.rank - 1] || 'th'}`,
                                    remark: '—'
                                  }))
                                });
                              }}
                              className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 group/btn"
                            >
                              <Printer className="min-w-[14px] w-3.5 h-3.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                              View Official Report Card
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedPerformanceGroup(group)}
                              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                              Manage Results
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPerformanceGroup(group)}
                            className="w-full py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                          >
                            Visual Breakdown
                            <ArrowRightCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedPerformanceGroup(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 border border-zinc-200 dark:border-zinc-700 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                    <div>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{selectedPerformanceGroup.name} Performance</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Visual Analysis Mode</p>
                    </div>
                  </div>
                  {(role === 'PARENT' || role === 'STUDENT') && summarizedResults.some(r => performanceGroupBy === 'term' ? r.term === selectedPerformanceGroup.name : (performanceGroupBy === 'class' ? String(r.class_id) === String(selectedPerformanceGroup.id) : String(r.subject_id) === String(selectedPerformanceGroup.id))) && (
                    <button
                      onClick={() => {
                        const termResults = summarizedResults.filter(r => performanceGroupBy === 'term' ? r.term === selectedPerformanceGroup.name : (performanceGroupBy === 'class' ? String(r.class_id) === String(selectedPerformanceGroup.id) : String(r.subject_id) === String(selectedPerformanceGroup.id)));
                        const item = termResults[0];
                        if (!item) return;

                        const rankData = overallClassRanks[item.class_id]?.[item.student_id];
                        const promoRecord = promotionRecords.find((pr: any) => String(pr.student_id) === String(item.student_id));
                        const formattedStudent = {
                          name: item.student_name,
                          id: item.admission_no || item.student_id || String(item.id).slice(0, 8),
                          grade: item.class_name,
                          class_id: item.class_id,
                          term: item.term,
                          academicYear: item.academic_year,
                          classPosition: rankData ? `${rankData.rank}${['st', 'nd', 'rd'][rankData.rank - 1] || 'th'} / ${rankData.count}` : '—',
                          rankPercentile: rankData?.percentile || '—',
                          attendance: '—',
                          promotionStatus: promoRecord?.status || null,
                          promotedTo: promoRecord?.next_class_name || promoRecord?.to_class_name || null,
                          results: termResults.map(sr => ({
                            subject: sr.subject_name,
                            classScore: sr.caScore,
                            examScore: sr.examScore,
                            score: sr.totalScore,
                            grade: sr.grade,
                            rank: `${sr.rank}${['st', 'nd', 'rd'][sr.rank - 1] || 'th'}`,
                            remark: '—'
                          }))
                        };
                        setShowReportCard(formattedStudent);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Printer className="w-4 h-4" />
                      View Official Report Card
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {summarizedResults.filter((r: any) => performanceGroupBy === 'term' ? r.term === selectedPerformanceGroup.name : (performanceGroupBy === 'class' ? String(r.class_id) === String(selectedPerformanceGroup.id) : String(r.subject_id) === String(selectedPerformanceGroup.id))).map((r: any) => (
                    <div key={r.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] hover:border-indigo-100 dark:hover:border-indigo-900/10 transition-colors shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{r.student_name}</h4>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{performanceGroupBy === 'class' ? r.subject_name : r.class_name}</p>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase",
                                r.grade === 'A' ? "bg-emerald-100 text-emerald-700" :
                                  r.grade === 'B' ? "bg-blue-100 text-blue-700" :
                                    r.grade === 'C' ? "bg-amber-100 text-amber-700" :
                                      "bg-red-100 text-red-700"
                              )}>{r.grade} — {r.totalScore}%</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  r.grade === 'A' ? "bg-emerald-500" :
                                    r.grade === 'B' ? "bg-blue-500" :
                                      r.grade === 'C' ? "bg-amber-500" :
                                        "bg-red-500"
                                )}
                                style={{ width: `${Math.min(100, r.totalScore)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">
                              <div className="flex items-center gap-4">
                                <span>CA: {r.caScore}</span>
                                <span>Exam: {r.examScore}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span>Rank: {r.rank}{['st', 'nd', 'rd'][r.rank - 1] || 'th'}</span>
                                <span className="text-indigo-600 font-black">Total: {r.totalScore}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                          <button
                            onClick={() => {
                              const studentResults = summarizedResults.filter(sr => sr.student_id === r.student_id && String(sr.class_id) === String(r.class_id));
                              const rankData = overallClassRanks[r.class_id]?.[r.student_id];
                              const terminalRemarkData = results.find((res: any) => String(res.student_id) === String(r.student_id) && res.type === 'terminal_remark');
                              const promoRecord = promotionRecords.find((pr: any) => String(pr.student_id) === String(r.student_id));
                              setShowReportCard({
                                name: r.student_name,
                                id: r.admission_no || r.student_id || String(r.id).slice(0, 8),
                                grade: r.class_name,
                                class_id: r.class_id,
                                term: r.term,
                                academicYear: r.academic_year,
                                classPosition: rankData ? `${rankData.rank}${['st', 'nd', 'rd'][rankData.rank - 1] || 'th'} / ${rankData.count}` : '—',
                                rankPercentile: rankData?.percentile || '—',
                                attendance: '—',
                                teacherRemark: terminalRemarkData?.teacher_remark || '',
                                principalRemark: terminalRemarkData?.principal_remark || '',
                                promotionStatus: promoRecord?.status || null,
                                promotedTo: promoRecord?.next_class_name || promoRecord?.to_class_name || null,
                                results: studentResults.map(sr => ({
                                  subject: sr.subject_name,
                                  classScore: sr.caScore,
                                  examScore: sr.examScore,
                                  score: sr.totalScore,
                                  grade: sr.grade,
                                  rank: `${sr.rank}${['st', 'nd', 'rd'][sr.rank - 1] || 'th'}`,
                                  remark: '—'
                                }))
                              });
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Report Card
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showReportCard && (() => {
          const cls = showReportCard.class_id
            ? classes.find((c: any) => String(c.id) === String(showReportCard.class_id))
            : classes.find((c: any) => showReportCard.grade && (showReportCard.grade.startsWith(c.name) || c.name === showReportCard.grade));
          const tmpl = cls ? reportCardTemplates.find((t: any) => String(t.id) === String(cls.report_card_template_id)) : null;
          if (!tmpl) {
            return (
              <Modal isOpen={true} onClose={() => setShowReportCard(null)} title="Report Card Unavailable">
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto"><X className="w-8 h-8 text-amber-500" /></div>
                  <p className="text-zinc-600 font-medium">No template assigned to class {showReportCard.grade}.</p>
                  <button onClick={() => setShowReportCard(null)} className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold">Close</button>
                </div>
              </Modal>
            );
          }
          return <ReportCardPreview template={tmpl} organization={organization} student={showReportCard} onClose={() => setShowReportCard(null)} />;
        })()}
      </div>
    );
  },
  ResultAnalysis: ({ role, data = [], students = [], classes = [], exams = [] }: { role?: UserRole, data?: any[], students?: any[], classes?: any[], exams?: any[] }) => {
    const studentResults = data || [];

    // Performance over time (Exam by Exam)
    const chartData = useMemo(() => {
      const sorted = [...studentResults].sort((a, b) => new Date(a.exam_date || 0).getTime() - new Date(b.exam_date || 0).getTime());
      const groups: Record<string, any> = {};
      sorted.forEach((r: any) => {
        const examId = r.exam_id || 'default';
        if (!groups[examId]) {
          groups[examId] = {
            name: r.exam_type || 'Exam',
            date: r.exam_date,
            subjects: {}
          };
        }
        groups[examId].subjects[r.subject_name || r.subject] = parseFloat(r.score) || 0;
      });
      return Object.values(groups);
    }, [studentResults]);

    const subjects = Array.from(new Set(studentResults.map((r: any) => r.subject_name || r.subject)));

    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Result Analysis</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Visual performance tracking and metrics.</p>
            </div>
          </div>

          <div className="h-[400px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                {subjects.map((sub, i) => (
                  <Line
                    key={sub}
                    type="monotone"
                    dataKey={`subjects.${sub}`}
                    name={sub}
                    stroke={`hsl(${i * 137.5 % 360}, 70%, 50%)`}
                    strokeWidth={4}
                    dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-indigo-200 transition-colors">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Average Score</p>
            <h3 className="text-3xl font-black text-indigo-600">
              {studentResults.length > 0 ? (studentResults.reduce((a: number, b: any) => a + (parseFloat(b.score) || 0), 0) / studentResults.length).toFixed(1) : '0.0'}
            </h3>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-200 transition-colors">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Total Exams</p>
            <h3 className="text-3xl font-black text-emerald-600">{studentResults.length}</h3>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-amber-200 transition-colors">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Best Subject</p>
            <h3 className="text-lg font-black text-amber-600 uppercase">
              {(() => {
                const subScores: Record<string, { total: number, count: number }> = {};
                studentResults.forEach((r: any) => {
                  const s = r.subject_name || r.subject;
                  if (!subScores[s]) subScores[s] = { total: 0, count: 0 };
                  subScores[s].total += parseFloat(r.score) || 0;
                  subScores[s].count++;
                });
                let best = 'N/A';
                let maxAvg = 0;
                Object.entries(subScores).forEach(([sub, data]) => {
                  const avg = data.total / data.count;
                  if (avg > maxAvg) {
                    maxAvg = avg;
                    best = sub;
                  }
                });
                return best;
              })()}
            </h3>
          </div>
        </div>
      </div>
    );
  },
  GradingScale: ({ data = [], classes = [], onSave, onDelete }: { data?: any[], classes?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);

    return (
      <>
        <DataTable
          title="Grading Scale Templates"
          data={data}
          autoViewModal={false}
          onSave={async (formData) => {
            const assignedClassesJson = (document.getElementById('assigned-classes-input') as HTMLInputElement)?.value;
            const levelsJson = (document.getElementById('grading-scale-levels-input') as HTMLInputElement)?.value;

            const payload = {
              ...formData,
              assignedClassIds: assignedClassesJson ? JSON.parse(assignedClassesJson) : [],
              levels: levelsJson ? JSON.parse(levelsJson) : [],
            };

            console.log('Sending GradingScale Payload:', payload);
            await onSave?.(payload);
          }}
          onEdit={() => { }}
          onAdd={() => { }}
          onDelete={onDelete}
          onView={setViewItem}
          columns={[
            { header: 'Scale Name', accessor: 'name', className: 'font-bold' },
            {
              header: 'Assigned Classes',
              accessor: (item: any) => (item.assigned_classes || []).map((c: any) => c.name).join(', ') || 'None'
            },
            {
              header: 'Status',
              accessor: (item) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-600"
                )}>
                  {item.status}
                </span>
              )
            },
          ]}
          renderForm={(item) => (
            <div key={item?.id || 'new'} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Scale Name</label>
                  <input type="text" name="name" defaultValue={item?.name} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Status</label>
                  <select name="status" defaultValue={item?.status || 'Active'} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-semibold text-zinc-500 uppercase">Assign to Classes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 max-h-[150px] overflow-y-auto">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        name={`class_${cls.id}`}
                        className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                        defaultChecked={item?.assigned_classes?.some((c: any) => c.id === cls.id)}
                        onChange={(e) => {
                          const input = document.getElementById('assigned-classes-input') as HTMLInputElement;
                          if (input) {
                            const currentIds = JSON.parse(input.value || '[]');
                            if (e.target.checked) {
                              input.value = JSON.stringify([...new Set([...currentIds, cls.id])]);
                            } else {
                              input.value = JSON.stringify(currentIds.filter((id: string) => id !== cls.id));
                            }
                          }
                        }}
                      />
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">{cls.name}</span>
                    </label>
                  ))}
                  {classes.length === 0 && <p className="col-span-full text-center py-4 text-xs text-zinc-400 italic">No classes available</p>}
                </div>
                <input
                  type="hidden"
                  name="assignedClassIds"
                  id="assigned-classes-input"
                  defaultValue={JSON.stringify(item?.assigned_classes?.map((c: any) => c.id) || [])}
                />
              </div>

              <input type="hidden" name="levels" id="grading-scale-levels-input" defaultValue={JSON.stringify(item?.levels || [])} />
              <GradingLevelList
                initialLevels={item?.levels}
                onChange={(levels) => {
                  const input = document.getElementById('grading-scale-levels-input') as HTMLInputElement;
                  if (input) input.value = JSON.stringify(levels);
                }}
              />
            </div>
          )}
        />
        {viewItem && (
          <Modal isOpen={true} onClose={() => setViewItem(null)} title={`Grading Scale: ${viewItem.name}`} maxWidth="max-w-4xl">
            <div className="space-y-8 p-6">
              {/* Header Overview */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-12 h-12 text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      viewItem.status === 'Active' ? "bg-emerald-500" : "bg-zinc-400"
                    )} />
                    <p className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewItem.status}</p>
                  </div>
                </div>

                <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-12 h-12 text-zinc-600" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">Assigned Classes</p>
                  <p className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                    {(viewItem.assigned_classes || []).length} <span className="text-[10px] text-zinc-400 ml-1">Classes</span>
                  </p>
                </div>
              </div>

              {/* Grading Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <p className="text-xs font-black uppercase text-zinc-400 tracking-[0.2em]">Grading Structure</p>
                  <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">{(viewItem.levels || []).length} Levels</p>
                </div>
                <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-zinc-400">Grade</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-zinc-400 text-center">Score Range</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-zinc-400">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {(viewItem.levels || []).sort((a: any, b: any) => b.min - a.min).map((level: any, i: number) => (
                        <tr key={i} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all duration-200">
                          <td className="px-6 py-4">
                            <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                              {level.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full font-bold text-zinc-600">
                              <span className="text-emerald-600">{level.min}%</span>
                              <ArrowRightCircle className="w-3 h-3 text-zinc-300" />
                              <span className="text-indigo-600">{level.max}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-zinc-700 dark:text-zinc-300">{level.description}</p>
                            <p className="text-[10px] text-zinc-400 italic">Target achievement level</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center gap-4 p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50 text-[10px]">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-amber-800 font-medium leading-relaxed">
                  This grading scale will be automatically applied to all students in the assigned classes during report card generation.
                </p>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  },
  ReportCardBuilder: ({ data = [], organization, onSave, onDelete }: { data?: ReportCardTemplate[], organization?: any, onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [editingTemplate, setEditingTemplate] = useState<ReportCardTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<ReportCardTemplate | null>(null);
    const [sections, setSections] = useState<ReportCardSection[]>([]);
    const [layout, setLayout] = useState<any>({ columns: 2, spacing: 'normal', showLogo: true });

    const DEFAULT_LAYOUT = { columns: 2, spacing: 'normal', showLogo: true };
    const DEFAULT_SECTIONS: ReportCardSection[] = [
      { id: '1', type: 'StudentInfo', title: 'Student Information', enabled: true },
      { id: '2', type: 'AcademicResults', title: 'Academic Performance', enabled: true, settings: { showRanking: true, showPercentage: true } },
      { id: '3', type: 'Attendance', title: 'Attendance Record', enabled: true },
      { id: '4', type: 'Remarks', title: 'Teacher Remarks', enabled: true },
      { id: '5', type: 'PrincipalSignature', title: 'Authorization', enabled: true, settings: { signatureTitle: 'Headmaster Signature', showDate: true } }
    ];

    useEffect(() => {
      if (editingTemplate) {
        setSections(editingTemplate.sections || []);
        setLayout(editingTemplate.layout || DEFAULT_LAYOUT);
      } else {
        setSections(DEFAULT_SECTIONS);
        setLayout(DEFAULT_LAYOUT);
      }
    }, [editingTemplate]);

    return (
      <>
        <DataTable
          title="Report Card Templates"
          data={data}
          onAdd={() => setEditingTemplate(null)}
          onEdit={(item) => setEditingTemplate(item)}
          onView={(item) => setPreviewTemplate(item)}
          autoViewModal={false}
          onSave={async (formData) => {
            const sectionsJson = (document.getElementById('rc-sections-input') as HTMLInputElement)?.value;
            const layoutJson = (document.getElementById('rc-layout-input') as HTMLInputElement)?.value;
            const isDefaultChecked = (document.getElementById('is_default') as HTMLInputElement)?.checked;

            const payload = {
              ...formData,
              sections: sectionsJson ? JSON.parse(sectionsJson) : [],
              layout: layoutJson ? JSON.parse(layoutJson) : { columns: 2, showLogo: true },
              is_default: isDefaultChecked ?? !!formData.is_default
            };

            console.log('Sending Report Card Template Payload:', payload);
            await onSave?.(payload);
          }}
          onDelete={onDelete}
          columns={[
            { header: 'Template Name', accessor: 'name', className: 'font-bold' },
            { header: 'Layout', accessor: (item) => `${item.layout?.columns || 1} Column(s)` },
            {
              header: 'Sections',
              accessor: (item) => (item.sections || []).filter((s: any) => s.enabled).length
            },
            {
              header: 'Default',
              accessor: (item) => item.is_default ? (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase">Default</span>
              ) : null
            }
          ]}
          renderForm={(item) => (
            <div key={item?.id || 'new'} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Template Name</label>
                  <input type="text" name="name" defaultValue={item?.name} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input type="checkbox" name="is_default" defaultChecked={item?.is_default} className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" id="is_default" />
                  <label htmlFor="is_default" className="text-xs font-semibold text-zinc-500 uppercase cursor-pointer">Set as Default Template</label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Report Card Sections</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newSection: ReportCardSection = {
                        id: Math.random().toString(36).substr(2, 9),
                        type: 'AcademicResults',
                        title: 'New Section',
                        enabled: true
                      };
                      const updated = [...sections, newSection];
                      setSections(updated);
                      const input = document.getElementById('rc-sections-input') as HTMLInputElement;
                      if (input) input.value = JSON.stringify(updated);
                    }}
                    className="text-[10px] font-bold text-indigo-600 uppercase hover:underline"
                  >
                    + Add Custom Section
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
                  {sections.map((section, idx) => (
                    <SectionEditor
                      key={section.id}
                      section={section}
                      onUpdate={(updated) => {
                        const newSections = [...sections];
                        newSections[idx] = updated;
                        setSections(newSections);
                        const input = document.getElementById('rc-sections-input') as HTMLInputElement;
                        if (input) input.value = JSON.stringify(newSections);
                      }}
                      onRemove={() => {
                        const newSections = sections.filter((_, i) => i !== idx);
                        setSections(newSections);
                        const input = document.getElementById('rc-sections-input') as HTMLInputElement;
                        if (input) input.value = JSON.stringify(newSections);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase mb-3 block">Design & Layout Settings</label>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Number of Columns</label>
                    <select
                      id="rc-columns-select"
                      value={layout.columns || 2}
                      onChange={(e) => {
                        const newLayout = { ...layout, columns: parseInt(e.target.value) };
                        setLayout(newLayout);
                        const input = document.getElementById('rc-layout-input') as HTMLInputElement;
                        if (input) input.value = JSON.stringify(newLayout);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1 Column</option>
                      <option value="2">2 Columns</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Font Family</label>
                    <select
                      value={layout.fontFamily || 'serif'}
                      onChange={(e) => {
                        const newLayout = { ...layout, fontFamily: e.target.value };
                        setLayout(newLayout);
                        const input = document.getElementById('rc-layout-input') as HTMLInputElement;
                        if (input) input.value = JSON.stringify(newLayout);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="serif">Classic Serif</option>
                      <option value="sans">Modern Sans</option>
                      <option value="mono">Technical Mono</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Title Style</label>
                    <select
                      value={layout.titleStyle || 'classic'}
                      onChange={(e) => {
                        const newLayout = { ...layout, titleStyle: e.target.value };
                        setLayout(newLayout);
                        const input = document.getElementById('rc-layout-input') as HTMLInputElement;
                        if (input) input.value = JSON.stringify(newLayout);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="classic">Classic Italic</option>
                      <option value="modern">Modern Spaced</option>
                      <option value="bold">Extra Bold</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.primaryColor || '#4f46e5'}
                          onChange={(e) => {
                            const newLayout = { ...layout, primaryColor: e.target.value };
                            setLayout(newLayout);
                            const input = document.getElementById('rc-layout-input') as HTMLInputElement;
                            if (input) input.value = JSON.stringify(newLayout);
                          }}
                          className="w-8 h-8 rounded border-0 p-0 overflow-hidden cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">{layout.primaryColor || '#4f46e5'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layout.accentColor || '#818cf8'}
                          onChange={(e) => {
                            const newLayout = { ...layout, accentColor: e.target.value };
                            setLayout(newLayout);
                            const input = document.getElementById('rc-layout-input') as HTMLInputElement;
                            if (input) input.value = JSON.stringify(newLayout);
                          }}
                          className="w-8 h-8 rounded border-0 p-0 overflow-hidden cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">{layout.accentColor || '#818cf8'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="rc-showlogo-check"
                      checked={layout.showLogo ?? true}
                      onChange={(e) => {
                        const newLayout = { ...layout, showLogo: e.target.checked };
                        setLayout(newLayout);
                        const input = document.getElementById('rc-layout-input') as HTMLInputElement;
                        if (input) input.value = JSON.stringify(newLayout);
                      }}
                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="rc-showlogo-check" className="text-[10px] font-bold text-zinc-400 uppercase cursor-pointer">Show School Logo</label>
                  </div>
                </div>
              </div>

              <input type="hidden" name="sections" id="rc-sections-input" value={JSON.stringify(sections)} />
              <input type="hidden" name="layout" id="rc-layout-input" value={JSON.stringify(layout)} />
            </div>
          )}
        />
        {previewTemplate && (
          <ReportCardPreview
            template={previewTemplate}
            organization={organization}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </>
    );
  },
  RemarksTemplate: ({ data = [], onSave, onDelete }: { data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);

    return (
      <>
        <DataTable
          title="Remarks Templates"
          data={data}
          columns={[
            { header: 'Name', accessor: 'name', className: 'font-bold' },
            { header: 'Remark Template', accessor: 'remark' },
          ]}
          onSave={onSave}
          onDelete={onDelete}
          onEdit={() => { }}
          onAdd={() => { }}
          onView={setViewItem}
          renderForm={(item) => (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase">Template Name</label>
                <input
                  type="text"
                  name="name"
                  id="remark-name-input"
                  defaultValue={item?.name}
                  placeholder="e.g. Excellent Performance"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase">Remark Content</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    "Excellent academic performance! Keep it up.",
                    "A very good result, but there is room for improvement.",
                    "Satisfactory performance. Focus more on core subjects.",
                    "Needs more effort and dedication to studies.",
                    "Outstanding achievement in all subjects!"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('remark-content-textarea') as HTMLTextAreaElement;
                        const nameInput = document.getElementById('remark-name-input') as HTMLInputElement;
                        if (textarea) textarea.value = suggestion;
                        if (nameInput && !nameInput.value) {
                          nameInput.value = suggestion.split('!')[0].split('.')[0].substring(0, 20);
                        }
                      }}
                      className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors"
                    >
                      Suggestion {i + 1}
                    </button>
                  ))}
                </div>
                <textarea
                  name="remark"
                  id="remark-content-textarea"
                  defaultValue={item?.remark}
                  placeholder="Type the remark template here..."
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[150px] resize-none"
                  required
                />
                <p className="text-[10px] text-zinc-400 italic">This template can be selected when giving remarks to students on their report cards.</p>
              </div>
            </div>
          )}
        />
        {viewItem && (
          <Modal isOpen={true} onClose={() => setViewItem(null)} title={`Remark Template: ${viewItem.name}`} maxWidth="max-w-4xl">
            <div className="space-y-6 p-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shrink-0">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="space-y-1 pt-1">
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewItem.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Active Template</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">• Shared Resource</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full">
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">Template Content</p>
                </div>
                <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 min-h-[200px] flex items-center justify-center text-center">
                  <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed italic max-w-md">
                    "{viewItem.remark}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Usage</p>
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">Report Cards</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Type</p>
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">Dynamic Text</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Ready for deployment</p>
                </div>
                <button
                  onClick={() => setViewItem(null)}
                  className="px-4 py-1.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
                >
                  Close View
                </button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  },
};
