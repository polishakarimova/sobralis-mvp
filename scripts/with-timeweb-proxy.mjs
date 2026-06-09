import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

import "dotenv/config";

const [, , ...command] = process.argv;

if (command.length === 0) {
  console.error("Usage: node scripts/with-timeweb-proxy.mjs <command> [args...]");
  process.exit(1);
}

const sourceUrl = process.env.DATABASE_URL;

if (!sourceUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const parsedUrl = new URL(sourceUrl);
const upstreamHost = parsedUrl.hostname;
const upstreamPort = parsedUrl.port || "5432";
const listenHost = process.env.PG_PROXY_LISTEN_HOST || "127.0.0.1";
async function getFreePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 15432;
  server.close();
  await once(server, "close");
  return String(port);
}

const listenPort = process.env.PG_PROXY_LISTEN_PORT || (await getFreePort());

parsedUrl.hostname = listenHost;
parsedUrl.port = listenPort;
parsedUrl.searchParams.delete("sslmode");
parsedUrl.searchParams.delete("sslnegotiation");
parsedUrl.searchParams.set("schema", "public");

const proxy = spawn(process.execPath, ["scripts/timeweb-pg-proxy.mjs"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    PG_PROXY_UPSTREAM_HOST: upstreamHost,
    PG_PROXY_UPSTREAM_PORT: upstreamPort,
    PG_PROXY_LISTEN_HOST: listenHost,
    PG_PROXY_LISTEN_PORT: listenPort,
  },
});

proxy.stdout.on("data", (chunk) => process.stdout.write(chunk));
proxy.stderr.on("data", (chunk) => process.stderr.write(chunk));

async function main() {
  await Promise.race([once(proxy.stdout, "data"), once(proxy, "exit"), delay(5000)]);

  if (proxy.exitCode !== null) {
    process.exit(proxy.exitCode ?? 1);
  }

  const childEnv = {
    ...process.env,
    DATABASE_URL: parsedUrl.toString(),
  };
  delete childEnv.PGSSLROOTCERT;

  const child = spawn(command[0], command.slice(1), {
    stdio: "inherit",
    shell: true,
    env: childEnv,
  });

  const [code] = await once(child, "exit");
  proxy.kill();
  process.exit(typeof code === "number" ? code : 1);
}

main().catch((error) => {
  proxy.kill();
  console.error(error);
  process.exit(1);
});
