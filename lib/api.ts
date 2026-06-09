import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function badRequest(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ ok: false, error: "Invalid request data", issues: error.issues }, { status: 400 });
  }

  return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
}

export function notFound(error = "Not found") {
  return NextResponse.json({ ok: false, error }, { status: 404 });
}

export function conflict(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 409 });
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON");
  }
}

export function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function makeShareSlug(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "event"}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makePaymentCode() {
  return `SOB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

