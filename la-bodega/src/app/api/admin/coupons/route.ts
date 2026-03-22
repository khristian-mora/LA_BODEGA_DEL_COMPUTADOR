import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json({ error: 'Error al obtener cupones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { code, type, value, minPurchase, maxUses, expiresAt, active } = body;

    if (!code || !type || !value) {
      return NextResponse.json({ error: 'Código, tipo y valor son requeridos' }, { status: 400 });
    }

    const existingCode = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json({ error: 'El código ya existe' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minPurchase,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active ?? true,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Error al crear cupón' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, code, type, value, minPurchase, maxUses, expiresAt, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de cupón requerido' }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(type && { type }),
        ...(value !== undefined && { value }),
        ...(minPurchase !== undefined && { minPurchase }),
        ...(maxUses !== undefined && { maxUses }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Error al actualizar cupón' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de cupón requerido' }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Error al eliminar cupón' }, { status: 500 });
  }
}
