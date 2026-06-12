-- Suppress warnings for IF NOT EXISTS
SET client_min_messages = warning;

-- Set up required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

CREATE TABLE IF NOT EXISTS partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        contact_number VARCHAR(50),
        company_name VARCHAR(255),
        registration_number VARCHAR(255),
        referral_code VARCHAR(50) UNIQUE NOT NULL,
        total_earnings NUMERIC(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        plan VARCHAR(100),
        custom_domain VARCHAR(255),
        logo_url TEXT,
        logo TEXT,
        background_image TEXT,
        background_images JSONB DEFAULT '[]',
        signature TEXT,
        language VARCHAR(50) DEFAULT 'en',
        timezone VARCHAR(100) DEFAULT 'GMT',
        currency VARCHAR(10) DEFAULT 'GH₵',
        email VARCHAR(255),
        contact_number VARCHAR(50),
        address TEXT,
        gemini_api_key TEXT,
        academic_year VARCHAR(20) DEFAULT '2023/2024',
        current_term VARCHAR(20) DEFAULT 'Term 1',
        demo_requested BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS gemini_api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        api_key TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(org_id)
      );

DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'logo') THEN
          ALTER TABLE organizations ADD COLUMN logo TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'background_image') THEN
          ALTER TABLE organizations ADD COLUMN background_image TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'background_images') THEN
          ALTER TABLE organizations ADD COLUMN background_images JSONB DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'referred_by_partner_id') THEN
          ALTER TABLE organizations ADD COLUMN referred_by_partner_id UUID REFERENCES partners(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plan_templates' AND column_name = 'commission_amount') THEN
          ALTER TABLE plan_templates ADD COLUMN commission_amount NUMERIC(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'language') THEN
          ALTER TABLE partners ADD COLUMN language VARCHAR(50) DEFAULT 'en';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'signature') THEN
          ALTER TABLE organizations ADD COLUMN signature TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'company_name') THEN
          ALTER TABLE partners ADD COLUMN company_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'registration_number') THEN
          ALTER TABLE partners ADD COLUMN registration_number VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'default_leave_limit') THEN
          ALTER TABLE organizations ADD COLUMN default_leave_limit INTEGER DEFAULT 20;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'default_leave_limit_unit') THEN
          ALTER TABLE organizations ADD COLUMN default_leave_limit_unit VARCHAR(50) DEFAULT 'Days';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'gemini_api_key') THEN
          ALTER TABLE organizations ADD COLUMN gemini_api_key TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'academic_year') THEN
          ALTER TABLE organizations ADD COLUMN academic_year VARCHAR(20) DEFAULT '2023/2024';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'current_term') THEN
          ALTER TABLE organizations ADD COLUMN current_term VARCHAR(20) DEFAULT 'Term 1';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'admission_no_prefix') THEN
          ALTER TABLE organizations ADD COLUMN admission_no_prefix VARCHAR(50) DEFAULT 'ADM-';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'admission_no_suffix') THEN
          ALTER TABLE organizations ADD COLUMN admission_no_suffix VARCHAR(50) DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'admission_no_start_from') THEN
          ALTER TABLE organizations ADD COLUMN admission_no_start_from INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'demo_requested') THEN
          ALTER TABLE organizations ADD COLUMN demo_requested BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        head VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'hod_id') THEN
          ALTER TABLE departments ADD COLUMN hod_id UUID REFERENCES staff(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'description') THEN
          ALTER TABLE departments ADD COLUMN description TEXT;
        END IF;
      END $$;

DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'department_id') THEN
          ALTER TABLE staff ADD COLUMN department_id UUID REFERENCES departments(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'phone') THEN
          ALTER TABLE staff ADD COLUMN phone VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'reports_to') THEN
          ALTER TABLE staff ADD COLUMN reports_to UUID REFERENCES staff(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'additional_roles') THEN
          ALTER TABLE staff ADD COLUMN additional_roles TEXT[] DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'salary') THEN
          ALTER TABLE staff ADD COLUMN salary NUMERIC(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'allowances') THEN
          ALTER TABLE staff ADD COLUMN allowances NUMERIC(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'deductions') THEN
          ALTER TABLE staff ADD COLUMN deductions NUMERIC(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'annual_leave_limit') THEN
          ALTER TABLE staff ADD COLUMN annual_leave_limit INTEGER DEFAULT 20;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'leave_balance') THEN
          ALTER TABLE staff ADD COLUMN leave_balance INTEGER DEFAULT 20;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'carried_over_balance') THEN
          ALTER TABLE staff ADD COLUMN carried_over_balance INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'leave_limit_unit') THEN
          ALTER TABLE staff ADD COLUMN leave_limit_unit VARCHAR(50) DEFAULT 'Days';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'date_of_birth') THEN
          ALTER TABLE staff ADD COLUMN date_of_birth DATE;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS grading_scales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        section VARCHAR(50),
        capacity INTEGER,
        rank INTEGER DEFAULT 0,
        next_class_id UUID REFERENCES classes(id),
        class_teacher_id UUID REFERENCES staff(id),
        org_id UUID REFERENCES organizations(id),
        grading_scale_id UUID REFERENCES grading_scales(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS grading_scale_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scale_id UUID REFERENCES grading_scales(id) ON DELETE CASCADE,
        grade VARCHAR(10) NOT NULL,
        min_score NUMERIC(5, 2) NOT NULL,
        max_score NUMERIC(5, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='rank') THEN
          ALTER TABLE classes ADD COLUMN rank INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='next_class_id') THEN
          ALTER TABLE classes ADD COLUMN next_class_id UUID REFERENCES classes(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='class_teacher_id') THEN
          ALTER TABLE classes ADD COLUMN class_teacher_id UUID REFERENCES staff(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='grading_scale_id') THEN
          ALTER TABLE classes ADD COLUMN grading_scale_id UUID REFERENCES grading_scales(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='promotion_threshold') THEN
          ALTER TABLE classes ADD COLUMN promotion_threshold NUMERIC(5,2) DEFAULT 50;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        parent_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Present',
        gpa VARCHAR(10),
        admission_no VARCHAR(50) UNIQUE,
        class_id UUID REFERENCES classes(id),
        parent_name VARCHAR(255),
        contact VARCHAR(50),
        entrance_exam_score VARCHAR(50),
        profile_pic TEXT,
        previous_school_profile_pic TEXT,
        secondary_parent_name VARCHAR(255),
        secondary_parent_email VARCHAR(255),
        secondary_parent_contact VARCHAR(50),
        religion VARCHAR(100),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='parent_name') THEN
          ALTER TABLE students ADD COLUMN parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='contact') THEN
          ALTER TABLE students ADD COLUMN contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='entrance_exam_score') THEN
          ALTER TABLE students ADD COLUMN entrance_exam_score VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='profile_pic') THEN
          ALTER TABLE students ADD COLUMN profile_pic TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='previous_school_profile_pic') THEN
          ALTER TABLE students ADD COLUMN previous_school_profile_pic TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='fee_status') THEN
          ALTER TABLE students ADD COLUMN fee_status VARCHAR(50) DEFAULT 'Paid';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='fee_amount') THEN
          ALTER TABLE students ADD COLUMN fee_amount NUMERIC(10, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='transport_route_id') THEN
          -- transport_routes will be created later, so we will bind this foreign key in a late binding block at the end
          ALTER TABLE students ADD COLUMN transport_route_id UUID; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='transport_pickup_location') THEN
          ALTER TABLE students ADD COLUMN transport_pickup_location VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='hostel_room_id') THEN
          ALTER TABLE students ADD COLUMN hostel_room_id UUID; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='transport_status') THEN
          ALTER TABLE students ADD COLUMN transport_status VARCHAR(50) DEFAULT 'None';
          UPDATE students SET transport_status = 'Approved' WHERE transport_route_id IS NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='hostel_status') THEN
          ALTER TABLE students ADD COLUMN hostel_status VARCHAR(50) DEFAULT 'None';
          UPDATE students SET hostel_status = 'Approved' WHERE hostel_room_id IS NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='acceptance_id') THEN
          ALTER TABLE students ADD COLUMN acceptance_id UUID UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='math_score') THEN
          ALTER TABLE students ADD COLUMN math_score VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='english_score') THEN
          ALTER TABLE students ADD COLUMN english_score VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='science_score') THEN
          ALTER TABLE students ADD COLUMN science_score VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='interview_score') THEN
          ALTER TABLE students ADD COLUMN interview_score VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='previous_school') THEN
          ALTER TABLE students ADD COLUMN previous_school VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='custom_scores') THEN
          ALTER TABLE students ADD COLUMN custom_scores JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='date_of_birth') THEN
          ALTER TABLE students ADD COLUMN date_of_birth DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='gender') THEN
          ALTER TABLE students ADD COLUMN gender VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='date_enrolled') THEN
          ALTER TABLE students ADD COLUMN date_enrolled DATE;
        END IF;
        if (not exists (select 1 from information_schema.columns where table_name='students' and column_name='parent_email')) then
          alter table students add column parent_email varchar(255);
        end if;
        if (not exists (select 1 from information_schema.columns where table_name='students' and column_name='parent_password')) then
          alter table students add column parent_password varchar(255);
        end if;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='secondary_parent_name') THEN
          ALTER TABLE students ADD COLUMN secondary_parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='secondary_parent_email') THEN
          ALTER TABLE students ADD COLUMN secondary_parent_email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='secondary_parent_contact') THEN
          ALTER TABLE students ADD COLUMN secondary_parent_contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='religion') THEN
          ALTER TABLE students ADD COLUMN religion VARCHAR(100);
        END IF;
      end $$;

-- Removed broken UPDATE with $1 placeholder


CREATE TABLE IF NOT EXISTS promotion_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        from_class_id UUID REFERENCES classes(id),
        to_class_id UUID REFERENCES classes(id),
        cumulative_average NUMERIC(6,2),
        academic_year VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Promoted',
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        org_id UUID REFERENCES organizations(id)
      );

DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotion_records' AND column_name = 'reason') THEN
          ALTER TABLE promotion_records ADD COLUMN reason TEXT;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        teacher_id UUID REFERENCES staff(id),
        class_id UUID REFERENCES classes(id),
        department_id UUID REFERENCES departments(id),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='teacher_id') THEN
          ALTER TABLE subjects ADD COLUMN teacher_id UUID REFERENCES staff(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='class_id') THEN
          ALTER TABLE subjects ADD COLUMN class_id UUID REFERENCES classes(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='department_id') THEN
          ALTER TABLE subjects ADD COLUMN department_id UUID REFERENCES departments(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='credits') THEN
          ALTER TABLE subjects ADD COLUMN credits INTEGER DEFAULT 1;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS subject_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES staff(id),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subject_id, class_id)
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subject_assignments' AND column_name='id') THEN
          ALTER TABLE subject_assignments ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subject_assignments' AND column_name='org_id') THEN
          ALTER TABLE subject_assignments ADD COLUMN org_id UUID REFERENCES organizations(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subject_assignments' AND column_name='created_at') THEN
          ALTER TABLE subject_assignments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;

INSERT INTO subject_assignments (subject_id, class_id, teacher_id, org_id)
      SELECT id, class_id, teacher_id, org_id 
      FROM subjects s
      WHERE class_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM subject_assignments sa 
        WHERE sa.subject_id = s.id AND sa.class_id = s.class_id
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='rank') THEN
          ALTER TABLE classes ADD COLUMN rank INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='next_class_id') THEN
          ALTER TABLE classes ADD COLUMN next_class_id UUID REFERENCES classes(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='class_teacher_id') THEN
          ALTER TABLE classes ADD COLUMN class_teacher_id UUID REFERENCES staff(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='grading_scale_id') THEN
          ALTER TABLE classes ADD COLUMN grading_scale_id UUID REFERENCES grading_scales(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='promotion_threshold') THEN
          ALTER TABLE classes ADD COLUMN promotion_threshold NUMERIC(5,2) DEFAULT 50;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='required_credits') THEN
          ALTER TABLE classes ADD COLUMN required_credits INTEGER DEFAULT 0;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS transport_routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_name VARCHAR(255) NOT NULL,
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(255),
        driver_phone VARCHAR(50),
        price NUMERIC(10, 2) DEFAULT 0,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transport_routes' AND column_name='price') THEN
          ALTER TABLE transport_routes ADD COLUMN price NUMERIC(10, 2) DEFAULT 0;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS hostels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50), -- Boys/Girls
        warden_name VARCHAR(255),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS hostel_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hostel_id UUID REFERENCES hostels(id),
        room_number VARCHAR(50) NOT NULL,
        capacity INTEGER,
        price NUMERIC(10, 2) DEFAULT 0,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hostel_rooms' AND column_name='price') THEN
          ALTER TABLE hostel_rooms ADD COLUMN price NUMERIC(10, 2) DEFAULT 0;
        END IF;
      END $$;

DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='transport_route_id') THEN
          -- Drop if exists to avoid errors on multiple runs, then add constraint
          ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_transport_route;
          ALTER TABLE students ADD CONSTRAINT fk_students_transport_route FOREIGN KEY (transport_route_id) REFERENCES transport_routes(id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='hostel_room_id') THEN
          ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_hostel_room;
          ALTER TABLE students ADD CONSTRAINT fk_students_hostel_room FOREIGN KEY (hostel_room_id) REFERENCES hostel_rooms(id);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS timetables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID REFERENCES classes(id),
        subject_id UUID REFERENCES subjects(id),
        teacher_id UUID REFERENCES staff(id),
        day_of_week VARCHAR(20),
        start_time TIME,
        end_time TIME,
        room VARCHAR(100),
        type VARCHAR(50) DEFAULT 'Lesson',
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='timetables' AND column_name='room') THEN
          ALTER TABLE timetables ADD COLUMN room VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='timetables' AND column_name='type') THEN
          ALTER TABLE timetables ADD COLUMN type VARCHAR(50) DEFAULT 'Lesson';
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS student_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id),
        date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50),
        remarks TEXT,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS fee_structures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        period VARCHAR(100), -- Monthly, Termly, Yearly
        class_id UUID REFERENCES classes(id),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        due_date DATE,
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='description') THEN
          ALTER TABLE invoices ADD COLUMN description TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='term') THEN
          ALTER TABLE invoices ADD COLUMN term VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='academic_year') THEN
          ALTER TABLE invoices ADD COLUMN academic_year VARCHAR(50);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        method VARCHAR(50),
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Completed',
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='term') THEN
          ALTER TABLE payments ADD COLUMN term VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='academic_year') THEN
          ALTER TABLE payments ADD COLUMN academic_year VARCHAR(50);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS health_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id),
        condition TEXT,
        treatment TEXT,
        date DATE DEFAULT CURRENT_DATE,
        doctor_name VARCHAR(255),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        parent_name VARCHAR(255),
        email VARCHAR(255),
        contact VARCHAR(50),
        grade VARCHAR(50),
        status VARCHAR(50) DEFAULT 'New',
        date DATE DEFAULT CURRENT_DATE,
        comments JSONB DEFAULT '[]',
        secondary_parent_name VARCHAR(255),
        secondary_parent_email VARCHAR(255),
        secondary_parent_contact VARCHAR(50),
        religion VARCHAR(100),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='parent_name') THEN
          ALTER TABLE inquiries ADD COLUMN parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='contact') THEN
          ALTER TABLE inquiries ADD COLUMN contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='comments') THEN
          ALTER TABLE inquiries ADD COLUMN comments JSONB DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='previous_school_profile_pic') THEN
          ALTER TABLE inquiries ADD COLUMN previous_school_profile_pic TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='secondary_parent_name') THEN
          ALTER TABLE inquiries ADD COLUMN secondary_parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='secondary_parent_email') THEN
          ALTER TABLE inquiries ADD COLUMN secondary_parent_email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='secondary_parent_contact') THEN
          ALTER TABLE inquiries ADD COLUMN secondary_parent_contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inquiries' AND column_name='religion') THEN
          ALTER TABLE inquiries ADD COLUMN religion VARCHAR(100);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        parent_name VARCHAR(255),
        contact VARCHAR(50),
        email VARCHAR(255),
        gender VARCHAR(20),
        grade VARCHAR(50),
        entrance_exam_score VARCHAR(50),
        math_score VARCHAR(50),
        english_score VARCHAR(50),
        science_score VARCHAR(50),
        interview_score VARCHAR(50),
        previous_school VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending Review',
        decision VARCHAR(50) DEFAULT 'Pending',
        date DATE DEFAULT CURRENT_DATE,
        date_of_birth DATE,
        custom_scores JSONB DEFAULT '{}',
        previous_school_profile_pic TEXT,
        fee_status VARCHAR(50) DEFAULT 'Pending',
        fee_amount NUMERIC(10, 2) DEFAULT 0,
        secondary_parent_name VARCHAR(255),
        secondary_parent_email VARCHAR(255),
        secondary_parent_contact VARCHAR(50),
        religion VARCHAR(100),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='parent_name') THEN
          ALTER TABLE applications ADD COLUMN parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='contact') THEN
          ALTER TABLE applications ADD COLUMN contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='gender') THEN
          ALTER TABLE applications ADD COLUMN gender VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='date_of_birth') THEN
          ALTER TABLE applications ADD COLUMN date_of_birth DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='custom_scores') THEN
          ALTER TABLE applications ADD COLUMN custom_scores JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='previous_school_profile_pic') THEN
          ALTER TABLE applications ADD COLUMN previous_school_profile_pic TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='fee_status') THEN
          ALTER TABLE applications ADD COLUMN fee_status VARCHAR(50) DEFAULT 'Pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='fee_amount') THEN
          ALTER TABLE applications ADD COLUMN fee_amount NUMERIC(10, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='fee_structure_id') THEN
          ALTER TABLE applications ADD COLUMN fee_structure_id UUID REFERENCES fee_structures(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='parent_email') THEN
          ALTER TABLE applications ADD COLUMN parent_email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='secondary_parent_name') THEN
          ALTER TABLE applications ADD COLUMN secondary_parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='secondary_parent_email') THEN
          ALTER TABLE applications ADD COLUMN secondary_parent_email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='secondary_parent_contact') THEN
          ALTER TABLE applications ADD COLUMN secondary_parent_contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='religion') THEN
          ALTER TABLE applications ADD COLUMN religion VARCHAR(100);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS acceptances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        parent_name VARCHAR(255),
        contact VARCHAR(50),
        email VARCHAR(255),
        parent_email VARCHAR(255),
        gender VARCHAR(20),
        grade VARCHAR(50),
        class_id UUID REFERENCES classes(id),
        entrance_exam_score VARCHAR(50),
        math_score VARCHAR(50),
        english_score VARCHAR(50),
        science_score VARCHAR(50),
        interview_score VARCHAR(50),
        previous_school VARCHAR(255),
        decision VARCHAR(50) DEFAULT 'Accepted',
        fee_status VARCHAR(50) DEFAULT 'Pending',
        fee_structure_id UUID REFERENCES fee_structures(id),
        date DATE DEFAULT CURRENT_DATE,
        date_of_birth DATE,
        custom_scores JSONB DEFAULT '{}',
        previous_school_profile_pic TEXT,
        fee_amount NUMERIC(10, 2) DEFAULT 0,
        secondary_parent_name VARCHAR(255),
        secondary_parent_email VARCHAR(255),
        secondary_parent_contact VARCHAR(50),
        religion VARCHAR(100),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='parent_name') THEN
          ALTER TABLE acceptances ADD COLUMN parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='contact') THEN
          ALTER TABLE acceptances ADD COLUMN contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='gender') THEN
          ALTER TABLE acceptances ADD COLUMN gender VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='class_id') THEN
          ALTER TABLE acceptances ADD COLUMN class_id UUID REFERENCES classes(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='date_of_birth') THEN
          ALTER TABLE acceptances ADD COLUMN date_of_birth DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='custom_scores') THEN
          ALTER TABLE acceptances ADD COLUMN custom_scores JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='previous_school_profile_pic') THEN
          ALTER TABLE acceptances ADD COLUMN previous_school_profile_pic TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='fee_amount') THEN
          ALTER TABLE acceptances ADD COLUMN fee_amount NUMERIC(10, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='fee_structure_id') THEN
          ALTER TABLE acceptances ADD COLUMN fee_structure_id UUID REFERENCES fee_structures(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='parent_email') THEN
          ALTER TABLE acceptances ADD COLUMN parent_email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='secondary_parent_name') THEN
          ALTER TABLE acceptances ADD COLUMN secondary_parent_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='secondary_parent_email') THEN
          ALTER TABLE acceptances ADD COLUMN secondary_parent_email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='secondary_parent_contact') THEN
          ALTER TABLE acceptances ADD COLUMN secondary_parent_contact VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acceptances' AND column_name='religion') THEN
          ALTER TABLE acceptances ADD COLUMN religion VARCHAR(100);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(255) NOT NULL,
        description TEXT,
        amount VARCHAR(50) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID REFERENCES subjects(id),
        class_id UUID REFERENCES classes(id),
        subject VARCHAR(255), -- Fallback or legacy name
        date DATE NOT NULL,
        time VARCHAR(50),
        room VARCHAR(100),
        type VARCHAR(100),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exams' AND column_name='class_id') THEN
          ALTER TABLE exams ADD COLUMN class_id UUID REFERENCES classes(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exams' AND column_name='subject_id') THEN
          ALTER TABLE exams ADD COLUMN subject_id UUID REFERENCES subjects(id);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        score VARCHAR(50),
        grade VARCHAR(10),
        status VARCHAR(50) DEFAULT 'Draft',
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS plan_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        period VARCHAR(50) DEFAULT 'monthly',
        description TEXT,
        modules JSONB DEFAULT '[]',
        is_popular BOOLEAN DEFAULT false,
        commission_amount NUMERIC(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        plan VARCHAR(100),
        status VARCHAR(50),
        expiry_date DATE,
        amount NUMERIC(10, 2),
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS assignment_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        content TEXT,
        file_url TEXT,
        submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        grade NUMERIC(5, 2),
        feedback TEXT,
        status VARCHAR(50) DEFAULT 'Submitted'
      );

CREATE TABLE IF NOT EXISTS study_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url TEXT,
        file_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS cbt_exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER DEFAULT 60,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Draft',
        class_ids JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbt_exams' AND column_name = 'class_ids') THEN
          ALTER TABLE cbt_exams ADD COLUMN class_ids JSONB DEFAULT '[]';
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS cbt_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES cbt_exams(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSONB DEFAULT '[]', -- Array of option strings
        correct_option_index INTEGER, -- 0-based index
        points NUMERIC(5, 2) DEFAULT 1,
        question_type VARCHAR(50) DEFAULT 'Multiple Choice'
      );

CREATE TABLE IF NOT EXISTS cbt_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES cbt_exams(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        answers JSONB DEFAULT '{}', -- { question_id: selected_index }
        score NUMERIC(5, 2),
        status VARCHAR(50) DEFAULT 'Submitted',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(255),
        action TEXT,
        details TEXT,
        ip_address VARCHAR(50),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='org_id') THEN
          ALTER TABLE audit_logs ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='details') THEN
          ALTER TABLE audit_logs ADD COLUMN details TEXT;
        END IF;
      END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

CREATE TABLE IF NOT EXISTS payroll (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
        month_year VARCHAR(50),
        basic_salary NUMERIC(10, 2),
        deductions NUMERIC(10, 2),
        allowances NUMERIC(10, 2),
        net_salary NUMERIC(10, 2),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        relief_staff_id UUID REFERENCES staff(id),
        leave_type VARCHAR(100),
        start_date DATE,
        end_date DATE,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='leave_days') THEN
          ALTER TABLE leave_requests ADD COLUMN leave_days INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='relief_staff_id') THEN
          ALTER TABLE leave_requests ADD COLUMN relief_staff_id UUID REFERENCES staff(id);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS staff_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50),
        clock_in TIME,
        clock_out TIME,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS recruitment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        position VARCHAR(255),
        applicant_name VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Applied',
        interview_date TIMESTAMP,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment' AND column_name = 'score') THEN
          ALTER TABLE recruitment ADD COLUMN score NUMERIC(5, 2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment' AND column_name = 'experience') THEN
          ALTER TABLE recruitment ADD COLUMN experience TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment' AND column_name = 'phone') THEN
          ALTER TABLE recruitment ADD COLUMN phone VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment' AND column_name = 'salary') THEN
          ALTER TABLE recruitment ADD COLUMN salary NUMERIC(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment' AND column_name = 'allowances') THEN
          ALTER TABLE recruitment ADD COLUMN allowances NUMERIC(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment' AND column_name = 'deductions') THEN
          ALTER TABLE recruitment ADD COLUMN deductions NUMERIC(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment' AND column_name = 'department_id') THEN
          ALTER TABLE recruitment ADD COLUMN department_id UUID REFERENCES departments(id);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS exit_management (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id UUID REFERENCES staff(id),
        exit_date DATE,
        reason VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS scholarships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id),
        type VARCHAR(100),
        amount NUMERIC(10, 2),
        status VARCHAR(50) DEFAULT 'Active',
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS inventory_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID,
        item_name VARCHAR(255),
        quantity INTEGER,
        total_price NUMERIC(10, 2),
        student_id UUID REFERENCES students(id),
        buyer_name VARCHAR(255),
        add_to_fees BOOLEAN DEFAULT false,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS uniform_management (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_name VARCHAR(255),
        size VARCHAR(50),
        stock INTEGER,
        price NUMERIC(10, 2),
        add_to_fees BOOLEAN DEFAULT false,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS lesson_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID REFERENCES staff(id),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        topic VARCHAR(255),
        content TEXT,
        status VARCHAR(50) DEFAULT 'Draft',
        marks NUMERIC(5, 2),
        feedback TEXT,
        marked_by UUID REFERENCES staff(id),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_notes' AND column_name = 'class_id') THEN
          ALTER TABLE lesson_notes ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_notes' AND column_name = 'marks') THEN
          ALTER TABLE lesson_notes ADD COLUMN marks NUMERIC(5, 2);
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS behavior_discipline (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id),
        incident TEXT,
        action_taken TEXT,
        date DATE DEFAULT CURRENT_DATE,
        severity VARCHAR(50),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Enabled',
        category VARCHAR(100),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS teachers_on_duty (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID REFERENCES staff(id),
        date DATE,
        shift VARCHAR(50),
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS performance_cycles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS staff_performance_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cycle_id UUID REFERENCES performance_cycles(id) ON DELETE CASCADE,
        staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
        reviewer_id UUID REFERENCES staff(id),
        score NUMERIC(5, 2),
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT
      );

CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        description TEXT
      );

CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );

CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );

CREATE TABLE IF NOT EXISTS books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        isbn VARCHAR(50),
        category VARCHAR(100),
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        is_digital BOOLEAN DEFAULT false,
        digital_url TEXT,
        digital_content BYTEA,
        price NUMERIC(10, 2) DEFAULT 0,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='is_digital') THEN
          ALTER TABLE books ADD COLUMN is_digital BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='digital_content') THEN
          ALTER TABLE books ADD COLUMN digital_content BYTEA;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='price') THEN
          ALTER TABLE books ADD COLUMN price NUMERIC(10, 2) DEFAULT 0;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS book_loans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID REFERENCES books(id),
        student_id UUID REFERENCES students(id),
        staff_id UUID REFERENCES staff(id),
        loan_date DATE DEFAULT CURRENT_DATE,
        due_date DATE,
        return_date DATE,
        status VARCHAR(50) DEFAULT 'Borrowed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_loans' AND column_name='student_id') THEN
          ALTER TABLE book_loans ADD COLUMN student_id UUID REFERENCES students(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_loans' AND column_name='staff_id') THEN
          ALTER TABLE book_loans ADD COLUMN staff_id UUID REFERENCES staff(id);
        END IF;
        -- Make user_id optional/nullable if it was strict
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='book_loans' AND column_name='user_id') THEN
          ALTER TABLE book_loans ALTER COLUMN user_id DROP NOT NULL;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_name VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 0,
        price NUMERIC(10, 2) DEFAULT 0,
        category VARCHAR(100),
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Good Condition',
        next_maintenance_date DATE,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='price') THEN
          ALTER TABLE inventory ADD COLUMN price NUMERIC(10, 2) DEFAULT 0;
        END IF;
      END $$;

INSERT INTO plan_templates (name, price, period, description, modules, is_popular, commission_amount)
      VALUES 
        ('Basic', 500.00, 'monthly', 'Ideal for small schools', '["Academic Management", "Admissions & Onboarding"]', false, 50.00),
        ('Professional', 1500.00, 'monthly', 'Perfect for growing institutions', '["Everything in Basic", "Finance & Billing", "Exam & Results", "Library System"]', true, 150.00),
        ('Enterprise', 3500.00, 'monthly', 'Full-scale solution for large schools', '["Everything in Professional", "HR & Payroll", "Operations & Logistics", "AI & Advanced Analytics", "Custom Domain"]', false, 400.00)
      ON CONFLICT (name) DO UPDATE SET commission_amount = EXCLUDED.commission_amount;

-- Redundant table definitions and broken seeds removed


CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        org_id UUID REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='uniform_management' AND column_name='student_id') THEN
          ALTER TABLE uniform_management ADD COLUMN student_id UUID REFERENCES students(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_sales' AND column_name='student_id') THEN
          ALTER TABLE inventory_sales ADD COLUMN student_id UUID REFERENCES students(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_sales' AND column_name='add_to_fees') THEN
          ALTER TABLE inventory_sales ADD COLUMN add_to_fees BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='uniform_management' AND column_name='add_to_fees') THEN
          ALTER TABLE uniform_management ADD COLUMN add_to_fees BOOLEAN DEFAULT false;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS remark_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        remark TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS academic_calendar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_name VARCHAR(255) NOT NULL,
        event_description TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        event_type VARCHAR(100), -- Holiday, Exam, Event, etc.
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        sender_id UUID,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_audience VARCHAR(50) DEFAULT 'ALL',
        priority VARCHAR(50) DEFAULT 'Normal',
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        scheduled_for TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='class_id') THEN
          ALTER TABLE announcements ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='scheduled_for') THEN
          ALTER TABLE announcements ADD COLUMN scheduled_for TIMESTAMP;
        END IF;
      END $$;

CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        creator_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        target_audience VARCHAR(50) DEFAULT 'ALL',
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        receiver_id UUID NOT NULL,
        receiver_role VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

-- gemini_api_keys already defined at top


CREATE TABLE IF NOT EXISTS drive_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        owner_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS drive_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        owner_id UUID NOT NULL,
        folder_id UUID REFERENCES drive_folders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        type VARCHAR(100),
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS document_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL, -- 'Receipt', 'OfferLetter', 'Custom'
        layout_config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS report_card_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        layout JSONB DEFAULT '{}',
        sections JSONB DEFAULT '[]',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX IF NOT EXISTS idx_report_card_templates_org_id ON report_card_templates(org_id);

COMMIT;