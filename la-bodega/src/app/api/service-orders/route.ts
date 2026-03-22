import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendServiceOrderCreated, sendServiceDiagnosis, sendServiceStatusChange } from '@/lib/email/service';

function generateServiceOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ST-${year}${month}${day}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const technicianId = searchParams.get('technicianId');
    const search = searchParams.get('search');

    const where: any = {};

    const userRole = (session.user as any).role;
    
    if (userRole === 'CLIENTE') {
      where.customerEmail = session.user.email;
    } else if (userRole === 'TECNICO') {
      where.technicianId = (session.user as any).id;
    }

    if (status) {
      where.status = status;
    }

    if (technicianId && userRole === 'ADMIN') {
      where.technicianId = technicianId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { serial: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        technician: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        photos: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { receivedAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get service orders error:', error);
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'TECNICO'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      technicianId,
      photos,
    } = body;

    if (!customerName || !customerEmail || !deviceType || !brand || !model || !reportedIssue) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const orderNumber = generateServiceOrderNumber();

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
        technicianId: technicianId || (session.user as any).id,
        status: 'RECIBIDO',
        photos: photos?.length > 0 ? {
          create: photos.map((url: string) => ({
            url,
            stage: 'Recepción',
          })),
        } : undefined,
        statusHistory: {
          create: {
            oldStatus: null,
            newStatus: 'RECIBIDO',
            changedBy: (session.user as any).id,
            notes: 'Orden de servicio creada',
          },
        },
      },
      include: {
        photos: true,
      },
    });

    setImmediate(() => {
      sendServiceOrderCreated(serviceOrder).catch(console.error);
    });

    return NextResponse.json(serviceOrder, { status: 201 });
  } catch (error) {
    console.error('Create service order error:', error);
    return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'TECNICO'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status, diagnosis, budgetJson, budgetApproved, notes, photos } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 });
    }

    const existingOrder = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      await prisma.serviceStatusHistory.create({
        data: {
          serviceOrderId: orderId,
          oldStatus: existingOrder.status,
          newStatus: status,
          changedBy: (session.user as any).id,
          notes: notes || `Estado cambiado a ${status}`,
        },
      });

      if (status === 'PENDIENTE_APROBACION' && diagnosis) {
        updateData.diagnosis = diagnosis;
        updateData.budgetJson = budgetJson;
      }

      if (status === 'LISTO_PARA_ENTREGA' && budgetApproved !== undefined) {
        updateData.budgetApproved = budgetApproved;
        if (budgetApproved) {
          updateData.budgetApprovedAt = new Date();
        }
      }
    }

    if (diagnosis) updateData.diagnosis = diagnosis;
    if (budgetJson) updateData.budgetJson = budgetJson;
    if (notes) updateData.notes = notes;

    const updatedOrder = await prisma.serviceOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        photos: true,
      },
    });

    if (photos?.length > 0) {
      await prisma.servicePhoto.createMany({
        data: photos.map((url: string) => ({
          serviceOrderId: orderId,
          url,
          stage: status === 'EN_DIAGNOSIS' ? 'Diagnóstico' : 
                 status === 'EN_REPARACION' ? 'Reparación' : 'Entrega',
        })),
      });
    }

    if (status && status !== existingOrder.status) {
      setImmediate(() => {
        sendServiceStatusChange(updatedOrder, status).catch(console.error);
        
        if (status === 'PENDIENTE_APROBACION') {
          sendServiceDiagnosis(updatedOrder).catch(console.error);
        }
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update service order error:', error);
    return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 });
  }
}
