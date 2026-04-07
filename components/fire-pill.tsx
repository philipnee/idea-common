import { getFireState } from "@/lib/ideas";
import { joinClasses } from "@/lib/format";
import type { FireState } from "@/lib/types";

const labels: Record<FireState, string> = {
  none: "",
  ember: "Ember",
  spark: "Spark",
  flame: "Flame",
  blaze: "Blaze",
  wildfire: "Wildfire"
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
        "inline-flex items-center gap-2 border px-3 py-1 font-mono uppercase tracking-[0.16em]",
        small ? "text-[10px]" : "text-[11px]",
        fireState === "ember" && "border-[#dcc8a8] bg-[#f5ece0] text-[#9a6a2d]",
        fireState === "spark" && "border-[#d5bf99] bg-[#efe4d1] text-[#9a6126]",
        fireState === "flame" && "border-[#d1b087] bg-[#ead8bc] text-[#94471c]",
        fireState === "blaze" && "border-[#c69773] bg-[#e4ccb2] text-[#893817]",
        fireState === "wildfire" && "border-[#b98566] bg-[#ddc0ab] text-[#7a2810]"
      )}
    >
      <span
        className={joinClasses(
          "h-2 w-2 rounded-full",
          fireState === "ember" && "bg-[#d19134]",
          fireState === "spark" && "bg-[#c7712c]",
          fireState === "flame" && "bg-[#c14d1d]",
          fireState === "blaze" && "bg-[#a83c15]",
          fireState === "wildfire" && "bg-[#8d2512]"
        )}
      />
      {labels[fireState]}
    </span>
  );
}
