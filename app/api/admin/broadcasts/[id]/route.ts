import { requireAdmin } from "@/lib/admin";
import { notFound, ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const broadcast = await prisma.broadcast.findUnique({ where: { id } });
    if (!broadcast) return notFound("Broadcast not found");

    await prisma.broadcast.delete({ where: { id } });
    await prisma.adminAction.create({
      data: {
        action: "broadcast.delete",
        entityType: "broadcast",
        entityId: id,
      },
    });

    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
