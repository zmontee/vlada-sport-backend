-- AlterTable
ALTER TABLE "GeneralReview" ADD COLUMN     "authorSex" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "modifiedDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "authorSex" TEXT;
