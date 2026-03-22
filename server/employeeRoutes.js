import { db } from './db.js';

// Get all employees
export const getEmployees = (req, res) => {
    db.all('SELECT * FROM employees ORDER BY name ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Get single employee
export const getEmployee = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json(row);
    });
};

// Create employee
export const createEmployee = (req, res) => {
    const { name, role, salary, phone, email, address, emergencyContact, notes, hireDate } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Nombre y cargo son obligatorios' });

    // Generate employee code
    db.get('SELECT COUNT(*) as count FROM employees', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const employeeCode = `EMP-${String(row.count + 1).padStart(3, '0')}`;
        const sql = `INSERT INTO employees (employeeCode, name, role, salary, hireDate, status, phone, email, address, emergencyContact, notes, createdAt)
                     VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, datetime('now'))`;
        const params = [
            employeeCode, name, role, 
            salary || 0, hireDate || new Date().toISOString().split('T')[0],
            phone || '', email || '', address || '', emergencyContact || '', notes || ''
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ 
                id: this.lastID, 
                employeeCode,
                name, 
                role, 
                salary: salary || 0,
                hireDate: hireDate || new Date().toISOString().split('T')[0],
                status: 'Active',
                phone, email, address, emergencyContact, notes
            });
        });
    });
};

// Update employee
export const updateEmployee = (req, res) => {
    const { id } = req.params;
    const { name, role, salary, phone, email, address, emergencyContact, notes, status, hireDate } = req.body;

    const sql = `UPDATE employees SET 
                 name = ?, role = ?, salary = ?, phone = ?, email = ?,
                 address = ?, emergencyContact = ?, notes = ?, status = ?, hireDate = ?,
                 updatedAt = datetime('now')
                 WHERE id = ?`;
    const params = [name, role, salary, phone, email, address, emergencyContact, notes, status || 'Active', hireDate, id];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json({ id: parseInt(id), ...req.body });
    });
};

// Delete employee (soft delete - set status to Terminated)
export const deleteEmployee = (req, res) => {
    const { id } = req.params;
    db.run('UPDATE employees SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?', ['Terminated', id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
        res.json({ success: true });
    });
};

// Calculate payroll
export const calculatePayroll = (req, res) => {
    db.all("SELECT * FROM employees WHERE status = 'Active'", [], (err, employees) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalBase = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
        const healthDeductions = totalBase * 0.04; // 4% salud
        const pensionDeductions = totalBase * 0.04; // 4% pensión
        const transportAid = employees.filter(e => (e.salary || 0) <= 2600000).length * 162000;
        const totalCost = totalBase + transportAid;

        res.json({
            employees: employees.map(e => ({
                id: e.id,
                name: e.name,
                role: e.role,
                salary: e.salary,
                healthDeduction: (e.salary || 0) * 0.04,
                pensionDeduction: (e.salary || 0) * 0.04,
                transportAid: (e.salary || 0) <= 2600000 ? 162000 : 0
            })),
            totals: {
                totalBase,
                healthDeductions,
                pensionDeductions,
                transportAid,
                totalCost
            }
        });
    });
};
