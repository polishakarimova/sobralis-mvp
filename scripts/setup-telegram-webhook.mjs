import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

if (!secret) {
  console.error("TELEGRAM_WEBHOOK_SECRET is required");
  process.exit(1);
}

if (!appUrl || !appUrl.startsWith("https://")) {
  console.error("APP_URL must be an HTTPS URL, for example https://sobralisy.ru");
  process.exit(1);
}

async function telegram(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(`${method} failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload.result;
}

await telegram("setWebhook", {
  url: `${appUrl}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: process.env.TELEGRAM_DROP_PENDING_UPDATES === "true",
  max_connections: 100,
});

const webhookInfo = await telegram("getWebhookInfo", {});
console.log("Telegram webhook is configured:", {
  url: webhookInfo.url,
  hasCustomCertificate: webhookInfo.has_custom_certificate,
  pendingUpdateCount: webhookInfo.pending_update_count,
  maxConnections: webhookInfo.max_connections || null,
  lastErrorDate: webhookInfo.last_error_date || null,
  lastErrorMessage: webhookInfo.last_error_message || null,
});
