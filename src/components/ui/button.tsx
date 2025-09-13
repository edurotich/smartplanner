import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-amber-600 focus-visible:ring-amber-400/50 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 shadow-md hover:scale-[1.03] active:scale-95 relative",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-amber-500 to-amber-600 text-white border border-amber-400 hover:from-amber-600 hover:to-amber-700 hover:border-amber-500 hover:shadow-lg",
        destructive:
          "bg-gradient-to-b from-red-600 to-red-700 text-white border border-red-500 hover:from-red-700 hover:to-red-800 hover:border-red-600 focus-visible:ring-red-300/20",
        outline:
          "border-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100/90 hover:text-amber-900 hover:border-amber-400",
        secondary:
          "bg-gradient-to-b from-amber-200 to-amber-300 text-amber-900 border border-amber-100 hover:from-amber-300 hover:to-amber-400 hover:border-amber-200",
        accent:
          "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white border border-emerald-500 hover:from-emerald-700 hover:to-emerald-800 hover:border-emerald-600",
        accentAlt:
          "bg-gradient-to-b from-orange-500 to-orange-600 text-white border border-orange-400 hover:from-orange-600 hover:to-orange-700 hover:border-orange-500",
        ghost:
          "bg-transparent hover:bg-amber-100/50 hover:text-amber-900 border border-transparent hover:border-amber-200",
        link: "text-amber-700 underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-sm",
        lg: "h-12 rounded-xl px-6 has-[>svg]:px-4 text-lg",
        xl: "h-14 rounded-2xl px-8 has-[>svg]:px-6 text-xl",
        icon: "size-10 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
