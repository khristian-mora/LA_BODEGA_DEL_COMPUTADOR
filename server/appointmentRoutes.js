// Appointment Management Endpoints
import { db } from './db.js';
import * as notificationService from './notificationService.js';

// Get all appointments with pagination, filtering, and search
export const getAppointments = (req, res) => {
    const { 
        status, 
        technicianId,
        customerId,
        serviceType,
        startDate, 
        endDate,
        search,
        page = 1, 
        limit = 20, 
        sortBy = 'scheduledDate', 
        sortOrder = 'DESC' 
    } = req.query;
    
    // Pagination validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Validate sort parameters
    const validSortColumns = ['scheduledDate', 'status', 'createdAt', 'serviceType'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'scheduledDate';
    const safeSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let sql = `
        SELECT a.*, 
               c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE 1=1
    `;
    
    let countSql = `
        SELECT COUNT(*) as total
        FROM appointments a
        WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    // Filter by status
    if (status) {
        sql += ' AND a.status = ?';
        countSql += ' AND status = ?';
        params.push(status);
        countParams.push(status);
    }
    
    // Filter by technician
    if (technicianId) {
        sql += ' AND a.technicianId = ?';
        countSql += ' AND technicianId = ?';
        params.push(technicianId);
        countParams.push(technicianId);
    }
    
    // Filter by customer
    if (customerId) {
        sql += ' AND a.customerId = ?';
        countSql += ' AND customerId = ?';
        params.push(customerId);
        countParams.push(customerId);
    }
    
    // Filter by service type
    if (serviceType) {
        sql += ' AND a.serviceType = ?';
        countSql += ' AND serviceType = ?';
        params.push(serviceType);
        countParams.push(serviceType);
    }
    
    // Date range filter
    if (startDate) {
        sql += ' AND a.scheduledDate >= ?';
        countSql += ' AND scheduledDate >= ?';
        params.push(startDate);
        countParams.push(startDate);
    }
    if (endDate) {
        sql += ' AND a.scheduledDate <= ?';
        countSql += ' AND scheduledDate <= ?';
        params.push(endDate);
        countParams.push(endDate);
    }
    
    // Search filter
    if (search) {
        sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR a.serviceType LIKE ? OR a.notes LIKE ? OR u.name LIKE ?)`;
        countSql += ` AND (customerId IN (SELECT id FROM customers WHERE name LIKE ? OR phone LIKE ?) OR serviceType LIKE ? OR notes LIKE ? OR technicianId IN (SELECT id FROM users WHERE name LIKE ?))`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
        countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }
    
    // Get total count
    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limitNum);
        
        // Add sorting and pagination
        sql += ` ORDER BY a.${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        
        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                appointments: rows,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            });
        });
    });
};

// Get appointment statistics for dashboard
export const getAppointmentStats = (req, res) => {
    const { period = 'month' } = req.query;
    
    let periodCondition = '';
    if (period === 'week') {
        periodCondition = "AND scheduledDate >= date('now', '-7 days')";
    } else if (period === 'month') {
        periodCondition = "AND scheduledDate >= date('now', '-30 days')";
    } else if (period === 'quarter') {
        periodCondition = "AND scheduledDate >= date('now', '-90 days')";
    }
    
    // Total appointments and status distribution
    const totalSql = `
        SELECT 
            COUNT(*) as totalAppointments,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingAppointments,
            SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmedAppointments,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedAppointments,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelledAppointments,
            SUM(CASE WHEN status = 'No-Show' THEN 1 ELSE 0 END) as noShowAppointments
        FROM appointments
        WHERE 1=1 ${periodCondition}
    `;
    
    // Appointments by service type
    const serviceTypeSql = `
        SELECT serviceType, COUNT(*) as count
        FROM appointments
        WHERE 1=1 ${periodCondition}
        GROUP BY serviceType
        ORDER BY count DESC
    `;
    
    // Appointments by technician
    const technicianSql = `
        SELECT u.name as technicianName, 
               COUNT(a.id) as appointmentCount,
               SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) as completedCount
        FROM appointments a
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE 1=1 ${periodCondition}
        GROUP BY a.technicianId
        ORDER BY appointmentCount DESC
    `;
    
    // Upcoming appointments (next 7 days)
    const upcomingSql = `
        SELECT a.id, a.scheduledDate, a.serviceType, a.status,
               c.name as customerName, c.phone as customerPhone,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE a.scheduledDate BETWEEN datetime('now') AND datetime('now', '+7 days')
          AND a.status NOT IN ('Cancelled', 'Completed', 'No-Show')
        ORDER BY a.scheduledDate ASC
        LIMIT 10
    `;
    
    // Appointments by day of week
    const dayOfWeekSql = `
        SELECT 
            CASE CAST(strftime('%w', scheduledDate) AS INTEGER)
                WHEN 0 THEN 'Domingo'
                WHEN 1 THEN 'Lunes'
                WHEN 2 THEN 'Martes'
                WHEN 3 THEN 'Miércoles'
                WHEN 4 THEN 'Jueves'
                WHEN 5 THEN 'Viernes'
                WHEN 6 THEN 'Sábado'
            END as dayName,
            COUNT(*) as count
        FROM appointments
        WHERE 1=1 ${periodCondition}
        GROUP BY strftime('%w', scheduledDate)
        ORDER BY CAST(strftime('%w', scheduledDate) AS INTEGER)
    `;
    
    // Appointments by month trend
    const monthlyTrendSql = `
        SELECT 
            strftime('%Y-%m', scheduledDate) as month,
            COUNT(*) as totalAppointments,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedAppointments,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelledAppointments
        FROM appointments
        WHERE scheduledDate >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', scheduledDate)
        ORDER BY month DESC
        LIMIT 6
    `;
    
    // Cancellation rate
    const cancellationRateSql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN status = 'No-Show' THEN 1 ELSE 0 END) as noShow
        FROM appointments
        WHERE 1=1 ${periodCondition}
    `;
    
    Promise.all([
        new Promise((resolve, reject) => {
            db.get(totalSql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(serviceTypeSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(technicianSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(upcomingSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(dayOfWeekSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(monthlyTrendSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(cancellationRateSql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        })
    ]).then(([summary, serviceTypes, technicianStats, upcoming, dayOfWeek, monthlyTrend, cancellationData]) => {
        const cancellationRate = cancellationData && cancellationData.total > 0 
            ? ((cancellationData.cancelled + cancellationData.noShow) / cancellationData.total * 100).toFixed(1)
            : 0;
            
        res.json({
            summary: summary || {
                totalAppointments: 0,
                pendingAppointments: 0,
                confirmedAppointments: 0,
                completedAppointments: 0,
                cancelledAppointments: 0,
                noShowAppointments: 0
            },
            serviceTypes,
            technicianStats,
            upcoming,
            dayOfWeek,
            monthlyTrend,
            cancellationRate: parseFloat(cancellationRate)
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
};

// Get single appointment
export const getAppointment = (req, res) => {
    const sql = `
        SELECT a.*, 
               c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE a.id = ?
    `;

    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Cita no encontrada' });
            return;
        }
        res.json(row);
    });
};

// Create appointment with enhanced validation
export const createAppointment = (req, res) => {
    const { customerId, technicianId, serviceType, scheduledDate, duration, notes, reminder } = req.body;

    // Enhanced validation
    if (!customerId) {
        return res.status(400).json({ error: 'El cliente es requerido' });
    }
    
    if (!scheduledDate) {
        return res.status(400).json({ error: 'La fecha programada es requerida' });
    }
    
    if (!serviceType || serviceType.trim().length < 2) {
        return res.status(400).json({ error: 'El tipo de servicio es requerido (mínimo 2 caracteres)' });
    }
    
    // Validate date is not in the past (with a 30-minute buffer for flexibility)
    const appointmentDate = new Date(scheduledDate);
    const nowWithBuffer = new Date();
    nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() - 30); // 30 mins grace period
    
    if (appointmentDate < nowWithBuffer) {
        return res.status(400).json({ error: 'La fecha de la cita no puede ser en el pasado lejano (>30 mins atrás)' });
    }
    
    // Validate duration if provided
    if (duration && (duration < 15 || duration > 480)) {
        return res.status(400).json({ error: 'La duración debe ser entre 15 minutos y 8 horas' });
    }

    // Check for double booking
    const doubleCheckSql = `
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE technicianId = ? 
          AND scheduledDate = ? 
          AND status NOT IN ('Cancelled', 'Completed', 'No-Show')
    `;
    
    db.get(doubleCheckSql, [technicianId, scheduledDate], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.count > 0) {
            return res.status(400).json({ error: 'El técnico ya tiene una cita programada para esa fecha y hora' });
        }

        const sql = 'INSERT INTO appointments (customerId, technicianId, serviceType, scheduledDate, duration, status, notes, reminder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const now = new Date().toISOString();

        db.run(sql, [customerId, technicianId, serviceType.trim(), scheduledDate, duration || 60, 'Pending', notes || null, reminder || null, now], function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            
            // Log activity
            logActivity(req.user.id, 'CREATE', 'appointments', `Cita creada para ${scheduledDate} - ${serviceType}`);
            
            // Notify assigned technician and customer
            if (technicianId) {
                notificationService.notifyAssignment(this.lastID);
            }
            
            res.json({ 
                id: this.lastID, 
                customerId, 
                technicianId,
                serviceType: serviceType.trim(),
                scheduledDate, 
                duration: duration || 60,
                status: 'Pending',
                notes,
                reminder
            });
        });
    });
};

// Update appointment with workflow validation
export const updateAppointment = (req, res) => {
    const { customerId, technicianId, serviceType, scheduledDate, status, notes, duration, reminder } = req.body;

    // Check if appointment exists
    db.get('SELECT * FROM appointments WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Cita no encontrada' });
        
        // Validate status transitions
        const validTransitions = {
            'Pending': ['Confirmed', 'Cancelled'],
            'Confirmed': ['Completed', 'Cancelled', 'No-Show'],
            'Completed': [],
            'Cancelled': ['Pending'],
            'No-Show': ['Pending']
        };
        
        if (status && !validTransitions[existing.status]?.includes(status)) {
            return res.status(400).json({ 
                error: `No se puede cambiar de "${existing.status}" a "${status}"`,
                validTransitions: validTransitions[existing.status] || []
            });
        }
        
        // Validate date if changing
        if (scheduledDate && scheduledDate !== existing.scheduledDate) {
            const appointmentDate = new Date(scheduledDate);
            const now = new Date();
            if (appointmentDate < now && existing.status === 'Pending') {
                return res.status(400).json({ error: 'La fecha de la cita no puede ser en el pasado' });
            }
        }
        
        // Validate duration if provided
        if (duration && (duration < 15 || duration > 480)) {
            return res.status(400).json({ error: 'La duración debe ser entre 15 minutos y 8 horas' });
        }

        let updates = [];
        let params = [];

        if (customerId !== undefined) { updates.push('customerId = ?'); params.push(customerId); }
        if (technicianId !== undefined) { updates.push('technicianId = ?'); params.push(technicianId); }
        if (serviceType !== undefined) { updates.push('serviceType = ?'); params.push(serviceType.trim()); }
        if (scheduledDate !== undefined) { updates.push('scheduledDate = ?'); params.push(scheduledDate); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
        if (duration !== undefined) { updates.push('duration = ?'); params.push(duration); }
        if (reminder !== undefined) { updates.push('reminder = ?'); params.push(reminder); }

        updates.push('updatedAt = ?');
        params.push(new Date().toISOString());
        params.push(req.params.id);

        const sql = `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            
            // Log activity
            logActivity(req.user.id, 'UPDATE', 'appointments', `Cita #${req.params.id} actualizada`);
            
            // If technician was changed or reassigned, notify
            if (technicianId && (technicianId !== existing.technicianId)) {
                notificationService.notifyAssignment(req.params.id);
            }
            
            res.json({ success: true });
        });
    });
};

// Quick status update with validation
export const updateAppointmentStatus = (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Estado inválido. Debe ser: ${validStatuses.join(', ')}` });
    }
    
    // Check current status
    db.get('SELECT status FROM appointments WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cita no encontrada' });
        
        // Validate status transitions
        const validTransitions = {
            'Pending': ['Confirmed', 'Cancelled'],
            'Confirmed': ['Completed', 'Cancelled', 'No-Show'],
            'Completed': [],
            'Cancelled': ['Pending'],
            'No-Show': ['Pending']
        };
        
        if (!validTransitions[row.status]?.includes(status)) {
            return res.status(400).json({ 
                error: `No se puede cambiar de "${row.status}" a "${status}"`,
                validTransitions: validTransitions[row.status] || []
            });
        }
        
        db.run('UPDATE appointments SET status = ?, updatedAt = ? WHERE id = ?', 
            [status, new Date().toISOString(), id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log activity
            logActivity(req.user.id, 'STATUS_CHANGE', 'appointments', `Cita #${id} cambiada a ${status}`);
            
            res.json({ success: true, status });
        });
    });
};

// Export appointments to CSV
export const exportAppointments = (req, res) => {
    const { status, technicianId, startDate, endDate } = req.query;
    
    let sql = `
        SELECT a.id, a.scheduledDate, a.serviceType, a.status, a.duration, a.notes, a.reminder, a.createdAt,
               c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
    }
    
    if (technicianId) {
        sql += ' AND a.technicianId = ?';
        params.push(technicianId);
    }
    
    if (startDate) {
        sql += ' AND a.scheduledDate >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        sql += ' AND a.scheduledDate <= ?';
        params.push(endDate);
    }
    
    sql += ' ORDER BY a.scheduledDate DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const { format = 'csv' } = req.query;
        if (format === 'json') {
            return res.json(rows);
        }

        // Convert to CSV
        const headers = ['ID', 'Fecha', 'Hora', 'Servicio', 'Estado', 'Duración (min)', 'Cliente', 'Email', 'Teléfono', 'Técnico', 'Notas', 'Recordatorio', 'Creado'];
        const csvRows = rows.map(row => {
            const date = new Date(row.scheduledDate);
            return [
                row.id,
                date.toLocaleDateString('es-CO'),
                date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
                row.serviceType,
                row.status === 'Pending' ? 'Pendiente' : 
                row.status === 'Confirmed' ? 'Confirmada' :
                row.status === 'Completed' ? 'Completada' :
                row.status === 'Cancelled' ? 'Cancelada' : 'No Asistió',
                row.duration || 60,
                row.customerName || '',
                row.customerEmail || '',
                row.customerPhone || '',
                row.technicianName || 'Sin asignar',
                row.notes || '',
                row.reminder || '',
                row.createdAt
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        });
        
        const csv = [headers.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=citas_export.csv');
        res.send('\ufeff' + csv); // BOM for Excel UTF-8
    });
};

// Delete appointment
export const deleteAppointment = (req, res) => {
    // Get appointment info before deletion for logging
    db.get('SELECT serviceType, scheduledDate FROM appointments WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cita no encontrada' });
        
        db.run('DELETE FROM appointments WHERE id = ?', [req.params.id], function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            
            // Log activity
            logActivity(req.user.id, 'DELETE', 'appointments', `Cita eliminada: ${row.serviceType} - ${row.scheduledDate}`);
            
            res.json({ success: true });
        });
    });
};

// Get appointments by date range (legacy support)
export const getAppointmentsByDateRange = (_req, _res) => {
    // ... code ...
};

// Send daily reminders manually
export const sendDailyReminders = async (req, res) => {
    try {
        const count = await notificationService.sendDailyReminders();
        res.json({ success: true, count, message: `Se enviaron ${count} recordatorios para hoy.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper function to log activity
// ... existing logActivity ...

// Helper function to log activity
const logActivity = (userId, action, module, details) => {
    const timestamp = new Date().toISOString();
    const sql = `INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [userId, action, module, details, timestamp], (err) => {
        if (err) console.error('[ACTIVITY LOG] Error:', err.message);
    });
};