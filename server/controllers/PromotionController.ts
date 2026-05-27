import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

// GET /academic/promotion/settings
// Returns all classes with their promotion_threshold and next_class info
export const getPromotionSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role } = req.user;
    let query = `
      SELECT
        c.id, c.name, c.section, c.rank,
        c.promotion_threshold, c.required_credits,
        nc.id   AS next_class_id,
        nc.name AS next_class_name
      FROM classes c
      LEFT JOIN classes nc ON c.next_class_id = nc.id
    `;
    const params: any[] = [];
    if (role !== 'SUPER_ADMIN') {
      params.push(org_id);
      query += ' WHERE c.org_id = $1';
    }
    query += ' ORDER BY c.rank ASC, c.name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Update the promotion settings for a specific class (threshold, credits, next class)
export const updatePromotionThreshold = async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const { promotion_threshold, required_credits, next_class_id } = req.body;
  try {
    const { org_id } = req.user;
    const result = await pool.query(
      `UPDATE classes 
       SET 
         promotion_threshold = COALESCE($1, promotion_threshold), 
         required_credits = COALESCE($2, required_credits),
         next_class_id = CASE WHEN $5 = true THEN $3 ELSE next_class_id END
       WHERE id = $4 AND org_id = $6 
       RETURNING id, name, promotion_threshold, required_credits, next_class_id`,
      [
        promotion_threshold, 
        required_credits, 
        next_class_id === 'null' ? null : next_class_id, 
        classId,
        next_class_id !== undefined,
        org_id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET /academic/promotion/audit
// Read-only: compute cumulative average per student and compare to class threshold
export const runEligibilityAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role } = req.user;
    const orgFilter = role !== 'SUPER_ADMIN' ? `AND s.org_id = '${org_id}'` : '';

    const result = await pool.query(`
      SELECT
        s.id            AS student_id,
        s.name          AS student_name,
        s.email         AS student_email,
        s.class_id,
        c.name          AS class_name,
        c.section       AS class_section,
        c.promotion_threshold,
        c.required_credits,
        c.next_class_id,
        nc.name         AS next_class_name,
        ROUND(
          AVG(CASE 
            WHEN e.class_id = s.class_id OR sb.class_id = s.class_id 
            THEN CAST(NULLIF(r.score, '') AS NUMERIC) 
            ELSE NULL 
          END), 2
        )               AS cumulative_average,
        SUM(CASE 
          WHEN (e.class_id = s.class_id OR sb.class_id = s.class_id)
           AND CAST(NULLIF(r.score, '') AS NUMERIC) >= c.promotion_threshold 
          THEN COALESCE(sb.credits, 1) 
          ELSE 0 
        END)            AS total_credits_earned,
        COUNT(r.id)     AS result_count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN classes nc ON c.next_class_id = nc.id
      LEFT JOIN results r ON r.student_id = s.id
      LEFT JOIN exams e ON r.exam_id = e.id
      LEFT JOIN subjects sb ON e.subject_id = sb.id
      WHERE s.status NOT IN ('Alumni', 'Graduated', 'Withdrawn') ${orgFilter}
      GROUP BY s.id, s.name, s.email, s.class_id, c.name, c.section, c.rank, c.promotion_threshold, c.required_credits, c.next_class_id, nc.name
      ORDER BY c.rank ASC, c.name ASC, s.name ASC
    `);

    const rows = result.rows.map((row: any) => {
      const avg = row.cumulative_average ? parseFloat(row.cumulative_average) : 0;
      const threshold = parseFloat(row.promotion_threshold);

      const avgOk = avg >= threshold;

      let status = 'Not Eligible';
      if (avgOk) {
        status = row.next_class_id ? 'Eligible' : 'Graduating';
      } else {
        status = 'Failed (Average Too Low)';
      }

      return {
        ...row,
        cumulative_average: avg,
        promotion_threshold: threshold,
        status,
        eligible: avgOk,
        will_graduate: !row.next_class_id,
      };
    });

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST /academic/promotion/bulk
// Promote eligible students, retain ineligible, graduate those with no next class
export const processBulkPromotion = async (req: AuthRequest, res: Response) => {
  const { academic_year } = req.body;
  if (!academic_year) return res.status(400).json({ error: 'academic_year is required' });

  const { org_id, role } = req.user;
  const orgFilter = role !== 'SUPER_ADMIN' ? `AND s.org_id = '${org_id}'` : '';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Compute cumulative averages (same logic as audit)
    const auditResult = await client.query(`
      SELECT
        s.id            AS student_id,
        s.class_id,
        c.promotion_threshold,
        c.required_credits,
        c.next_class_id,
        ROUND(
          AVG(CASE 
            WHEN e.class_id = s.class_id OR sb.class_id = s.class_id 
            THEN CAST(NULLIF(r.score, '') AS NUMERIC) 
            ELSE NULL 
          END), 2
        )               AS cumulative_average,
        SUM(CASE 
          WHEN (e.class_id = s.class_id OR sb.class_id = s.class_id)
           AND CAST(NULLIF(r.score, '') AS NUMERIC) >= c.promotion_threshold 
          THEN COALESCE(sb.credits, 1) 
          ELSE 0 
        END)            AS total_credits_earned
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN results r ON r.student_id = s.id
      LEFT JOIN exams e ON r.exam_id = e.id
      LEFT JOIN subjects sb ON e.subject_id = sb.id
      WHERE s.status NOT IN ('Alumni', 'Graduated', 'Withdrawn') ${orgFilter}
      GROUP BY s.id, s.class_id, c.promotion_threshold, c.required_credits, c.next_class_id, c.rank, c.name
    `);

    let promoted = 0;
    let retained = 0;
    let alumniCount = 0;

    for (const row of auditResult.rows) {
      const avg = row.cumulative_average !== null ? parseFloat(row.cumulative_average) : 0;
      const threshold = parseFloat(row.promotion_threshold);
      const eligible = avg >= threshold;
      const willGraduate = !row.next_class_id;

      let newStatus: string;
      let newClassId: string | null = row.class_id;
      let recordStatus: string;

      if (eligible && willGraduate) {
        // Top class — graduate the student
        newStatus = 'Alumni';
        newClassId = row.class_id; // stays in the same class row but marked alumni
        recordStatus = 'Alumni';
        alumniCount++;
      } else if (eligible && row.next_class_id) {
        // Promote to next class
        newStatus = 'Present';
        newClassId = row.next_class_id;
        recordStatus = 'Promoted';
        promoted++;
      } else {
        // Retain in the same class
        newStatus = 'Present';
        newClassId = row.class_id;
        recordStatus = 'Retained';
        retained++;
      }

      // Update student
      if (newStatus === 'Alumni') {
        await client.query(
          'UPDATE students SET class_id = $1, status = $2, batch = $3 WHERE id = $4',
          [newClassId, newStatus, academic_year, row.student_id]
        );
      } else {
        await client.query(
          'UPDATE students SET class_id = $1, status = $2 WHERE id = $3',
          [newClassId, newStatus, row.student_id]
        );
      }

      // Log promotion record
      await client.query(
        `INSERT INTO promotion_records
          (student_id, from_class_id, to_class_id, cumulative_average, academic_year, status, org_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          row.student_id,
          row.class_id,
          eligible ? (willGraduate ? row.class_id : row.next_class_id) : row.class_id,
          avg,
          academic_year,
          recordStatus,
          org_id,
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ promoted, retained, alumni: alumniCount, total: auditResult.rows.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET /academic/promotion/records
// Returns historical promotion_records
export const getPromotionRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id, role } = req.user;
    let query = `
      SELECT
        pr.*,
        s.name   AS student_name,
        fc.name  AS from_class_name,
        tc.name  AS to_class_name
      FROM promotion_records pr
      JOIN students s    ON pr.student_id   = s.id
      LEFT JOIN classes fc ON pr.from_class_id = fc.id
      LEFT JOIN classes tc ON pr.to_class_id   = tc.id
    `;
    const params: any[] = [];
    if (role !== 'SUPER_ADMIN') {
      params.push(org_id);
      query += ' WHERE pr.org_id = $1';
    }
    query += ' ORDER BY pr.processed_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST /academic/promotion/manual
// Manual override for a single student
export const processManualPromotion = async (req: AuthRequest, res: Response) => {
  const { student_id, academic_year, reason } = req.body;
  const { org_id } = req.user;

  if (!student_id || !academic_year || !reason) {
    return res.status(400).json({ error: 'student_id, academic_year, and reason are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get student current class info
    const studentRes = await client.query(
      `SELECT s.id, s.class_id, c.next_class_id, s.gpa 
       FROM students s 
       JOIN classes c ON s.class_id = c.id 
       WHERE s.id = $1 AND s.org_id = $2`,
      [student_id, org_id]
    );

    if (studentRes.rows.length === 0) {
      throw new Error('Student not found or class not assigned');
    }

    const student = studentRes.rows[0];
    const { class_id: currentClassId, next_class_id: nextClassId, gpa } = student;

    let newStatus = 'Present';
    let targetClassId = nextClassId;
    let recordStatus = 'Promoted (Manual)';

    if (!targetClassId) {
      // Top class -> Graduate
      newStatus = 'Alumni';
      targetClassId = currentClassId;
      recordStatus = 'Alumni (Manual)';
    }

    // 2. Update Student
    if (newStatus === 'Alumni') {
      await client.query(
        'UPDATE students SET class_id = $1, status = $2, batch = $3 WHERE id = $4',
        [targetClassId, newStatus, academic_year, student_id]
      );
    } else {
      await client.query(
        'UPDATE students SET class_id = $1, status = $2 WHERE id = $3',
        [targetClassId, newStatus, student_id]
      );
    }

    // 3. Log Record
    await client.query(
      `INSERT INTO promotion_records
        (student_id, from_class_id, to_class_id, cumulative_average, academic_year, status, reason, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        student_id,
        currentClassId,
        targetClassId,
        gpa || 0,
        academic_year,
        recordStatus,
        reason,
        org_id
      ]
    );

    await client.query('COMMIT');
    res.json({ 
      message: recordStatus.includes('Alumni') ? 'Student graduated successfully' : 'Student promoted successfully', 
      status: recordStatus,
      targetClassId
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

