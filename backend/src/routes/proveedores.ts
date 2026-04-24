import { FastifyInstance } from 'fastify';
import prisma from '../prisma';
import { CreateProveedorSchema, UpdateProveedorSchema, formatZodErrors } from '../schemas';

export async function proveedoresRoutes(app: FastifyInstance) {
  const auth      = { onRequest: [(app as any).authenticate] };
  const soloAdmin = async (request: any, reply: any) => {
    if (request.user?.rol !== 'ADMIN') return reply.status(403).send({ error: 'Solo administradores' });
  };
  const adminAuth = { onRequest: [(app as any).authenticate, soloAdmin] };

  app.get('/', auth, async (request) => {
    const { buscar, page = '1', limit = '20' } = request.query as {
      buscar?: string; page?: string; limit?: string;
    };
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const where = {
      activo: true,
      ...(buscar && { nombre: { contains: buscar, mode: 'insensitive' as const } }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.proveedor.findMany({ where, orderBy: { nombre: 'asc' }, skip, take: limitNum }),
      prisma.proveedor.count({ where }),
    ]);

    return { data, total, page: pageNum, totalPages: Math.ceil(total / limitNum), limit: limitNum };
  });

  app.get('/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: Number(id) },
      include: { productos: { include: { producto: { include: { categoria: true } } } } },
    });
    if (!proveedor) return reply.status(404).send({ error: 'Proveedor no encontrado' });
    return proveedor;
  });

  // Crear — solo Admin
  app.post('/', adminAuth, async (request, reply) => {
    const parsed = CreateProveedorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    const { nombre, contacto, telefono, email } = parsed.data;
    try {
      return await prisma.proveedor.create({
        data: { nombre, contacto: contacto || null, telefono: telefono || null, email: email || null },
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Error al crear el proveedor', detalle: err?.message });
    }
  });

  // Actualizar — solo Admin
  app.put('/:id', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateProveedorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    const { nombre, contacto, telefono, email } = parsed.data;
    try {
      return await prisma.proveedor.update({
        where: { id: Number(id) },
        data: { nombre, contacto: contacto || null, telefono: telefono || null, email: email || null },
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Error al actualizar el proveedor', detalle: err?.message });
    }
  });

  // Eliminar (soft delete) — solo Admin
  app.delete('/:id', adminAuth, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.proveedor.update({ where: { id: Number(id) }, data: { activo: false } });
  });
}
