import net from "node:net";
import tls from "node:tls";

const upstreamHost = process.env.PG_PROXY_UPSTREAM_HOST;
const upstreamPort = Number(process.env.PG_PROXY_UPSTREAM_PORT || 5432);
const listenHost = process.env.PG_PROXY_LISTEN_HOST || "127.0.0.1";
const listenPort = Number(process.env.PG_PROXY_LISTEN_PORT || 15432);

if (!upstreamHost) {
  console.error("PG_PROXY_UPSTREAM_HOST is required");
  process.exit(1);
}

const server = net.createServer((client) => {
  const upstream = tls.connect({
    host: upstreamHost,
    port: upstreamPort,
    servername: upstreamHost,
    ALPNProtocols: ["postgresql"],
    rejectUnauthorized: false,
  });

  upstream.once("secureConnect", () => {
    client.pipe(upstream);
    upstream.pipe(client);
  });

  const close = () => {
    client.destroy();
    upstream.destroy();
  };

  client.on("error", close);
  upstream.on("error", (error) => {
    console.error(`upstream error: ${error.message}`);
    close();
  });
});

server.listen(listenPort, listenHost, () => {
  console.log(`timeweb-pg-proxy listening on ${listenHost}:${listenPort} -> ${upstreamHost}:${upstreamPort}`);
});
