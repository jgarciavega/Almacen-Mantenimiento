import { FastifyInstance } from 'fastify';
import prisma from '../prisma';

export async function movimientosRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  // Listar movimientos con filtros
  app.get('/', auth, async (request) => {
    const { productoId, tipo, desde, hasta } = request.query as any;
    return prisma.movimiento.findMany({
      where: {
        ...(productoId && { productoId: Number(productoId) }),
        ...(tipo && { tipo }),
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
      take: 200,
    });
  });

  // Registrar movimiento (entrada o salida)
  app.post('/', auth, async (request, reply) => {
    const { productoId, tipo, cantidad, motivo, referencia, entregadoPor, recibidoPor } = request.body as any;
    const usuarioId = (request as any).user.id;

    const producto = await prisma.producto.findUnique({ where: { id: Number(productoId) } });
    if (!producto) return reply.status(404).send({ error: 'Producto no encontrado' });

    if (tipo === 'SALIDA' && producto.stockActual < cantidad) {
      return reply.status(400).send({ error: 'Stock insuficiente' });
    }

    const nuevoStock = tipo === 'ENTRADA'
      ? producto.stockActual + cantidad
      : producto.stockActual - cantidad;

    const [movimiento] = await prisma.$transaction([
      prisma.movimiento.create({
        data: { productoId: Number(productoId), tipo, cantidad: Number(cantidad), motivo, referencia, entregadoPor, recibidoPor, usuarioId },
      }),
      prisma.producto.update({
        where: { id: Number(productoId) },
        data: { stockActual: nuevoStock },
      }),
    ]);

    return movimiento;
  });
}
