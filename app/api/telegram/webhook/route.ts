import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  answerCallbackQuery,
  completeTelegramLogin,
  sendTelegramLoginRequestMessage,
  sendTelegramMessage,
  type TelegramUpdate,
  upsertTelegramUser,
} from "@/lib/telegram";
import { acceptWaitlistEntry, skipWaitlistEntry } from "@/lib/waitlist";

function checkWebhookSecret(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) throw new Error("TELEGRAM_WEBHOOK_SECRET is not configured");
  const actual = request.headers.get("x-telegram-bot-api-secret-token") || "";
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

async function safeSendTelegramMessage(
  chatId: number | string,
  text: string,
  options: { appPath?: string; primaryText?: string } = {},
) {
  try {
    await sendTelegramMessage(chatId, text, options);
  } catch (error) {
    console.error("Telegram send message error", error);
  }
}

async function safeAnswerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await answerCallbackQuery(callbackQueryId, text);
  } catch (error) {
    console.error("Telegram answer callback error", error);
  }
}

async function safeSendTelegramLoginRequestMessage(chatId: number | string, token: string) {
  try {
    await sendTelegramLoginRequestMessage(chatId, token);
  } catch (error) {
    console.error("Telegram login request error", error);
  }
}

function appendLoginToken(returnTo: string, token: string) {
  const fallback = "/profile/events";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : fallback;
  const [pathAndSearch, hash = ""] = safeReturnTo.split("#");
  const separator = pathAndSearch.includes("?") ? "&" : "?";
  const withToken = `${pathAndSearch}${separator}loginToken=${encodeURIComponent(token)}`;
  return hash ? `${withToken}#${hash}` : withToken;
}

async function sendEventInvite(chatId: number | string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, date: true, startTime: true, place: { select: { title: true } } },
  });

  if (!event) {
    await safeSendTelegramMessage(chatId, "Не нашла это событие. Попросите организатора отправить новую ссылку.");
    return;
  }

  await safeSendTelegramMessage(
    chatId,
    `Вас пригласили на «${event.title}». Откройте карточку события, чтобы занять место, оставить комментарий или попасть в лист ожидания.`,
    { appPath: `/app?event=${encodeURIComponent(eventId)}`, primaryText: "Открыть событие" },
  );
}

async function handleMessage(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.from || !message.text) return;

  const text = message.text.trim();

  if (text.startsWith("/start")) {
    const payload = text.split(/\s+/)[1] || "";

    if (payload.startsWith("login_")) {
      const token = payload.replace("login_", "");
      await safeSendTelegramLoginRequestMessage(message.chat.id, token);
      return;
    }

    await upsertTelegramUser(message.from, message.chat.id);

    if (payload.startsWith("event_")) {
      const eventId = payload.replace("event_", "");
      await sendEventInvite(message.chat.id, eventId);
      return;
    }

    await safeSendTelegramMessage(
      message.chat.id,
      "Привет! Я бот сервиса «Собрались». Через меня удобно открывать события, занимать места и получать уведомления по листу ожидания.",
    );
    return;
  }

  await upsertTelegramUser(message.from, message.chat.id);

  if (text.startsWith("/help")) {
    await safeSendTelegramMessage(
      message.chat.id,
      "Как пользоваться:\n1. Нажмите «Открыть сервис» или голубую кнопку меню внизу слева.\n2. В «Мои события» будут ваши мероприятия.\n3. Если освободится место из листа ожидания, я пришлю уведомление с кнопками «Да» и «Нет».",
    );
    return;
  }

  if (text.startsWith("/events")) {
    await safeSendTelegramMessage(message.chat.id, "Здесь будут твои мероприятия. Быстрее открыть их можно через кнопку «Мои события» ниже.", {
      appPath: "/profile/events",
      primaryText: "Мои события",
    });
    return;
  }

  await safeSendTelegramMessage(
    message.chat.id,
    "Я понимаю команды /start, /help и /events. А сервис можно открыть через кнопку ниже.",
  );
}

async function handleCallback(update: TelegramUpdate) {
  const callback = update.callback_query;
  if (!callback) return;

  const user = await upsertTelegramUser(callback.from, callback.message?.chat.id);
  const data = callback.data || "";

  if (data.startsWith("login_confirm:")) {
    const token = data.replace("login_confirm:", "");
    const completed = await completeTelegramLogin(token, user.id);
    await safeAnswerCallbackQuery(callback.id, completed.ok ? "Вход подтверждён" : "Ссылка для входа устарела");

    if (callback.message?.chat.id) {
      await safeSendTelegramMessage(
        callback.message.chat.id,
        completed.ok
          ? "Готово, вход подтверждён. Нажмите «Вернуться в приложение», и «Собрались» откроет нужный экран."
          : "Не получилось подтвердить вход: ссылка устарела. Вернитесь на сайт и нажмите «Авторизоваться» ещё раз.",
        completed.ok
          ? {
              appPath: appendLoginToken(completed.returnTo, token),
              primaryText: completed.returnTo?.startsWith("/app?event=") ? "Вернуться к событию" : "Вернуться в приложение",
            }
          : {},
      );
    }
    return;
  }

  if (data.startsWith("waitlist_accept:")) {
    const waitlistEntryId = data.replace("waitlist_accept:", "");
    const result = await acceptWaitlistEntry(waitlistEntryId, user.id);
    await safeAnswerCallbackQuery(callback.id, result.ok ? "Место закреплено за вами" : result.error);
    if (callback.message?.chat.id) {
      await safeSendTelegramMessage(
        callback.message.chat.id,
        result.ok
          ? "Готово, место за вами закреплено. Откройте событие, чтобы посмотреть карточку."
          : `Не получилось занять место: ${result.error}`,
        result.ok ? { appPath: `/app?event=${encodeURIComponent(result.participant.eventId)}`, primaryText: "Открыть событие" } : {},
      );
    }
    return;
  }

  if (data.startsWith("waitlist_skip:")) {
    const waitlistEntryId = data.replace("waitlist_skip:", "");
    const result = await skipWaitlistEntry(waitlistEntryId, user.id);
    await safeAnswerCallbackQuery(callback.id, result.ok ? "Приглашение пропущено" : result.error);
    return;
  }

  await safeAnswerCallbackQuery(callback.id, "Готово");
}

export async function POST(request: Request) {
  try {
    if (!checkWebhookSecret(request)) {
      return NextResponse.json({ ok: false, error: "Invalid Telegram webhook secret" }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;
    await handleMessage(update);
    await handleCallback(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: false, error: "Telegram webhook error" }, { status: 500 });
  }
}
