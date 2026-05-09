export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'HOD' | 'STAFF' | 'STUDENT' | 'PARENT' | 'FINANCE' | 'BUS_DRIVER' | 'LIBRARIAN' | 'NON_STAFF' | 'HR' | 'PARTNER' | 'HOSTEL' | 'STUDENT_CLUBS' | 'ASSETS_EQUIPMENT' | 'HEALTH' | 'DISCIPLINE';

export interface NavItem {
  title: string;
  href?: string;
  icon?: any;
  roles: UserRole[];
  children?: NavItem[];
}

export interface Student {
  id: string;
  name: string;
  class: string;
  class_id?: string;
  class_name?: string;
  email: string;
  status: string;
  gpa: string;
  admissionNo?: string;
  admission_no?: string;
  parentName?: string;
  parent_name?: string;
  parent_email?: string;
  contact?: string;
  entrance_exam_score?: string;
  profile_pic?: string;
  previousSchoolProfilePic?: string;
  previous_school_profile_pic?: string;
  math_score?: string;
  english_score?: string;
  science_score?: string;
  interview_score?: string;
  previous_school?: string;
  gender?: string;
  date_of_birth?: string;
  date_enrolled?: string;
  custom_scores?: any;
  acceptance_id?: string;
  section?: string;
  secondary_parent_name?: string;
  secondary_parent_email?: string;
  secondary_parent_contact?: string;
  religion?: string;
  fee_status?: string;
}

export interface InquiryComment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface Inquiry {
  id: string;
  name: string;
  parent_name?: string;
  contact?: string;
  email: string;
  parent_email?: string;
  grade: string;
  date: string;
  status: string;
  comments?: InquiryComment[];
  previous_school_profile_pic?: string;
  profile_pic?: string;
  secondary_parent_name?: string;
  secondary_parent_email?: string;
  secondary_parent_contact?: string;
  gender?: string;
  date_of_birth?: string;
  religion?: string;
  previous_school?: string;
  entrance_exam_score?: string;
}

export interface Application {
  id: string;
  name: string;
  grade: string;
  status: string;
  profile_pic?: string;
  [key: string]: any;
}

export interface Acceptance {
  id: string;
  name: string;
  grade: string;
  status: string;
  profile_pic?: string;
  [key: string]: any;
}

export interface Ward {
  id: string;
  name: string;
  class: string;
  attendance: string;
  avgGrade: string;
  feesPaid: string;
  performanceData: { name: string; value: number }[];
  profile_pic?: string;
}

export interface GradingScaleLevel {
  id?: string;
  scale_id?: string;
  grade: string;
  min_score: number;
  max_score: number;
  description?: string;
}

export interface GradingScale {
  id: string;
  name: string;
  description?: string;
  status: string;
  levels?: GradingScaleLevel[];
}

export interface ReportCardSection {
  id: string;
  type: 'StudentInfo' | 'AcademicResults' | 'Attendance' | 'Remarks' | 'PrincipalSignature';
  title: string;
  enabled: boolean;
  settings?: any;
}

export interface ReportCardTemplate {
  id: string;
  name: string;
  description?: string;
  layout: {
    columns: number;
    spacing: string;
    showLogo: boolean;
    fontFamily?: string;
    primaryColor?: string;
    accentColor?: string;
    titleStyle?: 'classic' | 'modern' | 'bold';
  };
  sections: ReportCardSection[];
  is_default: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  total_copies: number;
  available_copies: number;
  digital_url?: string;
  is_digital: boolean;
  cover_image?: string;
  description?: string;
  price: number;
}

export interface BorrowRecord {
  id: string;
  book_id: string;
  user_id: string;
  student_id?: string;
  staff_id?: string;
  borrower_name?: string;
  user_name?: string;
  issue_date: string;
  loan_date?: string;  // alias for issue_date from DB
  due_date: string;
  return_date?: string;
  status: 'Issued' | 'Returned' | 'Overdue' | 'Lost';
  book_title?: string;
}
