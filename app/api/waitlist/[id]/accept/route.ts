import { conflict, notFound, ok, serverError } from "@/lib/api";
import { getSessionUserIdFromRequest } from "@/lib/session";
import { acceptWaitlistEntry } from "@/lib/waitlist";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return Response.json({ ok: false, error: "Telegram authorization required" }, { status: 401 });

    const result = await acceptWaitlistEntry(id, userId);
    if (!result.ok) {
      if (result.status === 404) return notFound(result.error);
      return conflict(result.error);
    }

    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}
