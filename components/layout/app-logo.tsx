import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type AppLogoProps = {
  showText?: boolean;
  className?: string;
  href?: string | null;
};

export function AppLogo({
  showText = true,
  className,
  href = "/",
}: AppLogoProps) {
  const content = (
    <>
      <Image
        src="/kpilogo.png"
        alt="AQUEOUSS KPI System"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0"
        priority
      />
      {showText ? (
        <span className="gradient-text hidden truncate text-sm font-semibold tracking-tight min-[420px]:inline sm:text-base">
          AQUEOUSS - KPI System
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("flex items-center gap-2", className)}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>{content}</div>
  );
}
