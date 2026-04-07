import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyIdeaPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { posted?: string };
}) {
  const query = searchParams?.posted === "true" ? "?posted=true" : "";
  redirect(`/ideas/${params.id}${query}`);
}
