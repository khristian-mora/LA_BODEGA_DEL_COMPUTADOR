import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./productos_enriquecidos_v3_FINAL.json', 'utf8'));

// Obtener categorías únicas
const categories = new Set(data.map(p => p.categoria));
const sorted = [...categories].sort();

console.log(`Total categorías únicas: ${sorted.length}`);
console.log('Categorías:');
sorted.forEach(cat => console.log(`  - ${cat}`));

// Contar productos por categoría
const countByCategory = {};
data.forEach(p => {
    countByCategory[p.categoria] = (countByCategory[p.categoria] || 0) + 1;
});

console.log('\nCategorías con más productos:');
Object.entries(countByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

// Buscar categorías que contengan palabras clave
console.log('\nCategorías que contienen "ACCESORIO":');
sorted.filter(c => c.toLowerCase().includes('accesorio')).forEach(c => console.log(`  ${c}`));

console.log('\nCategorías que contienen "GAMER":');
sorted.filter(c => c.toLowerCase().includes('gamer')).forEach(c => console.log(`  ${c}`));

console.log('\nCategorías que contienen "LAPTOP":');
sorted.filter(c => c.toLowerCase().includes('laptop')).forEach(c => console.log(`  ${c}`));

console.log('\nCategorías que contienen "MUEBLE":');
sorted.filter(c => c.toLowerCase().includes('mueble')).forEach(c => console.log(`  ${c}`));

console.log('\nCategorías que contienen "IMPRESORA":');
sorted.filter(c => c.toLowerCase().includes('impresora')).forEach(c => console.log(`  ${c}`));