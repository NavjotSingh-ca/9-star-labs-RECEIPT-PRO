"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "vertical" | "horizontal"
}) {
  return (
    <div
      data-slot="scroll-area"
      className={cn(
        "relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div
        data-slot="scroll-area-viewport"
        className={cn(
          "h-full w-full rounded-[inherit]",
          orientation === "vertical" && "overflow-y-auto",
          orientation === "horizontal" && "overflow-x-auto",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-glass-border",
          "[&::-webkit-scrollbar-thumb:hover]:bg-glass-border-hover"
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { ScrollArea }
