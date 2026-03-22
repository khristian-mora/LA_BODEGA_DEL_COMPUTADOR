import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./server/database.sqlite');
db.run("UPDATE products SET category = 'Components' WHERE category = 'Componentes'", (err) => {
    if (err) console.error(err);
    console.log("Renamed 'Componentes' to 'Components'");
    db.close();
});
