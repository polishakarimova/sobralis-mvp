-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('guest', 'participant', 'organizer', 'owner', 'admin');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('telegram', 'yandex', 'phone', 'guest');

-- CreateEnum
CREATE TYPE "BookingMode" AS ENUM ('instant', 'request', 'manager');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'request', 'busy');

-- CreateEnum
CREATE TYPE "AddOnType" AS ENUM ('pre_event', 'on_site');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'collecting_interest', 'awaiting_place_confirmation', 'place_confirmed', 'composition_fixed', 'payments_open', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('interested', 'joined', 'waitlisted', 'invited_from_waitlist', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('idle', 'marked', 'confirmed', 'rejected', 'refunded');

-- CreateEnum
CREATE TYPE "ParticipantAddOnStatus" AS ENUM ('selected', 'purchased', 'cancelled');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('waiting', 'marked_paid', 'confirmed_by_owner', 'rejected_by_owner', 'disputed', 'refunded');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('waiting', 'invited', 'accepted', 'skipped');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('pending', 'confirmed', 'busy', 'another_time', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('static_sbp_qr', 'payment_link', 'bank_details', 'api');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('service_terms', 'personal_data', 'marketing_offers', 'telegram_notifications');

-- CreateEnum
CREATE TYPE "TelegramRole" AS ENUM ('user', 'owner', 'manager', 'admin');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'participant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "hourlyRate" INTEGER NOT NULL,
    "minHours" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "extraHourRate" INTEGER NOT NULL,
    "bookingMode" "BookingMode" NOT NULL,
    "availabilityStatus" "AvailabilityStatus" NOT NULL,
    "confirmationTime" TEXT NOT NULL,
    "pricingTitle" TEXT NOT NULL,
    "perHour" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "vibe" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceAddOn" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "type" "AddOnType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceInclude" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "PlaceInclude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "organizerId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "guestsLimit" INTEGER NOT NULL,
    "minGuests" INTEGER NOT NULL,
    "targetBudget" INTEGER NOT NULL,
    "joinDeadline" TIMESTAMP(3) NOT NULL,
    "paymentDeadline" TIMESTAMP(3) NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'collecting_interest',
    "shareSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'idle',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantAddOn" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "priceAtPurchase" INTEGER NOT NULL,
    "status" "ParticipantAddOnStatus" NOT NULL DEFAULT 'selected',

    CONSTRAINT "ParticipantAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantCharge" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "baseAmount" INTEGER NOT NULL,
    "addOnsAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paymentCode" TEXT NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'waiting',
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'waiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'pending',
    "ownerReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "canConfirmBookings" BOOLEAN NOT NULL DEFAULT true,
    "canConfirmPayments" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OwnerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "telegramId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "username" TEXT,
    "role" "TelegramRole" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "value" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerUserId_key" ON "AuthIdentity"("provider", "providerUserId");

-- CreateIndex
CREATE INDEX "PlaceAddOn_placeId_idx" ON "PlaceAddOn"("placeId");

-- CreateIndex
CREATE INDEX "PlaceInclude_placeId_idx" ON "PlaceInclude"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_shareSlug_key" ON "Event"("shareSlug");

-- CreateIndex
CREATE INDEX "Event_placeId_idx" ON "Event"("placeId");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "EventParticipant_eventId_idx" ON "EventParticipant"("eventId");

-- CreateIndex
CREATE INDEX "EventParticipant_userId_idx" ON "EventParticipant"("userId");

-- CreateIndex
CREATE INDEX "ParticipantAddOn_participantId_idx" ON "ParticipantAddOn"("participantId");

-- CreateIndex
CREATE INDEX "ParticipantAddOn_addOnId_idx" ON "ParticipantAddOn"("addOnId");

-- CreateIndex
CREATE INDEX "ParticipantCharge_eventId_idx" ON "ParticipantCharge"("eventId");

-- CreateIndex
CREATE INDEX "ParticipantCharge_participantId_idx" ON "ParticipantCharge"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantCharge_paymentCode_key" ON "ParticipantCharge"("paymentCode");

-- CreateIndex
CREATE INDEX "WaitlistEntry_eventId_idx" ON "WaitlistEntry"("eventId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_idx" ON "WaitlistEntry"("userId");

-- CreateIndex
CREATE INDEX "BookingRequest_eventId_idx" ON "BookingRequest"("eventId");

-- CreateIndex
CREATE INDEX "BookingRequest_placeId_idx" ON "BookingRequest"("placeId");

-- CreateIndex
CREATE INDEX "OwnerAccount_placeId_idx" ON "OwnerAccount"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerAccount_userId_placeId_key" ON "OwnerAccount"("userId", "placeId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAccount_userId_key" ON "TelegramAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAccount_telegramId_key" ON "TelegramAccount"("telegramId");

-- CreateIndex
CREATE INDEX "PaymentMethod_placeId_idx" ON "PaymentMethod"("placeId");

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceAddOn" ADD CONSTRAINT "PlaceAddOn_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceInclude" ADD CONSTRAINT "PlaceInclude_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantAddOn" ADD CONSTRAINT "ParticipantAddOn_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "EventParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantAddOn" ADD CONSTRAINT "ParticipantAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "PlaceAddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantCharge" ADD CONSTRAINT "ParticipantCharge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantCharge" ADD CONSTRAINT "ParticipantCharge_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "EventParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerAccount" ADD CONSTRAINT "OwnerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerAccount" ADD CONSTRAINT "OwnerAccount_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramAccount" ADD CONSTRAINT "TelegramAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
