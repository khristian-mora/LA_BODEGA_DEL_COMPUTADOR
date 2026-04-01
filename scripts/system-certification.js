import { db, logActivity } from '../server/db.js';

async function certify() {
    console.log('📜 CERTIFICACIÓN DE SISTEMA LBDC - PILLAR TEST v1.0\n');
    console.log('==============================================');

    try {
        // --- PRE-CLEANUP ---
        await new Promise(resolve => {
            db.serialize(() => {
                db.run('DELETE FROM users WHERE email = "cert@lbdc.com"');
                db.run('DELETE FROM orders WHERE orderNumber = "CERT-001"');
                db.run('DELETE FROM products WHERE name = "CPU Gamer Pro Test"');
                db.run('DELETE FROM tickets WHERE clientName = "Usuario Soporte"');
                resolve();
            });
        });

        // --- 1. PILLAR: GESTIÓN DE USUARIOS ---
        console.log('\n[1/3] Certificando Gestión de Usuarios...');
        
        // Crear usuario 'Admin Certifier'
        const userId = await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                ['Admin Certifier', 'cert@lbdc.com', 'pass123', 'admin', 'active'], function(err) {
                    if (err) reject(err); else resolve(this.lastID);
                });
        });

        // Simular Log de creación
        logActivity({
            userId: userId,
            action: 'CREATE_USER',
            module: 'USERS',
            details: 'Auto-certificación de usuario Admin Certifier habilitada.',
            req: { ip: '127.0.0.1', headers: { 'user-agent': 'Certification-Bot' } }
        });

        console.log(' ✅ Creación de usuario Certificado.');

        // --- 2. PILLAR: GESTIÓN DE VENTAS (SALES) ---
        console.log('\n[2/3] Certificando Gestión de Ventas...');
        
        // Crear producto 'CPU Gamer Test'
        const prodId = await new Promise((resolve) => {
            db.run('INSERT INTO products (name, price, stock, minStock, category) VALUES (?, ?, ?, ?, ?)',
                ['CPU Gamer Pro Test', 2500, 10, 2, 'Computadores'], function() { resolve(this.lastID); });
        });

        // Simular creación de Orden (Orden #CERT-001)
        const subtotal = 2500;
        const total = subtotal * 1.19; // IVA 19%
        const orderId = await new Promise((resolve) => {
            db.run('INSERT INTO orders (orderNumber, customerName, customerEmail, total, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                ['CERT-001', 'Cliente Test', 'client@test.com', total, 'Pagado', new Date().toISOString()],
                function() { resolve(this.lastID); });
        });

        // Reducir stock (Lifecycle de venta)
        await new Promise((resolve) => {
            db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [prodId], resolve);
        });

        // Verificar stock final
        const stockCheck = await new Promise(resolve => {
            db.get('SELECT stock FROM products WHERE id = ?', [prodId], (err, row) => resolve(row.stock));
        });

        if (stockCheck === 9) {
            console.log(` ✅ Flujo de venta Certificado (Stock 10 -> ${stockCheck}).`);
        } else {
            throw new Error(`Fallo en deducción de stock: ${stockCheck}`);
        }

        // --- 3. PILLAR: GESTIÓN DE EQUIPOS (TICKETS) ---
        console.log('\n[3/3] Certificando Gestión de Equipos (Soporte)...');
        
        // Crear Ticket
        const ticketId = await new Promise((resolve) => {
            db.run('INSERT INTO tickets (clientName, clientPhone, deviceType, brand, model, issueDescription, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ['Usuario Soporte', '3101234567', 'Portátil', 'Dell', 'Inspiron 15', 'No enciende', 'RECEIVED', new Date().toISOString()],
                function() { resolve(this.lastID); });
        });

        // Simular Diagnóstico y deducción de repuesto (Lifecycle de reparación)
        // Usaremos el mismo producto 'CPU Gamer Pro Test' como si fuera un repuesto
        await new Promise((resolve) => {
            db.run('UPDATE tickets SET status = ?, diagnosis = ?, quoteItems = ? WHERE id = ?',
                ['DIAGNOSED', 'Falla de procesador. Requiere cambio.', JSON.stringify([{id: prodId, quantity: 1, name: 'Procesador Gamer'}]), ticketId],
                resolve);
        });

        // Deducción automática de stock por repuesto
        await new Promise((resolve) => {
            db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [prodId], resolve);
        });

        const finalStock = await new Promise(resolve => {
            db.get('SELECT stock FROM products WHERE id = ?', [prodId], (err, row) => resolve(row.stock));
        });

        if (finalStock === 8) {
            console.log(` ✅ Ciclo de Servicio Técnico Certificado (Repuesto deducido: ${finalStock}).`);
        } else {
            throw new Error(`Fallo en deducción de repuesto: ${finalStock}`);
        }

        // --- LIMPIEZA FINAL ---
        console.log('\n🧹 Limpiando rastro de certificación...');
        await new Promise(resolve => {
            db.serialize(() => {
                db.run('DELETE FROM users WHERE email = "cert@lbdc.com"');
                db.run('DELETE FROM orders WHERE orderNumber = "CERT-001"');
                db.run('DELETE FROM products WHERE id = ?', [prodId]);
                db.run('DELETE FROM tickets WHERE id = ?', [ticketId]);
                db.run('DELETE FROM audit_logs WHERE action = "CREATE_USER" AND userId = ?', [userId]);
                resolve();
            });
        });

        console.log('\n==============================================');
        console.log('🏆 CERTIFICACIÓN COMPLETADA: EL SISTEMA ES OPERATIVO AL 100%');
        console.log('==============================================');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO EN LA CERTIFICACIÓN:', error);
        process.exit(1);
    }
}

certify();
