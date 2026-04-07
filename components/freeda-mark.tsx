import { joinClasses } from "@/lib/format";

export function FreedaMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={joinClasses(
        "inline-block select-none leading-none text-[#8a5a2f]",
        className
      )}
    >
      🐾
    </span>
  );
}
