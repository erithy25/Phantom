"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Enable auto-resizing based on content */
  autoResize?: boolean;
  /** Minimum number of visible rows */
  minRows?: number;
  /** Maximum number of visible rows before scrolling */
  maxRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      autoResize = true,
      minRows = 3,
      maxRows = 12,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const resize = React.useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;

      el.style.height = "auto";

      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight) || 20;
      const paddingY =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const borderY =
        parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);

      const minHeight = lineHeight * minRows + paddingY + borderY;
      const maxHeight = lineHeight * maxRows + paddingY + borderY;

      const scrollHeight = el.scrollHeight;
      el.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }, [autoResize, minRows, maxRows]);

    React.useEffect(() => {
      resize();
    }, [resize, props.value]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        resize();
        onChange?.(e);
      },
      [onChange, resize]
    );

    return (
      <textarea
        ref={setRefs}
        className={cn(
          "flex w-full",
          "min-h-[44px]",
          "rounded-md", /* 10px via tailwind config */
          "border border-phantom-border",
          "bg-phantom-bgInput",
          "px-3.5 py-3",
          "text-body text-phantom-text",
          "font-sans leading-relaxed",
          "placeholder:text-phantom-textMuted",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:border-phantom-borderHover",
          "focus:shadow-[0_0_0_3px_var(--phantom-border-hover)/0.15]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "resize-none",
          className
        )}
        rows={minRows}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
