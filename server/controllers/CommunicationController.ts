import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

// --- ANNOUNCEMENTS ---

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user.org_id;
    const role = req.user.role;
    const user_id = req.user.id;

    let userClassId: string | null = null;
    if (role === 'STUDENT') {
      const student = await pool.query('SELECT class_id FROM students WHERE id = $1', [user_id]);
      if (student.rows.length) userClassId = student.rows[0].class_id;
    } else if (role === 'PARENT') {
      // For parents, we use their email (from token) to find their wards
      const parentWards = await pool.query('SELECT class_id FROM students WHERE parent_email = $1', [req.user.email]);
    }


    let query = `
      SELECT a.*, u.name as sender_name, u.role as sender_role, c.name as class_name
      FROM announcements a
      LEFT JOIN users u ON a.sender_id = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.org_id = $1
      AND (a.scheduled_for IS NULL OR a.scheduled_for <= CURRENT_TIMESTAMP)
    `;
    const params: any[] = [org_id];

    if (role !== 'SCHOOL_ADMIN' && role !== 'SUPER_ADMIN') {
      if (role === 'STUDENT') {
        query += ` AND (
          a.target_audience = 'ALL' 
          OR a.target_audience = 'STUDENT'
          OR (a.target_audience = 'CLASS' AND a.class_id = $2)
        )`;
        params.push(userClassId);
      } else if (role === 'PARENT') {
        query += ` AND (
          a.target_audience = 'ALL' 
          OR a.target_audience = 'PARENT'
          OR (a.target_audience = 'CLASS' AND a.class_id IN (SELECT class_id FROM students WHERE parent_email = $${params.length + 1}))
        )`;
        params.push(req.user.email);
      } else {

        query += ` AND (a.target_audience = 'ALL' OR a.target_audience = $2)`;
        params.push(role);
      }
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);

    // Fallback names for staff sent announcements
    const finalRows = await Promise.all(result.rows.map(async (row) => {
      if (!row.sender_name && row.sender_id) {
        const staffCheck = await pool.query('SELECT name, position as role FROM staff WHERE id = $1', [row.sender_id]);
        if (staffCheck.rows.length > 0) {
          row.sender_name = staffCheck.rows[0].name;
          row.sender_role = staffCheck.rows[0].role;
        }
      }
      return row;
    }));

    res.json(finalRows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

import { SMSService } from '../services/SMSService.ts';

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, target_audience, priority, class_id, scheduled_for, send_sms } = req.body;
    const org_id = req.user.org_id;
    const sender_id = req.user.id;

    // 1. Create the announcement record
    const result = await pool.query(
      `INSERT INTO announcements (org_id, sender_id, title, content, target_audience, priority, class_id, scheduled_for) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [org_id, sender_id, title, content, target_audience || 'ALL', priority || 'Normal', class_id || null, scheduled_for || null]
    );

    const announcement = result.rows[0];

    // 2. Handle SMS if requested
    if (send_sms && !scheduled_for) {
      // Fetch recipients
      let recipientQuery = '';
      let recipientParams: any[] = [org_id];

      if (target_audience === 'STAFF') {
        recipientQuery = 'SELECT contact as phone FROM staff WHERE org_id = $1 AND contact IS NOT NULL AND contact != \'\'';
      } else if (target_audience === 'PARENT') {
        recipientQuery = 'SELECT contact as phone FROM students WHERE org_id = $1 AND contact IS NOT NULL AND contact != \'\'';
      } else if (target_audience === 'STUDENT') {
        recipientQuery = 'SELECT contact as phone FROM students WHERE org_id = $1 AND contact IS NOT NULL AND contact != \'\''; // Students usually use parent contact or their own
      } else if (target_audience === 'CLASS') {
        recipientQuery = 'SELECT contact as phone FROM students WHERE org_id = $1 AND class_id = $2 AND contact IS NOT NULL AND contact != \'\'';
        recipientParams.push(class_id);
      } else {
        // ALL: Combine Staff and Parents/Students
        recipientQuery = `
          SELECT contact as phone FROM staff WHERE org_id = $1 AND contact IS NOT NULL AND contact != ''
          UNION
          SELECT contact as phone FROM students WHERE org_id = $1 AND contact IS NOT NULL AND contact != ''
        `;
      }

      const recipients = await pool.query(recipientQuery, recipientParams);
      const phones = [...new Set(recipients.rows.map(r => r.phone))];

      // Check balance first
      const orgBalance = await pool.query('SELECT sms_balance FROM organizations WHERE id = $1', [org_id]);
      const balance = orgBalance.rows[0]?.sms_balance || 0;

      if (balance < phones.length) {
        // We still created the announcement, but we'll return a warning about SMS
        return res.status(201).json({
          ...announcement,
          sms_error: `Insufficient SMS balance. Required: ${phones.length}, Available: ${balance}. Announcement created without SMS.`
        });
      }

      // Send SMS (async)
      const smsMessage = `${title.toUpperCase()}\n${content}`;
      SMSService.sendSMSMany(org_id as string, phones as string[], smsMessage)
        .catch(err => console.error('Bulk SMS sending error:', err));
    }

    res.status(201).json(announcement);
  } catch (err: any) {
    console.error('createAnnouncement error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const org_id = req.user.org_id;

    await pool.query('DELETE FROM announcements WHERE id = $1 AND org_id = $2', [id, org_id]);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// --- MESSAGES ---

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user.org_id;
    const user_id = req.user.id;
    const staff_id = req.user.staff_id;

    const result = await pool.query(`
      SELECT m.*, 
        CASE 
          WHEN m.sender_id = $1 OR (m.sender_role = 'STAFF' AND m.sender_id = $3) THEN 'sent'
          ELSE 'received'
        END as direction
      FROM messages m
      WHERE (m.org_id = $2 OR m.org_id IS NULL OR $4 = 'PARTNER' OR $4 = 'SUPER_ADMIN')
        AND (
          m.sender_id = $1 OR (m.sender_role = 'STAFF' AND m.sender_id = $3)
          OR m.receiver_id = $1 OR (m.receiver_role = 'STAFF' AND m.receiver_id = $3)
        )
      ORDER BY m.created_at DESC
    `, [user_id, org_id, staff_id, req.user.role]);

    // Enhance with names
    const enriched = await Promise.all(result.rows.map(async (msg) => {
      // Find other person ID
      const otherId = msg.direction === 'sent' ? msg.receiver_id : msg.sender_id;
      const otherRole = msg.direction === 'sent' ? msg.receiver_role : msg.sender_role;

      let name = 'Unknown User';
      if (otherRole === 'STUDENT' || otherRole === 'PARENT') {
        const check = await pool.query('SELECT name FROM students WHERE id = $1', [otherId]);
        if (check.rows.length) name = check.rows[0].name;
      } else if (otherRole === 'STAFF') {
        const check = await pool.query('SELECT name FROM staff WHERE id = $1', [otherId]);
        if (check.rows.length) name = check.rows[0].name;
      } else if (otherRole === 'PARTNER') {
        const check = await pool.query('SELECT name FROM partners WHERE id = $1', [otherId]);
        if (check.rows.length) name = check.rows[0].name;
      } else {
        const check = await pool.query('SELECT name FROM users WHERE id = $1', [otherId]);
        if (check.rows.length) name = check.rows[0].name;
      }

      msg.other_person_name = name;
      return msg;
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiver_id, receiver_role, subject, content } = req.body;
    const org_id = req.user.org_id;
    const sender_id = req.user.id;
    const sender_role = req.user.role || 'STAFF'; // Fallback

    const result = await pool.query(
      `INSERT INTO messages (org_id, sender_id, sender_role, receiver_id, receiver_role, subject, content) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [org_id || null, sender_id, sender_role, receiver_id, receiver_role, subject || 'No Subject', content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnreadMessageCount = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user.id;
    const staff_id = req.user.staff_id;
    const org_id = req.user.org_id;

    const result = await pool.query(
      `SELECT COUNT(*)::int as count 
       FROM messages 
       WHERE org_id = $1 
         AND (receiver_id = $2 OR (receiver_role = 'STAFF' AND receiver_id = $3))
         AND is_read = FALSE`,
      [org_id, user_id, staff_id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markMessageRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE id = $1 AND receiver_id = $2 RETURNING *`,
      [id, user_id]
    );

    res.json(result.rows[0] || { message: 'Already read or not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const sendBulkSMS = async (req: AuthRequest, res: Response) => {
  try {
    const { messages } = req.body;
    const org_id = req.user.org_id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    // Check balance first
    const orgBalance = await pool.query('SELECT sms_balance FROM organizations WHERE id = $1', [org_id]);
    const balance = orgBalance.rows[0]?.sms_balance || 0;

    if (balance < messages.length) {
      return res.status(400).json({ 
        error: `Insufficient SMS balance. Required: ${messages.length}, Available: ${balance}` 
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const msg of messages) {
      try {
        const result = await SMSService.sendSMS(org_id, msg.recipient, msg.message);
        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${msg.recipient}: ${result.message}`);
        }
      } catch (err: any) {
        failed++;
        errors.push(`${msg.recipient}: ${err.message}`);
      }
    }

    res.json({ 
      success: true, 
      sent, 
      failed, 
      total: messages.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Cap errors at 10
    });
  } catch (err: any) {
    console.error('sendBulkSMS error:', err);
    res.status(500).json({ error: err.message });
  }
};

// --- FEEDBACK & GRIEVANCE ---
import { sendNativePush } from '../lib/webpush.ts';

export const getFeedbacks = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user.org_id;
    const role = req.user.role;
    const user_id = req.user.id;

    let query = `
      SELECT f.*, u.name as parent_name, u.email as parent_email, s.name as student_name
      FROM feedbacks f
      JOIN users u ON f.parent_id = u.id
      LEFT JOIN students s ON f.student_id = s.id
      WHERE f.org_id = $1
    `;
    const params: any[] = [org_id];

    if (role === 'PARENT') {
      query += ` AND f.parent_id = $2`;
      params.push(user_id);
    }

    query += ` ORDER BY f.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, description, category, student_id } = req.body;
    const org_id = req.user.org_id;
    const parent_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO feedbacks (org_id, parent_id, student_id, category, subject, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [org_id, parent_id, student_id || null, category || 'General', subject, description]
    );

    const feedback = result.rows[0];

    // Get school admins to notify them
    const admins = await pool.query(`SELECT id, fcm_token FROM users WHERE org_id = $1 AND role = 'SCHOOL_ADMIN' AND fcm_token IS NOT NULL`, [org_id]);
    for (const admin of admins.rows) {
      try {
        const sub = JSON.parse(admin.fcm_token);
        await sendNativePush(sub, 'New Feedback Received', `Category: ${category} | Subject: ${subject}`);
      } catch (e) {
        console.error('Push notification failed for admin', admin.id, e);
      }
    }

    res.status(201).json(feedback);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;
    const org_id = req.user.org_id;

    const result = await pool.query(
      `UPDATE feedbacks 
       SET status = $1, reply = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 AND org_id = $4 RETURNING *`,
      [status, reply, id, org_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const feedback = result.rows[0];

    // Notify the parent if there's an update
    if (status === 'Resolved' || reply) {
       const parent = await pool.query(`SELECT fcm_token FROM users WHERE id = $1`, [feedback.parent_id]);
       if (parent.rows[0]?.fcm_token) {
         try {
           const sub = JSON.parse(parent.rows[0].fcm_token);
           await sendNativePush(sub, 'Feedback Updated', `Your feedback "${feedback.subject}" was updated.`);
         } catch(e) {}
       }
    }

    res.json(feedback);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
