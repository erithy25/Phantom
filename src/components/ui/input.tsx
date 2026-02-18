import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full",
          "h-11 md:h-12", /* 44px / 48px */
          "rounded-md", /* 10px via tailwind config */
          "border border-phantom-border",
          "bg-phantom-bgInput",
          "px-3.5 py-2",
          "text-body text-phantom-text",
          "font-sans",
          "placeholder:text-phantom-textMuted",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:border-phantom-borderHover",
          "focus:shadow-[0_0_0_3px_var(--phantom-border-hover)/0.15]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
