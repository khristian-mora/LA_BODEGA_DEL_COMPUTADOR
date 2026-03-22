import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendServiceOrderCreated } from '@/lib/email/service';

function generateServiceOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ST-${year}${month}${day}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerIdNumber,
      customerEmail,
      customerPhone,
      deviceType,
      brand,
      model,
      serial,
      reportedIssue,
      physicalCondition,
      accessories,
      password,
      createAccount,
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !deviceType || !brand || !model || !reportedIssue) {
      return NextResponse.json({ error: 'Todos los campos marcados con * son requeridos' }, { status: 400 });
    }

    const orderNumber = generateServiceOrderNumber();

    let userId: string | undefined;
    let isNewUser = false;

    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (existingUser) {
      userId = existingUser.id;
    } else if (createAccount) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const newUser = await prisma.user.create({
        data: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          passwordHash: tempPassword,
          role: 'CLIENTE',
        },
      });
      userId = newUser.id;
      isNewUser = true;
    }

    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        orderNumber,
        customerName,
        customerIdNumber,
        customerEmail,
        customerPhone,
        deviceType,
        brand,
        model,
        serial,
        reportedIssue,
        physicalCondition,
        accessories,
        password,
        userId,
        status: 'RECIBIDO',
        statusHistory: {
          create: {
            oldStatus: null,
            newStatus: 'RECIBIDO',
            notes: isNewUser 
              ? 'Orden creada - Cuenta de cliente registrada' 
              : userId 
                ? 'Orden vinculada a usuario existente'
                : 'Orden de servicio creada por cliente (sin cuenta)',
          },
        },
      },
      include: {
        user: { select: { name: true, email: true } },
        technician: { select: { name: true } },
      },
    });

    setImmediate(() => {
      sendServiceOrderCreated(serviceOrder).catch(console.error);
    });

    return NextResponse.json({
      ...serviceOrder,
      isNewUser,
      userLinked: !!userId,
    }, { status: 201 });
  } catch (error) {
    console.error('Create service order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Error al crear orden de servicio', details: message }, { status: 500 });
  }
}
