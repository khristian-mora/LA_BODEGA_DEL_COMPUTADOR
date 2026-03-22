import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { sendEmailVerification } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    const verificationToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        emailVerified: null,
      },
    });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    setImmediate(() => {
      sendEmailVerification(email, name, verificationToken).catch(console.error);
    });

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente. Por favor verifica tu correo electrónico.',
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
