import { NextRequest, NextResponse } from "next/server";
import { getIdeaById } from "@/lib/ideas";
import { getRequestKey } from "@/lib/security";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const viewerKey = getRequestKey(request.headers);
  const idea = await getIdeaById(id, viewerKey);

  if (!idea) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    idea,
    viewer_has_fired: idea.viewerHasFired
  });
}

