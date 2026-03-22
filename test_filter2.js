import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./productos_enriquecidos_v3_FINAL.json', 'utf8'));

// Mapeo actualizado
const ROUTE_TO_CATEGORIES = {
    '/laptops': ['LAPTOPS'],
    '/components': ['PROCESADORES', 'PLACAS BASE', 'MEMORIAS RAM', 'DISCOS DUROS', 'GABINETES', 'FUENTES DE PODER'],
    '/accessories': ['MOUSE', 'TECLADOS', 'AUDIO', 'CABLES', 'ADAPTADORES/CARGADORES', 'MONITORES', 'REDES/ROUTER', 'REDES/SWITCH', 'SEGURIDAD', 'UPS', 'BATERIAS', 'TABLETS', 'OTROS'],
    '/printers': ['IMPRESORAS', 'ESCANERS', 'CONSUMIBLES/TINTAS'],
    '/furniture': ['MUEBLES'],
    '/gaming': ['MOUSE', 'TECLADOS', 'AUDIO', 'MONITORES'],
};

const products = data.map((p, idx) => ({
    id: idx + 1,
    name: p.nombre,
    price: p.precio,
    category: p.categoria,
    specs: { marca: p.marca },
    description: p.descripcion,
    image: p.imagenes && p.imagenes.length > 0 ? p.imagenes[0].url : '',
    stock: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : 0,
}));

console.log(`Total productos: ${products.length}`);

function filterProducts(pathname, selectedCategory = 'ALL') {
    const categoriesToShow = ROUTE_TO_CATEGORIES[pathname] || [...new Set(products.map(p => p.category))];
    let result = products;
    
    if (selectedCategory === 'ALL') {
        result = result.filter(p => categoriesToShow.includes(p.category));
    } else {
        result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
}

for (const [route, categories] of Object.entries(ROUTE_TO_CATEGORIES)) {
    const filtered = filterProducts(route);
    console.log(`\nRuta: ${route}`);
    console.log(`Categorías esperadas: ${categories.join(', ')}`);
    console.log(`Productos encontrados: ${filtered.length}`);
    
    const foundCategories = [...new Set(filtered.map(p => p.category))];
    console.log(`Categorías encontradas: ${foundCategories.join(', ')}`);
}

// Verificar duplicados entre rutas
console.log('\n--- Verificando superposición entre rutas ---');
const routeProducts = {};
for (const route of Object.keys(ROUTE_TO_CATEGORIES)) {
    routeProducts[route] = filterProducts(route);
}

// Para cada producto, ver en cuántas rutas aparece
const productRoutes = {};
products.forEach(p => {
    productRoutes[p.id] = [];
});

for (const [route, prods] of Object.entries(routeProducts)) {
    prods.forEach(p => {
        productRoutes[p.id].push(route);
    });
}

// Contar productos que aparecen en múltiples rutas
let overlapping = 0;
for (const [id, routes] of Object.entries(productRoutes)) {
    if (routes.length > 1) {
        overlapping++;
        if (overlapping <= 5) {
            const prod = products.find(p => p.id == id);
            console.log(`Producto "${prod.name}" (categoría: ${prod.category}) aparece en rutas: ${routes.join(', ')}`);
        }
    }
}
console.log(`Total productos que aparecen en múltiples rutas: ${overlapping}`);