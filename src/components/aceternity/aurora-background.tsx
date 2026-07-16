import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-obsidian text-text-primary transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              `
              [--white-gradient:repeating-linear-gradient(100deg,var(--surface)_0%,var(--surface)_7%,transparent_10%,transparent_12%,var(--surface)_16%)]
              [--dark-gradient:repeating-linear-gradient(100deg,var(--sidebar-bg)_0%,var(--sidebar-bg)_7%,transparent_10%,transparent_12%,var(--sidebar-bg)_16%)]
              [--aurora:repeating-linear-gradient(100deg,var(--champagne-light)_10%,var(--champagne)_15%,var(--champagne-dim)_20%,var(--champagne-light)_25%,var(--champagne)_30%)]
              [--aurora-dark:repeating-linear-gradient(100deg,#bea98e_10%,#dccba8_15%,#685743_20%,#bea98e_25%,#e5ded0_30%)]
              [background-image:var(--white-gradient),var(--aurora)]
              dark:[background-image:var(--dark-gradient),var(--aurora-dark)]
              [background-size:300%,_200%]
              [background-position:50%_50%,50%_50%]
              filter blur-[10px] invert dark:invert-0
              after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
              after:dark:[background-image:var(--dark-gradient),var(--aurora-dark)]
              after:[background-size:200%,_100%] 
              after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
              pointer-events-none
              absolute -inset-[10px] opacity-50 will-change-transform`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
            )}
          />
        </div>
        {children}
      </div>
    </main>
  );
};
