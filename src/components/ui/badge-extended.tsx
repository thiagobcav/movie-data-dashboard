
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge, type BadgeProps } from "@/components/ui/badge"

const badgeExtendedVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        premium: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeExtendedProps
  extends BadgeProps,
    VariantProps<typeof badgeExtendedVariants> {}

const BadgeExtended = React.forwardRef<HTMLDivElement, BadgeExtendedProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        className={cn(badgeExtendedVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
BadgeExtended.displayName = "BadgeExtended"

export { BadgeExtended, badgeExtendedVariants }
