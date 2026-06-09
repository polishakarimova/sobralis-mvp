import crypto from "node:crypto";
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { createSessionValue, verifySessionValue } from "@/lib/session";
import { upsertTelegramUser, verifyTelegramMiniAppInitData, type TelegramUserPayload } from "@/lib/telegram";

function signInitData(params: URLSearchParams) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  return crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
}

function makeInitData(user: TelegramUserPayload, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams({
    auth_date: String(authDate),
    query_id: `test-${Date.now()}`,
    user: JSON.stringify(user),
  });
  params.set("hash", signInitData(params));
  return params.toString();
}

async function cleanupTelegramUser(telegramId: number) {
  const telegramIdString = String(telegramId);
  const user = await prisma.user.findUnique({ where: { telegramId: telegramIdString }, select: { id: true } });

  if (user) {
    await prisma.telegramLoginRequest.deleteMany({ where: { userId: user.id } });
  }

  await prisma.telegramAccount.deleteMany({ where: { telegramId: telegramIdString } });
  await prisma.authIdentity.deleteMany({ where: { provider: "telegram", providerUserId: telegramIdString } });

  if (user) {
    await prisma.user.deleteMany({ where: { id: user.id } });
  }
}

async function main() {
  const telegramId = 900000000001;
  const telegramUser: TelegramUserPayload = {
    id: telegramId,
    username: `sobralis_test_${telegramId}`,
    first_name: "Тест",
    last_name: "Авторизации",
    photo_url: "https://example.com/avatar.jpg",
  };

  try {
    const parsed = verifyTelegramMiniAppInitData(makeInitData(telegramUser));
    if (parsed.id !== telegramUser.id || parsed.username !== telegramUser.username) {
      throw new Error("Telegram initData parsed user does not match input");
    }

    const savedUser = await upsertTelegramUser(telegramUser, telegramId);
    const reloadedUser = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
      include: { authIdentities: true, telegramAccount: true },
    });

    if (!reloadedUser) throw new Error("User was not saved to database");
    if (reloadedUser.id !== savedUser.id) throw new Error("Saved user id mismatch");
    if (reloadedUser.telegramUsername !== telegramUser.username) throw new Error("telegramUsername was not saved");
    if (reloadedUser.telegramFirstName !== telegramUser.first_name) throw new Error("telegramFirstName was not saved");
    if (reloadedUser.telegramLastName !== telegramUser.last_name) throw new Error("telegramLastName was not saved");
    if (reloadedUser.telegramPhotoUrl !== telegramUser.photo_url) throw new Error("telegramPhotoUrl was not saved");
    if (!reloadedUser.telegramLinkedAt) throw new Error("telegramLinkedAt was not saved");
    if (!reloadedUser.authIdentities.some((identity) => identity.provider === "telegram" && identity.providerUserId === String(telegramId))) {
      throw new Error("Telegram AuthIdentity was not saved");
    }
    if (reloadedUser.telegramAccount?.chatId !== String(telegramId)) {
      throw new Error("TelegramAccount chatId was not saved");
    }

    const session = createSessionValue(reloadedUser.id);
    if (verifySessionValue(session) !== reloadedUser.id) {
      throw new Error("Signed session cookie verification failed");
    }

    let expiredRejected = false;
    try {
      verifyTelegramMiniAppInitData(makeInitData(telegramUser, Math.floor(Date.now() / 1000) - 60 * 60 * 25));
    } catch {
      expiredRejected = true;
    }
    if (!expiredRejected) throw new Error("Expired Telegram initData was not rejected");

    console.log("Telegram auth flow OK:", {
      userId: reloadedUser.id,
      telegramId: reloadedUser.telegramId,
      hasAuthIdentity: true,
      hasTelegramAccount: Boolean(reloadedUser.telegramAccount),
    });
  } finally {
    await cleanupTelegramUser(telegramId);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
