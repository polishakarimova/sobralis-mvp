import crypto from "node:crypto";
import fs from "node:fs";

const envPath = process.argv[2] || ".env";

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, "", "utf8");
}

const content = fs.readFileSync(envPath, "utf8");
const hasAdminToken = content
  .split(/\r?\n/)
  .some((line) => line.trim().startsWith("ADMIN_TOKEN="));

if (hasAdminToken) {
  console.log("ADMIN_TOKEN already present");
  process.exit(0);
}

const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
const token = crypto.randomBytes(32).toString("hex");
fs.appendFileSync(envPath, `${separator}ADMIN_TOKEN=${token}\n`, "utf8");
console.log("ADMIN_TOKEN added");
