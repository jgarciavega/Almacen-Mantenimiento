import { FastifyInstance } from 'fastify';
import prisma from '../prisma';

export async function reportesRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  // Stock actual completo
  app.get('/stock', auth, async () => {
    return prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    });
  });

  // Movimientos por rango de fecha
  app.get('/movimientos', auth, async (request) => {
    const { desde, hasta } = request.query as any;
    return prisma.movimiento.findMany({
      where: {
        ...(desde || hasta ? {
          createdAt: {
            ...(desde && { gte: new Date(desde) }),
            ...(hasta && { lte: new Date(hasta) }),
          }
        } : {}),
      },
      include: {
        producto: { select: { nombre: true, sku: true, unidad: true } },
        usuario: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  // Artículos más usados (top salidas)
  app.get('/mas-usados', auth, async () => {
    const resultado = await prisma.movimiento.groupBy({
      by: ['productoId'],
      where: { tipo: 'SALIDA' },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 10,
    });

    const ids = resultado.map(r => r.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, sku: true, unidad: true },
    });

    return resultado.map(r => ({
      ...productos.find(p => p.id === r.productoId),
      totalSalidas: r._sum.cantidad,
    }));
  });

  // Historial de un producto
  app.get('/historial/:productoId', auth, async (request) => {
    const { productoId } = request.params as { productoId: string };
    return prisma.movimiento.findMany({
      where: { productoId: Number(productoId) },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  // Resumen para dashboard
  app.get('/resumen', auth, async () => {
    const hoyInicio = new Date(new Date().setHours(0, 0, 0, 0));

    const [totalProductos, totalMovimientosHoy] = await Promise.all([
      prisma.producto.count({ where: { activo: true } }),
      prisma.movimiento.count({
        where: { createdAt: { gte: hoyInicio } },
      }),
    ]);

    // Contar productos con stock <= stockMinimo (comparación campo a campo via raw)
    const alertaResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Producto"
      WHERE activo = true AND "stockActual" <= "stockMinimo"
    `;
    const productosConAlerta = Number(alertaResult[0].count);

    // Últimos 5 movimientos (resumen)
    const ultimosMovimientos = await prisma.movimiento.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        producto: { select: { nombre: true, unidad: true } },
        usuario: { select: { nombre: true } },
      },
    });

    // Movimientos de hoy (para el modal)
    const movimientosHoy = await prisma.movimiento.findMany({
      where: { createdAt: { gte: hoyInicio } },
      orderBy: { createdAt: 'desc' },
      include: {
        producto: { select: { nombre: true, sku: true, unidad: true } },
        usuario: { select: { nombre: true } },
      },
    });

    // Productos por categoría (para el modal de total artículos)
    const categorias = await prisma.categoria.findMany({
      include: {
        _count: { select: { productos: { where: { activo: true } } } },
      },
      orderBy: { nombre: 'asc' },
    });
    const productosPorCategoria = categorias
      .filter(c => c._count.productos > 0)
      .map(c => ({ nombre: c.nombre, total: c._count.productos }));

    // Productos con alerta (para el modal)
    const alertas = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.nombre, p.sku, p."stockActual", p."stockMinimo", p.unidad, p.ubicacion,
             c.nombre as categoria,
             CASE WHEN p."stockActual" = 0 THEN true ELSE false END as critico
      FROM "Producto" p
      JOIN "Categoria" c ON p."categoriaId" = c.id
      WHERE p.activo = true AND p."stockActual" <= p."stockMinimo"
      ORDER BY p."stockActual" ASC
    `;

    return {
      totalProductos,
      totalMovimientosHoy,
      productosConAlerta,
      ultimosMovimientos,
      movimientosHoy,
      productosPorCategoria,
      alertas,
    };
  });
}
