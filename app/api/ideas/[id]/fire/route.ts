import { NextRequest, NextResponse } from "next/server";
import { fireIdea } from "@/lib/ideas";
import { getRequestKey } from "@/lib/security";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const viewerKey = getRequestKey(request.headers);
  const result = await fireIdea(id, viewerKey);

  if (!result.ok) {
    return NextResponse.json({ message: "Not found." }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    already_fired: result.alreadyFired ?? false,
    fire_state: result.fireState
  });
}

