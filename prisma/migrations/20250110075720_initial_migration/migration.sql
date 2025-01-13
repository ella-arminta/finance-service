-- CreateTable
CREATE TABLE "Companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stores" (
    "id" SERIAL NOT NULL,
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accounts" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "code" INTEGER NOT NULL,
    "deactive" BOOLEAN NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journals" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal_Accounts" (
    "id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,

    CONSTRAINT "Journal_Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "store_id" INTEGER,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheduled_Trans" (
    "id" SERIAL NOT NULL,
    "company_id" UUID,
    "account_id" INTEGER,
    "type" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Scheduled_Trans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheduled_Trans_Accs" (
    "id" SERIAL NOT NULL,
    "schedule_id" INTEGER,
    "account_id" INTEGER,
    "nominal" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Scheduled_Trans_Accs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trans" (
    "id" SERIAL NOT NULL,
    "company_id" UUID,
    "code" TEXT NOT NULL,
    "account_id" INTEGER,
    "type" INTEGER NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Trans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auto_Trans" (
    "id" SERIAL NOT NULL,
    "pos_id" INTEGER NOT NULL,
    "acc_debit_id" INTEGER NOT NULL,
    "acc_kredit_id" INTEGER NOT NULL,

    CONSTRAINT "Auto_Trans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Stores" ADD CONSTRAINT "Stores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journals" ADD CONSTRAINT "Journals_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans" ADD CONSTRAINT "Scheduled_Trans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans" ADD CONSTRAINT "Scheduled_Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans_Accs" ADD CONSTRAINT "Scheduled_Trans_Accs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_debit_id_fkey" FOREIGN KEY ("acc_debit_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_kredit_id_fkey" FOREIGN KEY ("acc_kredit_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
