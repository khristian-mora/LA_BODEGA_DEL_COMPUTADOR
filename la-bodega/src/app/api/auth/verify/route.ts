import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    if (passwordReset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'El token ha expirado' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { emailVerified: new Date() },
    });

    await prisma.passwordReset.delete({
      where: { token },
    });

    return NextResponse.json(
      { message: 'Email verificado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Error al verificar email' },
      { status: 500 }
    );
  }
}
