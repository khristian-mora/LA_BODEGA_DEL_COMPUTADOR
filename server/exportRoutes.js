// Export Routes - Excel/PDF Generation
import { db } from './db.js';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export Customers to Excel
export const exportCustomersToExcel = (req, res) => {
    const { type, status } = req.query;
    
    let sql = `
        SELECT 
            c.id,
            c.name as 'Nombre',
            c.email as 'Email',
            c.phone as 'Teléfono',
            c.address as 'Dirección',
            c.idNumber as 'Cédula/NIT',
            c.customerType as 'Tipo Cliente',
            c.status as 'Estado',
            c.notes as 'Notas',
            c.createdAt as 'Fecha Registro',
            COUNT(DISTINCT t.id) as 'Total Tickets',
            SUM(t.estimatedCost) as 'Total Gastado'
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        WHERE 1=1
    `;
    const params = [];
    
    if (type) {
        sql += ' AND c.customerType = ?';
        params.push(type);
    }
    if (status) {
        sql += ' AND c.status = ?';
        params.push(status);
    }
    
    sql += ' GROUP BY c.id ORDER BY c.createdAt DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        
        // Ajustar anchos de columna
        const colWidths = [
            { wch: 5 },  // ID
            { wch: 30 }, // Nombre
            { wch: 25 }, // Email
            { wch: 15 }, // Teléfono
            { wch: 40 }, // Dirección
            { wch: 15 }, // Cédula
            { wch: 12 }, // Tipo
            { wch: 10 }, // Estado
            { wch: 30 }, // Notas
            { wch: 12 }, // Fecha
            { wch: 12 }, // Tickets
            { wch: 15 }, // Total Gastado
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
        
        // Generar buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        // Enviar archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buf);
    });
};

// Export Products to Excel
export const exportProductsToExcel = (req, res) => {
    const { category, lowStock } = req.query;
    
    let sql = `
        SELECT 
            p.id,
            p.name as 'Producto',
            p.category as 'Categoría',
            p.price as 'Precio',
            p.stock as 'Stock Actual',
            p.minStock as 'Stock Mínimo',
            CASE WHEN p.stock < p.minStock THEN 'BAJO' ELSE 'OK' END as 'Estado Stock',
            (p.price * p.stock) as 'Valor Inventario',
            p.supplierEmail as 'Proveedor',
            p.description as 'Descripción',
            p.featured as 'Destacado',
            p.createdAt as 'Fecha Creación'
        FROM products p
        WHERE 1=1
    `;
    const params = [];
    
    if (category) {
        sql += ' AND p.category = ?';
        params.push(category);
    }
    if (lowStock === 'true') {
        sql += ' AND p.stock < p.minStock';
    }
    
    sql += ' ORDER BY p.category, p.name';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Formatear datos
        const data = rows.map(r => ({
            ...r,
            'Destacado': r['Destacado'] ? 'Sí' : 'No',
            'Precio': parseFloat(r['Precio']).toFixed(2),
            'Valor Inventario': parseFloat(r['Valor Inventario']).toFixed(2)
        }));
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Ajustar anchos
        ws['!cols'] = [
            { wch: 5 },   // ID
            { wch: 30 },  // Producto
            { wch: 20 },  // Categoría
            { wch: 12 },  // Precio
            { wch: 12 },  // Stock
            { wch: 12 },  // Mínimo
            { wch: 12 },  // Estado
            { wch: 15 },  // Valor
            { wch: 25 },  // Proveedor
            { wch: 40 },  // Descripción
            { wch: 10 },  // Destacado
            { wch: 12 },  // Fecha
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        
        // Resumen por categoría
        db.all(`
            SELECT category, COUNT(*) as count, SUM(stock) as totalStock, SUM(price * stock) as totalValue
            FROM products GROUP BY category
        `, [], (err, summaryRows) => {
            if (!err && summaryRows.length > 0) {
                const summaryWs = XLSX.utils.json_to_sheet(summaryRows.map(r => ({
                    'Categoría': r.category,
                    'Cantidad Productos': r.count,
                    'Stock Total': r.totalStock,
                    'Valor Total': parseFloat(r.totalValue).toFixed(2)
                })));
                XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Categorías');
            }
            
            // Generar y enviar
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=productos_${new Date().toISOString().split('T')[0]}.xlsx`);
            res.send(buf);
        });
    });
};

// Export Orders to Excel
export const exportOrdersToExcel = (req, res) => {
    const { startDate, endDate, status } = req.query;
    
    let sql = `
        SELECT 
            o.id,
            o.orderNumber as 'Número Pedido',
            o.customerName as 'Cliente',
            o.customerEmail as 'Email',
            o.customerPhone as 'Teléfono',
            o.total as 'Total',
            o.paymentMethod as 'Método Pago',
            o.status as 'Estado',
            o.createdAt as 'Fecha',
            (SELECT GROUP_CONCAT(p.name || ' x' || oi.quantity)
             FROM order_items oi 
             JOIN products p ON oi.productId = p.id 
             WHERE oi.orderId = o.id) as 'Productos'
        FROM orders o
        WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
        sql += ' AND o.createdAt >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND o.createdAt <= ?';
        params.push(endDate);
    }
    if (status) {
        sql += ' AND o.status = ?';
        params.push(status);
    }
    
    sql += ' ORDER BY o.createdAt DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Formatear
        const data = rows.map(r => ({
            ...r,
            'Total': parseFloat(r['Total']).toFixed(2),
            'Fecha': new Date(r['Fecha']).toLocaleDateString('es-CO')
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        ws['!cols'] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 25 },
            { wch: 25 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 50 },
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
        
        // Resumen
        const totalSales = rows.reduce((sum, r) => sum + parseFloat(r['Total'] || 0), 0);
        const summaryData = [{
            'Total Pedidos': rows.length,
            'Ventas Totales': totalSales.toFixed(2),
            'Promedio por Pedido': rows.length > 0 ? (totalSales / rows.length).toFixed(2) : '0',
            'Período': `${startDate || 'Inicio'} - ${endDate || 'Hoy'}`
        }];
        
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
        
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buf);
    });
};

// Export Tickets to Excel
export const exportTicketsToExcel = (req, res) => {
    const { startDate, endDate, status } = req.query;
    
    let sql = `
        SELECT 
            t.id,
            t.clientName as 'Cliente',
            t.clientPhone as 'Teléfono',
            t.deviceType as 'Tipo Equipo',
            t.brand as 'Marca',
            t.model as 'Modelo',
            t.serial as 'Serial',
            t.issueDescription as 'Problema',
            t.status as 'Estado',
            t.diagnosis as 'Diagnóstico',
            t.estimatedCost as 'Costo Estimado',
            t.technicianNotes as 'Notas Técnico',
            t.createdAt as 'Fecha Entrada',
            t.updatedAt as 'Última Actualización'
        FROM tickets t
        WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
        sql += ' AND t.createdAt >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND t.createdAt <= ?';
        params.push(endDate);
    }
    if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
    }
    
    sql += ' ORDER BY t.createdAt DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const data = rows.map(r => ({
            ...r,
            'Costo Estimado': parseFloat(r['Costo Estimado'] || 0).toFixed(2),
            'Fecha Entrada': new Date(r['Fecha Entrada']).toLocaleDateString('es-CO'),
            'Última Actualización': new Date(r['Última Actualización']).toLocaleDateString('es-CO')
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        ws['!cols'] = [
            { wch: 5 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 20 },
            { wch: 15 },
            { wch: 40 },
            { wch: 12 },
            { wch: 30 },
            { wch: 12 },
            { wch: 30 },
            { wch: 12 },
            { wch: 12 },
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
        
        // Resumen por estado
        db.all(`
            SELECT status, COUNT(*) as count, AVG(estimatedCost) as avgCost
            FROM tickets GROUP BY status
        `, [], (err, summaryRows) => {
            if (!err && summaryRows.length > 0) {
                const summaryWs = XLSX.utils.json_to_sheet(summaryRows.map(r => ({
                    'Estado': r.status,
                    'Cantidad': r.count,
                    'Costo Promedio': parseFloat(r.avgCost || 0).toFixed(2)
                })));
                XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Estados');
            }
            
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=tickets_${new Date().toISOString().split('T')[0]}.xlsx`);
            res.send(buf);
        });
    });
};

// Export Expenses to Excel
export const exportExpensesToExcel = (req, res) => {
    const { startDate, endDate, category } = req.query;
    
    let sql = `
        SELECT 
            e.id,
            e.description as 'Descripción',
            e.amount as 'Monto',
            e.category as 'Categoría',
            e.vendor as 'Proveedor',
            e.date as 'Fecha',
            e.paymentMethod as 'Método Pago',
            e.notes as 'Notas',
            e.createdAt as 'Registrado'
        FROM expenses e
        WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
        sql += ' AND e.date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND e.date <= ?';
        params.push(endDate);
    }
    if (category) {
        sql += ' AND e.category = ?';
        params.push(category);
    }
    
    sql += ' ORDER BY e.date DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const data = rows.map(r => ({
            ...r,
            'Monto': parseFloat(r['Monto']).toFixed(2),
            'Fecha': new Date(r['Fecha']).toLocaleDateString('es-CO'),
            'Registrado': new Date(r['Registrado']).toLocaleDateString('es-CO')
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        ws['!cols'] = [
            { wch: 5 },
            { wch: 40 },
            { wch: 12 },
            { wch: 15 },
            { wch: 20 },
            { wch: 12 },
            { wch: 15 },
            { wch: 30 },
            { wch: 12 },
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
        
        // Resumen por categoría
        db.all(`
            SELECT category, COUNT(*) as count, SUM(amount) as total
            FROM expenses GROUP BY category ORDER BY total DESC
        `, [], (err, summaryRows) => {
            if (!err && summaryRows.length > 0) {
                const summaryWs = XLSX.utils.json_to_sheet(summaryRows.map(r => ({
                    'Categoría': r.category,
                    'Cantidad': r.count,
                    'Total': parseFloat(r.total).toFixed(2)
                })));
                XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Categorías');
            }
            
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=gastos_${new Date().toISOString().split('T')[0]}.xlsx`);
            res.send(buf);
        });
    });
};

// Generate PDF Report
export const generatePDFReport = (req, res) => {
    const { type, startDate, endDate } = req.query;
    
    let title, sql, params = [];
    
    switch (type) {
        case 'sales':
            title = 'Reporte de Ventas';
            sql = `
                SELECT DATE(createdAt) as date, COUNT(*) as tickets, SUM(estimatedCost) as revenue
                FROM tickets
                WHERE createdAt >= ? AND createdAt <= ?
                GROUP BY DATE(createdAt) ORDER BY date DESC
            `;
            params = [startDate || '2020-01-01', endDate || new Date().toISOString()];
            break;
        case 'inventory':
            title = 'Reporte de Inventario';
            sql = `SELECT category, COUNT(*) as products, SUM(stock) as totalStock, SUM(price * stock) as totalValue FROM products GROUP BY category`;
            break;
        default:
            return res.status(400).json({ error: 'Tipo de reporte inválido. Usar: sales, inventory' });
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Crear PDF
        const doc = new PDFDocument({ margin: 50 });
        
        // Headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${new Date().toISOString().split('T')[0]}.pdf`);
        
        doc.pipe(res);
        
        // Contenido
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, { align: 'right' });
        doc.moveDown();
        
        if (startDate && endDate) {
            doc.text(`Período: ${startDate} - ${endDate}`);
            doc.moveDown();
        }
        
        // Tabla de datos
        doc.fontSize(10);
        const tableTop = doc.y;
        let y = tableTop;
        
        if (type === 'sales') {
            // Headers
            doc.text('Fecha', 50, y, { width: 100 });
            doc.text('Tickets', 160, y, { width: 80 });
            doc.text('Ingresos', 250, y, { width: 100 });
            y += 20;
            
            doc.moveTo(50, y).lineTo(450, y).stroke();
            y += 10;
            
            rows.forEach(row => {
                doc.text(row.date, 50, y, { width: 100 });
                doc.text(row.tickets.toString(), 160, y, { width: 80 });
                doc.text(`$${parseFloat(row.revenue || 0).toLocaleString()}`, 250, y, { width: 100 });
                y += 20;
            });
            
            // Total
            y += 10;
            doc.moveTo(50, y).lineTo(450, y).stroke();
            y += 10;
            const totalRevenue = rows.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0);
            doc.fontSize(12).text(`Total Ingresos: $${totalRevenue.toLocaleString()}`, 50, y);
        } else {
            // Inventory
            doc.text('Categoría', 50, y, { width: 150 });
            doc.text('Productos', 210, y, { width: 80 });
            doc.text('Stock', 300, y, { width: 80 });
            doc.text('Valor', 390, y, { width: 100 });
            y += 20;
            
            doc.moveTo(50, y).lineTo(490, y).stroke();
            y += 10;
            
            rows.forEach(row => {
                doc.text(row.category, 50, y, { width: 150 });
                doc.text(row.products.toString(), 210, y, { width: 80 });
                doc.text(row.totalStock.toString(), 300, y, { width: 80 });
                doc.text(`$${parseFloat(row.totalValue || 0).toLocaleString()}`, 390, y, { width: 100 });
                y += 20;
            });
            
            y += 10;
            doc.moveTo(50, y).lineTo(490, y).stroke();
            y += 10;
            const totalValue = rows.reduce((sum, r) => sum + parseFloat(r.totalValue || 0), 0);
            doc.fontSize(12).text(`Valor Total Inventario: $${totalValue.toLocaleString()}`, 50, y);
        }
        
        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text('La Bodega del Computador - Sistema de Gestión', { align: 'center' });
        
        doc.end();
    });
};
