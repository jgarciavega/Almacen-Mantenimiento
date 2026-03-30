export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'ALMACENISTA';
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  sku: string;
  descripcion?: string;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
  ubicacion?: string;
  activo: boolean;
  categoriaId: number;
  categoria: Categoria;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface Movimiento {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo?: string;
  referencia?: string;
  entregadoPor?: string;
  recibidoPor?: string;
  productoId: number;
  usuarioId: number;
  createdAt: string;
  producto: { nombre: string; sku: string; unidad: string };
  usuario: { nombre: string };
}

export interface Alerta {
  id: number;
  nombre: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
  categoria: string;
  ubicacion?: string;
  critico: boolean;
}

export interface Resumen {
  totalProductos: number;
  totalMovimientosHoy: number;
  productosConAlerta: number;
  ultimosMovimientos: Movimiento[];
  movimientosHoy: Movimiento[];
  productosPorCategoria: { nombre: string; total: number }[];
  alertas: Alerta[];
}
