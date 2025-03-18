import * as React from "react"
import { cn } from "@/lib/utils"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  rtl?: boolean
  tooltip?: string
  showHelper?: boolean
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, rtl = true, tooltip, showHelper, helperText, ...props }, ref) => {
    const input = (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            rtl && "text-right",
            showHelper && "pr-8",
            className
          )}
          dir={rtl ? "rtl" : "ltr"}
          ref={ref}
          {...props}
        />
        {(showHelper || helperText) && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <InfoIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        {helperText && (
          <p className="mt-1 text-xs text-muted-foreground" dir={rtl ? "rtl" : "ltr"}>
            {helperText}
          </p>
        )}
      </div>
    )

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {input}
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return input
  }
)
Input.displayName = "Input"

export { Input }