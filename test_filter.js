import fs from 'fs';
import path from 'path';

// Cargar productos del JSON de ejemplo
const data = JSON.parse(fs.readFileSync('./productos_enriquecidos_v3_FINAL.json', 'utf8'));

// Mapeo de rutas a categorías (copiado de Catalog.jsx)
const ROUTE_TO_CATEGORIES = {
    '/laptops': ['LAPTOPS'],
    '/components': ['PROCESADORES', 'PLACAS BASE', 'MEMORIAS RAM', 'DISCOS DUROS', 'GABINETES', 'FUENTES DE PODER'],
    '/accessories': ['ACCESORIOS/VARIOS', 'ACCESORIOS/FUNDAS', 'ACCESORIOS/LIMPIEZA', 'ACCESORIOS/THERMAL'],
    '/printers': ['IMPRESORAS', 'ESCANERS'],
    '/furniture': ['MUEBLES', 'MUEBLES/ACCESORIOS', 'MUEBLES/BASES', 'MUEBLES/VENTILADORES'],
    '/gaming': ['PERIFERICOS/GAMER'],
};

// Simular productos con estructura similar a la del frontend
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

console.log(`Total productos cargados: ${products.length}`);

// Función de filtrado similar a Catalog.jsx
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

// Probar cada ruta
for (const [route, categories] of Object.entries(ROUTE_TO_CATEGORIES)) {
    const filtered = filterProducts(route);
    console.log(`\nRuta: ${route}`);
    console.log(`Categorías esperadas: ${categories.join(', ')}`);
    console.log(`Productos encontrados: ${filtered.length}`);
    
    // Mostrar una muestra de categorías encontradas
    const foundCategories = [...new Set(filtered.map(p => p.category))];
    console.log(`Categorías encontradas: ${foundCategories.join(', ')}`);
}

// Probar filtrado por categoría individual
console.log('\n--- Probando filtrado por categoría individual ---');
const route = '/components';
const categories = ROUTE_TO_CATEGORIES[route];
console.log(`Ruta: ${route}, Categorías: ${categories.join(', ')}`);

// Probar cada categoría individual
for (const cat of categories) {
    const filtered = filterProducts(route, cat);
    console.log(`  Categoría ${cat}: ${filtered.length} productos`);
}