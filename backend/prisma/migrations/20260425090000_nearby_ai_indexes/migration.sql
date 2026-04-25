-- Nearby product comparison indexes.
CREATE INDEX IF NOT EXISTS "stores_latitude_longitude_idx"
ON "stores"("latitude", "longitude");

CREATE INDEX IF NOT EXISTS "products_storeId_isAvailable_stock_idx"
ON "products"("storeId", "isAvailable", "stock");

-- Faster case-insensitive substring product search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_name_trgm_idx"
ON "products" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "products_description_trgm_idx"
ON "products" USING gin ("description" gin_trgm_ops);
