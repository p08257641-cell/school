import express from 'express';
import { Response, Request } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';

const EXCHANGE_RATES: Record<string, number> = {
  'GH₵': 1.0,
  'GHS': 1.0,
  'USD': 0.075,
  'NGN': 110.0,
  'EUR': 0.07,
  'GBP': 0.06,
  'CFA': 45.0,
  'ZAR': 1.4
};

// DEMO REQUESTS
export const requestDemo = async (req: Request, res: Response) => {
  const { school_name, contact_email } = req.body;
  if (!school_name || !contact_email) {
    return res.status(400).json({ error: 'School name and email are required.' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO organizations (name, email, status, demo_requested) VALUES ($1, $2, 'Demo Request', TRUE) RETURNING id, name, email",
      [school_name, contact_email]
    );
    res.status(201).json({ message: 'Demo request received successfully.', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


// ORGANIZATIONS
export const getOrganization = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT o.*, s.expiry_date, s.status as subscription_status
      FROM organizations o
      LEFT JOIN LATERAL (
          SELECT expiry_date, status
          FROM subscriptions
          WHERE org_id = o.id
          ORDER BY created_at DESC
          LIMIT 1
      ) s ON true
      WHERE o.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT o.*, s.expiry_date, s.status as subscription_status
        FROM organizations o
        LEFT JOIN LATERAL (
            SELECT expiry_date, status
            FROM subscriptions
            WHERE org_id = o.id
            ORDER BY created_at DESC
            LIMIT 1
        ) s ON true
      `);
    } else {
      result = await pool.query(`
        SELECT o.*, s.expiry_date, s.status as subscription_status
        FROM organizations o
        LEFT JOIN LATERAL (
            SELECT expiry_date, status
            FROM subscriptions
            WHERE org_id = o.id
            ORDER BY created_at DESC
            LIMIT 1
        ) s ON true
        WHERE o.id = $1
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrganizationByDomain = async (req: Request, res: Response) => {
  const { domain } = req.query;
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Domain parameter is required.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, logo, logo_url, background_image, plan, custom_domain, status, timezone, language 
       FROM organizations 
       WHERE LOWER(custom_domain) = LOWER($1) LIMIT 1`,
      [domain.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found for this subdomain.' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createOrganization = async (req: AuthRequest, res: Response) => {
  const { name, type, email, contact_number, address, plan, language, timezone, custom_domain, logo_url, logo, background_image, signature, default_leave_limit, default_leave_limit_unit } = req.body;
  try {
    if (custom_domain) {
      const domainRegex = /^[a-z0-9-]+$/;
      if (!domainRegex.test(custom_domain)) {
        return res.status(400).json({ error: 'Custom domain must contain only lowercase letters, numbers, and hyphens.' });
      }

      const checkResult = await pool.query(
        'SELECT id FROM organizations WHERE LOWER(custom_domain) = LOWER($1)',
        [custom_domain.trim()]
      );
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: 'Subdomain is already in use by another school. Please choose a different subdomain.' });
      }
    }

    const result = await pool.query(
      'INSERT INTO organizations (name, type, email, contact_number, address, plan, language, timezone, custom_domain, logo_url, logo, background_image, signature, default_leave_limit, default_leave_limit_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
      [name, type, email, contact_number, address, plan, language, timezone, custom_domain, logo_url, logo, background_image, signature, default_leave_limit || 20, default_leave_limit_unit || 'Days']
    );
    await recordAuditLog(req.user.id, 'CREATE_ORGANIZATION', `Created organization: ${name}`, result.rows[0].id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrganization = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { custom_domain } = req.body;

  if (custom_domain !== undefined && custom_domain !== null && custom_domain !== '') {
    const domainRegex = /^[a-z0-9-]+$/;
    if (!domainRegex.test(custom_domain)) {
      return res.status(400).json({ error: 'Custom domain must contain only lowercase letters, numbers, and hyphens.' });
    }

    try {
      const checkResult = await pool.query(
        'SELECT id FROM organizations WHERE LOWER(custom_domain) = LOWER($1) AND id <> $2',
        [custom_domain.trim(), id]
      );
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: 'Subdomain is already in use by another school. Please choose a different subdomain.' });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = [
    'name', 'type', 'status', 'plan', 'language', 'timezone', 'email',
    'contact_number', 'address', 'custom_domain', 'logo_url', 'logo', 'background_image',
    'signature', 'default_leave_limit', 'default_leave_limit_unit', 'gemini_api_key',
    'academic_year', 'current_term', 'admission_no_prefix', 'admission_no_suffix', 'admission_no_start_from', 'currency', 'attendance_total_days', 'attendance_include_weekends', 'country_code', 'term_start_date', 'term_end_date', 'sms_sender_id', 'transport_sms_enabled',
    'late_time', 'attendance_api_url', 'attendance_api_key', 'promotion_trigger_term'
  ];


  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(req.body[field]);
      paramIndex++;
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    values.push(id);
    const result = await client.query(
      `WITH updated_org AS (
         UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
       )
       SELECT o.*, s.expiry_date, s.status as subscription_status
       FROM updated_org o
       LEFT JOIN LATERAL (
           SELECT expiry_date, status
           FROM subscriptions
           WHERE org_id = o.id
           ORDER BY created_at DESC
           LIMIT 1
       ) s ON true`,
      values
    );

    // Sync gemini_api_key to gemini_api_keys table for redundancy and AI module compatibility
    if (req.body.gemini_api_key !== undefined) {
      await client.query(
        `INSERT INTO gemini_api_keys (org_id, api_key) 
         VALUES ($1, $2)
         ON CONFLICT (org_id) 
         DO UPDATE SET api_key = EXCLUDED.api_key`,
        [id, req.body.gemini_api_key]
      );
    }

    if (req.body.plan) {
      await client.query(
        "UPDATE subscriptions SET plan = $1 WHERE org_id = $2 AND status = 'Active'",
        [req.body.plan, id]
      );
    }

    if (req.body.status === 'Inactive') {
      await client.query(
        "UPDATE subscriptions SET status = 'Expired' WHERE org_id = $1 AND status = 'Active'",
        [id]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_ORGANIZATION', `Updated organization ID: ${id}`, id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
export const deleteOrganization = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_ORGANIZATION', `Deleted organization ID: ${id}`, id, req.ip || '');
    res.json({ message: 'Organization deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.currency 
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
      `);
    } else {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.currency 
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
        WHERE s.org_id = $1
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
    } else if (role === 'HOD') {
      // HOD sees logs for staff in their department
      result = await pool.query(`
        SELECT al.* 
        FROM audit_logs al
        JOIN staff s ON al.user_id = s.user_id
        WHERE s.department_id = (SELECT department_id FROM staff WHERE user_id = $1)
        ORDER BY al.created_at DESC 
        LIMIT 150
      `, [req.user.id]);
    } else {
      // School Admin sees logs for their organization
      result = await pool.query(`
        SELECT al.* 
        FROM audit_logs al
        WHERE al.org_id = $1
        ORDER BY al.created_at DESC 
        LIMIT 150
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getModules = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM modules');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateModule = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE modules SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    await recordAuditLog(req.user.id, 'UPDATE_MODULE', `Updated module ID: ${id} to ${status}`, req.user.org_id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM modules WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_MODULE', `Deleted module ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Module deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// USERS (Platform-wide or Organization-wide)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.created_at, o.name as org_name 
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
    `;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` WHERE u.org_id = $1`;
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PLANS
export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM plan_templates ORDER BY price ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
  const { name, price, period, description, modules, is_popular, commission_amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO plan_templates (name, price, period, description, modules, is_popular, commission_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, price, period, description, JSON.stringify(modules), is_popular, commission_amount || 0]
    );
    await recordAuditLog(req.user.id, 'CREATE_PLAN', `Created plan template: ${name}`, req.user.org_id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, price, period, description, modules, is_popular, commission_amount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE plan_templates 
       SET name = $1, price = $2, period = $3, description = $4, modules = $5, is_popular = $6, commission_amount = $7 
       WHERE id = $8 RETURNING *`,
      [name, price, period, description, JSON.stringify(modules), is_popular, commission_amount || 0, id]
    );
    await recordAuditLog(req.user.id, 'UPDATE_PLAN', `Updated plan template ID: ${id}`, req.user.org_id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM plan_templates WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_PLAN', `Deleted plan template ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Plan deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSubscription = async (req: AuthRequest, res: Response) => {
  const { org_id, plan_name, status, expiry_date, amount, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create subscription record
    const subResult = await client.query(
      'INSERT INTO subscriptions (org_id, plan, status, expiry_date, amount, payment_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [org_id, plan_name, status, expiry_date, amount, payment_method]
    );

    // 2. Update organization's current plan
    await client.query(
      'UPDATE organizations SET plan = $1 WHERE id = $2',
      [plan_name, org_id]
    );

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_SUBSCRIPTION', `Created subscription for org ID: ${org_id} (Plan: ${plan_name})`, req.user.org_id, req.ip || '');
    res.status(201).json(subResult.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateSubscription = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { plan_name, status, expiry_date, amount, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update subscription
    const subResult = await client.query(
      `UPDATE subscriptions 
       SET plan = $1, status = $2, expiry_date = $3, amount = $4, payment_method = $5 
       WHERE id = $6 RETURNING *`,
      [plan_name, status, expiry_date, amount, payment_method, id]
    );

    // 2. Sync with organization if status is Active
    if (subResult.rows[0] && status === 'Active') {
      await client.query(
        'UPDATE organizations SET plan = $1 WHERE id = $2',
        [plan_name, subResult.rows[0].org_id]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_SUBSCRIPTION', `Updated subscription ID: ${id} (Org ID: ${subResult.rows[0]?.org_id})`, req.user.org_id, req.ip || '');
    res.json(subResult.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteSubscription = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM subscriptions WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_SUBSCRIPTION', `Deleted subscription ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Subscription deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.logo_url, o.address, o.contact_number
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
        WHERE s.status = 'Active' OR s.status = 'Completed'
        ORDER BY s.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.logo_url, o.address, o.contact_number
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
        WHERE s.org_id = $1 AND (s.status = 'Active' OR s.status = 'Completed')
        ORDER BY s.created_at DESC
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_USER', `Deleted user account ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getGeminiKeys = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('SELECT * FROM gemini_api_keys WHERE org_id = $1', [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveGeminiKey = async (req: AuthRequest, res: Response) => {
  const { api_key } = req.body;
  const orgId = req.user.org_id;
  try {
    const result = await pool.query(
      `INSERT INTO gemini_api_keys (org_id, api_key) 
       VALUES ($1, $2)
       ON CONFLICT (org_id) 
       DO UPDATE SET api_key = EXCLUDED.api_key
       RETURNING *`,
      [orgId, api_key]
    );
    await recordAuditLog(req.user.id, 'SAVE_GEMINI_KEY', `Saved AI API key for org ID: ${orgId}`, orgId, req.ip || '');
    res.status(200).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyPaystackPayment = async (req: AuthRequest, res: Response) => {
  const { reference, planId } = req.body;
  const orgId = req.user.org_id;
  const userId = req.user.id;

  if (!reference) {
    return res.status(400).json({ error: 'No transaction reference provided' });
  }

  const client = await pool.connect();
  try {
    // 1. Verify with Paystack API
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ error: 'Paystack verification failed', details: data.message });
    }

    const paymentData = data.data;
    const paidAmount = paymentData.amount / 100; // Paystack sends in pesewas/subunits

    // 2. Begin Database Transaction
    await client.query('BEGIN');

    // Get plan details 
    const planResult = await client.query('SELECT * FROM plan_templates WHERE id = $1', [planId]);
    if (planResult.rows.length === 0) {
      throw new Error('Plan template not found');
    }
    const plan = planResult.rows[0];

    // Calculate new expiry date
    const now = new Date();
    let expiry = new Date();
    if (plan.period === 'monthly') {
      expiry.setMonth(now.getMonth() + 1);
    } else if (plan.period === 'yearly') {
      expiry.setFullYear(now.getFullYear() + 1);
    } else {
      expiry.setMonth(now.getMonth() + 1); // Default to 1 month
    }

    // 3. Create/Update subscription
    const subResult = await client.query(
      `INSERT INTO subscriptions (org_id, plan, status, expiry_date, amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, plan.name, 'Active', expiry.toISOString(), paidAmount, 'Paystack']
    );

    // 4. Update organization's current plan
    await client.query(
      'UPDATE organizations SET plan = $1 WHERE id = $2',
      [plan.name, orgId]
    );

    await client.query('COMMIT');

    await recordAuditLog(userId, 'PAYSTACK_RENEWAL', `Paystack subscription renewal successful. Ref: ${reference}`, orgId, req.ip || '');

    res.json({
      success: true,
      message: 'Subscription renewed successfully!',
      subscription: subResult.rows[0]
    });

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Paystack Verification Error]:', err);
    res.status(500).json({ error: 'Failed to verify payment and update subscription', details: err.message });
  } finally {
    client.release();
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { password: rawPassword } = req.body;

  const password = rawPassword || 'zxcv123$$';

  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await recordAuditLog(req.user.id, 'RESET_PASSWORD', `Reset password for user: ${result.rows[0].email}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Password reset successfully.', user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSMSSettings = async (req: AuthRequest, res: Response) => {
  try {
    const configRes = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'sms_gateway_config'");
    const balanceRes = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'platform_sms_balance'");
    
    res.json({
      config: configRes.rows[0]?.setting_value || {},
      platform_balance: parseInt(balanceRes.rows[0]?.setting_value || '0')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const updateSMSSettings = async (req: AuthRequest, res: Response) => {
  const { custom_url, api_key, sender_id } = req.body;
  try {
    const config = JSON.stringify({ custom_url, api_key, sender_id });
    await pool.query("UPDATE system_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'sms_gateway_config'", [config]);
    await recordAuditLog(req.user.id, 'UPDATE_SMS_SETTINGS', `Updated global SMS API settings`, req.user.org_id, req.ip || '');
    res.json({ message: 'SMS settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const topUpPlatformSMS = async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  try {
    const result = await pool.query(
      "UPDATE system_settings SET setting_value = (COALESCE(setting_value::text, '0')::int + $1)::text::jsonb, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'platform_sms_balance' RETURNING setting_value",
      [amount]
    );
    await recordAuditLog(req.user.id, 'PLATFORM_SMS_TOPUP', `Topped up platform SMS pool by ${amount} units`, req.user.org_id, req.ip || '');
    res.json({ message: 'Platform SMS pool topped up', new_balance: parseInt(result.rows[0].setting_value) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const distributeSMS = async (req: AuthRequest, res: Response) => {
  const { org_id, amount, price } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check platform balance
    const platformRes = await client.query("SELECT setting_value FROM system_settings WHERE setting_key = 'platform_sms_balance'");
    const platformBalance = parseInt(platformRes.rows[0]?.setting_value || '0');

    if (platformBalance < amount) {
      throw new Error(`Insufficient platform SMS balance. Available: ${platformBalance}`);
    }

    // 2. Get current organization balance
    const orgRes = await client.query('SELECT sms_balance FROM organizations WHERE id = $1', [org_id]);
    if (orgRes.rows.length === 0) throw new Error('Organization not found');

    const prevBalance = orgRes.rows[0].sms_balance || 0;
    const newBalance = prevBalance + amount;

    // 3. Update organization balance and price
    await client.query(
      'UPDATE organizations SET sms_balance = $1, sms_unit_price = $2 WHERE id = $3',
      [newBalance, price, org_id]
    );

    // 4. Deduct from platform balance
    await client.query(
      "UPDATE system_settings SET setting_value = (setting_value::text::int - $1)::text::jsonb, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'platform_sms_balance'",
      [amount]
    );

    // 5. Record transaction
    await client.query(
      'INSERT INTO sms_transactions (org_id, type, amount, previous_balance, new_balance, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [org_id, 'Distribution', amount, prevBalance, newBalance, `Superadmin distributed ${amount} SMS credits`]
    );

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'SMS_DISTRIBUTION', `Distributed ${amount} SMS to org ${org_id}`, req.user.org_id, req.ip || '');

    res.json({ message: 'SMS distributed successfully', new_balance: newBalance });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};


// SMS PURCHASE VIA PAYSTACK
export const verifySMSPurchase = async (req: AuthRequest, res: Response) => {
  const { reference } = req.body;
  const orgId = req.user.org_id;
  const userId = req.user.id;

  if (!reference) {
    return res.status(400).json({ error: 'No transaction reference provided' });
  }

  const client = await pool.connect();
  try {
    // 1. Verify with Paystack API
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ error: 'Paystack verification failed', details: data.message });
    }

    const paymentData = data.data;
    const paidAmount = paymentData.amount / 100; // Paystack sends in pesewas/subunits

    // 2. Begin Database Transaction
    await client.query('BEGIN');

    // 3. Get org's current SMS balance and unit price
    const orgRes = await client.query('SELECT sms_balance, sms_unit_price FROM organizations WHERE id = $1', [orgId]);
    if (orgRes.rows.length === 0) throw new Error('Organization not found');

    const prevBalance = orgRes.rows[0].sms_balance || 0;
    const unitPrice = parseFloat(orgRes.rows[0].sms_unit_price) || 0;

    if (unitPrice <= 0) {
      throw new Error('SMS unit price not configured. Please contact your administrator.');
    }

    const currency = paymentData.currency || 'GHS';
    const rate = EXCHANGE_RATES[currency] || 1.0;
    const paidAmountGHS = paidAmount / rate;

    const smsUnits = Math.floor(paidAmountGHS / unitPrice);
    if (smsUnits <= 0) {
      throw new Error('Payment amount is too small to purchase any SMS units.');
    }

    // 4. Check platform balance
    const platformRes = await client.query("SELECT setting_value FROM system_settings WHERE setting_key = 'platform_sms_balance'");
    const platformBalance = parseInt(platformRes.rows[0]?.setting_value || '0');

    if (platformBalance < smsUnits) {
      throw new Error(`Insufficient platform SMS pool. Please contact system administrator.`);
    }

    const newBalance = prevBalance + smsUnits;

    // 5. Credit SMS balance
    await client.query('UPDATE organizations SET sms_balance = $1 WHERE id = $2', [newBalance, orgId]);

    // 6. Deduct from platform balance
    await client.query(
      "UPDATE system_settings SET setting_value = (setting_value::text::int - $1)::text::jsonb, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'platform_sms_balance'",
      [smsUnits]
    );

    // 7. Record transaction
    await client.query(
      'INSERT INTO sms_transactions (org_id, type, amount, previous_balance, new_balance, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [orgId, 'Purchase', smsUnits, prevBalance, newBalance, `Purchased ${smsUnits} SMS units via Paystack. Ref: ${reference}. Paid: ${paidAmount}`]
    );

    await client.query('COMMIT');
    await recordAuditLog(userId, 'SMS_PURCHASE', `Purchased ${smsUnits} SMS units via Paystack. Ref: ${reference}`, orgId, req.ip || '');

    res.json({
      success: true,
      message: `Successfully purchased ${smsUnits} SMS units!`,
      sms_units: smsUnits,
      new_balance: newBalance,
      amount_paid: paidAmount
    });

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[SMS Purchase Verification Error]:', err);
    res.status(500).json({ error: 'Failed to verify SMS purchase', details: err.message });
  } finally {
    client.release();
  }
};


// SMS TRANSACTION HISTORY
export const getSMSTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;

    let query = 'SELECT * FROM sms_transactions';
    let params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` WHERE org_id = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// BIRTHDAY CRON JOB
import { SMSService } from '../services/SMSService.ts';

export const checkBirthdays = async (req: Request, res: Response) => {
  // Security check for Render Cron Job
  const cronSecret = process.env.CRON_SECRET_KEY;
  const clientSecret = req.headers['x-cron-auth'];

  if (cronSecret && clientSecret !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // JS months are 0-indexed

    // 1. Find all students and staff celebrating birthdays today
    const birthdayQuery = `
      SELECT id, name, contact as phone, org_id, 'student' as type FROM students 
      WHERE EXTRACT(DAY FROM date_of_birth) = $1 AND EXTRACT(MONTH FROM date_of_birth) = $2
      UNION ALL
      SELECT id, name, phone, org_id, 'staff' as type FROM staff 
      WHERE EXTRACT(DAY FROM date_of_birth) = $1 AND EXTRACT(MONTH FROM date_of_birth) = $2
    `;

    const birthdayPeople = await pool.query(birthdayQuery, [day, month]);

    if (birthdayPeople.rows.length === 0) {
      return res.json({ message: 'No birthdays today' });
    }

    const results: any[] = [];

    // 2. Process each birthday
    for (const person of birthdayPeople.rows) {
      if (!person.phone) continue;

      try {
        // Fetch org name for the message
        const orgRes = await pool.query("SELECT name FROM organizations WHERE id = $1", [person.org_id]);
        const schoolName = orgRes.rows[0]?.name || 'Your School';

        const message = `Happy Birthday ${person.name}! 🎂 We wish you a wonderful day filled with joy and success. From all of us at ${schoolName}.`;
        
        // Use the SMSService to send (handles balance and gateway)
        const smsResult = await SMSService.sendSMS(person.org_id, person.phone, message);
        
        results.push({
          name: person.name,
          org_id: person.org_id,
          status: smsResult.success ? 'SENT' : 'FAILED',
          error: smsResult.success ? null : smsResult.message
        });
      } catch (err: any) {
        results.push({
          name: person.name,
          org_id: person.org_id,
          status: 'ERROR',
          error: err.message
        });
      }
    }

    res.json({
      processed: birthdayPeople.rows.length,
      details: results
    });

  } catch (err: any) {
    console.error('[CRON] Birthday check failed:', err);
    res.status(500).json({ error: err.message });
  }
};

