-- AlterTable
ALTER TABLE "Trans" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" UUID;
