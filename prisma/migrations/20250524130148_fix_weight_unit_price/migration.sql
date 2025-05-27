-- CreateTable
CREATE TABLE "Unit_Prices" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "avg_price" DECIMAL(65,30) NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_Prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_Prices_product_id_key" ON "Unit_Prices"("product_id");
