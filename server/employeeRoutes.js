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
// Calculate comprehensive payroll (Colombian Law)
export const calculatePayroll = (req, res) => {
    const { month, year, department, role } = req.query;
    
    // Default to current month if not specified
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    // Get active employees with requested roles
    let employeeSql = "SELECT * FROM employees WHERE status = 'Active'";
    let employeeParams = [];

    // Filter by roles requested: tecnico, administrador
    employeeSql += " AND (role LIKE '%tecnico%' OR role LIKE '%administrador%' OR role LIKE '%admin%')";

    if (department) {
        employeeSql += " AND department = ?";
        employeeParams.push(department);
    }
    
    db.all(employeeSql, employeeParams, (err, employees) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Get attendance for the month with all surcharge types
        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;
        
        db.all(`
            SELECT employeeId, 
                   COUNT(*) as totalDays,
                   SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
                   SUM(overtimeHours) as extraDiurna,
                   SUM(extraNightHours) as extraNocturna,
                   SUM(sundayHolidayHours) as extraDominicalDiurna,
                   SUM(sundayHolidayNightHours) as extraDominicalNocturna
            FROM attendance
            WHERE date >= ? AND date <= ?
            GROUP BY employeeId
        `, [startDate, endDate], (err, attendanceRows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const attendanceMap = {};
            attendanceRows.forEach(row => {
                attendanceMap[row.employeeId] = row;
            });
            
            // Reference values for 2024 Colombia
            const smlv = 1300000;
            const auxTransporte = 162000;

            const payroll = employees.map(e => {
                const attendance = attendanceMap[e.id] || { presentDays: 0, extraDiurna: 0, extraNocturna: 0, extraDominicalDiurna: 0, extraNocturna: 0 };
                const baseSalary = e.salary || 0;
                
                // Hourly rate (Salary / 235 standard hours)
                const hoursPerMonth = 235; 
                const hourlyRate = baseSalary / hoursPerMonth;
                
                // Extra Diurna (1.25x)
                const payExtraDiurna = (attendance.extraDiurna || 0) * hourlyRate * 1.25;
                // Extra Nocturna (1.75x)
                const payExtraNocturna = (attendance.extraNocturna || 0) * hourlyRate * 1.75;
                // Extra Dominical Diurna (2.0x)
                const payExtraDominicalDiurna = (attendance.extraDominicalDiurna || 0) * hourlyRate * 2.0;
                // Extra Dominical Nocturna (2.5x)
                const payExtraDominicalNocturna = (attendance.extraDominicalNocturna || 0) * hourlyRate * 2.5;

                const totalExtras = payExtraDiurna + payExtraNocturna + payExtraDominicalDiurna + payExtraDominicalNocturna;
                
                // IBC (Ingreso Base de Cotización)
                const ibc = baseSalary + totalExtras;
                
                // Deductions (4% Health, 4% Pension)
                const healthDeduction = ibc * 0.04;
                const pensionDeduction = ibc * 0.04;
                
                // Solidarity Fund (1% if > 4 SMLV)
                const solidarityFund = ibc >= (smlv * 4) ? ibc * 0.01 : 0;
                
                // Transport Aid
                const transportAid = baseSalary <= (smlv * 2) ? auxTransporte : 0;
                
                const grossSalary = ibc + transportAid;
                const totalDeductions = healthDeduction + pensionDeduction + solidarityFund;
                const netSalary = grossSalary - totalDeductions;
                
                return {
                    id: e.id,
                    name: e.name,
                    role: e.role,
                    baseSalary,
                    attendance: {
                        daysPresent: attendance.presentDays,
                        extraDiurna: attendance.extraDiurna || 0,
                        extraNocturna: attendance.extraNocturna || 0,
                        extraDominicalDiurna: attendance.extraDominicalDiurna || 0,
                        extraDominicalNocturna: attendance.extraDominicalNocturna || 0
                    },
                    earnings: {
                        baseSalary,
                        totalExtras,
                        transportAid,
                        gross: grossSalary
                    },
                    deductions: {
                        health: healthDeduction,
                        pension: pensionDeduction,
                        solidarity: solidarityFund,
                        total: totalDeductions
                    },
                    netSalary: Math.round(netSalary)
                };
            });
            
            res.json({
                period: { month: targetMonth, year: targetYear },
                employees: payroll,
                totals: payroll.reduce((acc, p) => ({
                    gross: acc.gross + p.earnings.gross,
                    net: acc.net + p.netSalary,
                    count: acc.count + 1
                }), { gross: 0, net: 0, count: 0 }),
                generatedAt: new Date().toISOString()
            });
        });
    });
};

// Record employee attendance
export const recordAttendance = (req, res) => {
    const { 
        employeeId, date, status, 
        overtimeHours, extraNightHours, 
        sundayHolidayHours, sundayHolidayNightHours, 
        notes 
    } = req.body;
    
    if (!employeeId || !date || !status) {
        return res.status(400).json({ error: 'employeeId, date y status son requeridos' });
    }
    
    db.get('SELECT id, name FROM employees WHERE id = ?', [employeeId], (err, employee) => {
        if (err || !employee) return res.status(404).json({ error: 'Empleado no encontrado' });
        
        db.get('SELECT id FROM attendance WHERE employeeId = ? AND date = ?', [employeeId, date], (err, existing) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const sql = existing 
                ? `UPDATE attendance SET 
                    status = ?, overtimeHours = ?, extraNightHours = ?, 
                    sundayHolidayHours = ?, sundayHolidayNightHours = ?, 
                    notes = ?, updatedAt = datetime('now')
                    WHERE id = ?`
                : `INSERT INTO attendance (
                    status, overtimeHours, extraNightHours, 
                    sundayHolidayHours, sundayHolidayNightHours, 
                    notes, createdAt, employeeId, date
                  ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`;
            
            const params = existing
                ? [status, overtimeHours || 0, extraNightHours || 0, sundayHolidayHours || 0, sundayHolidayNightHours || 0, notes, existing.id]
                : [status, overtimeHours || 0, extraNightHours || 0, sundayHolidayHours || 0, sundayHolidayNightHours || 0, notes, employeeId, date];

            db.run(sql, params, function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: 'Asistencia registrada' });
            });
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
        });
    });
};

// Export Employees (Complete Database)
export const exportEmployees = (req, res) => {
    const { status, department, format = 'json' } = req.query;
    
    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    if (department) {
        sql += ' AND department = ?';
        params.push(department);
    }

    sql += ' ORDER BY name ASC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (format === 'json') {
            return res.json(rows);
        }

        // Convert to CSV
        const headers = ['Código', 'Nombre', 'Cargo', 'Departamento', 'Salario', 'Fecha Ingreso', 'Estado', 'Teléfono', 'Email'];
        const csvRows = rows.map(row => [
            row.employeeCode,
            `"${(row.name || '').replace(/"/g, '""')}"`,
            `"${(row.role || '').replace(/"/g, '""')}"`,
            `"${(row.department || '').replace(/"/g, '""')}"`,
            row.salary,
            row.hireDate,
            row.status,
            row.phone,
            row.email
        ].join(','));
        
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=empleados_export.csv');
        res.send('\ufeff' + csvContent);
    });
};
