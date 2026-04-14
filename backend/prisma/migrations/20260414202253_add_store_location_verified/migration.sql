-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "isLocationVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "products_storeId_isAvailable_createdAt_idx" ON "products"("storeId", "isAvailable", "createdAt");
