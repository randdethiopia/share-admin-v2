import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusBadgeTypography =
  "text-[11px] font-semibold uppercase tracking-wider"

const STATUS_VARIANTS = new Set([
  "success",
  "warning",
  "pending",
  "destructive",
  "rejected",
])

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-agar-orange-light text-agar-orange-dark [a&]:hover:bg-agar-orange-light/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        success:
          cn(
            "border-transparent bg-emerald-100 text-emerald-800 [a&]:hover:bg-emerald-100/90",
            statusBadgeTypography,
          ),
        warning:
          cn(
            "border-transparent bg-amber-100 text-amber-800 [a&]:hover:bg-amber-100/90",
            statusBadgeTypography,
          ),
        pending:
          cn(
            "border-transparent bg-amber-100 text-amber-800 [a&]:hover:bg-amber-100/90",
            statusBadgeTypography,
          ),
        destructive:
          cn(
            "border-transparent bg-red-100 text-red-800 [a&]:hover:bg-red-100/90",
            statusBadgeTypography,
          ),
        rejected:
          cn(
            "border-transparent bg-red-100 text-red-800 [a&]:hover:bg-red-100/90",
            statusBadgeTypography,
          ),
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  const showDot = variant != null && STATUS_VARIANTS.has(variant)

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {showDot ? (
        <span
          className="mr-1.5 inline-block size-1.5 shrink-0 rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
