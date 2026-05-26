import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, File, Trash2, Download, Plus, X, Zap, Globe, Users, Video, Calendar,
  FileText, Bot, Settings, ChevronRight, TrendingUp, ClipboardCheck, Search,
  Layers, GraduationCap, BookOpen, Clock, Building2, User, Layout as LayoutIcon,
  Printer, ChevronLeft, ArrowLeft, MoreVertical, Edit2, ChevronDown, Award, Eye,
  CheckCircle2, AlertCircle, XCircle, Fingerprint, Camera, Loader2, ArrowRightCircle,
  FileSpreadsheet, ShieldCheck, Mail, Phone, Briefcase, UserCheck, UserMinus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { Student, UserRole, Ward } from '../../types';
import { GenericModuleView } from '../ModuleViews';
import { JitsiVideoCall } from '../JitsiVideoCall';
import { Modal, SearchableSelect } from '../UI';
import { ReportCardPreview, AcademicModules } from './SchoolAdminView';
import { ReportCardTemplate } from '../../types';
import api from '../../lib/api';
import { 
  downloadResultTemplate, 
  parseResultExcel,
  downloadAttendanceTemplate,
  parseAttendanceExcel
} from '../../lib/excel';

/**
 * Robustly formats a date string or Date object into YYYY-MM-DD for <input type="date">
 * Prevents UTC timezone shifts that cause "dd/mm/yyyy" placeholder issues.
 */
const formatDateForInput = (dateValue: any) => {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    
    // Extract local components to avoid UTC shift
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
};

export const StorageModules = {
  MyDrive: () => {
    const [folders, setFolders] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
    const [movingFile, setMovingFile] = useState<any | null>(null);
    
    const fetchDriveData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/drive');
        setFolders(res.data.folders || []);
        setFiles(res.data.files || []);
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchDriveData();
    }, []);

    const handleCreateFolder = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      try {
        await api.post('/drive/folders', { name: newFolderName });
        setNewFolderName('');
        setIsCreatingFolder(false);
        (window as any).showToast?.('Folder created successfully', 'success');
        fetchDriveData();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result;
        try {
          await api.post('/drive/files', {
            name: file.name,
            size: file.size,
            type: file.type || file.name.split('.').pop(),
            file_url: base64,
            folder_id: selectedFolderId
          });
          (window as any).showToast?.('File uploaded successfully', 'success');
          fetchDriveData();
        } catch (err: any) {
          (window as any).showToast?.(err, 'error');
        }
      };
      reader.readAsDataURL(file);
    };

    const handleDeleteFile = async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this file?')) return;
      try {
        await api.delete(`/drive/files/${id}`);
        (window as any).showToast?.('File deleted', 'success');
        fetchDriveData();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleMoveFile = async (folderId: string | null) => {
      if (!movingFile) return;
      try {
        await api.patch(`/drive/files/${movingFile.id}/move`, { folder_id: folderId });
        (window as any).showToast?.('File moved successfully', 'success');
        setMovingFile(null);
        fetchDriveData();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const currentFiles = files.filter(f => selectedFolderId ? f.folder_id === selectedFolderId : !f.folder_id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">My Drive</h2>
            {selectedFolderId && (
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-zinc-400" />
                <button 
                  onClick={() => { setSelectedFolderId(null); setSelectedFolderName(null); }}
                  className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-all"
                >
                  Root
                </button>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{selectedFolderName}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 relative">
            <button 
              onClick={() => setIsCreatingFolder(true)} 
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold shadow-sm"
            >
              New Folder
            </button>
            <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition">
              Upload File
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {isCreatingFolder && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Folder className="text-zinc-400 w-5 h-5" />
            <input 
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="flex-1 bg-transparent outline-none font-bold text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder(e as any)}
            />
            <button onClick={handleCreateFolder as any} className="text-xs font-bold text-indigo-600 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shadow-sm">Create</button>
            <button onClick={() => setIsCreatingFolder(false)} className="text-xs font-bold text-zinc-500 hover:text-red-500">Cancel</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading && folders.length === 0 ? (
            <div className="col-span-full py-8 text-center text-zinc-500 text-sm font-bold flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading folders...
            </div>
          ) : !selectedFolderId ? (
            folders.map((f, i) => (
              <div 
                key={i} 
                onClick={() => { setSelectedFolderId(f.id); setSelectedFolderName(f.name); }}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-600 transition-all cursor-pointer group shadow-sm"
              >
                <Folder className="w-8 h-8 mb-3 text-indigo-500" />
                <div className="font-bold text-sm truncate text-zinc-900 dark:text-white">{f.name}</div>
                <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">
                  {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 bg-zinc-50 dark:bg-zinc-800/10 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-4">
               <div className="text-zinc-400 font-bold italic text-sm">Viewing files in "{selectedFolderName}"</div>
               <button 
                 onClick={() => { setSelectedFolderId(null); setSelectedFolderName(null); }}
                 className="px-4 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold shadow-sm"
               >
                 Go Back
               </button>
            </div>
          )}
        </div>

        <DataTable 
          title={selectedFolderId ? `Files in ${selectedFolderName}` : "Root Files"} 
          data={currentFiles}
          columns={[
            { 
              header: 'Name', 
              accessor: (item: any) => (
                <div className="flex items-center gap-3">
                  <File className="w-4 h-4 text-zinc-400" />
                  <span className="font-bold text-zinc-900 dark:text-white">{item.name}</span>
                </div>
              )
            },
            { header: 'Size', accessor: (item: any) => `${(item.size / 1024).toFixed(1)} KB` },
            { header: 'Type', accessor: (item: any) => <span className="uppercase text-[10px] font-black tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{item.type}</span> },
            { header: 'Uploaded', accessor: (item: any) => new Date(item.created_at).toLocaleDateString(), className: 'text-zinc-500 font-bold text-xs' },
            { header: 'Owner', accessor: (item: any) => <span className="text-indigo-600 font-bold">{item.owner_name || 'System'}</span> },
            { 
              header: 'Actions', 
              accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <a href={item.file_url} download={item.name} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => setMovingFile(item)}
                    className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Move to Folder"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteFile(item.id)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 hover:bg-red-100 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          ]}
        />

        {movingFile && (
          <Modal 
            isOpen={!!movingFile} 
            onClose={() => setMovingFile(null)} 
            title={`Move "${movingFile.name}" to...`}
          >
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Select Destination Folder</p>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => handleMoveFile(null)}
                  className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 transition-all text-left"
                >
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-zinc-400">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Root Directory</p>
                    <p className="text-[10px] text-zinc-400">Move file back to the main drive</p>
                  </div>
                </button>
                
                {folders.filter(f => f.id !== selectedFolderId).map(f => (
                  <button 
                    key={f.id}
                    onClick={() => handleMoveFile(f.id)}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-all text-left group"
                  >
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{f.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Select this folder</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  },
  FolderManagement: () => {
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFolders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/drive');
        setFolders(res.data.folders || []);
      } catch (err: any) {
        console.error('Failed to load folders:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchFolders();
    }, []);

    return (
      <DataTable 
        title="System Folder Management" 
        data={folders}
        columns={[
          { 
            header: 'Folder Name', 
            accessor: (item: any) => (
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-zinc-900 dark:text-white">{item.name}</span>
              </div>
            )
          },
          { header: 'Owner', accessor: (item: any) => <span className="font-bold text-indigo-600">{item.owner_name || 'System'}</span> },
          { header: 'Created', accessor: (item: any) => <span className="font-bold text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</span> },
        ]}
      />
    );
  },
};

export const StaffAcademicModules = {
  StudentManagement: ({ data, results = [], exams = [], classes = [], gradingScales = [], attendance = [] }: { data: Student[], results?: any[], exams?: any[], classes?: any[], gradingScales?: any[], attendance?: any[] }) => {
    const [viewItem, setViewItem] = useState<Student | null>(null);

    const getGrade = (score: number, classId: string) => {
      const scale = gradingScales.find(s => s.assigned_classes?.some((c: any) => c.id === classId)) || gradingScales[0];
      if (!scale || !scale.levels || scale.levels.length === 0) {
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
      }
      const level = [...scale.levels].sort((a,b) => b.min_score - a.min_score).find((l: any) => score >= l.min_score);
      return level ? level.grade : 'F';
    };

    const groupedResults = useMemo(() => {
      if (!viewItem) return {};
      const studentResults = results.filter(r => String(r.student_id) === String(viewItem.id));
      const groups: Record<string, any[]> = {};
      
      studentResults.forEach(r => {
        const exam = exams.find(e => e.id === r.exam_id);
        const termName = exam?.term_name || exam?.semester_name || 'General';
        const classInfo = classes.find(c => c.id === (r.class_id || viewItem.class_id));
        const className = classInfo ? `${classInfo.name} ${classInfo.section || ''}` : 'Academic Record';
        const groupKey = `${termName} - ${className}`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(r);
      });
      return groups;
    }, [viewItem, results, exams, classes]);

    return (
      <DataTable<Student> 
        title="My Students" 
        data={data}
        detailsMaxWidth="max-w-4xl"
        columns={[
          { header: 'Name', accessor: 'name', className: 'font-bold' },
          { header: 'Class', accessor: 'class' },
          { header: 'Email', accessor: 'email' },
        ]}
        renderDetails={(item) => (
          <div className="space-y-10 p-2">
            <div className="flex items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
               <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                 {item.name.charAt(0)}
               </div>
               <div className="space-y-1">
                 <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{item.name}</h3>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {item.id.slice(0,8)} • {item.class}</p>
               </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2"> 
                <GraduationCap className="w-3 h-3" /> Terminal Reports 
              </h4>
              
              <div className="space-y-8">
                {Object.keys(groupedResults).length > 0 ? (
                  Object.entries(groupedResults).map(([groupKey, groupResults]) => (
                    <div key={groupKey} className="space-y-3">
                      <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"> {groupKey} </h5>
                      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                            <tr>
                              <th className="px-4 py-3 font-bold text-zinc-500 uppercase">Subject</th>
                              <th className="px-4 py-3 font-bold text-zinc-500 uppercase text-center">Score</th>
                              <th className="px-4 py-3 font-bold text-zinc-500 uppercase text-right">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {(groupResults as any[]).map((res, i) => (
                              <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">
                                  {res.subject_name || res.subject || 'Subject'}
                                  <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">{res.exam_name || exams.find(e => e.id === res.exam_id)?.name || 'Exam'}</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-black text-indigo-600 dark:text-indigo-400">{res.marks_obtained || res.score || res.total_score}%</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    (parseFloat(res.marks_obtained || res.score) || 0) >= 70 ? "bg-emerald-50 text-emerald-600" : 
                                    (parseFloat(res.marks_obtained || res.score) || 0) >= 50 ? "bg-indigo-50 text-indigo-600" :
                                    "bg-red-50 text-red-600"
                                  )}>
                                    {getGrade(parseFloat(res.marks_obtained || res.score) || 0, res.class_id || item.class_id)}
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
                  <div className="py-20 text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/10 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <GraduationCap className="w-10 h-10 text-zinc-200 mx-auto" />
                    <p className="text-zinc-400 font-bold italic text-xs">No academic history recorded for this student.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
              <p className="text-[10px] text-amber-700 dark:text-amber-500 font-black uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Staff Guidance Note
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-500/80 mt-1 font-medium leading-relaxed">
                Academic history provides a bird's-eye view of student progression. Use these terminal summaries to identify trends or areas where immediate intervention may be required.
              </p>
            </div>
          </div>
        )}
      />
    );
  },

  SubjectManagement: ({ data, students = [] }: { data: any[], students?: any[] }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);

    return (
      <div className="space-y-6">
        <DataTable
          title="My Subjects"
          data={data}
          onView={setViewItem}
          autoViewModal={false}
          columns={[
            { header: 'Subject Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
            { header: 'Code', accessor: 'code', className: 'font-mono text-xs text-indigo-600' },
            { header: 'Class', accessor: (item: any) => item.class_name ? `${item.class_name} ${item.class_section || ''}` : 'N/A' },
          ]}
        />

        <Modal 
          isOpen={!!viewItem} 
          onClose={() => setViewItem(null)}
          title="Subject Details"
          maxWidth="max-w-2xl"
        >
          {viewItem && (
            <div className="space-y-8 p-4">
              <div className="flex items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-none">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{viewItem.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Code: {viewItem.code}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Class: {viewItem.class_name} {viewItem.class_section}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Students taking this subject</h4>
                  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {students.filter((s: any) => s.class_id === viewItem.class_id).length} Enrolled
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto pr-2">
                  {students.filter((s: any) => s.class_id === viewItem.class_id).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {students.filter((s: any) => s.class_id === viewItem.class_id).map((student: any) => (
                        <div key={student.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{student.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{student.student_id || student.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <Users className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No Students Found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  },

  ClassManagement: ({ data, students = [] }: { data: any[], students?: any[] }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);

    return (
      <div className="space-y-6">
        <DataTable
          title="My Classes"
          data={data}
          onView={setViewItem}
          autoViewModal={false}
          columns={[
            { header: 'Class Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
            { header: 'Section', accessor: 'section' },
            { 
              header: 'Number of Students', 
              accessor: (item: any) => students.filter((s: any) => s.class_id === item.id).length,
              className: 'font-bold text-indigo-600'
            },
          ]}
        />

        <Modal 
          isOpen={!!viewItem} 
          onClose={() => setViewItem(null)}
          title="Class Details"
          maxWidth="max-w-4xl"
        >
          {viewItem && (
            <div className="space-y-6 p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{viewItem.name} {viewItem.section}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                       <span>Rank: {viewItem.rank || 0}</span>
                       <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                       <span>Capacity: {viewItem.capacity || 0}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Enrolled', value: students.filter((s: any) => s.class_id === viewItem.id).length, color: 'text-indigo-600', bg: 'bg-indigo-50/50 dark:bg-indigo-900/20' },
                      { label: 'Boys', value: students.filter((s: any) => s.class_id === viewItem.id && s.gender?.toLowerCase() === 'male').length, color: 'text-blue-600', bg: 'bg-blue-50/50 dark:bg-blue-900/20' },
                      { label: 'Girls', value: students.filter((s: any) => s.class_id === viewItem.id && s.gender?.toLowerCase() === 'female').length, color: 'text-rose-600', bg: 'bg-rose-50/50 dark:bg-rose-900/20' },
                    ].map((stat, i) => (
                      <div key={i} className={cn("p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/50 text-center", stat.bg)}>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                        <p className={cn("text-sm font-black", stat.color)}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] border-b border-zinc-100 dark:border-zinc-800 pb-2">Student Directory</h4>
                <div className="max-h-96 overflow-y-auto pr-2">
                  {students.filter((s: any) => s.class_id === viewItem.id).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {students.filter((s: any) => s.class_id === viewItem.id).map((student: any) => (
                        <div key={student.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 transition-all hover:scale-[1.02] cursor-default">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-black shadow-sm shrink-0 uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{student.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{student.student_id || student.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <Users className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No Students Found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  },

  Timetable: ({ data = [] }: { data?: any[] }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const defaultSlots = [
      '08:00 - 09:00', '09:00 - 10:00', '10:00 - 10:30', '10:30 - 11:30', 
      '11:30 - 12:30', '12:30 - 13:30', '13:30 - 14:30', '14:30 - 15:30'
    ];
    
    const dataSlots = Array.from(new Set(data.map(item => 
      `${item.start_time?.slice(0, 5)} - ${item.end_time?.slice(0, 5)}`
    )));
    
    const timeSlots = Array.from(new Set([...defaultSlots, ...dataSlots])).sort();

    const getEntry = (day: string, slot: string) => {
      return data.find(item => 
        item.day_of_week === day && 
        `${item.start_time?.slice(0, 5)} - ${item.end_time?.slice(0, 5)}` === slot
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Teaching Schedule</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Weekly Personal Timetable</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'grid' ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <LayoutIcon className="w-4 h-4 inline-block mr-2" /> Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'list' ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <FileText className="w-4 h-4 inline-block mr-2" /> List
            </button>
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
            <button 
              onClick={() => {
                const printContents = document.querySelector('.print-container')?.innerHTML;
                const originalContents = document.body.innerHTML;
                if (printContents) {
                  const printWindow = window.open('', '_blank');
                  printWindow?.document.write(`
                    <html>
                      <head>
                        <title>Staff Timetable</title>
                        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                        <style>
                          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                          body { font-family: 'Inter', sans-serif; padding: 20px; background: white !important; }
                          .print-container { border: 1px solid #e5e7eb; border-radius: 1rem; overflow: hidden; }
                          table { width: 100%; border-collapse: collapse; }
                          th, td { border: 1px solid #e5e7eb; padding: 12px; font-size: 10px; text-align: left; }
                          th { background: #f9fafb; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; }
                          .bg-indigo-600 { background-color: #4f46e5 !important; color: white !important; }
                          .text-indigo-600 { color: #4f46e5 !important; }
                          .font-black { font-weight: 900 !important; }
                          .uppercase { text-transform: uppercase !important; }
                          .tracking-widest { letter-spacing: 0.1em !important; }
                        </style>
                      </head>
                      <body onload="window.print();window.close()">
                        <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                          <h1 style="font-size: 24px; font-weight: 900; margin: 0;">Weekly Teaching Schedule</h1>
                        </div>
                        ${printContents}
                      </body>
                    </html>
                  `);
                  printWindow?.document.close();
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-600 transition-all"
            >
              <Printer className="w-4 h-4 inline-block mr-2" /> Print
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm print:shadow-none print-container">
          {viewMode === 'list' ? (
            <div className="p-6 space-y-8">
              {days.map(day => {
                const dayEntries = data.filter(e => e.day_of_week === day)
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
              {data.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-300">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest italic">No schedule found for this week</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse min-w-[800px]">
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
                            <td key={day} className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-center relative">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">{entry.type}</span>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="p-2 border-b border-zinc-100 dark:border-zinc-800 group-hover:bg-zinc-50/30 dark:group-hover:bg-zinc-800/10 transition-colors">
                            {entry ? (
                              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl">
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{entry.subject_name}</p>
                                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> {entry.class_name} {entry.class_section}
                                  </p>
                                  {entry.room && (
                                    <p className="text-[9px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-wider">
                                      <Building2 className="w-3 h-3" /> {entry.room}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : null}
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
      </div>
    );
  },

  Attendance: ({ data, students = [], staffList = [], onSave }: { data: any[], students?: any[], staffList?: any[], onSave?: (data: any) => void }) => {
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    const handleDownloadTemplate = () => {
      downloadAttendanceTemplate(students, "Class");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const parsed = await parseAttendanceExcel(file);
        
        // Enrich with student IDs and validation
        const enriched = parsed.map(row => {
          const student = students.find(s => 
            (s.admission_no || s.admissionNo || '').trim() === row.admission_no
          );
          return {
            ...row,
            student_id: student?.id,
            isValid: !!student
          };
        });

        setPreviewData(enriched);
      } catch (err: any) {
        (window as any).showToast?.('Could not read the attendance file. Please check the format and try again.', 'error');
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };

    const confirmImport = async () => {
      if (!previewData || !onSave) return;
      
      const validRecords = previewData.filter(r => r.isValid).map(r => ({
        student_id: r.student_id,
        status: r.status,
        remarks: r.remark,
        date: r.date
      }));

      try {
        // Assuming onSave can handle batch or we loop
        for (const record of validRecords) {
          await onSave(record);
        }
        setPreviewData(null);
        (window as any).showToast?.(`Successfully imported ${validRecords.length} attendance records.`, 'success');
      } catch (err) {
        (window as any).showToast?.('Something went wrong while saving attendance. Please try again.', 'error');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
               <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Staff Attendance</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mark your presence or scan students</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
            <label className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2 cursor-pointer text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Import Log
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </label>
            {/* BiometricPortal removed temporarily */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-center min-w-[80px]">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Present Days</p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                {data.filter(a => a.status === 'Present').length}
              </p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-xl text-center min-w-[80px]">
              <p className="text-[10px] font-bold text-rose-600 uppercase">Absent Days</p>
              <p className="text-xl font-black text-rose-700 dark:text-rose-400">
                {data.filter(a => a.status === 'Absent').length}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Preview Modal */}
        {previewData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Preview Attendance Log</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Verify student attendance before syncing</p>
                </div>
                <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Remark</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-bold">
                          {row.name}
                          <p className="text-[10px] text-zinc-500 font-normal">{row.admission_no}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            row.status === 'Present' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 italic text-zinc-500 text-xs">{row.remark || '—'}</td>
                        <td className="px-4 py-3">
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase">
                              <AlertCircle className="w-4 h-4" /> Unknown
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
                <button onClick={() => setPreviewData(null)} className="flex-1 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm">Cancel</button>
                <button 
                  onClick={confirmImport}
                  disabled={previewData.filter(r => r.isValid).length === 0}
                  className="flex-3 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                >
                  Import {previewData.filter(r => r.isValid).length} Records
                </button>
              </div>
            </div>
          </div>
        )}

        <DataTable
          title="Attendance Log"
          data={data}
          columns={[
            { header: 'Date', accessor: 'date', className: 'font-bold' },
            {
              header: 'Status',
              accessor: (item) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Present' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {item.status}
                </span>
              )
            },
            { header: 'Check In', accessor: (item) => item.checkIn || item.check_in || '—' },
            { header: 'Remarks', accessor: (item) => item.remark || item.remarks || '—', className: 'text-zinc-500 italic' },
          ]}
        />
      </div>
    );
  },

  ResultManagement: ({ role, currentUser, exams = [], students = [], classes = [], organization, reportCardTemplates = [], remarkTemplates = [], results = [], onSaveResults, onSyncMarks }: any) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'summary' | 'class-remarks'>('upload');
    const [selectedClassRemarksId, setSelectedClassRemarksId] = useState("");
    const [terminalRemarks, setTerminalRemarks] = useState<Record<string, { teacher_remark: string, principal_remark?: string }>>({});
    const [selectedExamId, setSelectedExamId] = useState("");
    const [scoreDetails, setScoreDetails] = useState<Record<string, Record<string, number>>>({});
    const [remarks, setRemarks] = useState<Record<string, string>>({});
    const [viewResult, setViewResult] = useState<any | null>(null);
    const [historyGroupBy, setHistoryGroupBy] = useState<'class' | 'subject'>('class');
    const [selectedHistoryGroup, setSelectedHistoryGroup] = useState<any | null>(null);
    const [performanceGroupBy, setPerformanceGroupBy] = useState<'class' | 'subject'>('class');
    const [selectedPerformanceGroup, setSelectedPerformanceGroup] = useState<any | null>(null);
    const [showReportCard, setShowReportCard] = useState<any | null>(null);
    
    // Sync Marks Modal State
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncSources, setSyncSources] = useState<{ assignments: any[], cbts: any[] }>({ assignments: [], cbts: [] });
    const [syncForm, setSyncForm] = useState({
      sourceType: 'assignment' as 'assignment' | 'cbt',
      sourceId: '',
      targetColumn: 'showClassScore' as 'showClassScore' | 'showExamScore'
    });

    // Excel Import State
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    const handleDownloadTemplate = () => {
      if (!selectedExamId) {
        (window as any).showToast?.('Please select an exam first.', 'warning');
        return;
      }
      downloadResultTemplate(selectedExam, classStudents, activeColumns);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedExamId) return;

      setImporting(true);
      try {
        const parsed = await parseResultExcel(file, activeColumns);
        
        // Map parsed data to students
        const enriched = parsed.map(row => {
          const student = classStudents.find(s => 
            (s.admission_no || s.admissionNo || '').trim() === row.admission_no
          );
          return {
            ...row,
            student_id: student?.id,
            isValid: !!student
          };
        });

        setPreviewData(enriched);
      } catch (err: any) {
        (window as any).showToast?.('Could not read the Excel file. Please check the format and try again.', 'error');
      } finally {
        setImporting(false);
        e.target.value = ''; // Reset input
      }
    };

    const confirmImport = () => {
      if (!previewData) return;
      
      const newDetails = { ...scoreDetails };
      const newRemarks = { ...remarks };

      previewData.forEach(row => {
        if (row.isValid) {
          newDetails[row.student_id] = row.score_details;
          if (row.remark) newRemarks[row.student_id] = row.remark;
        }
      });

      setScoreDetails(newDetails);
      setRemarks(newRemarks);
      setPreviewData(null);
      (window as any).showToast?.(`Imported scores for ${previewData.filter(r => r.isValid).length} students.`, 'success');
    };

    const fetchSyncSources = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          api.get('/elearning/assignments'),
          api.get('/elearning/cbt-exams')
        ]);
        setSyncSources({ 
          assignments: Array.isArray(aRes.data) ? aRes.data : [], 
          cbts: Array.isArray(cRes.data) ? cRes.data : [] 
        });
      } catch (err) {
        console.error('Failed to fetch sync sources:', err);
      }
    };

    const handleSync = async () => {
      if (!syncForm.sourceId || !selectedExamId) {
        (window as any).showToast?.('Please select both a source and a target exam.', 'warning');
        return;
      }
      setSyncLoading(true);
      try {
        await onSyncMarks({
          sourceType: syncForm.sourceType,
          sourceId: syncForm.sourceId,
          targetExamId: selectedExamId,
          targetColumn: syncForm.targetColumn
        });
        setShowSyncModal(false);
      } catch (err) {
        // Error toast handled in App.tsx
      } finally {
        setSyncLoading(false);
      }
    };


    const filteredResults = results.filter((r: any) => exams.some((e: any) => String(e.id) === String(r.exam_id)));

    // Calculate Ranks and Percentages locally
    const processedResults = useMemo(() => {
      // Group by exam_id
      const groups: Record<string, any[]> = {};
      filteredResults.forEach((r: any) => {
        if (!groups[r.exam_id]) groups[r.exam_id] = [];
        // Ensure score is a number
        groups[r.exam_id].push({ ...r, score: parseFloat(String(r.score)) || 0 });
      });

      // Rank each group
      const allProcessed: any[] = [];
      Object.keys(groups).forEach(examId => {
        const examGroup = groups[examId];
        const exam = exams.find((e: any) => String(e.id) === String(examId));
        const cls = exam ? classes.find((c: any) => String(c.id) === String(exam.class_id)) : null;
        const tmpl = cls ? reportCardTemplates.find((t: any) => String(t.id) === String(cls.report_card_template_id)) : null;
        const acSec = tmpl?.sections?.find((s: any) => s.type === 'AcademicResults' && s.enabled);
        
        // Find max total score logic
        let maxTotal = 100;
        if (acSec?.settings) {
          maxTotal = (acSec.settings.classScoreMax || 30) + (acSec.settings.examScoreMax || 70);
        }

        // Sort descending
        examGroup.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        examGroup.forEach((res, index) => {
          // Standard competition ranking (1, 2, 2, 4)
          if (index > 0 && res.score === examGroup[index - 1].score) {
            res.rank = examGroup[index - 1].rank;
          } else {
            res.rank = index + 1;
          }
          // Use template-defined max total for % calculation
          res.percentage = `${((res.score || 0) / maxTotal * 100).toFixed(1)}%`;
        });
        allProcessed.push(...examGroup);
      });
      return allProcessed;
    }, [filteredResults]);

    // Calculate History Summary (Grouped by Class or Subject)
    const historySummary = useMemo(() => {
      const groups: Record<string, any> = {};
      processedResults.forEach((r: any) => {
        const key = historyGroupBy === 'class' ? String(r.class_id) : String(r.subject_id);
        if (!groups[key]) {
          groups[key] = {
            id: key,
            name: historyGroupBy === 'class' ? `${r.class_name} ${r.class_section || ''}`.trim() : (r.subject_name || r.subject),
            resultCount: 0,
            lastUpdate: r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'
          };
        }
        groups[key].resultCount++;
      });
      return Object.values(groups);
    }, [processedResults, historyGroupBy]);

    // Calculate Summary (Student-Subject Grouped)
    const summarizedResults = useMemo(() => {
      const summaryMap: Record<string, any> = {};

      filteredResults.forEach((r: any) => {
        const exam = exams.find(e => String(e.id) === String(r.exam_id));
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

      // Rank students per Subject and Class
      const skeyMap: Record<string, any[]> = {};
      summaryList.forEach(s => {
        const k = `${s.subject_id}-${s.class_id}`;
        if (!skeyMap[k]) skeyMap[k] = [];
        skeyMap[k].push(s);
      });

      Object.values(skeyMap).forEach(group => {
        group.sort((a, b) => b.totalScore - a.totalScore);
        group.forEach((s, i) => {
          if (i > 0 && s.totalScore === group[i-1].totalScore) s.rank = group[i-1].rank;
          else s.rank = i + 1;
        });
      });

      return summaryList;
    }, [filteredResults, classes, reportCardTemplates]);

    // Calculate Performance Summary Groups (Class or Subject)
    const performanceSummaryGroups = useMemo(() => {
      const groups: Record<string, any> = {};
      summarizedResults.forEach((r: any) => {
        const key = performanceGroupBy === 'class' ? String(r.class_id) : String(r.subject_id);
        if (!groups[key]) {
          groups[key] = {
            id: key,
            name: performanceGroupBy === 'class' ? r.class_name : r.subject_name,
            studentCount: new Set(summarizedResults.filter(sr => (performanceGroupBy === 'class' ? String(sr.class_id) : String(sr.subject_id)) === key).map(sr => sr.student_id)).size,
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
          if (i > 0 && s.total === sorted[i-1].total) {
            rank = finalRanks[classId][sorted[i-1].id].rank;
          }
          const topPercentile = Math.ceil((rank / count) * 100);
          finalRanks[classId][s.id] = {
            rank,
            count,
            score: s.total,
            subjectCount: s.subjectCount,
            percentile: `Top ${topPercentile}%`
          };
        });
      });
      return finalRanks;
    }, [summarizedResults]);

    // Clean up simplified logic
    const selectedExam = exams.find((e: any) => String(e.id) === String(selectedExamId));
    const selectedClass = selectedExam ? classes.find((c: any) => String(c.id) === String(selectedExam.class_id)) : null;
    const classStudents = selectedExam ? students.filter((s: any) => String(s.class_id) === String(selectedExam.class_id)) : [];

    // Pre-fill existing scores for the selected exam
    useEffect(() => {
      if (!selectedExamId) {
        setScoreDetails({});
        setRemarks({});
        return;
      }
      
      const newDetails: Record<string, Record<string, number>> = {};
      const newRemarks: Record<string, string> = {};

      filteredResults.filter((r: any) => String(r.exam_id) === String(selectedExamId)).forEach((r: any) => {
        // Use score_details if available, fallback to basic score
        newDetails[r.student_id] = r.score_details && typeof r.score_details === 'object' 
          ? r.score_details 
          : { showTotalScore: parseFloat(String(r.score)) || 0 };
        
        if (r.remark) newRemarks[r.student_id] = r.remark;
      });

      setScoreDetails(newDetails);
      setRemarks(newRemarks);
    }, [selectedExamId]);

    // Show all exams passed to the component (already filtered by staff subjects in App.tsx)
    const examOptions = useMemo(() => {
      return exams; // Remove restrictive filter to allow CA, Class Test, etc.
    }, [exams]);


    // Find assigned template
    const template = selectedClass ? reportCardTemplates.find((t: any) => String(t.id) === String(selectedClass.report_card_template_id)) : null;
    const academicSection = template?.sections?.find((s: any) => s.type === 'AcademicResults' && s.enabled);
    
    const activeColumns = academicSection ? (academicSection.settings?.columnOrder || [
      'showClassScore', 'showExamScore', 'showTotalScore'
    ]).filter((key: string) => academicSection.settings?.[key] && (key === 'showClassScore' || key === 'showExamScore' || key === 'showTotalScore')) : ['showTotalScore'];

    const columnLabels: Record<string, string> = {
      showClassScore: `Class Score (${academicSection?.settings?.classScoreMax || 30} Max)`,
      showExamScore: `Exams Score (${academicSection?.settings?.examScoreMax || 70} Max)`,
      showTotalScore: 'Total Score'
    };

    const handleSave = async () => {
      const resultsArray = classStudents.map((student: any) => {
        const details = scoreDetails[student.id] || {};
        // Calculate total if not explicitly provided or if others are provided
        let total = details.showTotalScore || 0;
        if (details.showClassScore || details.showExamScore) {
          total = (details.showClassScore || 0) + (details.showExamScore || 0);
        }

        return {
          student_id: student.id,
          class_id: selectedClass?.id,
          subject_id: selectedExam?.subject_id,
          score: total,
          score_details: details,
          remark: remarks[student.id] || null
        };
      }).filter(r => {
         // Only save if at least one part of the score is entered
         const details = r.score_details as any;
         
         // Validation: Ensure scores don't exceed max
         if (academicSection?.settings) {
           if (details.showClassScore > (academicSection.settings.classScoreMax || 30)) {
             throw new Error(`Class score for a student exceeds the maximum of ${academicSection.settings.classScoreMax || 30}`);
           }
           if (details.showExamScore > (academicSection.settings.examScoreMax || 70)) {
             throw new Error(`Exam score for a student exceeds the maximum of ${academicSection.settings.examScoreMax || 70}`);
           }
         }

         return Object.values(details).some(v => v !== undefined && v !== null);
      });

      if (resultsArray.length === 0) {
        (window as any).showToast?.('Please enter at least one score.', 'error');
        return;
      }
      try {
        await onSaveResults({ exam_id: selectedExamId, results: resultsArray });
      } catch (err: any) {
        console.error(err);
        (window as any).showToast?.(err, 'error');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">e-Result Management</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {activeTab === 'upload' ? 'Upload Student Marks' : activeTab === 'history' ? 'View Past Results' : activeTab === 'summary' ? 'Performance Overview' : 'Assign Terminal Remarks'}
              </p>
            </div>
          </div>
          {activeTab === 'upload' && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedExamId && (
                <>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Template
                  </button>
                  <label className="px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Import Excel
                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                  </label>
                  <button 
                    onClick={() => { fetchSyncSources(); setShowSyncModal(true); }}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Pull from E-Learning
                  </button>
                </>
              )}
              <button 
                onClick={handleSave}
                disabled={!selectedExamId || Object.keys(scoreDetails).length === 0}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Submit Results
              </button>
            </div>
          )}
        </div>

        {/* Import Preview Modal */}
        {previewData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Preview Result Import</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Review marks before applying to the entry form</p>
                </div>
                <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Adm No</th>
                      {activeColumns.map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">{columnLabels[col]}</th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Remark</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-bold">{row.student_name}</td>
                        <td className="px-4 py-3 text-zinc-500">{row.admission_no}</td>
                        {activeColumns.map(col => (
                          <td key={col} className="px-4 py-3">{row.score_details[col] || 0}</td>
                        ))}
                        <td className="px-4 py-3 font-black text-indigo-600">{row.score}</td>
                        <td className="px-4 py-3 italic text-zinc-500">{row.remark || '—'}</td>
                        <td className="px-4 py-3">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Valid</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Unknown Student
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
                <button onClick={() => setPreviewData(null)} className="flex-1 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm">Cancel</button>
                <button 
                  onClick={confirmImport}
                  disabled={previewData.filter(r => r.isValid).length === 0}
                  className="flex-3 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                >
                  Apply {previewData.filter(r => r.isValid).length} Results
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit">
          {[
            { key: 'upload', label: 'Upload Marks', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
            { key: 'history', label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
            { key: 'summary', label: 'Summary', icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { key: 'class-remarks', label: 'Class Remarks', icon: <Award className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5",
                activeTab === tab.key ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'upload' ? (
          <>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Select Exam</label>
              <select 
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setScoreDetails({});
                }}
                className="w-full max-w-xl px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose an Exam --</option>
                {examOptions.map((exam: any) => (
                  <option key={exam.id} value={exam.id}>
                    [{exam.type || 'N/A'}] {exam.subject_name || exam.subject} - {exam.class_name || exam.class} {exam.class_section || ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedExamId && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Student Name</th>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Student ID</th>
                      {activeColumns.map(colKey => (
                        <th key={colKey} className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          {columnLabels[colKey] || colKey}
                        </th>
                      ))}
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Optional Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student: any) => (
                      <tr key={student.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{student.name}</span>
                          </div>
                        </td>
                        <td className="p-4 border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 font-mono">
                          {student.admission_no || student.student_id || String(student.id).slice(0, 8)}
                        </td>
                        {activeColumns.map(colKey => (
                          <td key={colKey} className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                            <input 
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              readOnly={colKey === 'showTotalScore' && (academicSection?.settings?.showClassScore || academicSection?.settings?.showExamScore)}
                              value={
                                colKey === 'showTotalScore' && (academicSection?.settings?.showClassScore || academicSection?.settings?.showExamScore)
                                  ? (scoreDetails[student.id]?.showClassScore || 0) + (scoreDetails[student.id]?.showExamScore || 0)
                                  : (scoreDetails[student.id]?.[colKey] !== undefined ? scoreDetails[student.id][colKey] : '')
                              }
                              onChange={(e) => {
                                const valStr = e.target.value;
                                if (valStr !== '' && !/^\d+$/.test(valStr)) return; // Only allow digits
                                
                                const val = valStr === '' ? undefined : parseInt(valStr);
                                const max = colKey === 'showClassScore' ? (academicSection?.settings?.classScoreMax || 30) : 
                                            colKey === 'showExamScore' ? (academicSection?.settings?.examScoreMax || 70) : 100;
                                
                                if (val !== undefined && val > max) {
                                  (window as any).showToast?.(`Score cannot exceed ${max}`, 'warning');
                                }

                                setScoreDetails(prev => {
                                  const studentDetails = { ...(prev[student.id] || {}), [colKey]: val };
                                  if (academicSection?.settings?.showTotalScore && (colKey === 'showClassScore' || colKey === 'showExamScore')) {
                                    studentDetails.showTotalScore = (studentDetails.showClassScore || 0) + (studentDetails.showExamScore || 0);
                                  }
                                  return { ...prev, [student.id]: studentDetails };
                                });
                              }}
                              className={cn(
                                "w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold transition-all",
                                (colKey === 'showTotalScore' && (academicSection?.settings?.showClassScore || academicSection?.settings?.showExamScore))
                                  ? "bg-zinc-100 dark:bg-zinc-900 border-transparent text-indigo-600"
                                  : scoreDetails[student.id]?.[colKey] > (colKey === 'showClassScore' ? (academicSection?.settings?.classScoreMax || 30) : 
                                                                    colKey === 'showExamScore' ? (academicSection?.settings?.examScoreMax || 70) : 100)
                                    ? "border-rose-500 text-rose-600 bg-rose-50"
                                    : "border-zinc-200 dark:border-zinc-700"
                              )}
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <select
                            value={remarks[student.id] || ''}
                            onChange={(e) => setRemarks({ ...remarks, [student.id]: e.target.value })}
                            className="w-full max-w-[200px] px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">-- No Remark --</option>
                            {remarkTemplates?.map((rt: any) => {
                              const remarkText = rt.remark || rt.description || rt.title || rt.name || rt.text;
                              return (
                                <option key={rt.id} value={remarkText}>
                                  {remarkText}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {classStudents.length === 0 && (
                      <tr>
                        <td colSpan={3 + activeColumns.length} className="p-8 text-center text-zinc-500 text-sm italic">
                          No students found in this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === 'class-remarks' ? (
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
                  const tcName = String(c.class_teacher_name || '').toLowerCase().trim();
                  
                  const uId = String(currentUser?.id || '').toLowerCase();
                  const uStaffId = String(currentUser?.staff_id || '').toLowerCase();
                  const uEmail = String(currentUser?.email || '').toLowerCase().trim();
                  const uName = String(currentUser?.name || '').toLowerCase().trim();

                  if (!tcId && !tcName) return false;

                  return (
                    (tcId && (tcId === uId || tcId === uStaffId || tcId === uEmail)) ||
                    (tcName && uName && (tcName === uName || tcName.includes(uName) || uName.includes(tcName)))
                  );
                }).map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name || cls.class_name} {cls.section || ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedClassRemarksId && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Student Name</th>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Score</th>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Class Rank</th>
                      <th className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">Teacher's Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter((s: any) => String(s.class_id) === String(selectedClassRemarksId)).map((student: any) => {
                      const rankData = overallClassRanks[selectedClassRemarksId]?.[student.id];
                      return (
                      <tr key={student.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{student.name}</span>
                          </div>
                        </td>
                        <td className="p-4 border-b border-zinc-100 dark:border-zinc-800 text-center">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{rankData?.score ? Math.round(rankData.score) : '—'}</span>
                        </td>
                        <td className="p-4 border-b border-zinc-100 dark:border-zinc-800 text-center">
                          <span className="font-bold text-indigo-600">
                            {rankData ? `${rankData.rank}${['st','nd','rd'][rankData.rank-1] || 'th'} / ${rankData.count}` : '—'}
                          </span>
                        </td>
                        <td className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                          <select
                            value={terminalRemarks[student.id]?.teacher_remark || ''}
                            onChange={(e) => setTerminalRemarks(prev => ({
                              ...prev,
                              [student.id]: { ...(prev[student.id] || {}), teacher_remark: e.target.value }
                            }))}
                            className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                          >
                            <option value="">-- Choose Template --</option>
                            {remarkTemplates?.map((rt: any) => (
                              <option key={rt.id} value={rt.remark || rt.text}>{rt.remark || rt.text}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                   <button 
                    onClick={async () => {
                      const resultsToSave = students
                        .filter((s: any) => String(s.class_id) === String(selectedClassRemarksId))
                        .map((s: any) => ({
                          student_id: s.id,
                          class_id: selectedClassRemarksId,
                          teacher_remark: terminalRemarks[s.id]?.teacher_remark || '',
                          type: 'terminal_remark'
                        }))
                        .filter(r => r.teacher_remark);

                      if (resultsToSave.length === 0) {
                        (window as any).showToast?.('Please enter at least one remark.', 'warning');
                        return;
                      }

                      try {
                        await onSaveResults({ type: 'terminal_remarks', results: resultsToSave });
                        (window as any).showToast?.('Remarks saved successfully!', 'success');
                      } catch (err: any) {
                        (window as any).showToast?.(err, 'error');
                      }
                    }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                   >
                     Submit Terminal Remarks
                   </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-4">
            {!selectedHistoryGroup ? (
              <>
                <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
                  <button
                    onClick={() => setHistoryGroupBy('class')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      historyGroupBy === 'class' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500"
                    )}
                  >
                    Group by Class
                  </button>
                  <button
                    onClick={() => setHistoryGroupBy('subject')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      historyGroupBy === 'subject' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500"
                    )}
                  >
                    Group by Subject
                  </button>
                </div>
                <DataTable
                  title={`Results History (by ${historyGroupBy})`}
                  data={historySummary}
                  onView={setSelectedHistoryGroup}
                  autoViewModal={false}
                  columns={[
                    { header: historyGroupBy === 'class' ? 'Class Name' : 'Subject Name', accessor: (g: any) => g.name, className: 'font-bold' },
                    { header: 'Results Count', accessor: (g: any) => `${g.resultCount} Entries`, className: 'font-mono' },
                    { header: 'Last Recorded', accessor: (g: any) => g.lastUpdate, className: 'text-zinc-500' },
                  ]}
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedHistoryGroup(null)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-lg font-bold">Results for {selectedHistoryGroup.name}</h3>
                    <p className="text-xs text-zinc-500">History drill-down</p>
                  </div>
                </div>
                <DataTable
                  title="Detailed Results"
                  data={processedResults.filter((r: any) => 
                    historyGroupBy === 'class' 
                      ? String(r.class_id) === String(selectedHistoryGroup.id)
                      : String(r.subject_id) === String(selectedHistoryGroup.id)
                  )}
                  columns={[
                    { header: 'Student', accessor: (r: any) => r.student_name, className: 'font-bold' },
                    { header: historyGroupBy === 'class' ? 'Subject' : 'Class', accessor: (r: any) => historyGroupBy === 'class' ? (r.subject_name || r.subject) : r.class_name },
                    { header: 'Exam Type', accessor: (r: any) => r.exam_type || 'N/A' },
                    { 
                      header: 'Score Breakdown', 
                      accessor: (item: any) => (
                        <div className="space-y-1">
                          <span className="font-bold">{item.score}</span>
                          {item.score_details && Object.keys(item.score_details).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.score_details).map(([key, val]) => {
                                const labels: Record<string, string> = {
                                  showClassScore: 'CA',
                                  showExamScore: 'Exam'
                                };
                                if (key === 'showTotalScore') return null;
                                return (
                                  <span key={key} className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 font-medium">
                                    {labels[key] || key}: {val}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )
                    },
                    { header: '%', accessor: (r: any) => r.percentage, className: 'font-mono text-zinc-500' },
                    { header: 'Grade', accessor: (r: any) => r.grade, className: 'font-bold text-indigo-600' },
                    { header: 'Rank', accessor: (r: any) => `${r.rank}${['st','nd','rd'][r.rank-1] || 'th'}`, className: 'font-black text-indigo-600' },
                  ]}
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!selectedPerformanceGroup ? (
              <>
                <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
                  <button
                    onClick={() => setPerformanceGroupBy('class')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      performanceGroupBy === 'class' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500"
                    )}
                  >
                    Group by Class
                  </button>
                  <button
                    onClick={() => setPerformanceGroupBy('subject')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      performanceGroupBy === 'subject' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500"
                    )}
                  >
                    Group by Subject
                  </button>
                </div>
                <DataTable
                  title={`Performance Summary (by ${performanceGroupBy})`}
                  data={performanceSummaryGroups}
                  onView={setSelectedPerformanceGroup}
                  autoViewModal={false}
                  columns={[
                    { header: performanceGroupBy === 'class' ? 'Class Name' : 'Subject Name', accessor: (g: any) => g.name, className: 'font-bold' },
                    { header: 'Students', accessor: (g: any) => `${g.studentCount} Students`, className: 'font-mono' },
                    { header: 'Avg. Score', accessor: (g: any) => `${g.avgScore}`, className: 'font-black text-indigo-600' },
                  ]}
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedPerformanceGroup(null)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-lg font-bold">Performance for {selectedPerformanceGroup.name}</h3>
                    <p className="text-xs text-zinc-500">Consolidated drill-down</p>
                  </div>
                </div>
                <DataTable
                  title="Student Performance"
                  data={summarizedResults.filter((r: any) => 
                    performanceGroupBy === 'class' 
                      ? String(r.class_id) === String(selectedPerformanceGroup.id)
                      : String(r.subject_id) === String(selectedPerformanceGroup.id)
                  )}
                  columns={[
                    { header: 'Student', accessor: (r: any) => r.student_name, className: 'font-bold' },
                    { header: performanceGroupBy === 'class' ? 'Subject' : 'Class', accessor: (r: any) => performanceGroupBy === 'class' ? r.subject_name : r.class_name },
                    { header: 'CA', accessor: (r: any) => r.caScore, className: 'font-mono text-center text-zinc-500' },
                    { header: 'Mid-Term', accessor: (r: any) => r.midTermScore, className: 'font-mono text-center text-zinc-500' },
                    { header: 'Exams', accessor: (r: any) => r.examScore, className: 'font-mono text-center text-indigo-600 font-bold' },
                    { header: 'Total', accessor: (r: any) => r.totalScore, className: 'font-black text-center' },
                    { 
                      header: 'Position', 
                      accessor: (r: any) => {
                        const state = overallClassRanks[r.class_id]?.[r.student_id];
                        if (!state) return '—';
                        return `${state.rank}${['st','nd','rd'][state.rank-1] || 'th'} / ${state.count}`;
                      },
                      className: 'font-bold text-indigo-600 text-center'
                    },
                    { 
                      header: 'Top %', 
                      accessor: (r: any) => overallClassRanks[r.class_id]?.[r.student_id]?.percentile || '—',
                      className: 'font-bold text-emerald-600 text-[10px] text-center'
                    },
                    { header: 'Grade', accessor: (r: any) => r.grade, className: 'font-bold text-indigo-600 text-center' },
                    { header: 'Rank', accessor: (r: any) => `${r.rank}${['st','nd','rd'][r.rank-1] || 'th'}`, className: 'font-black text-indigo-600 text-center text-[10px]' },
                    {
                      header: 'Report Card',
                      accessor: (item: any) => (
                        <button 
                          onClick={() => {
                            const studentResults = summarizedResults.filter(sr => sr.student_id === item.student_id);
                            const rankData = overallClassRanks[item.class_id]?.[item.student_id];
                            const terminalRemarkData = results.find((r: any) => String(r.student_id) === String(item.student_id) && r.type === 'terminal_remark');
                            const formattedStudent = {
                              name: item.student_name,
                              id: item.admission_no || item.student_id || String(item.id).slice(0, 8),
                              grade: item.class_name,
                              term: exams.find(e => String(e.id) === String(results.find(r => r.student_id === item.student_id)?.exam_id))?.term || 'Current Term',
                              classPosition: rankData ? `${rankData.rank}${['st','nd','rd'][rankData.rank-1] || 'th'} / ${rankData.count}` : '—',
                              rankPercentile: rankData?.percentile || '—',
                              attendance: '—',
                              teacherRemark: terminalRemarkData?.teacher_remark || '',
                              principalRemark: terminalRemarkData?.principal_remark || '',
                              results: studentResults.map(sr => ({
                                subject: sr.subject_name,
                                classScore: sr.caScore,
                                examScore: sr.examScore,
                                score: sr.totalScore,
                                grade: sr.grade,
                                rank: `${sr.rank}${['st','nd','rd'][sr.rank-1] || 'th'}`,
                                remark: '—'
                              }))
                            };
                            setShowReportCard(formattedStudent);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          View
                        </button>
                      ),
                      className: 'text-center'
                    }
                  ]}
                />
              </>
            )}
          </div>
        )}
        
        {showReportCard && (() => {
          // Find class for the student to get the template
          // We need student's class_id. In the formattedStudent, we have grade (name) but maybe not class_id.
          // Let's ensure showReportCard has the original item context or just find by class name
          const cls = classes.find((c: any) => c.name === showReportCard.grade);
          const tmpl = cls ? reportCardTemplates.find((t: any) => String(t.id) === String(cls.report_card_template_id)) : null;
          
          if (!tmpl) {
            return (
              <Modal isOpen={true} onClose={() => setShowReportCard(null)} title="Report Card Unavailable">
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-zinc-600 font-medium">No Report Card Template has been assigned to this student's class ({showReportCard.grade}).</p>
                  <button onClick={() => setShowReportCard(null)} className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold">Close</button>
                </div>
              </Modal>
            );
          }

          return (
            <ReportCardPreview 
              template={tmpl}
              organization={organization}
              student={showReportCard}
              onClose={() => setShowReportCard(null)}
            />
          );
        })()}
        
        {viewResult && (
          <Modal 
            isOpen={!!viewResult} 
            onClose={() => setViewResult(null)}
            title="Result Details"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewResult.student_name}</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{viewResult.subject_name} • {viewResult.class_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Score</p>
                  <p className="text-2xl font-black text-indigo-600">{viewResult.score}</p>
                  {viewResult.score_details && (
                    <div className="flex gap-2 mt-2">
                      {Object.entries(viewResult.score_details).map(([key, val]: [string, any]) => {
                         const labels: Record<string, string> = { showClassScore: 'CA', showExamScore: 'Exam' };
                         if (key === 'showTotalScore') return null;
                         return (
                           <span key={key} className="text-[9px] px-1.5 py-0.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-bold">
                             {labels[key] || key}: {val}
                           </span>
                         );
                      })}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Grade & Rank</p>
                  <p className="text-2xl font-black text-indigo-600">{viewResult.grade} <span className="text-sm font-bold text-zinc-400 ml-1">({viewResult.rank}{['st','nd','rd'][viewResult.rank-1] || 'th'})</span></p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2">{viewResult.percentage} Performance</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Teacher's Remark
                </p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                  "{viewResult.remark || 'No remark provided for this assessment'}"
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setViewResult(null)}
                  className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm"
                >
                  Close View
                </button>
              </div>
            </div>
          </Modal>
        )}
        
        <Modal 
          isOpen={showSyncModal} 
          onClose={() => setShowSyncModal(false)}
          title="Pull Marks from E-Learning"
        >
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium">
                This will pull marks from Assignment or CBT Exam and scale them to match the target column's maximum marks.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Source Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSyncForm({ ...syncForm, sourceType: 'assignment', sourceId: '' })}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-xl text-xs font-bold border transition-all",
                      syncForm.sourceType === 'assignment' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600"
                    )}
                  >
                    Assignments
                  </button>
                  <button
                    onClick={() => setSyncForm({ ...syncForm, sourceType: 'cbt', sourceId: '' })}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-xl text-xs font-bold border transition-all",
                      syncForm.sourceType === 'cbt' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600"
                    )}
                  >
                    CBT Exams
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select {syncForm.sourceType === 'assignment' ? 'Assignment' : 'CBT Exam'}</label>
                <select
                  value={syncForm.sourceId}
                  onChange={(e) => setSyncForm({ ...syncForm, sourceId: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Source --</option>
                  {(syncForm.sourceType === 'assignment' ? syncSources.assignments : syncSources.cbts).map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.class_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Target Column (Result Mgmt)</label>
                <select
                  value={syncForm.targetColumn}
                  onChange={(e) => setSyncForm({ ...syncForm, targetColumn: e.target.value as any })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="showClassScore">Class Score (CA)</option>
                  <option value="showExamScore">Exam Score</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setShowSyncModal(false)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSync}
                disabled={syncLoading || !syncForm.sourceId}
                className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {syncLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {syncLoading ? 'Syncing...' : 'Start Sync'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
};

export const StaffHRModules = {
  StaffProfile: ({
    data,
    onSave,
    onExitStaff,
  }: {
    data: any[];
    onSave?: (data: any) => Promise<void> | void;
    onExitStaff?: (data: any) => void;
  }) => {
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isEditing, setIsEditing] = useState(false);
    const [exitingStaff, setExitingStaff] = useState<any>(null);
    
    useEffect(() => {
      if (data.length > 0 && !viewItem) {
        setViewItem(data[0]);
      }
    }, [data, viewItem]);

    const renderProfileTabs = (item: any) => {
      const tabs = [
        { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
        { id: 'job', label: 'Job Details', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'system', label: 'System', icon: <ShieldCheck className="w-4 h-4" /> },
      ];

      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4 flex items-center gap-2">
                       <Fingerprint className="w-3 h-3" /> Identity Details
                    </p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Full Name</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white capitalize">{item.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Staff ID</p>
                        <p className="text-sm font-mono font-bold text-indigo-600">{item.staff_id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Date of Birth</p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Gender</p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.gender || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4 flex items-center gap-2">
                       <Mail className="w-3 h-3" /> Contact Information
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase">Email Address</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase">Phone Number</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.phone || '—'}</p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Residential Address</p>
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                          {item.address || 'Address not provided in system.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'job' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4 flex items-center gap-2">
                       <Briefcase className="w-3 h-3" /> Employment Details
                    </p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase text-xs">Primary Designation</p>
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {item.role || 'STAFF'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Department</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.department_name || 'Not assigned to a department'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Employment Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn("w-2 h-2 rounded-full", item.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500')} />
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.status || 'Active'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm text-left">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4">Organizational Hierarchy</p>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-zinc-100 dark:before:bg-zinc-800">
                      <div className="relative before:absolute before:-left-[1.35rem] before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-indigo-600 before:border-4 before:border-white dark:before:border-zinc-900">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Direct Manager / HOD</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.reports_to_name || 'Directing to School Admin'}</p>
                      </div>
                      <div className="relative before:absolute before:-left-[1.35rem] before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-zinc-400 before:border-4 before:border-white dark:before:border-zinc-900">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Reporting Lines</p>
                        <p className="text-xs font-semibold text-zinc-500 italic">No subordinates assigned to this profile.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'system' && (
              <div className="animate-in fade-in zoom-in-95 duration-300 text-left">
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                         <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">System Permissions</h4>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Current access level configuration</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-3">Primary Role Authorization</p>
                        <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm w-fit min-w-[200px]">
                           <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                              <UserCheck className="w-4 h-4" />
                           </div>
                           <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.role || 'STAFF'}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-3">Additional Authorized Modules</p>
                        <div className="flex flex-wrap gap-2">
                           {item.additional_roles && item.additional_roles.length > 0 ? (
                             item.additional_roles.map((r: string) => (
                               <span key={r} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">
                                 {r}
                               </span>
                             ))
                           ) : (
                             <p className="text-xs font-semibold text-zinc-500 italic">No additional system roles assigned.</p>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderStaffForm = (item: any) => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
        <div className="flex items-center gap-4 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black">
            {item?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{item?.name || 'Staff Member'}</h3>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{item?.role} • {item?.staff_id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Full Name</label>
            <input 
              name="name" 
              defaultValue={item?.name} 
              readOnly
              className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none cursor-not-allowed text-zinc-500 dark:text-zinc-500 shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Email Address</label>
            <input 
              name="email" 
              defaultValue={item?.email} 
              required
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Phone Number</label>
            <input 
              name="phone" 
              defaultValue={item?.phone} 
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Date of Birth</label>
            <input 
              type="date"
              name="date_of_birth" 
              defaultValue={formatDateForInput(item?.date_of_birth)} 
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Residential Address</label>
            <textarea 
              name="address" 
              defaultValue={item?.address}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm min-h-[100px]"
            />
          </div>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
          <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
            Staff data integrity is vital. Changes to core personal information like phone numbers or mailing addresses will be finalized immediately, while others may require admin verification.
          </p>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <DataTable
          title="My Personal Profile"
          data={data}
          onView={(item) => {
            setViewItem(item);
            setIsEditing(false);
          }}
          onEdit={(item) => {
            setViewItem(item);
            setIsEditing(true);
          }}
          onSave={async (values) => {
             if (onSave) await onSave(values);
             setIsEditing(false);
          }}
          initialViewItem={data[0]}
          renderForm={(item, isViewOnly, onEditRequest) => {
            if (isEditing && item) {
              return renderStaffForm(item);
            }
            return (
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm text-left">
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-8 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                         <div className="relative group">
                            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-200 dark:shadow-none transition-transform group-hover:scale-105 duration-500">
                               {item?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-xl border-4 border-white dark:border-zinc-900 shadow-lg">
                               <ShieldCheck className="w-4 h-4" />
                            </div>
                         </div>
                         <div className="text-center sm:text-left">
                            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight -mb-1">{item?.name}</h2>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{item?.role} • {item?.staff_id}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                               <span className={cn(
                                 "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                 item?.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                               )}>
                                 {item?.status || 'Active'}
                               </span>
                            </div>
                         </div>
                      </div>
                       <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2">
                         <button 
                           type="button"
                           onClick={() => {
                             setIsEditing(true);
                             if (onEditRequest && item) onEditRequest(item);
                           }}
                           className="flex-1 sm:flex-none px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
                         >
                            <Edit2 className="w-4 h-4" />
                            Edit Profile
                         </button>
                         {onExitStaff && item?.status === "Active" && (
                           <button 
                             type="button"
                             onClick={() => setExitingStaff(item)}
                             className="flex-1 sm:flex-none px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all shadow-rose-500/20"
                           >
                              <UserMinus className="w-4 h-4" />
                              Exit Staff
                           </button>
                         )}
                       </div>
                    </div>

                   {renderProfileTabs(item)}
                </div>
              </div>
            );
          }}
          columns={[
            { header: 'Staff Name', accessor: 'name', className: 'font-bold text-zinc-900 dark:text-white' },
            { header: 'Staff ID', accessor: 'staff_id', className: 'font-mono text-xs text-indigo-600' },
            { header: 'Role/Position', accessor: 'role' },
            { header: 'Email', accessor: 'email' },
            {
              header: 'Status',
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {item.status || 'Active'}
                </span>
              )
            }
          ]}
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
                You are initiating the exit process. This will create a record in Exit Management for administrative clearance.
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
};

export const ExamModules = {
  ExamSchedules: ({ role, wards }: { role?: UserRole, wards?: Ward[] }) => {
    const [selectedWardId, setSelectedWardId] = useState(wards?.[0]?.id || "");
    
    const data = [
      { id: '1', exam: 'Mid-Term', subject: 'Mathematics', date: '2024-04-15', time: '09:00 AM', wardId: 'w1' },
      { id: '2', exam: 'Mid-Term', subject: 'Physics', date: '2024-04-16', time: '10:30 AM', wardId: 'w1' },
      { id: '3', exam: 'Finals', subject: 'English', date: '2024-06-10', time: '08:00 AM', wardId: 'w1' },
      { id: '4', exam: 'Mid-Term', subject: 'Science', date: '2024-04-15', time: '09:00 AM', wardId: 'w2' },
      { id: '5', exam: 'Mid-Term', subject: 'History', date: '2024-04-16', time: '10:30 AM', wardId: 'w2' },
    ];

    const filteredData = role === 'PARENT' 
      ? data.filter(d => d.wardId === selectedWardId)
      : role === 'STUDENT'
        ? data.filter(d => d.wardId === 'w1')
        : data;

    return (
      <div className="space-y-4">
        {role === 'PARENT' && wards && wards.length > 1 && (
          <div className="flex items-center gap-2 mb-4 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
            <span className="text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Ward:</span>
            <select 
              value={selectedWardId} 
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none pr-4"
            >
              {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <DataTable 
          title="Exam Schedules" 
          data={filteredData}
          columns={[
            { header: 'Exam Name', accessor: 'exam', className: 'font-bold' },
            { header: 'Subject', accessor: 'subject' },
            { header: 'Date', accessor: 'date' },
            { header: 'Time', accessor: 'time' },
          ]}
        />
      </div>
    );
  },
  ResultsManagement: ({ role, wards, selectedWardId, data = [], classes = [], exams = [], reportCardTemplates = [], organization }: any) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
    const [performanceGroupBy, setPerformanceGroupBy] = useState<'class' | 'subject' | 'term'>('class');
    const [selectedPerformanceGroup, setSelectedPerformanceGroup] = useState<any>(null);
    const [historyGroupBy, setHistoryGroupBy] = useState<'class' | 'subject'>('class');
    const [selectedHistoryGroup, setSelectedHistoryGroup] = useState<any>(null);
    const [showReportCard, setShowReportCard] = useState<any>(null);

    // Filter and normalize results with Rank calculation
    const summarizedResults = useMemo(() => {
      const studentId = (role === 'PARENT' || role === 'STUDENT') ? selectedWardId : null;
      const filtered = data.filter((r: any) => {
        if (studentId) return String(r.student_id) === String(studentId);
        return true;
      });

      // Group by exam to calculate ranks
      const groups: Record<string, any[]> = {};
      filtered.forEach((r: any) => {
        const examId = r.exam_id || `${r.class_id}-${r.subject_id}`;
        if (!groups[examId]) groups[examId] = [];
        groups[examId].push({ ...r, scoreNum: parseFloat(r.score) || 0 });
      });

      const allProcessed: any[] = [];
      Object.keys(groups).forEach(examId => {
        const examGroup = groups[examId];
        examGroup.sort((a, b) => b.scoreNum - a.scoreNum);
        
        examGroup.forEach((res, index) => {
          const cls = classes.find((c: any) => String(c.id) === String(res.class_id));
          if (index > 0 && res.scoreNum === examGroup[index - 1].scoreNum) {
            res.rank = examGroup[index - 1].rank;
          } else {
            res.rank = index + 1;
          }
          allProcessed.push({
            ...res,
            id: res.id || `${res.student_id}-${res.exam_id}`,
            class_name: cls?.name || res.class_name || 'N/A',
            totalScore: res.scoreNum,
            caScore: res.ca_score || '—',
            examScore: res.exam_score || '—',
            grade: res.grade || (res.scoreNum >= 70 ? 'A' : res.scoreNum >= 60 ? 'B' : res.scoreNum >= 50 ? 'C' : 'F'),
            term: res.term || organization?.current_term || 'Term 1',
            academic_year: res.academic_year || organization?.academic_year || '2025/2026',
            created_at: res.created_at || new Date().toISOString()
          });
        });
      });
      return allProcessed;
    }, [data, role, selectedWardId, classes, organization]);

    // History Summary (Grouped by Class or Subject)
    const historySummary = useMemo(() => {
      const groups: Record<string, any> = {};
      summarizedResults.forEach((r: any) => {
        const key = historyGroupBy === 'class' ? r.class_name : r.subject_name;
        if (!groups[key]) {
          groups[key] = {
            id: key,
            name: key || 'Unassigned',
            resultCount: 0,
            lastUpdate: r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'
          };
        }
        groups[key].resultCount++;
      });
      return Object.values(groups);
    }, [summarizedResults, historyGroupBy]);

    // Grouping for cards
    const performanceSummaryGroups = useMemo(() => {
      const groups: Record<string, any> = {};
      summarizedResults.forEach((r: any) => {
        const key = performanceGroupBy === 'term' ? r.term : (performanceGroupBy === 'class' ? r.class_name : r.subject_name);
        if (!groups[key]) {
          groups[key] = { id: key, name: key, scoreSum: 0, studentCount: 0 };
        }
        groups[key].scoreSum += r.totalScore;
        groups[key].studentCount += 1;
      });
      return Object.values(groups).map((g: any) => ({
        ...g,
        avgScore: (g.scoreSum / g.studentCount).toFixed(1)
      }));
    }, [summarizedResults, performanceGroupBy]);

    const isRestrictedRole = role === 'PARENT' || role === 'STUDENT';

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Academic Results</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{isRestrictedRole ? 'summary' : performanceGroupBy} summary — {(organization as any)?.academic_year || '2025/2026'}</p>
            </div>
          </div>
          {!isRestrictedRole && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <button onClick={() => setPerformanceGroupBy('class')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", performanceGroupBy === 'class' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500")}>By Class</button>
                <button onClick={() => setPerformanceGroupBy('subject')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", performanceGroupBy === 'subject' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500")}>By Subject</button>
                <button onClick={() => setPerformanceGroupBy('term')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", performanceGroupBy === 'term' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500")}>By Term</button>
              </div>
              <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn("px-6 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'history' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700")}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={cn("px-6 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'summary' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700")}
                >
                  Summary
                </button>
              </div>
            </div>
          )}
        </div>

        {!isRestrictedRole && activeTab === 'history' ? (
          <div className="space-y-6">
            {!selectedHistoryGroup ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Results History</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Select a group to explore records</p>
                  </div>
                  <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    <button onClick={() => setHistoryGroupBy('class')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", historyGroupBy === 'class' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500")}>By Class</button>
                    <button onClick={() => setHistoryGroupBy('subject')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", historyGroupBy === 'subject' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500")}>By Subject</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historySummary.map((group: any) => (
                    <div key={group.id} className="group p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all duration-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
                      
                      <div className="relative space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform duration-500">
                            {historyGroupBy === 'class' ? <Building2 className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Records</p>
                            <h4 className="text-2xl font-black text-zinc-900 dark:text-white leading-none tracking-tight">{group.resultCount}</h4>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{group.name}</h3>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Grouped By {historyGroupBy}</p>
                        </div>

                        <button 
                          onClick={() => setSelectedHistoryGroup(group)}
                          className="w-full py-4 bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group/btn"
                        >
                          Explore History
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedHistoryGroup(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 border border-zinc-200 dark:border-zinc-700 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{selectedHistoryGroup.name} History</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Detailed Records</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mt-6">
                  {summarizedResults.filter((r: any) => historyGroupBy === 'class' ? String(r.class_name) === String(selectedHistoryGroup.name) : String(r.subject_name) === String(selectedHistoryGroup.name)).map((r: any) => (
                    <div key={r.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] hover:border-indigo-100 dark:hover:border-indigo-900/10 transition-colors shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                               <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{r.student_name}</h4>
                               <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{historyGroupBy === 'class' ? r.subject_name : r.class_name} — {r.term}</p>
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
                              <span>Academic Year: {r.academic_year}</span>
                              {r.rank && <span>Rank: {r.rank}{['st','nd','rd'][r.rank-1] || 'th'}</span>}
                            </div>
                            <span className="text-indigo-600 font-black">Total: {r.totalScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {!selectedPerformanceGroup ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {performanceSummaryGroups.map((group: any) => (
                  <div key={group.id} className="group p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all duration-500 relative overflow-hidden">
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

                      {!isRestrictedRole && (
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{group.name}</h3>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Type: {performanceGroupBy.toUpperCase()}</p>
                        </div>
                      )}

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
                              setShowReportCard({
                                name: item.student_name,
                                id: item.admission_no || item.student_id || String(item.id).slice(0, 8),
                                grade: item.class_name,
                                term: item.term,
                                academicYear: item.academic_year,
                                results: termResults.map(sr => ({
                                  subject: sr.subject_name,
                                  classScore: sr.ca_score,
                                  examScore: sr.exam_score,
                                  score: sr.totalScore,
                                  grade: sr.grade
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
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setSelectedPerformanceGroup(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 border border-zinc-200 dark:border-zinc-700 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                  {!isRestrictedRole && (
                    <div>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{selectedPerformanceGroup.name} Performance</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Visual Analysis Mode</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {summarizedResults.filter((r: any) => performanceGroupBy === 'term' ? r.term === selectedPerformanceGroup.name : (performanceGroupBy === 'class' ? (String(r.class_id) === String(selectedPerformanceGroup.id) || String(r.class_name) === String(selectedPerformanceGroup.name)) : (String(r.subject_id) === String(selectedPerformanceGroup.id) || String(r.subject_name) === String(selectedPerformanceGroup.name)))).map((r: any) => (
                    <div key={r.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] hover:border-indigo-100 dark:hover:border-indigo-900/10 transition-colors shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                               {!isRestrictedRole && <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{r.student_name}</h4>}
                               {!isRestrictedRole && <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{performanceGroupBy === 'class' ? r.subject_name : r.class_name}</p>}
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
                                {r.rank && <span>Rank: {r.rank}{['st','nd','rd'][r.rank-1] || 'th'}</span>}
                                <span className="text-indigo-600 font-black">Total: {r.totalScore}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showReportCard && organization && (
          <ReportCardPreview 
            template={reportCardTemplates.find((t: any) => String(t.id) === String(classes.find((c: any) => c.name === showReportCard.grade)?.report_card_template_id))} 
            organization={organization} 
            student={showReportCard} 
            onClose={() => setShowReportCard(null)} 
          />
        )}
      </div>
    );
  },
};

export const ELearningModules = {
  CBTExam: ({ subjects, classes, role, instructorId }: { subjects: any[], classes: any[], role?: string, instructorId?: string }) => {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingExam, setEditingExam] = useState<any>(null);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [viewQuestions, setViewQuestions] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [viewSubmissions, setViewSubmissions] = useState(false);
    const [submissions, setSubmissions] = useState<any[]>([]);

    // Student specific states
    const [isTakingExam, setIsTakingExam] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [showStartConfirm, setShowStartConfirm] = useState(false);
    const [pendingExam, setPendingExam] = useState<any>(null);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [examResult, setExamResult] = useState<{ score: number; total: number; exam: any } | null>(null);

    const isStudent = role === 'STUDENT' || role === 'PARENT';

    // Form states
    const defaultForm = { title: '', description: '', class_id: '', class_ids: [] as string[], subject_id: '', duration_minutes: 60, start_time: '', end_time: '', max_attempts: 1, total_marks: 0 };
    const [formData, setFormData] = useState(defaultForm);

    const [questionForm, setQuestionForm] = useState({
      question_text: '', options: ['', '', '', ''], correct_option_index: 0
    });

    const fetchData = async () => {
      try {
        const res = await api.get('/elearning/cbt-exams');
        const data = res.data;
        let examsList = Array.isArray(data) ? data : [];
        if (role === 'STAFF' && instructorId) {
          examsList = examsList.filter((e: any) => String(e.created_by) === String(instructorId) || String(e.teacher_id) === String(instructorId));
        }
        setExams(examsList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchQuestions = async (examId: string) => {
      try {
        const res = await api.get(`/elearning/cbt-exams/${examId}/questions`);
        const data = res.data;
        const questionList = Array.isArray(data) ? data : [];
        setQuestions(questionList);
        return questionList;
      } catch (err) {
        console.error(err);
        setQuestions([]);
        return [];
      }
    };

    const fetchSubmissions = async (examId: string) => {
      try {
        const res = await api.get(`/elearning/cbt-submissions?exam_id=${examId}`);
        const data = res.data;
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setSubmissions([]);
      }
    };

    const openCreateModal = () => {
      setEditingExam(null);
      setFormData(defaultForm);
      setShowCreateModal(true);
    };

    const openEditModal_exam = (exam: any) => {
      const classIds = Array.isArray(exam.class_ids) && exam.class_ids.length > 0 ? exam.class_ids : (exam.class_id ? [exam.class_id] : []);
      setEditingExam(exam);
      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        class_id: exam.class_id || '',
        class_ids: classIds,
        subject_id: exam.subject_id || '',
        duration_minutes: exam.duration_minutes || 60,
        start_time: exam.start_time ? exam.start_time.slice(0, 16) : '',
        end_time: exam.end_time ? exam.end_time.slice(0, 16) : '',
        max_attempts: exam.max_attempts || 1,
        total_marks: exam.total_marks || 0
      });
      setShowCreateModal(true);
    };

    const handleCreateExam = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const isEditing = !!editingExam;
        const primaryClassId = formData.class_id || (formData.class_ids.length > 0 ? formData.class_ids[0] : null);
        const payload = { ...formData, class_id: primaryClassId };
        const res = isEditing
          ? await api.patch(`/elearning/cbt-exams/${editingExam.id}`, payload)
          : await api.post('/elearning/cbt-exams', payload);
        setShowCreateModal(false);
          setEditingExam(null);
          setFormData(defaultForm);
          fetchData();
          (window as any).showToast?.(isEditing ? 'CBT Exam updated successfully!' : 'CBT Exam created successfully!', 'success');
      } catch (err) {
        console.error(err);
      }
    };

    const handleTakeExam = async (exam: any) => {
      setPendingExam(exam);
      setShowStartConfirm(true);
    };

    const doStartExam = async () => {
      if (!pendingExam) return;
      setShowStartConfirm(false);
      const qList = await fetchQuestions(pendingExam.id);
      if (qList.length === 0) {
        (window as any).showToast?.('No questions found for this exam.', 'error');
        return;
      }
      setSelectedExam(pendingExam);
      setIsTakingExam(true);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setExamResult(null);
      setTimeLeft(pendingExam.duration_minutes * 60);
    };

    const handleFinishExam = async () => {
      if (!selectedExam) return;
      setShowSubmitConfirm(true);
    };

    const doFinishExam = async () => {
      if (!selectedExam) return;
      setShowSubmitConfirm(false);
      try {
        const res = await api.post('/elearning/cbt-submit', { 
          exam_id: selectedExam.id,
          answers: answers 
        });
        // Compute score client-side — reliable even if backend returns NaN (null points)
          const correctCount = questions.reduce((acc, q) => {
            return acc + (answers[q.id] !== undefined && answers[q.id] === q.correct_option_index ? 1 : 0);
          }, 0);
          setIsTakingExam(false);
          setExamResult({ score: correctCount, total: questions.length, exam: selectedExam });
          fetchData();
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      let timer: any;
      if (isTakingExam && timeLeft > 0) {
        timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      } else if (isTakingExam && timeLeft === 0 && questions.length > 0) {
        doFinishExam();
      }
      return () => clearInterval(timer);
    }, [isTakingExam, timeLeft]);

    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const isEditing = !!editingQuestionId;
        const res = isEditing
          ? await api.patch(`/elearning/cbt-questions/${editingQuestionId}`, { ...questionForm, exam_id: selectedExam.id })
          : await api.post('/elearning/cbt-questions', { ...questionForm, exam_id: selectedExam.id });
        setShowAddQuestionModal(false);
          setEditingQuestionId(null);
          fetchQuestions(selectedExam.id);
          setQuestionForm({ question_text: '', options: ['', '', '', ''], correct_option_index: 0 });
          (window as any).showToast?.(isEditing ? 'Question updated successfully!' : 'Question added successfully!', 'success');
      } catch (err) {
        console.error(err);
      }
    };

    const handleDeleteQuestion = async (id: string) => {
      if (!confirm('Are you sure you want to delete this question?')) return;
      try {
        const res = await api.delete(`/elearning/cbt-questions/${id}`);
        fetchQuestions(selectedExam.id);
          (window as any).showToast?.('Question deleted successfully!', 'success');
      } catch (err) {
        console.error(err);
      }
    };

    const openEditModal = (q: any) => {
      setQuestionForm({
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : ['', '', '', '']),
        correct_option_index: q.correct_option_index
      });
      setEditingQuestionId(q.id);
      setShowAddQuestionModal(true);
    };

    const handleToggleStatus = async (exam: any) => {
      const newStatus = exam.status === 'Live' ? 'Draft' : 'Live';
      try {
        const res = await api.patch(`/elearning/cbt-exams/${exam.id}`, { ...exam, status: newStatus });
        fetchData();
          (window as any).showToast?.(`Exam status changed to ${newStatus}!`, 'success');
      } catch (err) {
        console.error(err);
      }
    };

    const handleDeleteExam = async (id: string) => {
      if (!confirm('Are you sure you want to delete this exam?')) return;
      try {
        const res = await api.delete(`/elearning/cbt-exams/${id}`);
        fetchData();
          (window as any).showToast?.('Exam deleted successfully!', 'success');
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => { fetchData(); }, []);

    // Auto-update exam statuses based on start_time/end_time every 30 seconds
    useEffect(() => {
      const autoUpdate = async () => {
        try {
          const res = await api.post('/elearning/cbt-exams/auto-update-status');
          {
            const result = res.data;
            // Only re-fetch if something actually changed
            if (result.went_live?.length > 0 || result.ended?.length > 0) {
              fetchData();
            }
          }
        } catch (err) {
          console.error('Auto-status update failed:', err);
        }
      };
      autoUpdate(); // run immediately on mount
      const interval = setInterval(autoUpdate, 30000); // then every 30s
      return () => clearInterval(interval);
    }, []);

    // ── Results screen ────────────────────────────────────────────────
    if (examResult) {
      const pct = Math.round((examResult.score / examResult.total) * 100);
      const passed = pct >= 50;
      return (
        <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-[100] flex items-center justify-center p-8">
          <div className="max-w-lg w-full text-center">
            <div className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl font-black",
              passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {passed ? '🎉' : '😔'}
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{examResult.exam.title}</h1>
            <p className="text-zinc-400 text-sm mb-10">{examResult.exam.subject_name}</p>

            {/* Score Ring */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f4f4f5" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={passed ? '#10b981' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-4xl font-black text-zinc-900 dark:text-white">{pct}%</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Score</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
                <p className="text-2xl font-black text-emerald-600">{examResult.score}</p>
                <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Correct</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
                <p className="text-2xl font-black text-red-500">{examResult.total - examResult.score}</p>
                <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Wrong</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{examResult.total}</p>
                <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Total</p>
              </div>
            </div>

            <div className={cn(
              "inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-10",
              passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}>
              {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {passed ? 'Congratulations — You Passed!' : 'Keep Practising — You Can Do It!'}
            </div>

            <button
              onClick={() => setExamResult(null)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Back to Exams
            </button>
          </div>
        </div>
      );
    }

    if (isTakingExam && selectedExam && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      const options = Array.isArray(currentQuestion.options) 
        ? currentQuestion.options 
        : (typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : []);

      return (
        <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 z-[100] flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            {/* Exam Info */}
            <div className="mb-6">
              <span className="text-[10px] font-black tracking-widest uppercase text-indigo-500 block mb-2">In Progress</span>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{selectedExam.title}</h2>
              <p className="text-zinc-400 text-xs mt-1">{selectedExam.subject_name}</p>
            </div>

            {/* Timer */}
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-2xl mb-6",
              timeLeft < 300 ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700/30" : "bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800/30"
            )}>
              <Clock className={cn("w-5 h-5 flex-shrink-0", timeLeft < 300 ? "text-red-500 animate-pulse" : "text-indigo-500")} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Time Left</p>
                <p className={cn("text-2xl font-black tabular-nums", timeLeft < 300 ? "text-red-500" : "text-indigo-600 dark:text-indigo-400")}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-emerald-600">{Object.keys(answers).length}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Answered</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-zinc-900 dark:text-white">{questions.length - Object.keys(answers).length}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Remaining</p>
              </div>
            </div>

            {/* Question Map */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Question Map</p>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={cn(
                      "h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all",
                      i === currentQuestionIndex
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                        : answers[q.id] !== undefined
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-auto pt-6">
              <button
                onClick={() => role !== 'PARENT' && setShowSubmitConfirm(true)}
                disabled={role === 'PARENT'}
                className={cn(
                  "w-full py-3.5 text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2",
                  role === 'PARENT' 
                    ? "bg-zinc-400 cursor-not-allowed opacity-50" 
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {role === 'PARENT' ? 'View Only Mode' : 'Submit Exam'}
              </button>
            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1 flex flex-col overflow-y-auto p-8 lg:p-12 bg-zinc-50 dark:bg-zinc-950">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Question {currentQuestionIndex + 1} <span className="text-zinc-300">of</span> {questions.length}
                </span>
                <span className="text-xs font-bold text-indigo-600">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="flex-1 max-w-3xl w-full">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 mb-8 shadow-sm">
                <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                  Question {currentQuestionIndex + 1}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {options.map((opt: string, idx: number) => {
                  const isSelected = answers[currentQuestion.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                      className={cn(
                        "w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 group",
                        isSelected
                          ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20 dark:border-indigo-500"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all",
                        isSelected ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={cn("font-semibold text-sm md:text-base flex-1 leading-relaxed", isSelected ? "text-indigo-800 dark:text-indigo-200" : "text-zinc-700 dark:text-zinc-300")}>
                        {opt}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-10">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-sm disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Previous
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => role !== 'PARENT' && setShowSubmitConfirm(true)}
                    disabled={role === 'PARENT'}
                    className={cn(
                      "flex items-center gap-2 px-8 py-3 text-white rounded-2xl font-bold text-sm transition-all shadow-lg",
                      role === 'PARENT'
                        ? "bg-zinc-400 cursor-not-allowed opacity-50"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {role === 'PARENT' ? 'View Only' : 'Submit Answers'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit confirm modal — must be INSIDE this return or it never renders */}
          <Modal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Exam?">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                You have answered <strong>{Object.keys(answers).length}</strong> of <strong>{questions.length}</strong> questions.
              </p>
              {Object.keys(answers).length < questions.length && (
                <p className="text-amber-600 text-xs font-semibold mb-4">⚠️ You have {questions.length - Object.keys(answers).length} unanswered question(s).</p>
              )}
              <p className="text-zinc-500 text-xs mb-6">Your answers cannot be changed after submission.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Keep Working</button>
                <button onClick={doFinishExam} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all">Submit</button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // ── Confirm Modals (rendered outside exam view) ──────────────────────
    const startConfirmModal = (
      <Modal isOpen={showStartConfirm} onClose={() => setShowStartConfirm(false)} title="Start Exam?">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
            The timer will start immediately once you begin. Make sure you're ready before proceeding.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowStartConfirm(false)} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Cancel</button>
            <button onClick={doStartExam} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">Start Now</button>
          </div>
        </div>
      </Modal>
    );

    const submitConfirmModal = (
      <Modal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Exam?">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
            You have answered <strong>{Object.keys(answers).length}</strong> of <strong>{questions.length}</strong> questions.
          </p>
          {Object.keys(answers).length < questions.length && (
            <p className="text-amber-600 text-xs font-semibold mb-4">⚠️ You have {questions.length - Object.keys(answers).length} unanswered question(s).</p>
          )}
          <p className="text-zinc-500 text-xs mb-6">Your answers cannot be changed after submission.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Keep Working</button>
            <button onClick={doFinishExam} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all">Submit</button>
          </div>
        </div>
      </Modal>
    );

    if (viewSubmissions && selectedExam && !isStudent) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewSubmissions(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">{selectedExam.title} - Submissions</h2>
                <p className="text-zinc-500 text-sm">View student records and performance.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-sm">
                Total Submissions: {submissions.length}
              </div>
            </div>
          </div>

          <DataTable
            title="Submissions"
            data={submissions}
            columns={[
              { header: 'Student Name', accessor: 'student_name', className: 'font-bold' },
              { header: 'Score', accessor: (item: any) => (
                <span className="font-bold text-indigo-600">{item.score}</span>
              ) },
              { header: 'Status', accessor: (item: any) => (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600">
                  Graded
                </span>
              ) }
            ]}
          />
        </div>
      );
    }

    if (viewQuestions && selectedExam && !isStudent) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewQuestions(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">{selectedExam.title} - Questions</h2>
                <p className="text-zinc-500 text-sm">Manage questions for this CBT exam.</p>
              </div>
            </div>
            <button 
              onClick={() => { setEditingQuestionId(null); setQuestionForm({ question_text: '', options: ['', '', '', ''], correct_option_index: 0 }); setShowAddQuestionModal(true); }} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {Array.isArray(questions) && questions.map((q, i) => {
              const options = Array.isArray(q.options) 
                ? q.options 
                : (typeof q.options === 'string' ? JSON.parse(q.options) : []);
                
              return (
                <div key={q.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md uppercase">Question {i + 1}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(q)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-4">{q.question_text}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.isArray(options) && options.map((opt: string, idx: number) => (
                      <div key={idx} className={cn(
                        "p-3 rounded-xl border text-sm font-medium flex items-center gap-3",
                        idx === q.correct_option_index 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" 
                          : "bg-zinc-50 border-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-400"
                      )}>
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          idx === q.correct_option_index ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(!Array.isArray(questions) || questions.length === 0) && (
              <div className="py-20 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">No questions found for this exam.</p>
              </div>
            )}
          </div>

          <Modal isOpen={showAddQuestionModal} onClose={() => { setShowAddQuestionModal(false); setEditingQuestionId(null); setQuestionForm({ question_text: '', options: ['', '', '', ''], correct_option_index: 0 }); }} title={editingQuestionId ? "Edit Question" : "Add Question"}>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Question Text</label>
                <textarea 
                  required
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" 
                />
              </div>
              <div className="grid grid-cols-1 gap-6 mt-4">
                {questionForm.options.map((opt, i) => (
                  <div key={i} className="group flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent hover:border-indigo-500 transition-all">
                    <div className="pt-1">
                      <input 
                        type="radio"
                        name="correct_option"
                        id={`opt-${i}`}
                        checked={questionForm.correct_option_index === i}
                        onChange={() => setQuestionForm({ ...questionForm, correct_option_index: i })}
                        className="w-5 h-5 cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                       <label htmlFor={`opt-${i}`} className="text-[10px] font-black uppercase text-zinc-400 tracking-widest cursor-pointer group-hover:text-indigo-600">Option {String.fromCharCode(65 + i)}</label>
                       <input 
                         required
                         value={opt}
                         onChange={(e) => {
                           const newOptions = [...questionForm.options];
                           newOptions[i] = e.target.value;
                           setQuestionForm({ ...questionForm, options: newOptions });
                         }}
                         className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                         placeholder={`Enter option ${String.fromCharCode(65 + i)} text...`}
                       />
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm mt-4">{editingQuestionId ? "Update Question" : "Save Question"}</button>
            </form>
          </Modal>
        </div>
      );
    }

    // Define extra actions for the "three dots" menu (Staff only)
    const renderExtraActions = (item: any) => (
      <div className="p-1.5 space-y-0.5">
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            setSelectedExam(item); 
            setViewSubmissions(true); 
            fetchSubmissions(item.id); 
          }}
          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
        >
          <ClipboardCheck className="w-4 h-4" />
          Submissions
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            setSelectedExam(item); 
            setViewQuestions(true); 
            fetchQuestions(item.id); 
          }}
          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
        >
          <Layers className="w-4 h-4" />
          Questions
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            if (item.status !== 'Ended') handleToggleStatus(item); 
          }}
          disabled={item.status === 'Ended'}
          className={cn(
            "flex items-center w-full gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
            item.status === 'Ended' 
              ? "opacity-30 cursor-not-allowed text-zinc-400" 
              : item.status === 'Live' ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
          )}
        >
          <Globe className="w-4 h-4" />
          {item.status === 'Live' ? 'Revert to Draft' : 'Publish'}
        </button>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{isStudent ? 'My CBT Exams' : 'CBT Exam Management'}</h2>
            <p className="text-zinc-500 text-sm">{isStudent ? 'Take and track your computer-based tests.' : 'Create and schedule computer-based tests.'}</p>
          </div>
          {!isStudent && (
            <button 
              onClick={openCreateModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New CBT Exam
            </button>
          )}
        </div>

        <DataTable 
          title={isStudent ? "Available Exams" : "Scheduled Exams"}
          data={exams}
          onEdit={!isStudent ? openEditModal_exam : undefined}
          onDelete={!isStudent ? (item: any) => handleDeleteExam(item.id) : undefined}
          extraActions={!isStudent ? renderExtraActions : undefined}
          columns={[
            { header: 'Title', accessor: 'title', className: 'font-bold' },
            { header: 'Class', accessor: 'class_name' },
            { header: 'Subject', accessor: 'subject_name' },
            { header: 'Duration', accessor: (item: any) => `${item.duration_minutes} mins` },
            { 
              header: 'Status', 
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit",
                  item.status === 'Live' ? "bg-emerald-50 text-emerald-600" :
                  item.status === 'Ended' ? "bg-red-50 text-red-500" :
                  "bg-zinc-100 text-zinc-500"
                )}>
                  {item.status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />}
                  {item.status}
                </span>
              )
            },
            ...(isStudent ? [
              {
                header: 'Attempts',
                accessor: (item: any) => (
                  <span className="text-xs font-semibold text-zinc-500">
                    {item.attempt_count || 0} / {item.max_attempts || 1}
                  </span>
                )
              },
              {
                header: 'Best Score',
                accessor: (item: any) => {
                  if (item.score === null) return '-';
                  const total = parseFloat(item.total_marks) || 0;
                  const score = parseFloat(item.score) || 0;
                  const percentage = total > 0 ? ((score / total) * 100).toFixed(0) : 0;
                  return (
                    <div className="flex flex-col">
                      <span className="font-bold text-indigo-600">{percentage}%</span>
                      <span className="text-[10px] text-zinc-400">({score} / {total})</span>
                    </div>
                  );
                }
              },
              {
                header: 'Actions',
                accessor: (item: any) => {
                  const attemptsReached = (item.attempt_count || 0) >= (item.max_attempts || 1);
                  return (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleTakeExam(item)}
                        disabled={item.status !== 'Live' || (role !== 'PARENT' && attemptsReached)}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                          (role !== 'PARENT' && attemptsReached)
                            ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                            : item.status === 'Live'
                              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                              : item.status === 'Ended'
                                ? "bg-red-50 text-red-400 cursor-not-allowed"
                                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        )}
                      >
                        {role === 'PARENT' 
                          ? 'View Exam' 
                          : attemptsReached ? 'Limit Reached' : item.status === 'Live' ? 'Take Exam' : item.status === 'Ended' ? 'Exam Ended' : 'Not Started'}
                      </button>
                    </div>
                  );
                }
              }
            ] : []),
          ]}
        />

        <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setEditingExam(null); setFormData(defaultForm); }} title={editingExam ? 'Edit CBT Exam' : 'Create CBT Exam'}>
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Exam Title</label>
                <input 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Duration (Minutes)</label>
                <input 
                  type="number"
                  required
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Target Classes</label>
                <SearchableSelect 
                  name="class_ids"
                  multiple
                  placeholder="Select one or more classes..."
                  options={classes.map(c => ({ value: c.id, label: c.name, sublabel: c.section }))}
                  defaultValue={formData.class_ids}
                  onValueChange={(val) => setFormData({ ...formData, class_ids: val as string[] })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Subject</label>
                <SearchableSelect 
                  name="subject_id"
                  placeholder="Select Subject"
                  options={subjects.map(s => ({ value: s.id, label: s.name || s.title }))}
                  defaultValue={formData.subject_id}
                  onValueChange={(val) => setFormData({ ...formData, subject_id: val as string })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Start Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">End Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Max Attempts</label>
                <input 
                  type="number"
                  min="1"
                  required
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Total Marks</label>
                <input 
                  type="number"
                  min="0"
                  required
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" 
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm mt-4">{editingExam ? 'Update Exam' : 'Create Exam'}</button>
          </form>
        </Modal>
        {startConfirmModal}
        {submitConfirmModal}
      </div>
    );
  },

  OnlineClasses: ({ subjects, classes, role, instructorId, currentUserName }: { subjects: any[], classes: any[], role?: string, instructorId?: string, currentUserName?: string }) => {
    const [activeCall, setActiveCall] = useState<{ channel: string } | null>(null);
    const [onlineClasses, setOnlineClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      class_id: '',
      class_ids: [] as string[],
      subject_id: '',
      start_time: '',
      end_time: ''
    });

    const isStudent = role === 'STUDENT' || role === 'PARENT';

    const fetchOnlineClasses = async () => {
      try {
        const res = await api.get('/elearning/online-classes');
        const data = res.data;
        let classesList = Array.isArray(data) ? data : [];
        if (role === 'STAFF' && instructorId) {
          classesList = classesList.filter((c: any) => String(c.created_by) === String(instructorId) || String(c.teacher_id) === String(instructorId));
        }
        setOnlineClasses(classesList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // Validate required fields
        if (!formData.title?.trim()) {
          (window as any).showToast?.('Please enter a class title', 'error');
          return;
        }
        if (!formData.start_time) {
          (window as any).showToast?.('Please select a start time', 'error');
          return;
        }
        if (!formData.end_time) {
          (window as any).showToast?.('Please select an end time', 'error');
          return;
        }
        
        const classIds = formData.class_ids.length > 0 ? formData.class_ids : (formData.class_id ? [formData.class_id] : []);
        if (classIds.length === 0) {
          (window as any).showToast?.('Please select at least one class', 'error');
          return;
        }

        // Convert datetime-local to ISO 8601 format
        const startDateTime = new Date(formData.start_time);
        const endDateTime = new Date(formData.end_time);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          (window as any).showToast?.('Invalid date/time format', 'error');
          return;
        }

        if (endDateTime <= startDateTime) {
          (window as any).showToast?.('End time must be after start time', 'error');
          return;
        }

        // Generate unique channel name for Jitsi
        const channelName = `class-${formData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

        const payload = {
          title: formData.title,
          description: formData.description || '',
          subject_id: formData.subject_id || null,
          class_ids: classIds,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          teacher_id: instructorId,
          created_by: instructorId,
          channel: channelName,
          status: 'Scheduled'
        };

        const res = await api.post('/elearning/online-classes', payload);
        setShowCreateModal(false);
        setFormData({ title: '', description: '', class_id: '', class_ids: [], subject_id: '', start_time: '', end_time: '' });
        fetchOnlineClasses();
        (window as any).showToast?.('Class scheduled successfully!', 'success');
      } catch (err: any) {
        console.error(err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Failed to schedule class. Please check your internet connection.';
        (window as any).showToast?.(errorMsg, 'error');
      }
    };

    const handleDeleteClass = async (id: string) => {
      if (!confirm('Are you sure you want to delete this class?')) return;
      try {
        const res = await api.delete(`/elearning/online-classes/${id}`);
        fetchOnlineClasses();
          (window as any).showToast?.('Class deleted successfully!', 'success');
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      fetchOnlineClasses();
      const interval = setInterval(async () => {
        try {
          const res = await api.post('/elearning/online-classes/auto-update-status');
          {
            const result = res.data;
            if (result.went_live?.length > 0 || result.ended?.length > 0) {
              fetchOnlineClasses();
            }
          }
        } catch (err) { }
      }, 30000);
      return () => clearInterval(interval);
    }, []);

    if (activeCall) {
      return (
        <JitsiVideoCall 
          channel={activeCall.channel}
          userName={currentUserName || 'Teacher'}
          onClose={() => setActiveCall(null)}
        />
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Online Classes</h2>
            <p className="text-zinc-500 mt-1">{isStudent ? 'Join live virtual classrooms and interact with teachers.' : 'Schedule and manage live virtual classrooms.'}</p>
          </div>
          {!isStudent && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Schedule Class
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onlineClasses.map((c) => (
            <div key={c.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden group hover:shadow-2xl hover:shadow-indigo-600/5 transition-all duration-500">
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    c.status === 'Live' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 animate-pulse" : 
                    c.status === 'Ended' ? "bg-red-50 text-red-600 dark:bg-red-900/10" :
                    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  )}>
                    {c.status}
                  </div>
                  {!isStudent && (
                    <button 
                      onClick={() => handleDeleteClass(c.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase truncate">{c.title}</h3>
                <p className="text-zinc-500 text-sm mt-1 truncate">{c.subject_name} • {c.teacher_name}</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      {new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(c.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 truncate">
                      {new Date(c.start_time).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (c.status === 'Live') {
                      // Use channel if available, fallback to meeting_id, then generate from title
                      const roomName = c.channel || c.meeting_id || `class-${c.title?.toLowerCase().replace(/\s+/g, '-')}-${c.id}`;
                      if (!roomName) {
                        (window as any).showToast?.('Unable to join: missing room identifier', 'error');
                        return;
                      }
                      setActiveCall({ channel: roomName });
                    }
                  }}
                  disabled={c.status !== 'Live'}
                  className={cn(
                    "w-full mt-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                    c.status === 'Live' 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95" 
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  )}
                >
                  {c.status === 'Live' ? (
                    <>
                      <Video className="w-4 h-4" />
                      Join Live Class
                    </>
                  ) : c.status === 'Ended' ? (
                    'Class Ended'
                  ) : (
                    'Upcoming Session'
                  )}
                </button>
              </div>
            </div>
          ))}
          {onlineClasses.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <Video className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No Online Classes Scheduled</h3>
              <p className="text-zinc-500 mt-1">Check back later or schedule a new session.</p>
            </div>
          )}
        </div>

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule Online Class">
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Class Title <span className="text-red-500">*</span></label>
              <input 
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Advanced Calculus Morning Session"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Subject</label>
                <SearchableSelect 
                  name="subject_id"
                  placeholder="Select Subject (optional)"
                  options={subjects.map(s => ({ value: s.id, label: s.name || s.title }))}
                  defaultValue={formData.subject_id}
                  onValueChange={(val) => setFormData({ ...formData, subject_id: val as string })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Classes <span className="text-red-500">*</span></label>
                <SearchableSelect 
                  name="class_ids"
                  multiple
                  placeholder="Select one or more classes..."
                  options={classes.map(c => ({ value: c.id, label: c.name, sublabel: c.section }))}
                  defaultValue={formData.class_ids}
                  onValueChange={(val) => setFormData({ ...formData, class_ids: val as string[] })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Start Time <span className="text-red-500">*</span></label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">End Time <span className="text-red-500">*</span></label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Topics to be covered..."
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" 
              />
            </div>

            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all mt-4">
              Create Schedule
            </button>
          </form>
        </Modal>
      </div>
    );
  },

  Assignments: ({ subjects, classes, role, instructorId }: { subjects: any[], classes: any[], role?: string, instructorId?: string }) => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [viewSubmissions, setViewSubmissions] = useState(false);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [submissionContent, setSubmissionContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
      title: '', description: '', class_id: '', subject_id: '', due_date: '', total_marks: 100
    });

    const isStudent = role === 'STUDENT' || role === 'PARENT';

    const fetchData = async () => {
      try {
        const res = await api.get('/elearning/assignments');
        const data = res.data;
        let assignmentsList = Array.isArray(data) ? data : [];
        if (role === 'STAFF' && instructorId) {
          assignmentsList = assignmentsList.filter((a: any) => String(a.created_by) === String(instructorId) || String(a.teacher_id) === String(instructorId));
        }
        setAssignments(assignmentsList);
      } catch (err) {
        console.error(err);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubmissions = async (assignmentId: string) => {
      try {
        const res = await api.get(`/elearning/submissions?assignment_id=${assignmentId}`);
        const data = res.data;
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setSubmissions([]);
      }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await api.post('/elearning/assignments', formData);
        if (res.status === 200 || res.status === 201) {
          setShowCreateModal(false);
          fetchData();
          (window as any).showToast?.('Assignment created successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleSubmitAssignment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAssignment) return;
      setIsSubmitting(true);
      try {
        const res = await api.post(`/elearning/assignments/${selectedAssignment.id}/submit`, {
            assignment_id: selectedAssignment.id,
            content: submissionContent
          });
        if (res.status === 200 || res.status === 201) {
          setShowSubmitModal(false);
          setSubmissionContent('');
          fetchData();
          (window as any).showToast?.('Assignment submitted successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDeleteAssignment = async (id: string) => {
      if (!confirm('Are you sure you want to delete this assignment?')) return;
      try {
        const res = await api.delete(`/elearning/assignments/${id}`);
        if (res.status === 200 || res.status === 204) {
          fetchData();
          (window as any).showToast?.('Assignment deleted successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => { fetchData(); }, []);

    if (viewSubmissions && selectedAssignment && !isStudent) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewSubmissions(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Submissions - {selectedAssignment.title}</h2>
              <p className="text-zinc-500 text-sm">View and grade student submissions.</p>
            </div>
          </div>

          <DataTable 
            title="Student Submissions"
            data={submissions}
            columns={[
              { header: 'Student', accessor: 'student_name', className: 'font-bold' },
              { header: 'Submitted Date', accessor: (item: any) => new Date(item.submission_date).toLocaleDateString() },
              { header: 'Status', accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Graded' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>
                  {item.status}
                </span>
              )},
              { header: 'Score', accessor: (item: any) => item.grade || '-' },
              {
                header: 'Actions',
                accessor: (item: any) => (
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Grade
                  </button>
                )
              }
            ]}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{isStudent ? 'My Assignments' : 'Assignment Management'}</h2>
            <p className="text-zinc-500 text-sm">{isStudent ? 'View and submit your class assignments.' : 'Create, distribute, and grade student assignments.'}</p>
          </div>
          {!isStudent && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total', value: (Array.isArray(assignments) ? assignments.length : 0).toString(), color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
            { label: isStudent ? 'Submitted' : 'Active', value: (Array.isArray(assignments) ? assignments.filter(a => isStudent ? (a.status === 'Submitted' || a.status === 'Graded') : a.status === 'Active').length : 0).toString(), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
            { label: isStudent ? 'Pending' : 'Pending Grading', value: (Array.isArray(assignments) ? (isStudent ? assignments.filter(a => a.status === 'Upcoming' || a.status === 'Active').length : assignments.reduce((acc, a) => acc + (parseInt(a.submission_count) || 0), 0)) : 0).toString(), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
          ].map((stat, i) => (
            <div key={i} className={cn("p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm", stat.bg)}>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{stat.label}</p>
              <h3 className={cn("text-3xl font-black", stat.color)}>{stat.value}</h3>
            </div>
          ))}
        </div>

        <DataTable 
          title={isStudent ? "Current Assignments" : "Recent Assignments"} 
          data={assignments}
          columns={[
            { header: 'Title', accessor: 'title', className: 'font-bold' },
            { header: 'Subject', accessor: 'subject_name' },
            { header: 'Due Date', accessor: (item: any) => new Date(item.due_date).toLocaleDateString() },
            { 
              header: 'Status', 
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  (item.status === 'Active' || item.status === 'Upcoming') ? "bg-blue-50 text-blue-600" : 
                  (item.status === 'Submitted' || item.status === 'Graded') ? "bg-emerald-50 text-emerald-600" : 
                  "bg-amber-50 text-amber-600"
                )}>
                  {item.status}
                </span>
              )
            },
            {
              header: 'Actions',
              accessor: (item: any) => (
                <div className="flex gap-3">
                  {isStudent ? (
                    <button 
                      onClick={() => { setSelectedAssignment(item); setShowSubmitModal(true); }}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                        (item.status === 'Submitted' || item.status === 'Graded' || role === 'PARENT') 
                          ? "bg-zinc-100 text-zinc-500 cursor-not-allowed" 
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      )}
                      disabled={item.status === 'Submitted' || item.status === 'Graded' || role === 'PARENT'}
                    >
                      {role === 'PARENT' ? 'View Only' : (item.status === 'Submitted' || item.status === 'Graded' ? 'Submitted' : 'Submit Work')}
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setSelectedAssignment(item); setViewSubmissions(true); fetchSubmissions(item.id); }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Submissions
                      </button>
                      <button 
                        onClick={() => handleDeleteAssignment(item.id)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )
            }
          ]}
        />

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Assignment">
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Assignment Title</label>
              <input 
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Class</label>
                <SearchableSelect 
                  name="class_id"
                  placeholder="Select Class"
                  options={classes.map(c => ({ value: c.id, label: c.name, sublabel: c.section }))}
                  defaultValue={formData.class_id}
                  onValueChange={(val) => setFormData({ ...formData, class_id: val as string })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Subject</label>
                <SearchableSelect 
                  name="subject_id"
                  placeholder="Select Subject"
                  options={subjects.map(s => ({ value: s.id, label: s.name || s.title }))}
                  defaultValue={formData.subject_id}
                  onValueChange={(val) => setFormData({ ...formData, subject_id: val as string })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Due Date</label>
                <input 
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Total Marks</label>
                <input 
                  type="number"
                  required
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Description / Instructions</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" 
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm mt-4">Create Assignment</button>
          </form>
        </Modal>

        <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title={`Submit: ${selectedAssignment?.title}`}>
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 mb-2">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Instructions</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{selectedAssignment?.description || 'No specific instructions provided.'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Your Submission (Text or Cloud Link)</label>
              <textarea 
                required
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Type your response here or paste a link to your Google Drive/OneDrive file..."
                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[200px]" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </form>
        </Modal>
      </div>
    );
  },

  StudyMaterials: ({ subjects, classes, role }: { subjects: any[], classes: any[], role?: string }) => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const [formData, setFormData] = useState({
      title: '', description: '', class_id: '', subject_id: '', file_url: '', file_type: 'PDF'
    });

    const isStudent = role === 'STUDENT' || role === 'PARENT';

    const fetchData = async () => {
      try {
        const res = await api.get('/elearning/study-materials');
        const data = res.data;
        setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };


    const handleUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await api.post('/elearning/study-materials', formData);
        if (res.status === 200 || res.status === 201) {
          setShowUploadModal(false);
          fetchData();
          (window as any).showToast?.('Study Material uploaded successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this resource?')) return;
      try {
        const res = await api.delete(`/elearning/study-materials/${id}`);
        if (res.status === 200 || res.status === 204) {
          fetchData();
          (window as any).showToast?.('Resource deleted successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => { fetchData(); }, []);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Study Materials</h2>
            <p className="text-zinc-500 text-sm">{isStudent ? 'Access and download learning resources.' : 'Upload and share learning resources with students.'}</p>
          </div>
          {!isStudent && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Upload Material
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div key={m.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden group hover:shadow-lg transition-all p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                  {m.file_type?.toLowerCase().includes('pdf') ? <FileText className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                {!isStudent && (
                  <button 
                    onClick={() => handleDelete(m.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{m.title}</h3>
              <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{m.description || 'No description provided.'}</p>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{m.class_name}</span>
                  <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{m.subject_name}</span>
                </div>
                <p className="text-[10px] text-zinc-400">Uploaded on {new Date(m.created_at).toLocaleDateString()}</p>
              </div>

              <a 
                href={m.file_url} 
                target="_blank" 
                rel="noreferrer"
                className="w-full mt-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download Resource
              </a>
            </div>
          ))}
          {materials.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold">No Materials Found</h3>
              <p className="text-zinc-500 text-sm mt-1">Upload your first resource to get started.</p>
            </div>
          )}
        </div>

        <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Study Material">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Resource Title</label>
              <input 
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Class</label>
                <SearchableSelect 
                  name="class_id"
                  placeholder="Select Class"
                  options={classes.map(c => ({ value: c.id, label: c.name, sublabel: c.section }))}
                  defaultValue={formData.class_id}
                  onValueChange={(val) => setFormData({ ...formData, class_id: val as string })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Subject</label>
                <SearchableSelect 
                  name="subject_id"
                  placeholder="Select Subject"
                  options={subjects.map(s => ({ value: s.id, label: s.name || s.title }))}
                  defaultValue={formData.subject_id}
                  onValueChange={(val) => setFormData({ ...formData, subject_id: val as string })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">File Type</label>
                <SearchableSelect 
                  name="file_type"
                  placeholder="Select File Type"
                  options={[
                    { value: 'PDF', label: 'PDF Document' },
                    { value: 'DOCX', label: 'Word Document' },
                    { value: 'PPTX', label: 'PowerPoint' },
                    { value: 'VIDEO', label: 'Video Link' },
                    { value: 'OTHER', label: 'Other Resource' }
                  ]}
                  defaultValue={formData.file_type}
                  onValueChange={(val) => setFormData({ ...formData, file_type: val as string })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">File URL / Link</label>
                <input 
                  required
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" 
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm mt-4">Upload Resource</button>
          </form>
        </Modal>
      </div>
    );
  },
};
