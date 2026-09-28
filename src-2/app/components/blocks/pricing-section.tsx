"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/app/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: string
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  buttonText: string
  href?: string
  onClick?: (e: React.MouseEvent) => void
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
}

function PricingSection({ tiers, className }: PricingSectionProps) {
  const buttonStyles = {
    default: cn(
      "h-12 bg-white",
      "hover:bg-[#f5f7f9]",
      "text-[#0d47a1]",
      "border-2 border-[#0d47a1]",
      "shadow-sm hover:shadow-md",
      "text-sm font-bold",
    ),
    highlight: cn(
      "h-12 bg-gradient-to-r from-[#0d47a1] to-[#00838f]",
      "hover:shadow-xl hover:shadow-[#0d47a1]/40 hover:-translate-y-0.5",
      "text-white",
      "shadow-[0_1px_15px_rgba(13,71,161,0.25)]",
      "font-bold text-base",
    ),
  }

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-gradient-to-r from-[#0d47a1] to-[#00838f]",
    "text-white",
    "border-none shadow-lg",
  )

  return (
    <section
      className={cn(
        "relative bg-transparent text-[#1a2332]",
        "py-12 px-4 md:py-24",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-5xl mx-auto" dir="rtl">
        <div className="flex flex-col items-center gap-4 mb-12 text-center">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#1a2332]">
            בחרו את החבילה
            <br />
            <span className="text-[#0d47a1]">המתאימה לכם</span>
          </h2>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto mt-4">
            כל החבילות כוללות רישיון לצמיתות — ללא עלויות חודשיות או שנתיות.
            <br />
            <span className="font-semibold">תשלום חד-פעמי בלבד.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-3xl transition-all duration-300",
                "flex flex-col",
                tier.highlight
                  ? "bg-[#f8fcff]"
                  : "bg-white",
                "border-2",
                tier.highlight
                  ? "border-[#0d47a1] shadow-2xl shadow-[#0d47a1]/15"
                  : "border-[#e1e6ec] shadow-md",
                "hover:-translate-y-1 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-[#1a2332]">
                    {tier.name}
                  </h3>
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      tier.highlight
                        ? "bg-[#0d47a1]/10 text-[#0d47a1]"
                        : "bg-[#f5f7f9] text-[#6b7c93]",
                    )}
                  >
                    {tier.icon}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#1a2332]">
                      {tier.price}
                    </span>
                    {tier.price !== "צור/י קשר" && (
                      <span className="text-lg text-[#6b7c93]">
                        / לנצח
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-base text-[#6b7c93]">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="text-lg font-bold text-[#1a2332] mb-4">מה כלול בחבילה?</div>
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                      <div
                        className={cn(
                          "mt-1 p-1 rounded-full flex-shrink-0 transition-colors duration-200",
                          feature.included
                            ? "bg-[#00838f]/10 text-[#00838f]"
                            : "bg-[#f5f7f9] text-[#6b7c93]",
                        )}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-base font-medium text-[#1a2332]">
                          {feature.name}
                        </div>
                        {feature.description && (
                          <div className="text-sm text-[#6b7c93]">
                            {feature.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                {tier.href ? (
                  <a href={tier.href} className="w-full block" onClick={tier.onClick}>
                    <Button
                      className={cn(
                        "w-full relative transition-all duration-300",
                        tier.highlight
                          ? buttonStyles.highlight
                          : buttonStyles.default,
                      )}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {tier.buttonText}
                      </span>
                    </Button>
                  </a>
                ) : (
                  <Button
                    onClick={tier.onClick}
                    className={cn(
                      "w-full relative transition-all duration-300",
                      tier.highlight
                        ? buttonStyles.highlight
                        : buttonStyles.default,
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {tier.buttonText}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection }
