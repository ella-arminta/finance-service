-- CreateTable
CREATE TABLE "Companies" (
    "company_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "Branchs" (
    "branch_id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branchs_pkey" PRIMARY KEY ("branch_id")
);

-- CreateTable
CREATE TABLE "Accounts" (
    "account_id" SERIAL NOT NULL,
    "branch_id" INTEGER,
    "code" INTEGER NOT NULL,
    "deactive" BOOLEAN NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Journals" (
    "journal_id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journals_pkey" PRIMARY KEY ("journal_id")
);

-- CreateTable
CREATE TABLE "Journal_Accounts" (
    "ja_id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,

    CONSTRAINT "Journal_Accounts_pkey" PRIMARY KEY ("ja_id")
);

-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "branch_id" INTEGER,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Scheduled_Trans" (
    "schedule_id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "account_id" INTEGER,
    "type" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Scheduled_Trans_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "Scheduled_Trans_Accs" (
    "sched_acc_id" SERIAL NOT NULL,
    "schedule_id" INTEGER,
    "account_id" INTEGER,
    "nominal" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Scheduled_Trans_Accs_pkey" PRIMARY KEY ("sched_acc_id")
);

-- CreateTable
CREATE TABLE "Trans" (
    "trans_id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "code" TEXT NOT NULL,
    "account_id" INTEGER,
    "type" INTEGER NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Trans_pkey" PRIMARY KEY ("trans_id")
);

-- CreateTable
CREATE TABLE "Auto_Trans" (
    "auto_id" SERIAL NOT NULL,
    "pos_id" INTEGER NOT NULL,
    "acc_debit_id" INTEGER NOT NULL,
    "acc_kredit_id" INTEGER NOT NULL,

    CONSTRAINT "Auto_Trans_pkey" PRIMARY KEY ("auto_id")
);

-- AddForeignKey
ALTER TABLE "Branchs" ADD CONSTRAINT "Branchs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branchs"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journals" ADD CONSTRAINT "Journals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branchs"("branch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journals"("journal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branchs"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans" ADD CONSTRAINT "Scheduled_Trans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans" ADD CONSTRAINT "Scheduled_Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans_Accs" ADD CONSTRAINT "Scheduled_Trans_Accs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_debit_id_fkey" FOREIGN KEY ("acc_debit_id") REFERENCES "Accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_kredit_id_fkey" FOREIGN KEY ("acc_kredit_id") REFERENCES "Accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
