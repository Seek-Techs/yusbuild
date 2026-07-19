import { cn } from "@/lib/utils";

interface LogoProps {
  withText?: boolean;
  className?: string;
}

export function Logo({ withText = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label="YusBuild"
      >
        <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
        <path
          d="M9 9L16 17V25H19V17L26 9H21.5L16 15.5L10.5 9H9Z"
          fill="hsl(var(--primary-foreground))"
        />
      </svg>
      {withText ? (
        <div>
          <p className="text-lg font-semibold leading-tight tracking-tight text-foreground">
            YusBuild
          </p>
          <p className="text-sm leading-tight text-muted-foreground">
            Construction Foundation Management Platform
          </p>
        </div>
      ) : null}
    </div>
  );
}
