-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_groupId_fkey";

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
