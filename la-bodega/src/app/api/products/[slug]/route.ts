import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const product = await prisma.product.update({
      where: { slug },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        salePrice: body.salePrice,
        saleEndsAt: body.saleEndsAt ? new Date(body.saleEndsAt) : null,
        stock: body.stock,
        sku: body.sku,
        images: body.images,
        specsJson: body.specsJson,
        status: body.status,
        isNew: body.isNew,
        categoryId: body.categoryId,
        brandId: body.brandId,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await prisma.product.delete({
      where: { slug },
    });

    return NextResponse.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
