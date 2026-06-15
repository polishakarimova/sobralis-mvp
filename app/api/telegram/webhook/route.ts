import crypto from "node:crypto";

import { ConsentType } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  completeTelegramLogin,
  getAppUrl,
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
  method: "sendMessage" | "editMessageText" | "editMessageReplyMarkup" | "deleteMessage" | "answerCallbackQuery";
  chat_id?: number | string;
  message_id?: number;
  callback_query_id?: string;
  text?: string;
  parse_mode?: "HTML";
  disable_web_page_preview?: boolean;
  reply_markup?: {
    inline_keyboard: TelegramInlineKeyboardButton[][];
  };
};

type TelegramWebhookResult = TelegramWebhookMethod | { methods: TelegramWebhookMethod[] };

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
    [{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/app` } }],
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

function telegramHtmlMessage(chatId: number | string, text: string, inlineKeyboard: TelegramInlineKeyboardButton[][]): TelegramWebhookMethod {
  return {
    ...telegramMessage(chatId, text, inlineKeyboard),
    parse_mode: "HTML",
  };
}

function telegramMethods(methods: TelegramWebhookMethod[]): TelegramWebhookResult {
  return { methods };
}

function answerCallbackQuery(callbackQueryId: string, text: string): TelegramWebhookMethod {
  return {
    method: "answerCallbackQuery",
    callback_query_id: callbackQueryId,
    text,
  };
}

function editMessageButtons(
  chatId: number | string,
  messageId: number,
  inlineKeyboard: TelegramInlineKeyboardButton[][],
): TelegramWebhookMethod {
  return {
    method: "editMessageReplyMarkup",
    chat_id: chatId,
    message_id: messageId,
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  };
}

function deleteTelegramMessage(chatId: number | string, messageId: number): TelegramWebhookMethod {
  return {
    method: "deleteMessage",
    chat_id: chatId,
    message_id: messageId,
  };
}

function requiredConsentMessage(chatId: number | string) {
  return telegramHtmlMessage(
    chatId,
    [
      "Привет! Я бот <b>«Собрались»</b> — помогу создавать встречи, занимать места и получать уведомления.",
      "",
      "Перед началом работы обязательно ознакомьтесь с документами.",
      "",
      `📄 <a href="${botDocumentUrl("privacy-policy.html")}">Политика конфиденциальности</a>`,
      `📄 <a href="${botDocumentUrl("personal-data-consent.html")}">Согласие на обработку данных</a>`,
      "",
      "Нажимая кнопку ниже, вы подтверждаете, что ознакомились с указанными документами и даёте согласие на обработку своего Telegram ID, имени и username для использования сервиса.",
    ].join("\n"),
    [
      [{ text: "✅ Принимаю и даю согласие", callback_data: "required_consent_accept" }],
    ],
  );
}

function marketingConsentMessage(chatId: number | string) {
  return telegramHtmlMessage(
    chatId,
    [
      "💌 <b>Хотите получать рекламную рассылку от «Собрались»?</b>",
      "",
      "Советы по организации встреч, акции, новости и полезные материалы. <b>Это рекламные сообщения.</b> Отписаться можно в любой момент.",
      "",
      `📄 <a href="${botDocumentUrl("marketing-consent.html")}">Согласие на рекламную рассылку</a>`,
      "",
      "Это необязательно — можно пропустить.",
    ].join("\n"),
    [
      [{ text: "✅ Да, согласна на рекламную рассылку", callback_data: "marketing_consent_yes" }],
      [{ text: "Нет, спасибо", callback_data: "marketing_consent_no" }],
    ],
  );
}

function mainMenuMessage(chatId: number | string, text = "Готово. Теперь можно открыть «Собрались» и продолжить.") {
  return telegramMessage(chatId, text, [
    [{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/app` } }],
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
    ],
  );
}

async function handleMessage(update: TelegramUpdate): Promise<TelegramWebhookResult | undefined> {
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
    ]);
  }

  return telegramMessage(
    message.chat.id,
    "Я понимаю команды /start, /help и /events. А сервис можно открыть через кнопку ниже.",
  );
}

async function handleCallback(update: TelegramUpdate): Promise<TelegramWebhookResult | undefined> {
  const callback = update.callback_query;
  if (!callback) return;

  const data = callback.data || "";

  if (data === "required_consent_accept") {
    void upsertTelegramUser(callback.from, callback.message?.chat.id)
      .then((user) => recordRequiredBotConsents(user.id))
      .catch((error) => console.error("Telegram required consent save error", error));

    if (callback.message?.chat.id && callback.message.message_id) {
      return telegramMethods([
        answerCallbackQuery(callback.id, "Готово"),
        editMessageButtons(callback.message.chat.id, callback.message.message_id, [
          [{ text: "✅ Готово", callback_data: "consent_step_done" }],
        ]),
        deleteTelegramMessage(callback.message.chat.id, callback.message.message_id),
        marketingConsentMessage(callback.message.chat.id),
      ]);
    }

    if (callback.message?.chat.id) {
      return telegramMethods([answerCallbackQuery(callback.id, "Готово"), marketingConsentMessage(callback.message.chat.id)]);
    }
    return answerCallbackQuery(callback.id, "Готово");
  }

  if (data === "marketing_consent_yes" || data === "marketing_consent_no") {
    const accepted = data === "marketing_consent_yes";
    void upsertTelegramUser(callback.from, callback.message?.chat.id)
      .then((user) => recordConsent(user.id, ConsentType.marketing_offers, accepted))
      .catch((error) => console.error("Telegram marketing consent save error", error));

    const finalText = accepted
      ? "Спасибо. Рекламная рассылка подключена. Теперь можно вернуться в приложение."
      : "Спасибо. Рекламная рассылка отключена. Теперь можно вернуться в приложение.";

    if (callback.message?.chat.id && callback.message.message_id) {
      return telegramMethods([
        answerCallbackQuery(callback.id, "Спасибо за ответ"),
        editMessageButtons(callback.message.chat.id, callback.message.message_id, [
          [{ text: "✅ Спасибо за ответ", callback_data: "consent_step_done" }],
        ]),
        deleteTelegramMessage(callback.message.chat.id, callback.message.message_id),
        mainMenuMessage(callback.message.chat.id, finalText),
      ]);
    }

    if (callback.message?.chat.id) {
      return telegramMethods([answerCallbackQuery(callback.id, "Спасибо за ответ"), mainMenuMessage(callback.message.chat.id, finalText)]);
    }
    return answerCallbackQuery(callback.id, "Спасибо за ответ");
  }

  if (data === "consent_step_done") {
    return answerCallbackQuery(callback.id, "Готово");
  }

  if (data === "login_already_confirmed") {
    return answerCallbackQuery(callback.id, "Вы уже авторизованы");
  }

  const user = await upsertTelegramUser(callback.from, callback.message?.chat.id);

  if (data.startsWith("login_confirm:")) {
    const token = data.replace("login_confirm:", "");
    const completed = await completeTelegramLogin(token, user.id);
    const completedReturnTo = completed.returnTo || "/profile/events";

    if (callback.message?.chat.id && callback.message.message_id) {
      return {
        method: "editMessageText",
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text: completed.ok
          ? "✅ Вы авторизованы.\n\nТеперь можно вернуться в приложение и продолжить."
          : "Не получилось подтвердить вход: ссылка устарела. Вернитесь на сайт и нажмите «Авторизоваться» ещё раз.",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: completed.ok
            ? [
                [{ text: "✅ Вы авторизованы", callback_data: "login_already_confirmed" }],
                [
                  {
                    text: completedReturnTo.startsWith("/app?event=") ? "Вернуться к событию" : "Вернуться в приложение",
                    web_app: { url: `${getAppUrl()}${appendLoginToken(completedReturnTo, token)}` },
                  },
                ],
              ]
            : [[{ text: "Открыть приложение", web_app: { url: `${getAppUrl()}/profile/events` } }]],
        },
      };
    }

    if (callback.message?.chat.id) {
      return telegramMessage(callback.message.chat.id, "✅ Вы авторизованы. Теперь можно вернуться в приложение и продолжить.", [
        [
          {
            text: completedReturnTo.startsWith("/app?event=") ? "Вернуться к событию" : "Вернуться в приложение",
            web_app: { url: `${getAppUrl()}${appendLoginToken(completedReturnTo, token)}` },
          },
        ],
      ]);
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
    return answerCallbackQuery(callback.id, result.ok ? "Приглашение пропущено" : result.error);
  }

  return answerCallbackQuery(callback.id, "Готово");
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
      console.info("Telegram webhook method returned", {
        method: "methods" in telegramMethod ? telegramMethod.methods.map((method) => method.method).join(",") : telegramMethod.method,
        chatId: "methods" in telegramMethod ? telegramMethod.methods[0]?.chat_id : telegramMethod.chat_id,
      });
      return NextResponse.json(telegramMethod);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: false, error: "Telegram webhook error" }, { status: 500 });
  }
}
