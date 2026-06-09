import fs from "node:fs";

const envPath = process.argv[2] || ".env";
const baseUrl = (process.argv[3] || process.env.APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

function readEnv(path) {
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

const env = readEnv(envPath);
const token = env.ADMIN_TOKEN || process.env.ADMIN_TOKEN;

if (!token) {
  console.error("ADMIN_TOKEN is missing");
  process.exit(1);
}

const checks = ["/api/admin/users", "/api/admin/events", "/api/admin/reservations", "/api/admin/broadcasts"];

for (const path of checks) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "x-admin-token": token },
  });
  console.log(`${path}: ${response.status}`);
  if (!response.ok) process.exitCode = 1;
}
