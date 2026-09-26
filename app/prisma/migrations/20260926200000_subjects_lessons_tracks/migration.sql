-- DropForeignKey (old homework/video system, superseded by Subject/Lesson)
ALTER TABLE "Homework" DROP CONSTRAINT IF EXISTS "Homework_groupId_fkey";
ALTER TABLE "Homework" DROP CONSTRAINT IF EXISTS "Homework_testId_fkey";
ALTER TABLE "HomeworkCompletion" DROP CONSTRAINT IF EXISTS "HomeworkCompletion_homeworkId_fkey";
ALTER TABLE "VideoWatch" DROP CONSTRAINT IF EXISTS "VideoWatch_videoLessonId_fkey";

-- DropTable
DROP TABLE IF EXISTS "HomeworkCompletion";
DROP TABLE IF EXISTS "Homework";
DROP TABLE IF EXISTS "VideoWatch";
DROP TABLE IF EXISTS "VideoLesson";

-- AlterTable AdminUser
ALTER TABLE "AdminUser" ADD COLUMN "displayName" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "contact" TEXT;

-- AlterTable Group
ALTER TABLE "Group" ADD COLUMN "curatorId" TEXT;
ALTER TABLE "Group" ADD CONSTRAINT "Group_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Test
ALTER TABLE "Test" ADD COLUMN "track" TEXT NOT NULL DEFAULT 'ort';

-- AlterTable StudentGoal: drop old single-email unique, add subjectId
DROP INDEX IF EXISTS "StudentGoal_email_key";
ALTER TABLE "StudentGoal" ADD COLUMN "subjectId" TEXT;

-- CreateTable Subject
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_track_name_key" ON "Subject"("track", "name");

-- CreateTable Lesson
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT,
    "description" TEXT,
    "durationMinutes" INTEGER,
    "practiceType" TEXT NOT NULL DEFAULT 'none',
    "practiceTestId" TEXT,
    "practiceText" TEXT,
    "dueDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable LessonProgress
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3),
    "practiceDone" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_lessonId_studentEmail_key" ON "LessonProgress"("lessonId", "studentEmail");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_practiceTestId_fkey" FOREIGN KEY ("practiceTestId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentGoal" ADD CONSTRAINT "StudentGoal_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
