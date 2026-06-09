import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sobralis_mvp?schema=public";
const sslRootCert = process.env.PGSSLROOTCERT;
const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== "false";
const connectionHost = new URL(connectionString).hostname;
const usesLocalProxy = connectionHost === "127.0.0.1" || connectionHost === "localhost";
const adapterConnectionString = (() => {
  if (!sslRootCert || usesLocalProxy) return connectionString;
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return url.toString();
})();
const adapter = new PrismaPg(
  sslRootCert && !usesLocalProxy
    ? {
        connectionString: adapterConnectionString,
        ssl: {
          ca: readFileSync(sslRootCert, "utf8"),
          rejectUnauthorized,
        },
      }
    : connectionString,
);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
