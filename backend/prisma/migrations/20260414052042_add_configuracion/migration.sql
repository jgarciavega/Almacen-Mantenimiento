-- CreateTable
CREATE TABLE "Configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "empresaNombre" TEXT NOT NULL DEFAULT '',
    "empresaSlogan" TEXT NOT NULL DEFAULT '',
    "empresaDireccion" TEXT NOT NULL DEFAULT '',
    "empresaTelefono" TEXT NOT NULL DEFAULT '',
    "empresaEmail" TEXT NOT NULL DEFAULT '',
    "sistemaNombre" TEXT NOT NULL DEFAULT 'Control de Almacén',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);
