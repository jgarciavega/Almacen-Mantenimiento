import { FastifyInstance } from 'fastify';
import prisma from '../prisma';
import { CreateProductoSchema, UpdateProductoSchema, CreateCategoriaSchema, formatZodErrors } from '../schemas';

export async function productosRoutes(app: FastifyInstance) {
  const auth     = { onRequest: [(app as any).authenticate] };
  const soloAdmin = async (request: any, reply: any) => {
    if (request.user?.rol !== 'ADMIN') return reply.status(403).send({ error: 'Solo administradores' });
  };
  const adminAuth = { onRequest: [(app as any).authenticate, soloAdmin] };

  // Listar productos (paginado)
  app.get('/', auth, async (request) => {
    const { buscar, categoriaId, page = '1', limit = '20' } = request.query as {
      buscar?: string; categoriaId?: string; page?: string; limit?: string;
    };
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const where = {
      activo: true,
      ...(buscar      && { nombre: { contains: buscar, mode: 'insensitive' as const } }),
      ...(categoriaId && { categoriaId: Number(categoriaId) }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.producto.findMany({ where, include: { categoria: true }, orderBy: { nombre: 'asc' }, skip, take: limitNum }),
      prisma.producto.count({ where }),
    ]);

    return { data, total, page: pageNum, totalPages: Math.ceil(total / limitNum), limit: limitNum };
  });

  // Obtener uno
  app.get('/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const producto = await prisma.producto.findUnique({
      where: { id: Number(id) },
      include: { categoria: true, proveedores: { include: { proveedor: true } } },
    });
    if (!producto) return reply.status(404).send({ error: 'Producto no encontrado' });
    return producto;
  });

  // Crear — solo Admin
  app.post('/', adminAuth, async (request, reply) => {
    const parsed = CreateProductoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    try {
      return await prisma.producto.create({ data: parsed.data });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(400).send({ error: 'El SKU ya está registrado' });
      return reply.status(400).send({ error: e.message });
    }
  });

  // Actualizar — solo Admin
  app.put('/:id', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateProductoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    try {
      return await prisma.producto.update({ where: { id: Number(id) }, data: parsed.data });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // Eliminar (soft delete) — solo Admin
  app.delete('/:id', adminAuth, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.producto.update({ where: { id: Number(id) }, data: { activo: false } });
  });

  // Categorías — listar (todos)
  app.get('/categorias/lista', auth, async () => {
    return prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  });

  // Categorías — crear (solo Admin)
  app.post('/categorias', adminAuth, async (request, reply) => {
    const parsed = CreateCategoriaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    try {
      return await prisma.categoria.create({ data: { nombre: parsed.data.nombre } });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(400).send({ error: 'La categoría ya existe' });
      return reply.status(400).send({ error: e.message });
    }
  });

  // Categorías — editar (solo Admin)
  app.put('/categorias/:id', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = CreateCategoriaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    try {
      return await prisma.categoria.update({ where: { id: Number(id) }, data: { nombre: parsed.data.nombre } });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.status(400).send({ error: 'La categoría ya existe' });
      return reply.status(400).send({ error: e.message });
    }
  });

  // Categorías — eliminar (solo Admin, solo si no tiene productos asociados)
  app.delete('/categorias/:id', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const count = await prisma.producto.count({ where: { categoriaId: Number(id), activo: true } });
    if (count > 0) {
      return reply.status(400).send({ error: `No se puede eliminar: tiene ${count} producto(s) activo(s) asignado(s)` });
    }
    try {
      return await prisma.categoria.delete({ where: { id: Number(id) } });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });
}
