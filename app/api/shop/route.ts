import { requireAuthenticatedRequest } from "@/lib/auth/clerk";
import { errorResponse } from "@/lib/auth/policy";
import { shopReadSchema, shopWriteSchema } from "@/lib/shop/contracts";
import { queryShop, mutateShop } from "@/lib/shop/client";
export async function GET(request: Request) {
  try {
    const caller = await requireAuthenticatedRequest(request);
    const input: Record<string, unknown> = Object.fromEntries(
      new URL(request.url).searchParams,
    );
    for (const key of ["page", "limit"])
      if (key in input) input[key] = Number(input[key]);
    const parsed = shopReadSchema.safeParse(input);
    if (!parsed.success)
      return Response.json(
        { error: "Check the search filters and try again." },
        { status: 400 },
      );
    return Response.json(await queryShop(caller, parsed.data));
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    const caller = await requireAuthenticatedRequest(request);
    let input;
    try {
      input = await request.json();
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }
    const parsed = shopWriteSchema.safeParse(input);
    if (!parsed.success)
      return Response.json(
        { error: "Check the product and quantity and try again." },
        { status: 400 },
      );
    return Response.json(await mutateShop(caller, parsed.data));
  } catch (error) {
    return errorResponse(error);
  }
}
