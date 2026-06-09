import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required");
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

await telegram("setChatMenuButton", {
  menu_button: {
    type: "web_app",
    text: "Открыть Собрались",
    web_app: {
      url: `${appUrl}/app`,
    },
  },
});

await telegram("setMyCommands", {
  commands: [
    { command: "start", description: "Открыть сервис" },
    { command: "events", description: "Мои мероприятия" },
    { command: "help", description: "Как пользоваться" },
  ],
});

console.log(`Telegram menu button is configured: ${appUrl}/app`);
