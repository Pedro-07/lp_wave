import { useEffect } from "react"
import { PerturbationSection } from "@/components/ui/perturbation-section"
import { WaveHero } from "@/components/ui/wave-hero"
import { initScroll } from "@/lib/scroll"

export default function App() {
  useEffect(() => initScroll() ?? undefined, [])

  return (
    <main className="grain">
      <WaveHero />
      <PerturbationSection />

      {/* Provisório: só para testar a saída do pin. Seções reais virão do SPEC. */}
      <section
        id="aula-experimental"
        className="flex min-h-svh items-center px-[var(--gutter)] py-[clamp(6rem,14vw,14rem)]"
      >
        <p className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-grey">
          Próxima seção — formulário de aula experimental (em construção)
        </p>
      </section>
    </main>
  )
}
