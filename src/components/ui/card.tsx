import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg", /* 12px via tailwind config */
      "border border-phantom-border",
      "bg-phantom-bgCard",
      "text-phantom-text",
      "transition-all duration-200 ease-out",
      "hover:border-phantom-borderHover hover:-translate-y-px",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/* -------------------------------------------------------------------------- */
/*  CardHeader                                                                 */
/* -------------------------------------------------------------------------- */

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 pb-0", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/* -------------------------------------------------------------------------- */
/*  CardTitle                                                                  */
/* -------------------------------------------------------------------------- */

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-card-title text-phantom-text tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/* -------------------------------------------------------------------------- */
/*  CardDescription                                                            */
/* -------------------------------------------------------------------------- */

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body text-phantom-textSecondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* -------------------------------------------------------------------------- */
/*  CardContent                                                                */
/* -------------------------------------------------------------------------- */

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

/* -------------------------------------------------------------------------- */
/*  CardFooter                                                                 */
/* -------------------------------------------------------------------------- */

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-5 pt-0",
      "border-t border-phantom-border/50",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
