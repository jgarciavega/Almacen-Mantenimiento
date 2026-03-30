import { FastifyInstance } from 'fastify';
import prisma from '../prisma';

export async function proveedoresRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  app.get('/', auth, async () => {
    return prisma.proveedor.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
  });

  app.get('/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: Number(id) },
      include: { productos: { include: { producto: true } } },
    });
    if (!proveedor) return reply.status(404).send({ error: 'Proveedor no encontrado' });
    return proveedor;
  });

  app.post('/', auth, async (request) => {
    const data = request.body as any;
    return prisma.proveedor.create({
      data: { nombre: data.nombre, contacto: data.contacto, telefono: data.telefono, email: data.email },
    });
  });

  app.put('/:id', auth, async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    return prisma.proveedor.update({
      where: { id: Number(id) },
      data: { nombre: data.nombre, contacto: data.contacto, telefono: data.telefono, email: data.email },
    });
  });

  app.delete('/:id', auth, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.proveedor.update({ where: { id: Number(id) }, data: { activo: false } });
  });
}
