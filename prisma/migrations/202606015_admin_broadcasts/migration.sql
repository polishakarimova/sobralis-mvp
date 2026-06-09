CREATE TYPE "BroadcastTarget" AS ENUM ('all_users', 'organizers', 'participants');

CREATE TYPE "BroadcastStatus" AS ENUM ('draft', 'simulated_sent', 'cancelled');

CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target" "BroadcastTarget" NOT NULL DEFAULT 'all_users',
    "status" "BroadcastStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAction_entityType_idx" ON "AdminAction"("entityType");
CREATE INDEX "AdminAction_createdAt_idx" ON "AdminAction"("createdAt");
