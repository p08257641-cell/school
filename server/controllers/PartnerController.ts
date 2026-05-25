import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

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

const convertFromGHS = (amount: number, targetCurrency: string) => {
  const rate = EXCHANGE_RATES[targetCurrency] || 1.0;
  return {
    amount: amount * rate,
    rate: rate
  };
};

export const register = async (req: express.Request, res: express.Response) => {
  const { name, email, password, contact_number, company_name, registration_number } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a simple 6-character referral code
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await pool.query(
      'INSERT INTO partners (name, email, password, contact_number, company_name, registration_number, referral_code, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, referral_code, company_name, registration_number, status',
      [name, email, hashedPassword, contact_number, company_name, registration_number, referralCode, 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.constraint === 'partners_email_key') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM partners WHERE email = $1', [email]);
    const partner = result.rows[0];

    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Reject login if partner hasn't been approved yet
    if (partner.status && partner.status !== 'Active') {
      return res.status(403).json({ message: 'Your partner account is pending approval. Please contact the administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: partner.id, role: 'PARTNER', email: partner.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: partner.id,
        role: 'PARTNER',
        name: partner.name,
        email: partner.email,
        company_name: partner.company_name,
        registration_number: partner.registration_number,
        referral_code: partner.referral_code,
        total_earnings: partner.total_earnings,
        currency: partner.currency || 'GH₵'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = req.user.id;

    const partnerResult = await pool.query('SELECT id, name, email, referral_code, total_earnings, currency FROM partners WHERE id = $1', [partnerId]);
    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const schoolsResult = await pool.query(
      'SELECT id, name, type, status, plan, email, contact_number, address, custom_domain, language, timezone, created_at FROM organizations WHERE referred_by_partner_id = $1',
      [partnerId]
    );

    const partner = partnerResult.rows[0];
    const conversion = convertFromGHS(parseFloat(partner.total_earnings || 0), partner.currency || 'GH₵');

    const saResult = await pool.query("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1");
    const supportId = saResult.rows[0]?.id || null;

    res.json({
      partner: {
        ...partner,
        converted_total_earnings: conversion.amount,
        exchange_rate: conversion.rate
      },
      schools: schoolsResult.rows,
      support_id: supportId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSchool = async (req: AuthRequest, res: Response) => {
  const { name, type, email, contact_number, admin_email, admin_password, plan, demo_requested, address, custom_domain, logo, signature, language, timezone } = req.body;
  const partnerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Organization with Pending status and extended fields
    const orgResult = await client.query(
      `INSERT INTO organizations (name, type, email, contact_number, referred_by_partner_id, plan, status, demo_requested, address, custom_domain, logo, signature, language, timezone) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [name, type, email, contact_number, partnerId, plan || 'Free', 'Pending', demo_requested || false, address || '', custom_domain || '', logo || '', signature || '', language || 'en', timezone || 'GMT']
    );
    const newOrg = orgResult.rows[0];

    // 2. Create Default Admin User
    const fallbackAdminEmail = admin_email || email;
    const fallbackPassword = admin_password || 'zxcv123$$';

    if (!fallbackAdminEmail) {
      throw new Error('An administrator email is required to create a school.');
    }

    const hashedPassword = await bcrypt.hash(fallbackPassword, 10);
    await client.query(
      'INSERT INTO users (email, password, name, role, org_id) VALUES ($1, $2, $3, $4, $5)',
      [fallbackAdminEmail, hashedPassword, 'School Admin', 'SCHOOL_ADMIN', newOrg.id]
    );

    await client.query('COMMIT');
    res.status(201).json(newOrg);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const approveReferral = async (req: AuthRequest, res: Response) => {
  const { org_id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orgResult = await client.query(
      'SELECT referred_by_partner_id, status FROM organizations WHERE id = $1',
      [org_id]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = orgResult.rows[0];
    if (org.status !== 'Pending') {
      return res.status(400).json({ error: 'Organization is not in pending status' });
    }

    await client.query(
      'UPDATE organizations SET status = $1 WHERE id = $2',
      ['Active', org_id]
    );

    if (org.referred_by_partner_id) {
      // Fetch commission from the plan template
      const planResult = await client.query(
        'SELECT commission_amount FROM plan_templates WHERE name = $1',
        [org.plan]
      );

      const commission = planResult.rows[0]?.commission_amount || 0;

      await client.query(
        'UPDATE partners SET total_earnings = total_earnings + $1 WHERE id = $2',
        [commission, org.referred_by_partner_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Referral approved and organization activated' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ===== SUPER ADMIN PARTNER MANAGEMENT =====

export const getAllPartners = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, contact_number, company_name, registration_number, referral_code, total_earnings, status, created_at, payout_type, bank_name, account_number, account_name, currency FROM partners ORDER BY created_at DESC'
    );
    const partners = result.rows.map(partner => {
      const conversion = convertFromGHS(parseFloat(partner.total_earnings || 0), partner.currency || 'GH₵');
      return {
        ...partner,
        converted_total_earnings: conversion.amount,
        exchange_rate: conversion.rate
      };
    });
    res.json(partners);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPartner = async (req: AuthRequest, res: Response) => {
  const { name, email, password, contact_number, company_name, registration_number, status, currency } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password || 'zxcv123$$', 10);
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await pool.query(
      'INSERT INTO partners (name, email, password, contact_number, company_name, registration_number, referral_code, status, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email, contact_number, company_name, registration_number, referral_code, total_earnings, status, created_at, payout_type, bank_name, account_number, account_name, currency',
      [name, email, hashedPassword, contact_number || '', company_name || '', registration_number || '', referralCode, status || 'Active', currency || 'GH₵']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.constraint === 'partners_email_key') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updatePartner = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, contact_number, company_name, registration_number, status, currency } = req.body;
  try {
    const result = await pool.query(
      'UPDATE partners SET name = COALESCE($1, name), email = COALESCE($2, email), contact_number = COALESCE($3, contact_number), company_name = COALESCE($4, company_name), registration_number = COALESCE($5, registration_number), status = COALESCE($6, status), currency = COALESCE($7, currency) WHERE id = $8 RETURNING id, name, email, contact_number, company_name, registration_number, referral_code, total_earnings, status, created_at, payout_type, bank_name, account_number, account_name, currency',
      [name, email, contact_number, company_name, registration_number, status, currency, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePartner = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM partners WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json({ message: 'Partner deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const approvePartner = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE partners SET status = 'Active' WHERE id = $1 RETURNING id, name, email, status, payout_type, bank_name, account_number, account_name, currency",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPartnerPassword = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const hashedPassword = await bcrypt.hash('zxcv123$$', 10);
    const result = await pool.query(
      'UPDATE partners SET password = $1 WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json({ message: 'Password reset to default (zxcv123$$)', partner: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getBanks = async (req: AuthRequest, res: Response) => {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const response = await fetch('https://api.paystack.co/bank?country=ghana', {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    const data = await response.json();
    const allBanks = data.data || [];

    // Deduplicate by name, preferring GHS where possible
    const uniqueBanks = allBanks.reduce((acc: any[], current: any) => {
      const existing = acc.find(b => b.name === current.name);
      if (!existing) {
        acc.push(current);
      } else if (current.currency === 'GHS') {
        // If we find a version of the same bank with GHS currency, use its code
        const idx = acc.findIndex(b => b.name === current.name);
        acc[idx] = current;
      }
      return acc;
    }, []);

    res.json(uniqueBanks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resolveAccount = async (req: AuthRequest, res: Response) => {
  const { account_number, bank_code } = req.query;
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    const data = await response.json();
    if (!data.status) {
      return res.status(400).json({ error: data.message });
    }
    res.json(data.data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const updatePayoutSettings = async (req: AuthRequest, res: Response) => {
  const { payout_type, bank_name, bank_code, account_number, account_name, currency } = req.body;
  const partnerId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE partners 
       SET payout_type = $1, bank_name = $2, bank_code = $3, account_number = $4, account_name = $5, currency = $6
       WHERE id = $7 RETURNING *`,
      [payout_type, bank_name, bank_code, account_number, account_name, currency || 'GH₵', partnerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({ message: 'Payout settings updated successfully', partner: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPayoutSettings = async (req: AuthRequest, res: Response) => {
  const partnerId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT payout_type, bank_name, bank_code, account_number, account_name, currency FROM partners WHERE id = $1',
      [partnerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ===== PARTNER REWARDS (BADGES & CERTIFICATES) =====

export const awardReward = async (req: AuthRequest, res: Response) => {
  const { partner_id } = req.params;
  const { type, title, description, criteria } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO partner_rewards (partner_id, type, title, description, criteria) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [partner_id, type, title, description, criteria]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPartnerRewards = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // partner id
  try {
    const result = await pool.query(
      'SELECT * FROM partner_rewards WHERE partner_id = $1 ORDER BY issued_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteReward = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // reward id
  try {
    const result = await pool.query('DELETE FROM partner_rewards WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reward not found' });
    res.json({ message: 'Reward revoked successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
