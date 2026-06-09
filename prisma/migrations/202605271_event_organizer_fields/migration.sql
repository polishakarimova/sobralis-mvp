ALTER TABLE "Event" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "Event" ADD COLUMN "mapUrl" TEXT;
ALTER TABLE "EventParticipant" ADD COLUMN "comment" TEXT;
ALTER TABLE "WaitlistEntry" ADD COLUMN "comment" TEXT;
