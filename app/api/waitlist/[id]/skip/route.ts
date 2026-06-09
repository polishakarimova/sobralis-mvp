import { conflict, ok, serverError } from "@/lib/api";
import { getSessionUserIdFromRequest } from "@/lib/session";
import { skipWaitlistEntry } from "@/lib/waitlist";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return Response.json({ ok: false, error: "Telegram authorization required" }, { status: 401 });

    const result = await skipWaitlistEntry(id, userId);
    if (!result.ok) return conflict(result.error);

    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}
