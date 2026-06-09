ALTER TABLE "User" ADD COLUMN "telegramId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramFirstName" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramLastName" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramPhotoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramLinkedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
