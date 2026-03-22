import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'server/database.sqlite');

const db = new sqlite3.Database(dbPath);

const runMigration = () => {
    console.log('Running migration...');

    db.serialize(() => {
        // Add findings column
        db.run("ALTER TABLE tickets ADD COLUMN findings TEXT", (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('Column details already exists (findings)');
                } else {
                    console.error('Error adding findings column:', err.message);
                }
            } else {
                console.log('Added findings column');
            }
        });

        // Add recommendations column
        db.run("ALTER TABLE tickets ADD COLUMN recommendations TEXT", (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('Column recommendations already exists');
                } else {
                    console.error('Error adding recommendations column:', err.message);
                }
            } else {
                console.log('Added recommendations column');
            }
        });
    });

    setTimeout(() => {
        console.log('Migration finished');
        db.close();
    }, 1000);
};

runMigration();
