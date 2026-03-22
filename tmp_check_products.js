import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./server/database.sqlite');
db.all("SELECT * FROM products", (err, rows) => {
    if (err) console.log(err);
    console.log(rows);
    db.close();
});
