import { useEffect } from "react"
import { PerturbationSection } from "@/components/ui/perturbation-section"
import { TrainingVideoSection } from "@/components/ui/training-video-section"
import { WaveHero } from "@/components/ui/wave-hero"
import { initScroll } from "@/lib/scroll"

export default function App() {
  useEffect(() => initScroll() ?? undefined, [])

  return (
    <main className="grain">
      <WaveHero />
      <PerturbationSection />
      <TrainingVideoSection />

      {/* Provisório: destino dos CTAs até as seções 4+ e a gaveta de agendamento existirem. */}
      <section
        id="modalidades"
        className="flex min-h-svh items-center px-[var(--gutter)] py-[clamp(6rem,14vw,14rem)]"
      >
        <p id="aula-experimental" className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-grey">
          Próxima seção — modalidades (em construção)
        </p>
      </section>
    </main>
  )
}
