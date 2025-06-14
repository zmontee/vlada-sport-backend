-- AlterTable
ALTER TABLE "LessonProgress" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ModuleProgress" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT true;
