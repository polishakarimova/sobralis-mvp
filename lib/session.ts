import crypto from "node:crypto";

const SESSION_COOKIE = "sobralis_session";

function getSessionSecret() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_BOT_TOKEN || process.env.DATABASE_URL;
  if (!secret) throw new Error("Session secret is not configured");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionValue(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function verifySessionValue(value?: string | null) {
  if (!value) return null;
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const userId = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const expected = sign(userId);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return userId;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionUserIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const sessionCookie = cookies.find((item) => item.startsWith(`${SESSION_COOKIE}=`));
  if (!sessionCookie) return null;
  return verifySessionValue(decodeURIComponent(sessionCookie.slice(SESSION_COOKIE.length + 1)));
}
