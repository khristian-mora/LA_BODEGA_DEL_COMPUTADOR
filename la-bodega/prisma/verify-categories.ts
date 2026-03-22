import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying categories in database...\n');

  const categories = await prisma.category.findMany({
    include: {
      children: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const parents = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  console.log(`📊 Category Statistics:`);
  console.log(`   Total categories: ${categories.length}`);
  console.log(`   Parent categories: ${parents.length}`);
  console.log(`   Subcategories: ${children.length}`);
  console.log('');

  // Group by parent
  const grouped: Record<string, typeof children> = {};
  for (const parent of parents) {
    const kids = categories.filter((c) => c.parentId === parent.id);
    grouped[parent.name] = kids;
  }

  // Display hierarchy
  for (const [parentName, kids] of Object.entries(grouped)) {
    if (kids.length > 0) {
      console.log(`📁 ${parentName}`);
      for (const kid of kids) {
        console.log(`   └─ ${kid.name}`);
      }
    } else {
      console.log(`📄 ${parentName}`);
    }
  }

  // Display standalone categories
  const standalone = parents.filter(
    (p) => !grouped[p.name] || grouped[p.name].length === 0
  );
  if (standalone.length > 0) {
    console.log('\n📄 Standalone categories:');
    for (const cat of standalone) {
      console.log(`   - ${cat.name}`);
    }
  }

  console.log('\n✅ Verification complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error verifying categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
