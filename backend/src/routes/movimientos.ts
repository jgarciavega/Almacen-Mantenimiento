import { FastifyInstance } from 'fastify';
import prisma from '../prisma';
import { CreateMovimientoSchema, formatZodErrors } from '../schemas';

export async function movimientosRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  // Listar movimientos con filtros y paginación
  app.get('/', auth, async (request) => {
    const { productoId, tipo, desde, hasta, buscar, page = '1', limit = '20' } = request.query as any;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const where: any = {
      ...(productoId && { productoId: Number(productoId) }),
      ...(tipo && tipo !== 'TODOS' && { tipo }),
      ...(desde || hasta ? {
        createdAt: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(new Date(hasta).setHours(23, 59, 59, 999)) }),
        }
      } : {}),
      ...(buscar && {
        OR: [
          { producto: { nombre: { contains: buscar, mode: 'insensitive' } } },
          { producto: { sku:    { contains: buscar, mode: 'insensitive' } } },
          { motivo:        { contains: buscar, mode: 'insensitive' } },
          { referencia:    { contains: buscar, mode: 'insensitive' } },
          { recibidoPor:   { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.movimiento.findMany({
        where,
        include: {
          producto: { select: { nombre: true, sku: true, unidad: true } },
          usuario:  { select: { nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.movimiento.count({ where }),
    ]);

    return {
      data,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit:      limitNum,
    };
  });

  // Registrar movimiento — cualquier usuario autenticado
  app.post('/', auth, async (request, reply) => {
    const parsed = CreateMovimientoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }

    const { productoId, tipo, cantidad, motivo, referencia, entregadoPor, recibidoPor } = parsed.data;
    const usuarioId = (request as any).user.id;

    const producto = await prisma.producto.findUnique({ where: { id: productoId } });
    if (!producto) return reply.status(404).send({ error: 'Producto no encontrado' });
    if (!producto.activo) return reply.status(400).send({ error: 'El producto está inactivo' });

    if (tipo === 'SALIDA' && producto.stockActual < cantidad) {
      return reply.status(400).send({ error: `Stock insuficiente. Disponible: ${producto.stockActual} ${producto.unidad}` });
    }

    const nuevoStock = tipo === 'ENTRADA'
      ? producto.stockActual + cantidad
      : producto.stockActual - cantidad;

    const [movimiento] = await prisma.$transaction([
      prisma.movimiento.create({
        data: { productoId, tipo, cantidad, motivo, referencia, entregadoPor, recibidoPor, usuarioId },
      }),
      prisma.producto.update({
        where: { id: productoId },



        data: { stockActual: nuevoStock },
      }),
    ]);

    return movimiento;
  });
}
