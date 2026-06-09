import "dotenv/config";

const appUrl = (process.env.APP_URL || "https://sobralisy.ru").replace(/\/$/, "");

const response = await fetch(`${appUrl}/api/auth/telegram-login/start`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ returnTo: "/profile/events" }),
});

const payload = await response.json().catch(() => null);
console.log(`Telegram login start status: ${response.status}`);
console.log(`Telegram login start ok: ${Boolean(payload?.ok)}`);

if (!response.ok || !payload?.ok) process.exit(1);
