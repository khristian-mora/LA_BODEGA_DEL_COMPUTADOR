import { db } from '../server/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function runAudit() {
    console.log('--- LBDC SECURITY & INTEGRITY AUDIT ---');

    // 1. Environment Variables Check
    console.log('\n[1/5] Checking Environment Variables...');
    if (!process.env.JWT_SECRET) {
        console.error('❌ CRITICAL: JWT_SECRET is not defined in .env!');
    } else {
        console.log('✅ JWT_SECRET is present.');
    }

    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ WARNING: NODE_ENV is not set to "production".');
    } else {
        console.log('✅ NODE_ENV is set to production.');
    }

    // 2. Database Tables Check
    console.log('\n[2/5] Checking Database Integrity...');
    const tables = ['users', 'products', 'orders', 'audit_logs', 'notifications'];
    for (const table of tables) {
        const exists = await new Promise(resolve => {
            db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`, (err, row) => {
                resolve(!!row);
            });
        });
        if (exists) {
            console.log(`✅ Table "${table}" exists.`);
        } else {
            console.error(`❌ Table "${table}" is MISSING!`);
        }
    }

    // 3. Admin User Check
    console.log('\n[3/5] Checking Admin User...');
    const adminExists = await new Promise(resolve => {
        db.get('SELECT id FROM users WHERE role = "admin" AND status = "active" LIMIT 1', (err, row) => {
            resolve(!!row);
        });
    });
    if (adminExists) {
        console.log('✅ At least one active Admin user found.');
    } else {
        console.error('❌ NO ACTIVE ADMIN FOUND! System might be inaccessible.');
    }

    // 4. Audit Log Traceability
    console.log('\n[4/5] Checking Audit Log Traceability...');
    const logCount = await new Promise(resolve => {
        db.get('SELECT COUNT(*) as count FROM audit_logs', (err, row) => {
            resolve(row?.count || 0);
        });
    });
    console.log(`📊 Total audit logs recorded: ${logCount}`);
    
    // 5. Stock Alert Integrity
    console.log('\n[5/5] Checking Inventory Alerting System...');
    const lowStockCount = await new Promise(resolve => {
        db.get('SELECT COUNT(*) as count FROM products WHERE stock <= minStock', (err, row) => {
            resolve(row?.count || 0);
        });
    });
    console.log(`⚠️ Products currently in Low Stock: ${lowStockCount}`);

    console.log('\n--- AUDIT COMPLETE ---');
    process.exit(0);
}

runAudit().catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
});
