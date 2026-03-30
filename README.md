# Sistema de Control de Almacén — Mantenimiento

Sistema de gestión de inventario para el área de mantenimiento, construido con **Tauri + React** (escritorio/web) y **Node.js + Fastify + Prisma + PostgreSQL** (backend).

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 |
| Desktop | Tauri 2 |
| Backend | Node.js + Fastify + Prisma 5 |
| Base de datos | PostgreSQL 17 |

## Módulos

- 📦 **Inventario** — CRUD de artículos con categorías, SKU, stock mínimo y ubicación
- 🔄 **Movimientos** — Entradas y salidas con quién recibe, motivo y referencia/OT
- 🏭 **Proveedores** — Gestión de proveedores y contactos
- 👤 **Usuarios** — Roles: Admin y Almacenista
- 🔔 **Alertas** — Productos con stock bajo o sin stock
- 📊 **Reportes** — Stock actual, movimientos, artículos más usados; exportación CSV e impresión
- ⚙️ **Configuración** — Datos de la empresa

## Requisitos

- Node.js 20+
- PostgreSQL 17
- Rust (solo para compilar Tauri en escritorio)

## Configuración inicial

### Backend
```bash
cd backend
cp .env.example .env        # editar con tus credenciales
npm install
npm run db:migrate          # crear tablas
npm run db:seed             # cargar datos de ejemplo
npm run dev                 # servidor en http://localhost:3001
```

### Frontend
```bash
cd almacen-mantenimiento
npm install
npm run dev                 # web en http://localhost:1420
```

## Credenciales de prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| Administrador | admin@almacen.com | admin123 | Admin |
| Carlos Mendoza | almacenista@almacen.com | almacen123 | Almacenista |
