-- CreateTable
CREATE TABLE "StudentGoal" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "targetPercent" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentGoal_email_key" ON "StudentGoal"("email");
