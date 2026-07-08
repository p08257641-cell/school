import express from 'express';
import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';
import bcrypt from 'bcryptjs';
import { SMSService } from '../services/SMSService.ts';

// INQUIRIES
export const getInquiries = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
    } else {
      result = await pool.query('SELECT * FROM inquiries WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createInquiry = async (req: AuthRequest, res: Response) => {
  const {
    name, parent_name, parent, email, contact, phone, grade, comments, date, previous_school_profile_pic,
    secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion,
    gender, date_of_birth, parent_email,
    previous_school, entrance_exam_score
  } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO inquiries (org_id, name, parent_name, email, contact, grade, comments, date, previous_school_profile_pic, secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion, gender, date_of_birth, parent_email, previous_school, entrance_exam_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
      [
        orgId, name, parent_name || parent, email, contact || phone, grade, JSON.stringify(comments || []), date || new Date(), previous_school_profile_pic,
        secondary_parent_name || null, secondary_parent_email || null, secondary_parent_contact || null, religion || null,
        gender || null, date_of_birth || null, parent_email || null,
        previous_school || null, entrance_exam_score || null
      ]
    );
    await recordAuditLog(req.user.id, 'CREATE_INQUIRY', `Created inquiry for: ${name}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInquiry = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name, parent_name, parent, email, contact, phone, grade, status, comments, date, previous_school_profile_pic,
    secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion,
    gender, date_of_birth, parent_email,
    previous_school, entrance_exam_score
  } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE inquiries SET name = $1, parent_name = $2, email = $3, contact = $4, grade = $5, status = $6, comments = $7, date = $8, previous_school_profile_pic = $9, secondary_parent_name = $10, secondary_parent_email = $11, secondary_parent_contact = $12, religion = $13, gender = $14, date_of_birth = $15, parent_email = $16, previous_school = $17, entrance_exam_score = $18 WHERE id = $19 AND org_id = $20 RETURNING *',
      [
        name, parent_name || parent, email, contact || phone, grade, status, JSON.stringify(comments || []), date, previous_school_profile_pic,
        secondary_parent_name || null, secondary_parent_email || null, secondary_parent_contact || null, religion || null,
        gender || null, date_of_birth || null, parent_email || null,
        previous_school || null, entrance_exam_score || null,
        id, orgId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inquiry not found' });
    await recordAuditLog(req.user.id, 'UPDATE_INQUIRY', `Updated inquiry ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInquiry = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM inquiries WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inquiry not found' });
    await recordAuditLog(req.user.id, 'DELETE_INQUIRY', `Deleted inquiry ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Public (no-auth) — called from the school landing page by anonymous visitors
export const createPublicInquiry = async (req: express.Request, res: express.Response) => {
  const {
    org_id, name, parent_name, email, contact, grade, message
  } = req.body;

  // Basic validation
  if (!org_id || !name || !contact) {
    return res.status(400).json({ error: 'org_id, name, and contact are required.' });
  }

  try {
    // Verify the org exists and has landing_page_enabled
    const orgCheck = await pool.query(
      'SELECT id, landing_page_enabled FROM organizations WHERE id = $1',
      [org_id]
    );
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'School not found.' });
    }
    if (!orgCheck.rows[0].landing_page_enabled) {
      return res.status(403).json({ error: 'Public admissions are not enabled for this school.' });
    }

    const comments = message
      ? JSON.stringify([{ text: message, author: 'Applicant (Online Form)', date: new Date().toISOString() }])
      : JSON.stringify([]);

    const result = await pool.query(
      'INSERT INTO inquiries (org_id, name, parent_name, email, contact, grade, status, comments, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [org_id, name, parent_name || null, email || null, contact, grade || null, 'New', comments, new Date()]
    );

    res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (err: any) {
    console.error('[Public Inquiry] Error:', err.message);
    res.status(500).json({ error: 'Failed to submit inquiry. Please try again.' });
  }
};
export const getApplications = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM applications');
    } else {
      result = await pool.query('SELECT * FROM applications WHERE org_id = $1', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const getNextAdmissionNumber = async (client: any, orgId: string) => {
  const orgResult = await client.query('SELECT admission_no_prefix, admission_no_suffix, admission_no_start_from FROM organizations WHERE id = $1', [orgId]);
  const settings = orgResult.rows[0];
  const prefix = settings?.admission_no_prefix || 'ADM-';
  const startFrom = settings?.admission_no_start_from || 1;
  const suffix = settings?.admission_no_suffix || '';

  // Get all admission numbers for this org to find the maximum numeric value
  // We use regex to extract the number between prefix and suffix
  const studentResult = await client.query(
    `SELECT admission_no 
     FROM students 
     WHERE org_id = $1 AND admission_no LIKE $2`,
    [orgId, `${prefix}%${suffix}`]
  );

  let maxNum = startFrom - 1;
  for (const row of studentResult.rows) {
    const admissionNo = row.admission_no;
    // Extract the numeric part: remove prefix from start and suffix from end
    let numericStr = admissionNo;
    if (prefix && numericStr.startsWith(prefix)) {
      numericStr = numericStr.substring(prefix.length);
    }
    if (suffix && numericStr.endsWith(suffix)) {
      numericStr = numericStr.substring(0, numericStr.length - suffix.length);
    }

    const num = parseInt(numericStr);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum}${suffix}`;
};


// Helper to handle fee payment (creates student if needed, then invoice and payment)
const handleFeePayment = async (client: any, orgId: string, data: any) => {
  if (data.fee_status !== 'Paid') return;

  // Check if student already exists by acceptance_id to prevent duplicate creation
  if (data.id) {
    const existingByAcceptance = await client.query('SELECT id FROM students WHERE acceptance_id = $1 AND org_id = $2', [data.id, orgId]);
    if (existingByAcceptance.rows.length > 0) return;
  }

  // 1. Check if student already exists by email (or name/parent)
  let studentId;
  const existingStudent = await client.query(
    'SELECT id FROM students WHERE (email = $1 OR (name = $2 AND parent_name = $3)) AND org_id = $4',
    [data.email, data.name, data.parent_name, orgId]
  );

  if (existingStudent.rows.length > 0) {
    studentId = existingStudent.rows[0].id;
    // Link to acceptance if not already linked
    if (data.id && !existingStudent.rows[0].acceptance_id) {
      await client.query('UPDATE students SET acceptance_id = $1 WHERE id = $2', [data.id, studentId]);
    }
  } else {
    // Create a "Pending Enrollment" student record so we can attach an invoice
    const hashedPassword = await bcrypt.hash('zxcv123$$', 10);
    const generatedAdmissionNo = await getNextAdmissionNumber(client, orgId);
    const newStudent = await client.query(
      'INSERT INTO students (org_id, name, email, parent_email, parent_name, contact, status, gpa, admission_no, fee_status, fee_amount, acceptance_id, password, class_id, secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id',
      [
        orgId, data.name, data.email, data.parent_email || data.email, data.parent_name, data.contact, 'Pending Enrollment', '0.0', generatedAdmissionNo, 'Paid', data.fee_amount || 0, data.id || null, hashedPassword, data.class_id || null,
        data.secondary_parent_name || null, data.secondary_parent_email || null, data.secondary_parent_contact || null, data.religion || null
      ]
    );
    studentId = newStudent.rows[0].id;
  }

  // Check if invoice already exists for this student and amount
  const existingInvoice = await client.query(
    'SELECT id FROM invoices WHERE student_id = $1 AND amount = $2 AND org_id = $3',
    [studentId, data.fee_amount || 0, orgId]
  );

  if (existingInvoice.rows.length === 0) {
    // 2. Create Invoice
    const invoice = await client.query(
      'INSERT INTO invoices (org_id, student_id, amount, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [orgId, studentId, data.fee_amount || 0, 'Paid', new Date()]
    );

    // 3. Create Payment
    await client.query(
      'INSERT INTO payments (org_id, invoice_id, student_id, amount, date, method, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [orgId, invoice.rows[0].id, studentId, data.fee_amount || 0, new Date(), 'Direct Bank Transfer', 'Completed']
    );
  }
};

export const createApplication = async (req: AuthRequest, res: Response) => {
  const {
    name, grade, parent_name, parentName, contact, contact_phone, parent_phone, parentPhone,
    email, parent_email, parentEmail,
    gender, entrance_exam_score,
    mathScore, englishScore, scienceScore, interviewScore, previousSchool,
    math_score, english_score, science_score, interview_score, previous_school,
    previous_school_profile_pic, date_of_birth, dateOfBirth, status, decision, custom_scores,
    fee_status, fee_amount, fee_structure_id,
    secondary_parent_name, secondaryParentName, secondary_parent_email, secondaryParentEmail, secondary_parent_contact, secondaryParentContact, religion
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;
    const result = await client.query(
      'INSERT INTO applications (org_id, name, grade, parent_name, contact, email, parent_email, gender, entrance_exam_score, math_score, english_score, science_score, interview_score, previous_school, previous_school_profile_pic, date_of_birth, status, decision, custom_scores, fee_status, fee_amount, fee_structure_id, secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26) RETURNING *',
      [
        orgId, name, grade, parent_name || parentName, contact || contact_phone || parent_phone || parentPhone, email, parent_email || parentEmail, gender, entrance_exam_score,
        mathScore || math_score, englishScore || english_score, scienceScore || science_score, interviewScore || interview_score, previousSchool || previous_school,
        previous_school_profile_pic, date_of_birth || dateOfBirth, status || 'Pending Review', decision || 'Pending', JSON.stringify(custom_scores || {}),
        fee_status || 'Pending', fee_amount || 0, Array.isArray(fee_structure_id) ? fee_structure_id[0] : fee_structure_id,
        secondary_parent_name || secondaryParentName || null, secondary_parent_email || secondaryParentEmail || null, secondary_parent_contact || secondaryParentContact || null, religion || null
      ]
    );

    const app = result.rows[0];
    await handleFeePayment(client, orgId, app);

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_APPLICATION', `Created application for: ${name}`, orgId, req.ip || '');

    // Send SMS Notification
    if (app.contact) {
      SMSService.sendSMS(
        orgId,
        app.contact,
        `Hello ${app.parent_name || 'Parent'}, your application for ${app.name} has been received. Status: ${app.status}.`
      ).catch(err => console.error('SMS Notification failed:', err));
    }

    res.status(201).json(app);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateApplication = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name, grade, parent_name, parentName, contact, contact_phone, parent_phone, parentPhone,
    email, parent_email, parentEmail,
    gender, entrance_exam_score, status, decision,
    mathScore, englishScore, scienceScore, interviewScore, previousSchool,
    math_score, english_score, science_score, interview_score, previous_school,
    previous_school_profile_pic, date_of_birth, dateOfBirth, custom_scores,
    fee_status, fee_amount, fee_structure_id,
    secondary_parent_name, secondaryParentName, secondary_parent_email, secondaryParentEmail, secondary_parent_contact, secondaryParentContact, religion
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;
    const result = await client.query(
      'UPDATE applications SET name = $1, grade = $2, parent_name = $3, contact = $4, email = $5, parent_email = $6, gender = $7, entrance_exam_score = $8, status = $9, decision = $10, math_score = $11, english_score = $12, science_score = $13, interview_score = $14, previous_school = $15, date_of_birth = $16, custom_scores = $17, previous_school_profile_pic = $18, fee_status = $19, fee_amount = $20, fee_structure_id = $21, secondary_parent_name = $22, secondary_parent_email = $23, secondary_parent_contact = $24, religion = $25 WHERE id = $26 AND org_id = $27 RETURNING *',
      [
        name, grade, parent_name || parentName, contact || contact_phone || parent_phone || parentPhone, email, parent_email || parentEmail, gender, entrance_exam_score, status, decision,
        mathScore || math_score, englishScore || english_score, scienceScore || science_score, interviewScore || interview_score, previousSchool || previous_school,
        date_of_birth || dateOfBirth, JSON.stringify(custom_scores || {}),
        previous_school_profile_pic, fee_status, fee_amount, Array.isArray(fee_structure_id) ? fee_structure_id[0] : fee_structure_id,
        secondary_parent_name || secondaryParentName || null, secondary_parent_email || secondaryParentEmail || null, secondary_parent_contact || secondaryParentContact || null, religion || null,
        id, orgId
      ]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = result.rows[0];
    await handleFeePayment(client, orgId, app);

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_APPLICATION', `Updated application ID: ${id}`, orgId, req.ip || '');

    // Send SMS Notification if decision changed
    if (app.contact && decision && decision !== 'Pending') {
      SMSService.sendSMS(
        orgId,
        app.contact,
        `Hello ${app.parent_name || 'Parent'}, the application for ${app.name} has been ${decision.toLowerCase()}.`
      ).catch(err => console.error('SMS Notification failed:', err));
    }

    res.json(app);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteApplication = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM applications WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    await recordAuditLog(req.user.id, 'DELETE_APPLICATION', `Deleted application ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Application deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAcceptances = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM acceptances');
    } else {
      result = await pool.query('SELECT * FROM acceptances WHERE org_id = $1', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createAcceptance = async (req: AuthRequest, res: Response) => {
  const {
    name, grade, class_id, parent_name, parentName, contact, contact_phone, parent_phone, parentPhone,
    email, parent_email, parentEmail, gender, decision, fee_status, fee_amount, fee_structure_id,
    entranceExamScore, entrance_exam_score,
    mathScore, englishScore, scienceScore, interviewScore, previousSchool,
    math_score, english_score, science_score, interview_score, previous_school,
    previous_school_profile_pic, previousSchoolProfilePic,
    date_of_birth, dateOfBirth, custom_scores,
    secondary_parent_name, secondaryParentName, secondary_parent_email, secondaryParentEmail, secondary_parent_contact, secondaryParentContact, religion
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;
    const result = await client.query(
      'INSERT INTO acceptances (org_id, name, grade, class_id, parent_name, contact, email, parent_email, gender, decision, fee_status, fee_amount, fee_structure_id, entrance_exam_score, math_score, english_score, science_score, interview_score, previous_school, date_of_birth, custom_scores, previous_school_profile_pic, secondary_parent_name, secondary_parent_email, secondary_parent_contact, religion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26) RETURNING *',
      [
        orgId, name, grade, class_id, parent_name || parentName, contact || contact_phone || parent_phone || parentPhone, email, parent_email || parentEmail, gender, decision || 'Accepted', fee_status || 'Pending', fee_amount || 0, Array.isArray(fee_structure_id) ? fee_structure_id[0] : fee_structure_id,
        entranceExamScore || entrance_exam_score,
        mathScore || math_score, englishScore || english_score, scienceScore || science_score, interviewScore || interview_score, previousSchool || previous_school,
        date_of_birth || dateOfBirth, JSON.stringify(custom_scores || {}),
        previous_school_profile_pic || previousSchoolProfilePic,
        secondary_parent_name || secondaryParentName || null, secondary_parent_email || secondaryParentEmail || null, secondary_parent_contact || secondaryParentContact || null, religion || null
      ]
    );

    const acc = result.rows[0];
    await handleFeePayment(client, orgId, acc);

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_ACCEPTANCE', `Created acceptance for: ${name}`, orgId, req.ip || '');
    res.status(201).json(acc);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateAcceptance = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name, grade, class_id, parent_name, parentName, contact, contact_phone, parent_phone, parentPhone,
    email, parent_email, parentEmail, gender, decision, fee_status, fee_amount, fee_structure_id,
    entranceExamScore, entrance_exam_score,
    mathScore, englishScore, scienceScore, interviewScore, previousSchool,
    math_score, english_score, science_score, interview_score, previous_school,
    previous_school_profile_pic, previousSchoolProfilePic,
    date_of_birth, dateOfBirth, custom_scores,
    secondary_parent_name, secondaryParentName, secondary_parent_email, secondaryParentEmail, secondary_parent_contact, secondaryParentContact, religion
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;
    const result = await client.query(
      'UPDATE acceptances SET name = $1, grade = $2, class_id = $3, parent_name = $4, contact = $5, email = $6, parent_email = $7, gender = $8, decision = $9, fee_status = $10, fee_amount = $11, entrance_exam_score = $12, math_score = $13, english_score = $14, science_score = $15, interview_score = $16, previous_school = $17, date_of_birth = $18, custom_scores = $19, previous_school_profile_pic = $20, fee_structure_id = $21, secondary_parent_name = $22, secondary_parent_email = $23, secondary_parent_contact = $24, religion = $25 WHERE id = $26 AND org_id = $27 RETURNING *',
      [
        name, grade, class_id, parent_name || parentName, contact || contact_phone || parent_phone || parentPhone, email, parent_email || parentEmail, gender, decision, fee_status, fee_amount,
        entranceExamScore || entrance_exam_score,
        mathScore || math_score, englishScore || english_score, scienceScore || science_score, interviewScore || interview_score, previousSchool || previous_school,
        date_of_birth || dateOfBirth, JSON.stringify(custom_scores || {}),
        previous_school_profile_pic || previousSchoolProfilePic, Array.isArray(fee_structure_id) ? fee_structure_id[0] : fee_structure_id,
        secondary_parent_name || secondaryParentName || null, secondary_parent_email || secondaryParentEmail || null, secondary_parent_contact || secondaryParentContact || null, religion || null,
        id, orgId
      ]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Acceptance not found' });
    }

    const acc = result.rows[0];
    await handleFeePayment(client, orgId, acc);

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_ACCEPTANCE', `Updated acceptance ID: ${id}`, orgId, req.ip || '');
    res.json(acc);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteAcceptance = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM acceptances WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Acceptance not found' });
    await recordAuditLog(req.user.id, 'DELETE_ACCEPTANCE', `Deleted acceptance ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Acceptance deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
