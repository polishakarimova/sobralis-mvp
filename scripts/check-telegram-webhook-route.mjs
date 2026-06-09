import fs from "node:fs";
import "dotenv/config";

function readEnv(path = ".env") {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
      }),
  );
}

const env = { ...readEnv(process.argv[2] || ".env"), ...process.env };
const appUrl = (env.APP_URL || "").replace(/\/$/, "");
const secret = env.TELEGRAM_WEBHOOK_SECRET;

if (!appUrl || !appUrl.startsWith("https://")) {
  console.error("APP_URL must be an HTTPS URL");
  process.exit(1);
}

if (!secret) {
  console.error("TELEGRAM_WEBHOOK_SECRET is required");
  process.exit(1);
}

const response = await fetch(`${appUrl}/api/telegram/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-telegram-bot-api-secret-token": secret,
  },
  body: "{}",
});

console.log(`Telegram webhook route status: ${response.status}`);
if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}
