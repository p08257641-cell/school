import express from 'express';
import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';
import SMSService from '../services/SMSService.ts';

// INVENTORY
export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM inventory');
    } else {
      result = await pool.query('SELECT * FROM inventory WHERE org_id = $1', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createInventoryItem = async (req: AuthRequest, res: Response) => {
  const { item_name, quantity, price, category } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO inventory (org_id, item_name, quantity, price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, item_name, quantity, price || 0, category]
    );
    await recordAuditLog(req.user.id, 'CREATE_INVENTORY_ITEM', `Created inventory item: ${item_name}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { item_name, quantity, price, category } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE inventory SET item_name = $1, quantity = $2, price = $3, category = $4 WHERE id = $5 AND org_id = $6 RETURNING *',
      [item_name, quantity, price || 0, category, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    await recordAuditLog(req.user.id, 'UPDATE_INVENTORY_ITEM', `Updated inventory item ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    await recordAuditLog(req.user.id, 'DELETE_INVENTORY_ITEM', `Deleted inventory item ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// UNIFORM MANAGEMENT
export const getUniforms = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT um.*, s.name as student_name 
        FROM uniform_management um 
        LEFT JOIN students s ON um.student_id = s.id
      `);
    } else {
      result = await pool.query(`
        SELECT um.*, s.name as student_name 
        FROM uniform_management um 
        LEFT JOIN students s ON um.student_id = s.id 
        WHERE um.org_id = $1
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createUniformItem = async (req: AuthRequest, res: Response) => {
  const { item_name, size, stock, price, student_id, add_to_fees } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;
    
    const result = await client.query(
      'INSERT INTO uniform_management (org_id, item_name, size, stock, price, student_id, add_to_fees) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [orgId, item_name, size, stock, price, student_id || null, add_to_fees || false]
    );

    if (add_to_fees && student_id && price > 0) {
      const description = `Uniform Purchase: ${item_name} (Size: ${size})`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, student_id, price, description]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_UNIFORM_ITEM', `Purchased uniform item: ${item_name} (Size: ${size})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateUniformItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { item_name, size, stock, price, student_id, add_to_fees } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE uniform_management SET item_name = $1, size = $2, stock = $3, price = $4, student_id = $5, add_to_fees = $6 WHERE id = $7 AND org_id = $8 RETURNING *',
      [item_name, size, stock, price, student_id || null, add_to_fees || false, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Uniform item not found' });
    await recordAuditLog(req.user.id, 'UPDATE_UNIFORM_ITEM', `Updated uniform item ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUniformItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM uniform_management WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Uniform item not found' });
    await recordAuditLog(req.user.id, 'DELETE_UNIFORM_ITEM', `Deleted uniform item ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Uniform item deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// INVENTORY SALES
export const getInventorySales = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT isale.*, s.name as student_name 
        FROM inventory_sales isale 
        LEFT JOIN students s ON isale.student_id = s.id
      `);
    } else {
      result = await pool.query(`
        SELECT isale.*, s.name as student_name 
        FROM inventory_sales isale 
        LEFT JOIN students s ON isale.student_id = s.id 
        WHERE isale.org_id = $1
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createInventorySale = async (req: AuthRequest, res: Response) => {
  const { item_id, item_name, quantity, total_price, buyer_name, student_id, add_to_fees } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. If item_id is provided, check and decrement stock in either uniform_management or inventory table
    if (item_id) {
      // First check uniform_management
      let stockCheck = await client.query(
        'SELECT stock, item_name FROM uniform_management WHERE id = $1 AND org_id = $2 FOR UPDATE',
        [item_id, orgId]
      );
      
      let tableName = 'uniform_management';
      let stockColumn = 'stock';

      // If not found in uniform_management, check inventory (Assets)
      if (stockCheck.rows.length === 0) {
        stockCheck = await client.query(
          'SELECT quantity as stock, item_name FROM inventory WHERE id = $1 AND org_id = $2 FOR UPDATE',
          [item_id, orgId]
        );
        tableName = 'inventory';
        stockColumn = 'quantity';
      }

      if (stockCheck.rows.length === 0) {
        throw new Error('Inventory item not found in any store');
      }

      const currentStock = stockCheck.rows[0].stock;
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock}`);
      }

      await client.query(
        `UPDATE ${tableName} SET ${stockColumn} = ${stockColumn} - $1 WHERE id = $2 AND org_id = $3`,
        [quantity, item_id, orgId]
      );
    }

    // 2. Create the sale record
    const result = await client.query(
      'INSERT INTO inventory_sales (org_id, item_id, item_name, quantity, total_price, buyer_name, student_id, add_to_fees) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [orgId, item_id || null, item_name, quantity, total_price, buyer_name, student_id || null, add_to_fees || false]
    );

    // 3. Create invoice if add_to_fees is selected
    if (add_to_fees && student_id && total_price > 0) {
      const description = `Inventory Purchase: ${item_name} (Qty: ${quantity})`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, student_id, total_price, description]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_INVENTORY_SALE', `Recorded inventory sale: ${item_name} (Qty: ${quantity})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateInventorySale = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { item_name, quantity, total_price, buyer_name, student_id, add_to_fees } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE inventory_sales SET item_name = $1, quantity = $2, total_price = $3, buyer_name = $4, student_id = $5, add_to_fees = $6 WHERE id = $7 AND org_id = $8 RETURNING *',
      [item_name, quantity, total_price, buyer_name, student_id || null, add_to_fees || false, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    await recordAuditLog(req.user.id, 'UPDATE_INVENTORY_ITEM', `Updated inventory item ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInventorySale = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM inventory_sales WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory sale not found' });
    await recordAuditLog(req.user.id, 'DELETE_INVENTORY_SALE', `Deleted inventory sale ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Inventory sale deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// TRANSPORT ROUTES
export const getTransportRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT tr.*, 
        (SELECT COUNT(*) FROM students WHERE transport_route_id = tr.id) as student_count
      FROM transport_routes tr 
      WHERE tr.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTransportRoute = async (req: AuthRequest, res: Response) => {
  const { route_name, vehicle_number, driver_name, driver_phone, price } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO transport_routes (org_id, route_name, vehicle_number, driver_name, driver_phone, price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgId, route_name, vehicle_number, driver_name, driver_phone, price || 0]
    );
    await recordAuditLog(req.user.id, 'CREATE_TRANSPORT_ROUTE', `Created transport route: ${route_name}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTransportRoute = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { route_name, vehicle_number, driver_name, driver_phone, price } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE transport_routes SET route_name = $1, vehicle_number = $2, driver_name = $3, driver_phone = $4, price = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [route_name, vehicle_number, driver_name, driver_phone, price || 0, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transport route not found' });
    await recordAuditLog(req.user.id, 'UPDATE_TRANSPORT_ROUTE', `Updated transport route ID: ${id} (${route_name})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTransportRoute = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM transport_routes WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transport route not found' });
    await recordAuditLog(req.user.id, 'DELETE_TRANSPORT_ROUTE', `Deleted transport route ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Transport route deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// HOSTELS
export const getHostels = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT h.*, 
        (SELECT COUNT(*) FROM hostel_rooms WHERE hostel_id = h.id) as total_rooms,
        (SELECT SUM(capacity) FROM hostel_rooms WHERE hostel_id = h.id) as total_capacity
      FROM hostels h 
      WHERE h.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createHostel = async (req: AuthRequest, res: Response) => {
  const { name, type, warden_name } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO hostels (org_id, name, type, warden_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, name, type, warden_name]
    );
    await recordAuditLog(req.user.id, 'CREATE_HOSTEL', `Created hostel: ${name} (${type})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateHostel = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, type, warden_name } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE hostels SET name = $1, type = $2, warden_name = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
      [name, type, warden_name, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hostel not found' });
    await recordAuditLog(req.user.id, 'UPDATE_HOSTEL', `Updated hostel ID: ${id} (${name})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteHostel = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM hostels WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hostel not found' });
    await recordAuditLog(req.user.id, 'DELETE_HOSTEL', `Deleted hostel ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Hostel deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// HOSTEL ROOMS
export const getHostelRooms = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const { hostel_id } = req.query;
    let query = 'SELECT hr.*, h.name as hostel_name, (SELECT COUNT(*) FROM students WHERE hostel_room_id = hr.id) as student_count FROM hostel_rooms hr JOIN hostels h ON hr.hostel_id = h.id WHERE hr.org_id = $1';
    const params: any[] = [orgId];
    if (hostel_id) {
      query += ' AND hr.hostel_id = $2';
      params.push(hostel_id);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createHostelRoom = async (req: AuthRequest, res: Response) => {
  const { hostel_id, room_number, capacity, price } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO hostel_rooms (org_id, hostel_id, room_number, capacity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, hostel_id, room_number, capacity || 1, price || 0]
    );
    await recordAuditLog(req.user.id, 'CREATE_HOSTEL_ROOM', `Created hostel room ${room_number} in hostel ID: ${hostel_id}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateHostelRoom = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { hostel_id, room_number, capacity, price } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE hostel_rooms SET hostel_id = $1, room_number = $2, capacity = $3, price = $4 WHERE id = $5 AND org_id = $6 RETURNING *',
      [hostel_id, room_number, capacity || 1, price || 0, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    await recordAuditLog(req.user.id, 'UPDATE_HOSTEL_ROOM', `Updated hostel room ID: ${id} (Room: ${room_number})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteHostelRoom = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM hostel_rooms WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    await recordAuditLog(req.user.id, 'DELETE_HOSTEL_ROOM', `Deleted hostel room ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Room deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// HEALTH RECORDS
export const getHealthRecords = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT hr.*, s.name as student_name 
      FROM health_records hr
      JOIN students s ON hr.student_id = s.id
      WHERE hr.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createHealthRecord = async (req: AuthRequest, res: Response) => {
  const { student_id, condition, treatment, date, doctor_name } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO health_records (org_id, student_id, condition, treatment, date, doctor_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgId, student_id, condition, treatment, date || new Date(), doctor_name]
    );
    await recordAuditLog(req.user.id, 'CREATE_HEALTH_RECORD', `Created health record for student: ${student_id}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateHealthRecord = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { student_id, condition, treatment, date, doctor_name } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE health_records SET student_id = $1, condition = $2, treatment = $3, date = $4, doctor_name = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [student_id, condition, treatment, date, doctor_name, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Health record not found' });
    await recordAuditLog(req.user.id, 'UPDATE_HEALTH_RECORD', `Updated health record ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteHealthRecord = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM health_records WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Health record not found' });
    await recordAuditLog(req.user.id, 'DELETE_HEALTH_RECORD', `Deleted health record ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Health record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// TRANSPORT STUDENT ASSIGNMENT
export const getRouteStudents = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'SELECT id, name, admission_no, class_id, transport_pickup_location FROM students WHERE transport_route_id = $1 AND org_id = $2',
      [id, orgId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const assignStudentToTransport = async (req: AuthRequest, res: Response) => {
  const { id: routeId } = req.params;
  const { student_id, pickup_location } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. Get Route Details (for price)
    const routeRes = await client.query(
      'SELECT route_name, price FROM transport_routes WHERE id = $1 AND org_id = $2',
      [routeId, orgId]
    );
    if (routeRes.rows.length === 0) throw new Error('Transport route not found');
    const route = routeRes.rows[0];

    // 2. Update Student
    const transportStatus = req.user.role === 'STUDENT' ? 'Pending' : 'Approved';
    const studentUpdate = await client.query(
      'UPDATE students SET transport_route_id = $1, transport_pickup_location = $2, transport_status = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
      [routeId, pickup_location || null, transportStatus, student_id, orgId]
    );
    if (studentUpdate.rows.length === 0) throw new Error('Student not found');

    // 3. Create Invoice if price > 0
    if (route.price > 0 && transportStatus === 'Approved') {
      const description = `Transport Fee: ${route.route_name}`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, student_id, route.price, description]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'ASSIGN_TRANSPORT', `Assigned student ID ${student_id} to route ID ${routeId}`, orgId, req.ip || '');
    res.json({ message: 'Student assigned to route successfully', student: studentUpdate.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const unassignStudentFromTransport = async (req: AuthRequest, res: Response) => {
  const { student_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE students SET transport_route_id = NULL, transport_pickup_location = NULL, transport_status = \'None\' WHERE id = $1 AND org_id = $2 RETURNING *',
      [student_id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    await recordAuditLog(req.user.id, 'UNASSIGN_TRANSPORT', `Unassigned student ID ${student_id} from transport`, orgId, req.ip || '');
    res.json({ message: 'Student unassigned from route successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const approveTransportRequest = async (req: AuthRequest, res: Response) => {
  const { student_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    const studentRes = await client.query(
      'SELECT transport_route_id FROM students WHERE id = $1 AND org_id = $2 AND transport_status = \'Pending\'',
      [student_id, orgId]
    );
    if (studentRes.rows.length === 0) throw new Error('Pending transport request not found');

    const routeId = studentRes.rows[0].transport_route_id;

    const routeRes = await client.query(
      'SELECT route_name, price FROM transport_routes WHERE id = $1 AND org_id = $2',
      [routeId, orgId]
    );
    if (routeRes.rows.length === 0) throw new Error('Transport route not found');
    const route = routeRes.rows[0];

    const studentUpdate = await client.query(
      'UPDATE students SET transport_status = \'Approved\' WHERE id = $1 AND org_id = $2 RETURNING *',
      [student_id, orgId]
    );

    if (route.price > 0) {
      const description = `Transport Fee: ${route.route_name}`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, student_id, route.price, description]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'APPROVE_TRANSPORT', `Approved transport request for student ID: ${student_id}`, orgId, req.ip || '');
    res.json({ message: 'Transport request approved', student: studentUpdate.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const rejectTransportRequest = async (req: AuthRequest, res: Response) => {
  const { student_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE students SET transport_route_id = NULL, transport_pickup_location = NULL, transport_status = \'None\' WHERE id = $1 AND org_id = $2 RETURNING *',
      [student_id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    await recordAuditLog(req.user.id, 'REJECT_TRANSPORT', `Rejected transport request for student ID: ${student_id}`, orgId, req.ip || '');
    res.json({ message: 'Transport request rejected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// HOSTEL STUDENT ASSIGNMENT
export const getRoomStudents = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'SELECT id, name, admission_no, class_id FROM students WHERE hostel_room_id = $1 AND org_id = $2',
      [id, orgId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const assignStudentToRoom = async (req: AuthRequest, res: Response) => {
  const { id: roomId } = req.params;
  const { student_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. Get Room Details (for price and hostel name)
    const roomRes = await client.query(
      'SELECT hr.room_number, hr.price, h.name as hostel_name FROM hostel_rooms hr JOIN hostels h ON hr.hostel_id = h.id WHERE hr.id = $1 AND hr.org_id = $2',
      [roomId, orgId]
    );
    if (roomRes.rows.length === 0) throw new Error('Hostel room not found');
    const room = roomRes.rows[0];

    // 2. Update Student
    const hostelStatus = req.user.role === 'STUDENT' ? 'Pending' : 'Approved';
    const studentUpdate = await client.query(
      'UPDATE students SET hostel_room_id = $1, hostel_status = $2 WHERE id = $3 AND org_id = $4 RETURNING *',
      [roomId, hostelStatus, student_id, orgId]
    );
    if (studentUpdate.rows.length === 0) throw new Error('Student not found');

    // 3. Create Invoice if price > 0
    if (room.price > 0 && hostelStatus === 'Approved') {
      const description = `Hostel Fee: ${room.hostel_name} - Room ${room.room_number}`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, student_id, room.price, description]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'ASSIGN_HOSTEL_ROOM', `Assigned student ID ${student_id} to room ID ${roomId}`, orgId, req.ip || '');
    res.json({ message: 'Student assigned to room successfully', student: studentUpdate.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const unassignStudentFromRoom = async (req: AuthRequest, res: Response) => {
  const { student_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE students SET hostel_room_id = NULL, hostel_status = \'None\' WHERE id = $1 AND org_id = $2 RETURNING *',
      [student_id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    await recordAuditLog(req.user.id, 'UNASSIGN_HOSTEL_ROOM', `Unassigned student ID ${student_id} from hostel room`, orgId, req.ip || '');
    res.json({ message: 'Student unassigned from room successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const approveHostelRequest = async (req: AuthRequest, res: Response) => {
  const { student_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    const studentRes = await client.query(
      'SELECT hostel_room_id FROM students WHERE id = $1 AND org_id = $2 AND hostel_status = \'Pending\'',
      [student_id, orgId]
    );
    if (studentRes.rows.length === 0) throw new Error('Pending hostel request not found');

    const roomId = studentRes.rows[0].hostel_room_id;

    const roomRes = await client.query(
      'SELECT hr.room_number, hr.price, h.name as hostel_name FROM hostel_rooms hr JOIN hostels h ON hr.hostel_id = h.id WHERE hr.id = $1 AND hr.org_id = $2',
      [roomId, orgId]
    );
    if (roomRes.rows.length === 0) throw new Error('Hostel room not found');
    const room = roomRes.rows[0];

    const studentUpdate = await client.query(
      'UPDATE students SET hostel_status = \'Approved\' WHERE id = $1 AND org_id = $2 RETURNING *',
      [student_id, orgId]
    );

    if (room.price > 0) {
      const description = `Hostel Fee: ${room.hostel_name} - Room ${room.room_number}`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, student_id, room.price, description]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'APPROVE_HOSTEL', `Approved hostel request for student ID: ${student_id}`, orgId, req.ip || '');
    res.json({ message: 'Hostel request approved', student: studentUpdate.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const rejectHostelRequest = async (req: AuthRequest, res: Response) => {
  const { student_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE students SET hostel_room_id = NULL, hostel_status = \'None\' WHERE id = $1 AND org_id = $2 RETURNING *',
      [student_id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    await recordAuditLog(req.user.id, 'REJECT_HOSTEL', `Rejected hostel request for student ID: ${student_id}`, orgId, req.ip || '');
    res.json({ message: 'Hostel request rejected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTransportAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT s.id, s.name, s.admission_no, s.transport_pickup_location, s.transport_status, tr.route_name, tr.price
      FROM students s
      JOIN transport_routes tr ON s.transport_route_id = tr.id
      WHERE s.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getHostelAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(`
      SELECT s.id, s.name, s.admission_no, s.hostel_status, h.name as hostel_name, hr.room_number, hr.price
      FROM students s
      JOIN hostel_rooms hr ON s.hostel_room_id = hr.id
      JOIN hostels h ON hr.hostel_id = h.id
      WHERE s.org_id = $1
    `, [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markStudentDroppedOff = async (req: AuthRequest, res: Response) => {
  const { student_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. Get Student and Org Details
    const studentRes = await client.query(`
      SELECT s.name, s.parent_contact, s.transport_pickup_location, o.transport_sms_enabled, o.name as school_name
      FROM students s
      JOIN organizations o ON s.org_id = o.id
      WHERE s.id = $1 AND s.org_id = $2
    `, [student_id, orgId]);

    if (studentRes.rows.length === 0) throw new Error('Student not found');
    const student = studentRes.rows[0];

    // 2. Update status
    await client.query(
      "UPDATE students SET transport_status = 'dropped' WHERE id = $1 AND org_id = $2",
      [student_id, orgId]
    );

    // 3. Send SMS if enabled
    if (student.transport_sms_enabled && student.parent_contact) {
      const message = `Hello, your child ${student.name} has been dropped off at ${student.transport_pickup_location || 'the designated stop'}. Thank you for choosing ${student.school_name}.`;
      await SMSService.sendSMS(orgId, student.parent_contact, message);
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'TRANSPORT_DROP_OFF', `Marked student ${student.name} as dropped off`, orgId, req.ip || '');
    res.json({ message: 'Student marked as dropped off successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

