import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

export type TelegramUserPayload = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

type TelegramMessage = {
  chat: { id: number | string };
  from?: TelegramUserPayload;
  text?: string;
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUserPayload;
  message?: { message_id?: number; chat: { id: number | string } };
  data?: string;
};

type TelegramInlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
};

export type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

const TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = 60 * 60 * 24;

export function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

export function getAppUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function getBotUsername() {
  return (process.env.TELEGRAM_BOT_USERNAME || "sobraliss_bot").replace(/^@/, "");
}

function telegramName(user: TelegramUserPayload) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username || `Telegram ${user.id}`;
}

function getTelegramApiUrl(method: string) {
  const base = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
  return `${base}/bot${getBotToken()}/${method}`;
}

async function fetchTelegram(method: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.TELEGRAM_API_TIMEOUT_MS || 1500);
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 1500);

  try {
    return await fetch(getTelegramApiUrl(method), { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function botDocumentUrl(fileName: string) {
  return `${getAppUrl()}/bot-documents/${fileName}`;
}

async function sendTelegramInlineKeyboardMessage(
  chatId: number | string,
  text: string,
  inlineKeyboard: TelegramInlineKeyboardButton[][],
  options: { parseMode?: "HTML" } = {},
) {
  if (process.env.TELEGRAM_NOTIFICATIONS_DISABLED === "true") return;

  const response = await fetchTelegram("sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options.parseMode,
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status} ${await response.text()}`);
  }
}

export async function upsertTelegramUser(user: TelegramUserPayload, chatId?: number | string) {
  const telegramId = String(user.id);
  const data = {
    name: telegramName(user),
    telegramId,
    telegramUsername: user.username ?? null,
    telegramFirstName: user.first_name ?? null,
    telegramLastName: user.last_name ?? null,
    telegramPhotoUrl: user.photo_url ?? null,
    telegramLinkedAt: new Date(),
    role: "organizer" as const,
  };

  const savedUser = await prisma.user.upsert({
    where: { telegramId },
    update: data,
    create: {
      ...data,
      authIdentities: {
        create: {
          provider: "telegram",
          providerUserId: telegramId,
        },
      },
    },
  });

  await prisma.authIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: "telegram",
        providerUserId: telegramId,
      },
    },
    update: {
      userId: savedUser.id,
    },
    create: {
      userId: savedUser.id,
      provider: "telegram",
      providerUserId: telegramId,
    },
  });

  if (chatId) {
    await prisma.telegramAccount.upsert({
      where: { telegramId },
      update: {
        userId: savedUser.id,
        chatId: String(chatId),
        username: user.username ?? null,
      },
      create: {
        userId: savedUser.id,
        telegramId,
        chatId: String(chatId),
        username: user.username ?? null,
      },
    });
  }

  return savedUser;
}

export async function sendTelegramRequiredConsentMessage(chatId: number | string) {
  await sendTelegramInlineKeyboardMessage(
    chatId,
    [
      "Привет! Я бот «Собрались» — помогу открывать события, занимать места и получать уведомления.",
      "",
      "Перед началом работы обязательно ознакомьтесь:",
      "",
      `📄 <a href="${botDocumentUrl("privacy-policy.html")}">Политика конфиденциальности</a>`,
      `📄 <a href="${botDocumentUrl("personal-data-consent.html")}">Согласие на обработку персональных данных</a>`,
      "",
      "Нажимая кнопку ниже, вы подтверждаете, что ознакомились с документами и даёте согласие на обработку своего Telegram ID, имени и username для использования сервиса.",
    ].join("\n"),
    [[{ text: "✅ Принимаю и даю согласие", callback_data: "required_consent_accept" }]],
    { parseMode: "HTML" },
  );
}

export async function sendTelegramMarketingConsentMessage(chatId: number | string) {
  await sendTelegramInlineKeyboardMessage(
    chatId,
    [
      "💌 Хотите получать рекламную рассылку от «Собрались»?",
      "",
      "Советы по организации встреч, акции, новости и полезные материалы. Это рекламные сообщения. Отписаться можно в любой момент.",
      "",
      `📄 <a href="${botDocumentUrl("marketing-consent.html")}">Согласие на рекламную рассылку</a>`,
      "",
      "Это необязательно — можно пропустить.",
    ].join("\n"),
    [
      [{ text: "✅ Да, согласна на рекламную рассылку", callback_data: "marketing_consent_yes" }],
      [{ text: "Нет, спасибо", callback_data: "marketing_consent_no" }],
    ],
    { parseMode: "HTML" },
  );
}

export async function sendTelegramMainMenuMessage(chatId: number | string, text = "Готово. Теперь можно открыть «Собрались» и продолжить.") {
  const appUrl = getAppUrl();
  await sendTelegramInlineKeyboardMessage(chatId, text, [
    [{ text: "Открыть приложение", web_app: { url: `${appUrl}/app` } }],
    [{ text: "Создать событие", web_app: { url: `${appUrl}/app?intent=create` } }],
    [{ text: "Мои события", web_app: { url: `${appUrl}/profile/events` } }],
  ]);
}

export async function completeTelegramLogin(token: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.telegramLoginRequest.findUnique({ where: { token } });

    if (!request || request.usedAt || request.expiresAt < new Date()) {
      return { ok: false as const };
    }

    const updated = await tx.telegramLoginRequest.updateMany({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        userId,
        usedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return { ok: false as const };
    }

    return { ok: true as const, returnTo: request.returnTo || "/profile/events" };
  });
}

export function verifyTelegramMiniAppInitData(initData: string) {
  const botToken = getBotToken();
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Telegram initData hash is missing");

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) throw new Error("Telegram initData auth_date is missing");
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds < 0 || ageSeconds > TELEGRAM_INIT_DATA_MAX_AGE_SECONDS) {
    throw new Error("Telegram initData is expired");
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(calculatedHash, "hex");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new Error("Telegram initData signature is invalid");
  }

  const rawUser = params.get("user");
  if (!rawUser) throw new Error("Telegram initData user is missing");
  return JSON.parse(rawUser) as TelegramUserPayload;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options: { appPath?: string; primaryText?: string } = {},
) {
  if (process.env.TELEGRAM_NOTIFICATIONS_DISABLED === "true") return;

  const appUrl = getAppUrl();
  const appPath = options.appPath?.startsWith("/") ? options.appPath : "/app";
  const primaryText = options.primaryText || "Открыть сервис";
  const response = await fetchTelegram("sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [
          [{ text: primaryText, web_app: { url: `${appUrl}${appPath}` } }],
          [{ text: "Мои события", web_app: { url: `${appUrl}/profile/events` } }],
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status} ${await response.text()}`);
  }
}

export async function sendTelegramLoginRequestMessage(chatId: number | string, tokenValue: string) {
  if (process.env.TELEGRAM_NOTIFICATIONS_DISABLED === "true") return;

  const appUrl = getAppUrl();
  const response = await fetchTelegram("sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text:
        "Чтобы войти в «Собрались», нажмите «Войти в Собрались». Мы сохраним ваш Telegram ID, имя и username, чтобы открыть личный кабинет и присылать уведомления по событиям.",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Войти в Собрались", callback_data: `login_confirm:${tokenValue}` }],
          [{ text: "Открыть приложение", web_app: { url: `${appUrl}/profile/events` } }],
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram login request failed: ${response.status} ${await response.text()}`);
  }
}

export async function sendWaitlistInviteMessage(chatId: number | string, eventTitle: string, waitlistEntryId: string) {
  if (process.env.TELEGRAM_NOTIFICATIONS_DISABLED === "true") return;

  const appUrl = getAppUrl();
  const response = await fetchTelegram("sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `В событии «${eventTitle}» освободилось место. Хотите занять его?`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "Да, занять место", callback_data: `waitlist_accept:${waitlistEntryId}` }],
          [{ text: "Нет, пропустить", callback_data: `waitlist_skip:${waitlistEntryId}` }],
          [{ text: "Открыть событие", web_app: { url: `${appUrl}/app?waitlist=${waitlistEntryId}` } }],
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram waitlist invite failed: ${response.status} ${await response.text()}`);
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetchTelegram("answerCallbackQuery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}
