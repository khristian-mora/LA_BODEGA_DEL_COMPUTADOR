import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { sendPasswordReset } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña' },
        { status: 200 }
      );
    }

    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    const token = uuidv4();

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    setImmediate(() => {
      sendPasswordReset(email, user.name, token).catch(console.error);
    });

    return NextResponse.json(
      { message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}
