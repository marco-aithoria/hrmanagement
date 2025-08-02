const express = require('express');
const { db } = require('../database');

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get vacation requests (filtered by user role)
router.get('/', requireAuth, (req, res) => {
  try {
    let query, params = [];

    if (req.session.user.role === 'admin') {
      // Admin can see all requests
      query = `
        SELECT vr.*, 
               e.first_name, e.last_name, e.department,
               a.first_name as approved_by_first_name, 
               a.last_name as approved_by_last_name
        FROM vacation_requests vr
        JOIN employees e ON vr.employee_id = e.id
        LEFT JOIN employees a ON vr.approved_by = a.id
        ORDER BY vr.created_at DESC
      `;
    } else {
      // Regular users see only their own requests
      query = `
        SELECT vr.*, 
               e.first_name, e.last_name, e.department,
               a.first_name as approved_by_first_name, 
               a.last_name as approved_by_last_name
        FROM vacation_requests vr
        JOIN employees e ON vr.employee_id = e.id
        LEFT JOIN employees a ON vr.approved_by = a.id
        WHERE e.user_id = ?
        ORDER BY vr.created_at DESC
      `;
      params = [req.session.user.id];
    }

    const requests = db.prepare(query).all(...params);
    res.json(requests);
  } catch (error) {
    console.error('Get vacation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch vacation requests' });
  }
});

// Get vacation balance for current user
router.get('/balance', requireAuth, (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get user's employee ID
    const employee = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(req.session.user.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    let balance = db.prepare(`
      SELECT * FROM vacation_balances WHERE employee_id = ? AND year = ?
    `).get(employee.id, currentYear);

    // Create balance record if doesn't exist
    if (!balance) {
      const insertBalance = db.prepare(`
        INSERT INTO vacation_balances (employee_id, year, total_days, used_days, remaining_days)
        VALUES (?, ?, 25, 0, 25)
      `);
      insertBalance.run(employee.id, currentYear);
      
      balance = db.prepare(`
        SELECT * FROM vacation_balances WHERE employee_id = ? AND year = ?
      `).get(employee.id, currentYear);
    }

    res.json(balance);
  } catch (error) {
    console.error('Get vacation balance error:', error);
    res.status(500).json({ error: 'Failed to fetch vacation balance' });
  }
});

// Create vacation request
router.post('/', requireAuth, (req, res) => {
  const { start_date, end_date, type = 'vacation', reason } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  try {
    // Get user's employee ID
    const employee = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(req.session.user.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    // Calculate days requested
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days_requested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (days_requested <= 0) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    // Check if user has enough vacation days
    const currentYear = new Date().getFullYear();
    const balance = db.prepare(`
      SELECT remaining_days FROM vacation_balances WHERE employee_id = ? AND year = ?
    `).get(employee.id, currentYear);

    if (balance && balance.remaining_days < days_requested) {
      return res.status(400).json({ 
        error: `Insufficient vacation days. You have ${balance.remaining_days} days remaining.` 
      });
    }

    const insertRequest = db.prepare(`
      INSERT INTO vacation_requests (employee_id, start_date, end_date, days_requested, type, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertRequest.run(
      employee.id,
      start_date,
      end_date,
      days_requested,
      type,
      reason
    );

    res.status(201).json({
      message: 'Vacation request submitted successfully',
      requestId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Create vacation request error:', error);
    res.status(500).json({ error: 'Failed to create vacation request' });
  }
});

// Approve/Deny vacation request (admin only)
router.put('/:id/status', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { status, notes } = req.body;

  if (!['approved', 'denied'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or denied' });
  }

  try {
    // Get the vacation request
    const request = db.prepare('SELECT * FROM vacation_requests WHERE id = ?').get(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Vacation request not found' });
    }

    // Get approver's employee ID
    const approver = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(req.session.user.id);

    const transaction = db.transaction(() => {
      // Update the request
      const updateRequest = db.prepare(`
        UPDATE vacation_requests SET
          status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateRequest.run(status, approver.id, notes, req.params.id);

      // If approved, update vacation balance
      if (status === 'approved') {
        const currentYear = new Date().getFullYear();
        const updateBalance = db.prepare(`
          UPDATE vacation_balances SET
            used_days = used_days + ?,
            remaining_days = remaining_days - ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE employee_id = ? AND year = ?
        `);
        updateBalance.run(request.days_requested, request.days_requested, request.employee_id, currentYear);
      }
    });

    transaction();

    res.json({ message: `Vacation request ${status} successfully` });
  } catch (error) {
    console.error('Update vacation request error:', error);
    res.status(500).json({ error: 'Failed to update vacation request' });
  }
});

// Get vacation statistics (admin only)
router.get('/stats', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const stats = {
      pending: db.prepare('SELECT COUNT(*) as count FROM vacation_requests WHERE status = "pending"').get().count,
      approved: db.prepare('SELECT COUNT(*) as count FROM vacation_requests WHERE status = "approved"').get().count,
      denied: db.prepare('SELECT COUNT(*) as count FROM vacation_requests WHERE status = "denied"').get().count,
      totalDaysRequested: db.prepare('SELECT SUM(days_requested) as total FROM vacation_requests WHERE status = "approved"').get().total || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get vacation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch vacation statistics' });
  }
});

module.exports = router;