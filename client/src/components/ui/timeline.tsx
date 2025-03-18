import * as React from "react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  children: React.ReactNode;
  className?: string;
}

export function Timeline({ children, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  );
}

interface TimelineItemProps {
  children: React.ReactNode;
  className?: string;
}

export function TimelineItem({ children, className }: TimelineItemProps) {
  return (
    <div className={cn("flex gap-4 pb-8 last:pb-0", className)}>
      {children}
    </div>
  );
}

interface TimelineOppositeContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TimelineOppositeContent({ children, className }: TimelineOppositeContentProps) {
  return (
    <div className={cn("flex-1 text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}

interface TimelineSeparatorProps {
  children: React.ReactNode;
  className?: string;
}

export function TimelineSeparator({ children, className }: TimelineSeparatorProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {children}
    </div>
  );
}

interface TimelineDotProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "filled" | "outlined" | "warning";
}

export function TimelineDot({ children, className, variant = "filled" }: TimelineDotProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border-2",
        {
          "bg-primary border-primary text-primary-foreground": variant === "filled",
          "border-primary bg-background text-primary": variant === "outlined",
          "border-destructive bg-destructive text-destructive-foreground": variant === "warning",
        },
        className
      )}
    >
      {children}
    </div>
  );
}

interface TimelineConnectorProps {
  className?: string;
}

export function TimelineConnector({ className }: TimelineConnectorProps) {
  return (
    <div className={cn("flex-1 w-0.5 bg-border mx-auto", className)} />
  );
}

interface TimelineContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TimelineContent({ children, className }: TimelineContentProps) {
  return (
    <div className={cn("flex-[2] pt-1", className)}>
      {children}
    </div>
  );
}
