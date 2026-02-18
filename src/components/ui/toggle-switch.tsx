"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const ToggleSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center",
      "h-[22px] w-[40px]",
      "rounded-full",
      "border-2 border-transparent",
      "transition-colors duration-200 ease-out",
      "bg-phantom-bgInput",
      "data-[state=checked]:bg-phantom-text",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phantom-borderHover focus-visible:ring-offset-2 focus-visible:ring-offset-phantom-bg",
      "disabled:cursor-not-allowed disabled:opacity-40",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block rounded-full",
        "h-[18px] w-[18px]",
        "bg-phantom-bg",
        "shadow-phantom-sm",
        "transition-transform duration-200 ease-out",
        "data-[state=checked]:translate-x-[18px]",
        "data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
));
ToggleSwitch.displayName = "ToggleSwitch";

export { ToggleSwitch };
