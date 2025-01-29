-- AlterTable
ALTER TABLE "Account_Types" ALTER COLUMN "code" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Trans" ADD COLUMN     "total" INTEGER;

-- AlterTable
ALTER TABLE "Trans_Details" ADD COLUMN     "kas" BOOLEAN NOT NULL DEFAULT false;
