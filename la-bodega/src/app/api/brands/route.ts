import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: { where: { status: 'ACTIVO' } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json({ error: 'Error al obtener marcas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, logoUrl } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 });
    }

    const existingSlug = await prisma.brand.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        logoUrl,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('Create brand error:', error);
    return NextResponse.json({ error: 'Error al crear marca' }, { status: 500 });
  }
}
