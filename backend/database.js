const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Create or open database
const db = new Database(path.join(__dirname, 'hr_management.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Users table (for authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT,
      position TEXT,
      hire_date DATE,
      phone TEXT,
      address TEXT,
      salary DECIMAL(10,2),
      manager_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (manager_id) REFERENCES employees(id)
    )
  `);

  // Vacation requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vacation_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days_requested INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'vacation',
      reason TEXT,
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (approved_by) REFERENCES employees(id)
    )
  `);

  // Vacation balances table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vacation_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total_days INTEGER DEFAULT 25,
      used_days INTEGER DEFAULT 0,
      remaining_days INTEGER DEFAULT 25,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, year)
    )
  `);

  console.log('Database tables created successfully');
};

// Create default admin user
const createDefaultAdmin = () => {
  const checkAdmin = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
  
  if (checkAdmin.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    // Insert admin user
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, role) 
      VALUES (?, ?, ?)
    `);
    const userResult = insertUser.run('admin@company.com', hashedPassword, 'admin');
    
    // Insert admin employee record
    const insertEmployee = db.prepare(`
      INSERT INTO employees (user_id, first_name, last_name, email, department, position, hire_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertEmployee.run(
      userResult.lastInsertRowid,
      'Admin',
      'User',
      'admin@company.com',
      'IT',
      'System Administrator',
      new Date().toISOString().split('T')[0]
    );
    
    console.log('Default admin user created: admin@company.com / admin123');
  }
};

// Initialize database
const initDatabase = () => {
  createTables();
  createDefaultAdmin();
};

module.exports = { db, initDatabase };