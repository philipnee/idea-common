import Image from "next/image";
import friedaImage from "@/frieda.jpeg";
import { joinClasses } from "@/lib/format";

export function FreedaMark({ className }: { className?: string }) {
  return (
    <span
      className={joinClasses(
        "inline-flex overflow-hidden rounded-[30px] border border-[#dccdbb] bg-[#efe4d2] p-3 shadow-card",
        className
      )}
    >
      <Image
        src={friedaImage}
        alt="Frieda dog mark"
        priority
        className="h-auto w-full object-contain mix-blend-multiply"
      />
    </span>
  );
}
