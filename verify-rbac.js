import fetch from 'node-fetch'; // Fallback if internal fetch has issues, but Node 22 should be fine. Actually, let's use global fetch.

const BASE_URL = 'http://localhost:3000/api';

async function verifyRBAC() {
    console.log('🚀 Iniciando Auditoría de Seguridad RBAC...');
    console.log('-------------------------------------------');

    try {
        // 1. Iniciar sesión como administrador (admin@labodega.com / admin123)
        const adminLoginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@labodega.com', password: 'admin123' })
        });
        
        if (!adminLoginRes.ok) throw new Error('Fallo login administrador (¿Credenciales de seed?)');
        const { token: adminToken } = await adminLoginRes.json();
        console.log('✅ Admin logeado correctamente.');

        // 2. Crear un usuario de prueba como Técnico si no existe
        const techEmail = 'test_tech@labodega.com';
        const techRes = await fetch(`${BASE_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ name: 'Técnico de Auditoría', email: techEmail, password: 'password123', role: 'técnico', status: 'active' })
        });
        console.log(`ℹ️ Creación de Técnico de prueba: ${techRes.status}`);

        // 3. Iniciar sesión como Técnico
        const techLoginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: techEmail, password: 'password123' })
        });
        const { token: techToken } = await techLoginRes.json();
        console.log('✅ Técnico de prueba logeado correctamente.');

        // --- BATERÍA DE PRUEBAS ---
        const tests = [
            { name: 'Técnico -> Ver Citas', url: '/appointments', method: 'GET', token: techToken, expected: 200 },
            { name: 'Técnico -> Ver Tickets', url: '/tickets', method: 'GET', token: techToken, expected: 200 },
            { name: 'Técnico -> Ver Gastos (BLOQUEADO)', url: '/expenses', method: 'GET', token: techToken, expected: 403 },
            { name: 'Técnico -> Ver Devoluciones (BLOQUEADO)', url: '/returns', method: 'GET', token: techToken, expected: 403 },
            { name: 'Técnico -> Auditoría (BLOQUEADO)', url: '/audit/logs', method: 'GET', token: techToken, expected: 403 },
            { name: 'Técnico -> Eliminar Cliente (BLOQUEADO)', url: '/customers/1', method: 'DELETE', token: techToken, expected: 403 },
            { name: 'Admin -> Ver Gastos', url: '/expenses', method: 'GET', token: adminToken, expected: 200 },
            { name: 'Admin -> Ver Auditoría', url: '/audit/logs', method: 'GET', token: adminToken, expected: 200 }
        ];

        console.log('\n📊 Ejecutando pruebas de acceso:');
        for (const test of tests) {
            const res = await fetch(`${BASE_URL}${test.url}`, {
                method: test.method,
                headers: { 'Authorization': `Bearer ${test.token}` }
            });
            const success = res.status === test.expected;
            console.log(`${success ? '✅' : '❌'} ${test.name}: Recibido ${res.status} (Esperado ${test.expected})`);
        }

    } catch (error) {
        console.error('❌ Error fatal en auditoría:', error.message);
        console.log('ℹ️ Asegúrate de que "npm run server" esté activo en el puerto 3000.');
    }
}

verifyRBAC();
