import { FastifyInstance } from 'fastify';
import prisma from '../prisma';

export async function configuracionRoutes(app: FastifyInstance) {
  const auth      = { onRequest: [(app as any).authenticate] };
  const soloAdmin = async (request: any, reply: any) => {
    if (request.user?.rol !== 'ADMIN') return reply.status(403).send({ error: 'Solo administradores' });
  };
  const adminAuth = { onRequest: [(app as any).authenticate, soloAdmin] };

  // GET — cualquier usuario autenticado puede leer
  app.get('/', auth, async () => {
    return prisma.configuracion.upsert({
      where:  { id: 1 },
      update: {},
      create: { id: 1 },
    });
  });

  // PUT — solo Admin puede modificar
  app.put('/', adminAuth, async (request, reply) => {
    const { empresaNombre, empresaSlogan, empresaDireccion, empresaTelefono, empresaEmail, sistemaNombre } = request.body as any;

    const config = await prisma.configuracion.upsert({
      where:  { id: 1 },
      update: {
        ...(empresaNombre    !== undefined && { empresaNombre }),
        ...(empresaSlogan    !== undefined && { empresaSlogan }),
        ...(empresaDireccion !== undefined && { empresaDireccion }),
        ...(empresaTelefono  !== undefined && { empresaTelefono }),
        ...(empresaEmail     !== undefined && { empresaEmail }),
        ...(sistemaNombre    !== undefined && { sistemaNombre }),
      },
      create: { id: 1, empresaNombre: empresaNombre ?? '', empresaSlogan: empresaSlogan ?? '', empresaDireccion: empresaDireccion ?? '', empresaTelefono: empresaTelefono ?? '', empresaEmail: empresaEmail ?? '', sistemaNombre: sistemaNombre ?? 'Control de Almacén' },
    });

    return config;
  });
}
