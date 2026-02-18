import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center",
    "rounded-full px-2 py-0.5",
    "font-mono text-[11px] leading-[1.4] font-medium tracking-[0.05em]",
    "whitespace-nowrap select-none",
    "border",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-phantom-bgTertiary/50 text-phantom-textTertiary",
          "border-phantom-border",
        ].join(" "),
        success: [
          "bg-phantom-success/10 text-phantom-success",
          "border-phantom-success/20",
        ].join(" "),
        warning: [
          "bg-phantom-warning/10 text-phantom-warning",
          "border-phantom-warning/20",
        ].join(" "),
        danger: [
          "bg-phantom-danger/10 text-phantom-danger",
          "border-phantom-danger/20",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
