import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
      rtl: {
        true: "flex-row-reverse",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rtl: true,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  tooltip?: string
  showHelper?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rtl, tooltip, showHelper = false, children, ...props }, ref) => {
    const button = (
      <button
        className={cn(buttonVariants({ variant, size, rtl, className }))}
        dir={rtl ? "rtl" : "ltr"}
        ref={ref}
        {...props}
      >
        {children}
        {showHelper && (
          <InfoIcon className="w-4 h-4 mr-1 text-muted-foreground opacity-50 group-hover:opacity-100" />
        )}
      </button>
    )

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }