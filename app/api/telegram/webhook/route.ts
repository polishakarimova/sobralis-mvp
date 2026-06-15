import crypto from "node:crypto";

import { ConsentType } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  completeTelegramLogin,
  getAppUrl,
  getBotToken,
  type TelegramUpdate,
  upsertTelegramUser,
} from "@/lib/telegram";
import { acceptWaitlistEntry, skipWaitlistEntry } from "@/lib/waitlist";

type TelegramInlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
};

type TelegramWebhookMethod = {
  method: "sendMessage" | "answerCallbackQuery";
  chat_id?: number | string;
  callback_query_id?: string;
  text?: string;
  parse_mode?: "HTML";
  disable_web_page_preview?: boolean;
  reply_markup?: {
    inline_keyboard: TelegramInlineKeyboardButton[][];
  };
};

function checkWebhookSecret(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) throw new Error("TELEGRAM_WEBHOOK_SECRET is not configured");
  const actual = request.headers.get("x-telegram-bot-api-secret-token") || "";
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function appendLoginToken(returnTo: string, token: string) {
  const fallback = "/profile/events";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : fallback;
  const [pathAndSearch, hash = ""] = safeReturnTo.split("#");
  const separator = pathAndSearch.includes("?") ? "&" : "?";
  const withToken = `${pathAndSearch}${separator}loginToken=${encodeURIComponent(token)}`;
  return hash ? `${withToken}#${hash}` : withToken;
}

function botDocumentUrl(fileName: string) {
  return `${getAppUrl()}/bot-documents/${fileName}`;
}

function telegramMessage(
  chatId: number | string,
  text: string,
  inlineKeyboard: TelegramInlineKeyboardButton[][] = [
    [{ text: "Открыть сервис", web_app: { url: `${getAppUrl()}/app` } }],
    [{ text: "Мои события", web_app: { url: `${getAppUrl()}/profile/events` } }],
  ],
): TelegramWebhookMethod {
  return {
    method: "sendMessage",
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  };
}

function getTelegramApiUrl(method: string) {
  const base = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
  return `${base}/bot${getBotToken()}/${method}`;
}

async function sendTelegramMethod(methodPayload: TelegramWebhookMethod) {
  const { method, ...payload } = methodPayload;
  const controller = new AbortController();
  const timeoutMs = Number(process.env.TELEGRAM_API_TIMEOUT_MS || 1500);
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 1500);

  try {
    const response = await fetch(getTelegramApiUrl(method), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Telegram ${method} failed: ${response.status} ${responseText}`);
    }
    const responseBody = responseText ? (JSON.parse(responseText) as { result?: { message_id?: number } }) : {};
    console.info("Telegram webhook response sent", {
      method,
      chatId: "chat_id" in payload ? payload.chat_id : undefined,
      messageId: responseBody.result?.message_id,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function requiredConsentMessage(chatId: number | string) {
  return telegramMessage(
    chatId,
    [
      "Привет! Я бот «Собрались» — помогу открывать события, занимать места и получать уведомления.",
      "",
      "Перед началом работы обязательно ознакомьтесь с документами.",
      "",
      "Нажимая кнопку ниже, вы подтверждаете, что ознакомились с документами и даёте согласие на обработку своего Telegram ID, имени и username для использования сервиса.",
    ].join("\n"),
    [
      [{ text: "📄 Политика конфиденциальности", url: botDocumentUrl("privacy-policy.html") }],
      [{ text: "📄 Согласие на обработку данных", url: botDocumentUrl("personal-data-consent.html") }],
      [{ text: "✅ Принимаю и даю согласие", callback_data: "required_consent_accept" }],
    ],
  );
}

function marketingConsentMessage(chatId: number | string) {
  return telegramMessage(
    chatId,
    [
      "💌 Хотите получать рекламную рассылку от «Собрались»?",
      "",
      "Советы по организации встреч, акции, новости и полезные материалы. Это рекламные сообщения. Отписаться можно в любой момент.",
      "",
      "Это необязательно — можно пропустить.",
    ].join("\n"),
    [
      [{ text: "📄 Согласие на рекламную рассылку", url: botDocumentUrl("marketing-consent.html") }],
      [{ text: "✅ Да, согласна на рекламную рассылку", callback_data: "marketing_consent_yes" }],
      [{ text: "Нет, спасибо", callback_data: "marketing_consent_no" }],
    ],
  );
}

function mainMenuMessage(chatId: number | string, text = "Готово. Теперь можно открыть «Собрались» и продолжить.") {
  return telegramMessage(chatId, text, [
    [{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/app` } }],
    [{ text: "Создать событие", web_app: { url: `${getAppUrl()}/app?intent=create` } }],
    [{ text: "Мои события", web_app: { url: `${getAppUrl()}/profile/events` } }],
  ]);
}

async function recordConsent(userId: string, type: ConsentType, value: boolean) {
  await prisma.consent.create({
    data: {
      userId,
      type,
      value,
    },
  });
}

async function recordRequiredBotConsents(userId: string) {
  await prisma.$transaction([
    prisma.consent.create({ data: { userId, type: ConsentType.service_terms, value: true } }),
    prisma.consent.create({ data: { userId, type: ConsentType.personal_data, value: true } }),
    prisma.consent.create({ data: { userId, type: ConsentType.telegram_notifications, value: true } }),
  ]);
}

function eventInviteMessage(chatId: number | string, eventId: string) {
  return telegramMessage(
    chatId,
    "Вас пригласили на событие в «Собрались». Откройте карточку, чтобы занять место, оставить комментарий или попасть в лист ожидания.",
    [
      [{ text: "Открыть событие", web_app: { url: `${getAppUrl()}/app?event=${encodeURIComponent(eventId)}` } }],
      [{ text: "Мои события", web_app: { url: `${getAppUrl()}/profile/events` } }],
    ],
  );
}

async function handleMessage(update: TelegramUpdate): Promise<TelegramWebhookMethod | undefined> {
  const message = update.message;
  if (!message?.from) return;
  if (!message.text) return requiredConsentMessage(message.chat.id);

  const text = message.text.trim();

  if (text.startsWith("/start")) {
    const payload = text.split(/\s+/)[1] || "";

    if (payload.startsWith("login_")) {
      const token = payload.replace("login_", "");
      return telegramMessage(
        message.chat.id,
        "Чтобы войти в «Собрались», нажмите «Авторизоваться». Мы сохраним ваш Telegram ID, имя и username, чтобы открыть личный кабинет и присылать уведомления по событиям.",
        [
          [{ text: "Авторизоваться", callback_data: `login_confirm:${token}` }],
          [{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/profile/events` } }],
        ],
      );
    }

    if (payload.startsWith("event_")) {
      const eventId = payload.replace("event_", "");
      return eventInviteMessage(message.chat.id, eventId);
    }

    return requiredConsentMessage(message.chat.id);
  }

  if (text.startsWith("/help")) {
    return telegramMessage(
      message.chat.id,
      "Как пользоваться:\n1. Нажмите «Открыть сервис» или голубую кнопку меню внизу слева.\n2. В «Мои события» будут ваши мероприятия.\n3. Если освободится место из листа ожидания, я пришлю уведомление с кнопками «Да» и «Нет».",
    );
  }

  if (text.startsWith("/events")) {
    return telegramMessage(message.chat.id, "Здесь будут твои мероприятия. Быстрее открыть их можно через кнопку «Мои события» ниже.", [
      [{ text: "Мои события", web_app: { url: `${getAppUrl()}/profile/events` } }],
      [{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/app` } }],
    ]);
  }

  return telegramMessage(
    message.chat.id,
    "Я понимаю команды /start, /help и /events. А сервис можно открыть через кнопку ниже.",
  );
}

async function handleCallback(update: TelegramUpdate): Promise<TelegramWebhookMethod | undefined> {
  const callback = update.callback_query;
  if (!callback) return;

  const data = callback.data || "";

  if (data === "required_consent_accept") {
    void upsertTelegramUser(callback.from, callback.message?.chat.id)
      .then((user) => recordRequiredBotConsents(user.id))
      .catch((error) => console.error("Telegram required consent save error", error));

    if (callback.message?.chat.id) {
      return marketingConsentMessage(callback.message.chat.id);
    }
    return;
  }

  if (data === "marketing_consent_yes" || data === "marketing_consent_no") {
    const accepted = data === "marketing_consent_yes";
    void upsertTelegramUser(callback.from, callback.message?.chat.id)
      .then((user) => recordConsent(user.id, ConsentType.marketing_offers, accepted))
      .catch((error) => console.error("Telegram marketing consent save error", error));

    if (callback.message?.chat.id) {
      return mainMenuMessage(
        callback.message.chat.id,
        accepted
          ? "Спасибо. Рекламная рассылка подключена. Теперь можно открыть «Собрались»."
          : "Хорошо, рекламную рассылку пропускаем. Теперь можно открыть «Собрались».",
      );
    }
    return;
  }

  const user = await upsertTelegramUser(callback.from, callback.message?.chat.id);

  if (data.startsWith("login_confirm:")) {
    const token = data.replace("login_confirm:", "");
    const completed = await completeTelegramLogin(token, user.id);

    if (callback.message?.chat.id) {
      return telegramMessage(
        callback.message.chat.id,
        completed.ok
          ? "Готово, вход подтверждён. Нажмите «Вернуться в приложение», и «Собрались» откроет нужный экран."
          : "Не получилось подтвердить вход: ссылка устарела. Вернитесь на сайт и нажмите «Авторизоваться» ещё раз.",
        completed.ok
          ? [
              [
                {
                  text: completed.returnTo?.startsWith("/app?event=") ? "Вернуться к событию" : "Вернуться в приложение",
                  web_app: { url: `${getAppUrl()}${appendLoginToken(completed.returnTo, token)}` },
                },
              ],
            ]
          : [[{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/profile/events` } }]],
      );
    }
    return;
  }

  if (data.startsWith("waitlist_accept:")) {
    const waitlistEntryId = data.replace("waitlist_accept:", "");
    const result = await acceptWaitlistEntry(waitlistEntryId, user.id);
    if (callback.message?.chat.id) {
      return telegramMessage(
        callback.message.chat.id,
        result.ok
          ? "Готово, место за вами закреплено. Откройте событие, чтобы посмотреть карточку."
          : `Не получилось занять место: ${result.error}`,
        result.ok
          ? [[{ text: "Открыть событие", web_app: { url: `${getAppUrl()}/app?event=${encodeURIComponent(result.participant.eventId)}` } }]]
          : [[{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/app` } }]],
      );
    }
    return;
  }

  if (data.startsWith("waitlist_skip:")) {
    const waitlistEntryId = data.replace("waitlist_skip:", "");
    const result = await skipWaitlistEntry(waitlistEntryId, user.id);
    return {
      method: "answerCallbackQuery",
      callback_query_id: callback.id,
      text: result.ok ? "Приглашение пропущено" : result.error,
    };
  }

  return {
    method: "answerCallbackQuery",
    callback_query_id: callback.id,
    text: "Готово",
  };
}

export async function POST(request: Request) {
  try {
    if (!checkWebhookSecret(request)) {
      return NextResponse.json({ ok: false, error: "Invalid Telegram webhook secret" }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;
    console.info("Telegram webhook update received", {
      keys: Object.keys(update),
      hasMessage: Boolean(update.message),
      hasCallbackQuery: Boolean(update.callback_query),
      messageText: update.message?.text,
      chatId: update.message?.chat.id || update.callback_query?.message?.chat.id,
    });
    const telegramMethod = (await handleMessage(update)) || (await handleCallback(update));
    if (telegramMethod) {
      if (update.message?.text?.trim().startsWith("/start")) {
        await sendTelegramMethod({
          method: "sendMessage",
          chat_id: update.message.chat.id,
          text: "Собрались на связи. Сейчас покажу вход и документы.",
          disable_web_page_preview: true,
        });
      }
      await sendTelegramMethod(telegramMethod);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: false, error: "Telegram webhook error" }, { status: 500 });
  }
}
