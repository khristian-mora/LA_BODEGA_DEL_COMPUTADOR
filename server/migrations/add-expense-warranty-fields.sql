-- Migration: Add new fields for expense and warranty management
-- Date: 2026-03-22
-- Author: Back Office Improvement

-- ============================================
-- EXPENSE TABLE ENHANCEMENTS
-- ============================================

-- Add approval workflow columns to expenses table
ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'approved';
ALTER TABLE expenses ADD COLUMN approvedBy INTEGER REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN approvedAt TEXT;
ALTER TABLE expenses ADD COLUMN approvalNotes TEXT;
ALTER TABLE expenses ADD COLUMN rejectedBy INTEGER REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN rejectedAt TEXT;
ALTER TABLE expenses ADD COLUMN rejectionReason TEXT;

-- Create expense_budgets table for budget tracking
CREATE TABLE IF NOT EXISTS expense_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM
    budget INTEGER NOT NULL,
    notes TEXT,
    createdBy INTEGER REFERENCES users(id),
    createdAt TEXT,
    updatedAt TEXT,
    UNIQUE(category, month)
);

-- Create expense_approvals table for multi-level approvals
CREATE TABLE IF NOT EXISTS expense_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expenseId INTEGER NOT NULL REFERENCES expenses(id),
    approverId INTEGER NOT NULL REFERENCES users(id),
    level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    comments TEXT,
    approvedAt TEXT,
    createdAt TEXT,
    UNIQUE(expenseId, level)
);

-- ============================================
-- WARRANTY TABLE ENHANCEMENTS
-- ============================================

-- Add new columns to warranties table
ALTER TABLE warranties ADD COLUMN warrantyType TEXT DEFAULT 'standard'; -- standard, extended, replacement
ALTER TABLE warranties ADD COLUMN supplierId INTEGER REFERENCES suppliers(id);
ALTER TABLE warranties ADD COLUMN notes TEXT;
ALTER TABLE warranties ADD COLUMN updatedAt TEXT;

-- Add priority and status to warranty_claims
ALTER TABLE warranty_claims ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE warranty_claims ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE warranty_claims ADD COLUMN ticketId INTEGER REFERENCES tickets(id);
ALTER TABLE warranty_claims ADD COLUMN resolutionType TEXT; -- repaired, replaced, refunded, denied, other
ALTER TABLE warranty_claims ADD COLUMN cost INTEGER;
ALTER TABLE warranty_claims ADD COLUMN replacedParts TEXT;
ALTER TABLE warranty_claims ADD COLUMN resolutionNotes TEXT;
ALTER TABLE warranty_claims ADD COLUMN updatedAt TEXT;

-- Create warranty_suppliers table if needed (optional)
CREATE TABLE IF NOT EXISTS warranty_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    warrantyPeriod INTEGER, -- default warranty period in months
    terms TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT
);

-- Create warranty_history table for tracking changes
CREATE TABLE IF NOT EXISTS warranty_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warrantyId INTEGER NOT NULL REFERENCES warranties(id),
    action TEXT NOT NULL, -- created, updated, claimed, renewed, cancelled
    userId INTEGER REFERENCES users(id),
    oldValues TEXT, -- JSON
    newValues TEXT, -- JSON
    notes TEXT,
    createdAt TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Expense indexes
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_approvedBy ON expenses(approvedBy);

-- Warranty indexes
CREATE INDEX IF NOT EXISTS idx_warranties_status ON warranties(status);
CREATE INDEX IF NOT EXISTS idx_warranties_customerId ON warranties(customerId);
CREATE INDEX IF NOT EXISTS idx_warranties_endDate ON warranties(endDate);
CREATE INDEX IF NOT EXISTS idx_warranties_supplierId ON warranties(supplierId);

-- Warranty claims indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_priority ON warranty_claims(priority);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_warrantyId ON warranty_claims(warrantyId);

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_expense_budgets_category_month ON expense_budgets(category, month);

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample expense categories if not exists
INSERT OR IGNORE INTO expense_budgets (category, month, budget, createdAt) VALUES
    ('Salarios', strftime('%Y-%m', 'now'), 50000000, datetime('now')),
    ('Arriendo', strftime('%Y-%m', 'now'), 8000000, datetime('now')),
    ('Servicios Públicos', strftime('%Y-%m', 'now'), 2000000, datetime('now')),
    ('Marketing', strftime('%Y-%m', 'now'), 5000000, datetime('now')),
    ('Mantenimiento', strftime('%Y-%m', 'now'), 3000000, datetime('now')),
    ('Suministros', strftime('%Y-%m', 'now'), 2000000, datetime('now')),
    ('Transporte', strftime('%Y-%m', 'now'), 1500000, datetime('now')),
    ('Seguros', strftime('%Y-%m', 'now'), 1000000, datetime('now'));

-- Insert sample warranty supplier if not exists
INSERT OR IGNORE INTO warranty_suppliers (name, warrantyPeriod, status, createdAt) VALUES
    ('Proveedor Genérico', 12, 'active', datetime('now')),
    ('Fabricante Oficial', 24, 'active', datetime('now')),
    ('Garantía Extendida', 36, 'active', datetime('now'));