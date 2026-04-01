import { db } from './db.js';
import { validators } from './validationUtils.js';

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

// Create employee with validation
export const createEmployee = async (req, res) => {
    const { name, role, salary, phone, email, address, emergencyContact, notes, hireDate, position, department, hourlyRate, benefits } = req.body;
    
    // Basic validation
    if (!name || !role) {
        return res.status(400).json({ error: 'Nombre y cargo son obligatorios' });
    }
    
    // Validate email if provided
    if (email && !validators.isValidEmail(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }
    
    // Validate phone if provided
    if (phone && !validators.isValidPhone(phone)) {
        return res.status(400).json({ error: 'Teléfono inválido' });
    }
    
    // Validate salary
    if (salary !== undefined && (isNaN(salary) || salary < 0)) {
        return res.status(400).json({ error: 'El salario debe ser un número positivo' });
    }

    // Generate employee code
    db.get('SELECT COUNT(*) as count FROM employees', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const employeeCode = `EMP-${String(row.count + 1).padStart(3, '0')}`;
        const sql = `INSERT INTO employees (employeeCode, name, role, salary, hireDate, status, phone, email, address, emergencyContact, notes, position, department, hourlyRate, benefits, createdAt)
                     VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
        const params = [
            employeeCode, name, role, 
            salary || 0, hireDate || new Date().toISOString().split('T')[0],
            phone || '', email || '', address || '', emergencyContact || '', notes || '',
            position || '', department || '', hourlyRate || 0, benefits || ''
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log activity
            db.run(
                'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
                [req.user?.id || 0, 'CREATE', 'EMPLOYEES', `Empleado creado: ${name} (${employeeCode})`, new Date().toISOString()]
            );
            
            res.status(201).json({ 
                id: this.lastID, 
                employeeCode,
                name, 
                role, 
                salary: salary || 0,
                hireDate: hireDate || new Date().toISOString().split('T')[0],
                status: 'Active',
                phone, email, address, emergencyContact, notes,
                position, department, hourlyRate, benefits
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

// Calculate comprehensive payroll
export const calculatePayroll = (req, res) => {
    const { month, year } = req.query;
    
    // Default to current month if not specified
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    // Get active employees
    db.all("SELECT * FROM employees WHERE status = 'Active'", [], (err, employees) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Get attendance for the month
        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;
        
        db.all(`
            SELECT employeeId, 
                   COUNT(*) as totalDays,
                   SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
                   SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentDays,
                   SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as lateDays,
                   SUM(overtimeHours) as totalOvertimeHours
            FROM attendance
            WHERE date >= ? AND date <= ?
            GROUP BY employeeId
        `, [startDate, endDate], (err, attendanceRows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const attendanceMap = {};
            attendanceRows.forEach(row => {
                attendanceMap[row.employeeId] = row;
            });
            
            // Calculate payroll for each employee
            const payroll = employees.map(e => {
                const attendance = attendanceMap[e.id] || { presentDays: 22, totalOvertimeHours: 0 }; // Default 22 working days
                const baseSalary = e.salary || 0;
                const hourlyRate = e.hourlyRate || (baseSalary / 220); // 220 hours per month
                
                // Calculate overtime pay (1.5x hourly rate)
                const overtimeHours = attendance.totalOvertimeHours || 0;
                const overtimePay = overtimeHours * hourlyRate * 1.5;
                
                // Calculate deductions
                const healthDeduction = baseSalary * 0.04; // 4% salud
                const pensionDeduction = baseSalary * 0.04; // 4% pensión
                const incomeTax = calculateIncomeTax(baseSalary + overtimePay); // Simplified income tax
                
                // Benefits
                const transportAid = baseSalary <= 2600000 ? 162000 : 0; // Colombia transport aid
                const foodAid = 99000; // Monthly food aid
                
                // Bonifications (can be from attendance)
                const attendanceBonus = attendance.presentDays >= 20 ? 100000 : 0; // Perfect attendance bonus
                
                const grossSalary = baseSalary + overtimePay + transportAid + foodAid + attendanceBonus;
                const totalDeductions = healthDeduction + pensionDeduction + incomeTax;
                const netSalary = grossSalary - totalDeductions;
                
                return {
                    id: e.id,
                    employeeCode: e.employeeCode,
                    name: e.name,
                    role: e.role,
                    position: e.position,
                    department: e.department,
                    baseSalary,
                    hourlyRate,
                    attendance: {
                        presentDays: attendance.presentDays || 0,
                        absentDays: attendance.absentDays || 0,
                        lateDays: attendance.lateDays || 0,
                        overtimeHours: attendance.totalOvertimeHours || 0
                    },
                    earnings: {
                        baseSalary,
                        overtimePay,
                        transportAid,
                        foodAid,
                        attendanceBonus,
                        gross: grossSalary
                    },
                    deductions: {
                        health: healthDeduction,
                        pension: pensionDeduction,
                        incomeTax,
                        total: totalDeductions
                    },
                    netSalary
                };
            });
            
            // Calculate totals
            const totals = payroll.reduce((acc, p) => ({
                totalGross: acc.totalGross + p.earnings.gross,
                totalDeductions: acc.totalDeductions + p.deductions.total,
                totalNet: acc.totalNet + p.netSalary,
                totalOvertime: acc.totalOvertime + p.attendance.overtimeHours,
                employeeCount: acc.employeeCount + 1
            }), { totalGross: 0, totalDeductions: 0, totalNet: 0, totalOvertime: 0, employeeCount: 0 });
            
            res.json({
                period: { month: targetMonth, year: targetYear },
                employees: payroll,
                totals,
                generatedAt: new Date().toISOString()
            });
        });
    });
};

// Helper function for simplified income tax calculation (Colombia)
const calculateIncomeTax = (grossSalary) => {
    // Simplified Colombian income tax brackets (2024)
    const brackets = [
        { min: 0, max: 1090, rate: 0 },
        { min: 1090, max: 1533, rate: 0.19 },
        { min: 1533, max: 3639, rate: 0.28 },
        { min: 3639, max: 7774, rate: 0.33 },
        { min: 7774, max: Infinity, rate: 0.39 }
    ];
    
    const monthlySalary = grossSalary / 1000; // Convert to SMLV (minimum wage units)
    let tax = 0;
    
    for (const bracket of brackets) {
        if (monthlySalary > bracket.min) {
            const taxableInBracket = Math.min(monthlySalary, bracket.max) - bracket.min;
            tax += taxableInBracket * bracket.rate;
        }
    }
    
    return tax * 1000; // Convert back to COP
};

// Record employee attendance
export const recordAttendance = (req, res) => {
    const { employeeId, date, status, checkInTime, checkOutTime, overtimeHours, notes } = req.body;
    
    // Validate required fields
    if (!employeeId || !date || !status) {
        return res.status(400).json({ error: 'employeeId, date y status son requeridos' });
    }
    
    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'holiday', 'vacation', 'sick'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status debe ser: ${validStatuses.join(', ')}` });
    }
    
    // Check if employee exists
    db.get('SELECT id, name FROM employees WHERE id = ?', [employeeId], (err, employee) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });
        
        // Check if attendance already exists for this date
        db.get('SELECT id FROM attendance WHERE employeeId = ? AND date = ?', [employeeId, date], (err, existing) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (existing) {
                // Update existing attendance
                db.run(`
                    UPDATE attendance SET 
                        status = ?, checkInTime = ?, checkOutTime = ?, 
                        overtimeHours = ?, notes = ?, updatedAt = datetime('now')
                    WHERE id = ?
                `, [status, checkInTime, checkOutTime, overtimeHours || 0, notes, existing.id], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    // Log activity
                    db.run(
                        'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
                        [req.user?.id || 0, 'UPDATE_ATTENDANCE', 'EMPLOYEES', 
                         `Asistencia actualizada: ${employee.name} (${date}) - ${status}`, new Date().toISOString()]
                    );
                    
                    res.json({ 
                        success: true, 
                        id: existing.id,
                        message: 'Asistencia actualizada',
                        employee: employee.name,
                        date,
                        status
                    });
                });
            } else {
                // Create new attendance record
                db.run(`
                    INSERT INTO attendance (employeeId, date, status, checkInTime, checkOutTime, overtimeHours, notes, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [employeeId, date, status, checkInTime, checkOutTime, overtimeHours || 0, notes], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    // Log activity
                    db.run(
                        'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
                        [req.user?.id || 0, 'CREATE_ATTENDANCE', 'EMPLOYEES', 
                         `Asistencia registrada: ${employee.name} (${date}) - ${status}`, new Date().toISOString()]
                    );
                    
                    res.status(201).json({ 
                        id: this.lastID, 
                        employee: employee.name,
                        date,
                        status,
                        message: 'Asistencia registrada exitosamente'
                    });
                });
            }
        });
    });
};

// Get attendance for an employee
export const getAttendance = (req, res) => {
    const { employeeId } = req.params;
    const { startDate, endDate, month, year } = req.query;
    
    let sql = `
        SELECT a.*, e.name as employeeName, e.employeeCode
        FROM attendance a
        JOIN employees e ON a.employeeId = e.id
        WHERE a.employeeId = ?
    `;
    const params = [employeeId];
    
    if (startDate && endDate) {
        sql += ' AND a.date >= ? AND a.date <= ?';
        params.push(startDate, endDate);
    } else if (month && year) {
        sql += ' AND strftime("%m", a.date) = ? AND strftime("%Y", a.date) = ?';
        params.push(String(month).padStart(2, '0'), year);
    }
    
    sql += ' ORDER BY a.date DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Calculate summary
        const summary = rows.reduce((acc, row) => ({
            totalDays: acc.totalDays + 1,
            presentDays: acc.presentDays + (row.status === 'present' ? 1 : 0),
            absentDays: acc.absentDays + (row.status === 'absent' ? 1 : 0),
            lateDays: acc.lateDays + (row.status === 'late' ? 1 : 0),
            totalOvertime: acc.totalOvertime + (row.overtimeHours || 0)
        }), { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, totalOvertime: 0 });
        
        res.json({
            employee: rows.length > 0 ? { 
                id: employeeId, 
                name: rows[0].employeeName, 
                code: rows[0].employeeCode 
            } : { id: employeeId },
            attendance: rows,
            summary,
            period: { startDate, endDate, month, year }
        });
    });
};
