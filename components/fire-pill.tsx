import { joinClasses } from "@/lib/format";
import type { FireLevel } from "@/lib/types";

const fireLevelNames: Record<Exclude<FireLevel, 0>, string> = {
  1: "Ember",
  2: "Spark",
  3: "Flame",
  4: "Blaze",
  5: "Supernova"
};

const fireLevelSymbols: Record<Exclude<FireLevel, 0>, string[]> = {
  1: ["🔥"],
  2: ["🔥", "🔥"],
  3: ["🔥", "🔥", "🔥"],
  4: ["🔥", "🔥", "🔥", "🔥"],
  5: ["💥"]
};

export function FirePill({
  fireLevel,
  small = false
}: {
  fireLevel: FireLevel;
  small?: boolean;
}) {
  if (fireLevel === 0) {
    return null;
  }

  const levelName = fireLevelNames[fireLevel];
  const levelSymbols = fireLevelSymbols[fireLevel];
  const accessibleLabel =
    fireLevel === 5
      ? "Supernova"
      : `${levelName}, ${fireLevel} ${fireLevel === 1 ? "fire" : "fires"}`;

  return (
    <span
      aria-label={accessibleLabel}
      title={levelName}
      className={joinClasses(
        "inline-flex items-center gap-1 border px-3 py-1 font-mono tracking-[0.12em]",
        small ? "text-[10px]" : "text-[12px]",
        fireLevel === 1 && "border-[#dcc8a8] bg-[#f5ece0]",
        fireLevel === 2 && "border-[#d9bc95] bg-[#f1e2cf]",
        fireLevel === 3 && "border-[#d8ae82] bg-[#edd9c4]",
        fireLevel === 4 && "border-[#d09d73] bg-[#e9cfbc]",
        fireLevel === 5 && "border-[#c68861] bg-[#e3c0b2]"
      )}
    >
      {levelSymbols.map((symbol, index) => (
        <span key={`${symbol}-${index}`} className="leading-none">
          {symbol}
        </span>
      ))}
    </span>
  );
}
