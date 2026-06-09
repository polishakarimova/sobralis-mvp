import { NextResponse } from "next/server";

import { getSessionCookieName } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ ok: true, data: { loggedOut: true } });

  for (const name of [getSessionCookieName(), "sobralis_user_id"]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
