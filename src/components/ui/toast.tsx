"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

/* -------------------------------------------------------------------------- */
/*  Viewport                                                                   */
/* -------------------------------------------------------------------------- */

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100]",
      "flex max-h-screen w-full flex-col-reverse gap-2",
      "p-4 sm:max-w-[380px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

/* -------------------------------------------------------------------------- */
/*  Toast                                                                      */
/* -------------------------------------------------------------------------- */

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center justify-between gap-3",
    "overflow-hidden",
    "rounded-md", /* 10px */
    "border border-phantom-border",
    "p-4",
    "shadow-phantom-lg",
    "transition-all",
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    "data-[state=open]:animate-slide-in-right",
    "data-[state=closed]:animate-slide-out-right",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-phantom-bgCard text-phantom-text",
        success: "bg-phantom-bgCard text-phantom-text border-phantom-success/30",
        warning: "bg-phantom-bgCard text-phantom-text border-phantom-warning/30",
        destructive:
          "bg-phantom-bgCard text-phantom-text border-phantom-danger/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

/* -------------------------------------------------------------------------- */
/*  Action                                                                     */
/* -------------------------------------------------------------------------- */

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center",
      "rounded-sm px-3",
      "text-[12px] font-medium",
      "border border-phantom-border",
      "text-phantom-textSecondary",
      "transition-colors duration-200",
      "hover:bg-phantom-bgInput hover:text-phantom-text",
      "focus:outline-none focus:ring-2 focus:ring-phantom-borderHover",
      "disabled:pointer-events-none disabled:opacity-40",
      "group-[.destructive]:border-phantom-danger/30",
      "group-[.destructive]:hover:border-phantom-danger/50",
      "group-[.destructive]:hover:text-phantom-danger",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

/* -------------------------------------------------------------------------- */
/*  Close                                                                      */
/* -------------------------------------------------------------------------- */

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2",
      "rounded-sm p-1",
      "text-phantom-textMuted",
      "opacity-0 transition-opacity duration-200",
      "hover:text-phantom-text",
      "group-hover:opacity-100",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-phantom-borderHover",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

/* -------------------------------------------------------------------------- */
/*  Title                                                                      */
/* -------------------------------------------------------------------------- */

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-body font-semibold text-phantom-text", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

/* -------------------------------------------------------------------------- */
/*  Description                                                                */
/* -------------------------------------------------------------------------- */

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-caption text-phantom-textSecondary", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
};
