import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-[2rem] bg-gradient-to-r from-surface via-champagne/8 to-surface bg-[length:200%_100%] animate-[shimmer_1.8s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
