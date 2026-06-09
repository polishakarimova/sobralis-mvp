import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getBotUsername } from "@/lib/telegram";

function normalizeReturnTo(value: unknown) {
  if (typeof value !== "string") return "/profile/events";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "/profile/events";
  if (trimmed.startsWith("//")) return "/profile/events";
  return trimmed.slice(0, 300);
}

function getAuthErrorMessage(error: unknown) {
  if (process.env.NODE_ENV === "production") return "Telegram auth is temporarily unavailable";

  const message = error instanceof Error ? error.message : "";
  if (message.includes("Cannot read properties of undefined")) {
    return "Локальный Telegram-вход не готов: dev-сервер держит старый Prisma Client. Перезапустите npm run dev или откройте demo-карточку.";
  }
  if (message.includes("EACCES") || message.includes("ECONN") || message.includes("connect ")) {
    return "Локально нет доступа к базе для Telegram-входа. Проверьте доступ к Timeweb PostgreSQL или откройте demo-карточку.";
  }
  return message || "Telegram auth is not configured locally";
}

export async function POST(request: Request) {
  try {
    const token = crypto.randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const rawBody = await request.text();
    let body: { returnTo?: unknown } = {};
    try {
      body = rawBody ? (JSON.parse(rawBody) as { returnTo?: unknown }) : {};
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const returnTo = normalizeReturnTo(body.returnTo);

    await prisma.telegramLoginRequest.create({
      data: {
        token,
        returnTo,
        expiresAt,
      },
    });

    const botUsername = getBotUsername();

    return NextResponse.json({
      ok: true,
      data: {
        token,
        expiresAt,
        botUrl: `https://t.me/${botUsername}?start=login_${token}`,
      },
    });
  } catch (error) {
    console.error("Telegram login start error", error);
    return NextResponse.json({ ok: false, error: getAuthErrorMessage(error) }, { status: 500 });
  }
}
