import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSessionValue, getSessionCookieName } from "@/lib/session";

function getAuthStatusErrorMessage(error: unknown) {
  if (process.env.NODE_ENV === "production") return "Telegram auth status is temporarily unavailable";

  const message = error instanceof Error ? error.message : "";
  if (message.includes("Cannot read properties of undefined")) {
    return "Локальная проверка Telegram-входа не готова: dev-сервер держит старый Prisma Client. Перезапустите npm run dev или откройте demo-карточку.";
  }
  if (message.includes("EACCES") || message.includes("ECONN") || message.includes("connect ")) {
    return "Локально нет доступа к базе для проверки Telegram-входа. Проверьте доступ к Timeweb PostgreSQL или откройте demo-карточку.";
  }
  return message || "Telegram auth status is not configured locally";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ ok: false, error: "Login token is required" }, { status: 400 });
    }

    const loginRequest = await prisma.telegramLoginRequest.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!loginRequest) {
      return NextResponse.json({ ok: false, error: "Login request not found" }, { status: 404 });
    }

    if (!loginRequest.user) {
      if (loginRequest.expiresAt < new Date()) {
        return NextResponse.json({ ok: false, error: "Login request expired" }, { status: 410 });
      }

      return NextResponse.json({ ok: true, data: { status: "pending" } });
    }

    if (loginRequest.usedAt) {
      const confirmedAgeMs = Date.now() - loginRequest.usedAt.getTime();
      if (confirmedAgeMs > 10 * 60 * 1000) {
        return NextResponse.json({ ok: false, error: "Login request expired" }, { status: 410 });
      }
    } else if (loginRequest.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "Login request expired" }, { status: 410 });
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        status: "confirmed",
        returnTo: loginRequest.returnTo || "/profile/events",
        user: {
          id: loginRequest.user.id,
          name: loginRequest.user.name,
          phone: loginRequest.user.phone,
          telegramUsername: loginRequest.user.telegramUsername,
        },
      },
    });

    response.cookies.set("sobralis_user_id", loginRequest.user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set(getSessionCookieName(), createSessionValue(loginRequest.user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Telegram login status error", error);
    return NextResponse.json({ ok: false, error: getAuthStatusErrorMessage(error) }, { status: 500 });
  }
}
