import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { Student, Inquiry, Application, Acceptance } from '../types';
import { getFriendlyErrorMessage } from './errorHelper';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Attach a user-friendly message to the error object
    error.friendlyMessage = getFriendlyErrorMessage(error);

    // Exclude the login endpoint because a 401 there means invalid credentials,
    // which should be handled by the UI instead of forcing a page reload.
    const isLoginEndpoint = error.config && error.config.url === '/auth/login';

    if (error.response && error.response.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const loginPartner = async (credentials: any) => {
  const response = await api.post('/auth/partner/login', credentials);
  return response.data;
};

export const registerPartner = async (partnerData: any) => {
  const response = await api.post('/auth/partner/register', partnerData);
  return response.data;
};

export const fetchPartnerDashboard = async () => {
  const response = await api.get('/partner/dashboard');
  return response.data;
};

export const requestDemo = async (data: { school_name: string, contact_email: string }) => {
  const response = await api.post('/demo-request', data);
  return response.data;
};


export const partnerCreateSchool = async (schoolData: any) => {
  const response = await api.post('/partner/schools', schoolData);
  return response.data;
};

export const approveReferral = async (orgId: string) => {
  const response = await api.post(`/partner/approve/${orgId}`);
  return response.data;
};

// Super Admin Partner Management
export const fetchPartners = async () => {
  const response = await api.get('/partners');
  return response.data;
};

export const createPartnerAdmin = async (data: any) => {
  const response = await api.post('/partners', data);
  return response.data;
};

export const updatePartner = async (id: string, data: any) => {
  const response = await api.patch(`/partners/${id}`, data);
  return response.data;
};

export const deletePartnerAdmin = async (id: string) => {
  const response = await api.delete(`/partners/${id}`);
  return response.data;
};

export const approvePartner = async (id: string) => {
  const response = await api.post(`/partners/${id}/approve`);
  return response.data;
};

export const resetPartnerPassword = async (id: string) => {
  const response = await api.post(`/partners/${id}/reset-password`);
  return response.data;
};

export const registerPlatformUser = async (user: any) => {
  const response = await api.post('/auth/register', user);
  return response.data;
};

// Students
export const fetchStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const createStudent = async (student: any) => {
  const response = await api.post('/students', student);
  return response.data;
};

export const updateStudent = async (id: string, student: any) => {
  const response = await api.patch(`/students/${id}`, student);
  return response.data;
};

export const deleteStudent = async (id: string) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

// Admissions
export const fetchInquiries = async () => {
  const response = await api.get('/admissions/inquiries');
  return response.data;
};

export const createInquiry = async (inquiry: any) => {
  const response = await api.post('/admissions/inquiries', inquiry);
  return response.data;
};

export const updateInquiry = async (id: string, inquiry: any) => {
  const response = await api.patch(`/admissions/inquiries/${id}`, inquiry);
  return response.data;
};

export const deleteInquiry = async (id: string) => {
  const response = await api.delete(`/admissions/inquiries/${id}`);
  return response.data;
};

export const fetchApplications = async () => {
  const response = await api.get('/admissions/applications');
  return response.data;
};

export const createApplication = async (app: any) => {
  const response = await api.post('/admissions/applications', app);
  return response.data;
};

export const updateApplication = async (id: string, app: any) => {
  const response = await api.patch(`/admissions/applications/${id}`, app);
  return response.data;
};

export const deleteApplication = async (id: string) => {
  const response = await api.delete(`/admissions/applications/${id}`);
  return response.data;
};

export const fetchAcceptances = async () => {
  const response = await api.get('/admissions/acceptances');
  return response.data;
};

export const createAcceptance = async (acc: any) => {
  const response = await api.post('/admissions/acceptances', acc);
  return response.data;
};

export const updateAcceptance = async (id: string, acc: any) => {
  const response = await api.patch(`/admissions/acceptances/${id}`, acc);
  return response.data;
};

export const deleteAcceptance = async (id: string) => {
  const response = await api.delete(`/admissions/acceptances/${id}`);
  return response.data;
};

// HR
export const fetchStaff = async () => {
  const response = await api.get('/hr/staff');
  return response.data;
};

export const createStaff = async (staff: any) => {
  const response = await api.post('/hr/staff', staff);
  return response.data;
};

export const updateStaff = async (id: string, staff: any) => {
  const response = await api.patch(`/hr/staff/${id}`, staff);
  return response.data;
};

export const deleteStaff = async (id: string) => {
  const response = await api.delete(`/hr/staff/${id}`);
  return response.data;
};

export const updateParent = async (email: string, data: any) => {
  const response = await api.patch(`/hr/parents/${email}`, data);
  return response.data;
};

export const fetchRecruitment = async () => {
  const response = await api.get('/hr/recruitment');
  return response.data;
};

export const createApplicant = async (applicant: any) => {
  const response = await api.post('/hr/recruitment', applicant);
  return response.data;
};

export const updateApplicant = async (id: string, applicant: any) => {
  const response = await api.patch(`/hr/recruitment/${id}`, applicant);
  return response.data;
};

export const deleteApplicant = async (id: string) => {
  const response = await api.delete(`/hr/recruitment/${id}`);
  return response.data;
};

export const hireCandidate = async (id: string, data: any) => {
  const response = await api.post(`/hr/recruitment/${id}/hire`, data);
  return response.data;
};

export const fetchOfferLetter = async (id: string) => {
  const response = await api.get(`/hr/recruitment/${id}/offer-letter`);
  return response.data;
};

export const fetchStaffAttendance = async () => {
  const response = await api.get('/hr/attendance');
  return response.data;
};

export const markStaffAttendance = async (attendance: any) => {
  const response = await api.post('/hr/attendance', attendance);
  return response.data;
};

export const updateStaffAttendance = async (id: string, attendance: any) => {
  const response = await api.patch(`/hr/attendance/${id}`, attendance);
  return response.data;
};

export const deleteStaffAttendance = async (id: string) => {
  const response = await api.delete(`/hr/attendance/${id}`);
  return response.data;
};

export const fetchPayroll = async () => {
  const response = await api.get('/hr/payroll');
  return response.data;
};

export const createPayroll = async (payroll: any) => {
  const response = await api.post('/hr/payroll', payroll);
  return response.data;
};

export const updatePayroll = async (id: string, payroll: any) => {
  const response = await api.patch(`/hr/payroll/${id}`, payroll);
  return response.data;
};

export const deletePayroll = async (id: string) => {
  const response = await api.delete(`/hr/payroll/${id}`);
  return response.data;
};

export const runPayroll = async (monthYear: string, staffIds?: string[]) => {
  const response = await api.post('/hr/payroll/run', { month_year: monthYear, staff_ids: staffIds });
  return response.data;
};

export const fetchLeaveRequests = async () => {
  const response = await api.get('/hr/leave-requests');
  return response.data;
};

export const createLeaveRequest = async (data: any) => {
  const response = await api.post('/hr/leave-requests', data);
  return response.data;
};

export const updateLeaveRequest = async (id: string, data: any) => {
  const response = await api.patch(`/hr/leave-requests/${id}`, data);
  return response.data;
};

export const deleteLeaveRequest = async (id: string) => {
  const response = await api.delete(`/hr/leave-requests/${id}`);
  return response.data;
};

export const resetLeaveBalances = async () => {
  const response = await api.post('/hr/leave-requests/reset-balances');
  return response.data;
};

export const fetchExitManagement = async () => {
  const response = await api.get('/hr/exit-management');
  return response.data;
};

export const createExitRecord = async (data: any) => {
  const response = await api.post('/hr/exit-management', data);
  return response.data;
};

export const updateExitRecord = async (id: string, data: any) => {
  const response = await api.patch(`/hr/exit-management/${id}`, data);
  return response.data;
};

export const deleteExitRecord = async (id: string) => {
  const response = await api.delete(`/hr/exit-management/${id}`);
  return response.data;
};

export const fetchPerformance = async () => {
  const response = await api.get('/hr/performance');
  return response.data;
};

export const createPerformanceReview = async (data: any) => {
  const response = await api.post('/hr/performance', data);
  return response.data;
};

export const fetchHODDashboardStats = async () => {
  const response = await api.get('/hr/hod/dashboard-stats');
  return response.data;
};

export const fetchExitLetter = async (id: string) => {
  const response = await api.get(`/hr/exit-management/${id}/letter`);
  return response.data;
};

export const deleteExitLetter = async (id: string) => {
  const response = await api.delete(`/hr/exit-management/${id}/letter`);
  return response.data;
};

// Performance
export const fetchPerformanceAppraisals = async () => {
  const response = await api.get('/hr/performance');
  return response.data;
};

export const createPerformanceAppraisal = async (data: any) => {
  const response = await api.post('/hr/performance', data);
  return response.data;
};

export const updatePerformanceAppraisal = async (id: string, data: any) => {
  const response = await api.patch(`/hr/performance/${id}`, data);
  return response.data;
};

export const deletePerformanceAppraisal = async (id: string) => {
  const response = await api.delete(`/hr/performance/${id}`);
  return response.data;
};

// Academic
export const fetchDepartments = async () => {
  const response = await api.get('/academic/departments');
  return response.data;
};

export const createDepartment = async (dept: any) => {
  const response = await api.post('/academic/departments', dept);
  return response.data;
};

export const updateDepartment = async (id: string, dept: any) => {
  const response = await api.patch(`/academic/departments/${id}`, dept);
  return response.data;
};

export const deleteDepartment = async (id: string) => {
  const response = await api.delete(`/academic/departments/${id}`);
  return response.data;
};

export const fetchClasses = async () => {
  const response = await api.get('/academic/classes');
  return response.data;
};

export const createClass = async (cls: any) => {
  const response = await api.post('/academic/classes', cls);
  return response.data;
};

export const updateClass = async (id: string, cls: any) => {
  const response = await api.patch(`/academic/classes/${id}`, cls);
  return response.data;
};

export const deleteClass = async (id: string) => {
  const response = await api.delete(`/academic/classes/${id}`);
  return response.data;
};

export const fetchSubjects = async () => {
  const response = await api.get('/academic/subjects');
  return response.data;
};

export const createSubject = async (sub: any) => {
  const response = await api.post('/academic/subjects', sub);
  return response.data;
};

export const updateSubject = async (id: string, sub: any) => {
  const response = await api.patch(`/academic/subjects/${id}`, sub);
  return response.data;
};

export const deleteSubject = async (id: string) => {
  const response = await api.delete(`/academic/subjects/${id}`);
  return response.data;
};

export const fetchStudentAttendance = async () => {
  const response = await api.get('/academic/attendance');
  return response.data;
};

export const markStudentAttendance = async (att: any) => {
  const response = await api.post('/academic/attendance', att);
  return response.data;
};

export const updateStudentAttendance = async (id: string, att: any) => {
  const response = await api.patch(`/academic/attendance/${id}`, att);
  return response.data;
};

export const deleteStudentAttendance = async (id: string) => {
  const response = await api.delete(`/academic/attendance/${id}`);
  return response.data;
};

export const fetchLessonNotes = async () => {
  const response = await api.get('/academic/lesson-notes');
  return response.data;
};

export const createLessonNote = async (note: any) => {
  const response = await api.post('/academic/lesson-notes', note);
  return response.data;
};

export const updateLessonNote = async (id: string, note: any) => {
  const response = await api.patch(`/academic/lesson-notes/${id}`, note);
  return response.data;
};

export const deleteLessonNote = async (id: string) => {
  const response = await api.delete(`/academic/lesson-notes/${id}`);
  return response.data;
};

export const fetchTeachersOnDuty = async () => {
  const response = await api.get('/academic/teachers-on-duty');
  return response.data;
};

export const assignTeacherOnDuty = async (tod: any) => {
  const response = await api.post('/academic/teachers-on-duty', tod);
  return response.data;
};

export const updateTeacherOnDuty = async (id: string, tod: any) => {
  const response = await api.patch(`/academic/teachers-on-duty/${id}`, tod);
  return response.data;
};

export const deleteTeacherOnDuty = async (id: string) => {
  const response = await api.delete(`/academic/teachers-on-duty/${id}`);
  return response.data;
};

export const fetchBehaviorIncidents = async () => {
  const response = await api.get('/academic/behavior');
  return response.data;
};

export const recordBehaviorIncident = async (incident: any) => {
  const response = await api.post('/academic/behavior', incident);
  return response.data;
};

export const updateBehaviorIncident = async (id: string, incident: any) => {
  const response = await api.patch(`/academic/behavior/${id}`, incident);
  return response.data;
};

export const deleteBehaviorIncident = async (id: string) => {
  const response = await api.delete(`/academic/behavior/${id}`);
  return response.data;
};

// Timetable
export const fetchTimetables = async (classId?: string) => {
  const response = await api.get('/academic/timetables', { params: { classId } });
  return response.data;
};

export const createTimetableEntry = async (entry: any) => {
  const response = await api.post('/academic/timetables', entry);
  return response.data;
};

export const updateTimetableEntry = async (id: string, entry: any) => {
  const response = await api.patch(`/academic/timetables/${id}`, entry);
  return response.data;
};

export const deleteTimetableEntry = async (id: string) => {
  const response = await api.delete(`/academic/timetables/${id}`);
  return response.data;
};

export const generateSmartTimetable = async () => {
  const response = await api.post('/academic/timetables/generate-smart');
  return response.data;
};

// Finance
export const fetchInvoices = async () => {
  const response = await api.get('/finance/invoices');
  return response.data;
};

export const createInvoice = async (inv: any) => {
  const response = await api.post('/finance/invoices', inv);
  return response.data;
};

export const updateInvoice = async (id: string, inv: any) => {
  const response = await api.patch(`/finance/invoices/${id}`, inv);
  return response.data;
};

export const deleteInvoice = async (id: string) => {
  const response = await api.delete(`/finance/invoices/${id}`);
  return response.data;
};

export const fetchStudentFeesSummary = async () => {
  const response = await api.get('/finance/student-fees-summary');
  return response.data;
};

export const fetchExpenses = async () => {
  const response = await api.get('/finance/expenses');
  return response.data;
};

export const createExpense = async (exp: any) => {
  const response = await api.post('/finance/expenses', exp);
  return response.data;
};

export const updateExpense = async (id: string, exp: any) => {
  const response = await api.patch(`/finance/expenses/${id}`, exp);
  return response.data;
};

export const deleteExpense = async (id: string) => {
  const response = await api.delete(`/finance/expenses/${id}`);
  return response.data;
};

export const fetchFeeStructures = async () => {
  const response = await api.get('/finance/fee-structures');
  return response.data;
};

export const createFeeStructure = async (fee: any) => {
  const response = await api.post('/finance/fee-structures', fee);
  return response.data;
};

export const updateFeeStructure = async (id: string, fee: any) => {
  const response = await api.patch(`/finance/fee-structures/${id}`, fee);
  return response.data;
};

export const deleteFeeStructure = async (id: string) => {
  const response = await api.delete(`/finance/fee-structures/${id}`);
  return response.data;
};

export const assignFee = async (data: any) => {
  const response = await api.post('/entities/fee_assignment', data);
  return response.data;
};

export const fetchScholarships = async () => {
  const response = await api.get('/finance/scholarships');
  return response.data;
};

export const createScholarship = async (sch: any) => {
  const response = await api.post('/finance/scholarships', sch);
  return response.data;
};

export const updateScholarship = async (id: string, sch: any) => {
  const response = await api.patch(`/finance/scholarships/${id}`, sch);
  return response.data;
};

export const deleteScholarship = async (id: string) => {
  const response = await api.delete(`/finance/scholarships/${id}`);
  return response.data;
};

export const fetchScholarshipTypes = async () => {
  const response = await api.get('/finance/scholarship-types');
  return response.data;
};

export const createScholarshipType = async (type: any) => {
  const response = await api.post('/finance/scholarship-types', type);
  return response.data;
};

export const updateScholarshipType = async (id: string, type: any) => {
  const response = await api.patch(`/finance/scholarship-types/${id}`, type);
  return response.data;
};

export const deleteScholarshipType = async (id: string) => {
  const response = await api.delete(`/finance/scholarship-types/${id}`);
  return response.data;
};

// Operations
export const fetchUniforms = async () => {
  const response = await api.get('/ops/uniforms');
  return response.data;
};

export const createUniform = async (data: any) => {
  const response = await api.post('/ops/uniforms', data);
  return response.data;
};

export const updateUniform = async (id: string, data: any) => {
  const response = await api.patch(`/ops/uniforms/${id}`, data);
  return response.data;
};

export const deleteUniform = async (id: string) => {
  const response = await api.delete(`/ops/uniforms/${id}`);
  return response.data;
};

export const fetchInventorySales = async () => {
  const response = await api.get('/ops/inventory-sales');
  return response.data;
};

export const createInventorySale = async (data: any) => {
  const response = await api.post('/ops/inventory-sales', data);
  return response.data;
};

export const updateInventorySale = async (id: string, data: any) => {
  const response = await api.patch(`/ops/inventory-sales/${id}`, data);
  return response.data;
};

export const deleteInventorySale = async (id: string) => {
  const response = await api.delete(`/ops/inventory-sales/${id}`);
  return response.data;
};

// Transport
export const fetchTransportRoutes = async () => {
  const response = await api.get('/ops/transport');
  return response.data;
};

export const createTransportRoute = async (data: any) => {
  const response = await api.post('/ops/transport', data);
  return response.data;
};

export const updateTransportRoute = async (id: string, data: any) => {
  const response = await api.patch(`/ops/transport/${id}`, data);
  return response.data;
};

export const deleteTransportRoute = async (id: string) => {
  const response = await api.delete(`/ops/transport/${id}`);
  return response.data;
};

export const fetchRouteStudents = async (id: string) => {
  const response = await api.get(`/ops/transport/${id}/students`);
  return response.data;
};

export const fetchTransportAssignments = async () => {
  const response = await api.get('/ops/transport/assignments');
  return response.data;
};

export const assignStudentToTransport = async (routeId: string, studentId: string, pickupLocation?: string) => {
  const response = await api.post(`/ops/transport/${routeId}/assign`, {
    student_id: studentId,
    pickup_location: pickupLocation
  });
  return response.data;
};

export const unassignStudentFromTransport = async (studentId: string) => {
  const response = await api.post('/ops/transport/unassign', { student_id: studentId });
  return response.data;
};

export const approveTransportRequest = async (studentId: string) => {
  const response = await api.post('/ops/transport/approve', { student_id: studentId });
  return response.data;
};

export const rejectTransportRequest = async (studentId: string) => {
  const response = await api.post('/ops/transport/reject', { student_id: studentId });
  return response.data;
};

export const markStudentDroppedOff = async (studentId: string) => {
  const response = await api.post('/ops/transport/drop-off', { student_id: studentId });
  return response.data;
};

export const markStudentPickedUp = async (studentId: string) => {
  const response = await api.post('/ops/transport/pick-up', { student_id: studentId });
  return response.data;
};

export const fetchTransportHistory = async () => {
  const response = await api.get('/ops/transport/history');
  return response.data;
};

// Hostels
export const fetchHostels = async () => {
  const response = await api.get('/ops/hostels');
  return response.data;
};

export const createHostel = async (data: any) => {
  const response = await api.post('/ops/hostels', data);
  return response.data;
};

export const updateHostel = async (id: string, data: any) => {
  const response = await api.patch(`/ops/hostels/${id}`, data);
  return response.data;
};

export const deleteHostel = async (id: string) => {
  const response = await api.delete(`/ops/hostels/${id}`);
  return response.data;
};

export const fetchHostelRooms = async (hostelId?: string) => {
  const response = await api.get('/ops/rooms', { params: { hostel_id: hostelId } });
  return response.data;
};

export const createHostelRoom = async (data: any) => {
  const response = await api.post('/ops/rooms', data);
  return response.data;
};

export const updateHostelRoom = async (id: string, data: any) => {
  const response = await api.patch(`/ops/rooms/${id}`, data);
  return response.data;
};

export const deleteHostelRoom = async (id: string) => {
  const response = await api.delete(`/ops/rooms/${id}`);
  return response.data;
};

export const fetchRoomStudents = async (id: string) => {
  const response = await api.get(`/ops/rooms/${id}/students`);
  return response.data;
};

export const fetchHostelAssignments = async () => {
  const response = await api.get('/ops/hostels/assignments');
  return response.data;
};

export const assignStudentToRoom = async (roomId: string, studentId: string) => {
  const response = await api.post(`/ops/rooms/${roomId}/assign`, { student_id: studentId });
  return response.data;
};

export const unassignStudentFromRoom = async (studentId: string) => {
  const response = await api.post('/ops/rooms/unassign', { student_id: studentId });
  return response.data;
};

export const approveHostelRequest = async (studentId: string) => {
  const response = await api.post('/ops/rooms/approve', { student_id: studentId });
  return response.data;
};

export const rejectHostelRequest = async (studentId: string) => {
  const response = await api.post('/ops/rooms/reject', { student_id: studentId });
  return response.data;
};

export const requestTransport = async (routeId: string, pickupLocation: string) => {
  const response = await api.post('/ops/transport/request', { route_id: routeId, pickup_location: pickupLocation });
  return response.data;
};

export const requestHostel = async (hostelId: string) => {
  const response = await api.post('/ops/hostels/request', { hostel_id: hostelId });
  return response.data;
};

// Clubs
export const fetchClubs = async () => {
  const response = await api.get('/ops/clubs');
  return response.data;
};

export const createClub = async (data: any) => {
  const response = await api.post('/ops/clubs', data);
  return response.data;
};

export const updateClub = async (id: string, data: any) => {
  const response = await api.patch(`/ops/clubs/${id}`, data);
  return response.data;
};

export const deleteClub = async (id: string) => {
  const response = await api.delete(`/ops/clubs/${id}`);
  return response.data;
};

export const fetchClubMemberships = async () => {
  const response = await api.get('/ops/club-memberships');
  return response.data;
};

export const joinClub = async (data: { club_id: string; student_id: string }) => {
  const response = await api.post('/ops/club-memberships/join', data);
  return response.data;
};

export const updateMembershipStatus = async (id: string, status: string) => {
  const response = await api.patch(`/ops/club-memberships/${id}/status`, { status });
  return response.data;
};

export const leaveClub = async (id: string) => {
  const response = await api.delete(`/ops/club-memberships/${id}/leave`);
  return response.data;
};

// Health
export const fetchHealthRecords = async () => {
  const response = await api.get('/ops/health');
  return response.data;
};

export const createHealthRecord = async (data: any) => {
  const response = await api.post('/ops/health', data);
  return response.data;
};

export const updateHealthRecord = async (id: string, data: any) => {
  const response = await api.patch(`/ops/health/${id}`, data);
  return response.data;
};

export const deleteHealthRecord = async (id: string) => {
  const response = await api.delete(`/ops/health/${id}`);
  return response.data;
};

// Inventory (Direct)
export const fetchInventory = async () => {
  const response = await api.get('/ops/inventory');
  return response.data;
};

export const createInventoryItem = async (data: any) => {
  const response = await api.post('/ops/inventory', data);
  return response.data;
};

export const updateInventoryItem = async (id: string, data: any) => {
  const response = await api.patch(`/ops/inventory/${id}`, data);
  return response.data;
};

export const deleteInventoryItem = async (id: string) => {
  const response = await api.delete(`/ops/inventory/${id}`);
  return response.data;
};

// Exams
export const fetchExams = async () => {
  const response = await api.get('/exams');
  return response.data;
};

export const createExam = async (exam: any) => {
  const response = await api.post('/exams', exam);
  return response.data;
};

export const updateExam = async (id: string, exam: any) => {
  const response = await api.patch(`/exams/${id}`, exam);
  return response.data;
};

export const deleteExam = async (id: string) => {
  const response = await api.delete(`/exams/${id}`);
  return response.data;
};

export const fetchResults = async (params?: any) => {
  const response = await api.get('/results', { params });
  return response.data;
};

// Academic Calendar
export const fetchCalendarEvents = async () => {
  const response = await api.get('/academic/calendar');
  return response.data;
};

export const createCalendarEvent = async (event: any) => {
  const response = await api.post('/academic/calendar', event);
  return response.data;
};

export const updateCalendarEvent = async (id: string, event: any) => {
  const response = await api.patch(`/academic/calendar/${id}`, event);
  return response.data;
};

export const deleteCalendarEvent = async (id: string) => {
  const response = await api.delete(`/academic/calendar/${id}`);
  return response.data;
};

export const syncPublicHolidays = async (year?: number) => {
  const response = await api.post('/academic/calendar/sync-holidays', { year });
  return response.data;
};


export const createResult = async (data: any) => {
  const response = await api.post('/results', data);
  return response.data;
};

export const bulkRecordResults = async (data: any) => {
  const response = await api.post('/results/bulk', data);
  return response.data;
};

export const syncELearningMarks = async (data: any) => {
  const response = await api.post('/results/sync-elearning', data);
  return response.data;
};

// Organizations (Super Admin)
export const fetchOrganizations = async () => {
  const response = await api.get('/organizations');
  return response.data;
};

export const fetchOrganization = async (id: string) => {
  const response = await api.get(`/organizations/${id}`);
  return response.data;
};

export const createOrganization = async (org: any) => {
  const response = await api.post('/organizations', org);
  return response.data;
};

export const updateOrganization = async (id: string, org: any) => {
  const response = await api.patch(`/organizations/${id}`, org);
  return response.data;
};

export const deleteOrganization = async (id: string) => {
  const response = await api.delete(`/organizations/${id}`);
  return response.data;
};

export const fetchPlans = async () => {
  const response = await api.get('/plans');
  return response.data;
};

export const createPlan = async (plan: any) => {
  const response = await api.post('/plans', plan);
  return response.data;
};

export const updatePlan = async (id: string, plan: any) => {
  const response = await api.patch(`/plans/${id}`, plan);
  return response.data;
};

export const deletePlan = async (id: string) => {
  const response = await api.delete(`/plans/${id}`);
  return response.data;
};

export const fetchSubscriptions = async () => {
  const response = await api.get('/subscriptions');
  return response.data;
};

export const createSubscription = async (sub: any) => {
  const response = await api.post('/subscriptions', sub);
  return response.data;
};

export const updateSubscription = async (id: string, sub: any) => {
  const response = await api.patch(`/subscriptions/${id}`, sub);
  return response.data;
};

export const deleteSubscription = async (id: string) => {
  const response = await api.delete(`/subscriptions/${id}`);
  return response.data;
};

export const fetchReceipts = async () => {
  const response = await api.get('/receipts');
  return response.data;
};

export const createReceipt = async (data: any) => {
  const response = await api.post('/finance/payments', data);
  return response.data;
};

export const updateReceipt = async (id: string, data: any) => {
  const response = await api.patch(`/receipts/${id}`, data);
  return response.data;
};

export const deleteReceipt = async (id: string) => {
  const response = await api.delete(`/receipts/${id}`);
  return response.data;
};

export const fetchPlatformUsers = async () => {
  const response = await api.get('/platform/users');
  return response.data;
};

export const deletePlatformUser = async (id: string) => {
  const response = await api.delete(`/platform/users/${id}`);
  return response.data;
};

export const resetUserPassword = async (id: string, data: { password: string }) => {
  const response = await api.post(`/platform/users/${id}/reset-password`, data);
  return response.data;
};

export const fetchAuditLogs = async () => {
  const response = await api.get('/audit-logs');
  return response.data;
};

export const fetchModules = async () => {
  const response = await api.get('/modules');
  return response.data;
};

export const updateModule = async (id: string, module: any) => {
  const response = await api.patch(`/modules/${id}`, module);
  return response.data;
};

export const deleteModule = async (id: string) => {
  const response = await api.delete(`/modules/${id}`);
  return response.data;
};

// Grading Scales
export const fetchGradingScales = async () => {
  const response = await api.get('/academic/grading-scales');
  return response.data;
};

export const createGradingScale = async (scale: any) => {
  const response = await api.post('/academic/grading-scales', scale);
  return response.data;
};

export const updateGradingScale = async (id: string, scale: any) => {
  const response = await api.patch(`/academic/grading-scales/${id}`, scale);
  return response.data;
};

export const deleteGradingScale = async (id: string) => {
  const response = await api.delete(`/academic/grading-scales/${id}`);
  return response.data;
};

// Report Card Templates
export const fetchReportCardTemplates = async () => {
  const response = await api.get('/academic/report-cards/templates');
  return response.data;
};

export const createReportCardTemplate = async (template: any) => {
  const response = await api.post('/academic/report-cards/templates', template);
  return response.data;
};

export const updateReportCardTemplate = async (id: string, template: any) => {
  const response = await api.patch(`/academic/report-cards/templates/${id}`, template);
  return response.data;
};

export const deleteReportCardTemplate = async (id: string) => {
  const response = await api.delete(`/academic/report-cards/templates/${id}`);
  return response.data;
};

// Remark Templates
export const fetchRemarkTemplates = async () => {
  const response = await api.get('/exams/remark-templates');
  return response.data;
};

export const createRemarkTemplate = async (template: any) => {
  const response = await api.post('/exams/remark-templates', template);
  return response.data;
};

export const updateRemarkTemplate = async (id: string, template: any) => {
  const response = await api.patch(`/exams/remark-templates/${id}`, template);
  return response.data;
};

export const deleteRemarkTemplate = async (id: string) => {
  const response = await api.delete(`/exams/remark-templates/${id}`);
  return response.data;
};

// Library
export const fetchBooks = async () => {
  const response = await api.get('/ops/books');
  return response.data;
};

export const createBook = async (book: any) => {
  const response = await api.post('/ops/books', book);
  return response.data;
};

export const updateBook = async (id: string, book: any) => {
  const response = await api.patch(`/ops/books/${id}`, book);
  return response.data;
};

export const deleteBook = async (id: string) => {
  const response = await api.delete(`/ops/books/${id}`);
  return response.data;
};

export const fetchBookLoans = async () => {
  const response = await api.get('/ops/book-loans');
  return response.data;
};

export const issueBook = async (loan: any) => {
  const response = await api.post('/ops/book-loans', loan);
  return response.data;
};

export const returnBook = async (id: string) => {
  const response = await api.post(`/ops/book-loans/${id}/return`);
  return response.data;
};

export const markBookAsLost = async (id: string) => {
  const response = await api.post(`/ops/book-loans/${id}/lost`);
  return response.data;
};

export const fetchBookContent = async (id: string) => {
  const response = await api.get(`/ops/books/${id}/content`, { responseType: 'blob' });
  return response.data;
};

// Document Templates
export const fetchDocumentTemplates = async () => {
  const response = await api.get('/document-templates');
  return response.data;
};

export const createDocumentTemplate = async (template: any) => {
  const response = await api.post('/document-templates', template);
  return response.data;
};

export const updateDocumentTemplate = async (id: string, template: any) => {
  const response = await api.patch(`/document-templates/${id}`, template);
  return response.data;
};

export const deleteDocumentTemplate = async (id: string) => {
  const response = await api.delete(`/document-templates/${id}`);
  return response.data;
};

// Communication
export const fetchMessages = async () => {
  const response = await api.get('/messages');
  return response.data;
};

export const fetchUnreadMessageCount = async () => {
  const response = await api.get('/messages/unread-count');
  return response.data;
};

export const markMessageRead = async (id: string) => {
  const response = await api.patch(`/messages/${id}/read`);
  return response.data;
};

// SMS
export const fetchSMSSettings = async () => {
  const response = await api.get('/sms/settings');
  return response.data;
};

export const updateSMSSettings = async (data: any) => {
  const response = await api.post('/sms/settings', data);
  return response.data;
};

export const sendBulkSMS = async (data: { messages: { recipient: string, message: string }[] }) => {
  const response = await api.post('/sms/send-bulk', data);
  return response.data;
};

export const distributeSMS = async (data: { org_id: string, amount: number, price: number }) => {
  const response = await api.post('/sms/distribute', data);
  return response.data;
};

export const topUpPlatformSMS = async (amount: number) => {
  const response = await api.post('/sms/top-up-platform', { amount });
  return response.data;
};


export const verifySMSPurchase = async (reference: string) => {
  const response = await api.post('/sms/verify-purchase', { reference });
  return response.data;
};

export const fetchSMSTransactions = async () => {
  const response = await api.get('/sms/transactions');
  return response.data;
};

// PARTNER REWARDS
export const awardPartnerReward = async (partnerId: string, data: { type: string, title: string, description: string, criteria: string }) => {
  const response = await api.post(`/partners/${partnerId}/rewards`, data);
  return response.data;
};

export const fetchPartnerRewards = async (partnerId: string) => {
  const response = await api.get(`/partners/${partnerId}/rewards`);
  return response.data;
};

export const deletePartnerReward = async (rewardId: string) => {
  const response = await api.delete(`/rewards/${rewardId}`);
  return response.data;
};

// QR ATTENDANCE
export const markAttendanceByQR = async (data: { qr_data: string; status?: string; class_id?: string }) => {
  const response = await api.post('/academic/attendance/qr-scan', data);
  return response.data;
};

// PORTFOLIO
export const fetchPortfolioItems = async () => {
  const response = await api.get('/portfolio');
  return response.data;
};

export const createPortfolioItem = async (data: any) => {
  const response = await api.post('/portfolio', data);
  return response.data;
};

export const deletePortfolioItem = async (id: string) => {
  const response = await api.delete(`/portfolio/${id}`);
  return response.data;
};
// REPORTS
// WHISTLEBLOWER
export const fetchWhistleblowerReports = async () => {
  const response = await api.get('/whistleblower');
  return response.data;
};

export const createWhistleblowerReport = async (data: { title: string; description: string; category?: string; urgency?: string }) => {
  const response = await api.post('/whistleblower', data);
  return response.data;
};

export const updateWhistleblowerStatus = async (id: string, status: string) => {
  const response = await api.patch(`/whistleblower/${id}`, { status });
  return response.data;
};

export const deleteWhistleblowerReport = async (id: string) => {
  const response = await api.delete(`/whistleblower/${id}`);
  return response.data;
};

// REPORTS
export const fetchDetailedAttendanceReport = async (startDate: string, endDate: string) => {
  const response = await api.get(`/reports/attendance?start_date=${startDate}&end_date=${endDate}`);
  return response.data;
};

export const fetchDetailedFinanceReport = async (startDate: string, endDate: string) => {
  const response = await api.get(`/reports/finance?start_date=${startDate}&end_date=${endDate}`);
  return response.data;
};

// AI & SMART FEATURES
export const saveAIKey = async (apiKey: string) => {
  const response = await api.post('/ai/keys', { api_key: apiKey });
  return response.data;
};

export const fetchAIKeys = async () => {
  const response = await api.get('/ai/keys');
  return response.data;
};

export const generateAIResponse = async (prompt: string, context?: any) => {
  const response = await api.post('/ai/generate', { prompt, context });
  return response.data;
};

export const fetchAIInsights = async () => {
  const response = await api.get('/ai/insights');
  return response.data;
};

export const saveAIInsights = async (data: any) => {
  const response = await api.post('/ai/insights', data);
  return response.data;
};

export default api;
