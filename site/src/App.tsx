import { useEffect } from "react"
import { BookingProvider } from "@/components/ui/booking-drawer"
import { GearSection } from "@/components/ui/gear-section"
import { ModalitiesSection } from "@/components/ui/modalities-section"
import { OuvidoriaSection } from "@/components/ui/ouvidoria-section"
import { PerturbationSection } from "@/components/ui/perturbation-section"
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

        {/* Provisório: as seções 8+ (fecho, localização, rodapé) vêm a seguir. */}
        <section className="flex min-h-[50svh] items-center px-[var(--gutter)]">
          <p className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-grey">
            Próxima seção — Fecho (em construção)
          </p>
        </section>
      </main>
    </BookingProvider>
  )
}
