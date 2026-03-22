import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./server/database.sqlite');
db.all("SELECT DISTINCT category FROM products", (err, rows) => {
    if (err) console.error(err);
    console.log(rows);
    db.close();
});
