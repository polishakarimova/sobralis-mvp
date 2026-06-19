import { NextResponse } from "next/server";
import { z } from "zod";

import { readJson } from "@/lib/api";
import { createSessionValue, getSessionCookieName } from "@/lib/session";
import { upsertTelegramUser, verifyTelegramMiniAppInitData } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";
import { ConsentType } from "@prisma/client";

const telegramMiniAppSchema = z.object({
  initData: z.string().min(1),
});

async function hasRequiredConsents(userId: string) {
  const consents = await prisma.consent.findMany({
    where: {
      userId,
      value: true,
      revokedAt: null,
      type: {
        in: [ConsentType.service_terms, ConsentType.personal_data, ConsentType.telegram_notifications],
      },
    },
    select: { type: true },
  });
  const accepted = new Set(consents.map((consent) => consent.type));
  return (
    accepted.has(ConsentType.service_terms) &&
    accepted.has(ConsentType.personal_data) &&
    accepted.has(ConsentType.telegram_notifications)
  );
}

export async function POST(request: Request) {
  try {
    const input = telegramMiniAppSchema.parse(await readJson(request));
    const telegramUser = verifyTelegramMiniAppInitData(input.initData);
    const user = await upsertTelegramUser(telegramUser);

    if (!(await hasRequiredConsents(user.id))) {
      return NextResponse.json(
        {
          ok: false,
          code: "CONSENT_REQUIRED",
          error: "Перед входом нужно принять документы в боте «Собрались».",
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        telegramUsername: user.telegramUsername,
      },
    });
    response.cookies.set("sobralis_user_id", user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set(getSessionCookieName(), createSessionValue(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Telegram Mini App auth error", error);
    if (error instanceof z.ZodError || error instanceof Error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Telegram Mini App auth failed" }, { status: 400 });
  }
}
