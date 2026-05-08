import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { markAttendanceByQR, fetchStudents, fetchStaff, fetchStudentAttendance, fetchStaffAttendance } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import { cn } from '../lib/utils';
import {
    Camera, CameraOff, CheckCircle, XCircle, AlertTriangle, Users, ChevronRight, QrCode, Loader2, Search, UserPlus
} from 'lucide-react';

interface ScannedStudent {
    id: string;
    name: string;
    admission_no: string;
    time: string;
    status: 'success' | 'duplicate' | 'error';
    status_original?: string;
    type?: 'student' | 'staff';
    message?: string;
    action?: 'clock_in' | 'clock_out';
}

export default function QRAttendanceScanner({ classes = [], onNavigate, onRefresh }: { classes?: any[]; onNavigate?: (view: string) => void, onRefresh?: () => void }) {
    const { t } = useLanguage();
    const [scanning, setScanning] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [scannedList, setScannedList] = useState<ScannedStudent[]>([]);
    const [lastResult, setLastResult] = useState<{ type: 'success' | 'error' | 'duplicate'; message: string } | null>(null);
    const [processing, setProcessing] = useState(false);
    
    // Manual search state
    const [allPeople, setAllPeople] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string>('');
    const cooldownRef = useRef<boolean>(false);

    // Fetch students and staff for manual fallback
    useEffect(() => {
        const loadData = async () => {
            try {
                const [studentsData, staffData] = await Promise.all([
                    fetchStudents(),
                    fetchStaff()
                ]);
                const combined = [
                    ...studentsData.map((s: any) => ({ ...s, type: 'student' })),
                    ...staffData.map((s: any) => ({ ...s, type: 'staff', admission_no: 'Staff', admission_no_original: s.email }))
                ];
                setAllPeople(combined);
            } catch (err) {
                console.error('Failed to load data:', err);
            }
        };
        loadData();
    }, []);
    
    // Fetch today's scans on mount
    useEffect(() => {
        const fetchTodayScans = async () => {
            if (allPeople.length === 0) return;
            
            try {
                const today = new Date().toISOString().split('T')[0];
                const [studentAtt, staffAtt] = await Promise.all([
                    fetchStudentAttendance(),
                    fetchStaffAttendance()
                ]);

                const todayStudentScans = studentAtt
                    .filter((a: any) => a.date?.startsWith(today) && a.clock_in)
                    .map((a: any) => {
                        const student = allPeople.find(p => p.id === a.student_id && p.type === 'student');
                        return {
                            id: a.id,
                            name: student?.name || 'Student',
                            admission_no: student?.admission_no || 'N/A',
                            time: a.clock_in,
                            status: 'success',
                            status_original: a.status,
                            type: 'student',
                            action: a.clock_out ? 'clock_out' : 'clock_in'
                        };
                    });

                const todayStaffScans = staffAtt
                    .filter((a: any) => a.date?.startsWith(today) && a.clock_in)
                    .map((a: any) => {
                        const staff = allPeople.find(p => p.user_id === a.user_id && p.type === 'staff');
                        return {
                            id: a.id,
                            name: staff?.name || 'Staff',
                            admission_no: 'Staff',
                            time: a.clock_in,
                            status: 'success',
                            status_original: a.status,
                            type: 'staff',
                            action: a.clock_out ? 'clock_out' : 'clock_in'
                        };
                    });

                const combined = [...todayStudentScans, ...todayStaffScans].sort((a, b) => b.time.localeCompare(a.time));
                setScannedList(combined as any);
            } catch (err) {
                console.error('Failed to fetch today scans:', err);
            }
        };

        fetchTodayScans();
    }, [allPeople]);

    const handleScan = useCallback(async (decodedText: string) => {
        // Debounce: skip if same code scanned within 3 seconds
        if (cooldownRef.current || decodedText === lastScannedRef.current) return;
        cooldownRef.current = true;
        lastScannedRef.current = decodedText;
        setTimeout(() => { cooldownRef.current = false; }, 3000);

        setProcessing(true);
        try {
            const result = await markAttendanceByQR({
                qr_data: decodedText.trim(),
                status: 'Present',
                class_id: selectedClass || undefined,
            });

            const entry: ScannedStudent = {
                id: result.id,
                name: result.student_name,
                admission_no: result.admission_no,
                time: new Date().toLocaleTimeString(),
                status: 'success',
                status_original: result.status,
                type: result.type,
                action: result.action
            };
            setScannedList(prev => [entry, ...prev]);
            
            const isLate = result.status === 'Late';
            const actionText = result.action === 'clock_out' ? 'Clocked Out' : (isLate ? 'Clocked In (Late)' : 'Clocked In');
            setLastResult({ type: 'success', message: `✓ ${result.student_name} ${actionText.toLowerCase()}` });
            
            // Trigger refresh so attendance counts update in other views
            if (onRefresh) onRefresh();
        } catch (err: any) {
            const data = err?.response?.data;
            const isDuplicate = data?.already_marked || err?.response?.status === 409;

            const entry: ScannedStudent = {
                id: Date.now().toString(),
                name: data?.student_name || decodedText,
                admission_no: decodedText,
                time: new Date().toLocaleTimeString(),
                status: isDuplicate ? 'duplicate' : 'error',
                message: data?.error || t('failed_to_mark_attendance'),
            };
            setScannedList(prev => [entry, ...prev]);
            setLastResult({
                type: isDuplicate ? 'duplicate' : 'error',
                message: data?.error || t('failed_to_mark_attendance'),
            });
        } finally {
            setProcessing(false);
            // Clear the last result after 4 seconds
            setTimeout(() => setLastResult(null), 4000);
        }
    }, [selectedClass, t]);

    const handleManualMark = async (person: any) => {
        // Reuse the same logic but pass email or id for staff
        const qrData = person.type === 'staff' ? (person.email || person.id) : (person.admission_no || person.id);
        if (qrData) {
            await handleScan(qrData);
        }
        setSearchQuery(''); // Reset search
    };

    const startScanner = async () => {
        try {
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => handleScan(decodedText),
                () => { } // Ignore scan failures (no QR in frame)
            );
            setScanning(true);
        } catch (err) {
            console.error('Failed to start scanner:', err);
            setLastResult({ type: 'error', message: t('camera_access_denied') });
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) { /* ignore */ }
            scannerRef.current = null;
        }
        setScanning(false);
    };

    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    const successCount = scannedList.filter(s => s.status === 'success').length;
    const duplicateCount = scannedList.filter(s => s.status === 'duplicate').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <QrCode className="w-7 h-7 text-indigo-600" />
                        </div>
                        {t('qr_attendance_scanner')}
                    </h1>
                    <p className="text-zinc-500 mt-1">{t('scan_id_cards_desc')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">{t('all_classes')}</option>
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Manual Search Fallback */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder={t('manual_search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                    />
                </div>

                {/* Search Results Dropdown */}
                {searchQuery.length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2">{t('search_results')}</p>
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
                            {(() => {
                                const filtered = allPeople.filter(s => {
                                    const matchesQuery = 
                                        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        s.admission_no_original?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.admission_no?.toLowerCase().includes(searchQuery.toLowerCase());
                                    
                                    const matchesClass = selectedClass && s.type === 'student'
                                        ? String(s.class_id) === String(selectedClass)
                                        : true;

                                    return matchesQuery && matchesClass;
                                }).slice(0, 10);

                                return filtered.length > 0 ? filtered.map((s) => (
                                    <div key={s.id} className="p-3 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
                                        <div className="min-w-0 flex-1 pr-4">
                                            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{s.name}</p>
                                            <p className="text-xs text-zinc-500 truncate">
                                                {s.type === 'staff' ? 'Staff' : (s.admission_no || 'N/A')} • {s.type === 'staff' ? s.department_name : (s.class_name || t('no_class'))} {s.type === 'student' ? s.class_section : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleManualMark(s)}
                                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            {t('mark_manual')}
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center">
                                        <p className="text-sm text-zinc-500 italic">{t('no_results_found')}</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
                    <p className="text-3xl font-black text-emerald-600">{successCount}</p>
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mt-1">{t('marked_present')}</p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-center">
                    <p className="text-3xl font-black text-amber-600">{duplicateCount}</p>
                    <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mt-1">{t('already_marked')}</p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-center">
                    <p className="text-3xl font-black text-indigo-600">{scannedList.length}</p>
                    <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-widest mt-1">{t('total_scans')}</p>
                </div>
            </div>

            {/* Scanner Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Camera */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Camera className="w-5 h-5 text-indigo-600" />
                            {t('camera_feed')}
                        </h3>
                        <button
                            onClick={scanning ? stopScanner : startScanner}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${scanning
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {scanning ? (
                                <span className="flex items-center gap-2"><CameraOff className="w-4 h-4" /> {t('stop')}</span>
                            ) : (
                                <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> {t('start_scanning')}</span>
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <div
                            id="qr-reader"
                            className={`w-full ${scanning ? 'min-h-[300px]' : ''}`}
                            style={{ background: '#000' }}
                        />
                        {!scanning && (
                            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-zinc-50 dark:bg-zinc-800/50">
                                <QrCode className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
                                <p className="text-zinc-500 font-medium">{t('camera_off')}</p>
                                <p className="text-zinc-400 text-sm mt-1">{t('click_to_scan_desc')}</p>
                            </div>
                        )}

                        {/* Processing overlay */}
                        {processing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="bg-white dark:bg-zinc-800 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl">
                                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                                    <span className="font-bold text-zinc-900 dark:text-white">{t('processing')}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Last result toast */}
                    {lastResult && (
                        <div className={`p-4 border-t text-sm font-bold flex items-center gap-3 ${lastResult.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                            : lastResult.type === 'duplicate'
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                            }`}>
                            {lastResult.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> :
                                lastResult.type === 'duplicate' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
                                    <XCircle className="w-5 h-5 shrink-0" />}
                            {lastResult.message}
                        </div>
                    )}
                </div>

                {/* Scanned Students List */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            {t('scanned_today')} ({successCount})
                        </h3>
                        {scannedList.length > 0 && (
                            <button
                                onClick={() => setScannedList([])}
                                className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                {t('clear')}
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                        {scannedList.length === 0 ? (
                            <div className="py-16 text-center">
                                <QrCode className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
                                <p className="text-zinc-400 text-sm">{t('no_students_scanned')}</p>
                                <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">{t('scan_qr_to_start')}</p>
                            </div>
                        ) : (
                            scannedList.map((s, i) => (
                                <div key={`${s.id}-${i}`} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${s.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                        s.status === 'duplicate' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                            'bg-red-100 dark:bg-red-900/30'
                                        }`}>
                                        {s.status === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                                            s.status === 'duplicate' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> :
                                                <XCircle className="w-4 h-4 text-red-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{s.name}</p>
                                        <p className="text-xs text-zinc-400">
                                            <span className={cn(
                                                "mr-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                                                s.type === 'staff' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                                            )}>
                                                {s.type || 'student'}
                                            </span>
                                            {s.admission_no} • {s.time}
                                            {s.status_original === 'Late' && (
                                                <span className="ml-2 text-amber-600 font-bold">(Late)</span>
                                            )}
                                        </p>
                                        {s.message && s.status !== 'success' && (
                                            <p className="text-[11px] text-zinc-400 mt-0.5">{s.message}</p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${s.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                        s.status === 'duplicate' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                            'bg-red-100 dark:bg-red-900/30 text-red-600'
                                        }`}>
                                        {s.status === 'success' 
                                            ? (s.action === 'clock_out' ? 'Out' : 'In') 
                                            : s.status === 'duplicate' ? t('already_marked').split(' ')[0] : t('error')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
