/*
  Warnings:

  - You are about to drop the column `lastPosition` on the `LessonProgress` table. All the data in the column will be lost.
  - You are about to drop the column `watchedSeconds` on the `LessonProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LessonProgress" DROP COLUMN "lastPosition",
DROP COLUMN "watchedSeconds",
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;
