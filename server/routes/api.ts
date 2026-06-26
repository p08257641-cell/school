import { Router } from 'express';
import * as AuthController from '../controllers/AuthController.ts';
import * as AcademicController from '../controllers/AcademicController.ts';
import * as FinanceController from '../controllers/FinanceController.ts';
import * as HRController from '../controllers/HRController.ts';
import * as CommunicationController from '../controllers/CommunicationController.ts';
import * as OperationsController from '../controllers/OperationsController.ts';
import * as AdmissionsController from '../controllers/AdmissionsController.ts';
import * as ExamController from '../controllers/ExamController.ts';
import * as OrganizationController from '../controllers/OrganizationController.ts';
import * as FileController from '../controllers/FileController.ts';
import * as GradingController from '../controllers/GradingController.ts';
import * as ReportCardController from '../controllers/ReportCardController.ts';
import * as DocumentTemplateController from '../controllers/DocumentTemplateController.ts';
import * as LibraryController from '../controllers/LibraryController.ts';
import * as PromotionController from '../controllers/PromotionController.ts';
import * as ELearningController from '../controllers/ELearningController.ts';
import * as AcademicCalendarController from '../controllers/AcademicCalendarController.ts';
import * as PartnerController from '../controllers/PartnerController.ts';
import * as DriveController from '../controllers/DriveController.ts';
import * as MeetingController from '../controllers/MeetingController.ts';
import * as AIController from '../controllers/AIController.ts';
import * as ClubsController from '../controllers/ClubsController.ts';
import * as WhistleblowerController from '../controllers/WhistleblowerController.ts';
import { InventoryController } from '../controllers/InventoryController.ts';
import { verifyToken, checkRole } from '../middleware/auth.ts';
import pool from '../db.ts';
import bcrypt from 'bcryptjs';
import { EmailService } from '../services/EmailService.ts';

// In-memory OTP storage for partner email verification
interface OTPData {
  otp: string;
  expiresAt: number;
}
const otpStore = new Map<string, OTPData>();

// Helper to clean up expired OTPs (runs periodically every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

const router = Router();

router.use((req: any, res, next) => {
  req.io = req.app.get('io');
  next();
});


// PUBLIC ROUTES
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);
router.post('/auth/partner/login', PartnerController.login);
router.post('/auth/partner/register', PartnerController.register);
router.post('/demo-request', OrganizationController.requestDemo);

router.post('/partner-leads/send-otp', async (req: any, res: any) => {
  const { company_name, email, country } = req.body;
  if (!company_name || !email || !country) {
    return res.status(400).json({ error: 'company_name, email, and country are required.' });
  }
  const freeDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'mail.com', 'zoho.com', 'protonmail.com', 'yandex.com', 'icloud.com',
    'gmx.com', 'live.com', 'msn.com', 'proton.me'
  ];
  const emailDomain = email.split('@')[1]?.toLowerCase().trim();
  const isTestingException = email.toLowerCase().trim() === 'danieldnkansah@gmail.com';
  if (freeDomains.includes(emailDomain) && !isTestingException) {
    return res.status(400).json({ error: 'Please use a business email address (personal accounts like Gmail, Yahoo, etc. are not allowed).' });
  }

  try {
    // Generate a 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const normalizedEmail = email.toLowerCase().trim();

    // Store in-memory with 10-minute expiry
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP email
    await EmailService.sendOTP(normalizedEmail, otp);

    return res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err: any) {
    console.error('Error sending OTP for partner lead:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to send verification email. Please check your email address and try again.' });
  }
});

router.post('/partner-leads/verify-otp', async (req: any, res: any) => {
  const { company_name, email, country, otp } = req.body;
  if (!company_name || !email || !country || !otp) {
    return res.status(400).json({ error: 'company_name, email, country, and otp are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const storedOtpData = otpStore.get(normalizedEmail);

  if (!storedOtpData) {
    return res.status(400).json({ error: 'No verification code found or it has expired. Please request a new one.' });
  }

  if (storedOtpData.expiresAt < Date.now()) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
  }

  if (storedOtpData.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
  }

  // Clear OTP on successful verification
  otpStore.delete(normalizedEmail);

  try {
    await pool.query(
      'INSERT INTO partner_leads (company_name, email, country) VALUES ($1, $2, $3)',
      [company_name, email, country]
    );
    return res.status(201).json({ success: true, message: 'Partnership application received and verified.' });
  } catch (err: any) {
    console.error('Error saving verified partner lead:', err.message);
    return res.status(500).json({ error: 'Failed to save application. Please try again.' });
  }
});
router.get('/public/organization-by-domain', OrganizationController.getOrganizationByDomain);
router.get('/public/report-card/:token', ExamController.getPublicReportCardData);
router.get('/public/fee-history/:token', FinanceController.getPublicFeeHistoryData);


// PROTECTED ROUTES
router.use(verifyToken);
router.post('/auth/fcm-token', AuthController.saveFCMToken);
router.post('/auth/test-push', AuthController.testPush);

// AI & DIAGNOSTICS
router.get('/ai/test', (req, res) => res.json({ status: 'OK', message: 'AI Routes are active', time: new Date() }));
router.post('/ai/generate', AIController.generateResponse);
router.get('/ai/keys', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), OrganizationController.getGeminiKeys);
router.post('/ai/keys', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), OrganizationController.saveGeminiKey);
router.get('/ai/insights', AIController.getStoredInsights);
router.post('/ai/insights', AIController.saveInsights);

// ORGANIZATIONS
router.get('/organizations', OrganizationController.getOrganizations);
router.get('/organizations/:id', OrganizationController.getOrganization);
router.post('/organizations', checkRole(['SUPER_ADMIN']), OrganizationController.createOrganization);
router.patch('/organizations/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OrganizationController.updateOrganization);
router.delete('/organizations/:id', checkRole(['SUPER_ADMIN']), OrganizationController.deleteOrganization);

// PARTNERS
router.get('/partner/dashboard', checkRole(['PARTNER']), PartnerController.getDashboard);
router.post('/partner/schools', checkRole(['PARTNER']), PartnerController.createSchool);
router.post('/partner/approve/:org_id', checkRole(['SUPER_ADMIN']), PartnerController.approveReferral);
router.get('/partner/banks', checkRole(['PARTNER']), PartnerController.getBanks);
router.get('/partner/resolve-account', checkRole(['PARTNER']), PartnerController.resolveAccount);
router.post('/partner/payout-settings', checkRole(['PARTNER']), PartnerController.updatePayoutSettings);
router.get('/partner/payout-settings', checkRole(['PARTNER']), PartnerController.getPayoutSettings);

// SUPER ADMIN - PARTNER MANAGEMENT
router.get('/partners', checkRole(['SUPER_ADMIN']), PartnerController.getAllPartners);
router.post('/partners', checkRole(['SUPER_ADMIN']), PartnerController.createPartner);
router.patch('/partners/:id', checkRole(['SUPER_ADMIN']), PartnerController.updatePartner);
router.delete('/partners/:id', checkRole(['SUPER_ADMIN']), PartnerController.deletePartner);
router.post('/partners/:id/approve', checkRole(['SUPER_ADMIN']), PartnerController.approvePartner);
router.post('/partners/:id/reset-password', checkRole(['SUPER_ADMIN']), PartnerController.resetPartnerPassword);
router.post('/partners/:partner_id/rewards', checkRole(['SUPER_ADMIN']), PartnerController.awardReward);
router.get('/partners/:id/rewards', PartnerController.getPartnerRewards);
router.delete('/rewards/:id', checkRole(['SUPER_ADMIN']), PartnerController.deleteReward);
router.get('/partners-leads', checkRole(['SUPER_ADMIN']), PartnerController.getPartnerLeads);
router.delete('/partners-leads/:id', checkRole(['SUPER_ADMIN']), PartnerController.deletePartnerLead);


router.get('/subscriptions', OrganizationController.getSubscriptions);
router.post('/subscriptions', checkRole(['SUPER_ADMIN']), OrganizationController.createSubscription);
router.patch('/subscriptions/:id', checkRole(['SUPER_ADMIN']), OrganizationController.updateSubscription);
router.delete('/subscriptions/:id', checkRole(['SUPER_ADMIN']), OrganizationController.deleteSubscription);
router.post('/subscriptions/verify-paystack', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), OrganizationController.verifyPaystackPayment);
router.get('/plans', OrganizationController.getPlans);
router.post('/plans', checkRole(['SUPER_ADMIN']), OrganizationController.createPlan);
router.patch('/plans/:id', checkRole(['SUPER_ADMIN']), OrganizationController.updatePlan);
router.delete('/plans/:id', checkRole(['SUPER_ADMIN']), OrganizationController.deletePlan);
router.get('/audit-logs', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OrganizationController.getAuditLogs);
router.get('/receipts', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE', 'STAFF']), FinanceController.getPayments);
router.patch('/receipts/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.updatePayment);
router.delete('/receipts/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.deletePayment);
router.get('/modules', OrganizationController.getModules);
router.patch('/modules/:id', checkRole(['SUPER_ADMIN']), OrganizationController.updateModule);
router.delete('/modules/:id', checkRole(['SUPER_ADMIN']), OrganizationController.deleteModule);
router.get('/platform/users', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF']), OrganizationController.getAllUsers);
router.post('/platform/users/:id/reset-password', checkRole(['SUPER_ADMIN']), OrganizationController.resetUserPassword);
router.delete('/platform/users/:id', checkRole(['SUPER_ADMIN']), OrganizationController.deleteUser);

// SMS SYSTEM
router.get('/sms/settings', checkRole(['SUPER_ADMIN']), OrganizationController.getSMSSettings);
router.post('/sms/settings', checkRole(['SUPER_ADMIN']), OrganizationController.updateSMSSettings);
router.post('/sms/top-up-platform', checkRole(['SUPER_ADMIN']), OrganizationController.topUpPlatformSMS);
router.post('/sms/distribute', checkRole(['SUPER_ADMIN']), OrganizationController.distributeSMS);
router.post('/sms/verify-purchase', checkRole(['SCHOOL_ADMIN']), OrganizationController.verifySMSPurchase);
router.post('/sms/send-bulk', checkRole(['SCHOOL_ADMIN', 'HOD']), CommunicationController.sendBulkSMS);

router.get('/sms/transactions', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), OrganizationController.getSMSTransactions);

// CRON JOBS
router.post('/cron/check-birthdays', OrganizationController.checkBirthdays);


// ACADEMIC
router.get('/academic/departments', HRController.getDepartments);
router.post('/academic/departments', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), HRController.createDepartment);
router.patch('/academic/departments/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), HRController.updateDepartment);
router.delete('/academic/departments/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), HRController.deleteDepartment);
router.get('/academic/classes', AcademicController.getClasses);
router.post('/academic/classes', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), AcademicController.createClass);
router.patch('/academic/classes/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), AcademicController.updateClass);
router.delete('/academic/classes/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), AcademicController.deleteClass);
router.get('/academic/subjects', AcademicController.getSubjects);
router.post('/academic/subjects', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), AcademicController.createSubject);
router.patch('/academic/subjects/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), AcademicController.updateSubject);
router.delete('/academic/subjects/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), AcademicController.deleteSubject);
router.get('/academic/attendance', AcademicController.getAttendance);
router.post('/academic/attendance', checkRole(['STAFF', 'SCHOOL_ADMIN', 'HOD']), AcademicController.markAttendance);
router.post('/academic/attendance/qr-scan', checkRole(['STAFF', 'SCHOOL_ADMIN', 'HOD']), AcademicController.markAttendanceByQR);
router.get('/academic/timetables', AcademicController.getTimetables);
router.post('/academic/timetables', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.createTimetableEntry);
router.patch('/academic/timetables/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.updateTimetableEntry);
router.delete('/academic/timetables/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.deleteTimetableEntry);
router.post('/academic/timetables/generate-smart', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.generateSmartTimetable);
router.post('/academic/assign-subject', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.assignSubjectToTeacher);
router.get('/academic/lesson-notes', AcademicController.getLessonNotes);
router.post('/academic/lesson-notes', checkRole(['STAFF', 'SCHOOL_ADMIN']), AcademicController.createLessonNote);
router.patch('/academic/lesson-notes/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), AcademicController.updateLessonNote);
router.delete('/academic/lesson-notes/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), AcademicController.deleteLessonNote);
router.get('/academic/teachers-on-duty', AcademicController.getTeachersOnDuty);
router.post('/academic/teachers-on-duty', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.assignTeacherOnDuty);
router.patch('/academic/teachers-on-duty/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.updateTeacherOnDuty);
router.delete('/academic/teachers-on-duty/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.deleteTeacherOnDuty);
router.get('/academic/behavior', AcademicController.getBehaviorIncidents);
router.post('/academic/behavior', checkRole(['STAFF', 'SCHOOL_ADMIN', 'HOD']), AcademicController.recordBehaviorIncident);
router.patch('/academic/behavior/:id', checkRole(['STAFF', 'SCHOOL_ADMIN', 'HOD']), AcademicController.updateBehaviorIncident);
router.delete('/academic/behavior/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), AcademicController.deleteBehaviorIncident);
router.get('/academic/grading-scales', GradingController.getGradingScales);
router.post('/academic/grading-scales', checkRole(['SCHOOL_ADMIN', 'HOD']), GradingController.createGradingScale);
router.patch('/academic/grading-scales/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), GradingController.updateGradingScale);
router.delete('/academic/grading-scales/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), GradingController.deleteGradingScale);

// ACADEMIC CALENDAR
router.get('/academic/calendar', AcademicCalendarController.getEvents);
router.post('/academic/calendar', checkRole(['SCHOOL_ADMIN']), AcademicCalendarController.createEvent);
router.patch('/academic/calendar/:id', checkRole(['SCHOOL_ADMIN']), AcademicCalendarController.updateEvent);
router.delete('/academic/calendar/:id', checkRole(['SCHOOL_ADMIN']), AcademicCalendarController.deleteEvent);
router.post('/academic/calendar/sync-holidays', checkRole(['SCHOOL_ADMIN']), AcademicCalendarController.syncPublicHolidays);


// PROMOTION & GRADUATION
router.get('/academic/promotion/settings', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), PromotionController.getPromotionSettings);
router.patch('/academic/promotion/settings/:classId', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), PromotionController.updatePromotionThreshold);
router.get('/academic/promotion/audit', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), PromotionController.runEligibilityAudit);
router.post('/academic/promotion/bulk', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), PromotionController.processBulkPromotion);
router.post('/academic/promotion/manual', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), PromotionController.processManualPromotion);
router.get('/academic/promotion/records', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), PromotionController.getPromotionRecords);

// ADMISSIONS
router.get('/admissions/inquiries', AdmissionsController.getInquiries);
router.post('/admissions/inquiries', checkRole(['SCHOOL_ADMIN']), AdmissionsController.createInquiry);
router.patch('/admissions/inquiries/:id', checkRole(['SCHOOL_ADMIN']), AdmissionsController.updateInquiry);
router.delete('/admissions/inquiries/:id', checkRole(['SCHOOL_ADMIN']), AdmissionsController.deleteInquiry);
router.get('/admissions/applications', AdmissionsController.getApplications);
router.post('/admissions/applications', checkRole(['SCHOOL_ADMIN']), AdmissionsController.createApplication);
router.patch('/admissions/applications/:id', checkRole(['SCHOOL_ADMIN']), AdmissionsController.updateApplication);
router.delete('/admissions/applications/:id', checkRole(['SCHOOL_ADMIN']), AdmissionsController.deleteApplication);
router.get('/admissions/acceptances', AdmissionsController.getAcceptances);
router.post('/admissions/acceptances', checkRole(['SCHOOL_ADMIN']), AdmissionsController.createAcceptance);
router.patch('/admissions/acceptances/:id', checkRole(['SCHOOL_ADMIN']), AdmissionsController.updateAcceptance);
router.delete('/admissions/acceptances/:id', checkRole(['SCHOOL_ADMIN']), AdmissionsController.deleteAcceptance);

// EXAMS & RESULTS
router.get('/exams', ExamController.getExams);
router.post('/exams', checkRole(['SCHOOL_ADMIN', 'HOD']), ExamController.createExam);
router.patch('/exams/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), ExamController.updateExam);
router.delete('/exams/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), ExamController.deleteExam);
router.get('/results', ExamController.getResults);
router.post('/results', checkRole(['STAFF', 'HOD', 'SCHOOL_ADMIN']), ExamController.recordResult);
router.post('/results/bulk', checkRole(['STAFF', 'HOD', 'SCHOOL_ADMIN']), ExamController.bulkRecordResults);
router.post('/results/sync-elearning', checkRole(['STAFF', 'HOD', 'SCHOOL_ADMIN']), ExamController.syncELearningMarks);

// REMARK TEMPLATES
router.get('/exams/remark-templates', ExamController.getRemarkTemplates);
router.post('/exams/remark-templates', checkRole(['SCHOOL_ADMIN', 'HOD']), ExamController.createRemarkTemplate);
router.patch('/exams/remark-templates/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), ExamController.updateRemarkTemplate);
router.delete('/exams/remark-templates/:id', checkRole(['SCHOOL_ADMIN', 'HOD']), ExamController.deleteRemarkTemplate);

// FINANCE
router.get('/finance/fee-structures', FinanceController.getFeeStructures);
router.post('/finance/fee-structures', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.createFeeStructure);
router.patch('/finance/fee-structures/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.updateFeeStructure);
router.delete('/finance/fee-structures/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.deleteFeeStructure);
router.post('/finance/assign-fee', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.assignFee);
router.post('/entities/fee_assignment', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.assignFee);
router.get('/finance/invoices', FinanceController.getInvoices);
router.get('/finance/student-fees-summary', FinanceController.getStudentFeesSummary);
router.post('/finance/invoices', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.createInvoice);
router.patch('/finance/invoices/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.updateInvoice);
router.delete('/finance/invoices/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.deleteInvoice);
router.post('/finance/payments', checkRole(['PARENT', 'STUDENT', 'FINANCE', 'SCHOOL_ADMIN']), FinanceController.processPayment);
router.get('/finance/expenses', FinanceController.getExpenses);
router.post('/finance/expenses', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.createExpense);
router.patch('/finance/expenses/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.updateExpense);
router.delete('/finance/expenses/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.deleteExpense);
router.get('/finance/scholarships', FinanceController.getScholarships);
router.post('/finance/scholarships', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.createScholarship);
router.patch('/finance/scholarships/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.updateScholarship);
router.delete('/finance/scholarships/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.deleteScholarship);

router.get('/finance/scholarship-types', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.getScholarshipTypes);
router.post('/finance/scholarship-types', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.createScholarshipType);
router.patch('/finance/scholarship-types/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.updateScholarshipType);
router.delete('/finance/scholarship-types/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), FinanceController.deleteScholarshipType);

// HR
router.get('/hr/staff', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'STAFF', 'STUDENT', 'PARENT']), HRController.getStaffMembers);
router.post('/hr/staff', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.createStaff);
router.patch('/hr/staff/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'STAFF']), HRController.updateStaff);
router.patch('/hr/parents/:email', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.updateParent);
router.delete('/hr/staff/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.deleteStaff);
router.get('/hr/payroll', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE', 'STAFF']), HRController.getPayroll);
router.post('/hr/payroll', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE']), HRController.createPayroll);
router.post('/hr/payroll/run', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE']), HRController.runPayroll);
router.patch('/hr/payroll/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE']), HRController.updatePayroll);
router.delete('/hr/payroll/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE']), HRController.deletePayroll);
router.get('/hr/leave-requests', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'STAFF']), HRController.getLeaveRequests);
router.post('/hr/leave-requests', checkRole(['STAFF', 'SCHOOL_ADMIN', 'HR']), HRController.createLeaveRequest);
router.post('/hr/leave-requests/reset-balances', checkRole(['SCHOOL_ADMIN']), HRController.resetLeaveBalances);
router.patch('/hr/leave-requests/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.updateLeaveRequest);
router.patch('/hr/leave-requests/:id/status', checkRole(['SCHOOL_ADMIN', 'HR']), HRController.updateLeaveStatus);
router.delete('/hr/leave-requests/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.deleteLeaveRequest);
router.get('/hr/recruitment', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.getRecruitment);
router.post('/hr/recruitment', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.createApplicant);
router.patch('/hr/recruitment/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.updateApplicant);
router.delete('/hr/recruitment/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.deleteApplicant);
router.post('/hr/recruitment/:id/hire', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.hireCandidate);
router.get('/hr/recruitment/:id/offer-letter', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.generateOfferLetter);
router.get('/hr/attendance', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'STAFF']), HRController.getStaffAttendance);
router.post('/hr/attendance', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.markStaffAttendance);
router.patch('/hr/attendance/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.updateStaffAttendance);
router.delete('/hr/attendance/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.deleteStaffAttendance);

router.get('/hr/exit-management', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.getExitManagement);
router.post('/hr/exit-management', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.createExitManagement);
router.patch('/hr/exit-management/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.updateExitManagement);
router.delete('/hr/exit-management/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.deleteExitManagement);
router.get('/hr/exit-management/:id/letter', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR']), HRController.generateExitLetter);

// PERFORMANCE
router.get('/hr/performance', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'HOD', 'STAFF']), HRController.getStaffPerformance);
router.post('/hr/performance', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'HOD']), HRController.createPerformanceReview);
router.get('/hr/hod/dashboard-stats', checkRole(['HOD', 'SCHOOL_ADMIN']), HRController.getHODDashboardStats);

// COMMUNICATION
router.get('/comm/messages', CommunicationController.getMessages);
router.post('/comm/messages', CommunicationController.sendMessage);
router.get('/comm/announcements', CommunicationController.getAnnouncements);
router.post('/comm/announcements', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD']), CommunicationController.createAnnouncement);
router.get('/comm/feedbacks', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT']), CommunicationController.getFeedbacks);
router.post('/comm/feedbacks', checkRole(['PARENT']), CommunicationController.createFeedback);
router.patch('/comm/feedbacks/:id', checkRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), CommunicationController.updateFeedback);

// OPERATIONS
// LIBRARY
router.get('/ops/books', LibraryController.getBooks);
router.get('/ops/books/:id/content', LibraryController.getBookContent);
router.post('/ops/books', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN']), LibraryController.createBook);
router.patch('/ops/books/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN']), LibraryController.updateBook);
router.delete('/ops/books/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN']), LibraryController.deleteBook);
router.get('/ops/book-loans', LibraryController.getBookLoans);
router.post('/ops/book-loans', checkRole(['LIBRARIAN', 'SCHOOL_ADMIN']), LibraryController.issueBook);
router.post('/ops/book-loans/:id/return', checkRole(['LIBRARIAN', 'SCHOOL_ADMIN']), LibraryController.returnBook);
router.post('/ops/book-loans/:id/lost', checkRole(['LIBRARIAN', 'SCHOOL_ADMIN']), LibraryController.markBookAsLost);
router.get('/ops/inventory', OperationsController.getInventory);
router.post('/ops/inventory', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'NON_STAFF', 'ASSETS_EQUIPMENT']), OperationsController.createInventoryItem);
router.patch('/ops/inventory/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'NON_STAFF', 'ASSETS_EQUIPMENT']), OperationsController.updateInventoryItem);
router.delete('/ops/inventory/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'NON_STAFF', 'ASSETS_EQUIPMENT']), OperationsController.deleteInventoryItem);
router.get('/ops/uniforms', OperationsController.getUniforms);
router.post('/ops/uniforms', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), OperationsController.createUniformItem);
router.patch('/ops/uniforms/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), OperationsController.updateUniformItem);
router.delete('/ops/uniforms/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), OperationsController.deleteUniformItem);
router.get('/ops/inventory-sales', OperationsController.getInventorySales);
router.post('/ops/inventory-sales', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE', 'PARENT', 'STUDENT']), OperationsController.createInventorySale);
router.patch('/ops/inventory-sales/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), OperationsController.updateInventorySale);
router.delete('/ops/inventory-sales/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'FINANCE']), OperationsController.deleteInventorySale);

// TRANSPORT
router.get('/ops/transport', OperationsController.getTransportRoutes);
router.post('/ops/transport', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.createTransportRoute);
router.patch('/ops/transport/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.updateTransportRoute);
router.delete('/ops/transport/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.deleteTransportRoute);
router.get('/ops/transport/:id/students', OperationsController.getRouteStudents);
router.get('/ops/transport/assignments', OperationsController.getTransportAssignments);
router.post('/ops/transport/:id/assign', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT']), OperationsController.assignStudentToTransport);
router.post('/ops/transport/unassign', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.unassignStudentFromTransport);
router.post('/ops/transport/approve', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.approveTransportRequest);
router.post('/ops/transport/reject', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.rejectTransportRequest);
router.post('/ops/transport/drop-off', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BUS_DRIVER']), OperationsController.markStudentDroppedOff);
router.post('/ops/transport/pick-up', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BUS_DRIVER']), OperationsController.markStudentPickedUp);
router.get('/ops/transport/history', OperationsController.getTransportHistory);

// HOSTELS
router.get('/ops/hostels', OperationsController.getHostels);
router.post('/ops/hostels', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.createHostel);
router.patch('/ops/hostels/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.updateHostel);
router.delete('/ops/hostels/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.deleteHostel);
router.get('/ops/rooms', OperationsController.getHostelRooms);
router.post('/ops/rooms', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.createHostelRoom);
router.patch('/ops/rooms/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.updateHostelRoom);
router.delete('/ops/rooms/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.deleteHostelRoom);
router.get('/ops/rooms/:id/students', OperationsController.getRoomStudents);
router.get('/ops/hostels/assignments', OperationsController.getHostelAssignments);
router.post('/ops/rooms/:id/assign', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT']), OperationsController.assignStudentToRoom);
router.post('/ops/rooms/unassign', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.unassignStudentFromRoom);
router.post('/ops/rooms/approve', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.approveHostelRequest);
router.post('/ops/rooms/reject', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), OperationsController.rejectHostelRequest);

// HEALTH
router.get('/ops/health', OperationsController.getHealthRecords);
router.post('/ops/health', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF']), OperationsController.createHealthRecord);
router.patch('/ops/health/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF']), OperationsController.updateHealthRecord);
router.delete('/ops/health/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF']), OperationsController.deleteHealthRecord);

// CLUBS
router.get('/ops/clubs', ClubsController.getClubs);
router.post('/ops/clubs', checkRole(['SCHOOL_ADMIN']), ClubsController.createClub);
router.patch('/ops/clubs/:id', checkRole(['SCHOOL_ADMIN']), ClubsController.updateClub);
router.delete('/ops/clubs/:id', checkRole(['SCHOOL_ADMIN']), ClubsController.deleteClub);
router.get('/ops/club-memberships', ClubsController.getClubMemberships);
router.post('/ops/club-memberships/join', ClubsController.joinClub);
router.patch('/ops/club-memberships/:id/status', checkRole(['SCHOOL_ADMIN']), ClubsController.updateMembershipStatus);
router.delete('/ops/club-memberships/:id/leave', ClubsController.leaveClub);

// E-LEARNING
// Assignments
router.get('/elearning/assignments', ELearningController.getAssignments);
router.post('/elearning/assignments', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.createAssignment);
router.patch('/elearning/assignments/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.updateAssignment);
router.delete('/elearning/assignments/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.deleteAssignment);

// Assignment Questions
router.get('/elearning/assignment-questions/:assignment_id', ELearningController.getAssignmentQuestions);
router.post('/elearning/assignment-questions', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.addAssignmentQuestion);
router.patch('/elearning/assignment-questions/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.updateAssignmentQuestion);
router.delete('/elearning/assignment-questions/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.deleteAssignmentQuestion);

router.get('/elearning/submissions', ELearningController.getSubmissions);
router.post('/elearning/assignments/:id/submit', ELearningController.submitAssignment);
router.patch('/elearning/submissions/:id/grade', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.gradeSubmission);

// Study Materials
router.get('/elearning/study-materials', ELearningController.getStudyMaterials);
router.post('/elearning/study-materials', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.createStudyMaterial);
router.delete('/elearning/study-materials/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.deleteStudyMaterial);

// Online Classes
router.get('/elearning/online-classes', ELearningController.getOnlineClasses);
router.post('/elearning/online-classes', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.createOnlineClass);
router.delete('/elearning/online-classes/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.deleteOnlineClass);
router.patch('/elearning/online-classes/:id/end', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.endOnlineClass);
router.post('/elearning/online-classes/auto-update-status', ELearningController.autoUpdateOnlineClassStatuses);

// CBT Exams
router.get('/elearning/cbt-exams', ELearningController.getCBTExams);
router.post('/elearning/cbt-exams', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.createCBTExam);
router.patch('/elearning/cbt-exams/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.updateCBTExam);
router.delete('/elearning/cbt-exams/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.deleteCBTExam);
router.post('/elearning/cbt-exams/auto-update-status', ELearningController.autoUpdateCBTExamStatuses);
router.post('/elearning/cbt-submit', ELearningController.submitCBTExam);
router.get('/elearning/cbt-submissions', ELearningController.getCBTSubmissions);
router.get('/elearning/cbt-questions/:exam_id', ELearningController.getCBTQuestions);
router.post('/elearning/cbt-questions', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.addCBTQuestion);
router.patch('/elearning/cbt-questions/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.updateCBTQuestion);
router.delete('/elearning/cbt-questions/:id', checkRole(['STAFF', 'SCHOOL_ADMIN']), ELearningController.deleteCBTQuestion);

// INVENTORY & ASSETS
router.get('/inventory/suppliers', InventoryController.getSuppliers);
router.post('/inventory/suppliers', checkRole(['SCHOOL_ADMIN', 'FINANCE']), InventoryController.createSupplier);
router.patch('/inventory/suppliers/:id', checkRole(['SCHOOL_ADMIN', 'FINANCE']), InventoryController.updateSupplier);
router.delete('/inventory/suppliers/:id', checkRole(['SCHOOL_ADMIN', 'FINANCE']), InventoryController.deleteSupplier);

router.get('/inventory/items', InventoryController.getInventoryItems);
router.post('/inventory/items', checkRole(['SCHOOL_ADMIN', 'FINANCE']), InventoryController.createInventoryItem);
router.patch('/inventory/items/:id', checkRole(['SCHOOL_ADMIN', 'FINANCE']), InventoryController.updateInventoryItem);
router.delete('/inventory/items/:id', checkRole(['SCHOOL_ADMIN', 'FINANCE']), InventoryController.deleteInventoryItem);

router.get('/inventory/transactions', InventoryController.getTransactions);
router.post('/inventory/transactions', checkRole(['SCHOOL_ADMIN', 'FINANCE']), InventoryController.createTransaction);

router.get('/assets', InventoryController.getAssets);
router.post('/assets', checkRole(['SCHOOL_ADMIN']), InventoryController.createAsset);
router.patch('/assets/:id', checkRole(['SCHOOL_ADMIN']), InventoryController.updateAsset);
router.delete('/assets/:id', checkRole(['SCHOOL_ADMIN']), InventoryController.deleteAsset);

// FILES / STORAGE
router.get('/files', FileController.getFiles);
router.post('/files', FileController.createFile);
router.delete('/files/:id', FileController.deleteFile);

// GENERIC / CORE
router.get('/students', async (req: any, res) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT s.*, c.name as class, c.section as section
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
      `);
    } else {
      result = await pool.query(`
        SELECT s.*, c.name as class, c.section as section
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.org_id = $1
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/students', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), async (req: any, res) => {
  const client = await pool.connect();
  const {
    name, email, parent_email, password, parent_password, status, gpa, admission_no, class_id, parent_name, contact, entrance_exam_score,
    profile_pic, previous_school_profile_pic, fee_status, fee_amount, acceptance_id,
    math_score, english_score, science_score, interview_score, previous_school, custom_scores, date_of_birth, gender, date_enrolled,
    secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion
  } = req.body;

  try {
    const orgId = req.user.org_id;
    await client.query('BEGIN');
    console.log(`>>> [Admission] Starting transaction for: ${name} (Org: ${orgId})`);

    // 1. Check for existing student with same email or acceptance_id in this org
    if (acceptance_id) {
      const existingAcc = await client.query('SELECT id FROM students WHERE acceptance_id = $1 AND org_id = $2', [acceptance_id, orgId]);
      if (existingAcc.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This student has already been enrolled from this acceptance.' });
      }
    }

    // 2. Prepare passwords
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password || 'zxcv123$$', saltRounds);
    const hashedParentPassword = await bcrypt.hash(parent_password || 'parent@123', saltRounds);

    // 3. Handle Admission Number
    let finalAdmissionNo = admission_no;
    if (!finalAdmissionNo || finalAdmissionNo.startsWith('TEMP-') || /^ADM-\d{13}/.test(finalAdmissionNo)) {
      finalAdmissionNo = await AdmissionsController.getNextAdmissionNumber(client, orgId);
      console.log(`>>> [Admission] Regenerated Admission No: ${finalAdmissionNo}`);
    }

    // Helper to handle empty strings for strict types
    const toNull = (val: any) => (val === '' || val === undefined) ? null : val;

    // Auto-generate email if missing
    let finalEmail = toNull(email);
    if (!finalEmail) {
      const safeName = name ? name.replace(/[^a-zA-Z]/g, '').toLowerCase() : 'student';
      finalEmail = `${safeName}.${Date.now().toString().slice(-5)}@schoolgo.edu`;
    }

    console.log(`>>> [Admission] Executing INSERT for: ${finalAdmissionNo}`);
    const result = await client.query(
      'INSERT INTO students (name, email, parent_email, password, parent_password, status, gpa, admission_no, class_id, parent_name, contact, entrance_exam_score, profile_pic, previous_school_profile_pic, fee_status, fee_amount, org_id, acceptance_id, math_score, english_score, science_score, interview_score, previous_school, custom_scores, date_of_birth, gender, date_enrolled, secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31) RETURNING *',
      [
        name, finalEmail, toNull(parent_email), hashedPassword, hashedParentPassword,
        status || 'Present', gpa || '0.0', finalAdmissionNo, toNull(class_id), parent_name,
        contact, entrance_exam_score, toNull(profile_pic), toNull(previous_school_profile_pic),
        fee_status || 'Paid', fee_amount || 0, orgId, toNull(acceptance_id),
        toNull(math_score), toNull(english_score), toNull(science_score), toNull(interview_score),
        toNull(previous_school), JSON.stringify(custom_scores || {}), toNull(date_of_birth),
        toNull(gender), toNull(date_enrolled), toNull(secondary_parent_name),
        toNull(secondary_parent_email), toNull(secondary_parent_contact), toNull(religion)
      ]
    );

    await client.query('COMMIT');
    console.log(`>>> [Admission] Successfully committed: ${finalAdmissionNo}`);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('>>> [Admission] Error:', err);

    if (err.code === '23505') { // Unique constraint violation
      if (err.constraint === 'students_admission_no_key') {
        return res.status(409).json({ error: `Admission number ${admission_no} is already in use.`, detail: err.detail });
      }
      if (err.constraint === 'students_email_key') {
        return res.status(409).json({ error: 'A student with this email already exists.', detail: err.detail });
      }
    }

    res.status(500).json({ error: err.message, detail: err.detail });
  } finally {
    client.release();
  }
});

router.patch('/students/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), async (req: any, res) => {
  const { id } = req.params;
  const {
    name, email, parent_email, parent_password, status, gpa, admission_no, class_id, parent_name, contact, entrance_exam_score,
    profile_pic, previous_school_profile_pic, fee_status, fee_amount,
    math_score, english_score, science_score, interview_score, previous_school, custom_scores, date_of_birth, gender, date_enrolled,
    secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion, batch
  } = req.body;
  try {
    const orgId = req.user.org_id;
    // Update and potentially hash parent password
    let hashParentPW = parent_password;
    if (parent_password && !parent_password.startsWith('$2')) {
      hashParentPW = await bcrypt.hash(parent_password, 10);
    }

    const toNull = (val: any) => (val === '' || val === undefined) ? null : val;

    // Protect admission_no and date_enrolled from being updated - these should only be set during initial creation
    const result = await pool.query(
      'UPDATE students SET name = $1, email = $2, parent_email = $3, status = $4, gpa = $5, admission_no = admission_no, class_id = $6, parent_name = $7, contact = $8, entrance_exam_score = $9, profile_pic = $10, previous_school_profile_pic = $11, fee_status = $12, fee_amount = $13, math_score = $14, english_score = $15, science_score = $16, interview_score = $17, previous_school = $18, custom_scores = $19, date_of_birth = $20, gender = $21, date_enrolled = date_enrolled, parent_password = COALESCE($22, parent_password), secondary_parent_name = $23, secondary_parent_email = $24, secondary_parent_contact = $25, religion = $26, batch = $27 WHERE id = $28 AND org_id = $29 RETURNING *',
      [
        toNull(name),
        toNull(email),
        toNull(parent_email),
        toNull(status),
        toNull(gpa),
        toNull(class_id),
        toNull(parent_name),
        toNull(contact),
        toNull(entrance_exam_score),
        toNull(profile_pic),
        toNull(previous_school_profile_pic),
        toNull(fee_status),
        toNull(fee_amount),
        toNull(math_score),
        toNull(english_score),
        toNull(science_score),
        toNull(interview_score),
        toNull(previous_school),
        JSON.stringify(custom_scores || {}),
        toNull(date_of_birth),
        toNull(gender),
        toNull(hashParentPW),
        toNull(secondary_parent_name),
        toNull(secondary_parent_email),
        toNull(secondary_parent_contact),
        toNull(religion),
        toNull(batch),
        id,
        orgId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/students/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), async (req: any, res) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM students WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Report Card Templates
router.get('/academic/report-cards/templates', verifyToken, ReportCardController.getReportCardTemplates);
router.post('/academic/report-cards/templates', verifyToken, ReportCardController.createReportCardTemplate);
router.patch('/academic/report-cards/templates/:id', verifyToken, ReportCardController.updateReportCardTemplate);
router.delete('/academic/report-cards/templates/:id', verifyToken, ReportCardController.deleteReportCardTemplate);

// Document Templates
router.get('/document-templates', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE', 'STAFF']), DocumentTemplateController.getDocumentTemplates);
router.post('/document-templates', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE', 'STAFF']), DocumentTemplateController.createDocumentTemplate);
router.patch('/document-templates/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE', 'STAFF']), DocumentTemplateController.updateDocumentTemplate);
router.delete('/document-templates/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR', 'FINANCE', 'STAFF']), DocumentTemplateController.deleteDocumentTemplate);

// COMMUNICATION (ANNOUNCEMENTS & MESSAGES)
router.get('/announcements', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT']), CommunicationController.getAnnouncements);
router.post('/announcements', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD']), CommunicationController.createAnnouncement);
router.delete('/announcements/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD']), CommunicationController.deleteAnnouncement);

router.get('/meetings', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT']), MeetingController.getMeetings);
router.post('/meetings', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD']), MeetingController.createMeeting);
router.delete('/meetings/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD']), MeetingController.deleteMeeting);

router.get('/messages', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT']), CommunicationController.getMessages);
router.get('/messages/unread-count', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT']), CommunicationController.getUnreadMessageCount);
router.post('/messages', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT']), CommunicationController.sendMessage);
router.patch('/messages/:id/read', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT']), CommunicationController.markMessageRead);

// DRIVE (FILES & STORAGE)
router.get('/drive', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF']), DriveController.getDriveItems);
router.post('/drive/folders', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF']), DriveController.createFolder);
router.delete('/drive/folders/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF']), DriveController.deleteFolder);
router.post('/drive/files', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF']), DriveController.uploadFile);
router.delete('/drive/files/:id', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF']), DriveController.deleteFile);
router.patch('/drive/files/:id/move', checkRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF']), DriveController.moveFile);

// PORTFOLIO
router.get('/portfolio', AcademicController.getPortfolioItems);
router.post('/portfolio', checkRole(['STAFF', 'SCHOOL_ADMIN', 'HOD']), AcademicController.createPortfolioItem);
router.delete('/portfolio/:id', checkRole(['STAFF', 'SCHOOL_ADMIN', 'HOD']), AcademicController.deletePortfolioItem);

// WHISTLEBLOWER (Anonymous Reports)
router.get('/whistleblower', checkRole(['SCHOOL_ADMIN']), WhistleblowerController.getReports);
router.post('/whistleblower', checkRole(['STAFF', 'HOD', 'SCHOOL_ADMIN']), WhistleblowerController.createReport);
router.patch('/whistleblower/:id', checkRole(['SCHOOL_ADMIN']), WhistleblowerController.updateReportStatus);
router.delete('/whistleblower/:id', checkRole(['SCHOOL_ADMIN']), WhistleblowerController.deleteReport);

// REPORTS
router.get('/reports/attendance', checkRole(['SCHOOL_ADMIN', 'HR']), HRController.getDetailedAttendanceReport);
router.get('/reports/finance', checkRole(['SCHOOL_ADMIN', 'FINANCE']), FinanceController.getDetailedFinanceReport);

export default router;
