import { getFireState } from "@/lib/ideas";
import { joinClasses } from "@/lib/format";
import type { FireState } from "@/lib/types";

const labels: Record<FireState, string> = {
  none: "",
  warm: "Warm",
  hot: "Hot",
  on_fire: "On Fire"
};

export function FirePill({
  heat,
  fireState = getFireState(heat),
  small = false
}: {
  heat: number;
  fireState?: FireState;
  small?: boolean;
}) {
  if (fireState === "none") {
    return null;
  }

  return (
    <span
      className={joinClasses(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono uppercase tracking-[0.16em]",
        small ? "text-[10px]" : "text-[11px]",
        fireState === "warm" &&
          "border-orange-200 bg-orange-50 text-orange-700",
        fireState === "hot" && "border-orange-300 bg-orange-100 text-orange-800",
        fireState === "on_fire" &&
          "border-red-300 bg-red-100 text-red-800 shadow-[0_0_0_4px_rgba(225,102,42,0.12)]"
      )}
    >
      <span
        className={joinClasses(
          "h-2 w-2 rounded-full",
          fireState === "warm" && "bg-orange-500",
          fireState === "hot" && "bg-orange-600",
          fireState === "on_fire" && "bg-red-600"
        )}
      />
      {labels[fireState]}
    </span>
  );
}

