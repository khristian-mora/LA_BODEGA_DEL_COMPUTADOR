import { db } from './server/db.js';
import bcrypt from 'bcryptjs';

console.log('Verificando usuarios en la base de datos...\n');

// List all users
db.all('SELECT id, name, email, role, status, createdAt FROM users ORDER BY id', [], (err, rows) => {
    if (err) {
        console.error('Error al consultar usuarios:', err);
        process.exit(1);
    }
    
    console.log(`Total de usuarios encontrados: ${rows.length}\n`);
    
    if (rows.length === 0) {
        console.log('No hay usuarios en la base de datos.');
        console.log('El usuario admin@labodega.com debería crearse automáticamente al iniciar el servidor.');
    } else {
        console.log('Usuarios encontrados:');
        console.log('====================');
        rows.forEach(user => {
            console.log(`ID: ${user.id}`);
            console.log(`Nombre: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Rol: ${user.role}`);
            console.log(`Estado: ${user.status}`);
            console.log(`Creado: ${user.createdAt}`);
            console.log('-------------------');
        });
    }
    
    // Check if admin user exists specifically
    db.get('SELECT * FROM users WHERE email = ?', ['admin@labodega.com'], (err, adminUser) => {
        if (err) {
            console.error('Error al buscar admin:', err);
            process.exit(1);
        }
        
        console.log('\nVerificación específica del admin:');
        if (adminUser) {
            console.log('✓ Usuario admin@labodega.com EXISTE en la base de datos');
            console.log(`  - Estado: ${adminUser.status}`);
            console.log(`  - Rol: ${adminUser.role}`);
            
            // Test password verification
            bcrypt.compare('admin123', adminUser.password, (err, isMatch) => {
                if (err) {
                    console.error('Error al verificar contraseña:', err);
                } else if (isMatch) {
                    console.log('✓ La contraseña "admin123" es CORRECTA');
                } else {
                    console.log('✗ La contraseña "admin123" NO coincide');
                    console.log('  La contraseña en la base de datos no corresponde a "admin123"');
                }
                process.exit(0);
            });
        } else {
            console.log('✗ Usuario admin@labodega.com NO EXISTE en la base de datos');
            console.log('  Esto es normal si el servidor nunca se ha iniciado.');
            console.log('  El usuario se creará automáticamente al iniciar el servidor.');
            process.exit(0);
        }
    });
});