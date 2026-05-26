import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';

// Helper to get staff ID from logged in user
const getStaffId = async (req: AuthRequest) => {
  const { email, org_id } = req.user;
  const result = await pool.query('SELECT id FROM staff WHERE email = $1 AND org_id = $2', [email, org_id]);
  return result.rows[0]?.id;
};

// ASSIGNMENTS
export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role, email } = req.user;
    let query = `
      SELECT a.*, c.name as class_name, c.section as class_section, s.name as subject_name, st.name as teacher_name,
      (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count
    `;
    
    let fromClause = `
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN staff st ON a.teacher_id = st.id
    `;
    
    let whereClause = ` WHERE a.org_id = $1`;
    const params: any[] = [org_id];

    if (role === 'STAFF') {
      const staffId = await getStaffId(req);
      if (staffId) {
        whereClause += ` AND a.teacher_id = $${params.length + 1}`;
        params.push(staffId);
      }
    } else if (role === 'STUDENT') {
      const studentResult = await pool.query('SELECT id, class_id FROM students WHERE email = $1 AND org_id = $2', [email, org_id]);
      const student = studentResult.rows[0];
      
      if (student) {
        query += `, sub.grade as student_grade, sub.status as student_status, sub.feedback as teacher_feedback`;
        fromClause += ` LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = $${params.length + 1}`;
        params.push(student.id);

        if (student.class_id) {
          whereClause += ` AND a.class_id = $${params.length + 1}`;
          params.push(student.class_id);
        }
      }
    }

    const result = await pool.query(query + fromClause + whereClause, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
    const { class_id, subject_id, title, description, due_date, total_marks } = req.body;
    try {
      const orgId = req.user.org_id;
      const staffId = await getStaffId(req);
  
      if (!staffId && req.user.role === 'STAFF') {
         return res.status(403).json({ error: 'Staff record not found for this user.' });
      }
  
      const teacherId = staffId || req.body.teacher_id;
  
    const result = await pool.query(
        'INSERT INTO assignments (org_id, teacher_id, class_id, subject_id, title, description, due_date, total_marks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [orgId, teacherId, class_id, subject_id, title, description, due_date, total_marks || 100]
      );
      await recordAuditLog(req.user.id, 'CREATE_ASSIGNMENT', `Created assignment: ${title}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { class_id, subject_id, title, description, due_date, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE assignments SET class_id = $1, subject_id = $2, title = $3, description = $4, due_date = $5, status = $6 WHERE id = $7 AND org_id = $8 RETURNING *',
      [class_id, subject_id, title, description, due_date, status, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    await recordAuditLog(req.user.id, 'UPDATE_ASSIGNMENT', `Updated assignment ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM assignments WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    await recordAuditLog(req.user.id, 'DELETE_ASSIGNMENT', `Deleted assignment ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// SUBMISSIONS
export const getSubmissions = async (req: AuthRequest, res: Response) => {
  const { assignment_id } = req.query;
  try {
    const orgId = req.user.org_id;
    let query = `
      SELECT sub.*, s.name as student_name, a.title as assignment_title
      FROM assignment_submissions sub
      JOIN students s ON sub.student_id = s.id
      JOIN assignments a ON sub.assignment_id = a.id
      WHERE a.org_id = $1
    `;
    const params: any[] = [orgId];

    if (assignment_id) {
      query += ` AND sub.assignment_id = $${params.length + 1}`;
      params.push(assignment_id);
    }

    if (req.user.role === 'STUDENT') {
      const studentResult = await pool.query('SELECT id FROM students WHERE email = $1 AND org_id = $2', [req.user.email, orgId]);
      const studentId = studentResult.rows[0]?.id;
      if (studentId) {
        query += ` AND sub.student_id = $${params.length + 1}`;
        params.push(studentId);
      }
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;
  try {
    const result = await pool.query(
      "UPDATE assignment_submissions SET grade = $1, feedback = $2, status = 'Graded' WHERE id = $3 RETURNING *",
      [grade, feedback, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    await recordAuditLog(req.user.id, 'GRADE_ASSIGNMENT_SUBMISSION', `Graded submission ID: ${id} (Grade: ${grade})`, req.user.org_id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  const { assignment_id, content, file_url } = req.body;
  try {
    const { email, org_id } = req.user;
    const studentResult = await pool.query('SELECT id FROM students WHERE email = $1 AND org_id = $2', [email, org_id]);
    const studentId = studentResult.rows[0]?.id;

    if (!studentId) return res.status(403).json({ error: 'Student record not found' });

    const result = await pool.query(
      'INSERT INTO assignment_submissions (assignment_id, student_id, content, file_url, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (assignment_id, student_id) DO UPDATE SET content = $3, file_url = $4, submission_date = NOW(), status = $5 RETURNING *',
      [assignment_id, studentId, content, file_url, 'Submitted']
    );
    await recordAuditLog(req.user.id, 'SUBMIT_ASSIGNMENT', `Submitted assignment ID: ${assignment_id}`, org_id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// STUDY MATERIALS
export const getStudyMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role, email } = req.user;
    let query = `
      SELECT sm.*, c.name as class_name, s.name as subject_name, st.name as teacher_name
      FROM study_materials sm
      LEFT JOIN classes c ON sm.class_id = c.id
      LEFT JOIN subjects s ON sm.subject_id = s.id
      LEFT JOIN staff st ON sm.teacher_id = st.id
      WHERE sm.org_id = $1
    `;
    const params: any[] = [org_id];

    if (role === 'STAFF') {
      const staffId = await getStaffId(req);
      if (staffId) {
        query += ` AND sm.teacher_id = $${params.length + 1}`;
        params.push(staffId);
      }
    } else if (role === 'STUDENT') {
      const studentResult = await pool.query('SELECT class_id FROM students WHERE email = $1 AND org_id = $2', [email, org_id]);
      const classId = studentResult.rows[0]?.class_id;
      if (classId) {
        query += ` AND sm.class_id = $${params.length + 1}`;
        params.push(classId);
      }
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createStudyMaterial = async (req: AuthRequest, res: Response) => {
  const { class_id, subject_id, title, description, file_url, file_type } = req.body;
  try {
    const orgId = req.user.org_id;
    const staffId = await getStaffId(req);

    if (!staffId && req.user.role === 'STAFF') {
       return res.status(403).json({ error: 'Staff record not found for this user.' });
    }

    const teacherId = staffId || req.body.teacher_id;

    const result = await pool.query(
      'INSERT INTO study_materials (org_id, teacher_id, class_id, subject_id, title, description, file_url, file_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [orgId, teacherId, class_id, subject_id, title, description, file_url, file_type]
    );
    await recordAuditLog(req.user.id, 'CREATE_STUDY_MATERIAL', `Created study material: ${title}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStudyMaterial = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM study_materials WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Study material not found' });
    await recordAuditLog(req.user.id, 'DELETE_STUDY_MATERIAL', `Deleted study material ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Study material deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// CBT EXAMS
export const getCBTExams = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role } = req.user;
    let query = `
      SELECT e.*, c.name as class_name, s.name as subject_name, st.name as teacher_name,
      (SELECT COUNT(*) FROM cbt_questions WHERE exam_id = e.id) as question_count
    `;
    
    let fromClause = `
      FROM cbt_exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN staff st ON e.teacher_id = st.id
    `;
    
    let whereClause = ` WHERE e.org_id = $1`;
    const params: any[] = [org_id];

    if (role === 'STAFF') {
      const staffId = await getStaffId(req);
      if (staffId) {
        whereClause += ` AND e.teacher_id = $${params.length + 1}`;
        params.push(staffId);
      }
    } else if (role === 'STUDENT') {
      const studentResult = await pool.query('SELECT id, class_id FROM students WHERE email = $1 AND org_id = $2', [req.user.email, org_id]);
      const student = studentResult.rows[0];
      
      if (student) {
        query += `, 
          (SELECT MAX(score) FROM cbt_submissions WHERE exam_id = e.id AND student_id = $${params.length + 1}) as score,
          (SELECT COUNT(*) FROM cbt_submissions WHERE exam_id = e.id AND student_id = $${params.length + 2}) as attempt_count
        `;
        params.push(student.id); // This param is for the first subquery
        params.push(student.id); // This param is for the second subquery

        if (student.class_id) {
          whereClause += ` AND (e.class_id = $${params.length + 1} OR (e.class_ids IS NOT NULL AND e.class_ids::jsonb ? $${params.length + 2}))`;
          params.push(student.class_id);
          params.push(String(student.class_id));
        }
        whereClause += ` AND e.status = 'Live' AND (e.end_time IS NULL OR e.end_time > NOW())`;
      }
    }

    const finalQuery = query + fromClause + whereClause + " ORDER BY e.created_at DESC";
    const result = await pool.query(finalQuery, params);
    
    // Ensure class_ids is returned as an array even for old records
    const exams = result.rows.map(e => ({
      ...e,
      class_ids: Array.isArray(e.class_ids) ? e.class_ids : (e.class_id ? [e.class_id] : [])
    }));
    res.json(exams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const createCBTExam = async (req: AuthRequest, res: Response) => {
  const { class_id, class_ids, subject_id, title, description, duration_minutes, start_time, end_time, max_attempts, total_marks } = req.body;
  try {
    const orgId = req.user.org_id;
    const staffId = await getStaffId(req);

    if (!staffId && req.user.role === 'STAFF') {
       return res.status(403).json({ error: 'Staff record not found for this user.' });
    }

    const teacherId = staffId || req.body.teacher_id;
    const primaryClassId = class_id || (Array.isArray(class_ids) ? class_ids[0] : null);
    const finalClassIds = Array.isArray(class_ids) ? class_ids : (class_id ? [class_id] : []);

    const result = await pool.query(
      'INSERT INTO cbt_exams (org_id, teacher_id, class_id, class_ids, subject_id, title, description, duration_minutes, start_time, end_time, max_attempts, total_marks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [orgId, teacherId, primaryClassId, JSON.stringify(finalClassIds), subject_id, title, description, duration_minutes || 60, start_time, end_time, max_attempts || 1, total_marks || 0]
    );
    await recordAuditLog(req.user.id, 'CREATE_CBT_EXAM', `Created CBT exam: ${title}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCBTExam = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { class_id, class_ids, subject_id, title, description, duration_minutes, start_time, end_time, status, max_attempts, total_marks } = req.body;
  try {
    const orgId = req.user.org_id;
    const primaryClassId = class_id || (Array.isArray(class_ids) ? class_ids[0] : null);
    const finalClassIds = Array.isArray(class_ids) ? class_ids : (class_id ? [class_id] : []);

    const result = await pool.query(
      'UPDATE cbt_exams SET class_id = $1, class_ids = $2, subject_id = $3, title = $4, description = $5, duration_minutes = $6, start_time = $7, end_time = $8, status = $9, max_attempts = $10, total_marks = $11 WHERE id = $12 AND org_id = $13 RETURNING *',
      [primaryClassId, JSON.stringify(finalClassIds), subject_id, title, description, duration_minutes, start_time, end_time, status, max_attempts, total_marks || 0, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'CBT Exam not found' });
    await recordAuditLog(req.user.id, 'UPDATE_CBT_EXAM', `Updated CBT exam ID: ${id} (${status})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCBTExam = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM cbt_exams WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'CBT Exam not found' });
    await recordAuditLog(req.user.id, 'DELETE_CBT_EXAM', `Deleted CBT exam ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'CBT Exam deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// CBT QUESTIONS
export const getCBTQuestions = async (req: AuthRequest, res: Response) => {
  const { exam_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cbt_questions WHERE exam_id = $1 ORDER BY created_at ASC', [exam_id]);
    const questions = result.rows.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));
    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const addCBTQuestion = async (req: AuthRequest, res: Response) => {
  const { exam_id, question_text, options, correct_option_index, points, question_type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO cbt_questions (exam_id, question_text, options, correct_option_index, points, question_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [exam_id, question_text, JSON.stringify(options), correct_option_index, points, question_type]
    );
    await recordAuditLog(req.user.id, 'ADD_CBT_QUESTION', `Added question to CBT exam ID: ${exam_id}`, req.user.org_id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCBTQuestion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { question_text, options, correct_option_index, points, question_type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE cbt_questions SET question_text = $1, options = $2, correct_option_index = $3, points = $4, question_type = $5 WHERE id = $6 RETURNING *',
      [question_text, JSON.stringify(options), correct_option_index, points, question_type, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    await recordAuditLog(req.user.id, 'UPDATE_CBT_QUESTION', `Updated CBT question ID: ${id}`, req.user.org_id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCBTQuestion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cbt_questions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    await recordAuditLog(req.user.id, 'DELETE_CBT_QUESTION', `Deleted CBT question ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Question deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// CBT SUBMISSIONS & AUTO-SCORING
export const submitCBTExam = async (req: AuthRequest, res: Response) => {
  const { exam_id, answers } = req.body; // answers = { question_id: selected_index }
  const orgId = req.user.org_id;

  try {
    // 0. Get student_id from the user email (Security & Integrity Fix)
    const studentRes = await pool.query('SELECT id FROM students WHERE email = $1 AND org_id = $2', [req.user.email, orgId]);
    const studentId = studentRes.rows[0]?.id;
    if (!studentId) return res.status(403).json({ error: 'Student record not found.' });

    // 1. Check if exam is still live and hasn't ended, and check attempts
    const examRes = await pool.query(
      "SELECT status, end_time, max_attempts FROM cbt_exams WHERE id = $1",
      [exam_id]
    );
    const exam = examRes.rows[0];

    if (!exam || exam.status !== 'Live' || (exam.end_time && new Date(exam.end_time) <= new Date())) {
      return res.status(403).json({ error: 'This exam has ended or is not live. Submission rejected.' });
    }

    const attemptsRes = await pool.query(
      "SELECT COUNT(*) as count FROM cbt_submissions WHERE exam_id = $1 AND student_id = $2",
      [exam_id, studentId]
    );
    const attemptCount = parseInt(attemptsRes.rows[0].count);
    if (attemptCount >= (exam.max_attempts || 1)) {
      return res.status(403).json({ error: `Maximum attempts (${exam.max_attempts}) reached for this exam.` });
    }

    // 2. Fetch all questions for this exam to calculate score
    const questionsRes = await pool.query('SELECT * FROM cbt_questions WHERE exam_id = $1', [exam_id]);
    const questions = questionsRes.rows;

    let totalScore = 0;
    questions.forEach(q => {
      const studentAnswer = answers[q.id];
      if (studentAnswer !== undefined && studentAnswer === q.correct_option_index) {
        totalScore += Number(q.points) || 0;
      }
    });

    const result = await pool.query(
      'INSERT INTO cbt_submissions (exam_id, student_id, answers, score) VALUES ($1, $2, $3, $4) RETURNING *',
      [exam_id, studentId, JSON.stringify(answers), totalScore]
    );
    await recordAuditLog(req.user.id, 'SUBMIT_CBT_EXAM', `Submitted CBT exam ID: ${exam_id} (Score: ${totalScore})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCBTSubmissions = async (req: AuthRequest, res: Response) => {
  const { exam_id } = req.query;
  try {
    const orgId = req.user.org_id;
    let query = `
      SELECT sub.*, s.name as student_name, e.title as exam_title
      FROM cbt_submissions sub
      JOIN students s ON sub.student_id = s.id
      JOIN cbt_exams e ON sub.exam_id = e.id
      WHERE e.org_id = $1
    `;
    const params: any[] = [orgId];

    if (exam_id) {
      query += ` AND sub.exam_id = $${params.length + 1}`;
      params.push(exam_id);
    }

    if (req.user.role === 'STUDENT') {
      const studentResult = await pool.query('SELECT id FROM students WHERE email = $1 AND org_id = $2', [req.user.email, orgId]);
      const studentId = studentResult.rows[0]?.id;
      if (studentId) {
        query += ` AND sub.student_id = $${params.length + 1}`;
        params.push(studentId);
      }
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// AUTO-UPDATE CBT EXAM STATUSES BASED ON START/END TIME
export const autoUpdateCBTExamStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;

    // 1. Set Draft → Live: start_time has arrived and end_time hasn't passed yet
    const goLiveResult = await pool.query(
      `UPDATE cbt_exams
         SET status = 'Live'
       WHERE org_id = $1
         AND status = 'Draft'
         AND start_time IS NOT NULL
         AND start_time <= NOW()
         AND (end_time IS NULL OR end_time > NOW())
       RETURNING id, title`,
      [orgId]
    );

    // 2. Set Live/Draft → Ended: end_time has passed
    const endResult = await pool.query(
      `UPDATE cbt_exams
         SET status = 'Ended'
       WHERE org_id = $1
         AND status IN ('Draft', 'Live')
         AND end_time IS NOT NULL
         AND end_time <= NOW()
       RETURNING id, title`,
      [orgId]
    );

    res.json({
      went_live: goLiveResult.rows,
      ended: endResult.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ONLINE CLASSES
export const getOnlineClasses = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role } = req.user;
    let query = `
      SELECT oc.*, s.name as subject_name, st.name as teacher_name, c.name as class_name
      FROM online_classes oc
      LEFT JOIN subjects s ON oc.subject_id = s.id
      LEFT JOIN staff st ON oc.teacher_id = st.id
      LEFT JOIN classes c ON oc.class_id = c.id
      WHERE oc.org_id = $1
    `;
    const params: any[] = [org_id];

    if (role === 'STAFF') {
      const staffId = await getStaffId(req);
      if (staffId) {
        query += ` AND oc.teacher_id = $${params.length + 1}`;
        params.push(staffId);
      }
    } else if (role === 'STUDENT') {
      const studentResult = await pool.query('SELECT class_id FROM students WHERE email = $1 AND org_id = $2', [req.user.email, org_id]);
      const student = studentResult.rows[0];
      if (student?.class_id) {
        query += ` AND (oc.class_id = $${params.length + 1} OR (oc.class_ids IS NOT NULL AND oc.class_ids::jsonb ? $${params.length + 2}))`;
        params.push(student.class_id);
        params.push(String(student.class_id));
      }
    }

    const result = await pool.query(query + " ORDER BY oc.start_time ASC", params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createOnlineClass = async (req: AuthRequest, res: Response) => {
  const { title, description, class_id, class_ids, subject_id, start_time, end_time, teacher_id, channel } = req.body;
  try {
    const orgId = req.user.org_id;
    // Determine teacher ID: prefer explicit teacher_id, else staff record, else null
    let teacherId = teacher_id;
    if (!teacherId) {
      const staffId = await getStaffId(req);
      teacherId = staffId;
    }
    const staffId = await getStaffId(req);
    const result = await pool.query(
      'INSERT INTO online_classes (org_id, teacher_id, created_by, class_id, class_ids, subject_id, title, description, start_time, end_time, status, channel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [orgId, teacherId, staffId || null, class_id, JSON.stringify(class_ids || []), subject_id, title, description, start_time, end_time, 'Upcoming', channel || null]
    );
    await recordAuditLog(req.user.id, 'CREATE_ONLINE_CLASS', `Created online class: ${title}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteOnlineClass = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM online_classes WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Online class not found' });
    await recordAuditLog(req.user.id, 'DELETE_ONLINE_CLASS', `Deleted online class ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Online class deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const endOnlineClass = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      "UPDATE online_classes SET status = 'Ended' WHERE id = $1 AND org_id = $2 RETURNING *",
      [id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Online class not found' });
    await recordAuditLog(req.user.id, 'END_ONLINE_CLASS', `Ended online class ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const autoUpdateOnlineClassStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const now = new Date();

    // 1. Mark 'Upcoming' as 'Live' if start time reached
    await pool.query(
      "UPDATE online_classes SET status = 'Live' WHERE org_id = $1 AND status = 'Upcoming' AND start_time <= $2 AND end_time > $2",
      [orgId, now]
    );

    // 2. Mark 'Live' or 'Upcoming' as 'Ended' if end time passed
    await pool.query(
      "UPDATE online_classes SET status = 'Ended' WHERE org_id = $1 AND status IN ('Upcoming', 'Live') AND end_time <= $2",
      [orgId, now]
    );

    res.json({ message: 'Statuses updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
