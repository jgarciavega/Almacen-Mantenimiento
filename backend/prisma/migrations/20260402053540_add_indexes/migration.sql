-- CreateIndex
CREATE INDEX "Movimiento_productoId_idx" ON "Movimiento"("productoId");

-- CreateIndex
CREATE INDEX "Movimiento_usuarioId_idx" ON "Movimiento"("usuarioId");

-- CreateIndex
CREATE INDEX "Movimiento_createdAt_idx" ON "Movimiento"("createdAt");

-- CreateIndex
CREATE INDEX "Producto_categoriaId_idx" ON "Producto"("categoriaId");

-- CreateIndex
CREATE INDEX "Producto_nombre_idx" ON "Producto"("nombre");

-- CreateIndex
CREATE INDEX "Producto_activo_idx" ON "Producto"("activo");
