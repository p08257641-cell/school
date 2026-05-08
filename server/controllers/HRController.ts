import express from 'express';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';

// Helper to sync HOD role based on department head status
const syncStaffHodRole = async (staffId: string) => {
  if (!staffId) return;
  try {
    // Check if staff is head of any department
    const deptRes = await pool.query('SELECT 1 FROM departments WHERE hod_id = $1 LIMIT 1', [staffId]);
    const isHod = deptRes.rows.length > 0;

    // Get current roles
    const staffRes = await pool.query('SELECT additional_roles FROM staff WHERE id = $1', [staffId]);
    if (staffRes.rows.length === 0) return;

    let roles = Array.isArray(staffRes.rows[0].additional_roles)
      ? staffRes.rows[0].additional_roles
      : (staffRes.rows[0].additional_roles || []);

    const hasHod = roles.includes('HOD');

    if (isHod && !hasHod) {
      roles.push('HOD');
      await pool.query('UPDATE staff SET additional_roles = $1 WHERE id = $2', [roles, staffId]);
    } else if (!isHod && hasHod) {
      roles = roles.filter((r: string) => r !== 'HOD');
      await pool.query('UPDATE staff SET additional_roles = $1 WHERE id = $2', [roles, staffId]);
    }
  } catch (err) {
    console.error('Failed to sync HOD role:', err);
  }
};

// DEPARTMENTS
export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = `
      SELECT d.*, s.name as head_name,
      (SELECT COUNT(*) FROM staff WHERE department_id = d.id) as staff_count
      FROM departments d
      LEFT JOIN staff s ON d.hod_id = s.id
      WHERE 1=1`;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND d.org_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  const { name, hod_id, description } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO departments (org_id, name, hod_id, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, name, hod_id || null, description]
    );

    if (hod_id) {
      await syncStaffHodRole(hod_id);
    }
    await recordAuditLog(req.user.id, 'CREATE_DEPARTMENT', `Created department: ${name}`, req.user.org_id);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, hod_id, description } = req.body;
  try {
    const orgId = req.user.org_id;

    // Get old HOD info first
    const oldRes = await pool.query('SELECT hod_id FROM departments WHERE id = $1 AND org_id = $2', [id, orgId]);
    const oldHodId = oldRes.rows[0]?.hod_id;

    const result = await pool.query(
      'UPDATE departments SET name = $1, hod_id = $2, description = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
      [name, hod_id || null, description, id, orgId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });

    // Sync HOD roles
    if (hod_id !== oldHodId) {
      if (oldHodId) await syncStaffHodRole(oldHodId);
      if (hod_id) await syncStaffHodRole(hod_id);
    }
    await recordAuditLog(req.user.id, 'UPDATE_DEPARTMENT', `Updated department: ${name} (ID: ${id})`, req.user.org_id);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;

    // Get HOD info before deletion
    const deptRes = await pool.query('SELECT hod_id FROM departments WHERE id = $1 AND org_id = $2', [id, orgId]);
    const hodId = deptRes.rows[0]?.hod_id;

    const result = await pool.query('DELETE FROM departments WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });

    if (hodId) {
      await syncStaffHodRole(hodId);
    }
    await recordAuditLog(req.user.id, 'DELETE_DEPARTMENT', `Deleted department ID: ${id}`, req.user.org_id);
    res.json({ message: 'Department deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// STAFF DETAILS
export const getStaffMembers = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    const isStudentOrParent = ['STUDENT', 'PARENT'].includes(role);

    let selectClause = 's.*, d.name as department_name, rs.name as reports_to_name, u.id as user_id';
    if (isStudentOrParent) {
      // Restricted columns for students/parents to protect privacy/security
      selectClause = 's.id, s.name, s.email, s.role, s.status, s.department_id, s.phone, d.name as department_name';
    }

    let query = `
      SELECT ${selectClause}
      FROM staff s 
      LEFT JOIN departments d ON s.department_id = d.id 
      LEFT JOIN staff rs ON s.reports_to = rs.id
      LEFT JOIN users u ON s.email = u.email
      WHERE 1=1`;
    const params: any[] = [];

    // 1. Automatic deactivation based on exit management date
    if (role !== 'SUPER_ADMIN') {
      await pool.query(`
        UPDATE staff 
        SET status = 'Inactive'
        WHERE id IN (
          SELECT staff_id 
          FROM exit_management 
          WHERE exit_date <= CURRENT_DATE 
          AND status != 'Inactive'
          AND org_id = $1
        )
        AND status = 'Active'
        AND org_id = $1
      `, [orgId]);
    }

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND s.org_id = $${params.length}`;
    }

    // A STAFF member can only see their own record, UNLESS they are also an HOD
    const userRoles = req.user.roles || [];
    const isHOD = role === 'HOD' || userRoles.includes('HOD');

    if (role === 'STAFF' && !isHOD) {
      params.push(req.user.email);
      query += ` AND s.email = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createStaff = async (req: AuthRequest, res: Response) => {
  const {
    name, email, role, status, department_id, phone, reports_to,
    additional_roles, salary, allowances, deductions,
    annual_leave_limit, leave_balance, carried_over_balance,
    leave_limit_unit, date_of_birth
  } = req.body;
  const client = await pool.connect();
  try {
    const orgId = req.user.org_id;

    // Fetch organization defaults
    const orgRes = await client.query('SELECT default_leave_limit, default_leave_limit_unit FROM organizations WHERE id = $1', [orgId]);
    const orgDefaults = orgRes.rows[0] || { default_leave_limit: 20, default_leave_limit_unit: 'Days' };

    await client.query('BEGIN');

    // 0. Check if staff with this email already exists in this organization
    if (email) {
      const existingStaff = await client.query('SELECT id FROM staff WHERE LOWER(email) = $1 AND org_id = $2', [email.toLowerCase().trim(), orgId]);
      if (existingStaff.rows.length > 0) {
        throw new Error(`Staff member with email ${email} already exists in this institution.`);
      }
    }

    // 1. Insert into staff table
    const result = await client.query(
      `INSERT INTO staff (name, email, role, status, department_id, phone, reports_to, additional_roles, salary, allowances, deductions, annual_leave_limit, leave_balance, carried_over_balance, leave_limit_unit, org_id, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        name,
        email,
        role,
        status || 'Active',
        department_id || null,
        phone || null,
        reports_to || null,
        additional_roles ? (Array.isArray(additional_roles) ? additional_roles : [additional_roles]) : '{}',
        salary || 0,
        allowances || 0,
        deductions || 0,
        annual_leave_limit || orgDefaults.default_leave_limit,
        leave_balance ?? (annual_leave_limit || orgDefaults.default_leave_limit),
        req.body.carried_over_balance || 0,
        leave_limit_unit || orgDefaults.default_leave_limit_unit,
        orgId,
        date_of_birth || null
      ]
    );

    // 2. Create User account if it doesn't exist globally
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const userCheck = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (userCheck.rows.length === 0) {
        const defaultPassword = 'zxcv123$$';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await client.query(
          'INSERT INTO users (email, password, name, role, org_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
          [normalizedEmail, hashedPassword, name, 'STAFF', orgId]
        );
      }
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_STAFF', `Created staff member: ${name} (${email})`, req.user.org_id);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// PAYROLL
export const getPayroll = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    const { staffId, monthYear } = req.query;

    let query = `
      SELECT 
        p.*,
        s.name,
        s.role
      FROM payroll p 
      JOIN staff s ON p.staff_id = s.id 
      WHERE 1=1`;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND s.org_id = $${params.length}`;
    }

    if (role === 'STAFF') {
      params.push(req.user.email);
      query += ` AND s.email = $${params.length}`;
    }

    if (staffId) {
      params.push(staffId);
      query += ` AND p.staff_id = $${params.length}`;
    }
    if (monthYear) {
      params.push(monthYear);
      query += ` AND p.month_year = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPayroll = async (req: AuthRequest, res: Response) => {
  const { staff_id, month_year, basic_salary, deductions, allowances, net_salary } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO payroll (staff_id, month_year, basic_salary, deductions, allowances, net_salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [staff_id, month_year, basic_salary, deductions, allowances, net_salary]
    );
    await recordAuditLog(req.user.id, 'CREATE_PAYROLL', `Created payroll for staff ID: ${staff_id} (${month_year})`, req.user.org_id);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// RUN PAYROLL - auto-generate payroll entries for all active staff from their salaries
export const runPayroll = async (req: AuthRequest, res: Response) => {
  const { month_year, staff_ids } = req.body;
  try {
    const orgId = req.user.org_id;
    // Get active staff (optionally filtered by staff_ids)
    let query = `SELECT s.id, s.name, s.salary, s.allowances, s.deductions
                 FROM staff s
                 WHERE s.org_id = $1 AND s.status = 'Active' AND (s.salary IS NOT NULL AND s.salary > 0)`;
    const params: any[] = [orgId];

    if (staff_ids && Array.isArray(staff_ids) && staff_ids.length > 0) {
      query += ` AND s.id = ANY($2)`;
      params.push(staff_ids);
    }

    const staffResult = await pool.query(query, params);

    if (staffResult.rows.length === 0) {
      return res.status(400).json({ error: 'No matching active staff with salary found. Please check your selection and staff salaries.' });
    }

    const inserted: any[] = [];
    const updated: any[] = [];

    for (const staff of staffResult.rows) {
      const staffId = staff.id;
      const basicSalary = parseFloat(staff.salary) || 0;
      const allowances = parseFloat(staff.allowances) || 0;
      const deductions = parseFloat(staff.deductions) || 0;
      const netSalary = basicSalary + allowances - deductions;

      // Check if payroll already exists for this staff and month
      const existing = await pool.query(
        "SELECT id, status FROM payroll WHERE staff_id = $1 AND month_year = $2",
        [staffId, month_year]
      );

      if (existing.rows.length > 0) {
        // Only update if it's still Pending
        if (existing.rows[0].status === 'Pending') {
          const result = await pool.query(
            "UPDATE payroll SET basic_salary = $1, allowances = $2, deductions = $3, net_salary = $4 WHERE id = $5 RETURNING *",
            [basicSalary, allowances, deductions, netSalary, existing.rows[0].id]
          );
          updated.push(result.rows[0]);
        }
        continue; // skip if already paid or we updated
      }

      const result = await pool.query(
        "INSERT INTO payroll (staff_id, month_year, basic_salary, deductions, allowances, net_salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [staffId, month_year, basicSalary, deductions, allowances, netSalary]
      );
      inserted.push(result.rows[0]);
    }

    await recordAuditLog(req.user.id, 'RUN_PAYROLL', `Ran payroll for ${month_year}`, req.user.org_id);
    res.status(201).json({
      message: `Payroll processed: ${inserted.length} generated, ${updated.length} updated.`,
      data: [...inserted, ...updated]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// LEAVE REQUESTS
export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    const { userId } = req.query;

    let query = `
      SELECT 
        lr.*,
        u.name AS staff_name,
        rs.name AS relief_staff_name
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      LEFT JOIN staff rs ON lr.relief_staff_id = rs.id
      WHERE 1=1`;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND u.org_id = $${params.length}`;
    }

    if (role === 'STAFF') {
      params.push(req.user.id);
      query += ` AND lr.user_id = $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      query += ` AND lr.user_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  const { leave_type, start_date, end_date, reason, user_id, relief_staff_id } = req.body;
  try {
    const start = new Date(start_date);
    const end = new Date(end_date);

    // Set to midnight to calculate full days accurately
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - start.getTime();
    const leaveDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24))) + 1;

    const targetUserId = user_id || req.user.id;
    const reliefId = relief_staff_id || null;

    // Check balance if it's Annual Leave
    if (leave_type === 'Annual Leave') {
      const staffRes = await pool.query('SELECT leave_balance FROM staff WHERE user_id = $1 OR email = (SELECT email FROM users WHERE id = $1)', [targetUserId]);
      if (staffRes.rows.length > 0 && staffRes.rows[0].leave_balance < leaveDays) {
        return res.status(400).json({ error: `Insufficient leave balance. Remaining: ${staffRes.rows[0].leave_balance} days.` });
      }
    }

    const result = await pool.query(
      'INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, leave_days, relief_staff_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [targetUserId, leave_type, start_date, end_date, reason, leaveDays, reliefId]
    );
    await recordAuditLog(req.user.id, 'CREATE_LEAVE_REQUEST', `Created leave request for user ID: ${targetUserId}`, req.user.org_id);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // Approved, Rejected
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the request details
    const leaveRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (leaveRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const leave = leaveRes.rows[0];
    const oldStatus = leave.status;

    // Update the status
    const result = await client.query(
      'UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    // If approved and was not previously approved, deduct from balance
    if (status === 'Approved' && oldStatus !== 'Approved' && leave.leave_type === 'Annual Leave') {
      await client.query(
        'UPDATE staff SET leave_balance = leave_balance - $1 WHERE id = (SELECT s.id FROM staff s JOIN users u ON s.email = u.email WHERE u.id = $2)',
        [leave.leave_days, leave.user_id]
      );
    }
    // If rejected and was previously approved, add back to balance
    else if (status === 'Rejected' && oldStatus === 'Approved' && leave.leave_type === 'Annual Leave') {
      await client.query(
        'UPDATE staff SET leave_balance = leave_balance + $1 WHERE id = (SELECT s.id FROM staff s JOIN users u ON s.email = u.email WHERE u.id = $2)',
        [leave.leave_days, leave.user_id]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_LEAVE_STATUS', `Updated leave request ID: ${id} to ${status}`, req.user.org_id);
    res.json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateLeaveRequest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { leave_type, start_date, end_date, reason, status, relief_staff_id, user_id } = req.body;
  try {
    const start = new Date(start_date);
    const end = new Date(end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    const leaveDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24))) + 1;

    const result = await pool.query(
      'UPDATE leave_requests SET leave_type = $1, start_date = $2, end_date = $3, reason = $4, status = $5, relief_staff_id = $6, leave_days = $7, user_id = COALESCE($8, user_id) WHERE id = $9 RETURNING *',
      [leave_type, start_date, end_date, reason, status, relief_staff_id || null, leaveDays, user_id || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
    await recordAuditLog(req.user.id, 'UPDATE_LEAVE_REQUEST', `Updated leave request ID: ${id}`, req.user.org_id);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteLeaveRequest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM leave_requests WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
    await recordAuditLog(req.user.id, 'DELETE_LEAVE_REQUEST', `Deleted leave request ID: ${id}`, req.user.org_id);
    res.json({ message: 'Leave request deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// RECRUITMENT
export const getRecruitment = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(
        'SELECT r.*, r.applicant_name AS name FROM recruitment r'
      );
    } else {
      result = await pool.query(
        'SELECT r.*, r.applicant_name AS name FROM recruitment r WHERE org_id = $1',
        [orgId]
      );
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createApplicant = async (req: AuthRequest, res: Response) => {
  const {
    position, applicant_name, email, interview_date,
    phone, salary, allowances, deductions, department_id, score
  } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO recruitment (org_id, position, applicant_name, email, interview_date, phone, salary, allowances, deductions, department_id, score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        orgId, position, applicant_name, email, interview_date || null,
        phone || null, salary || 0, allowances || 0, deductions || 0, department_id || null, score || 0
      ]
    );
    await recordAuditLog(req.user.id, 'CREATE_APPLICANT', `Created applicant: ${applicant_name}`, req.user.org_id);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// STAFF ATTENDANCE
export const getStaffAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = `
      SELECT 
        sa.*,
        u.name AS staff_name,
        sa.clock_in AS check_in,
        sa.clock_out AS check_out
      FROM staff_attendance sa
      JOIN users u ON sa.user_id = u.id
      WHERE 1=1`;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND sa.org_id = $${params.length}`;
    }

    if (role === 'STAFF') {
      params.push(req.user.id);
      query += ` AND sa.user_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markStaffAttendance = async (req: AuthRequest, res: Response) => {
  const { user_id, status, clock_in, clock_out } = req.body;
  try {
    const orgId = req.user.org_id;
    
    // Fetch late_time from organization settings
    const orgSettings = await pool.query('SELECT late_time FROM organizations WHERE id = $1', [orgId]);
    const lateThreshold = orgSettings.rows[0]?.late_time || '08:00:00';
    
    const now = clock_in || new Date().toLocaleTimeString('en-GB', { hour12: false });
    
    // Determine status based on clock-in time
    let scanStatus = status;
    if (status === 'Present' && now > lateThreshold) {
        scanStatus = 'Late';
    }

    const result = await pool.query(
      'INSERT INTO staff_attendance (org_id, user_id, status, clock_in, clock_out) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, user_id, scanStatus, clock_in, clock_out]
    );
    await recordAuditLog(req.user.id, 'MARK_STAFF_ATTENDANCE', `Marked attendance for user ID: ${user_id} (${scanStatus})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const orgId = req.user.org_id;
    const { role: userRole, email: userEmail } = req.user;

    // Security check: STAFF can only update their own record
    if (userRole === 'STAFF') {
      const staffRes = await client.query('SELECT email FROM staff WHERE id = $1 AND org_id = $2', [id, orgId]);
      if (staffRes.rows.length === 0 || staffRes.rows[0].email !== userEmail) {
        return res.status(403).json({ error: 'Access denied: You can only update your own profile' });
      }
    }

    const {
      name, email, role, status, department_id, phone, reports_to,
      additional_roles, salary, allowances, deductions,
      annual_leave_limit, leave_balance, carried_over_balance,
      leave_limit_unit, date_of_birth
    } = req.body;

    // For STAFF, we restrict which fields can be updated to prevent tampering
    const isStaff = userRole === 'STAFF';
    const finalName = isStaff ? undefined : name; // Staff shouldn't change their name? Usually not.
    const finalRole = isStaff ? undefined : role;
    const finalStatus = isStaff ? undefined : status;
    const finalDept = isStaff ? undefined : department_id;
    const finalReportsTo = isStaff ? undefined : reports_to;
    const finalAddRoles = isStaff ? undefined : (additional_roles ? (Array.isArray(additional_roles) ? additional_roles : [additional_roles]) : undefined);
    const finalSalary = isStaff ? undefined : salary;
    const finalAllowances = isStaff ? undefined : allowances;
    const finalDeductions = isStaff ? undefined : deductions;
    const finalLeaveLimit = isStaff ? undefined : annual_leave_limit;
    const finalLeaveBal = isStaff ? undefined : leave_balance;
    const finalCarryBal = isStaff ? undefined : carried_over_balance;
    const finalLeaveUnit = isStaff ? undefined : leave_limit_unit;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE staff SET 
        name = COALESCE($1, name), 
        email = COALESCE($2, email), 
        role = COALESCE($3, role), 
        status = COALESCE($4, status), 
        department_id = COALESCE($5, department_id), 
        phone = COALESCE($6, phone), 
        reports_to = COALESCE($7, reports_to), 
        additional_roles = COALESCE($8, additional_roles), 
        salary = COALESCE($9, salary), 
        allowances = COALESCE($10, allowances), 
        deductions = COALESCE($11, deductions), 
        annual_leave_limit = COALESCE($12, annual_leave_limit), 
        leave_balance = COALESCE($13, leave_balance), 
        carried_over_balance = COALESCE($14, carried_over_balance), 
        leave_limit_unit = COALESCE($15, leave_limit_unit),
        date_of_birth = COALESCE($16, date_of_birth)
      WHERE id = $17 AND org_id = $18 RETURNING *`,
      [
        finalName,
        email,
        finalRole,
        finalStatus,
        finalDept,
        phone || null,
        finalReportsTo,
        finalAddRoles,
        finalSalary,
        finalAllowances,
        finalDeductions,
        finalLeaveLimit,
        finalLeaveBal,
        finalCarryBal,
        finalLeaveUnit,
        date_of_birth || null,
        id,
        orgId
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Update user account if it exists
    if (email || name || role) {
      // Get the old email to find the user record
      const oldStaffRes = await client.query('SELECT email FROM staff WHERE id = $1', [id]);
      const currentEmail = oldStaffRes.rows[0]?.email;

      if (currentEmail) {
        await client.query(
          `UPDATE users SET 
            email = COALESCE($1, email),
            name = COALESCE($2, name),
            role = COALESCE($3, role)
          WHERE email = $4 AND org_id = $5`,
          [email, name, role, currentEmail, orgId]
        );
      }
    }

    // If we are reactivating staff, we should also deactivate/void any 'Approved' exit record
    if (status === 'Active' && !isStaff) {
      await client.query(
        "UPDATE exit_management SET status = 'Inactive' WHERE staff_id = $1 AND org_id = $2",
        [id, orgId]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_STAFF', `Updated staff member ID: ${id}`, req.user.org_id);
    res.json(result.rows[0]);
  } catch (err: any) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const orgId = req.user.org_id;
    await client.query('BEGIN');

    // 1. Get staff email before deletion (for user account cleanup)
    const staffRes = await client.query('SELECT email FROM staff WHERE id = $1 AND org_id = $2', [id, orgId]);
    if (staffRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Staff member not found' });
    }
    const staffEmail = staffRes.rows[0].email;

    // 2. Clear all foreign key references to this staff member
    await client.query('UPDATE departments SET hod_id = NULL WHERE hod_id = $1', [id]);
    await client.query('UPDATE classes SET class_teacher_id = NULL WHERE class_teacher_id = $1', [id]);
    await client.query('UPDATE subjects SET teacher_id = NULL WHERE teacher_id = $1', [id]);
    await client.query('UPDATE subject_assignments SET teacher_id = NULL WHERE teacher_id = $1', [id]);
    await client.query('UPDATE timetables SET teacher_id = NULL WHERE teacher_id = $1', [id]);
    await client.query('UPDATE staff SET reports_to = NULL WHERE reports_to = $1', [id]);
    await client.query('UPDATE lesson_notes SET teacher_id = NULL WHERE teacher_id = $1', [id]);
    await client.query('UPDATE lesson_notes SET marked_by = NULL WHERE marked_by = $1', [id]);
    await client.query('UPDATE leave_requests SET relief_staff_id = NULL WHERE relief_staff_id = $1', [id]);
    await client.query('DELETE FROM teachers_on_duty WHERE teacher_id = $1', [id]);
    await client.query('DELETE FROM book_loans WHERE staff_id = $1', [id]);
    await client.query('DELETE FROM staff_performance_reviews WHERE staff_id = $1 OR reviewer_id = $1', [id]);
    await client.query('DELETE FROM exit_management WHERE staff_id = $1', [id]);

    // 3. Delete the staff record
    await client.query('DELETE FROM staff WHERE id = $1 AND org_id = $2', [id, orgId]);

    // 4. Delete the associated user account
    if (staffEmail) {
      await client.query('DELETE FROM users WHERE email = $1 AND org_id = $2', [staffEmail, orgId]);
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'DELETE_STAFF', `Deleted staff member ID: ${id} (${staffEmail})`, req.user.org_id);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updatePayroll = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { basic_salary, deductions, allowances, status } = req.body;
  try {
    const bSalary = parseFloat(basic_salary) || 0;
    const allow = parseFloat(allowances) || 0;
    const deduct = parseFloat(deductions) || 0;
    const netSalary = bSalary + allow - deduct;

    const result = await pool.query(
      'UPDATE payroll SET basic_salary = $1, deductions = $2, allowances = $3, net_salary = $4, status = $5 WHERE id = $6 RETURNING *',
      [bSalary, deduct, allow, netSalary, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payroll entry not found' });
    await recordAuditLog(req.user.id, 'UPDATE_PAYROLL', `Updated payroll entry ID: ${id} (${status})`, req.user.org_id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePayroll = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM payroll WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payroll entry not found' });
    await recordAuditLog(req.user.id, 'DELETE_PAYROLL', `Deleted payroll entry ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Payroll entry deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateApplicant = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    applicant_name, position, status, interview_date,
    score, phone, salary, allowances, deductions, department_id
  } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE recruitment SET applicant_name = $1, position = $2, status = $3, interview_date = $4, score = $5, phone = $6, salary = $7, allowances = $8, deductions = $9, department_id = $10 WHERE id = $11 AND org_id = $12 RETURNING *',
      [
        applicant_name, position, status, interview_date,
        score || 0, phone || null, salary || 0, allowances || 0, deductions || 0, department_id || null, id, orgId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Applicant not found' });
    await recordAuditLog(req.user.id, 'UPDATE_APPLICANT', `Updated applicant ID: ${id} (${status})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteApplicant = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM recruitment WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Applicant not found' });
    await recordAuditLog(req.user.id, 'DELETE_APPLICANT', `Deleted applicant ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Applicant deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const hireCandidate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { salary, allowances, deductions, department_id } = req.body;
  const client = await pool.connect();
  try {
    const orgId = req.user.org_id;
    await client.query('BEGIN');

    // 1. Get applicant info
    const applicantRes = await client.query(
      'SELECT * FROM recruitment WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );

    if (applicantRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const applicant = applicantRes.rows[0];

    // Check if staff member with this email already exists
    if (applicant.applicant_email) {
      const existingStaff = await client.query('SELECT id FROM staff WHERE LOWER(email) = $1 AND org_id = $2', [applicant.applicant_email.toLowerCase().trim(), orgId]);
      if (existingStaff.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `This candidate has already been hired or a staff member with email ${applicant.applicant_email} already exists.` });
      }
    }

    // Fetch organization defaults
    const orgRes = await client.query('SELECT default_leave_limit, default_leave_limit_unit FROM organizations WHERE id = $1', [orgId]);
    const orgDefaults = orgRes.rows[0] || { default_leave_limit: 20, default_leave_limit_unit: 'Days' };

    // 2. Create staff member
    const staffRes = await client.query(
      `INSERT INTO staff (name, email, role, status, department_id, phone, salary, allowances, deductions, annual_leave_limit, leave_balance, carried_over_balance, leave_limit_unit, org_id)
       VALUES ($1, $2, $3, 'Active', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        applicant.applicant_name,
        applicant.email,
        applicant.position,
        department_id || null,
        applicant.phone || null,
        salary || applicant.salary || 0,
        allowances || applicant.allowances || 0,
        deductions || applicant.deductions || 0,
        orgDefaults.default_leave_limit, // Organization default leave limit
        orgDefaults.default_leave_limit, // Organization default leave balance
        0,  // Default carried over
        orgDefaults.default_leave_limit_unit, // Organization default unit
        orgId
      ]
    );

    // 3. Update recruitment status
    await client.query(
      "UPDATE recruitment SET status = 'Hired' WHERE id = $1",
      [id]
    );

    // 4. Create User account if it doesn't exist globally
    if (applicant.email) {
      const normalizedEmail = applicant.email.toLowerCase().trim();
      const userCheck = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (userCheck.rows.length === 0) {
        const defaultPassword = 'zxcv123$$';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await client.query(
          'INSERT INTO users (email, password, name, role, org_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
          [normalizedEmail, hashedPassword, applicant.applicant_name, 'STAFF', orgId]
        );
      }
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'HIRE_CANDIDATE', `Hired candidate ID: ${id} as staff member`, orgId, req.ip || '');
    res.status(201).json({ staff: staffRes.rows[0], message: 'Candidate hired successfully!' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const generateOfferLetter = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT 
        r.*,
        o.name as organization_name,
        o.address as organization_address,
        o.email as organization_email,
        o.contact_number as organization_phone
      FROM recruitment r
      JOIN organizations o ON r.org_id = o.id
      WHERE r.id = $1 AND r.org_id = $2
    `, [id, orgId]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Applicant not found' });

    const data = result.rows[0];
    const letterDate = new Date().toLocaleDateString();

    const salary = parseFloat(data.salary) || 0;
    const allowances = parseFloat(data.allowances) || 0;
    const netSalary = salary + allowances;

    const letterContent = `
${data.organization_name}
${data.organization_address || ''}
${data.organization_phone || ''}
${data.organization_email || ''}

Date: ${letterDate}

To,
${data.applicant_name}
${data.email}
${data.phone || ''}

Subject: Letter of Offer - ${data.position}

Dear ${data.applicant_name},

We are pleased to offer you the position of ${data.position} at ${data.organization_name}. Your skills and experience make you an excellent fit for our team.

Your compensation details are as follows:
- Basic Salary: GH₵${salary.toLocaleString()}
- Allowances: GH₵${allowances.toLocaleString()}
- Total Gross Salary: GH₵${netSalary.toLocaleString()}

This offer is subject to the verification of your references and background check. Upon acceptance, we will provide you with a formal employment contract detailing all terms and conditions of service.

We look forward to having you join our institution and contributing to our collective success.

Sincerely,

For ${data.organization_name}


Authorized Signatory
    `.trim();

    res.json({
      letter: letterContent,
      data: {
        applicant_name: data.applicant_name,
        position: data.position,
        salary: salary,
        allowances: allowances,
        organization_name: data.organization_name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStaffAttendance = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, clock_in, clock_out } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE staff_attendance SET status = $1, clock_in = $2, clock_out = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
      [status, clock_in, clock_out, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attendance record not found' });
    await recordAuditLog(req.user.id, 'UPDATE_STAFF_ATTENDANCE', `Updated attendance record ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStaffAttendance = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM staff_attendance WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attendance record not found' });
    await recordAuditLog(req.user.id, 'DELETE_STAFF_ATTENDANCE', `Deleted attendance record ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// EXIT MANAGEMENT
export const getExitManagement = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = `
      SELECT em.*, s.name as staff_name 
      FROM exit_management em 
      JOIN staff s ON em.staff_id = s.id 
      WHERE 1=1`;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND em.org_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createExitManagement = async (req: AuthRequest, res: Response) => {
  const { staff_id, exit_date, reason, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO exit_management (org_id, staff_id, exit_date, reason, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, staff_id, exit_date, reason, status || 'Pending']
    );
    await recordAuditLog(req.user.id, 'CREATE_EXIT_RECORD', `Created exit record for staff ID: ${staff_id}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExitManagement = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { staff_id, exit_date, reason, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE exit_management SET staff_id = $1, exit_date = $2, reason = $3, status = $4 WHERE id = $5 AND org_id = $6 RETURNING *',
      [staff_id, exit_date, reason, status, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Exit record not found' });
    await recordAuditLog(req.user.id, 'UPDATE_EXIT_RECORD', `Updated exit record ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteExitManagement = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM exit_management WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Exit record not found' });
    await recordAuditLog(req.user.id, 'DELETE_EXIT_RECORD', `Deleted exit record ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Exit record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const generateExitLetter = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT 
        em.*, 
        s.name as staff_name, 
        s.role as staff_role,
        s.created_at as join_date,
        d.name as department_name,
        o.name as organization_name,
        o.address as organization_address,
        o.email as organization_email,
        o.contact_number as organization_phone
      FROM exit_management em 
      JOIN staff s ON em.staff_id = s.id 
      JOIN organizations o ON em.org_id = o.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE em.id = $1 AND em.org_id = $2
    `, [id, orgId]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Exit record not found' });

    const data = result.rows[0];
    const letterDate = new Date().toLocaleDateString();
    const exitDate = new Date(data.exit_date).toLocaleDateString();
    const joinDate = new Date(data.join_date).toLocaleDateString();

    let subjectLine = 'Relieving Letter and Experience Certificate';
    let bodyText = `This is with reference to your resignation from the services of ${data.organization_name}. We would like to inform you that your resignation has been accepted and you are relieved from your duties effective from the close of business hours on ${exitDate}.`;

    if (data.reason === 'Retirement') {
      subjectLine = 'Retirement Relieving Letter';
      bodyText = `This is with reference to your retirement from the services of ${data.organization_name}. We would like to inform you that you are relieved from your duties effective from the close of business hours on ${exitDate} due to your scheduled retirement. We wish you a peaceful and fulfilling retirement ahead.`;
    } else if (data.reason === 'Termination') {
      subjectLine = 'Service Termination Letter';
      bodyText = `This is with reference to the termination of your services with ${data.organization_name}. We would like to inform you that you are relieved from your duties effective from the close of business hours on ${exitDate}.`;
    } else if (data.reason === 'Contract Ended') {
      subjectLine = 'Contract Completion Letter';
      bodyText = `This is with reference to the completion of your contract with ${data.organization_name}. We would like to inform you that your contract has reached its term and you are relieved from your duties effective from the close of business hours on ${exitDate}.`;
    } else if (data.reason !== 'Resignation') {
      subjectLine = 'Relieving Letter';
      bodyText = `This is with reference to your exit from the services of ${data.organization_name}. We would like to inform you that you are relieved from your duties effective from the close of business hours on ${exitDate}.`;
    }

    const letterContent = `
${data.organization_name}
${data.organization_address || ''}
${data.organization_phone || ''}
${data.organization_email || ''}

Date: ${letterDate}

To,
${data.staff_name}
${data.staff_role}
${data.department_name || ''}

Subject: ${subjectLine}

Dear ${data.staff_name},

${bodyText}

You joined ${data.organization_name} on ${joinDate} and served as a ${data.staff_role} in the ${data.department_name || 'Academic'} department. During your tenure with us, we found you to be hardworking and committed to your responsibilities.

We appreciate the contributions you have made to our institution and wish you the very best in all your future endeavors.

Your full and final settlement has been processed as per the school policy.

Sincerely,

For ${data.organization_name}


Authorized Signatory
    `.trim();

    res.json({
      letter: letterContent,
      data: {
        staff_name: data.staff_name,
        staff_role: data.staff_role,
        exit_date: exitDate,
        join_date: joinDate,
        organization_name: data.organization_name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PERFORMANCE
export const getStaffPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const query = `
      SELECT 
        s.id, s.name, 
        d.name as department_name,
        AVG(ln.marks) as lesson_note_avg,
        (SELECT score FROM staff_performance_reviews WHERE staff_id = s.id ORDER BY created_at DESC LIMIT 1) as appraisal_score,
        (SELECT comments FROM staff_performance_reviews WHERE staff_id = s.id ORDER BY created_at DESC LIMIT 1) as appraisal_review,
        (SELECT created_at FROM staff_performance_reviews WHERE staff_id = s.id ORDER BY created_at DESC LIMIT 1) as last_review_date
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN lesson_notes ln ON s.id = ln.teacher_id AND ln.status = 'Approved'
      WHERE s.org_id = $1
      ${req.user.role === 'STAFF' ? " AND s.email = '" + req.user.email + "'" : ""}
      GROUP BY s.id, d.name
    `;
    const result = await pool.query(query, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPerformanceReview = async (req: AuthRequest, res: Response) => {
  const { staff_id, cycle_id, score, comments } = req.body;
  try {
    const reviewerId = req.user.staff_id || req.user.id;
    const result = await pool.query(
      'INSERT INTO staff_performance_reviews (staff_id, cycle_id, reviewer_id, score, comments) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [staff_id, cycle_id || null, reviewerId, score, comments]
    );
    await recordAuditLog(req.user.id, 'CREATE_PERFORMANCE_REVIEW', `Created performance review for staff ID: ${staff_id} (Score: ${score})`, req.user.org_id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resetLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    // Update all staff: 
    // carried_over_balance = current leave_balance
    // leave_balance = current leave_balance + annual_leave_limit
    const result = await pool.query(`
      UPDATE staff 
      SET 
        carried_over_balance = leave_balance,
        leave_balance = leave_balance + annual_leave_limit
      WHERE org_id = $1
      RETURNING *
    `, [orgId]);

    await recordAuditLog(req.user.id, 'RESET_LEAVE_BALANCES', `Reset leave balances for ${result.rowCount} staff members`, orgId, req.ip || '');
    res.json({ message: `Successfully reset balances for ${result.rowCount} staff members.`, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateParent = async (req: AuthRequest, res: Response) => {
  const { email: parentEmail } = req.params;
  const { parent_name, contact } = req.body;
  const client = await pool.connect();
  try {
    const orgId = req.user.org_id;
    await client.query('BEGIN');

    // 1. Update as primary parent
    const res1 = await client.query(
      `UPDATE students SET 
        parent_name = COALESCE($1, parent_name), 
        contact = COALESCE($2, contact) 
      WHERE parent_email = $3 AND org_id = $4`,
      [parent_name, contact, parentEmail, orgId]
    );

    // 2. Update as secondary parent
    const res2 = await client.query(
      `UPDATE students SET 
        secondary_parent_name = COALESCE($1, secondary_parent_name), 
        secondary_parent_contact = COALESCE($2, secondary_parent_contact) 
      WHERE secondary_parent_email = $3 AND org_id = $4`,
      [parent_name, contact, parentEmail, orgId]
    );

    await client.query('COMMIT');
    const total = (res1.rowCount || 0) + (res2.rowCount || 0);
    await recordAuditLog(req.user.id, 'UPDATE_PARENT', `Updated parent record: ${parentEmail}`, orgId, req.ip || '');
    res.json({ message: `Updated ${total} sibling parent entries for ${parentEmail}`, count: total });
  } catch (err: any) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};


export const getHODDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    let staffId = req.user.staff_id;
    console.log('[HOD Dashboard Trace] Starts - req.user.email:', req.user.email, 'staffId:', staffId, 'orgId:', orgId);

    // Fallback: Find staff_id by email if not in token
    if (!staffId) {
      const staffCheck = await pool.query('SELECT id FROM staff WHERE email = $1 AND org_id = $2', [req.user.email, orgId]);
      staffId = staffCheck.rows[0]?.id;
      console.log('[HOD Dashboard Trace] Fallback resolved staffId:', staffId);
    }

    if (!staffId) {
      console.log('[HOD Dashboard Trace] NO STAFF ID DETECTED. Exiting with 0.');
      return res.json({
        departmentName: 'No Staff Record Match',
        stats: { totalStaff: 0, totalStudents: 0, avgPerformance: 0, pendingTasks: 0 },
        performanceHistory: [],
        metrics: []
      });
    }

    // 1. Get Department(s) managed by this staff member
    let deptRes;
    if (req.user.role === 'SCHOOL_ADMIN') {
      // School admin sees the first department or all? For dashboard, show the first available department
      deptRes = await pool.query('SELECT id, name FROM departments WHERE org_id = $1 LIMIT 1', [orgId]);
    } else {
      deptRes = await pool.query(
        'SELECT id, name FROM departments WHERE hod_id = $1 AND org_id = $2',
        [staffId, orgId]
      );
    }
    console.log('[HOD Dashboard Trace] deptRes count:', deptRes.rows.length);

    if (deptRes.rows.length === 0) {
      console.log('[HOD Dashboard Trace] NO DEPARTMENTS ASSIGNED. Exiting with 0.');
      return res.json({
        departmentName: 'No Department Assigned',
        stats: { totalStaff: 0, totalStudents: 0, avgPerformance: 0, pendingTasks: 0 },
        performanceHistory: [],
        metrics: []
      });
    }

    const dept = deptRes.rows[0];
    const deptId = dept.id;

    // 2. Aggregate Top Bar Stats
    const staffCountRes = await pool.query('SELECT COUNT(*) FROM staff WHERE department_id = $1', [deptId]);
    const totalStaff = parseInt(staffCountRes.rows[0].count);

    const studentCountRes = await pool.query(`
      SELECT COUNT(DISTINCT s.id) 
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN subject_assignments sa ON sa.class_id = c.id
      JOIN staff st ON sa.teacher_id = st.id
      WHERE st.department_id = $1 AND s.org_id = $2
    `, [deptId, orgId]);
    const totalStudents = parseInt(studentCountRes.rows[0].count);

    const perfRes = await pool.query(`
      SELECT AVG(score) as avg_score 
      FROM staff_performance_reviews r
      JOIN staff s ON r.staff_id = s.id
      WHERE s.department_id = $1
    `, [deptId]);
    const avgPerformance = parseFloat(perfRes.rows[0].avg_score || 0).toFixed(1);

    const taskRes = await pool.query(`
      SELECT COUNT(*) 
      FROM lesson_notes n
      JOIN staff s ON n.teacher_id = s.id
      WHERE s.department_id = $1 AND n.status IN ('Draft', 'Pending Approval')
    `, [deptId]);
    const pendingTasks = parseInt(taskRes.rows[0].count);

    // 3. Staff Performance History (for Chart)
    const performanceHistoryRes = await pool.query(`
      SELECT 
        s.name, 
        COALESCE(AVG(r.score), 0) as performance,
        (SELECT COUNT(*) FROM staff_attendance a JOIN users u ON a.user_id = u.id WHERE u.email = s.email AND a.status = 'Present' AND a.date > CURRENT_DATE - INTERVAL '30 days') as attendance_count,
        (SELECT COUNT(*) FROM subject_assignments sa WHERE sa.teacher_id = s.id) as workload_count
      FROM staff s
      LEFT JOIN staff_performance_reviews r ON s.id = r.staff_id
      WHERE s.department_id = $1
      GROUP BY s.id, s.name, s.email
      LIMIT 10
    `, [deptId]);

    // 4. Department Metrics
    const metricsRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_staff,
        COUNT(DISTINCT r.staff_id) as staff_reviewed,
        COUNT(DISTINCT CASE WHEN n.status = 'Approved' THEN n.id END) as approved_notes,
        COUNT(n.id) as total_notes
      FROM staff s
      LEFT JOIN staff_performance_reviews r ON s.id = r.staff_id
      LEFT JOIN lesson_notes n ON n.teacher_id = s.id
      WHERE s.department_id = $1
    `, [deptId]);

    const m = metricsRes.rows[0];
    const metrics = [
      {
        label: 'Staff Review Selection',
        value: totalStaff > 0 ? Math.round((parseInt(m.staff_reviewed) / totalStaff) * 100) : 0,
        target: 100,
        color: '#6366f1'
      },
      {
        label: 'Lesson Note Compliance',
        value: parseInt(m.total_notes) > 0 ? Math.round((parseInt(m.approved_notes) / parseInt(m.total_notes)) * 100) : 0,
        target: 90,
        color: '#10b981'
      },
      {
        label: 'Avg Attendance',
        value: Math.min(100, Math.round(totalStaff > 0 ? (totalStudents > 0 ? 88 : 0) : 0)), // Mocking a stable ratio if no data
        target: 95,
        color: '#f59e0b'
      }
    ];

    res.json({
      departmentName: dept.name,
      stats: { totalStaff, totalStudents, avgPerformance, pendingTasks },
      performanceHistory: performanceHistoryRes.rows.map(row => ({
        name: row.name,
        performance: parseFloat(row.performance),
        attendance: Math.min(100, parseInt(row.attendance_count) * 4), // 25 days * 4 = 100%
        workload: Math.min(100, parseInt(row.workload_count) * 12) // 8 subjects * 12 = ~96%
      })),
      metrics
    });

  } catch (err: any) {
    console.error('Error fetching HOD dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getDetailedAttendanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const { org_id } = req.user;
    const { start_date, end_date } = req.query;

    const result = await pool.query(`
      SELECT 
        s.name as staff_name, 
        s.email,
        d.name as department_name,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'On Leave' THEN 1 END) as leave_days,
        COUNT(*) as total_days
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN users u ON (s.email = u.email OR s.user_id = u.id)
      JOIN staff_attendance a ON u.id = a.user_id
      WHERE s.org_id = $1 AND a.date BETWEEN $2 AND $3
      GROUP BY s.id, s.name, s.email, d.name
      ORDER BY d.name, s.name
    `, [org_id, start_date || '1970-01-01', end_date || '2100-01-01']);

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
