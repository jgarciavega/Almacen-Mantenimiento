import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';

export async function usuariosRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  const soloAdmin = async (request: any, reply: any) => {
    if (request.user.rol !== 'ADMIN') {
      return reply.status(403).send({ error: 'Solo administradores' });
    }
  };

  app.get('/', { onRequest: [(app as any).authenticate, soloAdmin] }, async () => {
    return prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
      orderBy: { nombre: 'asc' },
    });
  });

  app.post('/', { onRequest: [(app as any).authenticate, soloAdmin] }, async (request, reply) => {
    const data = request.body as any;
    const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existe) return reply.status(400).send({ error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(data.password, 10);
    return prisma.usuario.create({
      data: { nombre: data.nombre, email: data.email, password: hash, rol: data.rol ?? 'ALMACENISTA' },
      select: { id: true, nombre: true, email: true, rol: true },
    });
  });

  app.put('/:id', { onRequest: [(app as any).authenticate, soloAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updateData: any = { nombre: data.nombre, rol: data.rol, activo: data.activo };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    return prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
  });

  app.delete('/:id', { onRequest: [(app as any).authenticate, soloAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.usuario.update({
      where: { id: Number(id) },
      data: { activo: false },
      select: { id: true, nombre: true, activo: true },
    });
  });
}
