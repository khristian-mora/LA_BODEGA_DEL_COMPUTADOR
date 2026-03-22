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

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      monthOrders,
      lastMonthOrders,
      yearOrders,
      weekOrders,
      pendingOrders,
      newClients,
      lowStockProducts,
      recentOrders,
      allTimeSales,
      completedOrders,
      cancelledOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          paymentStatus: 'PAGADO',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          paymentStatus: 'PAGADO',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          paymentStatus: 'PAGADO',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfYear },
          paymentStatus: 'PAGADO',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfWeek },
          paymentStatus: 'PAGADO',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({
        where: { status: { in: ['PENDIENTE', 'CONFIRMADO'] } },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth },
          role: 'CLIENTE',
        },
      }),
      prisma.product.count({
        where: {
          stock: { lte: 5 },
          status: 'ACTIVO',
        },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAGADO' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({
        where: { status: 'ENTREGADO', paymentStatus: 'PAGADO' },
      }),
      prisma.order.count({
        where: { status: 'CANCELADO' },
      }),
    ]);

    const monthGrowth = lastMonthOrders._sum.total 
      ? ((Number(monthOrders._sum.total) - Number(lastMonthOrders._sum.total)) / Number(lastMonthOrders._sum.total)) * 100 
      : 0;

    const salesData = await prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        paymentStatus: 'PAGADO',
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    const dailySales = Array.from({ length: 31 }, (_, i) => {
      const date = new Date(startOfMonth);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const daySales = salesData
        .filter(s => s.createdAt >= dayStart && s.createdAt <= dayEnd)
        .reduce((sum, s) => sum + Number(s.total), 0);
      
      return {
        date: date.toISOString().split('T')[0],
        sales: daySales,
      };
    });

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const last30DaysOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: last30Days },
        paymentStatus: 'PAGADO',
      },
      select: {
        createdAt: true,
        total: true,
        status: true,
      },
    });

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { paymentStatus: 'PAGADO' },
      _count: true,
    });

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { paymentStatus: 'PAGADO' },
      },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, images: true, price: true },
        });
        return {
          ...item,
          product,
        };
      })
    );

    const ordersByDayLast30 = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayData = last30DaysOrders.filter(
        o => o.createdAt >= dayStart && o.createdAt <= dayEnd
      );
      
      return {
        date: date.toISOString().split('T')[0],
        orders: dayData.length,
        sales: dayData.reduce((sum, o) => sum + Number(o.total), 0),
      };
    });

    return NextResponse.json({
      kpis: {
        todaySales: todayOrders._sum.total || 0,
        todayOrders: todayOrders._count,
        weekSales: weekOrders._sum.total || 0,
        weekOrders: weekOrders._count,
        monthSales: monthOrders._sum.total || 0,
        monthOrders: monthOrders._count,
        monthGrowth,
        yearSales: yearOrders._sum.total || 0,
        yearOrders: yearOrders._count,
        allTimeSales: allTimeSales._sum.total || 0,
        allTimeOrders: allTimeSales._count,
        pendingOrders,
        newClients,
        lowStockProducts,
        completedOrders,
        cancelledOrders,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>),
      },
      dailySales,
      ordersByDayLast30,
      topProducts: topProductsWithDetails,
      recentOrders,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
