import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Iniciando seed...');

  // Usuarios
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@almacen.com' },
    update: {},
    create: { nombre: 'Administrador', email: 'admin@almacen.com', password: hash, rol: 'ADMIN' },
  });

  const hashAlm = await bcrypt.hash('almacen123', 10);
  await prisma.usuario.upsert({
    where: { email: 'almacenista@almacen.com' },
    update: {},
    create: { nombre: 'Carlos Mendoza', email: 'almacenista@almacen.com', password: hashAlm, rol: 'ALMACENISTA' },
  });
  console.log('✅ Usuarios creados');

  // Categorías
  const cats = ['Eléctrico', 'Mecánico', 'Hidráulico', 'Lubricantes', 'Herramientas', 'Seguridad'];
  for (const nombre of cats) {
    await prisma.categoria.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  const catMap = Object.fromEntries(
    (await prisma.categoria.findMany()).map(c => [c.nombre, c.id])
  );
  console.log('✅ Categorías creadas');

  // Proveedores
  const provs = [
    { nombre: 'Electro Industrial S.A.', contacto: 'Ing. Roberto Sáenz', telefono: '555-1001', email: 'ventas@electroind.com' },
    { nombre: 'Ferretera del Norte', contacto: 'Lupita Ramírez', telefono: '555-2345', email: 'pedidos@ferrnorte.com' },
    { nombre: 'Hydraulic Pro MX', contacto: 'Marco Ávila', telefono: '555-3789', email: 'soporte@hydraulicpro.mx' },
    { nombre: 'Lubricantes Omega', contacto: 'Diana Torres', telefono: '555-4400', email: 'comercial@omega.com.mx' },
  ];
  for (const p of provs) {
    const existe = await prisma.proveedor.findFirst({ where: { nombre: p.nombre } });
    if (!existe) await prisma.proveedor.create({ data: p });
  }
  console.log('✅ Proveedores creados');

  // Productos
  const productos = [
    { sku: 'ELE-001', nombre: 'Fusible 20A', categoriaId: catMap['Eléctrico'], stockActual: 45, stockMinimo: 10, unidad: 'pza', ubicacion: 'Estante A-1' },
    { sku: 'ELE-002', nombre: 'Cable THW 12 AWG', categoriaId: catMap['Eléctrico'], stockActual: 8, stockMinimo: 20, unidad: 'm', ubicacion: 'Estante A-2' },
    { sku: 'ELE-003', nombre: 'Contactor 40A 220V', categoriaId: catMap['Eléctrico'], stockActual: 3, stockMinimo: 2, unidad: 'pza', ubicacion: 'Estante A-3' },
    { sku: 'ELE-004', nombre: 'Interruptor termomagnético 3x20A', categoriaId: catMap['Eléctrico'], stockActual: 6, stockMinimo: 3, unidad: 'pza', ubicacion: 'Estante A-4' },
    { sku: 'ELE-005', nombre: 'Sensor de proximidad inductivo', categoriaId: catMap['Eléctrico'], stockActual: 0, stockMinimo: 2, unidad: 'pza', ubicacion: 'Estante A-5' },
    { sku: 'MEC-001', nombre: 'Rodamiento 6205 ZZ', categoriaId: catMap['Mecánico'], stockActual: 12, stockMinimo: 5, unidad: 'pza', ubicacion: 'Estante B-1' },
    { sku: 'MEC-002', nombre: 'Correa dentada T5-600', categoriaId: catMap['Mecánico'], stockActual: 4, stockMinimo: 4, unidad: 'pza', ubicacion: 'Estante B-2' },
    { sku: 'MEC-003', nombre: 'Tornillo hexagonal M10x40', categoriaId: catMap['Mecánico'], stockActual: 200, stockMinimo: 50, unidad: 'pza', ubicacion: 'Estante B-3' },
    { sku: 'MEC-004', nombre: 'Sello mecánico tipo cartridge', categoriaId: catMap['Mecánico'], stockActual: 2, stockMinimo: 3, unidad: 'pza', ubicacion: 'Estante B-4' },
    { sku: 'HID-001', nombre: 'Manguera hidráulica 3/8" SAE100', categoriaId: catMap['Hidráulico'], stockActual: 15, stockMinimo: 5, unidad: 'm', ubicacion: 'Estante C-1' },
    { sku: 'HID-002', nombre: 'Válvula de alivio 100 bar', categoriaId: catMap['Hidráulico'], stockActual: 1, stockMinimo: 2, unidad: 'pza', ubicacion: 'Estante C-2' },
    { sku: 'HID-003', nombre: 'Conector rápido hidráulico 1/2"', categoriaId: catMap['Hidráulico'], stockActual: 20, stockMinimo: 10, unidad: 'pza', ubicacion: 'Estante C-3' },
    { sku: 'LUB-001', nombre: 'Aceite ISO VG 46', categoriaId: catMap['Lubricantes'], stockActual: 60, stockMinimo: 20, unidad: 'L', ubicacion: 'Bodega L-1' },
    { sku: 'LUB-002', nombre: 'Grasa Lithium EP2', categoriaId: catMap['Lubricantes'], stockActual: 5, stockMinimo: 3, unidad: 'kg', ubicacion: 'Bodega L-2' },
    { sku: 'LUB-003', nombre: 'Lubricante en spray WD-40 400ml', categoriaId: catMap['Lubricantes'], stockActual: 8, stockMinimo: 5, unidad: 'pza', ubicacion: 'Bodega L-3' },
    { sku: 'HER-001', nombre: 'Llave ajustable 12"', categoriaId: catMap['Herramientas'], stockActual: 3, stockMinimo: 2, unidad: 'pza', ubicacion: 'Estante D-1' },
    { sku: 'HER-002', nombre: 'Juego de destornilladores 8 pzas', categoriaId: catMap['Herramientas'], stockActual: 5, stockMinimo: 2, unidad: 'juego', ubicacion: 'Estante D-1' },
    { sku: 'HER-003', nombre: 'Multímetro digital', categoriaId: catMap['Herramientas'], stockActual: 2, stockMinimo: 1, unidad: 'pza', ubicacion: 'Estante D-2' },
    { sku: 'SEG-001', nombre: 'Guantes dieléctricos clase 0', categoriaId: catMap['Seguridad'], stockActual: 4, stockMinimo: 6, unidad: 'par', ubicacion: 'Estante E-1' },
    { sku: 'SEG-002', nombre: 'Casco de seguridad clase E', categoriaId: catMap['Seguridad'], stockActual: 7, stockMinimo: 4, unidad: 'pza', ubicacion: 'Estante E-2' },
    { sku: 'SEG-003', nombre: 'Lentes de seguridad antiproyección', categoriaId: catMap['Seguridad'], stockActual: 10, stockMinimo: 5, unidad: 'pza', ubicacion: 'Estante E-3' },
  ];

  for (const p of productos) {
    const existe = await prisma.producto.findUnique({ where: { sku: p.sku } });
    if (!existe) await prisma.producto.create({ data: p });
  }
  console.log(`✅ ${productos.length} productos creados`);

  // Movimientos de ejemplo
  const admin = await prisma.usuario.findUnique({ where: { email: 'admin@almacen.com' } });
  const almacenista = await prisma.usuario.findUnique({ where: { email: 'almacenista@almacen.com' } });
  const prods = await prisma.producto.findMany();
  const getP = (sku: string) => prods.find(p => p.sku === sku)!;

  const movimientos = [
    { productoId: getP('ELE-001').id, tipo: 'ENTRADA' as const, cantidad: 50, motivo: 'Compra a proveedor', referencia: 'OC-2024-001', recibidoPor: 'Carlos Mendoza', usuarioId: admin!.id },
    { productoId: getP('ELE-002').id, tipo: 'SALIDA' as const, cantidad: 30, motivo: 'Instalación tablero eléctrico', referencia: 'OT-2024-045', recibidoPor: 'Ing. Luis Pérez', usuarioId: almacenista!.id },
    { productoId: getP('MEC-001').id, tipo: 'SALIDA' as const, cantidad: 4, motivo: 'Cambio de rodamientos bomba #2', referencia: 'OT-2024-046', recibidoPor: 'Javier Torres', usuarioId: almacenista!.id },
    { productoId: getP('LUB-001').id, tipo: 'ENTRADA' as const, cantidad: 80, motivo: 'Reposición inventario', referencia: 'OC-2024-002', recibidoPor: 'Carlos Mendoza', usuarioId: admin!.id },
    { productoId: getP('LUB-001').id, tipo: 'SALIDA' as const, cantidad: 20, motivo: 'Cambio de aceite compresor', referencia: 'OT-2024-047', recibidoPor: 'Roberto Sánchez', usuarioId: almacenista!.id },
    { productoId: getP('HID-001').id, tipo: 'SALIDA' as const, cantidad: 5, motivo: 'Reparación cilindro hidráulico prensa #1', referencia: 'OT-2024-048', recibidoPor: 'Arturo Díaz', usuarioId: almacenista!.id },
    { productoId: getP('SEG-001').id, tipo: 'SALIDA' as const, cantidad: 2, motivo: 'Entrega a técnico electricista', referencia: '', recibidoPor: 'Héctor Vega', usuarioId: admin!.id },
    { productoId: getP('MEC-003').id, tipo: 'ENTRADA' as const, cantidad: 300, motivo: 'Compra', referencia: 'OC-2024-003', recibidoPor: 'Carlos Mendoza', usuarioId: admin!.id },
    { productoId: getP('MEC-003').id, tipo: 'SALIDA' as const, cantidad: 100, motivo: 'Mantenimiento estructura metálica', referencia: 'OT-2024-049', recibidoPor: 'Miguel Ángel Ruiz', usuarioId: almacenista!.id },
    { productoId: getP('ELE-003').id, tipo: 'SALIDA' as const, cantidad: 1, motivo: 'Reemplazo contactor quemado prensa #3', referencia: 'OT-2024-050', recibidoPor: 'Ing. Patricia López', usuarioId: almacenista!.id },
    { productoId: getP('HER-003').id, tipo: 'SALIDA' as const, cantidad: 1, motivo: 'Préstamo para diagnóstico', referencia: '', recibidoPor: 'Fernando Castro', usuarioId: almacenista!.id },
    { productoId: getP('LUB-002').id, tipo: 'SALIDA' as const, cantidad: 1, motivo: 'Lubricación cadenas transportador', referencia: 'OT-2024-051', recibidoPor: 'Ramón Gutiérrez', usuarioId: almacenista!.id },
  ];

  for (const m of movimientos) {
    await prisma.movimiento.create({ data: m });
  }
  console.log(`✅ ${movimientos.length} movimientos creados`);
  console.log('🎉 Seed completado');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

