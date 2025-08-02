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

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all employees
router.get('/', requireAuth, (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT e.*, 
             m.first_name as manager_first_name, 
             m.last_name as manager_last_name,
             u.role
      FROM employees e 
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.status = 'active'
      ORDER BY e.last_name, e.first_name
    `).all();

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get single employee
router.get('/:id', requireAuth, (req, res) => {
  try {
    const employee = db.prepare(`
      SELECT e.*, 
             m.first_name as manager_first_name, 
             m.last_name as manager_last_name,
             u.role
      FROM employees e 
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Create new employee
router.post('/', requireAdmin, (req, res) => {
  const {
    first_name,
    last_name,
    email,
    department,
    position,
    hire_date,
    phone,
    address,
    salary,
    manager_id
  } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  try {
    const insertEmployee = db.prepare(`
      INSERT INTO employees (
        first_name, last_name, email, department, position, 
        hire_date, phone, address, salary, manager_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEmployee.run(
      first_name,
      last_name,
      email,
      department,
      position,
      hire_date,
      phone,
      address,
      salary,
      manager_id
    );

    // Create vacation balance for current year
    const currentYear = new Date().getFullYear();
    const insertBalance = db.prepare(`
      INSERT INTO vacation_balances (employee_id, year, total_days, used_days, remaining_days)
      VALUES (?, ?, 25, 0, 25)
    `);
    insertBalance.run(result.lastInsertRowid, currentYear);

    res.status(201).json({
      message: 'Employee created successfully',
      employeeId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee
router.put('/:id', requireAdmin, (req, res) => {
  const {
    first_name,
    last_name,
    email,
    department,
    position,
    hire_date,
    phone,
    address,
    salary,
    manager_id,
    status
  } = req.body;

  try {
    const updateEmployee = db.prepare(`
      UPDATE employees SET
        first_name = ?, last_name = ?, email = ?, department = ?, position = ?,
        hire_date = ?, phone = ?, address = ?, salary = ?, manager_id = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = updateEmployee.run(
      first_name,
      last_name,
      email,
      department,
      position,
      hire_date,
      phone,
      address,
      salary,
      manager_id,
      status,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee (soft delete)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const updateEmployee = db.prepare(`
      UPDATE employees SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const result = updateEmployee.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

module.exports = router;