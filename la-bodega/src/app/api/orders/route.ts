import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/email/service';

function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para realizar un pedido' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId, paymentMethod, couponCode, notes } = body;

    if (!addressId || !paymentMethod) {
      return NextResponse.json({ error: 'Dirección y método de pago requeridos' }, { status: 400 });
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: (session.user as any).id },
    });

    if (!address) {
      return NextResponse.json({ error: 'Dirección no válida' }, { status: 400 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: (session.user as any).id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json({
          error: `Stock insuficiente para ${item.product.name}`
        }, { status: 400 });
      }
    }

    let subtotal = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.active && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        couponId = coupon.id;
        subtotal = cartItems.reduce((sum, item) => {
          const price = item.product.salePrice || item.product.price;
          return sum + Number(price) * item.quantity;
        }, 0);

        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    } else {
      subtotal = cartItems.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price;
        return sum + Number(price) * item.quantity;
      }, 0);
    }

    const discount = 0;
    const tax = subtotal * 0.19;
    const total = subtotal + tax;

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: (session.user as any).id,
        addressId,
        status: 'PENDIENTE',
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        paymentStatus: 'PENDIENTE',
        couponId,
        notes,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.salePrice || item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        user: true,
        address: true,
      },
    });

    for (const item of cartItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: (session.user as any).id },
    });

    const customerEmail = order.user?.email || session.user!.email!;
    const customerName = order.user?.name || 'Cliente';
    
    setImmediate(() => {
      sendOrderConfirmation(order, order.items, customerEmail, customerName)
        .catch(console.error);
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = { userId: (session.user as any).id };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}
