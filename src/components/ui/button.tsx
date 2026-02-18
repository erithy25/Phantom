import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium tracking-tight",
    "rounded-sm", /* 8px via tailwind config */
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phantom-borderHover focus-visible:ring-offset-2 focus-visible:ring-offset-phantom-bg",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-phantom-text text-phantom-bg",
          "hover:opacity-90",
          "active:scale-[0.98]",
          "shadow-phantom-sm",
        ].join(" "),
        default: [
          "bg-transparent border border-phantom-border text-current",
          "hover:border-phantom-borderHover hover:bg-phantom-bgCard",
          "active:scale-[0.98]",
        ].join(" "),
        ghost: [
          "bg-transparent border-none text-phantom-textTertiary",
          "hover:text-phantom-text hover:bg-phantom-bgCard",
          "active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-[12px]",
        md: "h-10 px-4 text-[13px]",
        lg: "h-12 px-6 text-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child component using Radix Slot */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
