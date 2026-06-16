import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className={cn("w-full max-w-md")}>{children}</div>
    </div>
  );
}
