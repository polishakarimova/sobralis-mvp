CREATE TABLE "TelegramLoginRequest" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLoginRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelegramLoginRequest_token_key" ON "TelegramLoginRequest"("token");
CREATE INDEX "TelegramLoginRequest_userId_idx" ON "TelegramLoginRequest"("userId");
CREATE INDEX "TelegramLoginRequest_expiresAt_idx" ON "TelegramLoginRequest"("expiresAt");

ALTER TABLE "TelegramLoginRequest" ADD CONSTRAINT "TelegramLoginRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
