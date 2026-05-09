import { Request, Response } from 'express';
import pool from '../db.ts';

export const InventoryController = {
  // Suppliers
  getSuppliers: async (req: any, res: Response) => {
    try {
      const orgId = req.user?.org_id;
      const result = await pool.query('SELECT * FROM suppliers WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
  
  createSupplier: async (req: any, res: Response) => {
    try {
      const orgId = req.user?.org_id;
      const { name, contact_person, email, phone, address, status } = req.body;
      const result = await pool.query(
        `INSERT INTO suppliers (org_id, name, contact_person, email, phone, address, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [orgId, name, contact_person, email, phone, address, status || 'Active']
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateSupplier: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { name, contact_person, email, phone, address, status } = req.body;
      const result = await pool.query(
        `UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, status = $6
         WHERE id = $7 AND org_id = $8 RETURNING *`,
        [name, contact_person, email, phone, address, status, id, req.user?.org_id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteSupplier: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM suppliers WHERE id = $1 AND org_id = $2', [id, req.user?.org_id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // Inventory Items
  getInventoryItems: async (req: any, res: Response) => {
    try {
      const orgId = req.user?.org_id;
      const result = await pool.query('SELECT * FROM inventory_items WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createInventoryItem: async (req: any, res: Response) => {
    try {
      const orgId = req.user?.org_id;
      const { name, category, description, unit_price, quantity, min_stock_level } = req.body;
      const result = await pool.query(
        `INSERT INTO inventory_items (org_id, name, category, description, unit_price, quantity, min_stock_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [orgId, name, category, description, unit_price || 0, quantity || 0, min_stock_level || 5]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateInventoryItem: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { name, category, description, unit_price, min_stock_level } = req.body;
      const result = await pool.query(
        `UPDATE inventory_items SET name = $1, category = $2, description = $3, unit_price = $4, min_stock_level = $5
         WHERE id = $6 AND org_id = $7 RETURNING *`,
        [name, category, description, unit_price, min_stock_level, id, req.user?.org_id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteInventoryItem: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM inventory_items WHERE id = $1 AND org_id = $2', [id, req.user?.org_id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // Transactions (Purchase Records & Issuances)
  getTransactions: async (req: any, res: Response) => {
    try {
      const orgId = req.user?.org_id;
      const result = await pool.query(`
        SELECT t.*, i.name as item_name, s.name as supplier_name 
        FROM inventory_transactions t
        LEFT JOIN inventory_items i ON t.item_id = i.id
        LEFT JOIN suppliers s ON t.supplier_id = s.id
        WHERE t.org_id = $1 
        ORDER BY t.created_at DESC
      `, [orgId]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createTransaction: async (req: any, res: Response) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orgId = req.user?.org_id;
      const { item_id, supplier_id, type, quantity, unit_price, reference_number, notes } = req.body;
      
      const total_price = quantity * (unit_price || 0);

      const txResult = await client.query(
        `INSERT INTO inventory_transactions (org_id, item_id, supplier_id, type, quantity, unit_price, total_price, reference_number, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [orgId, item_id, supplier_id || null, type, quantity, unit_price, total_price, reference_number, notes, req.user?.id]
      );

      // Update actual inventory item stock
      if (type === 'IN') {
        await client.query('UPDATE inventory_items SET quantity = quantity + $1 WHERE id = $2 AND org_id = $3', [quantity, item_id, orgId]);
      } else if (type === 'OUT') {
        await client.query('UPDATE inventory_items SET quantity = quantity - $1 WHERE id = $2 AND org_id = $3', [quantity, item_id, orgId]);
      }

      await client.query('COMMIT');
      res.json(txResult.rows[0]);
    } catch (err: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  },

  // Assets
  getAssets: async (req: any, res: Response) => {
    try {
      const orgId = req.user?.org_id;
      const result = await pool.query(`
        SELECT a.*, s.name as assigned_to_name
        FROM assets a
        LEFT JOIN staff s ON a.assigned_to = s.id
        WHERE a.org_id = $1 
        ORDER BY a.created_at DESC
      `, [orgId]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  createAsset: async (req: any, res: Response) => {
    try {
      const orgId = req.user?.org_id;
      const { name, category, serial_number, purchase_date, purchase_price, assigned_to, location, condition, status, notes } = req.body;
      const result = await pool.query(
        `INSERT INTO assets (org_id, name, category, serial_number, purchase_date, purchase_price, assigned_to, location, condition, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [orgId, name, category, serial_number, purchase_date || null, purchase_price || null, assigned_to || null, location, condition || 'Good', status || 'Active', notes]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateAsset: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { name, category, serial_number, purchase_date, purchase_price, assigned_to, location, condition, status, notes } = req.body;
      const result = await pool.query(
        `UPDATE assets SET name = $1, category = $2, serial_number = $3, purchase_date = $4, purchase_price = $5, assigned_to = $6, location = $7, condition = $8, status = $9, notes = $10
         WHERE id = $11 AND org_id = $12 RETURNING *`,
        [name, category, serial_number, purchase_date || null, purchase_price || null, assigned_to || null, location, condition, status, notes, id, req.user?.org_id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteAsset: async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM assets WHERE id = $1 AND org_id = $2', [id, req.user?.org_id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
