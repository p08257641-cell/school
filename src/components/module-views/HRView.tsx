import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../../lib/LanguageContext";
import {
  Users,
  Plus,
  X,
  Briefcase,
  Calendar,
  ClipboardCheck,
  FileText,
  Wallet,
  Zap,
  Download,
  ShieldCheck,
  Layers,
  User,
  BookOpen,
  UserPlus,
  UserCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  UserMinus,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  CalendarDays,
  XCircle,
  Award,
  ClipboardList,
  Clock,
  RefreshCw,
  Search,
  Settings,
  ChevronDown,
  Mail,
  Phone,
  Send,
  Palette,
  Target,
  Star,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { UserRole, Student } from "../../types";
import { DataTable } from "../DataTable";
import { ConfirmationModal, Modal } from "../UI";
import { DocumentBuilder } from "../AdminModules";

export const HRModules = {
  Organogram: ({
    staff = [],
    departments = [],
    organization,
    scopedDeptId,
    strictDepartmentView = false,
    isReadOnly = false,
    onSaveStaff,
    onSaveDepartment,
    onUpdateOrganization,
  }: {
    staff?: any[];
    departments?: any[];
    organization?: any;
    scopedDeptId?: string | null;
    strictDepartmentView?: boolean;
    isReadOnly?: boolean;
    onSaveStaff?: (data: any) => void;
    onSaveDepartment?: (data: any) => void;
    onUpdateOrganization?: (data: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [rootTitle, setRootTitle] = useState(organization?.organogram_head_title || 'School Admin');

    const filteredDepartments = scopedDeptId
      ? departments.filter(d => String(d.id) === String(scopedDeptId))
      : departments;

    // Staff lookup for "reports to" names
    const staffMap = new Map(staff.map(s => [s.id, s]));

    // Build a reverse map: staffId -> department they are HOD of
    const hodToDeptMap = new Map<string, string>();
    departments.forEach((dept) => {
      if (dept.hod_id) {
        hodToDeptMap.set(dept.hod_id, dept.id);
      }
    });

    // Group staff by department (checking both department_id AND hod assignment)
    const staffByDept = new Map<string, any[]>();
    const unassignedStaff: any[] = [];

    staff.forEach((s) => {
      // Determine which department this person belongs to:
      // 1. Their own department_id field
      // 2. Or, if they're the HOD of a department (hod_id points to them)
      const deptId = s.department_id || hodToDeptMap.get(s.id);

      if (deptId) {
        const existing = staffByDept.get(deptId) || [];
        existing.push(s);
        staffByDept.set(deptId, existing);
      } else {
        unassignedStaff.push(s);
      }
    });

    const handleSaveReportsTo = (staffMember: any, formData: any) => {
      onSaveStaff?.({
        ...staffMember,
        reports_to: formData.reports_to || null,
        department_id: formData.department_id || staffMember.department_id,
      });
      setEditingStaff(null);
    };

    const StaffRow = ({ member, isHod = false }: { member: any; isHod?: boolean }) => {
      const reportsTo = member.reports_to ? staffMap.get(member.reports_to) : null;

      return (
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
          isHod
            ? "bg-indigo-50/80 dark:bg-indigo-900/15 border-indigo-100 dark:border-indigo-900/30"
            : "bg-zinc-50/80 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
        )}>
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm",
            isHod
              ? "bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none"
              : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
          )}>
            {member.name?.charAt(0) || '?'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{member.name}</p>
              {isHod && (
                <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest shrink-0">
                  HOD
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{member.role || 'Staff'}</p>
            {reportsTo && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3" />
                <span>Reports to <span className="font-bold text-zinc-600 dark:text-zinc-300">{reportsTo.name}</span></span>
              </p>
            )}
          </div>

          {!isReadOnly && (
            <button
              onClick={() => setEditingStaff(member)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              {scopedDeptId ? t('department_organogram') : t('school_organogram')}
            </h1>
            <p className="text-zinc-500 mt-1">
              Staff organized by department. Edit any staff member to set who they report to.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {/* View Toggle */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'list'
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'graph'
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Graph
              </button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="font-bold text-zinc-700 dark:text-zinc-300">{staff.length}</span>
              <span className="text-zinc-500">{t('staff_label')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{departments.length}</span>
              <span className="text-indigo-500">{t('depts')}</span>
            </div>
          </div>
        </div>

        {viewMode === 'graph' ? (() => {
          /* ====== GRAPHICAL TREE VIEW — One big hierarchy ====== */
          // Find the top-level admin (CEO/Principal/School Admin)
          const schoolAdmin = staff.find(s => {
            const role = s.role?.toUpperCase() || '';
            const name = s.name?.toUpperCase() || '';
            return role === 'SCHOOL_ADMIN' ||
              role === 'SUPER_ADMIN' ||
              role === 'CEO' ||
              role === 'PRINCIPAL' ||
              role === 'DIRECTOR' ||
              role.includes('ADMIN') ||
              role.includes('HEAD');
          });

          const handleSaveTitle = () => {
            onUpdateOrganization?.({
              ...organization,
              organogram_head_title: rootTitle
            });
            setIsEditingTitle(false);
          };

          return (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-10 overflow-x-auto custom-scrollbar relative">
              <div className="sm:hidden absolute top-4 right-4 animate-pulse pointer-events-none">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/10 dark:bg-white/10 rounded-lg backdrop-blur-sm">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Scroll</span>
                  <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
                </div>
              </div>
              <div className="min-w-max flex flex-col items-center">
                {/* School Admin / Root Node - HIDDEN IN SCOPED VIEW */}
                {!scopedDeptId && (
                  <>
                    {schoolAdmin ? (
                      <div className="group relative flex flex-col items-center">
                        <div
                          className="p-5 rounded-2xl shadow-xl w-60 text-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer hover:shadow-2xl transition-shadow relative"
                          onClick={() => !isReadOnly && setEditingStaff(schoolAdmin)}
                        >
                          {isEditingTitle ? (
                            <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={rootTitle}
                                onChange={(e) => setRootTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                className="w-full bg-white/10 dark:bg-zinc-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded outline-none"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{rootTitle}</p>
                              {!isReadOnly && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 dark:hover:bg-zinc-100 rounded"
                                >
                                  <Edit className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          )}
                          <p className="font-bold text-lg">{schoolAdmin.name}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">{schoolAdmin.role}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 w-60 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{rootTitle}</p>
                        <p className="font-bold text-zinc-500">Not Found</p>
                      </div>
                    )}

                    {/* Vertical line down from School Admin */}
                    {filteredDepartments.length > 0 && (
                      <div className="w-px h-10 bg-zinc-300 dark:bg-zinc-700" />
                    )}
                  </>
                )}

                {/* Department + Staff Branches */}
                <div className="flex justify-center flex-nowrap gap-x-4 sm:gap-x-10 mt-0">
                  {filteredDepartments.map((dept, idx) => {
                    const hod = dept.hod_id ? staffMap.get(dept.hod_id) : null;
                    const deptStaff = (staffByDept.get(dept.id) || []).filter(s => s.id !== dept.hod_id);

                    return (
                      <div key={dept.id} className="flex flex-col items-center relative">
                        {/* Horizontal Connector Line (Top) */}
                        {filteredDepartments.length > 1 && (
                          <div className="absolute top-0 left-0 right-0 h-px">
                            <div className={cn(
                              "absolute top-0 h-full bg-zinc-300 dark:bg-zinc-700",
                              idx === 0 ? "left-1/2 right-0" :
                                idx === filteredDepartments.length - 1 ? "left-0 right-1/2" :
                                  "left-0 right-0"
                            )} />
                          </div>
                        )}

                        {/* Vertical connector to department */}
                        <div className="w-px h-8 bg-zinc-300 dark:bg-zinc-700 relative z-10" />

                        {/* Department Node */}
                        <div className="p-3 sm:p-4 rounded-2xl shadow-lg w-40 sm:w-52 text-center bg-indigo-600 text-white relative z-10 transition-transform hover:scale-105">
                          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{t('department_name')}</p>
                          <p className="font-bold text-xs sm:text-sm leading-tight">{dept.name}</p>
                        </div>

                        {/* HOD Node */}
                        {hod ? (
                          <>
                            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700" />
                            <div
                              className="p-3 sm:p-3.5 rounded-xl w-36 sm:w-48 text-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-md transition-all hover:border-indigo-400 group"
                              onClick={() => !isReadOnly && setEditingStaff(hod)}
                            >
                              <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest mb-1.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{t('hod')}</span>
                              <p className="font-bold text-[10px] sm:text-xs text-zinc-900 dark:text-white truncate">{hod.name}</p>
                              <p className="text-[8px] sm:text-[9px] text-zinc-400 mt-0.5">{hod.role}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700" />
                            <div className="p-2 sm:p-3 rounded-xl w-36 sm:w-48 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{t('no_hod')}</p>
                            </div>
                          </>
                        )}

                        {/* Staff under this department */}
                        {deptStaff.length > 0 && (
                          <div className="flex flex-col items-center w-full mt-0">
                            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />

                            <div className="flex justify-center gap-2 sm:gap-4 mt-0">
                              {deptStaff.map((s, sIdx) => {
                                const reportsTo = s.reports_to ? staffMap.get(s.reports_to) : null;
                                return (
                                  <div key={s.id} className="flex flex-col items-center relative">
                                    {/* Sub-Horizontal Connector Line */}
                                    {deptStaff.length > 1 && (
                                      <div className="absolute top-0 left-0 right-0 h-px">
                                        <div className={cn(
                                          "absolute top-0 h-full bg-zinc-200 dark:bg-zinc-700",
                                          sIdx === 0 ? "left-1/2 right-0" :
                                            sIdx === deptStaff.length - 1 ? "left-0 right-1/2" :
                                              "left-0 right-0"
                                        )} />
                                      </div>
                                    )}

                                    <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 relative z-10" />
                                    <div
                                      className="p-2.5 sm:p-3 rounded-xl w-28 sm:w-36 text-center bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all relative z-10"
                                      onClick={() => !isReadOnly && setEditingStaff(s)}
                                    >
                                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-zinc-500 mx-auto mb-1.5 shadow-sm">
                                        {s.name?.charAt(0) || '?'}
                                      </div>
                                      <p className="font-bold text-[10px] sm:text-[11px] text-zinc-900 dark:text-white truncate">{s.name}</p>
                                      <p className="text-[7px] sm:text-[8px] text-zinc-400 mt-0.5 truncate">{s.role || t('staff')}</p>
                                      {reportsTo && (
                                        <p className="text-[6px] sm:text-[7px] text-indigo-500 dark:text-indigo-400 mt-1 font-bold truncate">
                                          → {reportsTo.name.split(' ')[0]}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Unassigned Staff at the bottom */}
                {unassignedStaff.length > 0 && !scopedDeptId && (
                  <div className="mt-12 pt-8 border-t border-dashed border-zinc-200 dark:border-zinc-700 w-full">
                    <p className="text-center text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">{t('unassigned_staff')}</p>
                    <div className="flex justify-center gap-4 flex-wrap">
                      {unassignedStaff.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl w-36 text-center bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 cursor-pointer hover:shadow-md transition-all"
                          onClick={() => !isReadOnly && setEditingStaff(s)}
                        >
                          <p className="font-bold text-[11px] text-zinc-900 dark:text-white truncate">{s.name}</p>
                          <p className="text-[8px] text-zinc-400 mt-0.5">{s.role || 'Staff'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })() : (
          /* ====== LIST VIEW (Department Cards) ====== */
          <>

            {/* Department Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDepartments.map((dept) => {
                const hod = dept.hod_id ? staffMap.get(dept.hod_id) : null;
                const deptStaff = (staffByDept.get(dept.id) || []).filter(s => s.id !== dept.hod_id);

                return (
                  <div
                    key={dept.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Department Header */}
                    <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none">
                            {dept.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <h3 className="font-black text-zinc-900 dark:text-white tracking-tight">{dept.name}</h3>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                              {(deptStaff.length + (hod ? 1 : 0))} members
                            </p>
                          </div>
                        </div>
                        {!hod && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800/30">
                            No HOD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Staff List */}
                    <div className="p-4 space-y-2.5">
                      {hod && <StaffRow member={hod} isHod={true} />}

                      {deptStaff.length > 0 ? (
                        deptStaff.map((s) => (
                          <div key={s.id}><StaffRow member={s} /></div>
                        ))
                      ) : !hod ? (
                        <div className="py-8 text-center">
                          <Users className="w-7 h-7 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No Staff Assigned</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unassigned Staff */}
            {unassignedStaff.length > 0 && !scopedDeptId && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-200 dark:shadow-none">
                      ?
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-900 dark:text-white tracking-tight">Unassigned Staff</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                        {unassignedStaff.length} members without a department
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  {unassignedStaff.map((s) => (
                    <div key={s.id}><StaffRow member={s} /></div>
                  ))}
                </div>
              </div>
            )}

            {staff.length === 0 && (
              <div className="p-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <Users className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
                <p className="font-bold text-zinc-400">No staff members found.</p>
                <p className="text-sm text-zinc-400 mt-1">Add staff in Staff Management to see the organogram.</p>
              </div>
            )}
          </>
        )}

        {/* Edit Reports To Modal */}
        <Modal
          isOpen={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          title={`Edit Reporting — ${editingStaff?.name}`}
        >
          <form
            className="space-y-5 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveReportsTo(editingStaff, Object.fromEntries(formData));
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {t('reports_to')}
              </label>
              <select
                name="reports_to"
                defaultValue={editingStaff?.reports_to || ""}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No one (Top-level)</option>
                {staff
                  .filter((s) => s.id !== editingStaff?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {t('department')}
              </label>
              <select
                name="department_id"
                defaultValue={editingStaff?.department_id || ""}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('no_department')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {t('save_changes')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  LessonNotes: ({
    role,
    data,
    staffList,
    currentStaff,
    currentUser,
    subjects = [],
    classes = [],
    onSave,
    onDelete,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    currentStaff?: any;
    currentUser?: any;
    subjects?: any[];
    classes?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const isApprover =
      role === "SCHOOL_ADMIN" || role === "HOD" || role === "HR";
    const [markingNote, setMarkingNote] = useState<any>(null);
    const [viewingNote, setViewingNote] = useState<any>(null);

    const LessonNoteForm = ({
      item,
      isViewOnly,
    }: {
      item?: any;
      isViewOnly?: boolean;
    }) => {
      const teacherId = item?.teacher_id || currentStaff?.id;
      const teacherSubjects = subjects.filter((s) => {
        if (isApprover) return true;
        return (
          s.teacher_id === teacherId ||
          (s.classes || []).some((c: any) => c.teacher_id === teacherId)
        );
      });
      const [selectedSub, setSelectedSub] = useState(item?.subject || "");
      const currentSubjectData = teacherSubjects.find(
        (s) => s.name === selectedSub,
      );
      const assignedClassIds = currentSubjectData
        ? (currentSubjectData.classes || []).map((c: any) => c.id)
        : [];
      const filteredClasses = isApprover
        ? classes
        : selectedSub && currentSubjectData && assignedClassIds.length > 0
          ? classes.filter((c) => assignedClassIds.includes(c.id))
          : classes; // show all pre-filtered classes when no subject selected

      return (
        <div className="space-y-4">
          {isApprover ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('teacher')}
              </label>
              <select
                name="teacher_id"
                defaultValue={item?.teacher_id || currentStaff?.id || ""}
                required
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
              >
                <option value="">Select Teacher...</option>
                {(staffList || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input
              type="hidden"
              name="teacher_id"
              value={item?.teacher_id || currentStaff?.id || ""}
            />
          )}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('subject')}
              </label>
              <select
                name="subject"
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                required
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
              >
                <option value="">Select Subject...</option>
                {teacherSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between">
                {item ? "Class" : "Select Class(es)"}
                {!item && filteredClasses.length > 0 && (
                  <span className="text-[10px] text-indigo-600 lowercase font-medium italic">
                    You can select multiple sections
                  </span>
                )}
              </label>
              {item ? (
                <select
                  name="class_id"
                  defaultValue={item?.class_id}
                  required
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                >
                  <option value="">{t('select_option_placeholder')}</option>
                  {filteredClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl max-h-48 overflow-y-auto">
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 p-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-all group"
                      >
                        <input
                          type="checkbox"
                          name="class_id"
                          value={c.id}
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">
                          {c.name} {c.section}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="col-span-full text-center py-4 text-xs text-zinc-400 italic">
                      No classes available for this subject.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">
              {t('topic')}
            </label>
            <input
              type="text"
              name="topic"
              defaultValue={item?.topic}
              required
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">
              {t('content')}
            </label>
            <textarea
              name="content"
              defaultValue={item?.content}
              rows={5}
              required
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
            />
          </div>
          {isApprover && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('status')}
              </label>
              <select
                name="status"
                defaultValue={item?.status || "Pending"}
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
              >
                <option value="Pending">{t('pending')}</option>
                <option value="Approved">{t('approved')}</option>
                <option value="Rejected">{t('rejected')}</option>
              </select>
            </div>
          )}
        </div>
      );
    };

    const groupedData = React.useMemo(() => {
      const groups = new Map();
      (data || []).forEach(note => {
        const key = `${note.teacher_id}_${note.subject}_${note.topic}_${note.status}_${note.created_at ? note.created_at.slice(0, 10) : ''}`;
        if (!groups.has(key)) {
          groups.set(key, {
            ...note,
            grouped_ids: [note.id],
            classes: [{ id: note.class_id, name: note.class_name, section: note.class_section }]
          });
        } else {
          const existing = groups.get(key);
          existing.grouped_ids.push(note.id);
          existing.classes.push({ id: note.class_id, name: note.class_name, section: note.class_section });
        }
      });
      return Array.from(groups.values());
    }, [data]);

    return (
      <div className="space-y-6">
        <DataTable
          title={t('lesson_notes')}
          data={groupedData}
          onSave={async (itemData) => {
            if (itemData && itemData.grouped_ids && itemData.grouped_ids.length > 1) {
              for (const id of itemData.grouped_ids) {
                await onSave?.({ ...itemData, id });
              }
            } else {
              await onSave?.(itemData);
            }
          }}
          onDelete={role === "STAFF" ? undefined : onDelete}
          onAdd={onSave ? () => { } : undefined}
          onView={(item) => setViewingNote(item)}
          autoModal={true}
          columns={[
            ...(isApprover
              ? [
                {
                  header: "Teacher",
                  accessor: (item: any) => item.teacher_name,
                  className: "font-bold",
                },
              ]
              : []),
            {
              header: "Class",
              accessor: (item: any) =>
                item.classes && item.classes.length > 0
                  ? item.classes
                    .map((c: any) => `${c.name} ${c.section || ""}`.trim())
                    .filter((n: string) => n !== "N/A" && n !== "")
                    .join(", ") || "N/A"
                  : item.class_name
                    ? `${item.class_name} ${item.class_section || ""}`
                    : "N/A",
            },
            { header: "Subject", accessor: (item: any) => item.subject },
            { header: "Topic", accessor: (item: any) => item.topic },
            {
              header: "Date Submitted",
              accessor: (item: any) =>
                item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "N/A",
            },
            {
              header: "Status",
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : item.status === "Pending"
                        ? "bg-amber-50 text-amber-600"
                        : item.status === "Draft"
                          ? "bg-zinc-100 text-zinc-500"
                          : "bg-red-50 text-red-600",
                  )}
                >
                  {item.status}
                </span>
              ),
            },
            {
              header: "Marks",
              accessor: (item: any) =>
                item.marks ? (
                  <span className="font-bold text-amber-600 tracking-tight">
                    {item.marks}%
                  </span>
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
          ]}
          extraActions={(item: any) => {
            const handleBulkAction = async (status: string) => {
              if (item.grouped_ids && item.grouped_ids.length > 1) {
                for (const id of item.grouped_ids) {
                  await onSave?.({ ...item, id, status });
                }
              } else {
                await onSave?.({ ...item, status });
              }
            };

            return (
              <>
                {!isApprover && item.status === "Draft" && (
                  <button
                    onClick={() => handleBulkAction("Pending")}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send to Admin
                  </button>
                )}
                {isApprover && item.status !== "Approved" && (
                  <button
                    onClick={() => handleBulkAction("Approved")}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                )}
                {isApprover && item.status !== "Rejected" && (
                  <button
                    onClick={() => handleBulkAction("Rejected")}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
                {isApprover && (
                  <button
                    onClick={() => setMarkingNote(item)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    Add Marks
                  </button>
                )}
              </>
            );
          }}
          renderForm={(item: any, isViewOnly) => (
            <LessonNoteForm item={item} isViewOnly={isViewOnly} />
          )}
        />

        <Modal
          isOpen={!!viewingNote}
          onClose={() => setViewingNote(null)}
          title={t('view_lesson_note')}
        >
          <div className="space-y-6 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Teacher
                </p>
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {viewingNote?.teacher_name}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Subject & Topic
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold">
                    {viewingNote?.subject}
                  </span>
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    {viewingNote?.topic}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Class(es)
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {viewingNote?.classes && viewingNote.classes.length > 0 ? (
                    viewingNote.classes.map((c: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-bold">
                        {c.name} {c.section || ""}
                      </span>
                    ))
                  ) : viewingNote?.class_name ? (
                    <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-bold">
                      {viewingNote.class_name} {viewingNote.class_section || ""}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">N/A</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-right">
                  Status
                </p>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider block text-center",
                    viewingNote?.status === "Approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : viewingNote?.status === "Pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600",
                  )}
                >
                  {viewingNote?.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('lesson_content')}
                </h3>
                <button
                  onClick={() => {
                    const printClasses = viewingNote?.classes && viewingNote.classes.length > 0
                      ? viewingNote.classes.map((c: any) => `${c.name} ${c.section || ''}`).join(', ')
                      : viewingNote?.class_name
                        ? `${viewingNote.class_name} ${viewingNote.class_section || ''}`
                        : 'N/A';

                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Lesson Note: ${viewingNote.topic}</title>
                            <style>
                              body { font-family: 'Times New Roman', serif; padding: 50px; line-height: 1.8; color: #111; }
                              .header { border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 20px; }
                              .meta { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
                              h1 { font-size: 28px; margin-bottom: 10px; }
                              .content { white-space: pre-wrap; font-size: 16px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1>Lesson Note: ${viewingNote.topic}</h1>
                              <div class="meta">
                                <span><strong>Teacher:</strong> ${viewingNote.teacher_name}</span>
                                <span><strong>Class(es):</strong> ${printClasses}</span>
                                <span><strong>Subject:</strong> ${viewingNote.subject}</span>
                                <span><strong>Date:</strong> ${new Date(viewingNote.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div class="content">${viewingNote.content}</div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Download className="w-3 h-3" />
                  {t('download_pdf')}
                </button>
              </div>
              <div className="text-base text-zinc-800 dark:text-zinc-200 leading-loose whitespace-pre-wrap font-serif bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 min-h-[400px] shadow-inner">
                {viewingNote?.content || "No content provided."}
              </div>
            </div>

            {viewingNote?.feedback && (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-800/50 space-y-2">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Supervisor Feedback & Marks ({viewingNote.marks}%)
                </h4>
                <p className="text-sm italic text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  "{viewingNote.feedback}"
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setViewingNote(null)}
                className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg"
              >
                Close Reader
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={!!markingNote}
          onClose={() => setMarkingNote(null)}
          title={t('appraise_lesson_note')}
        >
          <form
            className="space-y-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onSave?.({
                ...markingNote,
                marks: Number(formData.get("marks")),
                feedback: formData.get("feedback"),
                status: "Approved",
              });
              setMarkingNote(null);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('award_marks')}
              </label>
              <input
                type="number"
                name="marks"
                defaultValue={markingNote?.marks}
                required
                min="0"
                max="100"
                placeholder="e.g. 85"
                className="w-full px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-sm font-bold text-amber-600 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('supervisor_feedback')}
              </label>
              <textarea
                name="feedback"
                defaultValue={markingNote?.feedback}
                rows={4}
                placeholder="Optional feedback..."
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMarkingNote(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {t('save_marks_approve')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  RolesPermissions: ({
    staff = [],
    onSave,
  }: {
    staff?: any[];
    onSave?: (data: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const [editingStaff, setEditingStaff] = useState<any | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'graphical'>('graphical');
    const [selectedAdditionalRoles, setSelectedAdditionalRoles] = useState<
      string[]
    >([]);
    const [primaryRole, setPrimaryRole] = useState("");

    const availableRoles = [
      "SCHOOL_ADMIN",
      "STAFF",
      "HOD",
      "FINANCE",
      "LIBRARIAN",
      "BUS_DRIVER",
      "TRANSPORTATION",
      "NON_STAFF",
      "HOSTEL",
      "STUDENT_CLUBS",
      "ASSETS_EQUIPMENT",
      "HEALTH",
      "DISCIPLINE",
      "PARENT",
      "STUDENT",
    ];

    const handleOpenModal = (item: any) => {
      setEditingStaff(item);
      setPrimaryRole(item.role || "");
      setSelectedAdditionalRoles(item.additional_roles || []);
      setIsRoleModalOpen(true);
    };

    const handleSaveRoles = async () => {
      if (editingStaff && onSave) {
        await onSave({
          ...editingStaff,
          role: primaryRole,
          additional_roles: selectedAdditionalRoles,
        });
        setIsRoleModalOpen(false);
      }
    };

    const toggleAdditionalRole = (role: string) => {
      setSelectedAdditionalRoles((prev) =>
        prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {t('roles_permissions_mgmt')}
              </h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Assign multiple roles to staff members for switchable access
              </p>
            </div>
          </div>
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
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <DataTable<any>
              title={t('staff_role_assignments')}
              data={staff}
              columns={[
                {
                  header: "Staff Name",
                  accessor: "name",
                  className: "font-bold",
                },
                {
                  header: "Primary Role",
                  accessor: (item: any) => (
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {item.role}
                    </span>
                  ),
                },
                {
                  header: "Additional Roles",
                  accessor: (item: any) => (
                    <div className="flex flex-wrap gap-1">
                      {item.additional_roles &&
                        item.additional_roles.length > 0 ? (
                        item.additional_roles.map((role: string) => (
                          <span
                            key={role}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-400">None</span>
                      )}
                    </div>
                  ),
                },
                {
                  header: "Status",
                  accessor: (item: any) => (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      {item.status}
                    </span>
                  ),
                },
              ]}
              onEdit={handleOpenModal}
              autoModal={false}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => (
              <div 
                key={member.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                {/* Header: Avatar & Basic Info */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-200 dark:shadow-none">
                      {member.name[0]}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 shadow-sm",
                      member.status === 'Active' ? "bg-emerald-500" : "bg-red-500"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">
                      {member.name}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Role Status Section */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Primary Role</label>
                    <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-wide">
                        {member.role || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Additional Privileges</label>
                    <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
                      {member.additional_roles && member.additional_roles.length > 0 ? (
                        member.additional_roles.map((role: string) => (
                          <div 
                            key={role}
                            className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[9px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5 hover:border-indigo-300 transition-colors"
                          >
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            {role}
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-400 italic pl-1 pt-1">No additional roles assigned</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button 
                    onClick={() => handleOpenModal(member)}
                    className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-zinc-200 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Manage Permissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title={`Manage Roles for ${editingStaff?.name}`}
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
              >
                {t('save_permissions')}
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Primary Role (Default Login)
              </label>
              <select
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Additional Authorized Roles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableRoles
                  .filter((r) => r !== primaryRole)
                  .map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleAdditionalRole(role)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all",
                        selectedAdditionalRoles.includes(role)
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400",
                      )}
                    >
                      <span>{role}</span>
                      {selectedAdditionalRoles.includes(role) && (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </button>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                **Security Note:** Assigning additional roles allows the staff
                member to switch contexts without logging out. Ensure they have
                the necessary clearances for each selected role.
              </p>
            </div>
          </div>
        </Modal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">
              Role Switching Logic
            </h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                <span>
                  Staff with multiple roles will see a "Switch Role" option in
                  their profile menu.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                <span>
                  Permissions are dynamically updated based on the currently
                  active role.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                <span>Primary role remains the default login role.</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 transition-colors">
                Audit Permissions
              </button>
              <button className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 transition-colors">
                Reset All Roles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
  StaffManagement: ({
    role,
    data,
    departments = [],
    onSave,
    onDelete,
    onExitStaff,
  }: {
    role?: UserRole;
    data: any[];
    departments?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    onExitStaff?: (data: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const [showSalary, setShowSalary] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [isEditingInModal, setIsEditingInModal] = useState(false);
    const [exitingStaff, setExitingStaff] = useState<any>(null);
    const isStaff = role === "STAFF";

    const formatDateForInput = (dateStr: any) => {
      if (!dateStr) return "";
      try {
        // If it's already YYYY-MM-DD, just return it
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          return dateStr.split("T")[0];
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        // Manually build YYYY-MM-DD from local components to avoid UTC shifts
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return "";
      }
    };

    const renderStaffProfile = (item: any, forceOnEdit?: (item: any) => void) => {
      if (!item) return null;

      const tabs = [
        { id: "overview", label: t("overview"), icon: User },
        { id: "job", label: t("job_details"), icon: Briefcase },
        { id: "payroll", label: t("finance"), icon: Wallet },
        { id: "system", label: t("system"), icon: Settings },
      ];

      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm gap-6">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative group">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-inner font-black text-xl md:text-3xl">
                  {item.profile_image ? (
                    <img
                      src={item.profile_image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    item.name ? item.name.charAt(0) : "U"
                  )}
                </div>
                {item.status === "Active" && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm" />
                )}
              </div>
              <div className="space-y-1 md:space-y-1.5">
                <h3 className="text-xl md:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2 md:gap-3">
                  {item.name}
                  {item.status === "Active" && (
                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                    <Briefcase className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {item.role}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider border",
                      item.status === "Active"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-red-50 text-red-600 border-red-100",
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {forceOnEdit && (
                <button
                  onClick={() => forceOnEdit(item)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                >
                  <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Edit Profile
                </button>
              )}
              {onExitStaff && item.status === "Active" && (
                <button
                  onClick={() => setExitingStaff(item)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-rose-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-rose-600/20"
                >
                  <UserMinus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Exit Staff
                </button>
              )}
              {isStaff && (
                <button
                  onClick={() => setShowSalary(!showSalary)}
                  className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/10 md:ml-2"
                >
                  {showSalary ? (
                    <EyeOff className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  ) : (
                    <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  )}
                  {showSalary ? "Lock View" : "Unlock Sensitive Data"}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl w-full md:w-fit overflow-x-auto custom-scrollbar no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                )}
              >
                <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {activeTab === "overview" && (
                <div className="p-4 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-8">
                  <section className="space-y-6">
                    <h4 className="flex items-center gap-3 text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-4">
                      <Mail className="w-4 h-4" />
                      {t("contact_information")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          Email Address
                        </label>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white break-all">
                          {item.email}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          Phone Number
                        </label>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {item.phone || "Not Provided"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="flex items-center gap-3 text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-4">
                      <CalendarDays className="w-4 h-4" />
                      {t("personal_details")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          Date of Birth
                        </label>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {item.date_of_birth
                            ? new Date(item.date_of_birth).toLocaleDateString(
                              undefined,
                              { dateStyle: "long" },
                            )
                            : "Not Set"}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "job" && (
                <div className="p-4 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-8">
                  <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {t("department")}
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {item.department_name || t("no_department")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {t("reports_to")}
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {item.reports_to_name || t("no_manager")}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "payroll" && (
                <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-3xl">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                        Monthly Net
                      </p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        {!isStaff || showSalary
                          ? item.salary
                            ? `${currency}${Number(item.salary).toLocaleString()}`
                            : t("not_set")
                          : `${currency}xxxxxx`}
                      </p>
                    </div>
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                        Allowances
                      </p>
                      <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                        {!isStaff || showSalary
                          ? item.allowances
                            ? `${currency}${Number(item.allowances).toLocaleString()}`
                            : `${currency}0`
                          : `${currency}xxxxxx`}
                      </p>
                    </div>
                    <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-3xl">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">
                        Deductions
                      </p>
                      <p className="text-2xl font-black text-rose-700 dark:text-rose-400">
                        {!isStaff || showSalary
                          ? item.deductions
                            ? `${currency}${Number(item.deductions).toLocaleString()}`
                            : `${currency}0`
                          : `${currency}xxxxxx`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "system" && (
                <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-8">
                  <section className="space-y-6">
                    <h4 className="flex items-center gap-3 text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-4">
                      Permissions & Access
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {item.additional_roles &&
                        item.additional_roles.length > 0 ? (
                        item.additional_roles.map((r: string) => (
                          <span
                            key={r}
                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-800/50"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 italic">
                          No additional roles assigned.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-lg shadow-indigo-600/20 ring-1 ring-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-black text-white uppercase text-xs tracking-widest">
                    Quick Performance
                  </h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Efficiency Score</span>
                    <span className="text-white font-black">94%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: "94%" }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 border-b border-zinc-50 dark:border-zinc-800 pb-3">
                  Account Activity
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <div>
                      <p className="text-[10px] font-black text-zinc-900 dark:text-white">
                        Profile Last Updated
                      </p>
                      <p className="text-[10px] text-zinc-400">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <div>
                      <p className="text-[10px] font-black text-zinc-900 dark:text-white">
                        System Login
                      </p>
                      <p className="text-[10px] text-zinc-400">Active now</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const stats = useMemo(() => {
      const active = data.filter((s) => s.status === "Active").length;
      const onLeave = data.filter((s) => s.status === "On Leave").length;
      const depts = departments.length;
      const newest = data.filter(
        (s) =>
          new Date(s.created_at) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length;

      return {
        total: data.length,
        active,
        onLeave,
        depts,
        newest,
      };
    }, [data, departments]);

    const filteredData = useMemo(() => {
      if (activeFilter === "all") return data;
      if (activeFilter === "active")
        return data.filter((s) => s.status === "Active");
      if (activeFilter === "leave")
        return data.filter((s) => s.status === "On Leave");
      if (activeFilter === "new")
        return data.filter(
          (s) =>
            new Date(s.created_at) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        );
      return data;
    }, [data, activeFilter]);

    const statsCards = [
      {
        id: "all",
        label: t("total_staff"),
        value: stats.total,
        icon: Users,
        color: "indigo",
      },
      {
        id: "active",
        label: t("active"),
        value: stats.active,
        icon: UserCheck,
        color: "emerald",
      },
      {
        id: "leave",
        label: t("on_leave"),
        value: stats.onLeave,
        icon: UserMinus,
        color: "amber",
      },
      {
        id: "new",
        label: t("new_hires"),
        value: stats.newest,
        icon: UserPlus,
        color: "rose",
      },
    ];

    const renderManagementHeader = () => (
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setActiveFilter(card.id)}
              className={cn(
                "p-4 rounded-2xl border transition-all duration-300 text-left group",
                activeFilter === card.id
                  ? `bg-${card.color}-600 border-${card.color}-600 shadow-lg shadow-${card.color}-600/20`
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    activeFilter === card.id
                      ? "bg-white/20 text-white"
                      : `bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600`,
                  )}
                >
                  <card.icon className="w-5 h-5" />
                </div>
                {activeFilter === card.id && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <div className="mt-4">
                <p
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    activeFilter === card.id
                      ? "text-white/70"
                      : "text-zinc-400 group-hover:text-zinc-500",
                  )}
                >
                  {card.label}
                </p>
                <h4
                  className={cn(
                    "text-2xl font-black mt-1",
                    activeFilter === card.id
                      ? "text-white"
                      : "text-zinc-900 dark:text-white",
                  )}
                >
                  {card.value}
                </h4>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    );

    const StaffForm = ({ item, isViewOnly, t, departments, data, currency, formatDateForInput }: any) => {
      const [currentRole, setCurrentRole] = useState(item?.role || "STAFF");

      return (
        <div key={item?.id || 'new'} className="space-y-8 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* PERSONAL INFORMATION SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{t('personal_information')}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('full_name')}</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={item?.name}
                  disabled={isViewOnly}
                  required
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('email_address')}</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={item?.email}
                  disabled={isViewOnly}
                  required
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('phone_number')}</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={item?.phone}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('date_of_birth')}</label>
                <input
                  type="date"
                  name="date_of_birth"
                  defaultValue={formatDateForInput(item?.date_of_birth)}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* EMPLOYMENT INFORMATION SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{t('employment_details')}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('department')}</label>
                <select
                  name="department_id"
                  defaultValue={item?.department_id || ""}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('reporting_to')}</label>
                <select
                  name="reports_to"
                  defaultValue={item?.reports_to || ""}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">Select Supervisor...</option>
                  {data.filter((s: any) => s.id !== item?.id).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('designation')}</label>
                <select
                  name="role"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  disabled={isViewOnly}
                  required
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="HOD">HOD</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="LIBRARIAN">LIBRARIAN</option>
                  <option value="BUS_DRIVER">BUS DRIVER</option>
                  <option value="TRANSPORTATION">TRANSPORTATION</option>
                  <option value="NON_STAFF">NON_STAFF</option>
                  <option value="HOSTEL">HOSTEL</option>
                  <option value="STUDENT_CLUBS">STUDENT_CLUBS</option>
                  <option value="ASSETS_EQUIPMENT">ASSETS_EQUIPMENT</option>
                  <option value="HEALTH">HEALTH</option>
                  <option value="DISCIPLINE">DISCIPLINE</option>
                </select>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('additional_roles')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                {['SCHOOL_ADMIN', 'STAFF', 'HOD', 'FINANCE', 'LIBRARIAN', 'BUS_DRIVER', 'TRANSPORTATION', 'NON_STAFF', 'HOSTEL', 'STUDENT_CLUBS', 'ASSETS_EQUIPMENT', 'HEALTH', 'DISCIPLINE']
                  .filter(roleOption => roleOption !== currentRole)
                  .map(roleOption => (
                    <label key={roleOption} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="additional_roles"
                        value={roleOption}
                        defaultChecked={item?.additional_roles?.includes(roleOption)}
                        disabled={isViewOnly}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-zinc-900 transition-all cursor-pointer disabled:opacity-50"
                      />
                      <span className={cn(
                        "text-[9px] md:text-[10px] font-black uppercase tracking-tighter transition-colors",
                        isViewOnly ? "text-zinc-500" : "text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600"
                      )}>
                        {roleOption.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          </div>

          {/* FINANCIAL INFORMATION SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <Wallet className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{t('financial_info')}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('basic_salary')} ({currency})</label>
                <input
                  type="number"
                  name="salary"
                  defaultValue={item?.salary || 0}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('allowances')} ({currency})</label>
                <input
                  type="number"
                  name="allowances"
                  defaultValue={item?.allowances || 0}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('deductions')} ({currency})</label>
                <input
                  type="number"
                  name="deductions"
                  defaultValue={item?.deductions || 0}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* HR & LEAVE SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{t('hr_leave_settings')}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('annual_leave_limit')}</label>
                <input
                  type="number"
                  name="annual_leave_limit"
                  defaultValue={item?.annual_leave_limit || 20}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('leave_unit')}</label>
                <select
                  name="leave_limit_unit"
                  defaultValue={item?.leave_limit_unit || "Days"}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 md:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="Days">Days</option>
                  <option value="Weeks">Weeks</option>
                  <option value="Months">Months</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      );
    };

    if (viewMode === "grid" && !isStaff) {
      return (
        <div className="space-y-8">
          {renderManagementHeader()}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredData.map((staff) => (
                <motion.div
                  key={staff.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 transition-all group cursor-pointer"
                  onClick={() => {
                    setEditingStaff(staff);
                    setIsEditingInModal(false);
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-white dark:border-zinc-900 overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800">
                          {staff.profile_image ? (
                            <img
                              src={staff.profile_image}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-zinc-400" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900",
                            staff.status === "Active"
                              ? "bg-emerald-500"
                              : staff.status === "On Leave"
                                ? "bg-amber-500"
                                : "bg-zinc-300",
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStaff(staff);
                            setIsEditingInModal(false);
                          }}
                          className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStaff(staff);
                            setIsEditingInModal(true);
                          }}
                          className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {onExitStaff && staff.status === "Active" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExitingStaff(staff);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors"
                            title="Exit Management"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-black text-zinc-900 dark:text-white truncate">
                        {staff.name}
                      </h4>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {staff.role}
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="truncate">
                          {staff.department_name || t("no_department")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Modal
            isOpen={!!editingStaff}
            onClose={() => setEditingStaff(null)}
            title={isEditingInModal ? t("edit_staff_profile") : t("staff_profile")}
            maxWidth="max-w-4xl"
            footer={isEditingInModal ? (
              <div className="flex justify-end gap-3 px-4 pb-4">
                <button
                  onClick={() => setIsEditingInModal(false)}
                  className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={async () => {
                    const form = document.getElementById('grid-staff-edit-form') as HTMLFormElement;
                    if (form) {
                      const formData = new FormData(form);
                      const values: any = {};
                      formData.forEach((value, key) => {
                        if (key === 'additional_roles') {
                          if (!values[key]) values[key] = [];
                          values[key].push(value);
                        } else {
                          values[key] = value;
                        }
                      });
                      if (onSave) {
                        await onSave({ ...editingStaff, ...values });
                      }
                      setEditingStaff(null);
                    }
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
                >
                  {t('save_changes')}
                </button>
              </div>
            ) : undefined}
          >
            <div className="p-4">
              {isEditingInModal ? (
                <form id="grid-staff-edit-form" onSubmit={(e) => e.preventDefault()}>
                  <StaffForm item={editingStaff} isViewOnly={false} t={t} departments={departments} data={data} currency={currency} formatDateForInput={formatDateForInput} />
                </form>
              ) : (
                renderStaffProfile(editingStaff, () => setIsEditingInModal(true))
              )}
            </div>
          </Modal>

          <Modal
            isOpen={!!exitingStaff}
            onClose={() => setExitingStaff(null)}
            title={`Initiate Exit — ${exitingStaff?.name}`}
          >
            <form
              className="p-6 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onExitStaff?.({
                  staff_id: exitingStaff.id,
                  exit_date: formData.get("exit_date"),
                  reason: formData.get("reason"),
                  status: "Pending"
                });
                setExitingStaff(null);
              }}
            >
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-2xl">
                <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">
                  You are initiating the exit process for this staff member. This will create a record in Exit Management for final clearance.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                    Last Working Day
                  </label>
                  <input
                    type="date"
                    name="exit_date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                    Reason for Exit
                  </label>
                  <select
                    name="reason"
                    required
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  >
                    <option value="Resignation">Resignation</option>
                    <option value="Retirement">Retirement</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setExitingStaff(null)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all"
                >
                  Initiate Exit
                </button>
              </div>
            </form>
          </Modal>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {renderManagementHeader()}
        <DataTable
          title={isStaff ? t("my_profile") : t("staff_directory")}
          addLabel={t("add_staff_member")}
          data={filteredData}
          onSave={onSave}
          onEdit={onSave}
          onDelete={onDelete}
          onAdd={isStaff ? undefined : () => { }}
          detailsMaxWidth="max-w-4xl"
          renderDetails={(item) => renderStaffProfile(item)}
          initialViewItem={isStaff && data.length === 1 ? data[0] : undefined}
          renderForm={(item, isViewOnly, onEdit) => {
            if (isViewOnly && item) {
              return renderStaffProfile(item, (s) => onEdit?.(s));
            }
            return <StaffForm item={item} isViewOnly={!!isViewOnly} t={t} departments={departments} data={data} currency={currency} formatDateForInput={formatDateForInput} />;
          }}
          columns={[
            { header: t('name'), accessor: "name", className: "font-bold" },
            { header: t('role'), accessor: "role" },
            { header: t('department'), accessor: "department_name" },
            {
              header: t('salary'),
              accessor: (item: any) =>
                item.salary ? (
                  <span className="font-bold text-emerald-600">
                    {currency}{Number(item.salary).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
            {
              header: t('status'),
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  {t(item.status?.toLowerCase() || 'active')}
                </span>
              ),
            },
          ]}
          extraActions={(item) => (
            <>
              {item.status === "Active" ? (
                <button
                  onClick={() => onSave?.({ ...item, status: "Inactive" })}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Deactivate Account
                </button>
              ) : (
                <button
                  onClick={() => onSave?.({ ...item, status: "Active" })}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Activate Account
                </button>
              )}
            </>
          )}
        />

        <Modal
          isOpen={!!exitingStaff}
          onClose={() => setExitingStaff(null)}
          title={`Initiate Exit — ${exitingStaff?.name}`}
        >
          <form
            className="p-6 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onExitStaff?.({
                staff_id: exitingStaff.id,
                exit_date: formData.get("exit_date"),
                reason: formData.get("reason"),
                status: "Pending"
              });
              setExitingStaff(null);
            }}
          >
            <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-2xl">
              <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">
                You are initiating the exit process for this staff member. This will create a record in Exit Management for final clearance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                  Last Working Day
                </label>
                <input
                  type="date"
                  name="exit_date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                  Reason for Exit
                </label>
                <select
                  name="reason"
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                >
                  <option value="Resignation">Resignation</option>
                  <option value="Retirement">Retirement</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setExitingStaff(null)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all"
              >
                Initiate Exit
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  StaffAttendance: ({
    role,
    data,
    onSave,
    onDelete,
  }: {
    role?: UserRole;
    data: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    return (
      <DataTable
        title={`Staff Attendance`}
        data={data}
        onSave={onSave}
        onDelete={onDelete}
        hideExport={true}
        columns={[
          {
            header: "Staff Name",
            accessor: (item: any) => item.staff_name,
            className: "font-bold",
          },
          { header: t('date'), accessor: (item: any) => item.date },
          { header: "In", accessor: (item: any) => item.check_in },
          { header: "Out", accessor: (item: any) => item.check_out },
          {
            header: t('status'),
            accessor: (item: any) => (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === "Present"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600",
                )}
              >
                {item.status}
              </span>
            ),
          },
        ]}
      />
    );
  },
  Recruitment: ({
    role,
    data,
    onSave,
    onDelete,
    departments = [],
    onHire,
    onFetchOfferLetter,
    organization,
    documentTemplates,
    onRefreshTemplates,
  }: {
    role?: UserRole;
    data: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    departments?: any[];
    onHire?: (id: string, data: any) => void;
    onFetchOfferLetter?: (id: string) => Promise<any>;
    organization?: any;
    documentTemplates?: any[];
    onRefreshTemplates?: () => Promise<void>;
  }) => {
    const { currency, t } = useLanguage();
    const [hiringApplicant, setHiringApplicant] = useState<any | null>(null);
    const [qualifyingApplicant, setQualifyingApplicant] = useState<any | null>(
      null,
    );
    const [viewingOfferLetter, setViewingOfferLetter] = useState<any | null>(
      null,
    );
    const [resolvedOfferLetter, setResolvedOfferLetter] = useState<string>("");

    const handleHire = async (id: string, formData: any) => {
      if (onHire) {
        await onHire(id, formData);
        setHiringApplicant(null);
      }
    };

    const handleQualify = async (id: string, formData: any) => {
      if (onSave) {
        await onSave({
          ...qualifyingApplicant,
          status: "Qualified",
          salary: Number(formData.salary),
          allowances: Number(formData.allowances),
          deductions: Number(formData.deductions),
          department_id: formData.department_id,
        });
        setQualifyingApplicant(null);
      }
    };

    return (
      <div className="space-y-6">
        <DataTable
          title={t('recruitment_portal')}
          data={data}
          onSave={onSave}
          onEdit={onSave}
          onDelete={onDelete}
          onAdd={onSave ? () => { } : undefined}
          autoViewModal={true}
          renderDetails={(item) => (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-500/20">
                    {item.name?.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{item.position}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border",
                    item.status === "Hired" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      item.status === "Qualified" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                        "bg-zinc-50 text-zinc-600 border-zinc-100"
                  )}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-50 pb-2">Contact Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-50 pb-2">Application Info</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Applied On</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Score</span>
                      <span className="text-xs font-black text-indigo-600">{item.score || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {item.status === "Qualified" && (
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-3xl space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                    <Wallet className="w-4 h-4" />
                    Proposed Financial Package
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-50 dark:border-indigo-900/50">
                      <p className="text-[10px] text-zinc-400 uppercase mb-1">Basic Salary</p>
                      <p className="text-lg font-black text-zinc-900 dark:text-white">{currency}{Number(item.salary).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-50 dark:border-indigo-900/50">
                      <p className="text-[10px] text-zinc-400 uppercase mb-1">Allowances</p>
                      <p className="text-lg font-black text-zinc-900 dark:text-white">{currency}{Number(item.allowances).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-50 dark:border-indigo-900/50">
                      <p className="text-[10px] text-zinc-400 uppercase mb-1">Deductions</p>
                      <p className="text-lg font-black text-red-600">{currency}{Number(item.deductions).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          columns={[
            { header: t('applicant'), accessor: "name", className: "font-bold" },
            { header: t('position'), accessor: "position" },
            {
              header: t('department'),
              accessor: (item: any) => item.department_name || t('no_department')
            },
            {
              header: "Status",
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Hired"
                      ? "bg-emerald-50 text-emerald-600"
                      : item.status === "Qualified"
                        ? "bg-indigo-50 text-indigo-600"
                        : item.status === "Rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-zinc-50 text-zinc-600",
                  )}
                >
                  {t(item.status?.toLowerCase().replace(' ', '_') || 'status')}
                </span>
              ),
            },
          ]}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('full_name')}
                  </label>
                  <input
                    type="text"
                    name="applicant_name"
                    defaultValue={item?.applicant_name || item?.name}
                    required
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('position')}
                  </label>
                  <input
                    type="text"
                    name="position"
                    defaultValue={item?.position}
                    required
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={item?.email}
                    required
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={item?.phone}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={item?.status || "In Review"}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="In Review">{t('in_review')}</option>
                    <option value="Interviewed">{t('interviewed')}</option>
                    <option value="Qualified">{t('qualified')}</option>
                    <option value="Hired">{t('hired')}</option>
                    <option value="Rejected">{t('rejected')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Interview Score (%)
                  </label>
                  <input
                    type="number"
                    name="score"
                    defaultValue={item?.score || 0}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 space-y-4">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400">
                  Proposed Package & Department
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Basic Salary
                    </label>
                    <input
                      type="number"
                      name="salary"
                      defaultValue={item?.salary || 0}
                      disabled={isViewOnly}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Allowances
                    </label>
                    <input
                      type="number"
                      name="allowances"
                      defaultValue={item?.allowances || 0}
                      disabled={isViewOnly}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Deductions
                    </label>
                    <input
                      type="number"
                      name="deductions"
                      defaultValue={item?.deductions || 0}
                      disabled={isViewOnly}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Department
                    </label>
                    <select
                      name="department_id"
                      defaultValue={item?.department_id || ""}
                      disabled={isViewOnly}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select Dept...</option>
                      {departments.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          extraActions={(item) => (
            <>
              {item.status !== "Qualified" && item.status !== "Hired" && (
                <button
                  onClick={() => setQualifyingApplicant(item)}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('mark_qualified')}
                </button>
              )}
              {item.status === "Qualified" && (
                <button
                  onClick={() => setHiringApplicant(item)}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  {t('hire_candidate')}
                </button>
              )}
              {(item.status === "Qualified" || item.status === "Hired") && (
                <button
                  onClick={async () => {
                    const res = await onFetchOfferLetter?.(item.id);
                    if (!res) return;

                    // Resolve template immediately for editing
                    const template = (documentTemplates || [])
                      .filter((t: any) => t.type === "OfferLetter")
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime(),
                      )[0];

                    let resolvedText = res.letter || "";
                    if (template) {
                      const config = template.layout_config || {};
                      resolvedText = config.content || res.letter || "";

                      const replacements: Record<string, string> = {
                        "{{staff_name}}": res.data?.applicant_name || item.name || "Candidate Name",
                        "{{position}}": res.data?.position || item.position || "Staff",
                        "{{salary}}": res.data?.salary ? `${currency}${res.data.salary}` : "N/A",
                        "{{join_date}}": new Date().toLocaleDateString(),
                        "{{department}}": departments.find((d: any) => d.id === (res.data?.department_id || item.department_id))?.name || "N/A",
                        "{{school_name}}": organization?.name || "The School",
                      };

                      Object.entries(replacements).forEach(([key, value]) => {
                        resolvedText = resolvedText.split(key).join(value);
                      });
                    }

                    setViewingOfferLetter(res);
                    setResolvedOfferLetter(resolvedText);
                  }}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {t('view_offer_letter')}
                </button>
              )}
            </>
          )}
        />

        {/* Qualify Modal */}
        <Modal
          isOpen={!!qualifyingApplicant}
          onClose={() => setQualifyingApplicant(null)}
          title={`${t('mark_qualified')}: ${qualifyingApplicant?.name}`}
        >
          <form
            className="p-6 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleQualify(
                qualifyingApplicant.id,
                Object.fromEntries(formData),
              );
            }}
          >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                {t('qualify_candidate_desc').replace('{name}', qualifyingApplicant?.name || t('candidate'))}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Department
              </label>
              <select
                name="department_id"
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Department...</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Basic Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  defaultValue={qualifyingApplicant?.salary || 0}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-indigo-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Allowances
                </label>
                <input
                  type="number"
                  name="allowances"
                  defaultValue={qualifyingApplicant?.allowances || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-indigo-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Deductions
                </label>
                <input
                  type="number"
                  name="deductions"
                  defaultValue={qualifyingApplicant?.deductions || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setQualifyingApplicant(null)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
              >
                {t('mark_qualified')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Hire Modal */}
        <Modal
          isOpen={!!hiringApplicant}
          onClose={() => setHiringApplicant(null)}
          title={`${t('hire_candidate_title').replace('{name}', hiringApplicant?.name || t('candidate'))}`}
        >
          <form
            className="p-6 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleHire(hiringApplicant.id, Object.fromEntries(formData));
            }}
          >
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {t('hire_candidate_desc').replace('{name}', hiringApplicant?.name || hiringApplicant?.applicant_name || t('candidate'))}
              </p>
            </div>

            {/* Hidden fields to ensure handleEntitySave has the name and email for user creation */}
            <input type="hidden" name="name" defaultValue={hiringApplicant?.name || hiringApplicant?.applicant_name} />
            <input type="hidden" name="email" defaultValue={hiringApplicant?.email} />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Department
              </label>
              <select
                name="department_id"
                defaultValue={hiringApplicant?.department_id}
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Department...</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Basic Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  defaultValue={hiringApplicant?.salary || 0}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Allowances
                </label>
                <input
                  type="number"
                  name="allowances"
                  defaultValue={hiringApplicant?.allowances || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-indigo-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Deductions
                </label>
                <input
                  type="number"
                  name="deductions"
                  defaultValue={hiringApplicant?.deductions || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setHiringApplicant(null)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
              >
                {t('confirm_hire')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Offer Letter Modal */}
        <Modal
          isOpen={!!viewingOfferLetter}
          onClose={() => setViewingOfferLetter(null)}
          title={t('offer_letter')}
        >
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
                Editable Document Content
              </label>
              <textarea
                className="w-full h-[500px] p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-inner overflow-y-auto font-serif text-zinc-800 dark:text-zinc-200 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                value={resolvedOfferLetter}
                onChange={(e) => setResolvedOfferLetter(e.target.value)}
                placeholder="Start typing your offer letter content here..."
              />
              <p className="text-[10px] text-zinc-400 italic px-2">
                Tip: Manually edit any part of the letter above before printing.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const template = (documentTemplates || [])
                    .filter((t: any) => t.type === "OfferLetter")
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                    )[0];

                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    let printHtml = "";
                    const body = resolvedOfferLetter;

                    if (template) {
                      const config = template.layout_config || {};
                      printHtml = `
                        <html>
                          <head>
                            <title>Offer Letter</title>
                            <style>
                              body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                              .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                              .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }
                              .letter-body { white-space: pre-wrap; }
                              ${config.styles || ""}
                            </style>
                          </head>
                          <body>
                            <div class="header">${config.headerText || ""}</div>
                            <div class="letter-body">${body}</div>
                            <div class="footer">${config.footerText || ""}</div>
                          </body>
                        </html>
                      `;
                    } else {
                      // Standard Fallback
                      printHtml = `
                        <html>
                          <head>
                            <title>Offer Letter</title>
                            <style>
                              body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                              .header { display: flex; flex-direction: column; align-items: center; text-align: center; border-bottom: 2px solid #eee; margin-bottom: 40px; padding-bottom: 20px; }
                              .logo { max-height: 100px; margin-bottom: 10px; }
                              .school-name { font-size: 24px; font-weight: bold; color: #1e1b4b; margin: 0; }
                              .school-info { font-size: 12px; color: #666; margin: 2px 0; }
                              .letter-body { white-space: pre-wrap; font-size: 16px; min-height: 400px; }
                              .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
                              .signature-box { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
                              .signature-img { max-height: 60px; object-fit: contain; }
                              .signatory-name { font-weight: bold; margin: 0; }
                              .signatory-title { font-size: 14px; color: #444; margin: 0; }
                              @media print { body { padding: 0; } .header { margin-top: 20px; } }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              ${organization?.logo ? `<img src="${organization.logo}" class="logo" alt="Logo" />` : ""}
                              <h1 class="school-name">${organization?.name || "School Offer Letter"}</h1>
                              <p class="school-info">${organization?.support_email || ""}</p>
                            </div>
                            
                            <div class="letter-body">${body}</div>
                            
                            <div class="footer">
                              <div class="signature-box">
                                <p>Sincerely,</p>
                                ${organization?.signature ? `<img src="${organization.signature}" class="signature-img" alt="Signature" />` : '<div style="height: 60px;"></div>'}
                                <p class="signatory-name">The Principal</p>
                                <p class="signatory-title">${organization?.name || "School Administration"}</p>
                              </div>
                            </div>
                          </body>
                        </html>
                      `;
                    }

                    printWindow.document.write(printHtml);

                    printWindow.document.write(printHtml);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                <Download className="w-4 h-4" />
                {t('print_download_pdf')}
              </button>
            </div>
          </div>
        </Modal>

      </div>
    );
  },

  LeaveManagement: ({
    role,
    data,
    staffList,
    currentUser,
    organization,
    onSave,
    onDelete,
    onResetBalances,
    onUpdateOrganization,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    currentUser?: any;
    organization?: any;
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    onResetBalances?: () => void;
    onUpdateOrganization?: (data: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<"requests" | "settings">(
      "requests",
    );
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const canApprove =
      role === "SCHOOL_ADMIN" || role === "HR" || role === "HOD";
    const isStaff = role === "STAFF";

    // Filter data based on role
    const hodStaffRecord = (staffList || []).find(
      (s) =>
        String(s.email).toLowerCase().trim() ===
        String(currentUser?.email).toLowerCase().trim(),
    );
    const hodDeptId = hodStaffRecord?.department_id
      ? String(hodStaffRecord.department_id).toLowerCase()
      : null;
    const hodDeptStaffIds = new Set(
      (staffList || [])
        .filter(
          (s) =>
            s.department_id &&
            hodDeptId &&
            String(s.department_id).toLowerCase() === hodDeptId,
        )
        .map((s) => String(s.id).toLowerCase()),
    );

    const filteredData =
      isStaff && !canApprove
        ? (data || []).filter(
          (item) =>
            String(item.user_id) === String(currentUser?.id) ||
            String(item.staff_id) === String(currentUser?.id) ||
            String(item.email) === String(currentUser?.email),
        )
        : role === "HOD"
          ? (data || []).filter((item) => {
            // HOD sees their own requests + requests from their department staff
            const isOwn =
              String(item.user_id) === String(currentUser?.id) ||
              String(item.staff_id) === String(currentUser?.id) ||
              String(item.email) === String(currentUser?.email);
            const isFromDept =
              item.staff_id &&
              hodDeptStaffIds.has(String(item.staff_id).toLowerCase());
            return isOwn || isFromDept;
          })
          : data || [];

    const staffMember = (staffList || []).find(
      (s) =>
        String(s.id) === String(currentUser?.id) ||
        String(s.email) === String(currentUser?.email),
    );

    const stats = [
      {
        label: isStaff ? t('my_requests') : t('total_requests'),
        value: filteredData.length,
        icon: ClipboardList,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Pending",
        value: filteredData.filter((item) => item.status === "Pending").length,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        label: "Approved",
        value: filteredData.filter((item) => item.status === "Approved").length,
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: t('rejected'),
        value: filteredData.filter((item) => item.status === "Rejected").length,
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
      },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              {t('leave_management')}
            </h2>
            <p className="text-sm text-zinc-500">
              {t('leave_management_desc')}
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === "requests"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              {t('requests')}
            </button>
            {(role === "SCHOOL_ADMIN" || role === "HR") && (
              <button
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === "settings"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                )}
              >
                {t('settings')}
              </button>
            )}
          </div>
        </div>

        {activeTab === "requests" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    stat.bg,
                  )}
                >
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "requests" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              {(role === "SCHOOL_ADMIN" || role === "HR") && (
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('year_reset')}
                </button>
              )}
            </div>
            <DataTable
              title={isStaff ? t('my_leave_history') : t('leave_requests')}
              data={filteredData}
              onSave={onSave}
              onDelete={isStaff ? undefined : onDelete}
              onEdit={isStaff ? undefined : () => { }}
              columns={[
                {
                  header: t('requester'),
                  accessor: (item: any) => item.staff_name,
                  className: "font-bold",
                },
                { header: t('leave_type_label'), accessor: (item: any) => item.leave_type },
                {
                  header: t('duration'),
                  accessor: (item: any) => (
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {item.leave_days || 0}{" "}
                        {item.leave_days === 1 ? t('day') : t('days')}
                      </span>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {item.start_date
                          ? new Date(item.start_date).toLocaleDateString()
                          : ""}{" "}
                        -{" "}
                        {item.end_date
                          ? new Date(item.end_date).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Relief Staff",
                  accessor: (item: any) => (
                    <div className="flex items-center gap-2">
                      {item.relief_staff_name ? (
                        <>
                          <User className="w-3 h-3 text-zinc-400" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            {item.relief_staff_name}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">
                          No relief assigned
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  header: t('status'),
                  accessor: (item: any) => (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        item.status === "Approved"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                          : item.status === "Pending"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                            : "bg-red-50 text-red-600 dark:bg-red-900/20",
                      )}
                    >
                      {item.status}
                    </span>
                  ),
                },
              ]}
              extraActions={(item: any) => (
                <div className="flex flex-col gap-1">
                  {canApprove && item.status === "Pending" && (
                    <>
                      <button
                        onClick={() =>
                          onSave?.({ ...item, status: "Approved" })
                        }
                        className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Request
                      </button>
                      <button
                        onClick={() =>
                          onSave?.({ ...item, status: "Rejected" })
                        }
                        className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Request
                      </button>
                    </>
                  )}
                </div>
              )}
              onAdd={onSave ? () => { } : undefined}
              renderForm={(item: any, isViewOnly) => (
                <div className="space-y-4">
                  {!isStaff || canApprove ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Requester (On Leave)
                      </label>
                      <select
                        name="staff_id"
                        defaultValue={
                          item?.staff_id || (isStaff ? currentUser?.id : "")
                        }
                        required
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      >
                        <option value="">Select Staff...</option>
                        {(staffList || []).map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.department_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Requester
                      </label>
                      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-white">
                        {staffMember?.name || currentUser?.name}
                      </div>
                      <input
                        type="hidden"
                        name="staff_id"
                        value={item?.staff_id || currentUser?.id}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Relief Staff (Stepping In)
                    </label>
                    <select
                      name="relief_staff_id"
                      defaultValue={item?.relief_staff_id}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                    >
                      <option value="">No Relief Assigned (Optional)</option>
                      {(staffList || [])
                        .filter((s: any) => {
                          // Current staff user lookup (either the one in item or current user)
                          const currentReqId = item?.staff_id || item?.user_id || currentUser?.id;
                          const currentReqEmail =
                            item?.email || currentUser?.email;

                          const requester = (staffList || []).find(
                            (r) =>
                              (r.email &&
                                currentReqEmail &&
                                r.email === currentReqEmail) ||
                              (r.staff_id &&
                                currentReqId &&
                                String(r.staff_id) === String(currentReqId)) ||
                              (r.user_id &&
                                currentReqId &&
                                String(r.user_id) === String(currentReqId)) ||
                              (r.id &&
                                currentReqId &&
                                String(r.id) === String(currentReqId)),
                          );

                          if (!requester || !requester.department_id)
                            return true;

                          // Show staff from the same department, excluding the requester
                          return (
                            String(s.department_id) ===
                            String(requester.department_id) &&
                            String(s.id) !== String(requester.id)
                          );
                        })
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.department_name})
                          </option>
                        ))}
                    </select>
                  </div>
                  {(canApprove || item?.status) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Status
                      </label>
                      <select
                        name="status"
                        defaultValue={item?.status || "Pending"}
                        disabled={isViewOnly || !canApprove}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  )}
                  {isStaff && !canApprove && !item?.status && (
                    <input type="hidden" name="status" value="Pending" />
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Leave Type
                    </label>
                    <select
                      name="leave_type"
                      defaultValue={item?.leave_type}
                      required
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                    >
                      <option value="">Select Type...</option>
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Maternity Leave">Maternity Leave</option>
                      <option value="Paternity Leave">Paternity Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        defaultValue={
                          item?.start_date
                            ? new Date(item.start_date)
                              .toISOString()
                              .split("T")[0]
                            : ""
                        }
                        required
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        defaultValue={
                          item?.end_date
                            ? new Date(item.end_date)
                              .toISOString()
                              .split("T")[0]
                            : ""
                        }
                        required
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Reason
                    </label>
                    <textarea
                      name="reason"
                      defaultValue={item?.reason}
                      rows={3}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Leave Defaults
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Configure global leave settings for all staff members.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  onUpdateOrganization?.({
                    default_leave_limit: parseInt(
                      formData.get("default_leave_limit") as string,
                    ),
                    default_leave_limit_unit: formData.get(
                      "default_leave_limit_unit",
                    ) as string,
                  });
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                      Default Annual Limit
                    </label>
                    <input
                      type="number"
                      name="default_leave_limit"
                      defaultValue={organization?.default_leave_limit || 20}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                      Leave Unit
                    </label>
                    <select
                      name="default_leave_limit_unit"
                      defaultValue={
                        organization?.default_leave_limit_unit || "Days"
                      }
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={() => onResetBalances?.()}
          title={t('year_reset')}
          message={t('reset_confirm_msg')}
          confirmText={t('reset_confirm_btn')}
          type="warning"
        />
      </div>
    );
  },
  Payroll: ({
    role,
    data = [],
    staffList = [],
    platformUsers = [],
    currentUser,
    organization,
    onSave,
    onDelete,
    onRunPayroll,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    platformUsers?: any[];
    currentUser?: any;
    organization?: any;
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    onRunPayroll?: (monthYear: string, staffIds?: string[]) => void;
  }) => {
    const { currency, t } = useLanguage();
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [showSalary, setShowSalary] = useState(false);
    const [viewMode, setViewMode] = useState<'admin' | 'self'>(role === 'STAFF' ? 'self' : 'admin');
    const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);
    const [runMonth, setRunMonth] = useState(`${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

    // Combine staff and platform users who should be eligible for payroll
    const eligiblePayrollUsers = useMemo(() => {
      // Start with staff list
      const staffMap = new Map(staffList.map(s => [s.email?.toLowerCase(), s]));
      const combined = [...staffList];

      // Add users from platformUsers who aren't already in staffList and aren't students/parents
      platformUsers.forEach(user => {
        const userEmail = user.email?.toLowerCase();
        if (!staffMap.has(userEmail) && user.role !== 'STUDENT' && user.role !== 'PARENT' && user.role !== 'PARTNER') {
          combined.push({
            id: user.id, 
            name: user.name,
            email: user.email,
            role: user.role,
            status: 'Active',
            is_external_admin: true
          });
        }
      });
      return combined;
    }, [staffList, platformUsers]);

    const handlePrintPayslip = (item: any) => {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Payslip - ${item.name} - ${item.month}</title>
              <style>
                body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
                .container { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 40px; border-radius: 12px; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { max-height: 60px; }
                .school-info h1 { font-size: 20px; font-weight: 800; margin: 0; color: #1e1b4b; }
                .school-info p { font-size: 12px; color: #6b7280; margin: 2px 0; }
                .payslip-title { text-align: center; margin-bottom: 30px; }
                .payslip-title h2 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
                .payslip-title p { font-size: 14px; color: #6b7280; font-weight: 600; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 10px; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px; }
                .info-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .info-label { font-weight: 600; color: #4b5563; }
                .info-value { font-weight: 700; color: #111827; }
                .total-row { display: flex; justify-content: space-between; padding: 15px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
                .total-label { font-size: 16px; font-weight: 800; }
                .total-value { font-size: 18px; font-weight: 900; color: #4f46e5; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
                .signature-box { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; width: 200px; }
                .signature-img { max-height: 50px; margin-bottom: 5px; }
                @media print { body { padding: 0; } .container { border: none; } }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="school-info">
                    <h1>${organization?.name || "School Management System"}</h1>
                    <p>${organization?.support_email || ""}</p>
                    <p>${organization?.address || ""}</p>
                  </div>
                  ${organization?.logo ? `<img src="${organization.logo}" class="logo" alt="Logo" />` : ""}
                </div>

                <div class="payslip-title">
                  <h2>${t('pay_advice')}</h2>
                  <p>${t('period_for')} ${item.month}</p>
                </div>

                <div class="grid">
                  <div>
                    <div class="section-title">${t('employee_information')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('full_name')}:</span>
                      <span class="info-value">${item.name}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">${t('employee_id')}:</span>
                      <span class="info-value">${String(item.id).slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div class="section-title">${t('payment_details')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('date')}:</span>
                      <span class="info-value">${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">${t('status')}:</span>
                      <span class="info-value" style="color: ${item.status === "Paid" ? "#059669" : "#d97706"}">${item.status}</span>
                    </div>
                  </div>
                </div>

                <div class="grid">
                  <div>
                    <div class="section-title">${t('earnings')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('basic_salary')}:</span>
                      <span class="info-value">${currency}${Number(item.salary || 0).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">${t('allowances')}:</span>
                      <span class="info-value">${currency}${Number(item.allowance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div class="section-title">${t('deductions')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('total_deductions') || t('deductions')}:</span>
                      <span class="info-value">${currency}${Number(item.deductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div class="total-row">
                  <span class="total-label">${t('net_salary_payout')}:</span>
                  <span class="total-value">${currency}${Number(item.net || 0).toLocaleString()}</span>
                </div>

                <div class="footer">
                  <div>
                    <p style="font-size: 10px; color: #9ca3af; font-weight: bold; text-transform: uppercase;">System Generated Document</p>
                  </div>
                  <div class="signature-box">
                    ${organization?.signature ? `<img src="${organization.signature}" class="signature-img" />` : '<div style="height: 50px;"></div>'}
                    <p style="font-size: 12px; font-weight: 800; margin: 0;">${t('authorized_signature')}</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    // Map backend data (from /hr/payroll) into UI-friendly rows
    const mappedData = (
      data && data.length > 0
        ? data.map((item: any) => ({
          id: item.id,
          name: item.name,
          salary: item.basic_salary,
          allowance: item.allowances,
          deductions: item.deductions,
          net: item.net_salary,
          status: item.status,
          month: item.month_year,
        }))
        : []
    ) as any[];

    // Group data for summary
    const months = Array.from(new Set(mappedData.map((p) => p.month))).filter(
      Boolean,
    );
    const summaryData = months.map((m) => {
      const monthStaff = mappedData.filter((p) => p.month === m);
      return {
        id: m,
        month: m,
        staffCount: monthStaff.length,
        totalNet: monthStaff.reduce(
          (sum, p) => sum + parseFloat(p.net || 0),
          0,
        ),
      };
    });

    const isSelfView = role === "STAFF" || viewMode === 'self';
    const staffName = currentUser ? currentUser.name : "";

    if (isSelfView) {
      // Staff view (existing or simplified)
      const myPayroll = mappedData.filter((p) => p.name === staffName);
      return (
        <div className="space-y-6">
          {role === 'SCHOOL_ADMIN' && (
            <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 w-fit rounded-xl mb-4">
              <button 
                onClick={() => setViewMode('admin')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  viewMode === 'admin' ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600" : "text-zinc-500"
                )}
              >
                Manage Staff
              </button>
              <button 
                onClick={() => setViewMode('self')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  viewMode === 'self' ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600" : "text-zinc-500"
                )}
              >
                My Self Service
              </button>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setShowSalary(!showSalary)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              {showSalary ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showSalary ? t('hide_salaries') : t('view_salaries')}
            </button>
          </div>
          <DataTable
            title={t('my_payroll_salary')}
            data={myPayroll}
            onView={(item) => handlePrintPayslip(item)}
            columns={[
              { header: "Month", accessor: "month", className: "font-bold" },
              {
                header: "Basic Salary",
                accessor: (item: any) =>
                  showSalary
                    ? `${currency}${Number(item.salary).toLocaleString()}`
                    : `${currency}xxxxxx`,
              },
              {
                header: "Allowance",
                accessor: (item: any) =>
                  showSalary
                    ? `${currency}${Number(item.allowance).toLocaleString()}`
                    : `${currency}xxxxxx`,
              },
              {
                header: "Deductions",
                accessor: (item: any) =>
                  showSalary
                    ? `${currency}${Number(item.deductions).toLocaleString()}`
                    : `${currency}xxxxxx`,
              },
              {
                header: "Net Salary",
                accessor: (item: any) =>
                  showSalary
                    ? `${currency}${Number(item.net).toLocaleString()}`
                    : `${currency}xxxxxx`,
                className: "font-bold text-indigo-600",
              },
              {
                header: "Payslip",
                accessor: (item: any) => (
                  <button
                    onClick={() => handlePrintPayslip(item)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                ),
              },
            ]}
          />
        </div>
      );
    }

    if (!selectedMonth) {
      return (
        <div className="space-y-6">
          {role === 'SCHOOL_ADMIN' && (
            <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 w-fit rounded-xl">
              <button 
                onClick={() => setViewMode('admin')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  viewMode === 'admin' ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600" : "text-zinc-500"
                )}
              >
                Manage Staff
              </button>
              <button 
                onClick={() => setViewMode('self')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  viewMode === 'self' ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600" : "text-zinc-500"
                )}
              >
                My Self Service
              </button>
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {t('staff_payroll')}
                </h2>
                <p className="text-sm text-zinc-500">
                  {t('manage_view_records')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRunPayrollModalOpen(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Zap className="w-4 h-4" />
              {t('run_payroll')}
            </button>
          </div>

          {/* Run Payroll Modal */}
          <Modal
            isOpen={isRunPayrollModalOpen}
            onClose={() => setIsRunPayrollModalOpen(false)}
            title={t('run_payroll')}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Target Month / Year</label>
                <input 
                  type="text" 
                  value={runMonth}
                  onChange={(e) => setRunMonth(e.target.value)}
                  placeholder="e.g. May 2026"
                  className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Select Personnel (Leave empty for all active staff)</label>
                <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 space-y-1">
                  {eligiblePayrollUsers.filter(s => s.status === 'Active').map(person => (
                    <label key={person.id} className="flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors group">
                      <input 
                        type="checkbox"
                        checked={selectedStaffIds.includes(person.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaffIds([...selectedStaffIds, person.id]);
                          } else {
                            setSelectedStaffIds(selectedStaffIds.filter(id => id !== person.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">{person.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400 uppercase font-medium">{person.role}</span>
                          {person.department_name && <span className="text-[10px] text-zinc-300">•</span>}
                          {person.department_name && <span className="text-[10px] text-zinc-400 uppercase font-medium">{person.department_name}</span>}
                          {person.is_external_admin && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black rounded uppercase tracking-tighter">Admin Account</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 italic mt-2 pl-1">
                  * Only personnel with defined salaries in the system will be processed.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onRunPayroll?.(runMonth, selectedStaffIds);
                    setIsRunPayrollModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                  Generate Payroll Records
                </button>
              </div>
            </div>
          </Modal>

          <DataTable
            title={t('payroll_history')}
            data={summaryData}
            onView={(item: any) => setSelectedMonth(item.month)}
            autoModal={false}
            columns={[
              {
                header: "Month / Year",
                accessor: "month",
                className: "font-bold",
              },
              { header: "Staff Count", accessor: "staffCount" },
              {
                header: "Total Net Payout",
                accessor: (item: any) => (
                  <span className="font-bold text-emerald-600">
                    {currency}{item.totalNet.toLocaleString()}
                  </span>
                ),
              },
              {
                header: "Status",
                accessor: () => (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                    Processed
                  </span>
                ),
              },
            ]}
          />
        </div>
      );
    }

    // DETAIL VIEW
    const filteredData = mappedData.filter((p) => p.month === selectedMonth);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMonth("")}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                View Staff Records
              </h2>
              <p className="text-sm text-zinc-500">
                {selectedMonth} — {filteredData.length} records found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                (window as any).showToast?.(
                  `Generating PDF report for ${selectedMonth}...`,
                  "success",
                )
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Download className="w-4 h-4" />
              {t('download_report')}
            </button>
          </div>
        </div>

        <DataTable
          title={t('staff_records')}
          data={filteredData}
          onSave={onSave}
          onView={(item) => handlePrintPayslip(item)}
          columns={[
            { header: "Staff Name", accessor: "name", className: "font-bold" },
            {
              header: "Basic Salary",
              accessor: (item: any) =>
                item.salary ? (
                  `${currency}${Number(item.salary).toLocaleString()}`
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
            {
              header: "Allowance",
              accessor: (item: any) =>
                item.allowance ? (
                  `${currency}${Number(item.allowance).toLocaleString()}`
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
            {
              header: "Deductions",
              accessor: (item: any) =>
                item.deductions ? (
                  `${currency}${Number(item.deductions).toLocaleString()}`
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
            {
              header: "Net Salary",
              accessor: (item: any) =>
                item.net ? `${currency}${Number(item.net).toLocaleString()}` : `${currency}0`,
              className: "font-bold text-indigo-600",
            },
            {
              header: "Status",
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Paid"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600",
                  )}
                >
                  {t(item.status?.toLowerCase() || 'pending')}
                </span>
              ),
            },
            {
              header: "Payslip",
              accessor: (item: any) => (
                <button
                  onClick={() => handlePrintPayslip(item)}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
              ),
            },
          ]}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              {!item && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Staff Member
                    </label>
                    <select
                      name="staff_id"
                      required
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    >
                      <option value="">Select Staff...</option>
                      {(staffList || []).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Month/Year
                    </label>
                    <input
                      type="text"
                      name="month_year"
                      defaultValue={selectedMonth}
                      placeholder="e.g. March 2026"
                      required
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={item?.status || "Pending"}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Basic Salary ({currency})
                  </label>
                  <input
                    type="number"
                    name="basic_salary"
                    defaultValue={item?.salary}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Allowance ({currency})
                  </label>
                  <input
                    type="number"
                    name="allowances"
                    defaultValue={item?.allowance}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Deductions ({currency})
                  </label>
                  <input
                    type="number"
                    name="deductions"
                    defaultValue={item?.deductions}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Net Salary ({currency})
                  </label>
                  <input
                    type="text"
                    defaultValue={
                      item?.net
                        ? `${currency}${Number(item.net).toLocaleString()}`
                        : `${currency}0`
                    }
                    disabled
                    className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-sm font-bold text-indigo-600 opacity-70"
                  />
                </div>
              </div>
            </div>
          )}
        />
      </div>
    );
  },
  Performance: ({
    data,
    role,
    staffList = [],
    onSave,
    onDelete,
  }: {
    data?: any[];
    role?: UserRole;
    staffList?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const [isAddingReview, setIsAddingReview] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    const stats = useMemo(() => {
      const records = data || [];
      if (records.length === 0) return null;

      const avgAppraisal = records.reduce((acc, r) => acc + (Number(r.appraisal_score) || 0), 0) / records.length;
      const avgLessonNote = records.reduce((acc, r) => acc + (Number(r.lesson_note_avg) || 0), 0) / records.length;

      const deptScores: Record<string, { total: number, count: number }> = {};
      records.forEach(r => {
        if (!r.department_name) return;
        if (!deptScores[r.department_name]) deptScores[r.department_name] = { total: 0, count: 0 };
        deptScores[r.department_name].total += (Number(r.appraisal_score) || 0);
        deptScores[r.department_name].count++;
      });

      let topDept = "N/A";
      let topScore = -1;
      Object.entries(deptScores).forEach(([name, s]) => {
        const avg = s.total / s.count;
        if (avg > topScore) {
          topScore = avg;
          topDept = name;
        }
      });

      return { avgAppraisal, avgLessonNote, topDept };
    }, [data]);

    return (
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-24 h-24 text-indigo-600" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('avg_appraisal')}</p>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{stats.avgAppraisal.toFixed(1)}%</h3>
                </div>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${stats.avgAppraisal}%` }} />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="w-24 h-24 text-emerald-600" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('lesson_note_avg')}</p>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{stats.avgLessonNote.toFixed(1)}%</h3>
                </div>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${stats.avgLessonNote}%` }} />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Star className="w-24 h-24 text-amber-600" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('top_department')}</p>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white truncate" title={stats.topDept}>{stats.topDept}</h3>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">{t('based_on_current_scores')}</p>
            </div>
          </div>
        )}
        <DataTable
          title={t('staff_performance')}
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          onView={() => { }}
          onAdd={() => setIsAddingReview(true)}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('staff_name')}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={item?.name}
                  disabled={true}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('appraisal_score')}
                  </label>
                  <input
                    type="number"
                    name="score"
                    defaultValue={item?.appraisal_score}
                    disabled={isViewOnly}
                    placeholder="e.g. 85"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Appraisal Review
                </label>
                <textarea
                  name="comments"
                  defaultValue={item?.appraisal_review}
                  disabled={isViewOnly}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
            </div>
          )}
          columns={[
            {
              header: "Staff Name",
              accessor: (item: any) => item.name,
              className: "font-bold",
            },
            {
              header: "Department",
              accessor: (item: any) => item.department_name,
            },
            {
              header: "Lesson Note Avg",
              accessor: (item: any) =>
                item.lesson_note_avg ? (
                  <span className="font-bold text-indigo-600">
                    {Number(item.lesson_note_avg).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-zinc-400">—</span>
                ),
            },
            {
              header: "Appraisal Score",
              accessor: (item: any) =>
                item.appraisal_score ? (
                  <span className="font-bold text-amber-600">
                    {item.appraisal_score}%
                  </span>
                ) : (
                  <span className="text-zinc-400">—</span>
                ),
            },
            {
              header: "Latest Review",
              accessor: (item: any) =>
                item.appraisal_review || (
                  <span className="text-zinc-400">{t('no_review')}</span>
                ),
            },
            {
              header: "Date",
              accessor: (item: any) =>
                item.last_review_date ? (
                  new Date(item.last_review_date).toLocaleDateString()
                ) : (
                  <span className="text-zinc-400">—</span>
                ),
            },
          ]}
        />
        <Modal
          isOpen={isAddingReview}
          onClose={() => {
            setIsAddingReview(false);
            setSelectedStaff(null);
          }}
          title={t('add_performance_review')}
        >
          <form
            className="space-y-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onSave?.({
                staff_id: formData.get("staff_id"),
                score: Number(formData.get("score")),
                comments: formData.get("comments"),
              });
              setIsAddingReview(false);
              setSelectedStaff(null);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Select Staff Member
              </label>
              <select
                name="staff_id"
                required
                value={selectedStaff || ""}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="">{t('choose_placeholder')}</option>
                {(staffList || []).map((staff: any) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.department_name})
                  </option>
                ))}
              </select>
            </div>

            {selectedStaff && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                    {t('current_lesson_note_avg')}:
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    {Number(
                      (data || []).find((s: any) => s.id === selectedStaff)
                        ?.lesson_note_avg || 0,
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Appraisal Score (%)
              </label>
              <input
                type="number"
                name="score"
                required
                min="0"
                max="100"
                placeholder="e.g. 85"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Review Comments
              </label>
              <textarea
                name="comments"
                required
                rows={4}
                placeholder={t('feedback')}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddingReview(false);
                  setSelectedStaff(null);
                }}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {t('submit_review')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  TeachersOnDuty: ({
    role,
    data = [],
    staffList = [],
    currentStaff,
    onSave,
    onDelete,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    currentStaff?: any;
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const isStaff = role === "STAFF";
    const canManage = role === "SCHOOL_ADMIN" || role === "HR";
    const [view, setView] = useState<"table" | "week" | "month">("table");
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrev = () => {
      const newDate = new Date(currentDate);
      if (view === "week") newDate.setDate(newDate.getDate() - 7);
      else if (view === "month") newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    };

    const handleNext = () => {
      const newDate = new Date(currentDate);
      if (view === "week") newDate.setDate(newDate.getDate() + 7);
      else if (view === "month") newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    };

    const getWeekDays = (date: Date) => {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    };

    const getMonthDays = (date: Date) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const days = [];
      const startDay = start.getDay();

      // Prefix with empty days from prev month
      for (let i = 0; i < startDay; i++) days.push(null);

      for (let i = 1; i <= end.getDate(); i++) {
        days.push(new Date(date.getFullYear(), date.getMonth(), i));
      }
      return days;
    };

    const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === "table"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              <List className="w-4 h-4" />
              {t('table')}
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === "week"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              {t('weekly')}
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === "month"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              <CalendarDays className="w-4 h-4" />
              {t('monthly')}
            </button>
          </div>

          {view !== "table" && (
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-lg min-w-[150px] text-center capitalize">
                {view === "week"
                  ? `Week of ${getWeekDays(currentDate)[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                  : currentDate.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
              </h3>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {view === "table" ? (
          <DataTable
            title={t('teachers_on_duty_list')}
            data={
              isStaff && currentStaff
                ? data.filter((d) => d.teacher_id === currentStaff.id)
                : data
            }
            onSave={onSave}
            onDelete={isStaff ? undefined : onDelete}
            onEdit={canManage ? () => { } : undefined}
            onView={() => { }}
            columns={[
              ...(!isStaff
                ? [
                  {
                    header: "Teacher",
                    accessor: (item: any) => item.teacher_name,
                    className: "font-bold",
                  },
                ]
                : []),
              {
                header: "Date",
                accessor: (item: any) =>
                  item.date ? new Date(item.date).toLocaleDateString() : "N/A",
              },
              { header: "Shift", accessor: (item: any) => item.shift },
            ]}
            onAdd={canManage ? () => { } : undefined}
            renderForm={
              canManage
                ? (item, isViewOnly) => (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Teacher
                      </label>
                      <select
                        name="teacher_id"
                        defaultValue={item?.teacher_id || ""}
                        required
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="">Select Teacher...</option>
                        {(staffList || []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">
                          Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          defaultValue={
                            item?.date
                              ? new Date(item.date)
                                .toISOString()
                                .split("T")[0]
                              : ""
                          }
                          required
                          disabled={isViewOnly}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">
                          Shift
                        </label>
                        <select
                          name="shift"
                          defaultValue={item?.shift || "Morning"}
                          disabled={isViewOnly}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="Morning">{t('morning')}</option>
                          <option value="Afternoon">{t('afternoon')}</option>
                          <option value="Evening">{t('evening')}</option>
                          <option value="Full Day">{t('full_day')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
                : undefined
            }
          />
        ) : view === "week" ? (
          <div className="grid grid-cols-7 gap-4">
            {getWeekDays(currentDate).map((day, idx) => {
              const dayAssigned = data.filter(
                (d) => formatDateKey(new Date(d.date)) === formatDateKey(day),
              );
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[150px]"
                >
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <p className="text-xl font-bold mb-3">{day.getDate()}</p>
                  <div className="space-y-2">
                    {dayAssigned.length > 0 ? (
                      dayAssigned.map((a, i) => (
                        <div
                          key={i}
                          className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50"
                        >
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            {a.teacher_name}
                          </p>
                          <p className="text-[10px] text-indigo-400">
                            {a.shift}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-zinc-400 italic">
                        No duty
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                {d}
              </div>
            ))}
            {getMonthDays(currentDate).map((day, idx) => {
              if (!day)
                return (
                  <div
                    key={idx}
                    className="aspect-square bg-zinc-50/50 dark:bg-zinc-800/10 rounded-2xl"
                  />
                );
              const dayAssigned = data.filter(
                (d) => formatDateKey(new Date(d.date)) === formatDateKey(day),
              );
              const isToday = formatDateKey(new Date()) === formatDateKey(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "aspect-square p-2 bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm transition-all hover:border-indigo-300 relative group",
                    isToday
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-zinc-200 dark:border-zinc-800",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full mb-1",
                      isToday
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-900 dark:text-white",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                    {dayAssigned.map((a, i) => (
                      <div
                        key={i}
                        className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800/50"
                      >
                        <p className="text-[9px] font-bold text-indigo-600 truncate">
                          {a.teacher_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },

  RolesAndPermissions: () =>
    // Replaced by RolesPermissions or handled above
    null,

  ExitManagement: ({
    role,
    data,
    onSave,
    onDelete,
    staffList,
    onFetchLetter,
    organization,
    documentTemplates,
    onRefreshTemplates,
  }: {
    role?: UserRole;
    data?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    staffList?: any[];
    onFetchLetter?: (id: string) => Promise<any>;
    organization?: any;
    documentTemplates?: any[];
    onRefreshTemplates?: () => Promise<void>;
  }) => {
    const { currency, t } = useLanguage();
    const [viewingLetter, setViewingLetter] = useState<any | null>(null);
    const [editableLetter, setEditableLetter] = useState("");
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);

    const handleFetchLetter = async (id: string) => {
      if (onFetchLetter) {
        try {
          const res = await onFetchLetter(id);
          setViewingLetter(res);
          setEditableLetter(res.letter);
        } catch (err) {
          console.error("Failed to fetch letter:", err);
        }
      }
    };

    const handlePrint = () => {
      const template = (documentTemplates || [])
        .filter((t) => t.type === "ExitLetter")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        let printHtml = "";

        if (template) {
          const config = template.layout_config || {};
          let body = config.content || editableLetter || "";

          const replacements: Record<string, string> = {
            "{{staff_name}}": viewingLetter?.staff_name || "Staff Name",
            "{{exit_date}}": viewingLetter?.exit_date
              ? new Date(viewingLetter.exit_date).toLocaleDateString()
              : "N/A",
            "{{reason}}": viewingLetter?.reason || "N/A",
            "{{school_name}}": organization?.name || "The School",
            "{{school_logo}}": organization?.logo
              ? `<img src="${organization.logo}" style="max-height: 80px; display: block; margin: 0 auto;" alt="Logo" />`
              : "",
            "{{principal_signature}}": organization?.signature
              ? `<img src="${organization.signature}" style="max-height: 50px;" alt="Signature" />`
              : "",
          };

          Object.entries(replacements).forEach(([key, value]) => {
            body = body.split(key).join(value);
          });

          printHtml = `
            <html>
              <head>
                <title>Exit Letter</title>
                <style>
                  body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                  .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                  .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }
                  ${config.styles || ""}
                </style>
              </head>
              <body>
                <div class="header">${config.headerText || ""}</div>
                <div class="letter-body">${body}</div>
                <div class="footer">${config.footerText || ""}</div>
              </body>
            </html>
          `;
        } else {
          // Standard Fallback
          printHtml = `
            <html>
              <head>
                <title>Exit Letter</title>
                <style>
                  body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                  .header { display: flex; flex-direction: column; align-items: center; text-align: center; border-bottom: 2px solid #eee; margin-bottom: 40px; padding-bottom: 20px; }
                  .logo { max-height: 100px; margin-bottom: 10px; }
                  .school-name { font-size: 24px; font-bold; color: #1e1b4b; margin: 0; }
                  .school-info { font-size: 12px; color: #666; margin: 2px 0; }
                  .letter-body { white-space: pre-wrap; font-size: 16px; min-height: 400px; }
                  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
                  .signature-box { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
                  .signature-img { max-height: 60px; object-fit: contain; }
                  .signatory-name { font-weight: bold; margin: 0; }
                  .signatory-title { font-size: 14px; color: #444; margin: 0; }
                  @media print { body { padding: 0; } .header { margin-top: 20px; } }
                </style>
              </head>
              <body>
                <div class="header">
                  ${organization?.logo ? `<img src="${organization.logo}" class="logo" alt="Logo" />` : ""}
                  <h1 class="school-name">${organization?.name || "School Exit Letter"}</h1>
                  <p class="school-info">${organization?.support_email || ""}</p>
                </div>

                <div class="letter-body">${editableLetter}</div>

                <div class="footer">
                  <div class="signature-box">
                    <p>${t('sincerely')},</p>
                    ${organization?.signature ? `<img src="${organization.signature}" class="signature-img" alt="Signature" />` : '<div style="height: 60px;"></div>'}
                    <p class="signatory-name">${t('the_principal')}</p>
                    <p class="signatory-title">${organization?.name || "School Administration"}</p>
                  </div>
                </div>
              </body>
            </html>
          `;
        }

        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.print();
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setIsDesignerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Palette className="w-4 h-4" />
            Design Exit Letter Template
          </button>
        </div>
        <DataTable
          title="Exit Management"
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          onView={() => { }}
          onEdit={() => { }}
          columns={[
            {
              header: "Staff Name",
              accessor: (item: any) => item.staff_name,
              className: "font-bold",
            },
            {
              header: t('exit_date'),
              accessor: (item: any) =>
                item.exit_date
                  ? new Date(item.exit_date).toLocaleDateString()
                  : "N/A",
            },
            { header: t('reason'), accessor: (item: any) => item.reason },
            {
              header: t('status'),
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Completed"
                      ? "bg-emerald-50 text-emerald-600"
                      : item.status === "Pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600",
                  )}
                >
                  {t(item.status?.toLowerCase().replace(' ', '_') || 'pending')}
                </span>
              ),
            },
            {
              header: "Actions",
              accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFetchLetter(item.id)}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t('letter')}
                  </button>
                  {item.status !== "Completed" && onSave && (
                    <button
                      onClick={() => onSave({ ...item, status: "Completed" })}
                      className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('approve_action')}
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          onAdd={onSave ? () => { } : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('staff')}
                </label>
                <select
                  name="staff_id"
                  defaultValue={item?.staff_id || ""}
                  required
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">{t('select_staff_placeholder')}</option>
                  {(staffList || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('exit_date')}
                </label>
                <input
                  type="date"
                  name="exit_date"
                  defaultValue={
                    item?.exit_date
                      ? new Date(item.exit_date).toISOString().split("T")[0]
                      : ""
                  }
                  required
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('reason')}
                </label>
                <select
                  name="reason"
                  defaultValue={item?.reason || "Resignation"}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="Resignation">{t('resignation')}</option>
                  <option value="Retirement">{t('retirement')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={item?.status || "Pending"}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="Pending">{t('pending_clearance')}</option>
                  <option value="Completed">{t('completed')}</option>
                  <option value="Cancelled">{t('cancelled')}</option>
                </select>
              </div>
            </div>
          )}
        />

        <Modal
          isOpen={!!viewingLetter}
          onClose={() => setViewingLetter(null)}
          title={t('exit_letter_preview')}
        >
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {t('letter_content_editable')}
              </label>
              <textarea
                value={editableLetter}
                onChange={(e) => setEditableLetter(e.target.value)}
                className="w-full h-[400px] p-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-serif leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setViewingLetter(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('close')}
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('print_letter')}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDesignerOpen}
          onClose={() => setIsDesignerOpen(false)}
          title={t('exit_letter_designer')}
          maxWidth="max-w-5xl"
          maxHeight="max-h-[90vh]"
        >
          <div className="p-6">
            <DocumentBuilder
              data={documentTemplates}
              onRefresh={onRefreshTemplates}
              organization={organization}
              lockedType="ExitLetter"
              hideTypeSelect={true}
            />
          </div>
        </Modal>
      </div>
    );
  },
  ParentManagement: ({
    students = [],
    onSave,
  }: {
    students?: Student[];
    onSave?: (data: any) => void;
  }) => {
    const { currency, t } = useLanguage();
    const [viewingStudent, setViewingStudent] = React.useState<Student | null>(null);
    const [viewMode, setViewMode] = React.useState<'list' | 'graphical'>('graphical');

    const parentsMap = React.useMemo(() => {
      const map = new Map<string, { name: string; email: string; contact: string; children: Student[] }>();
      students.forEach(s => {
        // Use contact (phone) as primary key for linking families, fallback to email
        const key = s.contact || s.parent_email || 'unknown-parent';
        
        if (!map.has(key)) {
          map.set(key, {
            name: s.parent_name || 'Unknown Parent',
            email: s.parent_email || 'N/A',
            contact: s.contact || 'N/A',
            children: []
          });
        }
        map.get(key)!.children.push(s);
      });
      return Array.from(map.values());
    }, [students]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{t('parent_management')}</h2>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Visualize family relationships & manage profiles</p>
          </div>
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
        </div>

        {viewMode === 'list' ? (
          <DataTable
            title=""
            data={students}
            onSave={onSave}
            columns={[
              { header: t('student'), accessor: "name", className: "font-bold" },
              { header: t('class'), accessor: (item: any) => `${item.class || 'N/A'} ${item.section || ''}` },
              {
                header: t('primary_parent'),
                accessor: (item: any) => (
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{item.parent_name || 'N/A'}</span>
                    <span className="text-[10px] text-zinc-500">{item.contact || 'N/A'}</span>
                  </div>
                )
              },
              {
                header: t('secondary_parent'),
                accessor: (item: any) => (
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{item.secondary_parent_name || 'N/A'}</span>
                    <span className="text-[10px] text-zinc-500">{item.secondary_parent_contact || 'N/A'}</span>
                  </div>
                )
              },
            ]}
            onView={(item) => setViewingStudent(item)}
            renderForm={(item) => (
              <div className="space-y-8 max-h-[70vh] overflow-y-auto px-1">
                {/* Hidden fields to ensure data integrity */}
                <input type="hidden" name="id" defaultValue={item?.id} />
                <input type="hidden" name="name" defaultValue={item?.name} />
                
                {/* Primary Parent section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2 flex items-center gap-2">
                    <UserCircle className="w-3.5 h-3.5" />
                    Primary Parent / Guardian
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">{t('full_name')}</label>
                      <input
                        type="text"
                        name="parent_name"
                        defaultValue={item?.parent_name}
                        required
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">{t('contact_number')}</label>
                      <input
                        type="text"
                        name="contact"
                        defaultValue={item?.contact}
                        required
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{t('email')}</label>
                    <input
                      type="email"
                      name="parent_email"
                      defaultValue={item?.parent_email}
                      placeholder="Enter parent email..."
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Secondary Parent section */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100 pb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Secondary Parent / Guardian
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Secondary Parent Name</label>
                      <input
                        type="text"
                        name="secondary_parent_name"
                        defaultValue={item?.secondary_parent_name}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Secondary Parent Contact</label>
                      <input
                        type="text"
                        name="secondary_parent_contact"
                        defaultValue={item?.secondary_parent_contact}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Secondary Parent Email</label>
                    <input
                      type="email"
                      name="secondary_parent_email"
                      defaultValue={item?.secondary_parent_email}
                      placeholder="Enter secondary parent email..."
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Additional Information</h4>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{t('religion')}</label>
                    <select
                      name="religion"
                      defaultValue={item?.religion || ""}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Religion...</option>
                      <option value="Christianity">Christianity</option>
                      <option value="Islam">Islam</option>
                      <option value="Hinduism">Hinduism</option>
                      <option value="Buddhism">Buddhism</option>
                      <option value="Sikhism">Sikhism</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {parentsMap.map((parent) => (
              <div 
                key={parent.email}
                className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none p-6 space-y-6 hover:border-indigo-500 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Parent Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate max-w-[150px]">
                        {parent.name}
                      </h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[150px]">
                        {parent.email}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full text-[10px] font-black uppercase">
                    {parent.children.length} {parent.children.length === 1 ? 'Ward' : 'Wards'}
                  </div>
                </div>

                {/* Contact Line */}
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  {parent.contact}
                </div>

                {/* Children Connection Visualization */}
                <div className="space-y-3 relative pt-2">
                  <div className="absolute left-[27px] top-0 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500/20 to-transparent" />
                  
                  {parent.children.map((child, idx) => (
                    <div key={child.id} className="flex items-center gap-4 pl-2 group/child">
                      <div className="relative z-10">
                        <div className="absolute top-1/2 -left-2 w-4 h-0.5 bg-indigo-500/20" />
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover/child:border-indigo-500 group-hover/child:text-indigo-600 transition-all shadow-sm">
                          {child.profile_pic ? (
                            <img src={child.profile_pic} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase truncate">
                          {child.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">
                            {child.class} {child.section}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-zinc-300" />
                          <span className="text-[9px] font-black text-indigo-500 uppercase italic">
                            GPA: {child.gpa || '—'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setViewingStudent(child)}
                        className="p-2 opacity-0 group-hover:opacity-100 group-hover/child:opacity-100 transition-opacity hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-600"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          title={t('edit_parent_ward_details')}
        >
          {viewingStudent && (
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const values: any = {};
                formData.forEach((value, key) => {
                  values[key] = value;
                });
                // Merge with existing student data
                await onSave?.({ ...viewingStudent, ...values });
                setViewingStudent(null);
              }}
              className="p-6 space-y-8 max-h-[85vh] overflow-y-auto"
            >
              {/* Hidden Fields */}
              <input type="hidden" name="id" value={viewingStudent.id} />
              <input type="hidden" name="name" value={viewingStudent.name} />

              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                  {viewingStudent.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewingStudent.name}</h3>
                  <p className="text-sm text-zinc-500">{viewingStudent.class} | {viewingStudent.admission_no || viewingStudent.admissionNo}</p>
                </div>
              </div>

              {/* Primary Parent Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  Primary Parent / Guardian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 pl-1">{t('full_name')}</label>
                    <input
                      type="text"
                      name="parent_name"
                      defaultValue={viewingStudent.parent_name}
                      required
                      className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 pl-1">{t('contact_number')}</label>
                    <input
                      type="text"
                      name="contact"
                      defaultValue={viewingStudent.contact}
                      required
                      className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 pl-1">{t('email')}</label>
                    <input
                      type="email"
                      name="parent_email"
                      defaultValue={viewingStudent.parent_email}
                      className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Parent Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Secondary Parent / Guardian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 pl-1">{t('full_name')}</label>
                    <input
                      type="text"
                      name="secondary_parent_name"
                      defaultValue={viewingStudent.secondary_parent_name}
                      className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 pl-1">{t('contact_number')}</label>
                    <input
                      type="text"
                      name="secondary_parent_contact"
                      defaultValue={viewingStudent.secondary_parent_contact}
                      className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 pl-1">{t('email')}</label>
                    <input
                      type="email"
                      name="secondary_parent_email"
                      defaultValue={viewingStudent.secondary_parent_email}
                      className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Additional Information
                </h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400 pl-1">{t('religion')}</label>
                  <select
                    name="religion"
                    defaultValue={viewingStudent.religion || ""}
                    className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Religion...</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Islam">Islam</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Sikhism">Sikhism</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-zinc-900 pb-2">
                <button
                  type="button"
                  onClick={() => setViewingStudent(null)}
                  className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  {t('save_changes')}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    );
  },
};
