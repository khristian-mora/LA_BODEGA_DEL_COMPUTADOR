import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categories structure based on product recategorization
// Parent categories with their subcategories
const categoriesData = [
  {
    name: 'CABLES',
    slug: 'cables',
    children: [
      { name: 'USB', slug: 'cables-usb' },
      { name: 'HDMI', slug: 'cables-hdmi' },
      { name: 'RED', slug: 'cables-red' },
      { name: 'VGA', slug: 'cables-vga' },
      { name: 'SATA', slug: 'cables-sata' },
      { name: 'DISPLAY', slug: 'cables-display' },
      { name: 'EXTENSIONES', slug: 'cables-extensiones' },
    ],
  },
  {
    name: 'ADAPTADORES',
    slug: 'adaptadores',
    children: [
      { name: 'CARGADORES', slug: 'adaptadores-cargadores' },
      { name: 'MULTIPUERTO', slug: 'adaptadores-multipuerto' },
      { name: 'CONVERTIDORES', slug: 'adaptadores-convertidores' },
      { name: 'OTG', slug: 'adaptadores-otg' },
    ],
  },
  {
    name: 'PERIFERICOS',
    slug: 'perifericos',
    children: [
      { name: 'GAMER', slug: 'perifericos-gamer' },
      { name: 'LECTORES', slug: 'perifericos-lectores' },
      { name: 'COMBOS', slug: 'perifericos-combos' },
    ],
  },
  {
    name: 'AUDIO',
    slug: 'audio',
    children: [
      { name: 'PARLANTES', slug: 'audio-parlantes' },
      { name: 'AURICULARES', slug: 'audio-auriculares' },
    ],
  },
  {
    name: 'DISCOS DUROS',
    slug: 'discos-duros',
    children: [
      { name: 'ENCLOSURES', slug: 'discos-duros-enclosures' },
      { name: 'EXTERNOS', slug: 'discos-duros-externos' },
    ],
  },
  {
    name: 'CONSUMIBLES',
    slug: 'consumibles',
    children: [
      { name: 'TINTAS', slug: 'consumibles-tintas' },
      { name: 'PAPEL', slug: 'consumibles-papel' },
    ],
  },
  {
    name: 'MUEBLES',
    slug: 'muebles',
    children: [
      { name: 'BASES', slug: 'muebles-bases' },
      { name: 'VENTILADORES', slug: 'muebles-ventiladores' },
      { name: 'ACCESORIOS', slug: 'muebles-accesorios' },
    ],
  },
  {
    name: 'REDES',
    slug: 'redes',
    children: [
      { name: 'SWITCH', slug: 'redes-switch' },
      { name: 'ROUTER', slug: 'redes-router' },
      { name: 'BLUETOOTH', slug: 'redes-bluetooth' },
    ],
  },
  {
    name: 'ENERGIA',
    slug: 'energia',
    children: [
      { name: 'ESTABILIZADORES', slug: 'energia-estabilizadores' },
      { name: 'BANCOS DE CARGA', slug: 'energia-bancos-de-carga' },
    ],
  },
  {
    name: 'ACCESORIOS',
    slug: 'accesorios',
    children: [
      { name: 'FUNDAS', slug: 'accesorios-fundas' },
      { name: 'LIMPIEZA', slug: 'accesorios-limpieza' },
      { name: 'THERMAL', slug: 'accesorios-thermal' },
      { name: 'VARIOS', slug: 'accesorios-varios' },
    ],
  },
  // Standalone categories (no subcategories)
  { name: 'MOUSE', slug: 'mouse' },
  { name: 'TECLADOS', slug: 'teclados' },
  { name: 'IMPRESORAS', slug: 'impresoras' },
  { name: 'MONITORES', slug: 'monitores' },
  { name: 'SMART HOME', slug: 'smart-home' },
  { name: 'GABINETES', slug: 'gabinetes' },
  { name: 'FUENTES DE PODER', slug: 'fuentes-de-poder' },
  { name: 'UPS', slug: 'ups' },
  { name: 'PLACAS BASE', slug: 'placas-base' },
  { name: 'LAPTOPS', slug: 'laptops' },
  { name: 'ESCANERS', slug: 'escaners' },
  { name: 'SEGURIDAD', slug: 'seguridad' },
  { name: 'PROCESADORES', slug: 'procesadores' },
  { name: 'TABLETS', slug: 'tablets' },
  { name: 'MEMORIAS RAM', slug: 'memorias-ram' },
  { name: 'BATERIAS', slug: 'baterias' },
  { name: 'OTROS', slug: 'otros' },
];

async function main() {
  console.log('🌱 Starting category seeding...\n');

  // Clear existing categories (optional - remove if you want to keep existing data)
  await prisma.category.deleteMany();
  console.log('🗑️  Cleared existing categories');

  let parentCount = 0;
  let childCount = 0;

  for (const category of categoriesData) {
    // Create parent category
    const parent = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
      },
    });
    parentCount++;
    console.log(`✅ Created category: ${category.name}`);

    // Create children if they exist
    if ('children' in category && category.children) {
      for (const child of category.children) {
        await prisma.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            parentId: parent.id,
          },
        });
        childCount++;
        console.log(`  └─ Created subcategory: ${child.name}`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Parent categories: ${parentCount}`);
  console.log(`   Subcategories: ${childCount}`);
  console.log(`   Total: ${parentCount + childCount}`);
  console.log('\n✅ Category seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
