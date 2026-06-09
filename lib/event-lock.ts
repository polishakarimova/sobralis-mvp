import type { Prisma } from "@prisma/client";

const globalForEventQueues = globalThis as unknown as {
  sobralisEventQueues?: Map<string, Promise<void>>;
};

const eventQueues = globalForEventQueues.sobralisEventQueues ?? new Map<string, Promise<void>>();
globalForEventQueues.sobralisEventQueues = eventQueues;

export async function lockEventForUpdate(tx: Prisma.TransactionClient, eventId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`event:${eventId}`}))`;
}

export async function withEventQueue<T>(eventId: string, action: () => Promise<T>) {
  const previous = eventQueues.get(eventId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.catch(() => undefined).then(() => current);
  eventQueues.set(eventId, tail);

  await previous.catch(() => undefined);

  try {
    return await action();
  } finally {
    release();
    if (eventQueues.get(eventId) === tail) {
      eventQueues.delete(eventId);
    }
  }
}
