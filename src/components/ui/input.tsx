import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-amber-800 placeholder:text-amber-500/50 selection:bg-emerald-600 selection:text-white border-amber-300 flex h-10 w-full min-w-0 rounded-xl border bg-amber-50 px-4 py-2 text-base shadow-sm transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:shadow-md",
        "focus-visible:border-amber-500 focus-visible:ring-amber-400/30 focus-visible:ring-[3px] focus-visible:shadow-md",
        "aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500",
        "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Input }
