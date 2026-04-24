import { FastifyInstance } from 'fastify';
import prisma from '../prisma';

export async function alertasRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  // Retorna productos cuyo stock está en o por debajo del mínimo
  app.get('/', auth, async () => {
    const alertas = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.nombre, p.sku, p."stockActual", p."stockMinimo", p.unidad,
             c.nombre AS categoria,
             CASE WHEN p."stockActual" = 0 THEN true ELSE false END AS critico
      FROM "Producto" p
      JOIN "Categoria" c ON p."categoriaId" = c.id
      WHERE p.activo = true AND p."stockActual" <= p."stockMinimo"
      ORDER BY p."stockActual" ASC
    `;

    return {
      total: alertas.length,
      alertas,
    };
  });
}
