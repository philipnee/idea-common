import Image from "next/image";
import friedaImage from "@/frieda.jpeg";
import { joinClasses } from "@/lib/format";

export function FreedaMark({ className }: { className?: string }) {
  return (
    <Image
      src={friedaImage}
      alt="Frieda dog mark"
      priority
      className={joinClasses("h-auto w-auto", className)}
    />
  );
}
