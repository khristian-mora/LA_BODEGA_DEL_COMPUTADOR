import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating seed data...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'laptops' },
      update: {},
      create: { name: 'Laptops', slug: 'laptops' },
    }),
    prisma.category.upsert({
      where: { slug: 'desktops' },
      update: {},
      create: { name: 'Computadores de Escritorio', slug: 'desktops' },
    }),
    prisma.category.upsert({
      where: { slug: 'monitores' },
      update: {},
      create: { name: 'Monitores', slug: 'monitores' },
    }),
    prisma.category.upsert({
      where: { slug: 'accesorios' },
      update: {},
      create: { name: 'Accesorios', slug: 'accesorios' },
    }),
    prisma.category.upsert({
      where: { slug: 'impresoras' },
      update: {},
      create: { name: 'Impresoras', slug: 'impresoras' },
    }),
  ])
  console.log('✅ Categories created')

  // Create brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'dell' },
      update: {},
      create: { name: 'Dell', slug: 'dell' },
    }),
    prisma.brand.upsert({
      where: { slug: 'hp' },
      update: {},
      create: { name: 'HP', slug: 'hp' },
    }),
    prisma.brand.upsert({
      where: { slug: 'lenovo' },
      update: {},
      create: { name: 'Lenovo', slug: 'lenovo' },
    }),
    prisma.brand.upsert({
      where: { slug: 'asus' },
      update: {},
      create: { name: 'Asus', slug: 'asus' },
    }),
    prisma.brand.upsert({
      where: { slug: 'samsung' },
      update: {},
      create: { name: 'Samsung', slug: 'samsung' },
    }),
    prisma.brand.upsert({
      where: { slug: 'lg' },
      update: {},
      create: { name: 'LG', slug: 'lg' },
    }),
  ])
  console.log('✅ Brands created')

  // Get category and brand IDs
  const laptopCat = categories.find(c => c.slug === 'laptops')
  const desktopCat = categories.find(c => c.slug === 'desktops')
  const monitorCat = categories.find(c => c.slug === 'monitores')
  const dell = brands.find(b => b.slug === 'dell')
  const hp = brands.find(b => b.slug === 'hp')
  const lenovo = brands.find(b => b.slug === 'lenovo')
  const asus = brands.find(b => b.slug === 'asus')
  const samsung = brands.find(b => b.slug === 'samsung')
  const lg = brands.find(b => b.slug === 'lg')

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'dell-inspiron-15' },
      update: {},
      create: {
        name: 'Dell Inspiron 15 3520',
        slug: 'dell-inspiron-15',
        description: 'Laptop Dell Inspiron 15 con procesador Intel Core i5, 8GB RAM, 256GB SSD. Pantalla de 15.6" Full HD. Ideal para trabajo y estudio.',
        categoryId: laptopCat!.id,
        brandId: dell!.id,
        price: 2499000,
        stock: 15,
        sku: 'DELL-INS-15-3520',
        images: JSON.stringify(['https://placehold.co/600x400/2563eb/white?text=Dell+Inspiron+15']),
        specsJson: JSON.stringify({
          'Procesador': 'Intel Core i5-1235U',
          'RAM': '8GB DDR4',
          'Almacenamiento': '256GB SSD NVMe',
          'Pantalla': '15.6" FHD (1920x1080)',
          'Sistema': 'Windows 11 Home',
          'Batería': '54Wh',
          'Peso': '1.65 kg'
        }),
        status: 'ACTIVO',
        isNew: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'lenovo-thinkpad-e14' },
      update: {},
      create: {
        name: 'Lenovo ThinkPad E14 Gen 4',
        slug: 'lenovo-thinkpad-e14',
        description: 'Laptop profesional Lenovo ThinkPad E14 con Intel Core i7, 16GB RAM, 512GB SSD. Diseño robusto y duradero.',
        categoryId: laptopCat!.id,
        brandId: lenovo!.id,
        price: 3299000,
        salePrice: 2899000,
        stock: 8,
        sku: 'LEN-THK-E14-4',
        images: JSON.stringify(['https://placehold.co/600x400/16a34a/white?text=Lenovo+ThinkPad']),
        specsJson: JSON.stringify({
          'Procesador': 'Intel Core i7-1255U',
          'RAM': '16GB DDR4',
          'Almacenamiento': '512GB SSD',
          'Pantalla': '14" FHD IPS',
          'Sistema': 'Windows 11 Pro',
          'Batería': '45Wh',
          'Peso': '1.59 kg'
        }),
        status: 'ACTIVO',
        isNew: false,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'asus-vivobook-15' },
      update: {},
      create: {
        name: 'Asus VivoBook 15 X1502',
        slug: 'asus-vivobook-15',
        description: 'Laptop Asus VivoBook 15 con AMD Ryzen 7, 16GB RAM, 512GB SSD. Diseño elegante y rendimiento excepcional.',
        categoryId: laptopCat!.id,
        brandId: asus!.id,
        price: 2799000,
        stock: 12,
        sku: 'ASUS-VB-15-X1502',
        images: JSON.stringify(['https://placehold.co/600x400/dc2626/white?text=Asus+VivoBook']),
        specsJson: JSON.stringify({
          'Procesador': 'AMD Ryzen 7 7730U',
          'RAM': '16GB DDR4',
          'Almacenamiento': '512GB SSD',
          'Pantalla': '15.6" FHD',
          'Sistema': 'Windows 11 Home',
          'Batería': '50Wh',
          'Peso': '1.7 kg'
        }),
        status: 'ACTIVO',
        isNew: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'dell-optiplex-7090' },
      update: {},
      create: {
        name: 'Dell OptiPlex 7090 Tower',
        slug: 'dell-optiplex-7090',
        description: 'Computador de escritorio Dell OptiPlex con Intel Core i5, 16GB RAM, 512GB SSD. Potencia y confiabilidad empresarial.',
        categoryId: desktopCat!.id,
        brandId: dell!.id,
        price: 3199000,
        stock: 5,
        sku: 'DELL-OPT-7090-T',
        images: JSON.stringify(['https://placehold.co/600x400/4f46e5/white?text=Dell+OptiPlex']),
        specsJson: JSON.stringify({
          'Procesador': 'Intel Core i5-11500',
          'RAM': '16GB DDR4',
          'Almacenamiento': '512GB SSD',
          'Gráficos': 'Intel UHD Graphics 750',
          'Sistema': 'Windows 10 Pro',
          'Fuente': '260W',
          'Unidad óptica': 'DVD/RW'
        }),
        status: 'ACTIVO',
        isNew: false,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'samsung-monitor-27' },
      update: {},
      create: {
        name: 'Samsung S27F350FH LED 27"',
        slug: 'samsung-monitor-27',
        description: 'Monitor Samsung 27" Full HD con tecnología LED. Diseño elegante y colors vibrantes.',
        categoryId: monitorCat!.id,
        brandId: samsung!.id,
        price: 899000,
        stock: 25,
        sku: 'SAM-S27-F350',
        images: JSON.stringify(['https://placehold.co/600x400/0891b2/white?text=Samsung+Monitor+27']),
        specsJson: JSON.stringify({
          'Tamaño': '27"',
          'Resolución': '1920x1080 Full HD',
          'Tipo panel': 'IPS',
          'Frecuencia': '60Hz',
          'Tiempo respuesta': '4ms',
          'Conexiones': 'HDMI, VGA',
          'Montaje VESA': 'Sí'
        }),
        status: 'ACTIVO',
        isNew: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'lg-monitor-24' },
      update: {},
      create: {
        name: 'LG 24MK600M-B 24" Full HD',
        slug: 'lg-monitor-24',
        description: 'Monitor LG 24" Full HD con panel IPS y bordes ultradelgados. Perfecto para trabajo y entretenimiento.',
        categoryId: monitorCat!.id,
        brandId: lg!.id,
        price: 749000,
        stock: 20,
        sku: 'LG-24MK600M',
        images: JSON.stringify(['https://placehold.co/600x400/7c3aed/white?text=LG+Monitor+24']),
        specsJson: JSON.stringify({
          'Tamaño': '24"',
          'Resolución': '1920x1080 Full HD',
          'Tipo panel': 'IPS',
          'Frecuencia': '75Hz',
          'Tiempo respuesta': '5ms',
          'Conexiones': 'HDMI, VGA',
          'Alt speakers': '2x 5W'
        }),
        status: 'ACTIVO',
        isNew: false,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'hp-laserjet-pro' },
      update: {},
      create: {
        name: 'HP LaserJet Pro M404dn',
        slug: 'hp-laserjet-pro',
        description: 'Impresora láser HP monochrome de alta velocidad. Ideal para oficina.',
        categoryId: categories.find(c => c.slug === 'impresoras')!.id,
        brandId: hp!.id,
        price: 1599000,
        stock: 7,
        sku: 'HP-LJ-M404DN',
        images: JSON.stringify(['https://placehold.co/600x400/ea580c/white?text=HP+LaserJet']),
        specsJson: JSON.stringify({
          'Tipo': 'Láser monocromático',
          'Velocidad': '40 ppm',
          'Resolución': '1200 x 1200 dpi',
          'Ciclo mensual': '80,000 páginas',
          'Conexión': 'USB, Ethernet',
          'Duplex': 'Automático',
          'Tiempo primera página': '6.3 segundos'
        }),
        status: 'ACTIVO',
        isNew: true,
      },
    }),
  ])
  console.log('✅ Products created')

  // Create an admin user
  const adminEmail = 'admin@labodega.com'
  const adminPassword = 'admin123' // In production, use proper hashing
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Administrador',
      email: adminEmail,
      phone: '3001234567',
      role: 'ADMIN',
      passwordHash: adminPassword, // Note: In real app, this should be hashed
    },
  })
  console.log('✅ Admin user created:', adminUser.email)

  // Create a technician user
  const techEmail = 'tecnico@labodega.com'
  const techUser = await prisma.user.upsert({
    where: { email: techEmail },
    update: {},
    create: {
      name: 'Técnico Principal',
      email: techEmail,
      phone: '3009876543',
      role: 'TECNICO',
      passwordHash: 'tecnico123',
    },
  })
  console.log('✅ Technician user created:', techUser.email)

  // Create a test customer
  const customerEmail = 'cliente@test.com'
  const customerUser = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      name: 'Cliente Prueba',
      email: customerEmail,
      phone: '3105551234',
      role: 'CLIENTE',
      passwordHash: 'cliente123',
    },
  })
  console.log('✅ Customer user created:', customerUser.email)

  // Create a coupon
  await prisma.coupon.upsert({
    where: { code: 'BIENVENIDO10' },
    update: {},
    create: {
      code: 'BIENVENIDO10',
      type: 'PORCENTAJE',
      value: 10,
      minPurchase: 100000,
      active: true,
    },
  })
  console.log('✅ Coupon created: BIENVENIDO10 (10% off)')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📝 Test credentials:')
  console.log('   Admin: admin@labodega.com / admin123')
  console.log('   Técnico: tecnico@labodega.com / tecnico123')
  console.log('   Cliente: cliente@test.com / cliente123')
  console.log('\n🛒 Test coupon: BIENVENIDO10 (10% off, min $100,000)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
