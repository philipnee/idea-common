import { joinClasses } from "@/lib/format";

export function MatchMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={joinClasses("relative inline-block select-none", className)}
    >
      <span className="absolute bottom-[12%] left-1/2 h-[68%] w-[14%] -translate-x-1/2 rotate-[28deg] rounded-full bg-[#7d5130]" />
      <span className="absolute bottom-[63%] left-[58%] h-[12%] w-[16%] -translate-x-1/2 rotate-[28deg] rounded-full bg-[#231711]" />
      <span className="absolute left-1/2 top-[4%] h-[42%] w-[46%] -translate-x-1/2 rotate-[18deg] rounded-[55%_55%_70%_70%] bg-[radial-gradient(circle_at_50%_70%,#fff3bf_0%,#ffd25e_28%,#f48331_62%,#ca4218_100%)] shadow-[0_8px_20px_rgba(202,66,24,0.22)]" />
      <span className="absolute left-1/2 top-[16%] h-[16%] w-[18%] -translate-x-1/2 rounded-full bg-[#fff7d9] opacity-90" />
    </span>
  );
}
