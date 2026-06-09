import crypto from "node:crypto";

import { NextResponse } from "next/server";

function getAdminToken() {
  return process.env.ADMIN_TOKEN || "";
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function getAdminTokenFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromQuery = searchParams.get("token") || "";
  const fromHeader = request.headers.get("x-admin-token") || "";
  const authorization = request.headers.get("authorization") || "";
  const fromBearer = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7) : "";

  return fromHeader || fromBearer || fromQuery;
}

export function isAdminRequest(request: Request) {
  const expected = getAdminToken();
  const actual = getAdminTokenFromRequest(request);
  if (!expected || !actual) return false;
  return safeEqual(actual, expected);
}

export function requireAdmin(request: Request) {
  if (isAdminRequest(request)) return null;
  return NextResponse.json({ ok: false, error: "Admin token is invalid or missing" }, { status: 401 });
}
