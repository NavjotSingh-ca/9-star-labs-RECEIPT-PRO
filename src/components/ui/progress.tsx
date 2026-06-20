"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "h-full w-full rounded-full transition-all duration-500",
  {
    variants: {
      color: {
        default: "bg-champagne",
        success: "bg-emerald-success",
        warning: "bg-warning",
        danger: "bg-danger",
      },
    },
    defaultVariants: {
      color: "default",
    },
  }
)

function Progress({
  className,
  color = "default",
  value,
  ...props
}: ProgressPrimitive.Root.Props & VariantProps<typeof progressVariants>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-color={color}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Track data-slot="progress-track" className="h-full w-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          data-color={color}
          className={cn(progressVariants({ color }))}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

function ProgressValue({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="progress-value"
      className={cn(
        "text-xs font-medium tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Progress, ProgressValue }
