import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Cupón no válido' }, { status: 400 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: 'Cupón inactivo' }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Cupón expirado' }, { status: 400 });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 });
    }

    if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
      return NextResponse.json({
        error: `Compra mínima de $${Number(coupon.minPurchase).toLocaleString('es-CO')}`
      }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Number(coupon.value);
    } else {
      discount = Number(coupon.value);
    }

    return NextResponse.json({
      valid: true,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Error al validar cupón' }, { status: 500 });
  }
}
