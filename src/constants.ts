import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  ShieldCheck,
  CreditCard,
  Layers,
  History,
  UserCircle,
  BookOpen,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  FileText,
  Wallet,
  Library,
  HardDrive,
  MessageSquare,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  MoreVertical,
  LogOut,
  User,
  UserPlus,
  UserCheck,
  CheckCircle,
  Building2,
  Briefcase,
  TrendingUp,
  Heart,
  Zap,
  Globe,
  Coffee,
  Shirt,
  ShoppingCart,
  Ruler,
  Layout,
  QrCode,
  Image as ImageIcon,
  Flag
} from 'lucide-react';

import { UserRole, NavItem } from './types';
export type { UserRole, NavItem };

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

export const NAVIGATION_CONFIG: NavItem[] = [
  // GLOBAL DASHBOARD
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'HR', 'PARTNER', 'HOSTEL', 'STUDENT_CLUBS', 'ASSETS_EQUIPMENT', 'HEALTH', 'DISCIPLINE'],
    href: 'Dashboard'
  },
  {
    title: 'Admit Student',
    icon: UserPlus,
    roles: ['SCHOOL_ADMIN'],
    href: 'Admit Student'
  },
  {
    title: 'Subscription Plan',
    icon: CreditCard,
    roles: [],
    href: 'Subscription Plan'
  },

  // SUPER ADMIN - CORE & PLATFORM
  {
    title: 'Platform Control',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
    children: [
      { title: 'Organizations', href: 'Organizations', roles: ['SUPER_ADMIN'], icon: Building2 },
      { title: 'Subscriptions', href: 'Subscriptions', roles: ['SUPER_ADMIN'], icon: CreditCard },
      { title: 'Plans', href: 'Plans', roles: ['SUPER_ADMIN'], icon: Layers },
      { title: 'Users', href: 'Users', roles: ['SUPER_ADMIN'], icon: Users },
      { title: 'Partners', href: 'Partners', roles: ['SUPER_ADMIN'], icon: Users },
      { title: 'SMS Settings', href: 'SMS Settings', roles: ['SUPER_ADMIN'], icon: MessageSquare },
      { title: 'Module Control', href: 'Module Control', roles: ['SUPER_ADMIN'], icon: Layers },
      { title: 'Audit Logs', href: 'Audit Logs', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD'], icon: History },
    ]
  },

  // ACADEMIC MODULES
  {
    title: 'Academics',
    icon: GraduationCap,
    roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT'],
    children: [
      { title: 'Student Management', href: 'Student Management', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF'], icon: Users },
      { title: 'Class Management', href: 'Class Management', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF'], icon: Layers },
      { title: 'Subject Management', href: 'Subject Management', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF'], icon: BookOpen },
      { title: 'My Subjects', href: 'My Subjects', roles: ['STUDENT'], icon: BookOpen },
      { title: 'Timetable', href: 'Timetable', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT'], icon: Calendar },
      { title: 'Teacher List', href: 'Teacher List', roles: ['STUDENT', 'PARENT'], icon: Users },
      { title: 'Academic Calendar', href: 'Academic Calendar', roles: ['SCHOOL_ADMIN', 'STAFF', 'STUDENT'], icon: Calendar },
      { title: 'Attendance', href: 'Attendance', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT'], icon: ClipboardCheck },
      { title: 'QR Attendance', href: 'QR Attendance', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF'], icon: QrCode },
      { title: 'Academic Profile', href: 'Academic Information', roles: ['STUDENT'], icon: GraduationCap },
      { title: 'Promotion & Graduation', href: 'Promotion & Graduation', roles: ['SCHOOL_ADMIN'], icon: TrendingUp },
      { title: 'Alumni Management', href: 'Alumni Management', roles: ['SCHOOL_ADMIN'], icon: GraduationCap },
      { title: 'Student ID Cards', href: 'Student ID Cards', roles: ['SCHOOL_ADMIN'], icon: CreditCard },
      { title: 'Gallery Upload', href: 'Gallery Upload', roles: ['STAFF', 'HOD', 'SCHOOL_ADMIN'], icon: Plus },
      { title: 'Gallery', href: 'Gallery', roles: ['STUDENT', 'PARENT', 'SCHOOL_ADMIN', 'STAFF'], icon: ImageIcon },
    ]
  },
  // EXAMS & RESULTS
  {
    title: 'Exams',
    icon: FileText,
    roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT'],
    children: [
      { title: 'Exam Schedules', href: 'Exam Schedules', roles: ['SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT'], icon: Calendar },
      { title: 'My Results', href: 'My Results', roles: ['STUDENT'], icon: ClipboardCheck },
      { title: 'Ward Results', href: 'Ward Results', roles: ['PARENT'], icon: ClipboardCheck },
      { title: 'Results Management', href: 'Results Management', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF'], icon: ClipboardCheck },
      { title: 'Grading Scale', href: 'Grading Scale', roles: ['SCHOOL_ADMIN', 'HOD'], icon: Ruler },
      { title: 'Result Analysis', href: 'Result Analysis', roles: ['STUDENT', 'PARENT'], icon: TrendingUp },
      { title: 'Report Card Builder', href: 'Report Card Builder', roles: ['SCHOOL_ADMIN', 'HOD'], icon: Layout },
      { title: 'Remarks Template', href: 'Remarks Template', roles: ['SCHOOL_ADMIN', 'HOD'], icon: MessageSquare },
    ]
  },
  // FINANCE MODULES
  {
    title: 'Finance',
    icon: Wallet,
    roles: ['SCHOOL_ADMIN', 'PARENT', 'FINANCE', 'STUDENT'],
    children: [
      { title: 'Fees & Assignment', href: 'Fees & Assignment', roles: ['SCHOOL_ADMIN', 'FINANCE', 'STUDENT'], icon: Layers },
      { title: 'Generate Class Fees', href: 'Generate Class Fees', roles: ['SCHOOL_ADMIN', 'FINANCE'], icon: Plus },
      { title: 'Fee Management', href: 'Fee Management', roles: ['SCHOOL_ADMIN', 'FINANCE'], icon: CreditCard },
      { title: 'Daily Collections', href: 'Daily Collections', roles: ['SCHOOL_ADMIN', 'FINANCE'], icon: Coffee },
      { title: 'Sellable Items (Stocks)', href: 'Stock', roles: ['SCHOOL_ADMIN', 'FINANCE'], icon: Shirt },
      { title: 'Invoices & Payments', href: 'Invoices & Payments', roles: ['SCHOOL_ADMIN', 'PARENT', 'FINANCE', 'STUDENT'], icon: FileText },
      { title: 'Scholarships', href: 'Scholarships', roles: ['SCHOOL_ADMIN', 'FINANCE'], icon: GraduationCap },
      { title: 'Expenses & Budget', href: 'Expenses & Budget', roles: ['SCHOOL_ADMIN', 'FINANCE'], icon: TrendingUp },
      { title: 'Financial Reports', href: 'Financial Reports', roles: ['SCHOOL_ADMIN', 'FINANCE'], icon: History },
      { title: 'Inventory Request', href: 'Inventory Request', roles: ['STUDENT', 'PARENT'], icon: Shirt },
    ]
  },


  // HR MODULES
  {
    title: 'Human Resources',
    icon: Briefcase,
    roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF', 'HR'],
    children: [
      { title: 'Departments', href: 'Department Management', roles: ['SCHOOL_ADMIN', 'HR'], icon: Building2 },
      { title: 'Organogram', href: 'Organogram', roles: ['SCHOOL_ADMIN', 'HR'], icon: Layers },
      { title: 'Staff Management', href: 'Staff Management', roles: ['SCHOOL_ADMIN', 'HR'], icon: Users },
      { title: 'Exit Management', href: 'Exit Management', roles: ['SCHOOL_ADMIN', 'HR'], icon: LogOut },
      { title: 'Teachers on Duty', href: 'Teachers on Duty', roles: ['SCHOOL_ADMIN', 'HR', 'STAFF'], icon: UserCheck },
      { title: 'Staff Attendance', href: 'Staff Attendance', roles: ['SCHOOL_ADMIN', 'HOD', 'HR'], icon: ClipboardCheck },
      { title: 'Lesson Notes', href: 'Lesson Notes', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF', 'HR'], icon: FileText },
      { title: 'Recruitment', href: 'Recruitment', roles: ['SCHOOL_ADMIN', 'HR'], icon: UserCircle },
      { title: 'Leave Management', href: 'Leave Management', roles: ['SCHOOL_ADMIN', 'HOD', 'STAFF', 'HR'], icon: Calendar },
      { title: 'Payroll', href: 'Payroll', roles: ['SCHOOL_ADMIN', 'STAFF', 'HR'], icon: Wallet },
      { title: 'Performance', href: 'Performance', roles: ['SCHOOL_ADMIN', 'HOD', 'HR'], icon: TrendingUp },
      { title: 'Roles & Permissions', href: 'Roles & Permissions', roles: ['SCHOOL_ADMIN', 'HR'], icon: ShieldCheck },
      { title: 'Parent Management', href: 'Parent Management', roles: ['SCHOOL_ADMIN', 'HR'], icon: Users },
    ]
  },

  // COMMUNICATION
  {
    title: 'Communication',
    icon: MessageSquare,
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'HOSTEL', 'STUDENT_CLUBS', 'ASSETS_EQUIPMENT', 'HEALTH', 'DISCIPLINE'],
    children: [
      { title: 'Announcements', href: 'Announcements', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'HOSTEL', 'STUDENT_CLUBS', 'ASSETS_EQUIPMENT', 'HEALTH', 'DISCIPLINE'], icon: Bell },
      { title: 'Messages', href: 'Messages', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'HOSTEL', 'STUDENT_CLUBS', 'ASSETS_EQUIPMENT', 'HEALTH', 'DISCIPLINE'], icon: MessageSquare },
      { title: 'Feedback & Grievances', href: 'Feedback & Grievances', roles: ['PARENT', 'SCHOOL_ADMIN'], icon: MessageSquare },
      { title: 'Notifications', href: 'Notifications', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'HOSTEL', 'STUDENT_CLUBS', 'ASSETS_EQUIPMENT', 'HEALTH', 'DISCIPLINE'], icon: Bell },
      { title: 'Whistle Blower', href: 'Whistle Blower', roles: ['STAFF', 'HOD', 'SCHOOL_ADMIN'], icon: Flag },
    ]
  },

  // LIBRARY
  {
    title: 'Library',
    icon: Library,
    roles: ['SCHOOL_ADMIN', 'STUDENT', 'LIBRARIAN'],
    children: [
      { title: 'Book Management', href: 'Book Management', roles: ['SCHOOL_ADMIN', 'LIBRARIAN'], icon: BookOpen },
      { title: 'Search Books', href: 'Search Books', roles: [], icon: Search },
      { title: 'Borrowed Books', href: 'Borrowed Books', roles: [], icon: History },
      { title: 'Reserved Books', href: 'Reserved Books', roles: [], icon: BookOpen },
      { title: 'Borrow & Return', href: 'Borrow & Return', roles: ['SCHOOL_ADMIN', 'STUDENT', 'LIBRARIAN'], icon: History },
      { title: 'Digital Library', href: 'Digital Library', roles: ['SCHOOL_ADMIN', 'STUDENT', 'LIBRARIAN'], icon: Globe },
    ]
  },

  // STORAGE
  {
    title: 'Files & Storage',
    icon: HardDrive,
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF'],
    children: [
      { title: 'My Drive', href: 'My Drive', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF'], icon: HardDrive },
      { title: 'Folder Management', href: 'Folder Management', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD'], icon: Layers },
    ]
  },

  {
    title: 'Logistics & Services',
    icon: Settings,
    roles: ['SCHOOL_ADMIN', 'STUDENT', 'PARENT', 'BUS_DRIVER', 'NON_STAFF', 'HOSTEL', 'STUDENT_CLUBS', 'ASSETS_EQUIPMENT', 'HEALTH', 'DISCIPLINE'],
    children: [
      { title: 'Transport', href: 'Transport', roles: ['SCHOOL_ADMIN', 'STUDENT', 'PARENT', 'NON_STAFF'], icon: Globe },
      { title: 'Trip History', href: 'Trip History', roles: ['SCHOOL_ADMIN', 'BUS_DRIVER'], icon: History },
      { title: 'Hostel', href: 'Hostel', roles: ['SCHOOL_ADMIN', 'STUDENT', 'PARENT', 'NON_STAFF', 'HOSTEL'], icon: Building2 },
      { title: 'Student Clubs', href: 'Student Clubs', roles: ['SCHOOL_ADMIN', 'STUDENT', 'PARENT', 'STUDENT_CLUBS'], icon: Users },
      { title: 'Assets & Equipment', href: 'Assets', roles: ['SCHOOL_ADMIN', 'NON_STAFF', 'ASSETS_EQUIPMENT'], icon: Layers },
      { title: 'Health / Medical', href: 'Health / Medical', roles: ['SCHOOL_ADMIN', 'NON_STAFF', 'STUDENT', 'PARENT', 'HEALTH'], icon: Heart },
      { title: 'Behavior & Discipline', href: 'Behavior & Discipline', roles: ['SCHOOL_ADMIN', 'STUDENT', 'PARENT', 'DISCIPLINE'], icon: ShieldCheck },
    ]
  },

  // AI & SMART FEATURES
  {
    title: 'AI Assistant',
    icon: Zap,
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT', 'PARENT'],
    children: [
      { title: 'Ask AI', href: 'Ask AI', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'STUDENT'], icon: MessageSquare },
      { title: 'Study Recommendations', href: 'Study Recommendations', roles: ['STUDENT'], icon: BookOpen },
      { title: 'Performance Insights', href: 'Performance Insights', roles: ['STUDENT', 'STAFF', 'SCHOOL_ADMIN', 'PARENT'], icon: TrendingUp },
    ]
  },

  // CBT & E-LEARNING
  {
    title: 'E-Learning',
    icon: BookOpen,
    roles: ['STAFF', 'STUDENT'],
    children: [
      { title: 'CBT Exams', href: 'CBT Exams', roles: ['STAFF', 'STUDENT'], icon: Zap },
      { title: 'Online Classes', href: 'Online Classes', roles: ['STAFF', 'STUDENT'], icon: Globe },
      { title: 'Assignments', href: 'Assignments', roles: ['STAFF', 'STUDENT'], icon: FileText },
      { title: 'Study Materials', href: 'Study Materials', roles: ['STAFF', 'STUDENT'], icon: BookOpen },
    ]
  },
  // SETTINGS
  {
    title: 'Settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'HR', 'PARTNER'],
    children: [
      { title: 'My Profile', href: 'profile', roles: ['SCHOOL_ADMIN'], icon: User },
      { title: 'School Profile', href: 'School Profile', roles: ['SCHOOL_ADMIN'], icon: Building2 },
      { title: 'Change Password', href: 'Change Password', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'PARTNER'], icon: ShieldCheck },
      { title: 'Notification Settings', href: 'Notification Settings', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'PARTNER'], icon: Bell },
      { title: 'Privacy Settings', href: 'Privacy Settings', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOD', 'STAFF', 'STUDENT', 'PARENT', 'FINANCE', 'BUS_DRIVER', 'LIBRARIAN', 'NON_STAFF', 'PARTNER'], icon: ShieldCheck },
    ]
  }
];

export const MODULE_LINK_MAP: Record<string, string> = {
  'Academics': 'Academic Management',
  'Admit Student': 'Admissions & Onboarding',
  'Finance': 'Finance & Billing',
  'Human Resources': 'HR & Payroll',
  'Exams': 'Exam & Results',
  'Logistics & Services': 'Operations',
  'Library': 'Library System',
  'Files & Storage': 'Cloud Storage (Drive)',
  'AI Assistant': 'AI & Advanced Analytics',
  'E-Learning': 'E-Learning & CBT'
};
