import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth';
import { productosRoutes } from './routes/productos';
import { movimientosRoutes } from './routes/movimientos';
import { proveedoresRoutes } from './routes/proveedores';
import { usuariosRoutes } from './routes/usuarios';
import { reportesRoutes } from './routes/reportes';
import { alertasRoutes } from './routes/alertas';

const app = Fastify({ logger: true });

app.register(cors, {
  origin: ['http://localhost:1420', 'http://localhost:5173'],
  credentials: true,
});

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('❌ FATAL: JWT_SECRET no está definido en las variables de entorno.');
  process.exit(1);
}

app.register(jwt, {
  secret: jwtSecret,
});

// Decorador para autenticar rutas
app.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Rutas
app.register(authRoutes, { prefix: '/api/auth' });
app.register(productosRoutes, { prefix: '/api/productos' });
app.register(movimientosRoutes, { prefix: '/api/movimientos' });
app.register(proveedoresRoutes, { prefix: '/api/proveedores' });
app.register(usuariosRoutes, { prefix: '/api/usuarios' });
app.register(reportesRoutes, { prefix: '/api/reportes' });
app.register(alertasRoutes, { prefix: '/api/alertas' });

app.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
