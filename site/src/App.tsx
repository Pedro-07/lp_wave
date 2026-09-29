import { useEffect } from "react"
import { BookingProvider } from "@/components/ui/booking-drawer"
import { ClosingSection } from "@/components/ui/closing-section"
import { GearSection } from "@/components/ui/gear-section"
import { LocationSection } from "@/components/ui/location-section"
import { ModalitiesSection } from "@/components/ui/modalities-section"
import { OuvidoriaSection } from "@/components/ui/ouvidoria-section"
import { PerturbationSection } from "@/components/ui/perturbation-section"
import { SiteFooter } from "@/components/ui/site-footer"
import { TestimonialsSection } from "@/components/ui/testimonials-section"
import { TrainingVideoSection } from "@/components/ui/training-video-section"
import { WaveHero } from "@/components/ui/wave-hero"
import { initScroll } from "@/lib/scroll"

export default function App() {
  useEffect(() => initScroll() ?? undefined, [])

  return (
    <BookingProvider>
      <main className="grain">
        <WaveHero />
        <PerturbationSection />
        <TrainingVideoSection />
        <ModalitiesSection />
        <GearSection />
        <TestimonialsSection />
        <OuvidoriaSection />
        <ClosingSection />
        <LocationSection />
      </main>
      <SiteFooter />
    </BookingProvider>
  )
}
