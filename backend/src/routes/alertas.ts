import { FastifyInstance } from 'fastify';
import prisma from '../prisma';

export async function alertasRoutes(app: FastifyInstance) {
  const auth = { onRequest: [(app as any).authenticate] };

  // Retorna productos cuyo stock está en o por debajo del mínimo
  app.get('/', auth, async () => {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
    });

    const alertas = productos.filter(p => p.stockActual <= p.stockMinimo);
    return {
      total: alertas.length,
      alertas: alertas.map(p => ({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        stockActual: p.stockActual,
        stockMinimo: p.stockMinimo,
        unidad: p.unidad,
        categoria: p.categoria.nombre,
        critico: p.stockActual === 0,
      })),
    };
  });
}
