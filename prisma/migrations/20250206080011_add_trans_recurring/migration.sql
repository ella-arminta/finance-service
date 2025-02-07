-- CreateTable
CREATE TABLE "Trans_Recurring" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "trans_start_date" TIMESTAMP(3) NOT NULL,
    "trans_last_date" TIMESTAMP(3),
    "trans_period" TEXT NOT NULL,
    "trans_type_id" INTEGER NOT NULL,
    "total" DOUBLE PRECISION,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,

    CONSTRAINT "Trans_Recurring_pkey" PRIMARY KEY ("id")
);

-- RenameForeignKey
ALTER TABLE "Trans_Details" RENAME CONSTRAINT "Trans_Details_trans_id_fkey" TO "Trans_Details_trans_id_fkey_Trans";

-- AddForeignKey
ALTER TABLE "Trans_Details" ADD CONSTRAINT "Trans_Details_trans_id_fkey_Trans_Recurring" FOREIGN KEY ("trans_id") REFERENCES "Trans_Recurring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
