-- DropIndex
DROP INDEX "Review_userId_courseId_key";

-- AlterTable
ALTER TABLE "GeneralReview" ADD COLUMN     "authorExperience" TEXT,
ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "authorSurname" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "authorExperience" TEXT,
ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "authorSurname" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;
