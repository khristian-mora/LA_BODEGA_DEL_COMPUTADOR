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

    const addresses = await prisma.address.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json({ error: 'Error al obtener direcciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { label, street, city, department, zip, country, isDefault } = body;

    if (!label || !street || !city || !department) {
      return NextResponse.json(
        { error: 'Label, street, city y department son requeridos' },
        { status: 400 }
      );
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: (session.user as any).id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: (session.user as any).id,
        label,
        street,
        city,
        department,
        zip,
        country: country || 'Colombia',
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json({ error: 'Error al crear dirección' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, label, street, city, department, zip, country, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: (session.user as any).id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: (session.user as any).id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        label: label || undefined,
        street: street || undefined,
        city: city || undefined,
        department: department || undefined,
        zip: zip || undefined,
        country: country || undefined,
        isDefault: isDefault || undefined,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'Error al actualizar dirección' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.address.deleteMany({
      where: { id, userId: (session.user as any).id },
    });

    return NextResponse.json({ message: 'Dirección eliminada' });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Error al eliminar dirección' }, { status: 500 });
  }
}
