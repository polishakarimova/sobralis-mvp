import { z } from "zod";

import { badRequest, ok, readJson, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const upsertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(3).optional().or(z.literal("")),
});

function identityFromInput(input: z.infer<typeof upsertUserSchema>) {
  const phone = input.phone?.trim();
  const email = input.email?.trim().toLowerCase();

  if (phone) {
    return { provider: "phone" as const, providerUserId: phone };
  }

  return {
    provider: "guest" as const,
    providerUserId: email || input.name.trim().toLowerCase(),
  };
}

export async function POST(request: Request) {
  try {
    const input = upsertUserSchema.parse(await readJson(request));
    const identity = identityFromInput(input);

    const existingIdentity = await prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: identity,
      },
      include: { user: true },
    });

    if (existingIdentity) {
      const user = await prisma.user.update({
        where: { id: existingIdentity.userId },
        data: {
          name: input.name.trim(),
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          role: "organizer",
        },
      });

      return ok(user);
    }

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        role: "organizer",
        authIdentities: {
          create: identity,
        },
      },
    });

    return ok(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) return badRequest(error);
    return serverError(error);
  }
}
