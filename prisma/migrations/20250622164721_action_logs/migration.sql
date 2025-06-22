-- CreateTable
CREATE TABLE "Action_Log" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "event" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "diff" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Action_Log_user_id_idx" ON "Action_Log"("user_id");

-- CreateIndex
CREATE INDEX "Action_Log_resource_idx" ON "Action_Log"("resource");
