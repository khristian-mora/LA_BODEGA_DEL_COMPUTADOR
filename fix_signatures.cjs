const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const columns = [
    'signatureIntakeTech',
    'signatureIntakeClient',
    'signatureDeliveryTech',
    'signatureDeliveryClient'
];

db.serialize(() => {
    columns.forEach(col => {
        db.run(`ALTER TABLE tickets ADD COLUMN ${col} TEXT`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column ${col} already exists.`);
                } else {
                    console.error(`Error adding column ${col}:`, err.message);
                }
            } else {
                console.log(`Column ${col} added successfully.`);
            }
        });
    });
});

db.close();
