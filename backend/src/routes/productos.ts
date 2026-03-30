import { FastifyInstance } from 'fastify';
import prisma from '../prisma';

export async function productosRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  // Listar productos
  app.get('/', auth, async (request) => {
    const { buscar, categoriaId } = request.query as { buscar?: string; categoriaId?: string };
    return prisma.producto.findMany({
      where: {
        activo: true,
        ...(buscar && { nombre: { contains: buscar, mode: 'insensitive' } }),
        ...(categoriaId && { categoriaId: Number(categoriaId) }),
      },
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    });
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

  // Crear
  app.post('/', auth, async (request, reply) => {
    const data = request.body as any;
    try {
      return await prisma.producto.create({
        data: {
          nombre: data.nombre,
          sku: data.sku,
          descripcion: data.descripcion,
          stockActual: data.stockActual ?? 0,
          stockMinimo: data.stockMinimo ?? 1,
          unidad: data.unidad ?? 'pza',
          ubicacion: data.ubicacion,
          categoriaId: data.categoriaId,
        },
      });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // Actualizar
  app.put('/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    try {
      return await prisma.producto.update({
        where: { id: Number(id) },
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          stockMinimo: data.stockMinimo,
          unidad: data.unidad,
          ubicacion: data.ubicacion,
          categoriaId: data.categoriaId,
        },
      });
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  // Eliminar (soft delete)
  app.delete('/:id', auth, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.producto.update({ where: { id: Number(id) }, data: { activo: false } });
  });

  // Categorías
  app.get('/categorias/lista', auth, async () => {
    return prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  });

  app.post('/categorias', auth, async (request) => {
    const { nombre } = request.body as { nombre: string };
    return prisma.categoria.create({ data: { nombre } });
  });
}
