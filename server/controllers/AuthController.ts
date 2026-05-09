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

export const saveFCMToken = async (req: any, res: express.Response) => {
  const { fcm_token } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!fcm_token) {
    return res.status(400).json({ error: 'FCM token is required.' });
  }

  try {
    const userRes = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    
    if (userRes.rows.length > 0) {
      await pool.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcm_token, userId]);
    } else {
      if (role === 'PARENT') {
        // Find parent email to sync token across all wards
        const parentRes = await pool.query('SELECT parent_email FROM students WHERE id = $1', [userId]);
        const parentEmail = parentRes.rows[0]?.parent_email;
        
        if (parentEmail) {
          await pool.query('UPDATE students SET parent_fcm_token = $1 WHERE parent_email = $2', [fcm_token, parentEmail]);
        } else {
          await pool.query('UPDATE students SET parent_fcm_token = $1 WHERE id = $2', [fcm_token, userId]);
        }
      } else {
        await pool.query('UPDATE students SET fcm_token = $1 WHERE id = $2', [fcm_token, userId]);
      }
    }

    res.json({ message: 'FCM token saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testPush = async (req: any, res: express.Response) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let token = null;
    if (role === 'PARENT' || role === 'STUDENT') {
      const result = await pool.query(`SELECT ${role === 'PARENT' ? 'parent_fcm_token' : 'fcm_token'} as token FROM students WHERE id = $1`, [userId]);
      token = result.rows[0]?.token;
    } else {
      const result = await pool.query('SELECT fcm_token as token FROM users WHERE id = $1', [userId]);
      token = result.rows[0]?.token;
    }

    if (!token) return res.status(404).json({ error: 'No FCM token found for your account. Please enable notifications first.' });

    const { sendPushNotification } = await import('../lib/firebase.ts');
    await sendPushNotification(token, 'Test Connection', 'Your device is successfully linked for school alerts! 🎉');
    
    res.json({ message: 'Test notification sent!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
