import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalServices,
      monthServices,
      lastMonthServices,
      pendingServices,
      inProgressServices,
      completedThisMonth,
      servicesByStatus,
      servicesByDevice,
      recentServices,
    ] = await Promise.all([
      prisma.serviceOrder.count(),
      prisma.serviceOrder.count({
        where: { receivedAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.serviceOrder.count({
        where: { receivedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      prisma.serviceOrder.count({
        where: { status: { in: ['RECIBIDO', 'EN_DIAGNOSTICO', 'PENDIENTE_APROBACION'] } },
      }),
      prisma.serviceOrder.count({
        where: { status: { in: ['EN_REPARACION'] } },
      }),
      prisma.serviceOrder.count({
        where: { 
          status: 'ENTREGADO',
          updatedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.serviceOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.serviceOrder.groupBy({
        by: ['deviceType'],
        _count: true,
      }),
      prisma.serviceOrder.findMany({
        take: 10,
        orderBy: { receivedAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          deviceType: true,
          brand: true,
          model: true,
          status: true,
          receivedAt: true,
        },
      }),
    ]);

    const monthGrowth = lastMonthServices 
      ? ((monthServices - lastMonthServices) / lastMonthServices) * 100 
      : 0;

    const completedServices = await prisma.serviceOrder.findMany({
      where: { status: 'ENTREGADO' },
      select: {
        receivedAt: true,
        updatedAt: true,
      },
    });

    const avgRepairTime = completedServices.length > 0 
      ? completedServices.reduce((sum, s) => {
          const diff = new Date(s.updatedAt).getTime() - new Date(s.receivedAt).getTime();
          return sum + diff;
        }, 0) / completedServices.length / (1000 * 60 * 60 * 24)
      : 0;

    const serviceCount = await prisma.serviceOrder.count({
      where: { status: 'ENTREGADO' },
    });

    const pendingCount = await prisma.serviceOrder.count({
      where: { status: { in: ['PENDIENTE_APROBACION', 'EN_REPARACION'] } },
    });

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const servicesLast30Days = await prisma.serviceOrder.findMany({
      where: { receivedAt: { gte: last30Days } },
      select: {
        receivedAt: true,
        status: true,
      },
    });

    const servicesByDayLast30 = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayData = servicesLast30Days.filter(
        o => o.receivedAt >= dayStart && o.receivedAt <= dayEnd
      );
      
      return {
        date: date.toISOString().split('T')[0],
        services: dayData.length,
      };
    });

    return NextResponse.json({
      kpis: {
        totalServices,
        monthServices,
        monthGrowth,
        pendingServices,
        inProgressServices,
        completedThisMonth,
        avgRepairTimeDays: Math.round(avgRepairTime * 10) / 10,
        completedServicesTotal: serviceCount,
        pendingServicesCount: pendingCount,
        servicesByStatus: servicesByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>),
        servicesByDevice: servicesByDevice.reduce((acc, curr) => {
          acc[curr.deviceType] = curr._count;
          return acc;
        }, {} as Record<string, number>),
      },
      servicesByDayLast30,
      recentServices,
    });
  } catch (error) {
    console.error('Get services stats error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas de servicios' }, { status: 500 });
  }
}
