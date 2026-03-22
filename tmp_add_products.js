import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./server/database.sqlite');
const products = [
    { name: 'Monitor Gamer ASUS TUF', price: 1200000, category: 'Gaming', stock: 5, description: 'Pantalla 144Hz 1ms' },
    { name: 'Silla Gamer RGB Ergonómica', price: 850000, category: 'Furniture', stock: 3, description: 'Silla para largas jornadas' },
    { name: 'Impresora Epson EcoTank L3250', price: 950000, category: 'Printers', stock: 10, description: 'Multifuncional WiFi' },
    { name: 'Tarjeta de Video RTX 4070', price: 3500000, category: 'Components', stock: 4, description: 'Potencia gráfica' },
    { name: 'Memoria RAM 16GB DDR4', price: 250000, category: 'Components', stock: 20, description: 'Velocidad pura' },
    { name: 'Portátil Gaming MSI Katana', price: 4200000, category: 'Gaming', stock: 2, description: 'Procesador i7 13va gen' }
];

products.forEach(p => {
    db.run("INSERT INTO products (name, price, category, stock, description, minStock) VALUES (?, ?, ?, ?, ?, ?)", 
    [p.name, p.price, p.category, p.stock, p.description, 2], (err) => {
        if (err) console.error(err);
        else console.log(`Inserted ${p.name}`);
    });
});
db.close();
