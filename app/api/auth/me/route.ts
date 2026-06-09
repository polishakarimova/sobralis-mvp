import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ ok: true, data: { user: null } });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        telegramUsername: true,
      },
    });

    return NextResponse.json({ ok: true, data: { user } });
  } catch (error) {
    console.error("Auth me error", error);
    const message = process.env.NODE_ENV === "production" ? "Session check is temporarily unavailable" : error instanceof Error ? error.message : "Session check failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
