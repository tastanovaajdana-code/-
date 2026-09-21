-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "studentEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_testId_studentEmail_key" ON "Attempt"("testId", "studentEmail");

