import { requireProRequest } from "@/lib/auth/clerk";
import { errorResponse } from "@/lib/auth/policy";
import { businessSchema } from "@/lib/data/contracts";
import { queryBusiness } from "@/lib/data/client";
export async function POST(request: Request) {
  try {
    const caller = await requireProRequest(request);
    const parsed = businessSchema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    return Response.json(await queryBusiness(caller, parsed.data));
  } catch (error) {
    return errorResponse(error);
  }
}
