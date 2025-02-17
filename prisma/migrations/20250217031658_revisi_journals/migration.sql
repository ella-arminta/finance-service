-- DropIndex
DROP INDEX "Accounts_company_id_code_key";

-- DropIndex
DROP INDEX "Accounts_company_id_deleted_at_store_id_account_type_id_cod_idx";

-- CreateTable
CREATE TABLE "Journals" (
    "id" SERIAL NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal_Accounts" (
    "id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "account_id" UUID NOT NULL,

    CONSTRAINT "Journal_Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Journals_store_id_deleted_at_idx" ON "Journals"("store_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Accounts_company_id_deleted_at_store_id_account_type_id_idx" ON "Accounts"("company_id", "deleted_at", "store_id", "account_type_id");

-- AddForeignKey
ALTER TABLE "Journals" ADD CONSTRAINT "Journals_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
