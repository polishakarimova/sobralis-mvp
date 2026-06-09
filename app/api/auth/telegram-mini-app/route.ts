import { NextResponse } from "next/server";
import { z } from "zod";

import { readJson } from "@/lib/api";
import { createSessionValue, getSessionCookieName } from "@/lib/session";
import { upsertTelegramUser, verifyTelegramMiniAppInitData } from "@/lib/telegram";

const telegramMiniAppSchema = z.object({
  initData: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = telegramMiniAppSchema.parse(await readJson(request));
    const telegramUser = verifyTelegramMiniAppInitData(input.initData);
    const user = await upsertTelegramUser(telegramUser);

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
