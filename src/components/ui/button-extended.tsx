
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button as BaseButton, buttonVariants } from "@/components/ui/button";

// Estendendo os tipos de variantes existentes
const extendedButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Variantes padrão do shadcn/ui Button
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Variantes personalizadas
        premium: "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50 dark:hover:bg-amber-900/50",
        success: "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50 dark:hover:bg-green-900/50",
        warning: "bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50 dark:hover:bg-orange-900/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ExtendedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof extendedButtonVariants> {
  asChild?: boolean;
}

const ButtonExtended = React.forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <BaseButton
        className={cn(extendedButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonExtended.displayName = "ButtonExtended";

export { ButtonExtended, extendedButtonVariants };
