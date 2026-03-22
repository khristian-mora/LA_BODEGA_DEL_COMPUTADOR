import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock') === 'true';
    const isNew = searchParams.get('isNew');
    const onSale = searchParams.get('onSale') === 'true';
    const sort = searchParams.get('sort') || 'createdAt_desc';

    const where: any = {
      status: 'ACTIVO',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (brand) {
      where.brand = { slug: brand };
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    if (isNew === 'true') {
      where.isNew = true;
    }

    if (onSale) {
      where.salePrice = { not: null };
      where.saleEndsAt = { gte: new Date() };
    }

    const [sortField, sortOrder] = sort.split('_');
    const orderBy: any = { [sortField]: sortOrder };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, categoryId, brandId, price, salePrice, saleEndsAt, stock, sku, images, specsJson, status, isNew } = body;

    if (!name || !slug || !price) {
      return NextResponse.json({ error: 'Nombre, slug y precio son requeridos' }, { status: 400 });
    }

    const existingSlug = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        brandId,
        price,
        salePrice,
        saleEndsAt: saleEndsAt ? new Date(saleEndsAt) : null,
        stock: stock || 0,
        sku,
        images: images || [],
        specsJson,
        status: status || 'ACTIVO',
        isNew: isNew || false,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
