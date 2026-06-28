import { Sparkles } from "lucide-react";

export function FunnyCaption({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 via-surface/50 to-brand/8 px-4 py-3 dark:from-primary/12 dark:via-transparent dark:to-brand/10">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="text-sm leading-relaxed text-muted-foreground italic">
        {children}
      </p>
    </div>
  );
}
