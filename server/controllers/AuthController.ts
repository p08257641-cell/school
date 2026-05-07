import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.ts';
import { recordAuditLog } from '../lib/audit.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export const login = async (req: express.Request, res: express.Response) => {
  const { email: identifier, password } = req.body;

  try {
    // Check users table (with staff phone link)
    let result = await pool.query(`
      SELECT u.*, s.additional_roles 
      FROM users u 
      LEFT JOIN staff s ON u.email = s.email 
      WHERE u.email = $1 OR u.email = (SELECT email FROM staff WHERE phone = $1 LIMIT 1)
    `, [identifier]);
    
    let user = result.rows[0];
    let role = user?.role;
    let additionalRoles = user?.additional_roles || [];

    if (!user) {
      // Check students table (Student Login - by email or admission no)
      result = await pool.query('SELECT * FROM students WHERE email = $1 OR admission_no = $1', [identifier]);
      user = result.rows[0];
      if (user) {
        role = 'STUDENT';
      } else {
        // Check for Parent login in students table (by email or contact number)
        result = await pool.query('SELECT * FROM students WHERE parent_email = $1 OR contact = $1 OR secondary_parent_contact = $1 LIMIT 1', [identifier]);
        user = result.rows[0];
        if (user) {
          role = 'PARENT';
          // Use parent_password for comparison
          user.password = user.parent_password;
          // Set email to parent_email (fallback to contact) for frontend ward filtering
          user.email = user.parent_email || user.contact;
        }
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Password not set for this account' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Combine role and additionalRoles into a unique roles array
    const roles = Array.from(new Set([role, ...additionalRoles])).filter(Boolean);

    // Fetch staff_id if user is a staff member
    let staffId = null;
    const staffRes = await pool.query('SELECT id FROM staff WHERE email = $1 AND org_id = $2', [user.email, user.org_id]);
    if (staffRes.rows.length > 0) {
      staffId = staffRes.rows[0].id;
    }

    const token = jwt.sign(
      { id: user.id, role: role, roles: roles, org_id: user.org_id, email: user.email, staff_id: staffId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Record Audit Log for login
    await recordAuditLog(user.id, 'LOGIN', `Logged in as ${user.email} (Role: ${role})`, user.org_id, req.ip || '');

    res.json({
      token,
      user: {
        id: user.id,
        role: role,
        roles: roles,
        name: user.name,
        email: user.email,
        org_id: user.org_id
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req: express.Request, res: express.Response) => {
  const { email, password, name, role, org_id } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role, org_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, org_id',
      [email, hashedPassword, name, role, org_id]
    );

    const newUser = result.rows[0];
    await recordAuditLog(newUser.id, 'REGISTER', `New user registered: ${email} (Role: ${role})`, org_id, req.ip || '');

    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
