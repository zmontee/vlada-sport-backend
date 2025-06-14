-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "afterPhotoUrl" TEXT,
ADD COLUMN     "beforePhotoUrl" TEXT;

-- CreateTable
CREATE TABLE "GeneralReview" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "beforePhotoUrl" TEXT,
    "afterPhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "GeneralReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneralReview" ADD CONSTRAINT "GeneralReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
