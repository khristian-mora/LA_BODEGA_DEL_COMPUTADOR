import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import path from 'path';

const prisma = new PrismaClient();
const SQLITE_PATH = path.join(__dirname, '..', '..', 'server', 'database.sqlite');

// Map SQLite categories to Prisma category IDs
async function getCategoryMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const prismaCategories = await prisma.category.findMany();

  for (const cat of prismaCategories) {
    // Map by slug or name
    map.set(cat.slug.toUpperCase(), cat.id);
    map.set(cat.name.toUpperCase(), cat.id);
    // Also map parent categories
    if (cat.parentId) {
      const parent = prismaCategories.find((p) => p.id === cat.parentId);
      if (parent) {
        map.set(`${parent.name.toUpperCase()}/${cat.name.toUpperCase()}`, cat.id);
      }
    }
  }

  return map;
}

async function main() {
  console.log('🔄 Starting SQLite to MySQL migration...\n');

  // Open SQLite database
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log(`📂 SQLite database: ${SQLITE_PATH}`);

  // Get category mapping
  const categoryMap = await getCategoryMap();
  console.log(`🗂️  Loaded ${categoryMap.size} category mappings`);

  // Get brand mapping
  const prismaBrands = await prisma.brand.findMany();
  const brandMap = new Map<string, number>();
  for (const brand of prismaBrands) {
    brandMap.set(brand.name.toUpperCase(), brand.id);
  }
  console.log(`🏷️  Loaded ${brandMap.size} brand mappings`);

  // Read products from SQLite
  const products = sqlite.prepare('SELECT * FROM products').all() as any[];
  console.log(`📦 Found ${products.length} products in SQLite\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    try {
      // Check if product already exists
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Parse specs JSON
      let specs: any = {};
      try {
        specs = JSON.parse(product.specs || '{}');
      } catch {
        specs = {};
      }

      // Determine category ID
      let categoryId: number | null = null;
      if (product.category && product.category !== 'OTROS') {
        // Try exact match first
        categoryId = categoryMap.get(product.category.toUpperCase()) || null;

        // Try partial match for subcategories
        if (!categoryId && product.category.includes('/')) {
          const parts = product.category.split('/');
          const parentName = parts[0];
          const childName = parts.slice(1).join('/');
          const key = `${parentName.toUpperCase()}/${childName.toUpperCase()}`;
          categoryId = categoryMap.get(key) || null;
        }

        // Try just parent category
        if (!categoryId && product.category.includes('/')) {
          const parentName = product.category.split('/')[0];
          categoryId = categoryMap.get(parentName.toUpperCase()) || null;
        }
      }

      // Determine brand
      let brandId: number | null = null;
      const brandName = specs.brand || product.description?.match(/(?:^|\s)([A-Z][A-Z0-9]+(?:\s[A-Z0-9]+)*?)(?:\s|$)/)?.[1];
      if (brandName) {
        brandId = brandMap.get(brandName.toUpperCase()) || null;

        // Create brand if it doesn't exist
        if (!brandId && brandName.length > 1) {
          const newBrand = await prisma.brand.create({
            data: {
              name: brandName,
              slug: brandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            },
          });
          brandId = newBrand.id;
          brandMap.set(brandName.toUpperCase(), newBrand.id);
        }
      }

      // Create product
      await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.description || null,
          categoryId: categoryId,
          brandId: brandId,
          price: product.price || 0,
          stock: product.stock || 0,
          stockMinimo: product.minStock || 2,
          images: product.image ? [product.image] : null,
          specsJson: specs,
          featured: product.featured === 1 || product.featured === true,
          supplierEmail: product.supplierEmail || null,
          builderCategory: specs.category || product.category || 'OTROS',
        },
      });

      created++;
      if (created % 100 === 0) {
        console.log(`  ✅ Migrated ${created} products...`);
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ Error migrating product "${product.name}":`, error);
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped (existing): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total processed: ${products.length}`);

  // Get final counts
  const totalProducts = await prisma.product.count();
  const totalCategories = await prisma.category.count();
  const totalBrands = await prisma.brand.count();

  console.log(`\n📦 Database counts:`);
  console.log(`   Products: ${totalProducts}`);
  console.log(`   Categories: ${totalCategories}`);
  console.log(`   Brands: ${totalBrands}`);

  console.log('\n✅ Migration complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
