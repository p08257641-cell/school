import express from 'express';
import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';
import { sendNativePush } from '../lib/webpush.ts';


// CLASSES
export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role } = req.user;
    let result;

    const query = `
      SELECT 
        c.*, 
        nc.name as next_class_name,
        s.name as class_teacher_name,
        gs.name as grading_scale_name
      FROM classes c 
      LEFT JOIN classes nc ON c.next_class_id = nc.id
      LEFT JOIN staff s ON c.class_teacher_id = s.id
      LEFT JOIN grading_scales gs ON c.grading_scale_id = gs.id
    `;

    if (role === 'SUPER_ADMIN') {
      result = await pool.query(query);
    } else {
      result = await pool.query(query + ' WHERE c.org_id = $1', [org_id]);
    }

    res.json(result.rows);
  } catch (err: any) {
    console.error('getClasses error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createClass = async (req: AuthRequest, res: Response) => {
  const { name, section, capacity, rank, next_class_id, class_teacher_id, grading_scale_id, report_card_template_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO classes (org_id, name, section, capacity, rank, next_class_id, class_teacher_id, grading_scale_id, report_card_template_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        orgId,
        name,
        section,
        capacity,
        rank || 0,
        next_class_id || null,
        class_teacher_id || null,
        grading_scale_id || null,
        report_card_template_id || null
      ]
    );
    await recordAuditLog(req.user.id, 'CREATE_CLASS', `Created class: ${name} (${section})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// SUBJECTS
export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;

    const query = `
      SELECT 
        s.*, 
        st.name as teacher_name,
        d.name as department_name,
        COALESCE(
          (SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', c.id, 
            'name', c.name, 
            'section', c.section,
            'teacher_id', sa.teacher_id
          ))
          FROM subject_assignments sa
          JOIN classes c ON sa.class_id = c.id
          WHERE sa.subject_id = s.id), '[]'
        ) as classes,
        -- Maintain legacy fields for compatibility
        (SELECT c.name FROM subject_assignments sa JOIN classes c ON sa.class_id = c.id WHERE sa.subject_id = s.id LIMIT 1) as class_name,
        (SELECT c.section FROM subject_assignments sa JOIN classes c ON sa.class_id = c.id WHERE sa.subject_id = s.id LIMIT 1) as class_section
      FROM subjects s
      LEFT JOIN staff st ON s.teacher_id = st.id
      LEFT JOIN departments d ON s.department_id = d.id
    `;

    if (role === 'SUPER_ADMIN') {
      result = await pool.query(query);
    } else {
      result = await pool.query(query + ' WHERE s.org_id = $1', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSubject = async (req: AuthRequest, res: Response) => {
  const { name, code, teacher_id, class_ids, department_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // Auto-generate code if not provided
    const subjectCode = code || name.slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    const subjectResult = await client.query(
      'INSERT INTO subjects (org_id, name, code, teacher_id, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, name, subjectCode, teacher_id || null, department_id || null]
    );
    const subject = subjectResult.rows[0];

    const classIdsArray = Array.isArray(class_ids) ? class_ids : (class_ids && class_ids !== 'false' && class_ids !== false ? [class_ids] : []);

    if (classIdsArray.length > 0) {
      for (const classId of classIdsArray) {
        await client.query(
          'INSERT INTO subject_assignments (subject_id, class_id, teacher_id, org_id) VALUES ($1, $2, $3, $4)',
          [subject.id, classId, teacher_id || null, orgId]
        );
      }
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_SUBJECT', `Created subject: ${name} (${subjectCode})`, orgId, req.ip || '');
    res.status(201).json(subject);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, code, teacher_id, class_ids, department_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // Maintain or update code
    const subjectCode = code || name.slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    const result = await client.query(
      'UPDATE subjects SET name = $1, code = $2, teacher_id = $3, department_id = $4 WHERE id = $5 AND org_id = $6 RETURNING *',
      [name, subjectCode, teacher_id || null, department_id || null, id, orgId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Sync class assignments
    const classIdsArray = Array.isArray(class_ids) ? class_ids : (class_ids && class_ids !== 'false' && class_ids !== false ? [class_ids] : []);

    // Remove old assignments not in the new list
    await client.query(
      'DELETE FROM subject_assignments WHERE subject_id = $1 AND class_id != ALL($2::uuid[])',
      [id, classIdsArray]
    );

    // Add new assignments
    for (const classId of classIdsArray) {
      await client.query(
        'INSERT INTO subject_assignments (subject_id, class_id, teacher_id, org_id) VALUES ($1, $2, $3, $4) ON CONFLICT (subject_id, class_id) DO NOTHING',
        [id, classId, teacher_id || null, orgId]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM subjects WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subject not found' });
    const deletedSubject = result.rows[0];
    await recordAuditLog(req.user.id, 'DELETE_SUBJECT', `Deleted subject: ${deletedSubject.name}`, orgId, req.ip || '');
    res.json({ message: 'Subject deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, section, capacity, rank, next_class_id, class_teacher_id, grading_scale_id, report_card_template_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE classes SET name = $1, section = $2, capacity = $3, rank = $4, next_class_id = $5, class_teacher_id = $6, grading_scale_id = $7, report_card_template_id = $8 WHERE id = $9 AND org_id = $10 RETURNING *',
      [
        name,
        section,
        capacity,
        rank || 0,
        next_class_id || null,
        class_teacher_id || null,
        grading_scale_id || null,
        report_card_template_id || null,
        id,
        orgId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    await recordAuditLog(req.user.id, 'UPDATE_CLASS', `Updated class: ${name} (${section})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM classes WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    const deletedClass = result.rows[0];
    await recordAuditLog(req.user.id, 'DELETE_CLASS', `Deleted class: ${deletedClass.name}`, orgId, req.ip || '');
    res.json({ message: 'Class deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ATTENDANCE
export const markAttendance = async (req: AuthRequest, res: Response) => {
  const { student_id, status, remarks } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO student_attendance (org_id, student_id, status, remarks) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, student_id, status, remarks]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// QR-BASED ATTENDANCE
export const markAttendanceByQR = async (req: AuthRequest, res: Response) => {
  const { qr_data, status = 'Present', class_id } = req.body;
  try {
    const orgId = req.user.org_id;
    if (!qr_data) return res.status(400).json({ error: 'QR data is required' });

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('en-GB', { hour12: false });

    // Fetch late_time from organization settings
    const orgSettings = await pool.query('SELECT late_time FROM organizations WHERE id = $1', [orgId]);
    const lateThreshold = orgSettings.rows[0]?.late_time || '08:00:00';
    
    // Determine status based on clock-in time
    let scanStatus = status;
    if (status === 'Present' && now > lateThreshold) {
        scanStatus = 'Late';
    }

    // 1. Look up student by admission_no or id
    const studentResult = await pool.query(
      `SELECT s.id, s.name, s.admission_no, s.class_id, s.parent_email, s.fcm_token,
              s.parent_fcm_token, s.push_subscription
       FROM students s
       WHERE s.org_id = $1 AND (s.admission_no = $2 OR CAST(s.id AS TEXT) = $2)
       LIMIT 1`,
      [orgId, qr_data.trim()]
    );

    if (studentResult.rows.length > 0) {
      const student = studentResult.rows[0];

      // Optional class filter
      if (class_id && String(student.class_id) !== String(class_id)) {
        return res.status(400).json({ error: `Student "${student.name}" is not in the selected class.` });
      }

      // Check for existing record today
      const existingResult = await pool.query(
        `SELECT id, clock_in, clock_out FROM student_attendance 
         WHERE org_id = $1 AND student_id = $2 AND date = $3`,
        [orgId, student.id, today]
      );

      if (existingResult.rows.length > 0) {
        const attendance = existingResult.rows[0];
        
        if (!attendance.clock_out) {
          // Perform Clock Out
          const result = await pool.query(
            'UPDATE student_attendance SET clock_out = $1 WHERE id = $2 RETURNING *',
            [now, attendance.id]
          );
          
          // Emit socket notification
          const io = (req as any).io;
          if (io) {
            const payload = {
              student_name: student.name,
              admission_no: student.admission_no,
              action: 'clock_out',
              time: now,
              status: attendance.status
            };
            io.to(`org_${orgId}`).emit('attendance_update', payload);
            if (student.parent_email) {
              io.to(`parent_${student.parent_email.toLowerCase()}`).emit('attendance_notification', payload);
            }
          }



          // Send Push Notification to Parent
          if (student.push_subscription) {
            sendNativePush(
              student.push_subscription,
              'Attendance Alert',
              `${student.name} has just left school.`,
              { student_id: String(student.id), action: 'clock_out' }
            ).catch(e => console.error('Parent native push failed:', e));
          }
          
          return res.json({
            ...result.rows[0],
            student_name: student.name,
            admission_no: student.admission_no,
            type: 'student',
            action: 'clock_out'
          });
        } else {
          return res.status(409).json({
            error: `${student.name} already signed out for today.`,
            student_name: student.name,
            already_marked: true
          });
        }
      }

      // Create attendance record (Clock In)
      const result = await pool.query(
        'INSERT INTO student_attendance (org_id, student_id, status, clock_in, remarks) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [orgId, student.id, scanStatus, now, scanStatus === 'Late' ? 'Marked Late via QR scan' : 'Marked via QR scan']
      );

      // Emit socket notification
      const io = (req as any).io;
      if (io) {
        const payload = {
          student_name: student.name,
          admission_no: student.admission_no,
          action: 'clock_in',
          time: now,
          status: scanStatus
        };
        io.to(`org_${orgId}`).emit('attendance_update', payload);
        if (student.parent_email) {
          io.to(`parent_${student.parent_email.toLowerCase()}`).emit('attendance_notification', payload);
        }
      }



      // Send Push Notification to Parent
      if (student.push_subscription) {
        sendNativePush(
          student.push_subscription,
          'Attendance Alert',
          `${student.name} has just arrived at school.`,
          { student_id: String(student.id), action: 'clock_in' }
        ).catch(e => console.error('Parent native push failed:', e));
      }

      return res.status(201).json({
        ...result.rows[0],
        student_name: student.name,
        admission_no: student.admission_no,
        type: 'student',
        action: 'clock_in'
      });
    }

    // 2. If no student found, look up staff by email or id
    // We prioritize users table since staff_attendance requires user_id
    const staffResult = await pool.query(
      `SELECT u.id as user_id, COALESCE(s.name, u.name) as name, s.id as staff_id 
       FROM users u
       LEFT JOIN staff s ON LOWER(u.email) = LOWER(s.email) AND s.org_id = u.org_id
       WHERE u.org_id = $1 AND (
         LOWER(u.email) = LOWER($2) OR 
         CAST(u.id AS TEXT) = $2 OR 
         (s.id IS NOT NULL AND CAST(s.id AS TEXT) = $2)
       )
       LIMIT 1`,
      [orgId, qr_data.trim()]
    );

    if (staffResult.rows.length > 0) {
      const staff = staffResult.rows[0];

      // SECURITY FIX: Prevent self-marking
      if (String(req.user.id) === String(staff.user_id)) {
        return res.status(403).json({ error: "Security Restriction: You cannot mark your own attendance." });
      }

      // Check for existing record today
      const existingResult = await pool.query(
        `SELECT id, clock_in, clock_out FROM staff_attendance 
         WHERE org_id = $1 AND user_id = $2 AND date = $3`,
        [orgId, staff.user_id, today]
      );

      if (existingResult.rows.length > 0) {
        const attendance = existingResult.rows[0];
        
        if (!attendance.clock_out) {
          // Perform Clock Out
          const result = await pool.query(
            'UPDATE staff_attendance SET clock_out = $1 WHERE id = $2 RETURNING *',
            [now, attendance.id]
          );
          
          return res.json({
            ...result.rows[0],
            student_name: staff.name,
            admission_no: 'Staff',
            type: 'staff',
            action: 'clock_out'
          });
        } else {
          return res.status(409).json({
            error: `${staff.name} already signed out for today.`,
            student_name: staff.name,
            already_marked: true
          });
        }
      }

      // Create staff attendance record (Clock In)
      const result = await pool.query(
        'INSERT INTO staff_attendance (org_id, user_id, status, clock_in) VALUES ($1, $2, $3, $4) RETURNING *',
        [orgId, staff.user_id, scanStatus, now]
      );

      return res.status(201).json({
        ...result.rows[0],
        student_name: staff.name,
        admission_no: 'Staff',
        type: 'staff',
        action: 'clock_in'
      });
    }

    return res.status(404).json({ error: 'Person not found. QR code may be invalid.' });

  } catch (err: any) {
    console.error('QR attendance error:', err);
    res.status(500).json({ error: err.message });
  }
};


export const getAttendance = async (req: AuthRequest, res: Response) => {
  const { studentId, date } = req.query;
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = 'SELECT * FROM student_attendance WHERE 1=1';
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND org_id = $${params.length}`;
    }

    if (studentId) {
      params.push(studentId);
      query += ` AND student_id = $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND date = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// TIMETABLES
export const getTimetables = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.query;
    const orgId = req.user.org_id;
    const role = req.user.role;

    let query = `
      SELECT t.*, s.name as subject_name, st.name as teacher_name, c.name as class_name, c.section as class_section
      FROM timetables t 
      LEFT JOIN subjects s ON t.subject_id = s.id 
      LEFT JOIN staff st ON t.teacher_id = st.id 
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE 1=1`;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND t.org_id = $${params.length}`;
    }

    if (classId) {
      params.push(classId);
      query += ` AND t.class_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTimetableEntry = async (req: AuthRequest, res: Response) => {
  const { class_id, day_of_week, subject_id, teacher_id, start_time, end_time, room, type } = req.body;
  try {
    const orgId = req.user.org_id;

    if (teacher_id && type === 'Lesson') {
      if (req.user.role === 'HOD') {
        const hodStaffInfo = await pool.query('SELECT id, department_id FROM staff WHERE email = $1 AND org_id = $2', [req.user.email, orgId]);
        const hodStaffId = hodStaffInfo.rows[0]?.id;
        const hodStaffEmail = req.user.email;
        const hodStaffDept = hodStaffInfo.rows[0]?.department_id;

        const managedDepts = await pool.query('SELECT id FROM departments WHERE (hod_id = $1 OR hod_id = $2) AND org_id = $3', [hodStaffId, hodStaffEmail, orgId]);
        const managedDeptIds = managedDepts.rows.map(r => r.id);

        const teacherStaff = await pool.query('SELECT department_id, reports_to FROM staff WHERE id = $1 AND org_id = $2', [teacher_id, orgId]);
        const teacherDept = teacherStaff.rows[0]?.department_id;
        const reportsTo = teacherStaff.rows[0]?.reports_to;

        const isManagedDept = hodStaffDept === teacherDept || managedDeptIds.includes(teacherDept);
        const isReporting = reportsTo && (
          (hodStaffId && String(reportsTo).toLowerCase() === String(hodStaffId).toLowerCase()) ||
          (hodStaffEmail && String(reportsTo).toLowerCase() === String(hodStaffEmail).toLowerCase())
        );

        if (!isManagedDept && !isReporting) {
          return res.status(403).json({ error: 'You can only assign teachers from your own department or those reporting to you.' });
        }
      }

      // 2. Conflict Validation: Check for overlapping assignments for this teacher
      const conflict = await pool.query(`
        SELECT t.*, c.name as class_name, c.section as class_section
        FROM timetables t
        JOIN classes c ON t.class_id = c.id
        WHERE t.teacher_id = $1 
          AND t.day_of_week = $2 
          AND t.org_id = $3
          AND (
            (t.start_time <= $4 AND t.end_time > $4) OR 
            (t.start_time < $5 AND t.end_time >= $5) OR
            (t.start_time >= $4 AND t.end_time <= $5)
          )
      `, [teacher_id, day_of_week, orgId, start_time, end_time]);

      if (conflict.rows.length > 0) {
        const c = conflict.rows[0];
        return res.status(409).json({
          error: `Teacher is already assigned to ${c.class_name} ${c.class_section} during this time (${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}).`
        });
      }
    }

    const result = await pool.query(
      'INSERT INTO timetables (class_id, day_of_week, subject_id, teacher_id, start_time, end_time, room, type, org_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [class_id, day_of_week, subject_id || null, teacher_id || null, start_time, end_time, room, type || 'Lesson', orgId]
    );
    await recordAuditLog(req.user.id, 'CREATE_TIMETABLE_ENTRY', `Created timetable entry for class ID: ${class_id} on ${day_of_week}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTimetableEntry = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { class_id, day_of_week, subject_id, teacher_id, start_time, end_time, room, type } = req.body;
  try {
    const orgId = req.user.org_id;

    if (teacher_id && type === 'Lesson') {
      if (req.user.role === 'HOD') {
        const hodStaffInfo = await pool.query('SELECT id, department_id FROM staff WHERE email = $1 AND org_id = $2', [req.user.email, orgId]);
        const hodStaffId = hodStaffInfo.rows[0]?.id;
        const hodStaffEmail = req.user.email;
        const hodStaffDept = hodStaffInfo.rows[0]?.department_id;

        const managedDepts = await pool.query('SELECT id FROM departments WHERE (hod_id = $1 OR hod_id = $2) AND org_id = $3', [hodStaffId, hodStaffEmail, orgId]);
        const managedDeptIds = managedDepts.rows.map(r => r.id);

        const teacherStaff = await pool.query('SELECT department_id, reports_to FROM staff WHERE id = $1 AND org_id = $2', [teacher_id, orgId]);
        const teacherDept = teacherStaff.rows[0]?.department_id;
        const reportsTo = teacherStaff.rows[0]?.reports_to;

        const isManagedDept = hodStaffDept === teacherDept || managedDeptIds.includes(teacherDept);
        const isReporting = reportsTo && (
          (hodStaffId && String(reportsTo).toLowerCase() === String(hodStaffId).toLowerCase()) ||
          (hodStaffEmail && String(reportsTo).toLowerCase() === String(hodStaffEmail).toLowerCase())
        );

        if (!isManagedDept && !isReporting) {
          return res.status(403).json({ error: 'You can only assign teachers from your own department or those reporting to you.' });
        }
      }

      // 2. Conflict Validation: Check for overlapping assignments for this teacher
      const conflict = await pool.query(`
        SELECT t.*, c.name as class_name, c.section as class_section
        FROM timetables t
        JOIN classes c ON t.class_id = c.id
        WHERE t.teacher_id = $1 
          AND t.day_of_week = $2 
          AND t.org_id = $3
          AND t.id != $6
          AND (
            (t.start_time <= $4 AND t.end_time > $4) OR 
            (t.start_time < $5 AND t.end_time >= $5) OR
            (t.start_time >= $4 AND t.end_time <= $5)
          )
      `, [teacher_id, day_of_week, orgId, start_time, end_time, id]);

      if (conflict.rows.length > 0) {
        const c = conflict.rows[0];
        return res.status(409).json({
          error: `Teacher is already assigned to ${c.class_name} ${c.class_section} during this time (${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}).`
        });
      }
    }

    const result = await pool.query(
      'UPDATE timetables SET class_id = $1, day_of_week = $2, subject_id = $3, teacher_id = $4, start_time = $5, end_time = $6, room = $7, type = $8 WHERE id = $9 AND org_id = $10 RETURNING *',
      [class_id, day_of_week, subject_id || null, teacher_id || null, start_time, end_time, room, type || 'Lesson', id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Timetable entry not found' });
    await recordAuditLog(req.user.id, 'UPDATE_TIMETABLE_ENTRY', `Updated timetable entry ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTimetableEntry = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM timetables WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Timetable entry not found' });
    await recordAuditLog(req.user.id, 'DELETE_TIMETABLE_ENTRY', `Deleted timetable entry ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const generateSmartTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const { subjectFrequencies = {}, classId } = req.body; // Map of subject_id -> frequency, optional classId
    
    // 1. Gather context
    let classesResult;
    if (classId) {
      classesResult = await pool.query('SELECT id, name, section FROM classes WHERE id = $1 AND org_id = $2', [classId, orgId]);
    } else {
      classesResult = await pool.query('SELECT id, name, section FROM classes WHERE org_id = $1', [orgId]);
    }
    const classes = classesResult;

    const subjects = await pool.query(`
      SELECT s.id, s.name, s.code, s.teacher_id, st.name as teacher_name,
             COALESCE((SELECT JSON_AGG(class_id) FROM subject_assignments WHERE subject_id = s.id), '[]') as assigned_classes
      FROM subjects s
      LEFT JOIN staff st ON s.teacher_id = st.id
      WHERE s.org_id = $1
    `, [orgId]);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      { start: '08:00', end: '09:00', type: 'Lesson' },
      { start: '09:00', end: '10:00', type: 'Lesson' },
      { start: '10:00', end: '10:30', type: 'Short Break' },
      { start: '10:30', end: '11:30', type: 'Lesson' },
      { start: '11:30', end: '12:30', type: 'Lesson' },
      { start: '12:30', end: '13:30', type: 'Lunch Break' },
      { start: '13:30', end: '14:30', type: 'Lesson' },
      { start: '14:30', end: '15:30', type: 'Lesson' }
    ];

    const generatedEntries: any[] = [];
    const teacherSchedules: Record<string, Set<string>> = {}; // teacherId -> Set of "Day-StartTime"

    // If generating for a specific class, we should still consider other classes' existing schedules for teacher conflicts
    // For simplicity in this deterministic version, we'll fetch existing entries to populate teacherSchedules
    const existing = await pool.query('SELECT teacher_id, day_of_week, start_time FROM timetables WHERE org_id = $1', [orgId]);
    for (const row of existing.rows) {
      if (row.teacher_id) {
        const key = `${row.day_of_week}-${row.start_time.slice(0, 5)}`;
        if (!teacherSchedules[row.teacher_id]) teacherSchedules[row.teacher_id] = new Set();
        teacherSchedules[row.teacher_id].add(key);
      }
    }

    // Initialize subject counters per class
    const classSubjectUsage: Record<string, Record<string, number>> = {}; // classId -> { subjectId -> count }

    for (const cls of classes.rows) {
      classSubjectUsage[cls.id] = {};
      const classSubjects = subjects.rows.filter(s => s.assigned_classes.includes(cls.id));
      
      for (const day of days) {
        for (const slot of timeSlots) {
          if (slot.type !== 'Lesson') {
            generatedEntries.push({
              day_of_week: day,
              start_time: slot.start,
              end_time: slot.end,
              class_id: cls.id,
              subject_id: null,
              teacher_id: null,
              type: slot.type,
              room: 'General'
            });
            continue;
          }

          // Find a subject for this lesson slot
          let assigned = false;
          const sortedClassSubjects = [...classSubjects].sort((a, b) => {
            const freqA = subjectFrequencies[a.id] || 2;
            const freqB = subjectFrequencies[b.id] || 2;
            const usedA = classSubjectUsage[cls.id][a.id] || 0;
            const usedB = classSubjectUsage[cls.id][b.id] || 0;
            return (freqB - usedB) - (freqA - usedA);
          });

          for (const sub of sortedClassSubjects) {
            const requiredFreq = subjectFrequencies[sub.id] || 2;
            const currentFreq = classSubjectUsage[cls.id][sub.id] || 0;

            if (currentFreq < requiredFreq) {
              const teacherKey = `${day}-${slot.start}`;
              if (sub.teacher_id && (!teacherSchedules[sub.teacher_id] || !teacherSchedules[sub.teacher_id].has(teacherKey))) {
                generatedEntries.push({
                  day_of_week: day,
                  start_time: slot.start,
                  end_time: slot.end,
                  class_id: cls.id,
                  subject_id: sub.id,
                  teacher_id: sub.teacher_id,
                  type: 'Lesson',
                  room: sub.room || 'Classroom'
                });

                classSubjectUsage[cls.id][sub.id] = currentFreq + 1;
                if (!teacherSchedules[sub.teacher_id]) teacherSchedules[sub.teacher_id] = new Set();
                teacherSchedules[sub.teacher_id].add(teacherKey);
                assigned = true;
                break;
              }
            }
          }

          if (!assigned) {
            generatedEntries.push({
              day_of_week: day,
              start_time: slot.start,
              end_time: slot.end,
              class_id: cls.id,
              subject_id: null,
              teacher_id: null,
              type: 'Free Period',
              room: 'Library/Study Hall'
            });
          }
        }
      }
    }

    await recordAuditLog(req.user.id, 'GENERATE_SMART_TIMETABLE', `Generated rule-based timetable proposal for ${classId ? 'class ' + classId : 'organization'}`, orgId, req.ip || '');
    
    res.json({
      success: true,
      entries: generatedEntries
    });

  } catch (err: any) {
    console.error('Smart Timetable Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate smart timetable', message: err.message });
  }
};



// SUBJECT ASSIGNMENTS
export const assignSubjectToTeacher = async (req: AuthRequest, res: Response) => {
  const { subject_id, class_id, teacher_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO subject_assignments (subject_id, class_id, teacher_id) VALUES ($1, $2, $3) ON CONFLICT (subject_id, class_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id RETURNING *',
      [subject_id, class_id, teacher_id]
    );
    await recordAuditLog(req.user.id, 'ASSIGN_SUBJECT_TEACHER', `Assigned subject ${subject_id} to teacher ${teacher_id} for class ${class_id}`, req.user.org_id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// LESSON NOTES
export const getLessonNotes = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT ln.*, s.name as teacher_name, c.name as class_name, c.section as class_section
      FROM lesson_notes ln
      JOIN staff s ON ln.teacher_id = s.id
      LEFT JOIN classes c ON ln.class_id = c.id
      WHERE ln.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createLessonNote = async (req: AuthRequest, res: Response) => {
  const { teacher_id, subject, topic, content, class_id } = req.body;
  try {
    const orgId = req.user.org_id;

    // Support multiple classes selection
    const classIds = Array.isArray(class_id) ? class_id : [class_id];
    const results = [];

    for (const cid of classIds) {
      if (!cid) continue;
      const result = await pool.query(
        'INSERT INTO lesson_notes (org_id, teacher_id, subject, topic, content, class_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [orgId, teacher_id, subject, topic, content, cid]
      );
      results.push(result.rows[0]);
    }

    if (results.length === 0 && !class_id) {
      // Support case where class_id is not provided at all
      const result = await pool.query(
        'INSERT INTO lesson_notes (org_id, teacher_id, subject, topic, content, class_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [orgId, teacher_id, subject, topic, content, null]
      );
      results.push(result.rows[0]);
    }

    await recordAuditLog(req.user.id, 'CREATE_LESSON_NOTE', `Created lesson note(s) for subject: ${subject}, topic: ${topic} across ${results.length} class(es)`, orgId, req.ip || '');

    // Return the first one for backward compatibility or a generic success
    res.status(201).json(results[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLessonNote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { teacher_id, subject, topic, content, status, marks, feedback, class_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const markedBy = req.user.staff_id || req.user.id; // Fallback to user id if staff_id not set
    const result = await pool.query(
      'UPDATE lesson_notes SET teacher_id = $1, subject = $2, topic = $3, content = $4, status = $5, marks = $6, feedback = $7, marked_by = $8, class_id = $9 WHERE id = $10 AND org_id = $11 RETURNING *',
      [teacher_id, subject, topic, content, status || 'Draft', marks || null, feedback || null, markedBy, class_id || null, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lesson note not found' });
    await recordAuditLog(req.user.id, 'UPDATE_LESSON_NOTE', `Updated lesson note ID: ${id} (${status})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteLessonNote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM lesson_notes WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lesson note not found' });
    await recordAuditLog(req.user.id, 'DELETE_LESSON_NOTE', `Deleted lesson note ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Lesson note deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// TEACHERS ON DUTY
export const getTeachersOnDuty = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT tod.*, s.name as teacher_name 
      FROM teachers_on_duty tod
      JOIN staff s ON tod.teacher_id = s.id
      WHERE tod.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const assignTeacherOnDuty = async (req: AuthRequest, res: Response) => {
  const { teacher_id, date, shift } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO teachers_on_duty (org_id, teacher_id, date, shift) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, teacher_id, date, shift]
    );
    await recordAuditLog(req.user.id, 'ASSIGN_DUTY', `Assigned teacher ${teacher_id} to duty on ${date} (${shift} shift)`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTeacherOnDuty = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { teacher_id, date, shift } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE teachers_on_duty SET teacher_id = $1, date = $2, shift = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
      [teacher_id, date, shift, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Teacher on duty record not found' });
    await recordAuditLog(req.user.id, 'UPDATE_DUTY', `Updated duty record ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTeacherOnDuty = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM teachers_on_duty WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Teacher on duty record not found' });
    await recordAuditLog(req.user.id, 'DELETE_DUTY', `Deleted duty record ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Teacher on duty record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// BEHAVIOR & DISCIPLINE
export const getBehaviorIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT bd.*, s.name as student_name 
      FROM behavior_discipline bd
      JOIN students s ON bd.student_id = s.id
      WHERE bd.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const recordBehaviorIncident = async (req: AuthRequest, res: Response) => {
  const { student_id, incident, action_taken, severity } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO behavior_discipline (org_id, student_id, incident, action_taken, severity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, student_id, incident, action_taken, severity]
    );
    await recordAuditLog(req.user.id, 'RECORD_DISCIPLINE', `Recorded discipline incident for student ${student_id}: ${incident}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBehaviorIncident = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { student_id, incident, action_taken, severity, date } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE behavior_discipline SET student_id = $1, incident = $2, action_taken = $3, severity = $4, date = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [student_id, incident, action_taken, severity, date, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    await recordAuditLog(req.user.id, 'UPDATE_DISCIPLINE', `Updated discipline incident ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBehaviorIncident = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM behavior_discipline WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    await recordAuditLog(req.user.id, 'DELETE_DISCIPLINE', `Deleted discipline incident ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Incident deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PORTFOLIO
export const getPortfolioItems = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role } = req.user;
    let result;

    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT p.*, s.name as student_name, st.name as teacher_name
        FROM student_portfolio p
        LEFT JOIN students s ON p.student_id = s.id
        LEFT JOIN staff st ON p.teacher_id = st.id
        ORDER BY p.created_at DESC
      `);
    } else {
      // Everyone else (Staff, Admin, Student, Parent) sees all items within their organization
      result = await pool.query(`
        SELECT p.*, s.name as student_name, st.name as teacher_name
        FROM student_portfolio p
        LEFT JOIN students s ON p.student_id = s.id
        LEFT JOIN staff st ON p.teacher_id = st.id
        WHERE p.org_id = $1
        ORDER BY p.created_at DESC
      `, [org_id]);
    }


    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPortfolioItem = async (req: AuthRequest, res: Response) => {
  const { student_id, title, description, file_url } = req.body;
  try {
    const orgId = req.user.org_id;
    const teacherIdResult = await pool.query('SELECT id FROM staff WHERE email = (SELECT email FROM users WHERE id = $1)', [req.user.id]);
    const teacher_id = teacherIdResult.rows[0]?.id || null;

    const result = await pool.query(
      'INSERT INTO student_portfolio (org_id, student_id, teacher_id, title, description, file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgId, student_id || null, teacher_id, title, description, file_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePortfolioItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    await pool.query('DELETE FROM student_portfolio WHERE id = $1 AND org_id = $2', [id, orgId]);
    res.json({ message: 'Portfolio item deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Public (no-auth) — returns school-wide gallery items for the public website
export const getPublicPortfolioItems = async (req: express.Request, res: express.Response) => {
  const { orgId } = req.params;
  try {
    // Verify the organization exists and has landing page enabled
    const orgCheck = await pool.query(
      'SELECT id, landing_page_enabled FROM organizations WHERE id = $1',
      [orgId]
    );
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'School not found.' });
    }
    if (!orgCheck.rows[0].landing_page_enabled) {
      return res.status(403).json({ error: 'Public landing page is not enabled for this school.' });
    }

    const result = await pool.query(
      `SELECT id, title, description, file_url, created_at
       FROM student_portfolio
       WHERE org_id = $1 AND student_id IS NULL
       ORDER BY created_at DESC`,
      [orgId]
    );

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTranscriptsData = async (req: AuthRequest, res: Response) => {
  const { studentIds } = req.body;
  const orgId = req.user.org_id;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of student IDs.' });
  }

  try {
    // 1. Fetch Students Info
    const studentsRes = await pool.query(
      `SELECT s.*, c.name as current_class_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ANY($1) AND s.org_id = $2`,
      [studentIds, orgId]
    );

    // 2. Fetch Results
    const resultsRes = await pool.query(
      `SELECT 
         r.id as result_id,
         r.student_id,
         r.score,
         r.grade,
         r.status,
         e.id as exam_id,
         e.subject,
         e.term,
         e.academic_year,
         e.class_id,
         c.name as class_name,
         s.name as subject_name
       FROM results r
       JOIN exams e ON r.exam_id = e.id
       JOIN classes c ON e.class_id = c.id
       LEFT JOIN subjects s ON e.subject_id = s.id
       WHERE r.student_id = ANY($1) AND r.org_id = $2 AND r.status = 'Published'
       ORDER BY e.academic_year ASC, e.term ASC, s.name ASC`,
      [studentIds, orgId]
    );

    // 3. Fetch Grading Scales & Levels
    const scalesRes = await pool.query(
      `SELECT gs.*, gsl.id as level_id, gsl.grade as level_grade, gsl.min_score, gsl.max_score, gsl.description as level_description
       FROM grading_scales gs
       JOIN grading_scale_levels gsl ON gs.id = gsl.scale_id
       WHERE gs.org_id = $1
       ORDER BY gs.id, gsl.min_score DESC`,
      [orgId]
    );

    // Group levels by grading scale
    const gradingScalesMap: Record<string, any> = {};
    scalesRes.rows.forEach(row => {
      if (!gradingScalesMap[row.id]) {
        gradingScalesMap[row.id] = {
          id: row.id,
          name: row.name,
          description: row.description,
          levels: []
        };
      }
      gradingScalesMap[row.id].levels.push({
        id: row.level_id,
        grade: row.level_grade,
        min_score: parseFloat(row.min_score),
        max_score: parseFloat(row.max_score),
        description: row.level_description
      });
    });

    // 4. Fetch Organization Info
    const orgRes = await pool.query(
      `SELECT id, name, logo, logo_url, email, contact_number, address, signature, brand_color
       FROM organizations
       WHERE id = $1`,
      [orgId]
    );

    res.json({
      students: studentsRes.rows,
      results: resultsRes.rows,
      gradingScales: Object.values(gradingScalesMap),
      organization: orgRes.rows[0] || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
