import fs from "node:fs";
import path from "node:path";

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

readEnvFile(path.join(process.cwd(), ".env"));

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const apiBase = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
const apiTimeoutMs = Number(process.env.TELEGRAM_API_TIMEOUT_MS || 5000);
const internalWebhookUrl =
  process.env.TELEGRAM_INTERNAL_WEBHOOK_URL ||
  `http://127.0.0.1:${process.env.PORT || 3000}/api/telegram/webhook`;

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
if (!webhookSecret) throw new Error("TELEGRAM_WEBHOOK_SECRET is not configured");

let offset = Number(process.env.TELEGRAM_POLLER_OFFSET || 0) || 0;
let stopping = false;

process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = apiTimeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function telegram(method, body, timeoutMs = apiTimeoutMs) {
  const response = await fetchWithTimeout(
    `${apiBase}/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok || payload.ok === false) {
    throw new Error(`Telegram ${method} failed: ${response.status} ${text}`);
  }
  return payload.result;
}

async function callInternalWebhook(update) {
  const response = await fetchWithTimeout(
    internalWebhookUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": webhookSecret,
      },
      body: JSON.stringify(update),
    },
    10000,
  );
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Internal webhook failed: ${response.status} ${text}`);
  }
  return payload;
}

async function sendWebhookMethod(payload) {
  if (!payload?.method) return;

  const { method, ...body } = payload;
  await telegram(method, body);
}

async function processUpdate(update) {
  const startedAt = Date.now();
  const methodPayload = await callInternalWebhook(update);
  await sendWebhookMethod(methodPayload);
  console.info("Telegram poller processed update", {
    updateId: update.update_id,
    method: methodPayload?.method || "none",
    durationMs: Date.now() - startedAt,
  });
}

async function start() {
  console.info("Telegram poller starting", {
    apiBase,
    internalWebhookUrl,
    offset,
  });

  await telegram("deleteWebhook", { drop_pending_updates: false });
  console.info("Telegram webhook disabled; polling is active");

  while (!stopping) {
    try {
      const updates = await telegram(
        "getUpdates",
        {
          offset: offset || undefined,
          timeout: 25,
          limit: 50,
          allowed_updates: ["message", "callback_query"],
        },
        35000,
      );

      for (const update of updates) {
        offset = update.update_id + 1;
        try {
          await processUpdate(update);
        } catch (error) {
          console.error("Telegram poller update error", {
            updateId: update.update_id,
            error,
          });
        }
      }
    } catch (error) {
      if (!stopping) {
        console.error("Telegram poller loop error", error);
        await sleep(2000);
      }
    }
  }

  console.info("Telegram poller stopped");
}

start().catch((error) => {
  console.error("Telegram poller fatal error", error);
  process.exit(1);
});
