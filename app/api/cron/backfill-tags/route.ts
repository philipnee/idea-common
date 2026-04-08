import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { backfillIdeaTags } from "@/lib/tagging";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.replace(/^Bearer\s+/i, "") ?? "";

  if (bearer !== env.cronSecret) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const result = await backfillIdeaTags();
  return NextResponse.json(result);
}
