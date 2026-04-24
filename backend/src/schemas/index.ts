import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// ─── Productos ───────────────────────────────────────────────────────────────

export const CreateProductoSchema = z.object({
  nombre:      z.string().min(2, 'Mínimo 2 caracteres').max(255).trim(),
  sku:         z.string().regex(/^[A-Za-z0-9_\-]+$/, 'Solo letras, números, guiones y guiones bajos').min(1).max(50),
  descripcion: z.string().max(1000).optional(),
  stockActual: z.number().min(0, 'No puede ser negativo').max(999999),
  stockMinimo: z.number().min(0, 'No puede ser negativo').max(999999),
  unidad:      z.string().min(1, 'La unidad es requerida').max(20),
  ubicacion:   z.string().max(100).optional(),
  categoriaId: z.number().positive('Selecciona una categoría'),
});

export const UpdateProductoSchema = z.object({
  nombre:      z.string().min(2).max(255).trim().optional(),
  descripcion: z.string().max(1000).optional().nullable(),
  stockMinimo: z.number().min(0).max(999999).optional(),
  unidad:      z.string().min(1).max(20).optional(),
  ubicacion:   z.string().max(100).optional().nullable(),
  categoriaId: z.number().positive().optional(),
});

export const CreateCategoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100).trim(),
});

// ─── Proveedores ─────────────────────────────────────────────────────────────

export const CreateProveedorSchema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres').max(255).trim(),
  contacto: z.string().max(255).optional().or(z.literal('')),
  telefono: z.union([
    z.string().regex(/^[\d\s\+\-\(\)]{7,20}$/, 'Teléfono inválido (7-20 dígitos)'),
    z.literal(''),
    z.undefined(),
  ]),
  email: z.union([
    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido (ej: contacto@empresa.com)'),
    z.literal(''),
    z.undefined(),
  ]),
});

export const UpdateProveedorSchema = CreateProveedorSchema.partial();

// ─── Movimientos ─────────────────────────────────────────────────────────────

export const CreateMovimientoSchema = z.object({
  productoId:   z.number().positive('Selecciona un artículo'),
  tipo:         z.enum(['ENTRADA', 'SALIDA']),
  cantidad:     z.number().positive('La cantidad debe ser mayor a 0').int('Debe ser un número entero'),
  motivo:       z.string().max(500).optional(),
  referencia:   z.string().max(100).optional(),
  entregadoPor: z.string().max(255).optional(),
  recibidoPor:  z.string().max(255).optional(),
});

// ─── Usuarios ────────────────────────────────────────────────────────────────

export const CreateUsuarioSchema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres').max(255).trim(),
  email:    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rol:      z.enum(['ADMIN', 'ALMACENISTA']).optional().default('ALMACENISTA'),
});

export const UpdateUsuarioSchema = z.object({
  nombre:   z.string().min(2).max(255).trim().optional(),
  email:    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido').optional(),
  rol:      z.enum(['ADMIN', 'ALMACENISTA']).optional(),
  activo:   z.boolean().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
});

// ─── Helper: formatear errores Zod ───────────────────────────────────────────

export function formatZodErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}
