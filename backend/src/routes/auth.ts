import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { LoginSchema, formatZodErrors } from '../schemas';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', campos: formatZodErrors(parsed.error) });
    }

    const { email, password } = parsed.data;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const token = app.jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      { expiresIn: '8h' }
    );

    return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } };
  });

  app.get('/me', { onRequest: [(app as any).authenticate] }, async (request) => {
    const payload = (request as any).user;
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    return usuario;
  });
}
