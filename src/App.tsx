import React, { useState, useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import Layout from "./components/Layout";
import {
  UserRole,
  Student,
  Inquiry,
  Ward,
  Book,
  BorrowRecord,
} from "./types";
import { Toast, ToastType, ConfirmationModal, Modal } from "./components/UI";
import { Calendar, ShieldCheck, X, AlertCircle } from "lucide-react";
import { subscribeToPush } from "./lib/webpush";
import {
  SuperAdminDashboard,
  SchoolAdminDashboard,
  StudentDashboard,
  HODDashboard,
  StaffDashboard,
  ParentDashboard,
  FinanceDashboard,
  BusDriverDashboard,
  LibrarianDashboard,
  NonStaffDashboard,
  HRDashboard,
} from "./components/Dashboards";
import PartnerDashboard from "./components/PartnerDashboard";
import { DataTable } from "./components/DataTable";
import {
  CreateOrganization,
  EditOrganization,
  ChoosePlan,
  PlansManagement,
  SubscriptionPlans,
  SchoolBilling,
  BillingHistory,
  UsersManagement,
  PartnersManagement,
  DocumentBuilder,
  ReceiptsManagement,
  ModuleManagement,
  AuditLogs,
  Messages,
  Settings,
} from "./components/AdminModules";
import { Announcements, FeedbackManagement } from "./components/module-views/CommunicationViews";
import {
  AcademicModules,
  AdmissionsModules,
  ExamModules,
  AdmitStudentView,
  ReportCardPreview,
} from "./components/module-views/SchoolAdminView";
import { FinanceModules } from "./components/module-views/FinanceView";
import { HRModules } from "./components/module-views/HRView";
import { OperationsModules } from "./components/module-views/OperationsView";
import { AIModules } from "./components/module-views/AIView";
import {
  ELearningModules,
  StorageModules,
  StaffAcademicModules,
  StaffHRModules,
  ExamModules as SimpleExamModules,
} from "./components/module-views/StaffView";
import { LibraryModules } from "./components/module-views/LibrarianView";
import { SuperAdminModules } from "./components/module-views/SuperAdminView";
import {
  distributeSMS,
  updateSMSSettings,
  fetchSMSSettings,
  topUpPlatformSMS
} from "./lib/api";
import { StudentModules } from "./components/module-views/StudentView";
import { CalendarView } from "./components/module-views/CalendarView";
import { Profile } from "./components/module-views/Profile";
import { ParentModules } from "./components/module-views/ParentView";
import { GenericModuleView } from "./components/ModuleViews";
import { InventoryAssetManagement } from "./components/module-views/InventoryAssetManagement";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import PartnerLogin from "./components/PartnerLogin";
import { API_BASE_URL } from "./constants";
import PortfolioView from "./components/module-views/PortfolioView";
import PortfolioUpload from "./components/module-views/PortfolioUpload";
import WhistleblowerView from "./components/module-views/WhistleblowerView";
import QRAttendanceScanner from "./components/QRAttendanceScanner";
import { cn } from "./lib/utils";
import { getFriendlyErrorMessage } from "./lib/errorHelper";
import {
  fetchStudentFeesSummary,
  fetchStudents,
  fetchInquiries,
  createStudent,
  updateStudent,
  deleteStudent,
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchStudentAttendance,
  markStudentAttendance,
  updateStudentAttendance,
  deleteStudentAttendance,
  fetchOrganizations,
  fetchOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  approveReferral,
  fetchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  assignFee,
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchExams,
  createExam,
  updateExam,
  deleteExam,
  fetchResults,
  fetchRecruitment,
  createApplicant,
  updateApplicant,
  deleteApplicant,
  hireCandidate,
  fetchOfferLetter,
  fetchStaffAttendance,
  markStaffAttendance,
  updateStaffAttendance,
  deleteStaffAttendance,
  fetchLessonNotes,
  createLessonNote,
  updateLessonNote,
  deleteLessonNote,
  fetchTeachersOnDuty,
  assignTeacherOnDuty,
  updateTeacherOnDuty,
  deleteTeacherOnDuty,
  fetchBehaviorIncidents,
  recordBehaviorIncident,
  updateBehaviorIncident,
  deleteBehaviorIncident,
  fetchScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  fetchScholarshipTypes,
  createScholarshipType,
  updateScholarshipType,
  deleteScholarshipType,
  fetchFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  fetchUniforms,
  createUniform,
  updateUniform,
  deleteUniform,
  fetchInventorySales,
  createInventorySale,
  updateInventorySale,
  deleteInventorySale,
  fetchDocumentTemplates,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  fetchReceipts,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  fetchPlatformUsers,
  registerPlatformUser,
  fetchAuditLogs,
  fetchModules,
  updateModule,
  deleteModule,
  fetchPayroll,
  createPayroll,
  updatePayroll,
  deletePayroll,
  runPayroll,
  fetchLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  resetLeaveBalances,
  fetchExitManagement,
  fetchExitLetter,
  createExitRecord,
  updateExitRecord,
  deleteExitRecord,
  fetchPerformance,
  fetchHODDashboardStats,
  createPerformanceReview,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  fetchTimetables,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  fetchGradingScales,
  createGradingScale,
  updateGradingScale,
  deleteGradingScale,
  fetchReportCardTemplates,
  createReportCardTemplate,
  updateReportCardTemplate,
  deleteReportCardTemplate,
  fetchRemarkTemplates,
  createRemarkTemplate,
  updateRemarkTemplate,
  deleteRemarkTemplate,
  fetchBooks,
  fetchBookLoans,
  fetchUnreadMessageCount,
  markMessageRead,
  createBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  markBookAsLost,
  fetchTransportRoutes,
  createTransportRoute,
  updateTransportRoute,
  deleteTransportRoute,
  fetchHostels,
  createHostel,
  updateHostel,
  deleteHostel,
  fetchHealthRecords,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  fetchInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  fetchPartners,
  syncELearningMarks,
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateParent,
  fetchClubs,
  createClub,
  updateClub,
  deleteClub,
  fetchPartnerDashboard,
  fetchTransportAssignments,
  fetchHostelAssignments,
} from "./lib/api";

import { useLanguage } from "./lib/LanguageContext";
import { MODULE_LINK_MAP } from "./constants";

export default function App() {
  const { t, language, currency, setLanguage, setCurrency } = useLanguage();
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("SUPER_ADMIN");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState("Dashboard");
  const [preselectedInquiry, setPreselectedInquiry] = useState<any>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [globalModal, setGlobalModal] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    onSave?: (data: any) => void;
  }>({ isOpen: false, title: "", content: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    item: any | null;
    type: "module" | "organization" | "none";
  }>({
    isOpen: false,
    item: null,
    type: "none",
  });

  const [editingOrganization, setEditingOrganization] = useState<any>(null);
  const [smsSettings, setSmsSettings] = useState<any>(null);
  const [isSMSPanelOpen, setIsSMSPanelOpen] = useState(false);
  const [publicResultData, setPublicResultData] = useState<any>(null);
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  const params = useMemo(() => new URLSearchParams(window.location.search), [window.location.search]);
  const view = params.get('view');
  const pubToken = params.get('token');
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    // Check for public result viewing link
    if (view === 'Result' && pubToken) {
      const loadPublicResult = async () => {
        setIsPublicLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/public/report-card/${pubToken}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.student) {
              setPublicResultData(data);
              setShowLanding(false);
              setShowLogin(false);
            } else {
              console.error("Invalid result data:", data);
            }
          } else {
            const errorData = await res.json().catch(() => ({}));
            setPublicError(errorData.error || "Could not find the requested record.");
          }
        } catch (err) {
          console.error("Failed to load public results:", err);
          setPublicError("A connection error occurred. Please check your internet.");
        } finally {
          setIsPublicLoading(false);
        }
      };
      loadPublicResult();
      return;
    }

    if (view === 'FeeHistory' && pubToken) {
      const loadPublicFeeHistory = async () => {
        setIsPublicLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}/public/fee-history/${pubToken}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.student) {
              setPublicResultData({ ...data, isFeeHistory: true });
              setShowLanding(false);
              setShowLogin(false);
            } else {
              console.error("Invalid fee history data:", data);
            }
          } else {
            const errorData = await res.json().catch(() => ({}));
            setPublicError(errorData.error || "Could not find the requested financial record.");
          }
        } catch (err) {
          console.error("Failed to load public fee history:", err);
          setPublicError("A connection error occurred while retrieving fee history.");
        } finally {
          setIsPublicLoading(false);
        }
      };
      loadPublicFeeHistory();
      return;
    }

    if (token && user) {
      setCurrentUser(user);
      setCurrentRole(user.role);
      setShowLanding(false);
      setShowLogin(false);
      setShowPartnerLogin(false);
      loadData(user.role);

      // Initialize Socket
      if (!socketRef.current) {
        const socketUrl = API_BASE_URL.replace('/api', '');
        const socket = io(socketUrl);
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('>>> [SOCKET] Connected to server');
          if (user.org_id) {
            socket.emit('join_org', user.org_id);
          }
          if (user.role === 'PARENT' && user.email) {
            socket.emit('join_room', `parent_${user.email.toLowerCase()}`);
          }
        });

        socket.on('attendance_notification', (data: any) => {
          setToast({
            message: `🔔 ${data.student_name} just ${data.action === 'clock_in' ? 'arrived at' : 'left'} school (${data.time})`,
            type: "info"
          });
        });

        socket.on('attendance_update', (data: any) => {
          if (user.role === 'SCHOOL_ADMIN') {
            console.log('Attendance update received:', data);
          }
        });

        // Handle Native Push Subscription
        const publicVapidKey = 'BK9znUJ6gFOJFnu1JPdOn8WFm1ccoBRJzhVpbmPVTEd1903in3aAvkP48eVKz6exKcz4dJD6a15uK33ooHfvmwo';
        subscribeToPush(publicVapidKey).then(subscription => {
          if (subscription) {
            fetch(`${API_BASE_URL}/auth/fcm-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ subscription })
            }).catch(e => console.error('Failed to save native push subscription:', e));
          }
        });
      }
    }
  }, [view, pubToken]);

  // Clean up socket on logout
  useEffect(() => {
    if (!currentUser && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [currentUser]);

  // System State
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [partnerList, setPartnerList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([
    { category: "Salary", amount: 0 },
    { category: "Utilities", amount: 0 },
    { category: "Maintenance", amount: 0 },
    { category: "Supplies", amount: 0 },
    { category: "Marketing", amount: 0 },
    { category: "Other", amount: 0 },
  ]);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [recruitment, setRecruitment] = useState<any[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<any[]>([]);
  const [lessonNotes, setLessonNotes] = useState<any[]>([]);
  const [teachersOnDuty, setTeachersOnDuty] = useState<any[]>([]);
  const [behaviorIncidents, setBehaviorIncidents] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [scholarshipTypes, setScholarshipTypes] = useState<any[]>([]);
  const [uniforms, setUniforms] = useState<any[]>([]);
  const [inventorySales, setInventorySales] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [platformUsers, setPlatformUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemModules, setSystemModules] = useState<any[]>([]);
  const [planTemplates, setPlanTemplates] = useState<any[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [didSubscriptionFetchFail, setDidSubscriptionFetchFail] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookLoans, setBookLoans] = useState<BorrowRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [exitManagement, setExitManagement] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [gradingScales, setGradingScales] = useState<any[]>([]);
  const [reportCardTemplates, setReportCardTemplates] = useState<any[]>([]);
  const [remarkTemplates, setRemarkTemplates] = useState<any[]>([]);
  const [studentFeesSummary, setStudentFeesSummary] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [transportAssignments, setTransportAssignments] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [hostelAssignments, setHostelAssignments] = useState<any[]>([]);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<any[]>([]);
  const [hodStats, setHodStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  const totalStaffSalary = useMemo(() => {
    return staffList.reduce((sum, s) => sum + parseFloat(s.salary || 0), 0);
  }, [staffList]);

  const combinedExpenses = useMemo(() => {
    const salaryExpense = {
      id: "staff-salary-auto",
      date: new Date().toISOString(),
      category: "Salary",
      description: "System Generated: Total Monthly Staff Payroll",
      amount: totalStaffSalary,
      isAuto: true,
    };
    // If user has manually added a 'Salary' category expense (before this update), filter it out
    // to avoid double counting, or just prepend the auto one.
    return [salaryExpense, ...expenses.filter((e) => e.category !== "Salary")];
  }, [expenses, totalStaffSalary]);

  const combinedInventory = useMemo(() => {
    const map = new Map();

    // Legacy inventory (lowest priority)
    inventory.forEach((i) => {
      map.set(i.item_name || i.name, {
        ...i,
        stock: i.quantity,
        size: i.category,
        _source: "inventory",
      });
    });

    // New inventory items (higher priority)
    inventoryItems.forEach((i) => {
      map.set(i.item_name || i.name, {
        ...i,
        _source: "inventory_items",
      });
    });

    // Uniforms (highest priority)
    uniforms.forEach((u) => {
      map.set(u.item_name || u.name, {
        ...u,
        _source: "uniform",
      });
    });

    return Array.from(map.values());
  }, [uniforms, inventory, inventoryItems]);

  const fetchUnreadCount = async () => {
    try {
      const data = await fetchUnreadMessageCount();
      setUnreadMessagesCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const loadData = async (activeRole?: string) => {
    const roleForFetch = activeRole || currentRole;
    if (showLogin || showLanding || showPartnerLogin) return;
    if (roleForFetch === 'PARTNER') return; // Partners have their own isolated dashboard fetches

    try {
      if (roleForFetch === 'PARTNER') {
        const partnerData = await fetchPartnerDashboard();
        if (partnerData?.partner?.currency) {
          setCurrency(partnerData.partner.currency);
        }
        return;
      }

      const isStaff = roleForFetch === "STAFF";
      const isHOD = roleForFetch === "HOD";
      const isFinance = roleForFetch === "FINANCE";
      const isHR = roleForFetch === "HR";
      const isAdmin =
        roleForFetch === "SCHOOL_ADMIN" || roleForFetch === "SUPER_ADMIN";
      const isStudent = roleForFetch === "STUDENT";
      const isParent = roleForFetch === "PARENT";

      const resultsArr = await Promise.allSettled([
        fetchStudents(),
        fetchInquiries(),
        isAdmin || isHR || isStaff || isHOD || isStudent || isParent
          ? fetchStaff()
          : Promise.resolve([]),
        fetchDepartments(),
        fetchClasses(),
        fetchSubjects(),
        fetchStudentAttendance(),
        fetchOrganizations(),
        fetchInvoices(),
        fetchExpenses(),
        roleForFetch === "SUPER_ADMIN" ? fetchPartners() : Promise.resolve([]),
        fetchPlatformUsers(),
        fetchExams(),
        fetchResults(),
        isAdmin || isHR ? fetchRecruitment() : Promise.resolve([]),
        isAdmin || isHR || isStaff || isHOD
          ? fetchStaffAttendance()
          : Promise.resolve([]),
        fetchLessonNotes(),
        fetchTeachersOnDuty(),
        fetchBehaviorIncidents(),
        fetchScholarships(),
        isAdmin || isFinance ? fetchScholarshipTypes() : Promise.resolve([]),
        fetchUniforms(),
        fetchInventorySales(),
        fetchSubscriptions(),
        isAdmin || isFinance ? fetchReceipts() : Promise.resolve([]),
        fetchClubs(),
        currentRole === "SUPER_ADMIN" || currentRole === "SCHOOL_ADMIN"
          ? fetchPlatformUsers()
          : Promise.resolve([]),
        isAdmin ? fetchAuditLogs() : Promise.resolve([]),
        fetchTransportAssignments(),
        fetchHostelAssignments(),
        fetchModules(),
        fetchPlans(),
        fetchPayroll(),
        fetchPerformance(),
        fetchLeaveRequests(),
        isAdmin || isHR ? fetchExitManagement() : Promise.resolve([]),
        fetchFeeStructures(),
        fetchTimetables(),
        fetchGradingScales(),
        fetchReportCardTemplates(),
        fetchRemarkTemplates(),
        fetchStudentFeesSummary(),
        fetchBooks(),
        fetchBookLoans(),
        fetchTransportRoutes(),
        fetchHostels(),
        fetchHealthRecords(),
        fetchInventory(),
        fetchDocumentTemplates(),
        currentUser?.org_id
          ? fetchOrganization(currentUser.org_id)
          : Promise.resolve(null),
        currentRole === "HOD" || currentRole === "SCHOOL_ADMIN"
          ? fetchHODDashboardStats()
          : Promise.resolve(null),
        fetch(`${API_BASE_URL}/announcements`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.ok ? res.json() : []),
        fetch(`${API_BASE_URL}/meetings`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.ok ? res.json() : []),
        fetch(`${API_BASE_URL}/inventory/items`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.ok ? res.json() : []),
        currentRole === 'SUPER_ADMIN' ? fetchSMSSettings() : Promise.resolve(null),
      ]);

      const assignIfFulfilled = (index: number, setter: (val: any) => void) => {
        const res = resultsArr[index];
        if (res && res.status === "fulfilled") {
          setter(res.value);
        }
      };

      assignIfFulfilled(0, setStudentList);
      assignIfFulfilled(1, setInquiries);
      assignIfFulfilled(2, setStaffList);
      assignIfFulfilled(3, setDepartments);
      assignIfFulfilled(4, setClassList);
      assignIfFulfilled(5, setSubjectList);
      assignIfFulfilled(6, setStudentAttendance);
      assignIfFulfilled(7, setOrganizations);
      assignIfFulfilled(8, setInvoices);
      assignIfFulfilled(9, setExpenses);
      assignIfFulfilled(10, setPartnerList);
      assignIfFulfilled(11, setPlatformUsers);
      assignIfFulfilled(12, setExams);
      assignIfFulfilled(13, setResults);
      assignIfFulfilled(14, setRecruitment);
      assignIfFulfilled(15, setStaffAttendance);
      assignIfFulfilled(16, setLessonNotes);
      assignIfFulfilled(17, setTeachersOnDuty);
      assignIfFulfilled(18, setBehaviorIncidents);
      assignIfFulfilled(19, setScholarships);
      assignIfFulfilled(20, setScholarshipTypes);
      assignIfFulfilled(21, setUniforms);
      assignIfFulfilled(22, setInventorySales);

      const subRes = resultsArr[23];
      if (subRes && subRes.status === "fulfilled") {
        setSubscriptions(subRes.value);
        setDidSubscriptionFetchFail(false);
      } else if (subRes && subRes.status === "rejected") {
        setDidSubscriptionFetchFail(true);
      }

      assignIfFulfilled(24, setReceipts);
      assignIfFulfilled(25, setClubs);

      const adminPlatformUsersRes = resultsArr[26];
      if (adminPlatformUsersRes && adminPlatformUsersRes.status === "fulfilled") {
        if (currentRole === "SUPER_ADMIN" && adminPlatformUsersRes.value && adminPlatformUsersRes.value.length > 0) {
          setPlatformUsers(adminPlatformUsersRes.value);
        }
      }

      assignIfFulfilled(27, setAuditLogs);
      assignIfFulfilled(28, setTransportAssignments);
      assignIfFulfilled(29, setHostelAssignments);
      assignIfFulfilled(30, setSystemModules);
      assignIfFulfilled(31, setPlanTemplates);
      assignIfFulfilled(32, setPayrollEntries);
      assignIfFulfilled(33, setPerformanceReviews);
      assignIfFulfilled(34, setLeaveRequests);
      assignIfFulfilled(35, setExitManagement);
      assignIfFulfilled(36, setFeeStructures);
      assignIfFulfilled(37, setTimetable);
      assignIfFulfilled(38, setGradingScales);
      assignIfFulfilled(39, setReportCardTemplates);
      assignIfFulfilled(40, setRemarkTemplates);
      assignIfFulfilled(41, setStudentFeesSummary);
      assignIfFulfilled(42, setBooks);
      assignIfFulfilled(43, setBookLoans);
      assignIfFulfilled(44, setTransportRoutes);
      assignIfFulfilled(45, setHostels);
      assignIfFulfilled(46, setHealthRecords);
      assignIfFulfilled(47, setInventory);
      assignIfFulfilled(48, setDocumentTemplates);

      assignIfFulfilled(51, setAnnouncements);
      assignIfFulfilled(52, setMeetings);
      assignIfFulfilled(53, setInventoryItems);

      const currentOrgInfo = resultsArr[49];
      if (currentOrgInfo && currentOrgInfo.status === "fulfilled" && currentOrgInfo.value) {
        if (currentOrgInfo.value.currency && currentRole !== 'SUPER_ADMIN') {
          setCurrency(currentOrgInfo.value.currency);
        }
        if (currentOrgInfo.value.language) {
          setLanguage(currentOrgInfo.value.language);
        }
      }

      assignIfFulfilled(50, setHodStats);
      assignIfFulfilled(51, setAnnouncements);
      assignIfFulfilled(52, setMeetings);
      assignIfFulfilled(53, setSmsSettings);
    } catch (err) {
      console.error("Failed to load data from backend:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Derive subscription information
  const subscriptionInfo = useMemo(() => {
    if (currentRole === "SUPER_ADMIN" || !currentUser?.org_id) return null;

    const activeSub = subscriptions
      .filter((s) => s.org_id === currentUser.org_id && s.plan)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

    if (!activeSub) {
      const definitivelyExpired = !isInitialLoading && !didSubscriptionFetchFail;
      return {
        status: 'None',
        daysRemaining: null,
        isExpired: definitivelyExpired,
        loading: isInitialLoading,
        error: didSubscriptionFetchFail
      };
    }

    const expiryDate = activeSub.expiry_date ? new Date(activeSub.expiry_date) : null;
    const now = new Date();
    let daysRemaining = null;
    let isExpired = activeSub.status !== "Active";

    if (expiryDate) {
      const diffTime = expiryDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) isExpired = true;
    }

    return {
      status: isExpired ? 'Expired' : activeSub.status,
      daysRemaining,
      isExpired,
      plan: activeSub.plan
    };
  }, [subscriptions, currentUser?.org_id, currentRole]);

  // Resolve allowed modules based on subscription
  const getAllowedModules = () => {
    if (currentRole === "SUPER_ADMIN") return null; // Bypass for Super Admin

    if (!currentUser?.org_id || !subscriptionInfo) return [];

    // 1. Try to use active subscription if not expired
    let planName = (!subscriptionInfo.isExpired) ? subscriptionInfo.plan : null;

    // 2. Fallback to organization's plan if no active sub or expired (maybe they have a grace period plan)
    if (!planName) {
      const org = organizations.find((o) => o.id === currentUser.org_id);
      planName = org?.plan;
    }

    if (!planName) return [];

    const resolveModules = (
      targetPlan: string,
      seenPlans = new Set<string>(),
    ): string[] => {
      const normalizedName = targetPlan.toLowerCase();
      if (seenPlans.has(normalizedName)) return [];
      seenPlans.add(normalizedName);

      const template = planTemplates.find(
        (p) => p.name.toLowerCase() === normalizedName,
      );
      if (!template) return [];

      let mods = Array.isArray(template.modules)
        ? template.modules
        : JSON.parse(template.modules || "[]");

      // Handle recursive inclusions like "Everything in Professional"
      const recursiveMatches = mods.filter((m: string) =>
        m.toLowerCase().includes("everything in "),
      );
      recursiveMatches.forEach((m: string) => {
        const parentPlan = m.toLowerCase().replace("everything in ", "").trim();
        mods = [
          ...mods.filter((mod: string) => mod !== m),
          ...resolveModules(parentPlan, seenPlans),
        ];
      });

      return Array.from(new Set(mods)) as string[];
    };

    return resolveModules(planName);
  };

  const allowedModules = getAllowedModules();

  // Filtered data for Staff members (Academics restriction)
  const getStaffFilteredData = () => {
    // Only STAFF and HOD should have their views artificially restricted
    const staffRoles = ["STAFF", "HOD"];
    if (!staffRoles.includes(currentRole || "") || !currentUser?.email)
      return null;

    const isHOD = currentRole === "HOD";
    const userEmail = String(currentUser.email).toLowerCase().trim();
    const userId = currentUser.id ? String(currentUser.id).toLowerCase() : null;

    // 1. Identify the logged-in user's Staff Record (if any)
    const staffRecord = staffList.find(
      (s) =>
        (s.email && String(s.email).toLowerCase().trim() === userEmail) ||
        (s.user_id && String(s.user_id).toLowerCase() === userId) ||
        (s.id && String(s.id).toLowerCase() === userId),
    );
    const staffId = staffRecord ? String(staffRecord.id).toLowerCase() : null;

    // 2. Resolve Department Names (crucial for robust HOD matching)
    const deptIdToName = new Map<string, string>();
    (departments || []).forEach((d) => {
      if (d.id && d.name)
        deptIdToName.set(
          String(d.id).toLowerCase(),
          String(d.name).toLowerCase().trim(),
        );
    });

    // 3. Identify Managed Departments (HOD only)
    const hodDeptName = hodStats?.departmentName?.toLowerCase().trim();

    const managedDepts = isHOD
      ? (departments || []).filter((d: any) => {
        const hodRef = d.hod_id ? String(d.hod_id).toLowerCase() : null;
        const staffDeptId = staffRecord?.department_id
          ? String(staffRecord.department_id).toLowerCase()
          : null;
        const dName = d.name ? String(d.name).toLowerCase().trim() : "";

        return (
          (hodRef &&
            (hodRef === staffId ||
              hodRef === userId ||
              hodRef === userEmail)) ||
          (d.id &&
            staffDeptId &&
            String(d.id).toLowerCase() === staffDeptId) ||
          (hodDeptName && dName === hodDeptName)
        );
      })
      : [];

    const managedDeptIds = new Set(
      managedDepts.map((d) => String(d.id).toLowerCase()),
    );
    const managedDeptNames = new Set(
      managedDepts.map((d) => String(d.name).toLowerCase().trim()),
    );
    const hodDeptId = staffRecord?.department_id
      ? String(staffRecord.department_id).toLowerCase()
      : null;

    // 4. Identify Subjects
    const teacherSubjects = isHOD
      ? subjectList.filter((s) => {
        const sDeptId = s.department_id
          ? String(s.department_id).toLowerCase()
          : null;
        const sDeptName = s.department_name
          ? String(s.department_name).toLowerCase().trim()
          : sDeptId
            ? deptIdToName.get(sDeptId)
            : null;
        const teacherId = s.teacher_id
          ? String(s.teacher_id).toLowerCase()
          : null;

        return (
          (sDeptId && managedDeptIds.has(sDeptId)) ||
          (sDeptName && managedDeptNames.has(sDeptName)) ||
          (sDeptId && hodDeptId && sDeptId === hodDeptId) ||
          (hodDeptName && sDeptName === hodDeptName) ||
          (teacherId && staffId && teacherId === staffId) ||
          (teacherId && teacherId === userEmail)
        );
      })
      : subjectList.filter((s) => {
        const teacherId = s.teacher_id
          ? String(s.teacher_id).toLowerCase()
          : null;
        return (
          (teacherId && staffId && teacherId === staffId) ||
          (teacherId && teacherId === userEmail)
        );
      });

    const subjectIds = new Set(
      teacherSubjects.map((s) => String(s.id).toLowerCase()),
    );

    // 5. Identify Staff
    const staffIdSet = new Set<string>();
    if (staffId) staffIdSet.add(staffId);
    if (isHOD) {
      staffList.forEach((s) => {
        const sId = String(s.id).toLowerCase();
        const sDeptId = s.department_id
          ? String(s.department_id).toLowerCase()
          : null;
        const resolvedDeptName = sDeptId
          ? deptIdToName.get(sDeptId)
          : s.department_name
            ? String(s.department_name).toLowerCase().trim()
            : null;

        if (
          (sDeptId && managedDeptIds.has(sDeptId)) ||
          (resolvedDeptName && managedDeptNames.has(resolvedDeptName)) ||
          (sDeptId && hodDeptId && sDeptId === hodDeptId) ||
          (hodDeptName && resolvedDeptName === hodDeptName) ||
          (s.email && String(s.email).toLowerCase().trim() === userEmail)
        ) {
          staffIdSet.add(sId);
        }
      });
    }

    // 6. Identify Classes & Students
    const assignedClassIds = new Set<string>();
    classList.forEach((c) => {
      if (staffIdSet.has(String(c.class_teacher_id).toLowerCase()))
        assignedClassIds.add(String(c.id).toLowerCase());
    });
    teacherSubjects.forEach((s) => {
      if (s.class_id) assignedClassIds.add(String(s.class_id).toLowerCase());
      if (Array.isArray(s.classes)) {
        s.classes.forEach((c: any) => {
          if (c.id) assignedClassIds.add(String(c.id).toLowerCase());
        });
      }
    });

    const teacherStudents = studentList.filter(
      (s) =>
        assignedClassIds.has(String(s.class_id).toLowerCase()) &&
        s.status !== "Alumni",
    );
    const studentIds = new Set(
      teacherStudents.map((s) => String(s.id).toLowerCase()),
    );

    // 7. Metrics & Activity
    const last5Days = [...Array(5)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (4 - i));
      return d.toISOString().split("T")[0];
    });

    const attendanceTrends = last5Days.map((date) => {
      const dailyAtt = studentAttendance.filter(
        (a) =>
          studentIds.has(String(a.student_id).toLowerCase()) &&
          (a.date === date || (a.created_at && a.created_at.startsWith(date))),
      );
      const present = dailyAtt.filter((a) => a.status === "Present").length;
      return {
        name: date.split("-").slice(1).join("/"),
        value:
          dailyAtt.length > 0
            ? Math.round((present / dailyAtt.length) * 100)
            : 0,
      };
    });

    const recentActivity = [
      ...lessonNotes
        .filter(
          (n) => (n.teacher_id || n.staff_id) && staffIdSet.has(String(n.teacher_id || n.staff_id).toLowerCase()),
        )
        .map((n) => ({
          id: n.id,
          type: "note",
          title: "Lesson Note",
          description: n.topic,
          status: n.status,
          date: n.created_at,
          author: n.teacher_name || n.staff_name,
        })),
      ...studentAttendance
        .filter(
          (a) =>
            a.marked_by && staffIdSet.has(String(a.marked_by).toLowerCase()),
        )
        .slice(0, 10)
        .map((a) => ({
          id: a.id,
          type: "attendance",
          title: "Attendance",
          description: `Marked for ${a.student_name}`,
          status: "Completed",
          date: a.date,
          author: a.marked_by_name,
        })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      profile: staffList.filter((s) =>
        staffIdSet.has(String(s.id).toLowerCase()),
      ),
      classes: classList.filter((c) =>
        assignedClassIds.has(String(c.id).toLowerCase()),
      ),
      subjects: teacherSubjects,
      students: teacherStudents,
      timetable: timetable.filter(
        (t) =>
          (t.teacher_id &&
            staffIdSet.has(String(t.teacher_id).toLowerCase())) ||
          (t.class_id &&
            assignedClassIds.has(String(t.class_id).toLowerCase())),
      ),
      attendance: studentAttendance.filter(
        (a) =>
          a.student_id && studentIds.has(String(a.student_id).toLowerCase()),
      ),
      results: results.filter(
        (r) =>
          r.student_id && studentIds.has(String(r.student_id).toLowerCase()),
      ),
      lessonNotes: lessonNotes.filter(
        (n) => (n.teacher_id || n.staff_id) && staffIdSet.has(String(n.teacher_id || n.staff_id).toLowerCase()),
      ),
      performanceReviews: performanceReviews.filter(
        (p) => p.staff_id && staffIdSet.has(String(p.staff_id).toLowerCase()),
      ),
      recentActivity,
      attendanceTrends,
    };
  };

  const staffData = getStaffFilteredData();

  useEffect(() => {
    loadData();
  }, [currentRole, showLogin, showLanding]);

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
    }
  }, [currentView, currentRole, currentUser]);

  const handleLogin = (role: UserRole, user: any) => {
    const updatedUser = { ...user, roles: user.roles || [role] };
    setCurrentRole(role);
    setCurrentUser(updatedUser);
    setShowLogin(false);
    setShowLanding(false);
    showToast(`Logged in as ${role.replace("_", " ")}`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setCurrentRole(null as any);
    setShowLanding(false);
    setShowLogin(true);
    setCurrentView("Dashboard");
    showToast("Logged out successfully", "info");
  };

  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);

  // Derive wards for PARENT role
  const wards = useMemo<Ward[]>(() => {
    if (currentRole !== "PARENT" || !currentUser?.email) return [];
    return studentList
      .filter((s) => s.parent_email === currentUser.email)
      .map((s) => {
        const studentAttendanceRecords = studentAttendance.filter(a => String(a.student_id) === String(s.id));
        const attendanceRate = studentAttendanceRecords.length > 0
          ? Math.round((studentAttendanceRecords.filter(a => a.status === 'Present').length / studentAttendanceRecords.length) * 100)
          : 100; // Default to 100 if no records

        const studentInvoices = invoices.filter(inv => String(inv.student_id) === String(s.id));
        const totalInvoiced = studentInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
        const outstanding = studentInvoices
          .filter(inv => inv.status !== 'Paid')
          .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

        // Map results to performance data
        const studentResults = results
          .filter(r => String(r.student_id) === String(s.id))
          .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
          .slice(-6);

        const performanceData = studentResults.map(r => ({
          name: r.subject_name || r.exam_name || 'Exam',
          value: parseFloat(r.marks_obtained) || 0
        }));

        return {
          id: s.id,
          name: s.name,
          class: s.class,
          attendance: `${attendanceRate}%`,
          avgGrade: s.gpa || "0.0",
          feesPaid: outstanding <= 0 ? "Full" : (outstanding < totalInvoiced ? "Partial" : "Owing"),
          performanceData: performanceData,
          profile_pic: s.profile_pic,
        };
      });
  }, [currentRole, currentUser?.email, studentList, studentAttendance, invoices, results]);

  const activeStudentClassId = useMemo(() => {
    if (currentRole === "STUDENT") {
      return studentList.find((s) => s.email === currentUser?.email)?.class_id;
    }
    if (currentRole === "PARENT") {
      return studentList.find((s) => s.id === selectedWardId)?.class_id;
    }
    return null;
  }, [currentRole, currentUser?.email, studentList, selectedWardId]);

  // Set initial selectedWardId
  useEffect(() => {
    if (currentRole === "PARENT" && wards.length > 0 && !selectedWardId) {
      setSelectedWardId(wards[0].id);
    }
  }, [currentRole, wards, selectedWardId]);

  const showToast = (message: any, type: ToastType = "info") => {
    const finalMessage = (typeof message === 'object' && message !== null)
      ? (message.friendlyMessage || getFriendlyErrorMessage(message))
      : message;
    setToast({ message: finalMessage, type });
  };

  // Centralized CRUD Handlers
  const handleEnableNotifications = async () => {
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

      if (isIOS && !isStandalone) {
        showToast("iPhone users: Tap 'Share' then 'Add to Home Screen' to enable notifications.", "info");
        return;
      }

      const publicVapidKey = 'BK9znUJ6gFOJFnu1JPdOn8WFm1ccoBRJzhVpbmPVTEd1903in3aAvkP48eVKz6exKcz4dJD6a15uK33ooHfvmwo';
      const subscription = await subscribeToPush(publicVapidKey);

      if (subscription) {
        await fetch(`${API_BASE_URL}/auth/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ subscription })
        });
        showToast("Notifications enabled successfully! 🔔", "success");
      } else {
        showToast("Permission denied or not supported. Check browser settings.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Error enabling notifications.", "error");
    }
  };

  const handleEntitySave = async (entityType: string, data: any) => {
    try {
      let result;
      const isUpdate = !!data.id;

      // Handle inquiry comments
      if (entityType === "inquiry" && data.new_comment) {
        const newComment = {
          id: `comment-${Date.now()}`,
          text: data.new_comment,
          author:
            currentUser?.name ||
            currentUser?.username ||
            currentRole ||
            "Admin",
          timestamp: new Date().toISOString(),
        };
        data.comments = [...(data.comments || []), newComment];
        delete data.new_comment;
      }

      // Aggregate custom scores from dynamic form fields
      const customScores: Record<string, any> = {
        ...(data.custom_scores || {}),
      };
      let hasCustomScores = false;
      Object.keys(data).forEach((key) => {
        if (key.startsWith("custom_score_")) {
          const subject = key.replace("custom_score_", "");
          customScores[subject] = data[key];
          delete data[key];
          hasCustomScores = true;
        } else if (key.startsWith("dynamic_score_")) {
          const subject = key.replace("dynamic_score_", "");
          if (subject && subject !== "undefined") {
            customScores[subject] = data[key];
            hasCustomScores = true;
          }
          delete data[key];
        }
      });
      if (hasCustomScores) {
        data.custom_scores = customScores;
      }

      switch (entityType) {
        case "inventory-sale":
          if (!data.status) data.status = "Pending";
          if (currentRole === "STUDENT" && currentUser?.id && !data.student_id) {
            data.student_id = currentUser.id;
          }
          if (currentRole === "PARENT" && selectedWardId && !data.student_id) {
            data.student_id = selectedWardId;
          }
          result = isUpdate
            ? await updateInventorySale(data.id, data)
            : await createInventorySale(data);

          // AUTO-INVOICING: Create invoice if approved
          if (data.status === "Approved" && !data.invoice_generated) {
            try {
              const { createInvoice } = await import("./lib/api");
              await createInvoice({
                student_id: data.student_id,
                title: `Inventory/Stock: ${data.item_name}`,
                amount: data.total_price || data.price,
                due_date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                description: `Quantity: ${data.quantity || 1}`,
                source_type: 'inventory-sale',
                source_id: result?.id || data.id
              });
              // Mark as invoice generated so we don't do it again
              await updateInventorySale(result?.id || data.id, { invoice_generated: true });
            } catch (err) {
              console.error("Failed to auto-invoice:", err);
            }
          }
          break;
        case "student":
          result = isUpdate
            ? await updateStudent(data.id, data)
            : await createStudent(data);
          break;
        case "organization":
          result = isUpdate
            ? await updateOrganization(data.id, data)
            : await createOrganization(data);
          break;
        case "inquiry":
          (data as any).org_id = currentUser?.org_id;
          result = isUpdate
            ? await updateInquiry(data.id, data)
            : await createInquiry(data);
          break;
        case "staff":
          // Sanitize UUID fields: convert empty strings to null to prevent DB errors
          const sanitizedStaffData = { ...data };
          if (sanitizedStaffData.department_id === "")
            sanitizedStaffData.department_id = null;
          if (sanitizedStaffData.reports_to === "")
            sanitizedStaffData.reports_to = null;

          result = isUpdate
            ? await updateStaff(sanitizedStaffData.id, sanitizedStaffData)
            : await createStaff(sanitizedStaffData);
          break;
        case "department":
          result = isUpdate
            ? await updateDepartment(data.id, data)
            : await createDepartment(data);
          break;
        case "class":
          result = isUpdate
            ? await updateClass(data.id, data)
            : await createClass(data);
          break;
        case "subject":
          result = isUpdate
            ? await updateSubject(data.id, data)
            : await createSubject(data);
          break;
        case "student-attendance":
          result = isUpdate
            ? await updateStudentAttendance(data.id, data)
            : await markStudentAttendance(data);
          break;
        case "staff-attendance":
          result = isUpdate
            ? await updateStaffAttendance(data.id, data)
            : await markStaffAttendance(data);
          break;
        case "recruitment":
          result = isUpdate
            ? await updateApplicant(data.id, data)
            : await createApplicant(data);
          break;
        case "recruitment-hire":
          result = await hireCandidate(data.id, data);
          break;
        case "lesson-note":
          result = isUpdate
            ? await updateLessonNote(data.id, data)
            : await createLessonNote(data);
          break;
        case "teacher-on-duty":
          result = isUpdate
            ? await updateTeacherOnDuty(data.id, data)
            : await assignTeacherOnDuty(data);
          break;
        case "behavior":
          result = isUpdate
            ? await updateBehaviorIncident(data.id, data)
            : await recordBehaviorIncident(data);
          break;
        case "invoice":
          result = isUpdate
            ? await updateInvoice(data.id, data)
            : await createInvoice(data);
          break;
        case "expense":
          result = isUpdate
            ? await updateExpense(data.id, data)
            : await createExpense(data);
          break;
        case "fee-structure":
          result = isUpdate
            ? await updateFeeStructure(data.id, data)
            : await createFeeStructure(data);
          break;
        case "fee_assignment":
          result = await assignFee(data);
          break;
        case "scholarship":
          result = isUpdate
            ? await updateScholarship(data.id, data)
            : await createScholarship(data);
          break;
        case "scholarship-type":
          result = isUpdate
            ? await updateScholarshipType(data.id, data)
            : await createScholarshipType(data);
          break;
        case "timetable":
          result = isUpdate
            ? await updateTimetableEntry(data.id, data)
            : await createTimetableEntry(data);
          break;
        case "exam":
          result = isUpdate
            ? await updateExam(data.id, data)
            : await createExam(data);
          break;
        case "grading-scale":
          result = isUpdate
            ? await updateGradingScale(data.id, data)
            : await createGradingScale(data);
          break;
        case "report-card-template":
          result = isUpdate
            ? await updateReportCardTemplate(data.id, data)
            : await createReportCardTemplate(data);
          break;
        case "remark-template":
          result = isUpdate
            ? await updateRemarkTemplate(data.id, data)
            : await createRemarkTemplate(data);
          break;
        case "uniform":
          result = isUpdate
            ? await updateUniform(data.id, data)
            : await createUniform(data);
          break;
        case "receipt":
          result = isUpdate
            ? await updateReceipt(data.id, data)
            : await createReceipt(data);
          break;
        case "payment":
          result = await createReceipt(data);
          break;
        case "payroll":
          result = isUpdate
            ? await updatePayroll(data.id, data)
            : await createPayroll(data);
          break;
        case "performance":
          result = await createPerformanceReview(data);
          break;
        case "leave-request":
          result = isUpdate
            ? await updateLeaveRequest(data.id, data)
            : await createLeaveRequest(data);
          break;
        case "exit-management":
          result = isUpdate
            ? await updateExitRecord(data.id, data)
            : await createExitRecord(data);

          // If exit is completed, deactivate staff
          if (data.status === "Completed" && data.staff_id) {
            try {
              await updateStaff(data.staff_id, { status: "Inactive" });
            } catch (err) {
              console.error("Failed to deactivate staff on exit completion:", err);
            }
          }
          break;
        case "transport":
          result = isUpdate
            ? await updateTransportRoute(data.id, data)
            : await createTransportRoute(data);
          break;
        case "hostel":
          result = isUpdate
            ? await updateHostel(data.id, data)
            : await createHostel(data);
          break;
        case "health":
          result = isUpdate
            ? await updateHealthRecord(data.id, data)
            : await createHealthRecord(data);
          break;
        case "inventory":
          result = isUpdate
            ? await updateInventoryItem(data.id, data)
            : await createInventoryItem(data);
          break;
        case "club":
          result = isUpdate
            ? await updateClub(data.id, data)
            : await createClub(data);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      const displayType = entityType === "uniform" ? "Stock" : entityType.charAt(0).toUpperCase() + entityType.slice(1);
      showToast(
        `${displayType} ${isUpdate ? "updated" : "created"} successfully!`,
        "success",
      );
      loadData();
      return result;
    } catch (err: any) {
      showToast(err, "error");
      throw err;
    }
  };

  const handleApproveTransport = async (assignment: any) => {
    try {
      const { approveTransportRequest, createInvoice } = await import("./lib/api");
      await approveTransportRequest(assignment.student_id);

      // Auto-Invoicing
      await createInvoice({
        student_id: assignment.student_id,
        title: `Transport: ${assignment.route_name || 'Assigned Route'}`,
        amount: assignment.price || 0,
        due_date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        source_type: 'transport',
        source_id: assignment.id
      });

      showToast("Transport request approved and invoiced!", "success");
      loadData();
    } catch (err) {
      console.error("Failed to approve transport:", err);
      showToast("Failed to approve transport", "error");
    }
  };

  const handleApproveHostel = async (assignment: any) => {
    try {
      const { approveHostelRequest, createInvoice } = await import("./lib/api");
      await approveHostelRequest(assignment.id);

      // Auto-Invoicing
      await createInvoice({
        student_id: assignment.student_id,
        title: `Hostel: ${assignment.hostel_name} - ${assignment.room_number}`,
        amount: assignment.price || 0,
        due_date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        source_type: 'hostel',
        source_id: assignment.id
      });

      showToast("Hostel request approved and invoiced!", "success");
      loadData();
    } catch (err) {
      console.error("Failed to approve hostel:", err);
      showToast("Failed to approve hostel", "error");
    }
  };

  const handleEntityDelete = async (entityType: string, item: any) => {
    setDeleteConfirm({
      isOpen: true,
      item,
      type: entityType as any,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.item || deleteConfirm.type === "none") return;

    try {
      const { id } = deleteConfirm.item;
      const type = deleteConfirm.type;

      switch (type) {
        case "module" as any:
          await deleteModule(id);
          break;
        case "organization" as any:
          await deleteOrganization(id);
          break;
        case "inquiry" as any:
          await deleteInquiry(id);
          break;


        case "staff" as any:
          await deleteStaff(id);
          break;
        case "department" as any:
          await deleteDepartment(id);
          break;
        case "class" as any:
          await deleteClass(id);
          break;
        case "subject" as any:
          await deleteSubject(id);
          break;
        case "invoice" as any:
          await deleteInvoice(id);
          break;
        case "expense" as any:
          await deleteExpense(id);
          break;
        case "fee-structure" as any:
          await deleteFeeStructure(id);
          break;
        case "scholarship" as any:
          await deleteScholarship(id);
          break;
        case "scholarship-type" as any:
          await deleteScholarshipType(id);
          break;
        case "staff-attendance" as any:
          await deleteStaffAttendance(id);
          break;
        case "student-attendance" as any:
          await deleteStudentAttendance(id);
          break;
        case "recruitment" as any:
          await deleteApplicant(id);
          break;
        case "lesson-note" as any:
          await deleteLessonNote(id);
          break;
        case "teacher-on-duty" as any:
          await deleteTeacherOnDuty(id);
          break;
        case "behavior" as any:
          await deleteBehaviorIncident(id);
          break;
        case "timetable" as any:
          await deleteTimetableEntry(id);
          break;
        case "grading-scale" as any:
          await deleteGradingScale(id);
          break;
        case "report-card-template" as any:
          await deleteReportCardTemplate(id);
          break;
        case "remark-template" as any:
          await deleteRemarkTemplate(id);
          break;
        case "exam" as any:
          await deleteExam(id);
          break;
        case "uniform" as any:
          await deleteUniform(id);
          break;
        case "inventory-sale" as any:
          await deleteInventorySale(id);
          break;
        case "receipt" as any:
          await deleteReceipt(id);
          break;
        case "payroll" as any:
          await deletePayroll(id);
          break;
        case "performance" as any:
          console.warn(`Delete not implemented for performance review`);
          break;
        case "leave-request" as any:
          await deleteLeaveRequest(id);
          break;
        case "exit-management" as any:
          await deleteExitRecord(id);
          break;
        case "transport" as any:
          await deleteTransportRoute(id);
          break;
        case "hostel" as any:
          await deleteHostel(id);
          break;
        case "health" as any:
          await deleteHealthRecord(id);
          break;
        case "inventory":
          await deleteInventoryItem(id);
          break;
        case "club":
          await deleteClub(id);
          break;
        default:
          console.warn(`Delete not implemented for type: ${type}`);
      }

      showToast(`Record deleted successfully`, "success");
      loadData();
    } catch (err: any) {
      showToast(err, "error");
    } finally {
      setDeleteConfirm({ isOpen: false, item: null, type: "none" });
    }
  };

  const handleApproveReferral = async (org: any) => {
    try {
      await approveReferral(org.id);
      showToast("Referral approved and school activated!", "success");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to approve referral", "error");
    }
  };

  const handleDistributeSMS = async (orgId: string, amount: number, price: number) => {
    try {
      await distributeSMS({ org_id: orgId, amount, price });
      showToast(`Successfully distributed ${amount} SMS credits!`, "success");
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to distribute SMS", "error");
    }
  };

  const handleUpdateSMSSettings = async (data: any) => {
    try {
      await updateSMSSettings(data);
      showToast("SMS Gateway settings updated!", "success");
      const settings = await fetchSMSSettings();
      setSmsSettings(settings);
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to update SMS settings", "error");
    }
  };

  const handleTopUpPlatformSMS = async (amount: number) => {
    try {
      await topUpPlatformSMS(amount);
      showToast(`Successfully added ${amount} units to platform pool!`, "success");
      const settings = await fetchSMSSettings();
      setSmsSettings(settings);
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to top up platform SMS", "error");
    }
  };



  useEffect(() => {
    (window as any).showToast = showToast;
    (window as any).showModal = (title: string, content: React.ReactNode, onSave?: (data: any) => void) => {
      setGlobalModal({ isOpen: true, title, content, onSave });
    };
  }, []);

  const renderContent = () => {
    if (currentView === "Messages")
      return (
        <Messages
          students={studentList}
          staff={staffList}
          partners={partnerList}
          subjects={subjectList}
          classes={classList}
          onRefreshUnreadCount={fetchUnreadCount}
        />
      );
    if (currentView === "Announcements")
      return (
        <Announcements
          role={currentRole}
          students={studentList}
          staff={staffList}
          organization={organizations.find(o => o.id === currentUser?.org_id)}
        />
      );
    if (currentView === "profile" && currentRole === "SUPER_ADMIN") {
      return (
        <Profile
          currentUser={currentUser}
          orgCount={organizations.length}
          partnerCount={partnerList.length}
          totalUsers={studentList.length + staffList.length}
        />
      );
    }

    if (
      currentView === "Settings" ||
      currentView === "System Settings" ||
      currentView === "School Profile"
    )
      return <Settings role={currentRole} />;
    if (currentView === "Notifications") return <AuditLogs />;

    const isAllowed = (view: string) => {
      if (currentRole === "SUPER_ADMIN") return true;
      if (!allowedModules) return true; // Still loading

      const moduleName = MODULE_LINK_MAP[view];
      if (!moduleName) return true; // Items not in map (Dashboard, Settings, etc) are always allowed
      return allowedModules.some((m) =>
        m?.toLowerCase().includes(moduleName.toLowerCase()),
      );
    };

    if (!isAllowed(currentView)) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="text-zinc-500 max-w-md">
            Your current plan does not include the{" "}
            <strong>{currentView}</strong> module. Please upgrade your
            subscription to access this feature.
          </p>
          <button
            onClick={() => setCurrentView("Dashboard")}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      );
    }

    const moduleMap: Record<string, React.ReactNode> = {
      Dashboard: (() => {
        switch (currentRole) {
          case "SUPER_ADMIN":
            return (
              <div className="space-y-8">
                <SuperAdminDashboard
                  unreadMessagesCount={unreadMessagesCount}
                  onNavigate={setCurrentView}
                  organizations={organizations}
                  stats={{
                    totalOrganizations: organizations.length.toString(),
                    activeSubscriptions: organizations
                      .filter((o) => o.status === "Active")
                      .length.toString(),
                    totalUsers: "45.2k",
                    annualRevenue: `${currency} 1,494,000`,
                  }}
                />
                <SuperAdminModules.Organizations
                  data={organizations}
                  onAdd={() => setCurrentView("Create Organization")}
                  onEdit={(org) => {
                    showToast(`Edit for ${org.name} coming soon!`, "info");
                  }}
                  onDelete={(org) =>
                    setDeleteConfirm({
                      isOpen: true,
                      item: org,
                      type: "organization",
                    })
                  }
                  onApprove={handleApproveReferral}
                  onDistributeSMS={handleDistributeSMS}
                />
              </div>
            );
          case "SCHOOL_ADMIN": {
            const activeStudentsCount = studentList.filter(s => s.status !== 'Alumni' && s.status !== 'Withdrawn').length || 1;
            const uniqueDatesCount = new Set(studentAttendance.map(a => new Date(a.date).toDateString())).size || 1;
            const expectedTotalRecords = activeStudentsCount * uniqueDatesCount;
            const presentRecords = studentAttendance.filter((a) => a.status === "Present").length;

            const attendanceRate =
              studentAttendance.length > 0
                ? `${Math.round((presentRecords / expectedTotalRecords) * 100)}%`
                : "0%";
            const totalFees = invoices.reduce((sum, inv) => {
              const amount = parseFloat(
                inv.amount.toString().replace(/[^\d.]/g, ""),
              );
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);

            return (
              <div className="space-y-8">
                <SchoolAdminDashboard
                  onNavigate={setCurrentView}
                  initialShowSMS={isSMSPanelOpen}
                  stats={{
                    totalStudents: studentList
                      .filter((s) => s.status !== "Alumni")
                      .length.toString(),
                    totalStaff: staffList.length.toString(),
                    attendanceRate,
                    feesCollected: `${currency} ${totalFees.toLocaleString()}`,
                  }}
                  unreadMessagesCount={unreadMessagesCount}
                  invoices={invoices}
                  payments={receipts}
                  students={studentList}
                  classes={classList}
                  organization={organizations.find(
                    (o) => o.id === currentUser?.org_id,
                  )}
                  attendanceHistory={studentAttendance}
                  activities={auditLogs.slice(0, 10)}
                  inventoryItems={combinedInventory}
                  onUpdateOrganization={(data: any) => handleEntitySave("organization", data)}
                />
              </div>
            );
          }
          case "HOD":
            return (
              <HODDashboard
                data={hodStats}
                staffList={staffList}
                departments={departments}
                user={currentUser}
                organization={organizations.find(
                  (o) => o.id === currentUser?.org_id,
                )}
                unreadMessagesCount={unreadMessagesCount}
                onNavigate={setCurrentView}
                onUpdateOrganization={(data: any) => handleEntitySave("organization", data)}
              />
            );
          case "STAFF":
            return (
              <StaffDashboard
                staffData={staffData}
                user={currentUser}
                organization={organizations.find(
                  (o) => o.id === currentUser?.org_id,
                )}
                staffList={staffList}
                departments={departments}
                unreadMessagesCount={unreadMessagesCount}
                onNavigate={setCurrentView}
                onUpdateOrganization={(data: any) => handleEntitySave("organization", data)}
              />
            );
          case "STUDENT":
            return (
              <StudentDashboard
                onNavigate={setCurrentView}
                user={currentUser}
                students={studentList}
                attendance={studentAttendance}
                invoices={invoices}
                timetable={timetable}
                organization={organizations.find(
                  (o) => o.id === currentUser?.org_id,
                )}
                unreadMessagesCount={unreadMessagesCount}
              />
            );
          case "PARENT":
            return (
              <ParentDashboard
                wards={wards}
                selectedWardId={selectedWardId}
                onWardSelect={setSelectedWardId}
                attendance={studentAttendance}
                invoices={invoices}
                timetable={timetable}
                announcements={announcements}
                meetings={meetings}
                organization={organizations.find(
                  (o) => o.id === currentUser?.org_id,
                )}
                unreadMessagesCount={unreadMessagesCount}
                onNavigate={setCurrentView}
              />
            );
          case "FINANCE":
            return (
              <FinanceDashboard
                invoices={invoices}
                payments={receipts}
                expenses={expenses}
              />
            );
          case "BUS_DRIVER":
            return (
              <BusDriverDashboard
                routes={transportRoutes.filter(r =>
                  String(r.driver_name).toLowerCase() === String(currentUser?.name || '').toLowerCase()
                )}
                onDropOff={async (studentId) => {
                  try {
                    const { markStudentDroppedOff } = await import("./lib/api");
                    await markStudentDroppedOff(studentId);
                    showToast("Student marked as dropped off. SMS sent to parent.", "success");
                    loadData();
                  } catch (err) {
                    console.error("Failed to mark drop off:", err);
                    showToast("Failed to mark drop off", "error");
                  }
                }}
                onPickUp={async (studentId) => {
                  try {
                    const { markStudentPickedUp } = await import("./lib/api");
                    await markStudentPickedUp(studentId);
                    showToast("Student marked as picked up. SMS sent to parent.", "success");
                    loadData();
                  } catch (err) {
                    console.error("Failed to mark pick up:", err);
                    showToast("Failed to mark pick up", "error");
                  }
                }}
              />
            );
          case "LIBRARIAN":
            return <LibrarianDashboard books={books} bookLoans={bookLoans} />;
          case "NON_STAFF":
          case "HOSTEL":
          case "STUDENT_CLUBS":
          case "ASSETS_EQUIPMENT":
          case "HEALTH":
          case "DISCIPLINE":
            return <NonStaffDashboard tasks={[]} />;
          case "HR":
            return (
              <HRDashboard
                staff={staffList}
                attendance={staffAttendance}
                leaveRequests={leaveRequests}
              />
            );
          case "PARTNER":
            return <PartnerDashboard />;
          default:
            return <StudentDashboard />;
        }
      })(),

      Organizations: (
        <SuperAdminModules.Organizations
          data={organizations}
          onAdd={() => setCurrentView("Create Organization")}
          onEdit={(org) => {
            setEditingOrganization(org);
            setCurrentView("Edit Organization");
          }}
          onDelete={(org) =>
            setDeleteConfirm({ isOpen: true, item: org, type: "organization" })
          }
          onApprove={handleApproveReferral}
          onDistributeSMS={handleDistributeSMS}
        />
      ),

      Plans: (
        <PlansManagement
          data={planTemplates}
          onRefresh={loadData}
          systemModules={systemModules}
        />
      ),

      "Create Organization": <CreateOrganization onRefresh={loadData} />,
      "Edit Organization": (
        <EditOrganization
          organization={editingOrganization}
          onRefresh={loadData}
          onBack={() => setCurrentView("Organizations")}
        />
      ),
      "SMS Settings": smsSettings ? (
        <SuperAdminModules.SMSSettings
          data={smsSettings}
          onSave={handleUpdateSMSSettings}
          onTopUp={handleTopUpPlatformSMS}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold animate-pulse uppercase text-xs tracking-widest">Loading Gateway Settings...</p>
        </div>
      ),


      "Subscription Plan": <ChoosePlan />,
      Receipts: <ReceiptsManagement data={receipts} />,

      'Admit Student': (
        <AdmitStudentView
          classes={classList}
          feeStructures={feeStructures}
          students={studentList.filter(s => s.status !== 'Alumni')}
          inquiries={inquiries}
          preselectedInquiry={preselectedInquiry}
          onNavigate={(view) => {
            if (view !== 'Admit Student') setPreselectedInquiry(null);
            setCurrentView(view);
          }}
          onAdmit={async (data) => {
            try {
              const email = data.email || `${(data.name || '').toLowerCase().replace(/ /g, '.')}@school.com`;
              const newStudent = await createStudent({
                ...data,
                email,
                gpa: '0.0',
                admission_no: `ADM-${Date.now()}`,
                status: 'Active',
              });
              await registerPlatformUser({
                name: data.name,
                email,
                password: 'zxcv123$$',
                role: 'STUDENT',
                org_id: currentUser?.org_id,
              });
              // Create fee invoices if fee_ids provided
              if (data.fee_ids && data.fee_ids.length > 0) {
                const transactionId = `ADM-${Date.now()}`;
                for (const feeId of data.fee_ids) {
                  if (!feeId) continue;
                  await handleEntitySave('fee_assignment', {
                    student_id: newStudent.id,
                    fee_structure_id: feeId,
                    due_date: new Date().toISOString().split('T')[0],
                    target_type: 'students',
                    status: data.fee_status === 'Paid' ? 'Paid' : 'Pending',
                    payment_method: 'Cash',
                    transaction_id: transactionId,
                  });
                }
              }
              await loadData();
              if (data.source_inquiry_id) {
                await deleteInquiry(data.source_inquiry_id);
                await loadData();
              }
              showToast(`${data.name} has been admitted successfully!`, 'success');
            } catch (err: any) {
              const data = err?.response?.data;
              const msg = data?.detail || data?.error || 'Failed to admit student';
              showToast(msg, 'error');
              throw err;
            }
          }}
          onSaveEnquiry={async (data) => {
            await handleEntitySave('inquiry', { ...data, status: 'New', date: new Date().toISOString().split('T')[0] });
            await loadData();
          }}
        />
      ),

      'Student Inquiries': (
        <AdmissionsModules.Inquiries
          data={inquiries}
          onConvert={(item) => {
            // Logic to transition from inquiry to admit view
            setPreselectedInquiry(item);
            showToast(`Converting enquiry for ${item.name}...`, 'info');
            setCurrentView('Admit Student');
          }}
          onSave={(data) => handleEntitySave('inquiry', data)}
          onDelete={(item) => handleEntityDelete('inquiry', item)}
        />
      ),

      "Student Management":
        currentRole === "STAFF" ? (
          <StaffAcademicModules.StudentManagement
            data={staffData?.students || []}
            results={results}
            exams={exams}
            classes={classList}
            gradingScales={gradingScales}
            attendance={studentAttendance}
          />
        ) : (
          <AcademicModules.StudentManagement
            data={(currentRole === "PARENT"
              ? studentList.filter((s) => s.id === selectedWardId)
              : staffData
                ? staffData.students
                : studentList
            ).filter(
              (s: Student) =>
                s.status !== "Alumni" && s.status !== "Pending Enrollment",
            )}
            role={currentRole}
            results={results}
            exams={exams}
            classes={classList}
            gradingScales={gradingScales}
            attendance={studentAttendance}
            onSave={(data) => handleEntitySave("student", data)}
            onDelete={(item) => handleEntityDelete("student", item)}
            onRefresh={loadData}
            canEdit={(item) => item.status !== "Alumni"}
            canDelete={(item) => item.status !== "Alumni"}
          />
        ),

      "Staff Management":
        currentRole === "STAFF" ? (
          <StaffHRModules.StaffProfile
            data={staffData?.profile || []}
            onSave={(data: any) => handleEntitySave("staff", data)}
            onExitStaff={(data: any) => handleEntitySave("exit-management", data)}
          />
        ) : (
          <HRModules.StaffManagement
            role={currentRole}
            data={staffData ? staffData.profile : staffList}
            departments={departments}
            onSave={(data) => handleEntitySave("staff", data)}
            onDelete={(item) => handleEntityDelete("staff", item)}
            onExitStaff={(data) => handleEntitySave("exit-management", data)}
          />
        ),

      "Exit Management": (
        <HRModules.ExitManagement
          role={currentRole}
          data={exitManagement}
          staffList={staffList}
          onSave={(data) => handleEntitySave("exit-management", data)}
          onDelete={(item) => handleEntityDelete("exit-management", item)}
          onFetchLetter={fetchExitLetter}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          documentTemplates={documentTemplates}
          onRefreshTemplates={async () => {
            const res = await fetchDocumentTemplates();
            setDocumentTemplates(res);
          }}
        />
      ),

      "Staff Attendance": (
        <HRModules.StaffAttendance
          data={staffAttendance}
          onSave={(data) => handleEntitySave("staff-attendance", data)}
          onDelete={(item) => handleEntityDelete("staff-attendance", item)}
        />
      ),

      Recruitment: (
        <HRModules.Recruitment
          data={recruitment}
          departments={departments}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          documentTemplates={documentTemplates}
          onSave={(data) => handleEntitySave("recruitment", data)}
          onDelete={(item) => handleEntityDelete("recruitment", item)}
          onHire={(id, data) =>
            handleEntitySave("recruitment-hire", { ...data, id })
          }
          onFetchOfferLetter={fetchOfferLetter}
          onRefreshTemplates={async () => {
            const res = await fetchDocumentTemplates();
            setDocumentTemplates(res);
          }}
        />
      ),

      "Lesson Notes": (
        <HRModules.LessonNotes
          role={currentRole}
          data={
            currentRole === "STAFF" || currentRole === "HOD"
              ? staffData?.lessonNotes || []
              : lessonNotes
          }
          staffList={staffList}
          currentStaff={staffList.find((s) => s.email === currentUser?.email)}
          subjects={
            currentRole === "STAFF" || currentRole === "HOD"
              ? staffData?.subjects || []
              : subjectList
          }
          classes={
            currentRole === "STAFF" || currentRole === "HOD"
              ? staffData?.classes || []
              : classList
          }
          onSave={(data) => handleEntitySave("lesson-note", data)}
          onDelete={(item) => handleEntityDelete("lesson-note", item)}
          currentUser={currentUser}
        />
      ),

      "Class Management":
        currentRole === "STAFF" ? (
          <StaffAcademicModules.ClassManagement
            data={staffData?.classes || []}
            students={staffData?.students || []}
          />
        ) : (
          <AcademicModules.ClassManagement
            data={staffData ? staffData.classes : classList}
            staff={
              currentRole === "HOD" && staffData ? staffData.profile : staffList
            }
            students={staffData ? staffData.students : studentList}
            gradingScales={gradingScales}
            reportCardTemplates={reportCardTemplates}
            role={currentRole}
            onSave={
              currentRole === "STAFF"
                ? undefined
                : (data) => handleEntitySave("class", data)
            }
            onDelete={
              currentRole === "STAFF"
                ? undefined
                : (item) => handleEntityDelete("class", item)
            }
          />
        ),

      "Subject Management":
        currentRole === "STAFF" ? (
          <StaffAcademicModules.SubjectManagement
            data={staffData?.subjects || []}
            students={staffData?.students || []}
          />
        ) : (
          <AcademicModules.SubjectManagement
            data={staffData ? staffData.subjects : subjectList}
            staff={
              currentRole === "HOD" && staffData ? staffData.profile : staffList
            }
            classes={classList}
            students={staffData ? staffData.students : studentList}
            departments={departments}
            currentStaff={staffList.find(
              (s) =>
                (s.user_id &&
                  String(s.user_id).toLowerCase() ===
                  String(currentUser?.id).toLowerCase()) ||
                (s.email &&
                  String(s.email).toLowerCase() ===
                  String(currentUser?.email).toLowerCase()),
            )}
            role={currentRole}
            onSave={
              currentRole === "STAFF"
                ? undefined
                : (data) => handleEntitySave("subject", data)
            }
            onDelete={
              currentRole === "STAFF"
                ? undefined
                : (item) => handleEntityDelete("subject", item)
            }
          />
        ),

      Timetable:
        currentRole === "STUDENT" || currentRole === "PARENT" ? (
          <AcademicModules.Timetable
            data={timetable}
            classes={classList}
            subjects={subjectList}
            staff={staffList}
            departments={departments}
            role={currentRole}
            selectedClassId={
              currentRole === "PARENT"
                ? studentList.find((s) => s.id === selectedWardId)?.class_id
                : studentList.find((st) => st.email === currentUser?.email)
                  ?.class_id
            }
          />
        ) : currentRole === "STAFF" ? (
          <StaffAcademicModules.Timetable data={staffData?.timetable || []} />
        ) : (
          <AcademicModules.Timetable
            data={staffData ? staffData.timetable : timetable}
            classes={staffData ? staffData.classes : classList}
            subjects={staffData ? staffData.subjects : subjectList}
            staff={staffData ? staffData.profile : staffList}
            departments={departments}
            currentStaff={staffList.find(
              (s) =>
                (s.user_id &&
                  String(s.user_id).toLowerCase() ===
                  String(currentUser?.id).toLowerCase()) ||
                (s.email &&
                  String(s.email).toLowerCase() ===
                  String(currentUser?.email).toLowerCase()),
            )}
            role={currentRole}
            onSave={
              currentRole === "STAFF"
                ? undefined
                : (data) => handleEntitySave("timetable", data)
            }
            onDelete={
              currentRole === "STAFF"
                ? undefined
                : (item) => handleEntityDelete("timetable", item)
            }
          />
        ),

      "Academic Calendar": <CalendarView role={currentRole} />,

      Attendance:
        currentRole === "STAFF" ? (
          <StaffAcademicModules.Attendance
            data={staffData?.attendance || []}
            students={studentList}
            staffList={staffList}
            onSave={async (data: any) => {
              const type = data.staff_id
                ? "staff-attendance"
                : "student-attendance";
              await handleEntitySave(type, data);
            }}
          />
        ) : (
          <AcademicModules.Attendance
            role={currentRole}
            wards={wards}
            selectedWardId={selectedWardId}
            onWardSelect={setSelectedWardId}
            students={studentList}
            staffList={staffList}
            organization={organizations.find((o) => o.id === currentUser?.org_id)}
            onUpdateOrganization={(data: any) => handleEntitySave("organization", { ...data, id: currentUser?.org_id })}
            data={
              currentRole === "PARENT"
                ? studentAttendance.filter(
                  (a) => a.student_id === selectedWardId,
                )
                : currentRole === "SCHOOL_ADMIN"
                  ? studentAttendance
                  : staffData
                    ? staffData.attendance
                    : studentAttendance
            }
            canEdit={(item: any) => {
              const student = studentList.find(s => s.id === item.student_id);
              return !student || student.status !== 'Alumni';
            }}
            canDelete={(item: any) => {
              const student = studentList.find(s => s.id === item.student_id);
              return !student || student.status !== 'Alumni';
            }}
            onSave={
              currentRole === "PARENT"
                ? undefined
                : async (data: any) => {
                  const type = data.staff_id
                    ? "staff-attendance"
                    : "student-attendance";
                  await handleEntitySave(type, data);
                }
            }
            onDelete={
              currentRole === "PARENT"
                ? undefined
                : (item: any) =>
                  handleEntityDelete(
                    item.staff_id ? "staff-attendance" : "student-attendance",
                    item,
                  )
            }
          />
        ),

      "QR Attendance": (
        <QRAttendanceScanner
          classes={staffData ? staffData.classes : classList}
          onNavigate={setCurrentView}
          onRefresh={loadData}
        />
      ),

      "Promotion & Graduation": (
        <AcademicModules.PromotionGraduation onRefresh={loadData} />
      ),

      "Alumni Management": (
        <AcademicModules.AlumniManagement
          students={studentList}
          onRefresh={() => loadData()}
          organization={organization}
          onUpdateOrganization={(data: any) => handleEntitySave("organization", { ...data, id: currentUser?.org_id })}
        />
      ),

      "Exam Schedules": (
        <ExamModules.ExamSchedules
          role={currentRole}
          wards={wards}
          selectedWardId={selectedWardId}
          onWardSelect={setSelectedWardId}
          onNavigate={setCurrentView}
          organization={organization}
          data={exams}
          currentUser={currentUser}
          staffList={staffList}
          subjects={
            (currentRole === "STAFF" || currentRole === "HOD") && staffData
              ? staffData.subjects
              : subjectList
          }
          classes={
            (currentRole === "STAFF" || currentRole === "HOD") && staffData
              ? staffData.classes
              : classList
          }
          onSave={(data) => handleEntitySave("exam", data)}
          onDelete={(item) => handleEntityDelete("exam", item)}
        />
      ),

      "Result Analysis": (
        <ExamModules.ResultAnalysis
          role={currentRole}
          data={
            currentRole === "STUDENT"
              ? results.filter(
                (r) =>
                  r.student_id ===
                  studentList.find((s) => s.email === currentUser?.email)?.id,
              )
              : currentRole === "PARENT"
                ? results.filter((r) => r.student_id === selectedWardId)
                : results
          }
          students={studentList}
          classes={classList}
          exams={exams}
        />
      ),

      "My Results": (
        <ExamModules.ResultsManagement
          role={currentRole}
          wards={wards}
          selectedWardId={
            currentRole === "STUDENT"
              ? studentList.find((s) => s.email === currentUser?.email)?.id
              : selectedWardId
          }
          data={results}
          students={studentList}
          classes={classList}
          exams={exams}
          reportCardTemplates={reportCardTemplates}
          remarkTemplates={remarkTemplates}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
        />
      ),

      "Ward Results": (
        <ExamModules.ResultsManagement
          role={currentRole}
          wards={wards}
          selectedWardId={selectedWardId}
          onWardSelect={setSelectedWardId}
          data={results}
          students={studentList}
          classes={classList}
          exams={exams}
          reportCardTemplates={reportCardTemplates}
          remarkTemplates={remarkTemplates}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
        />
      ),

      "Results Management":
        currentRole === "STAFF" ? (
          <StaffAcademicModules.ResultManagement
            role={currentRole}
            currentUser={currentUser}
            exams={exams.filter((e) =>
              staffData?.subjects?.some((s: any) => s.id === e.subject_id),
            )}
            students={studentList}
            classes={classList}
            organization={organizations.find(
              (o) => o.id === currentUser?.org_id,
            )}
            reportCardTemplates={reportCardTemplates}
            remarkTemplates={remarkTemplates}
            results={results}
            onSaveResults={async (data: any) => {
              try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/results/bulk`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify(data),
                });
                if (!res.ok) {
                  const contentType = res.headers.get("content-type");
                  const errData =
                    contentType && contentType.includes("application/json")
                      ? await res.json()
                      : null;
                  throw new Error(
                    errData?.error ||
                    `Server error (${res.status}): Failed to upload marks`,
                  );
                }
                (window as any).showToast?.(
                  "Marks uploaded and grades calculated!",
                  "success",
                );
                await loadData();
              } catch (err: any) {
                (window as any).showToast?.(err.message, "error");
              }
            }}
            onSyncMarks={async (data: any) => {
              try {
                const res = await syncELearningMarks(data);
                (window as any).showToast?.(
                  res.message || "Marks synchronized!",
                  "success",
                );
                await loadData();
              } catch (err: any) {
                (window as any).showToast?.(
                  err?.response?.data?.error || "Failed to sync marks",
                  "error",
                );
              }
            }}
          />
        ) : currentRole === "PARENT" || currentRole === "STUDENT" ? (
          <SimpleExamModules.ResultsManagement
            role={currentRole}
            wards={wards}
            selectedWardId={
              currentRole === "STUDENT"
                ? studentList.find((s) => s.email === currentUser?.email)?.id
                : selectedWardId
            }
            data={results}
            students={studentList}
            classes={classList}
            exams={exams}
            reportCardTemplates={reportCardTemplates}
            remarkTemplates={remarkTemplates}
            organization={organizations.find(
              (o) => o.id === currentUser?.org_id,
            )}
            onSaveResults={async (data: any) => {
              try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/results/bulk`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify(data),
                });
                if (!res.ok) {
                  const contentType = res.headers.get("content-type");
                  const errData =
                    contentType && contentType.includes("application/json")
                      ? await res.json()
                      : null;
                  throw new Error(
                    errData?.error ||
                    `Server error (${res.status}): Failed to record results`,
                  );
                }
                (window as any).showToast?.(
                  "Results recorded successfully!",
                  "success",
                );
                await loadData();
              } catch (err: any) {
                (window as any).showToast?.(err.message, "error");
              }
            }}
          />
        ) : (
          <ExamModules.ResultsManagement
            role={currentRole}
            wards={wards}
            selectedWardId={
              currentRole === "STUDENT"
                ? studentList.find((s) => s.email === currentUser?.email)?.id
                : selectedWardId
            }
            data={results}
            subjects={staffData ? staffData.subjects : subjectList}
            staffList={staffList}
            currentUser={currentUser}
            students={studentList}
            classes={classList}
            exams={exams}
            reportCardTemplates={reportCardTemplates}
            remarkTemplates={remarkTemplates}
            organization={organizations.find(
              (o) => o.id === currentUser?.org_id,
            )}
            onSaveResults={async (data: any) => {
              try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/results/bulk`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify(data),
                });
                if (!res.ok) {
                  const contentType = res.headers.get("content-type");
                  const errData =
                    contentType && contentType.includes("application/json")
                      ? await res.json()
                      : null;
                  throw new Error(
                    errData?.error ||
                    `Server error (${res.status}): Failed to record results`,
                  );
                }
                (window as any).showToast?.(
                  "Results recorded successfully!",
                  "success",
                );
                await loadData();
              } catch (err: any) {
                (window as any).showToast?.(err.message, "error");
              }
            }}
          />
        ),

      "Grading Scale": (
        <ExamModules.GradingScale
          data={gradingScales}
          classes={classList}
          onSave={(data) => handleEntitySave("grading-scale", data)}
          onDelete={(item) => handleEntityDelete("grading-scale", item)}
        />
      ),

      "Report Card Builder": (
        <ExamModules.ReportCardBuilder
          data={reportCardTemplates}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          onSave={(data) => handleEntitySave("report-card-template", data)}
          onDelete={(item) => handleEntityDelete("report-card-template", item)}
        />
      ),

      "Remarks Template": (
        <ExamModules.RemarksTemplate
          data={remarkTemplates}
          onSave={(data) => handleEntitySave("remark-template", data)}
          onDelete={(item) => handleEntityDelete("remark-template", item)}
        />
      ),

      "Student ID Cards": (
        <AcademicModules.StudentIDCards
          students={studentList.filter((s) => s.status !== "Alumni" && s.status !== "Withdrawn")}
          classes={classList}
        />
      ),

      "Fees & Assignment": (
        <FinanceModules.FeeStructure
          role={currentRole}
          classes={classList}
          students={studentList}
          data={
            currentRole === "STUDENT" || currentRole === "PARENT"
              ? feeStructures.filter((f) =>
                f.assigned_classes?.some(
                  (c: any) => String(c.id) === String(activeStudentClassId),
                ),
              )
              : feeStructures
          }
          onSave={
            currentRole === "STUDENT"
              ? undefined
              : (data) => handleEntitySave("fee-structure", data)
          }
          onDelete={
            currentRole === "STUDENT"
              ? undefined
              : (item) => handleEntityDelete("fee-structure", item)
          }
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
        />
      ),

      "Generate Class Fees": (
        <FinanceModules.ClassFees
          classes={classList}
          feeStructures={feeStructures}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          onGenerate={async (data) => {
            const { fee_structure_ids, ...rest } = data;
            try {
              for (const feeId of fee_structure_ids) {
                await handleEntitySave("fee_assignment", {
                  ...rest,
                  fee_structure_id: feeId,
                  target_type: "class",
                });
              }
              showToast("Class fees generated successfully", "success");
            } catch (err) {
              console.error("Failed to generate class fees:", err);
            }
          }}
        />
      ),

      "Fee Management": (
        <FinanceModules.FeeManagement
          students={studentList}
          feeStructures={feeStructures}
          data={studentFeesSummary}
          invoices={invoices}
          payments={receipts}
          scholarships={scholarships}
          onSave={(data) => handleEntitySave("fee_assignment", data)}
          onDelete={(item) => handleEntityDelete("fee_assignment", item)}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          documentTemplates={documentTemplates}
          onRefreshTemplates={async () => {
            const res = await fetchDocumentTemplates();
            setDocumentTemplates(res);
          }}
          onNavigate={(view) => {
            if (view === "Dashboard") setIsSMSPanelOpen(true);
            setCurrentView(view);
          }}
        />
      ),

      "Daily Collections": (
        <FinanceModules.DailyCollections
          students={studentList}
          data={receipts.filter((r) => !r.invoice_id && !r.invoiceId)}
          invoices={invoices}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          documentTemplates={documentTemplates}
          onSave={(data) => handleEntitySave("receipt", data)}
          onDelete={(item) => handleEntityDelete("receipt", item)}
          onRefreshTemplates={async () => {
            const res = await fetchDocumentTemplates();
            setDocumentTemplates(res);
          }}
        />
      ),

      "Sellable Items (Stocks)": (
        <FinanceModules.Stocks
          students={studentList}
          data={uniforms}
          requests={inventorySales}
          onSave={(data) => handleEntitySave("uniform", data)}
          onDelete={(item) => handleEntityDelete("uniform", item)}
          onSaveRequest={(data) => handleEntitySave("inventory-sale", data)}
          onDeleteRequest={(item) => handleEntityDelete("inventory-sale", item)}
        />
      ),

      Scholarships: (
        <FinanceModules.Scholarships
          students={studentList}
          scholarshipTypes={scholarshipTypes}
          data={scholarships}
          onSave={(data) => handleEntitySave("scholarship", data)}
          onDelete={(item) => handleEntityDelete("scholarship", item)}
          onSaveType={(data) => handleEntitySave("scholarship-type", data)}
          onDeleteType={(item) => handleEntityDelete("scholarship-type", item)}
        />
      ),

      "Expenses & Budget": (
        <FinanceModules.ExpensesBudget
          data={combinedExpenses}
          budgets={budgets}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          onSave={(data) => handleEntitySave("expense", data)}
          onDelete={(item) => handleEntityDelete("expense", item)}
          onSaveBudget={(data) => {
            const newBudgets = [...budgets];
            const index = newBudgets.findIndex(
              (b) => b.category === data.category,
            );
            if (index >= 0) {
              newBudgets[index].amount = parseFloat(data.amount);
            } else {
              newBudgets.push({
                category: data.category,
                amount: parseFloat(data.amount),
              });
            }
            setBudgets(newBudgets);
            showToast("Budget updated locally", "success");
          }}
        />
      ),

      "Financial Reports": (
        <FinanceModules.FinancialReports
          invoices={invoices}
          payments={receipts}
          expenses={expenses}
          budgets={budgets}
          inventorySales={inventorySales}
          transportAssignments={transportAssignments}
          hostelAssignments={hostelAssignments}
        />
      ),

      "Invoices & Payments": (
        <FinanceModules.InvoicesPayments
          role={currentRole}
          students={studentList}
          selectedWardId={selectedWardId}
          onWardSelect={setSelectedWardId}
          inventoryItems={uniforms}
          payments={receipts}
          onRecordPayment={async (data) => {
            await handleEntitySave("receipt", data);

            // Check if the invoice is fully paid
            if (data.invoice_id) {
              const invoice = invoices.find((i) => String(i.id) === String(data.invoice_id));
              if (invoice) {
                const priorPayments = receipts.filter(
                  (r) => String(r.invoice_id) === String(data.invoice_id) || String(r.invoiceId) === String(data.invoice_id)
                );
                const totalPaid = priorPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0) + parseFloat(data.amount || 0);

                if (totalPaid >= parseFloat(invoice.amount || 0)) {
                  await handleEntitySave("invoice", { id: data.invoice_id, status: "Paid" });
                } else if (totalPaid > 0) {
                  await handleEntitySave("invoice", { id: data.invoice_id, status: "Partial" });
                }
              }
            }
            loadData();
          }}
          wards={wards}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          data={
            currentRole === "STUDENT"
              ? invoices.filter(
                (i) =>
                  String(i.student_id) ===
                  String(
                    studentList.find((s) => s.email === currentUser?.email)
                      ?.id || currentUser?.id,
                  ),
              )
              : currentRole === "PARENT"
                ? invoices.filter((i) => i.student_id === selectedWardId)
                : invoices
          }
          feeStructures={feeStructures}
          onSave={
            currentRole === "STUDENT" || currentRole === "PARENT"
              ? undefined
              : (data) => handleEntitySave("invoice", data)
          }
          onDelete={
            currentRole === "STUDENT" || currentRole === "PARENT"
              ? undefined
              : (item) => handleEntityDelete("invoice", item)
          }
          canEdit={(item) => {
            const student = studentList.find(s => s.id === item.student_id);
            return !student || student.status !== 'Alumni';
          }}
          canDelete={(item) => {
            const student = studentList.find(s => s.id === item.student_id);
            return !student || student.status !== 'Alumni';
          }}
        />
      ),

      Organogram: (
        <HRModules.Organogram
          staff={staffList}
          departments={departments}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          onSaveStaff={async (data) => {
            await updateStaff(data.id, data);
            await loadData();
          }}
          onSaveDepartment={async (data) => {
            await updateDepartment(data.id, data);
            await loadData();
          }}
        />
      ),

      "Teachers on Duty": (
        <HRModules.TeachersOnDuty
          role={currentRole}
          data={teachersOnDuty}
          staffList={staffList}
          currentStaff={staffList.find((s) => s.email === currentUser?.email)}
          onSave={(data) => handleEntitySave("teacher-on-duty", data)}
          onDelete={(item) => handleEntityDelete("teacher-on-duty", item)}
        />
      ),

      "Roles & Permissions": (
        <HRModules.RolesPermissions
          staff={staffList}
          onSave={(data) => handleEntitySave("staff", data)}
        />
      ),

      "Parent Management": (
        <HRModules.ParentManagement
          students={studentList}
          onSave={async (data) => {
            console.log("Saving Parent Management data:", data);
            try {
              // 1. Update Primary Parent (if email exists)
              if (data.parent_email) {
                await updateParent(data.parent_email, {
                  parent_name: data.parent_name,
                  contact: data.contact,
                });
              }

              // 2. Update Secondary Parent (if email exists and is different)
              if (data.secondary_parent_email && data.secondary_parent_email !== data.parent_email) {
                await updateParent(data.secondary_parent_email, {
                  parent_name: data.secondary_parent_name,
                  contact: data.secondary_parent_contact,
                });
              }

              // 3. Update Student specific fields (including linking to parent)
              if (data.id) {
                const studentPayload = {
                  name: data.name || data.student_name || "Unknown",
                  religion: data.religion,
                  parent_email: data.parent_email,
                  secondary_parent_email: data.secondary_parent_email,
                  parent_name: data.parent_name,
                  contact: data.contact,
                  secondary_parent_name: data.secondary_parent_name,
                  secondary_parent_contact: data.secondary_parent_contact
                };
                console.log("Updating student:", data.id, studentPayload);
                await updateStudent(data.id, studentPayload);
              }

              (window as any).showToast?.(
                "Parent and student details updated!",
                "success",
              );

              // Refresh state properly
              const updatedStudents = await fetchStudents();
              setStudentList(updatedStudents);
            } catch (err: any) {
              console.error("Parent Management Save Error:", err);
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to update details",
                "error",
              );
            }
          }}
        />
      ),


      Payroll: (
        <HRModules.Payroll
          role={currentRole}
          data={payrollEntries}
          staffList={staffList}
          platformUsers={platformUsers}
          currentUser={currentUser}
          organization={organizations.find(
            (o) => String(o.id) === String(currentUser?.org_id),
          )}
          onSave={(data) => handleEntitySave("payroll", data)}
          onDelete={(item) => handleEntityDelete("payroll", item)}
          onRunPayroll={async (monthYear, staffIds) => {
            try {
              const result = await runPayroll(monthYear, staffIds);
              (window as any).showToast?.(
                result.message || "Payroll generated!",
                "success",
              );
              // Refresh data
              const fresh = await fetchPayroll();
              setPayrollEntries(fresh);
            } catch (err: any) {
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to run payroll",
                "error",
              );
            }
          }}
        />
      ),

      "Leave Management": (
        <HRModules.LeaveManagement
          role={currentRole}
          data={leaveRequests}
          staffList={staffList}
          currentUser={currentUser}
          organization={organizations.find(
            (o) => String(o.id) === String(currentUser?.org_id),
          )}
          onSave={(data) => handleEntitySave("leave-request", data)}
          onDelete={(item) => handleEntityDelete("leave-request", item)}
          onResetBalances={async () => {
            try {
              const res = await resetLeaveBalances();
              (window as any).showToast?.(
                res.message || "Balances reset successfully!",
                "success",
              );
              // Refresh staff data to see new balances
              const freshStaff = await fetchStaff();
              setStaffList(freshStaff);
            } catch (err: any) {
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to reset balances",
                "error",
              );
            }
          }}
          onUpdateOrganization={async (orgData) => {
            try {
              const updatedOrg = await updateOrganization(
                currentUser?.org_id,
                orgData,
              );
              (window as any).showToast?.(
                "Organization settings updated!",
                "success",
              );
              // Refresh organizations list
              setOrganizations((prev) =>
                prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o)),
              );
            } catch (err: any) {
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to update settings",
                "error",
              );
            }
          }}
        />
      ),

      Performance: (
        <HRModules.Performance
          role={currentRole}
          data={
            currentRole === "STAFF" || currentRole === "HOD"
              ? staffData?.performanceReviews || []
              : performanceReviews
          }
          staffList={
            currentRole === "HOD" ? staffData?.profile || [] : staffList
          }
          onSave={(data) => handleEntitySave("performance", data)}
          onDelete={(item) => handleEntityDelete("performance", item)}
        />
      ),

      "Book Management": (
        <LibraryModules.BookManagement
          data={books}
          onSave={async (data) => {
            try {
              if (data.id && !data.id.startsWith("temp-")) {
                await updateBook(data.id, data);
                (window as any).showToast?.(
                  "Book updated successfully!",
                  "success",
                );
              } else {
                await createBook(data);
                (window as any).showToast?.(
                  "Book added successfully!",
                  "success",
                );
              }
              await loadData();
            } catch (err: any) {
              console.error("Save failed:", err);
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to save book",
                "error",
              );
            }
          }}
          onDelete={async (item) => {
            try {
              if (
                window.confirm("Are you sure you want to delete this book?")
              ) {
                await deleteBook(item.id);
                (window as any).showToast?.("Book deleted!", "success");
                await loadData();
              }
            } catch (err: any) {
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to delete book",
                "error",
              );
            }
          }}
        />
      ),

      "Borrowed Books": (
        <LibraryModules.BorrowedBooks
          data={bookLoans}
          userId={currentUser?.id}
        />
      ),

      "Borrow & Return": (
        <LibraryModules.BorrowReturn
          role={currentRole}
          data={
            currentRole === "STUDENT"
              ? bookLoans.filter(
                (b) =>
                  String(b.student_id) ===
                  String(
                    studentList.find((s) => s.email === currentUser?.email)
                      ?.id || currentUser?.id,
                  ),
              )
              : currentRole === "PARENT"
                ? bookLoans.filter((b) => b.student_id === selectedWardId)
                : bookLoans
          }
          books={books}
          students={studentList}
          onSave={async (data) => {
            try {
              await issueBook(data);
              (window as any).showToast?.(
                "Book issued successfully!",
                "success",
              );
              await loadData();
            } catch (err: any) {
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to issue book",
                "error",
              );
            }
          }}
          onReturn={async (id) => {
            try {
              await returnBook(id);
              (window as any).showToast?.("Book returned!", "success");
              await loadData();
            } catch (err: any) {
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to return book",
                "error",
              );
            }
          }}
          onMarkAsLost={async (id) => {
            try {
              await markBookAsLost(id);
              (window as any).showToast?.(
                "Book marked as lost and invoice generated!",
                "success",
              );
              await loadData();
            } catch (err: any) {
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to mark as lost",
                "error",
              );
            }
          }}
        />
      ),

      "Digital Library": (
        <LibraryModules.DigitalLibrary
          role={currentRole}
          data={books.filter((b) => b.is_digital)}
          onSave={async (data) => {
            try {
              if (data.id && !data.id.startsWith("temp-")) {
                await updateBook(data.id, data);
                (window as any).showToast?.(
                  "Book updated successfully!",
                  "success",
                );
              } else {
                await createBook({ ...data, is_digital: true });
                (window as any).showToast?.(
                  "Digital book uploaded successfully!",
                  "success",
                );
              }
              await loadData();
            } catch (err: any) {
              console.error("Upload failed:", err);
              (window as any).showToast?.(
                err?.response?.data?.error || "Failed to upload digital book",
                "error",
              );
              throw err; // Re-throw to propagate to component
            }
          }}
        />
      ),

      Transport: (
        <OperationsModules.Transport
          role={currentRole}
          currentStudentId={
            currentRole === "PARENT"
              ? selectedWardId || undefined
              : studentList.find((s) => s.email === currentUser?.email)?.id ||
              currentUser?.id
          }
          wards={wards}
          onWardSelect={setSelectedWardId}
          data={transportRoutes}
          assignments={transportAssignments}
          students={studentList}
          staff={staffList}
          onApprove={handleApproveTransport}
          onSave={
            currentRole === "STUDENT"
              ? undefined
              : (data) => handleEntitySave("transport", data)
          }
          onDelete={
            currentRole === "STUDENT"
              ? undefined
              : (item) => handleEntityDelete("transport", item)
          }
          onRefresh={loadData}
        />
      ),

      "Trip History": (
        <OperationsModules.TripHistory role={currentRole} />
      ),

      Hostel: (
        <OperationsModules.Hostel
          role={currentRole}
          currentStudentId={
            currentRole === "PARENT"
              ? selectedWardId || undefined
              : studentList.find((s) => s.email === currentUser?.email)?.id ||
              currentUser?.id
          }
          wards={wards}
          onWardSelect={setSelectedWardId}
          data={hostels}
          assignments={hostelAssignments}
          students={studentList}
          onApprove={handleApproveHostel}
          onSave={
            currentRole === "STUDENT"
              ? undefined
              : (data) => handleEntitySave("hostel", data)
          }
          onDelete={
            currentRole === "STUDENT"
              ? undefined
              : (item) => handleEntityDelete("hostel", item)
          }
          onRefresh={loadData}
        />
      ),

      "Student Clubs": (
        <OperationsModules.Clubs
          role={currentRole}
          currentStudentId={
            currentRole === "PARENT"
              ? selectedWardId || undefined
              : studentList.find((s) => s.email === currentUser?.email)?.id ||
              currentUser?.id
          }
          wards={wards}
          onWardSelect={setSelectedWardId}
          data={clubs}
          students={studentList}
          staff={staffList}
          onSave={(data) => handleEntitySave("club", data)}
          onDelete={(item) => handleEntityDelete("club", item)}
          onRefresh={loadData}
        />
      ),


      "Assets & Equipment": (
        <OperationsModules.Inventory
          data={inventory}
          onSave={(data) => handleEntitySave("inventory", data)}
          onDelete={(item) => handleEntityDelete("inventory", item)}
        />
      ),

      "Health / Medical": (
        <OperationsModules.HealthMedical
          role={currentRole}
          currentStudentId={
            currentRole === "PARENT"
              ? selectedWardId || undefined
              : studentList.find((s) => s.email === currentUser?.email)?.id ||
              currentUser?.id
          }
          wards={wards}
          onWardSelect={setSelectedWardId}
          data={
            currentRole === "STUDENT"
              ? healthRecords.filter(
                (h) =>
                  String(h.student_id) ===
                  String(
                    studentList.find((s) => s.email === currentUser?.email)
                      ?.id || currentUser?.id,
                  ),
              )
              : currentRole === "PARENT"
                ? healthRecords.filter((h) => h.student_id === selectedWardId)
                : healthRecords
          }
          staffList={staffList}
          students={studentList}
          onSave={
            currentRole === "STUDENT" || currentRole === "PARENT"
              ? undefined
              : (data) => handleEntitySave("health", data)
          }
          onDelete={
            currentRole === "STUDENT" || currentRole === "PARENT"
              ? undefined
              : (item) => handleEntityDelete("health", item)
          }
          canEdit={(item) => {
            const student = studentList.find(s => s.id === item.student_id);
            return !student || student.status !== 'Alumni';
          }}
          canDelete={(item) => {
            const student = studentList.find(s => s.id === item.student_id);
            return !student || student.status !== 'Alumni';
          }}
        />
      ),

      "Behavior & Discipline": (
        <OperationsModules.BehaviorDiscipline
          role={currentRole}
          currentStudentId={
            currentRole === "PARENT"
              ? selectedWardId || undefined
              : studentList.find((s) => s.email === currentUser?.email)?.id ||
              currentUser?.id
          }
          wards={wards}
          onWardSelect={setSelectedWardId}
          data={
            currentRole === "STUDENT"
              ? behaviorIncidents.filter(
                (b) =>
                  String(b.student_id) ===
                  String(
                    studentList.find((s) => s.email === currentUser?.email)
                      ?.id || currentUser?.id,
                  ),
              )
              : currentRole === "PARENT"
                ? behaviorIncidents.filter(
                  (b) => b.student_id === selectedWardId,
                )
                : behaviorIncidents
          }
          students={studentList}
          onSave={
            currentRole === "STUDENT" || currentRole === "PARENT"
              ? undefined
              : (data) => handleEntitySave("behavior", data)
          }
          onDelete={
            currentRole === "STUDENT" || currentRole === "PARENT"
              ? undefined
              : (item) => handleEntityDelete("behavior", item)
          }
          canEdit={(item) => {
            const student = studentList.find(s => s.id === item.student_id);
            return !student || student.status !== 'Alumni';
          }}
          canDelete={(item) => {
            const student = studentList.find(s => s.id === item.student_id);
            return !student || student.status !== 'Alumni';
          }}
        />
      ),

      "My Drive": <StorageModules.MyDrive />,

      "Folder Management": <StorageModules.FolderManagement />,
      "Gallery": <PortfolioView role={currentRole} />,
      "Gallery Upload": <PortfolioUpload />,
      "Whistle Blower": <WhistleblowerView role={currentRole} />,

      Departments: (
        <AcademicModules.DepartmentManagement
          data={departments}
          staff={staffList}
          subjects={subjectList}
          onSave={(data) => handleEntitySave("department", data)}
          onDelete={(item) => handleEntityDelete("department", item)}
        />
      ),

      "Ask AI": (
        <AIModules.AIChatbot
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          currentUser={currentUser}
          role={currentRole}
        />
      ),

      "Performance Insights": (
        <AIModules.PerformancePrediction
          role={currentRole}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          results={
            currentRole === "STUDENT"
              ? results.filter(
                (r) =>
                  r.student_id ===
                  studentList.find((s) => s.email === currentUser?.email)?.id,
              )
              : currentRole === "PARENT"
                ? results.filter((r) => r.student_id === selectedWardId)
                : results
          }
          students={
            currentRole === "STUDENT"
              ? studentList.filter((s) => s.email === currentUser?.email)
              : currentRole === "PARENT"
                ? studentList.filter((s) => s.id === selectedWardId)
                : studentList
          }
        />
      ),

      "CBT Exams": (
        <ELearningModules.CBTExam
          subjects={
            activeStudentClassId
              ? subjectList.filter((s) => s.class_id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.subjects || []
                : subjectList
          }
          classes={
            activeStudentClassId
              ? classList.filter((c) => c.id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.classes || []
                : classList
          }
          role={currentRole}
          instructorId={staffData?.profile?.[0]?.id}
        />
      ),

      "Online Classes": (
        <ELearningModules.OnlineClasses
          subjects={
            activeStudentClassId
              ? subjectList.filter((s) => s.class_id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.subjects || []
                : subjectList
          }
          classes={
            activeStudentClassId
              ? classList.filter((c) => c.id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.classes || []
                : classList
          }
          role={currentRole}
          instructorId={staffData?.profile?.[0]?.id}
          currentUserName={currentUser?.name}
        />
      ),

      Assignments: (
        <ELearningModules.Assignments
          subjects={
            activeStudentClassId
              ? subjectList.filter((s) => s.class_id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.subjects || []
                : subjectList
          }
          classes={
            activeStudentClassId
              ? classList.filter((c) => c.id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.classes || []
                : classList
          }
          role={currentRole}
          instructorId={staffData?.profile?.[0]?.id}
        />
      ),

      "Study Materials": (
        <ELearningModules.StudyMaterials
          subjects={
            activeStudentClassId
              ? subjectList.filter((s) => s.class_id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.subjects || []
                : subjectList
          }
          classes={
            activeStudentClassId
              ? classList.filter((c) => c.id === activeStudentClassId)
              : currentRole === "STAFF"
                ? staffData?.classes || []
                : classList
          }
          role={currentRole}
        />
      ),

      "Change Password": (
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] max-w-md mx-auto">
          <h3 className="text-xl font-bold mb-6">Change Password</h3>
          <form className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Current Password
              </label>
              <input
                type="password"
                title="currentPassword"
                name="currentPassword"
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500">
                New Password
              </label>
              <input
                type="password"
                title="newPassword"
                name="newPassword"
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Confirm New Password
              </label>
              <input
                type="password"
                title="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
            >
              Update Password
            </button>
          </form>
        </div>
      ),

      "Privacy Settings": (
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-6">Privacy Settings</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Profile Visibility</p>
                <p className="text-sm text-zinc-500">
                  Show your profile to other staff members
                </p>
              </div>
              <input
                type="checkbox"
                title="profileVisibility"
                name="profileVisibility"
                className="w-5 h-5 rounded border-zinc-300 text-indigo-600"
                defaultChecked
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Data Sharing</p>
                <p className="text-sm text-zinc-500">
                  Allow sharing of usage data for system improvements
                </p>
              </div>
              <input
                type="checkbox"
                title="dataSharing"
                name="dataSharing"
                className="w-5 h-5 rounded border-zinc-300 text-indigo-600"
              />
            </div>
          </div>
        </div>
      ),

      "Notification Settings": (
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-6">Notification Settings</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Email Notifications</p>
                <p className="text-sm text-zinc-500">
                  Receive system updates via email
                </p>
              </div>
              <input
                type="checkbox"
                title="emailNotifications"
                name="emailNotifications"
                className="w-5 h-5 rounded border-zinc-300 text-indigo-600"
                defaultChecked
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Push Notifications</p>
                <p className="text-sm text-zinc-500">
                  Receive real-time alerts in the browser
                </p>
              </div>
              <input
                type="checkbox"
                title="pushNotifications"
                name="pushNotifications"
                className="w-5 h-5 rounded border-zinc-300 text-indigo-600"
                defaultChecked
              />
            </div>
          </div>
        </div>
      ),

      "Document Builder": (
        <DocumentBuilder
          data={documentTemplates}
          organization={organizations.find((o) => o.id === currentUser?.org_id)}
          onRefresh={loadData}
        />
      ),

      Subscriptions:
        currentRole === "SUPER_ADMIN" ? (
          <SubscriptionPlans
            data={subscriptions}
            organizations={organizations}
            plans={planTemplates}
            onRefresh={loadData}
          />
        ) : (
          <SchoolBilling
            currentSubscription={subscriptions.find(
              (s) => s.org_id === currentUser?.org_id && s.status === "Active",
            ) || subscriptions.find(
              (s) => s.org_id === currentUser?.org_id,
            )}
            plans={planTemplates}
            organization={organizations.find((o) => o.id === currentUser?.org_id)}
          />
        ),

      Users: (
        <UsersManagement
          data={platformUsers}
          onRefresh={loadData}
          organizations={organizations}
        />
      ),

      "Module Control": (
        <SuperAdminModules.ModuleControl
          data={systemModules}
          onAdd={() => showToast("New Module Added successfully!", "success")}
          onToggle={async (mod) => {
            try {
              await updateModule(mod.id, {
                status: mod.status === "Enabled" ? "Disabled" : "Enabled",
              });
              showToast(
                `${mod.name} ${mod.status === "Enabled" ? "disabled" : "enabled"} successfully!`,
                "success",
              );
              loadData();
            } catch (err) {
              console.error("Failed to toggle module:", err);
              showToast("Failed to toggle module", "error");
            }
          }}
          onDelete={(mod) =>
            setDeleteConfirm({ isOpen: true, item: mod, type: "module" })
          }
        />
      ),

      "Audit Logs": <AuditLogs data={auditLogs} />,

      Partners: (
        <PartnersManagement onRefresh={loadData} />
      ),

      // Student Modules
      "Personal Information": (
        <StudentModules.PersonalInformation
          currentUser={currentUser}
          students={studentList}
        />
      ),
      "Academic Information": (
        <StudentModules.AcademicInformation
          role={currentRole}
          currentUser={currentUser}
          students={studentList}
          subjects={subjectList}
          classes={classList}
        />
      ),
      "Academic Profile": (
        <StudentModules.AcademicInformation
          currentUser={currentUser}
          students={studentList}
          subjects={subjectList}
          classes={classList}
        />
      ),
      "Parent/Guardian Details": (
        <StudentModules.ParentGuardianDetails
          currentUser={currentUser}
          students={studentList}
        />
      ),
      Documents: <StudentModules.Documents />,
      "Edit Profile": <StudentModules.EditProfile />,
      "Inventory Request": (
        <StudentModules.UniformRequests
          role={currentRole}
          uniforms={combinedInventory}
          wards={wards}
          onWardSelect={setSelectedWardId}
          studentId={
            currentRole === "STUDENT"
              ? studentList.find((st) => st.email === currentUser?.email)?.id
              : selectedWardId
          }
          data={inventorySales.filter((s) => {
            const studentId =
              currentRole === "STUDENT"
                ? studentList.find((st) => st.email === currentUser?.email)?.id
                : currentRole === "PARENT"
                  ? selectedWardId
                  : null;
            return String(s.student_id) === String(studentId);
          })}
          onSave={(data) => handleEntitySave("inventory-sale", data)}
        />
      ),

      // New Student View Mappings
      "My Subjects": (
        <AcademicModules.SubjectManagement
          data={subjectList.filter(
            (s) =>
              s.class_id ===
              studentList.find((st) => st.email === currentUser?.email)
                ?.class_id,
          )}
          role="STUDENT"
          classes={classList}
          departments={departments}
          staff={staffList}
        />
      ),

      "Teacher List": (
        <StudentModules.TeacherList
          students={studentList}
          staff={staffList}
          subjects={subjectList}
          classes={classList}
          currentUser={currentUser}
          studentId={
            currentRole === "STUDENT"
              ? studentList.find((st) => st.email === currentUser?.email)?.id
              : selectedWardId
          }
        />
      ),
      "Inventory & Assets": (
        <InventoryAssetManagement />
      ),
      "Feedback & Grievances": currentRole === "SCHOOL_ADMIN" ? (
        <FeedbackManagement />
      ) : (
        <ParentModules.FeedbackGrievances currentUser={currentUser} />
      ),
      profile:
        currentRole === "SUPER_ADMIN" ? (
          <Profile
            currentUser={currentUser}
            orgCount={organizations.length}
            partnerCount={partnerList?.length || 0}
            totalUsers={platformUsers.length}
          />
        ) : currentRole === "SCHOOL_ADMIN" ? (
          <Profile
            currentUser={currentUser}
            studentsCount={studentList.length}
            staffCount={staffList.length}
            departmentsCount={departments.length}
            organization={organization}
          />
        ) : staffData?.profile?.length ? (
          <StaffHRModules.StaffProfile
            data={staffData.profile}
            onSave={(data) => handleEntitySave("staff", data)}
          />
        ) : currentRole === "PARENT" ? (
          <ParentModules.ParentProfile
            currentUser={currentUser}
            wards={wards}
            onNavigate={setCurrentView}
            onEnableNotifications={handleEnableNotifications}
          />
        ) : (
          <div className="p-8 text-center text-zinc-500">
            Profile Module for {currentRole} coming soon...
          </div>
        ),
    };

    return (
      moduleMap[currentView] || (
        <div className="p-8 text-center text-zinc-500">
          Module "{currentView}" coming soon...
        </div>
      )
    );
  };

  if (isPublicLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center animate-pulse mb-6">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
          {view === 'FeeHistory' ? 'Retrieving Fee History...' : 'Retrieving Official Record...'}
        </h2>
        <p className="text-zinc-500 font-medium text-center">
          {view === 'FeeHistory' ? 'Please wait while we secure your ward\'s financial data.' : 'Please wait while we secure your ward\'s data.'}
        </p>
      </div>
    );
  }

  if (publicResultData) {
    if (publicResultData.isFeeHistory) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
          <div className="p-4 sm:p-6 flex justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white uppercase leading-none">Official Fee Statement</h2>
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Secure Parent Portal</p>
              </div>
            </div>
            <button
              onClick={() => { setPublicResultData(null); setShowLanding(true); }}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 transition-all hover:scale-105 active:scale-95"
              title="Close View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {FinanceModules.FeeHistoryPreview && (
              <FinanceModules.FeeHistoryPreview data={publicResultData} />
            )}
          </div>
        </div>
      );
    }

    // Ensure data exists before results mapping
    if (!publicResultData || !publicResultData.results) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8">
          <div className="p-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl">
            <p className="font-bold">Invalid record data detected.</p>
            <button onClick={() => { setPublicResultData(null); setShowLanding(true); }} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Back to Home</button>
          </div>
        </div>
      );
    }

    const { student, results, organization, template, gradingScale, term, year } = publicResultData;

    // Prepare student object for ReportCardPreview
    const formattedStudent = {
      ...student,
      results: results.map((r: any) => ({
        subject: r.subject_name || r.subject,
        classScore: (r.score_details as any)?.showClassScore || 0,
        examScore: (r.score_details as any)?.showExamScore || 0,
        score: r.score,
        grade: r.grade,
        rank: '—',
        remark: r.remark || '—'
      }))
    };

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl shadow-indigo-200/50 dark:shadow-none overflow-hidden relative">
          <button
            onClick={() => { setPublicResultData(null); setShowLanding(true); }}
            className="absolute top-8 right-8 z-50 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-zinc-500 transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
          <ReportCardPreview
            template={template}
            organization={organization}
            student={formattedStudent}
            onClose={() => { setPublicResultData(null); setShowLanding(true); }}
          />
        </div>
      </div>
    );
  }

  if (publicError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center max-w-md animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase">Record Error</h2>
          <p className="text-zinc-500 font-medium mb-8">{publicError}</p>
          <button
            onClick={() => {
              setPublicError(null);
              setShowLanding(true);
            }}
            className="w-full px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (showLanding)
    return (
      <LandingPage
        onGetStarted={() => {
          setShowLanding(false);
          setShowLogin(true);
        }}
        onLogin={handleLogin}
        onPartnerLogin={() => {
          setShowLanding(false);
          setShowPartnerLogin(true);
        }}
      />
    );
  if (showLogin)
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => {
          setShowLanding(true);
          setShowLogin(false);
        }}
      />
    );

  if (showPartnerLogin)
    return (
      <PartnerLogin
        onLoginSuccess={(data) => {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setCurrentUser(data.user);
          setCurrentRole(data.user.role);
          if (data.user.language) setLanguage(data.user.language as any);
          setShowPartnerLogin(false);
          loadData();
        }}
        onBackToLanding={() => {
          setShowPartnerLogin(false);
          setShowLanding(true);
        }}
      />
    );

  const organization = organizations.find((o) => o.id === currentUser?.org_id);

  if (currentRole === 'PARTNER') {
    return <PartnerDashboard />;
  }

  return (
    <Layout
      currentRole={currentRole}
      currentView={currentView}
      onNavigate={setCurrentView}
      onLogout={handleLogout}
      onRoleChange={(role) => {
        setCurrentRole(role);
        setCurrentView("Dashboard");
      }}
      allowedModules={allowedModules}
      currentUser={currentUser}
      organization={organization}
      wards={wards}
      selectedWardId={selectedWardId}
      onWardSelect={setSelectedWardId}
      subscriptionInfo={subscriptionInfo}
      notifications={announcements}
      unreadMessagesCount={unreadMessagesCount}
    >
      <div className="max-w-[1600px] mx-auto">{renderContent()}</div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDelete}
        title={`Delete ${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)}`}
        message={`Are you sure you want to delete this ${deleteConfirm.type}? This action is IRREVERSIBLE and will delete all associated data.`}
      />

      <Modal
        isOpen={globalModal.isOpen}
        onClose={() => setGlobalModal({ ...globalModal, isOpen: false })}
        title={globalModal.title}
        footer={
          <>
            <button
              onClick={() => setGlobalModal({ ...globalModal, isOpen: false })}
              className="px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const form = document.querySelector("#global-modal-form") as HTMLFormElement;
                if (form) {
                  const formData = new FormData(form);
                  const data: any = {};
                  formData.forEach((value, key) => {
                    data[key] = value;
                  });
                  if (globalModal.onSave) {
                    await globalModal.onSave(data);
                  }
                  setGlobalModal({ ...globalModal, isOpen: false });
                }
              }}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Confirm
            </button>
          </>
        }
      >
        <form id="global-modal-form" onSubmit={(e) => e.preventDefault()}>
          {globalModal.content}
        </form>
      </Modal>
    </Layout>
  );
}
