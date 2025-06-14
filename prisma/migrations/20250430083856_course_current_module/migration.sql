-- AlterTable
ALTER TABLE "CourseProgress" ADD COLUMN     "currentModuleId" INTEGER;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_currentModuleId_fkey" FOREIGN KEY ("currentModuleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
