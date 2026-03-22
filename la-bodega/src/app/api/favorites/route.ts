import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: (session.user as any).id },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      products: favorites.map(f => f.product),
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Error al obtener favoritos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: (session.user as any).id,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Ya está en favoritos' });
    }

    await prisma.favorite.create({
      data: {
        userId: (session.user as any).id,
        productId,
      },
    });

    return NextResponse.json({ message: 'Añadido a favoritos' }, { status: 201 });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Error al añadir favorito' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: (session.user as any).id,
        productId,
      },
    });

    return NextResponse.json({ message: 'Eliminado de favoritos' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Error al eliminar favorito' }, { status: 500 });
  }
}
