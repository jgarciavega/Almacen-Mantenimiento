import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { CreateUsuarioSchema, UpdateUsuarioSchema, formatZodErrors } from '../schemas';

export async function usuariosRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  const soloAdmin = async (request: any, reply: any) => {
    if (request.user?.rol !== 'ADMIN') {
      return reply.status(403).send({ error: 'Solo administradores' });
    }
  };
  const adminAuth = { onRequest: [(app as any).authenticate, soloAdmin] };

  app.get('/', adminAuth, async () => {
    return prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
      orderBy: { nombre: 'asc' },
    });
  });

  app.post('/', adminAuth, async (request, reply) => {
    const parsed = CreateUsuarioSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    const { nombre, email, password, rol } = parsed.data;
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return reply.status(400).send({ error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    return prisma.usuario.create({
      data: { nombre, email, password: hash, rol: rol ?? 'ALMACENISTA' },
      select: { id: true, nombre: true, email: true, rol: true },
    });
  });

  app.put('/:id', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateUsuarioSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }
    const { nombre, rol, activo, password } = parsed.data;
    const updateData: any = { nombre, rol, activo };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    return prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
  });

  app.delete('/:id', adminAuth, async (request) => {
    const { id } = request.params as { id: string };
    return prisma.usuario.update({
      where: { id: Number(id) },
      data: { activo: false },
      select: { id: true, nombre: true, activo: true },
    });
  });

  // Cambiar contraseña propia (cualquier usuario autenticado)
  app.put('/me/password', auth, async (request, reply) => {
    const { passwordActual, passwordNuevo } = request.body as { passwordActual: string; passwordNuevo: string };
    if (!passwordActual || !passwordNuevo) {
      return reply.status(400).send({ error: 'Debes proporcionar la contraseña actual y la nueva' });
    }
    if (passwordNuevo.length < 6) {
      return reply.status(400).send({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    const userId = (request as any).user.id;
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) return reply.status(404).send({ error: 'Usuario no encontrado' });

    const valido = await bcrypt.compare(passwordActual, usuario.password);
    if (!valido) return reply.status(400).send({ error: 'La contraseña actual es incorrecta' });

    await prisma.usuario.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(passwordNuevo, 10) },
    });
    return { ok: true };
  });
}
