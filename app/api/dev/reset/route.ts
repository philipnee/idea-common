import { NextResponse } from "next/server";
import { isDevAppMode } from "@/lib/env";
import { resetStoreFromTemplate } from "@/lib/store";

export async function POST() {
  if (!isDevAppMode()) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  await resetStoreFromTemplate();

  return NextResponse.json({ ok: true });
}
