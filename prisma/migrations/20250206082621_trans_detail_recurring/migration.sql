-- DropForeignKey
ALTER TABLE "Trans_Details" DROP CONSTRAINT "Trans_Details_trans_id_fkey_Trans_Recurring";

-- CreateTable
CREATE TABLE "Trans_Details_Recurring" (
    "id" UUID NOT NULL,
    "trans_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "kas" BOOLEAN NOT NULL DEFAULT false,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "Trans_Details_Recurring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trans_Details_Recurring_trans_id_idx" ON "Trans_Details_Recurring"("trans_id");

-- AddForeignKey
ALTER TABLE "Trans_Details_Recurring" ADD CONSTRAINT "Trans_Details_trans_id_fkey_Trans_Recurring" FOREIGN KEY ("trans_id") REFERENCES "Trans_Recurring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans_Details_Recurring" ADD CONSTRAINT "Trans_Details_Recurring_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
