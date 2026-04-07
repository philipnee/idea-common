import Image from "next/image";
import friedaImage from "@/frieda.jpeg";
import { joinClasses } from "@/lib/format";

export function FreedaMark({ className }: { className?: string }) {
  return (
    <span className={joinClasses("inline-flex", className)}>
      <Image
        src={friedaImage}
        alt="Frieda dog mark"
        priority
        className="h-auto w-full object-contain mix-blend-multiply"
      />
    </span>
  );
}
