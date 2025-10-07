-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN DEFAULT false;
