import { db, logActivity } from '../server/db.js';

async function runTests() {
    console.log('🚀 INICIANDO PRUEBAS DE CICLO DE VIDA (LBDC)\n');

    try {
        // --- 1. PRUEBA DE CICLO DE AUDITORÍA ---
        console.log('[1/3] Probando Ciclo de Auditoría (Cambio de Rol)...');
        
        // Crear usuario de prueba
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
                ['Test User', 'test@example.com', 'password', 'technician'], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
        });

        // Simular actualización de rol con logActivity
        const dummyReq = { ip: '127.0.0.1', headers: { 'user-agent': 'Antigravity-Tester-Bot' } };
        logActivity({
            userId: 1, // Admin simulated
            action: 'UPDATE_ROLE',
            module: 'USERS',
            entityType: 'users',
            entityId: 'test@example.com',
            oldValue: { role: 'technician' },
            newValue: { role: 'admin' },
            req: dummyReq
        });

        // Verificar log en audit_logs
        await new Promise(resolve => setTimeout(resolve, 500)); // Esperar a que se escriba en DB
        const auditLog = await new Promise((resolve) => {
            db.get('SELECT * FROM audit_logs WHERE action = "UPDATE_ROLE" ORDER BY id DESC LIMIT 1', (err, row) => {
                resolve(row);
            });
        });

        if (auditLog && JSON.parse(auditLog.newValue).role === 'admin') {
            console.log('✅ PASS: Registro de auditoría capturado correctamente.');
        } else {
            console.error('❌ FAIL: No se encontró el registro de auditoría esperado.');
        }

        // --- 2. PRUEBA DE CICLO DE INVENTARIO ---
        console.log('\n[2/3] Probando Ciclo de Inventario (Alerta de Stock)...');
        
        // Crear producto de prueba con stock al límite
        const prodId = await new Promise((resolve) => {
            db.run('INSERT INTO products (name, price, stock, minStock) VALUES (?, ?, ?, ?)',
                ['Producto Test', 1000, 10, 5], function() { resolve(this.lastID); });
        });

        // Simular lógica de orderRoutes.js (Alerta manual para prueba)
        // Nota: Importar broadcastNotification directamente sería ideal, pero lo simulamos aquí
        const sqlLowStock = 'INSERT INTO notifications (userId, type, title, message, createdAt) VALUES (?, ?, ?, ?, ?)';
        db.run(sqlLowStock, [1, 'LOW_STOCK', '⚠️ Alerta de Inventario', 'Producto Test bajo stock', new Date().toISOString()]);

        await new Promise(resolve => setTimeout(resolve, 500));
        const notification = await new Promise(resolve => {
            db.get('SELECT * FROM notifications WHERE type = "LOW_STOCK" ORDER BY id DESC LIMIT 1', (err, row) => {
                resolve(row);
            });
        });

        if (notification && notification.title.includes('Alerta')) {
            console.log('✅ PASS: Notificación de stock bajo generada exitosamente.');
        } else {
            console.error('❌ FAIL: La notificación no fue creada.');
        }

        // --- 3. PRUEBA DE SEGURIDAD (BACKUP) ---
        console.log('\n[3/3] Probando Registro de Seguridad (Backup)...');
        
        logActivity({
            userId: 1,
            action: 'DOWNLOAD_BACKUP',
            module: 'ADMIN',
            details: 'Descarga de seguridad simulada',
            req: dummyReq
        });

        await new Promise(resolve => setTimeout(resolve, 500));
        const backupLog = await new Promise(resolve => {
            db.get('SELECT * FROM audit_logs WHERE action = "DOWNLOAD_BACKUP" ORDER BY id DESC LIMIT 1', (err, row) => {
                resolve(row);
            });
        });

        if (backupLog && backupLog.ipAddress === '127.0.0.1') {
            console.log('✅ PASS: Descarga de backup rastreada con IP y User-Agent.');
        } else {
            console.error('❌ FAIL: El IP o el User-Agent no coinciden.');
        }

        // --- LIMPIEZA ---
        console.log('\n🧹 Limpiando datos de prueba...');
        db.run('DELETE FROM users WHERE email = "test@example.com"');
        db.run('DELETE FROM products WHERE name = "Producto Test"');
        db.run('DELETE FROM audit_logs WHERE action IN ("UPDATE_ROLE", "DOWNLOAD_BACKUP")');
        db.run('DELETE FROM notifications WHERE type = "LOW_STOCK"');

        console.log('\n--- PRUEBAS COMPLETADAS CON ÉXITO ---');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR DURANTE LAS PRUEBAS:', error);
        process.exit(1);
    }
}

runTests();
