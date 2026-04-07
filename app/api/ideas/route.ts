import { NextRequest, NextResponse } from "next/server";
import { getPublicIdeaUrl } from "@/lib/config";
import {
  createIdea,
  getCreateIdeaInput,
  getIdeaPagination,
  getIdeaSort,
  getRemoteIpFromHeaders,
  listIdeas
} from "@/lib/ideas";
import { getRequestKey } from "@/lib/security";

async function readPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, FormDataEntryValue | null>;
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const data = await listIdeas({
    sort: getIdeaSort(searchParams.get("sort")),
    page: getIdeaPagination(searchParams.get("page"), 1),
    limit: getIdeaPagination(searchParams.get("limit"), 30)
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const payload = await readPayload(request);
  const input = getCreateIdeaInput(payload);
  const submitKey = getRequestKey(request.headers);
  const result = await createIdea(input, submitKey, getRemoteIpFromHeaders(request.headers));

  return NextResponse.json(
    result.ok && result.id
      ? {
          id: result.id,
          sharePath: `/ideas/${result.id}`,
          shareUrl: getPublicIdeaUrl(result.id, request.headers)
        }
      : {
          message: result.message,
          challengeRequired: result.challengeRequired ?? false
        },
    { status: result.status }
  );
}
