import { badRequest, ok, serverError } from "@/lib/api";
import { getSessionUserIdFromRequest } from "@/lib/session";
import { uploadEventImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const userId = getSessionUserIdFromRequest(request);
    if (!userId) return Response.json({ ok: false, error: "Telegram authorization required" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("Image file is required");

    const uploaded = await uploadEventImage(file, userId);
    return ok(uploaded, { status: 201 });
  } catch (error) {
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}
