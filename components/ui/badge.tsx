import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-white shadow-sm shadow-destructive/20",
        outline: "text-foreground hover:bg-accent/60",
        success:
          "border-transparent bg-emerald-100 text-emerald-900 shadow-sm shadow-emerald-600/10 dark:bg-indigo-950/80 dark:text-emerald-300 dark:ring-1 dark:ring-indigo-500/30",
        warning:
          "border-transparent bg-amber-100 text-amber-900 shadow-sm shadow-amber-600/10 dark:bg-indigo-950/80 dark:text-amber-300 dark:ring-1 dark:ring-indigo-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
