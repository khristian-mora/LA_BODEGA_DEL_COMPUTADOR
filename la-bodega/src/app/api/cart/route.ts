import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function getSessionId(request: NextRequest): string {
  const sessionId = request.cookies.get('sessionId')?.value;
  if (!sessionId) {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  return sessionId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = getSessionId(request);

    const where = session?.user
      ? { userId: (session.user as any).id }
      : { sessionId };

    const items = await prisma.cartItem.findMany({
      where,
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

    const subtotal = items.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.price;
      return sum + Number(price) * item.quantity;
    }, 0);

    return NextResponse.json({
      items,
      subtotal: subtotal.toFixed(2),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: 'Error al obtener carrito' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = getSessionId(request);
    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
    }

    const where = session?.user
      ? { userId_productId: { userId: (session.user as any).id, productId } }
      : { sessionId, productId };

    const existingItem = await prisma.cartItem.findFirst({ where });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: session?.user ? (session.user as any).id : null,
          sessionId: session?.user ? null : sessionId,
          productId,
          quantity,
        },
      });
    }

    const response = NextResponse.json({ message: 'Producto añadido al carrito' });
    
    if (!session?.user) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Error al añadir al carrito' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = getSessionId(request);
    const { itemId, quantity } = await request.json();

    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: 'ID de item y cantidad requeridos' }, { status: 400 });
    }

    const where = session?.user
      ? { id: itemId, userId: (session.user as any).id }
      : { id: itemId, sessionId };

    const cartItem = await prisma.cartItem.findFirst({ where: where as any });

    if (!cartItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const product = await prisma.product.findUnique({
        where: { id: cartItem.productId },
      });

      if (product && quantity > product.stock) {
        return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return NextResponse.json({ message: 'Carrito actualizado' });
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json({ error: 'Error al actualizar carrito' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = getSessionId(request);
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (itemId) {
      const where = session?.user
        ? { id: itemId, userId: (session.user as any).id }
        : { id: itemId, sessionId };

      await prisma.cartItem.deleteMany({ where: where as any });
    } else {
      const where = session?.user
        ? { userId: (session.user as any).id }
        : { sessionId };

      await prisma.cartItem.deleteMany({ where });
    }

    return NextResponse.json({ message: 'Carrito limpiado' });
  } catch (error) {
    console.error('Delete cart error:', error);
    return NextResponse.json({ error: 'Error al eliminar del carrito' }, { status: 500 });
  }
}
