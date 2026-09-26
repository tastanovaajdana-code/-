-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "passageId" TEXT;

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT,
    "text" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
