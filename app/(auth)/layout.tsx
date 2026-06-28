import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        className="auth-orb -left-20 top-20 h-72 w-72 bg-primary/25"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="auth-orb right-0 top-0 h-96 w-96 bg-brand/20"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="auth-orb bottom-0 left-1/3 h-64 w-64 bg-accent/40"
        style={{ animationDelay: "4s" }}
      />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className={cn("page-enter z-10 w-full max-w-md")}>{children}</div>
    </div>
  );
}
