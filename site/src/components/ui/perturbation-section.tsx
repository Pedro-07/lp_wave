import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { gsap, ScrollTrigger, SplitText } from "@/lib/scroll"
import { CtaLink } from "./cta-link"

// Seção 2 — "A perturbação" (SPEC.md §4). Tipografia como protagonista:
// cada motivo acende enquanto cruza o centro da tela; o fecho traz a tese
// da marca (a perturbação não é evitada, é direcionada).

const MOTIVES = [
  "Vontade de evoluir.",
  "Superar um limite.",
  "Confiança.",
  "Pertencer.",
  "Saúde.",
  "Competir.",
  "Reconstruir a autoestima.",
]

const DIM = "rgba(255,255,255,0.18)"

export function PerturbationSection() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope.current)

        // Motivos: acende só o que está sobre a linha central da tela
        // (os itens são contíguos, então há sempre no máximo um ativo).
        for (const item of q("[data-motive]")) {
          const text = item.querySelector("[data-motive-text]")
          const mark = item.querySelector("[data-motive-mark]")
          gsap.set(text, { color: DIM })
          gsap.set(mark, { scaleX: 0 })
          ScrollTrigger.create({
            trigger: item,
            start: "top center",
            end: "bottom center",
            onToggle: ({ isActive }) => {
              gsap.to(text, { color: isActive ? "#ffffff" : DIM, duration: 0.5, ease: "power2.inOut" })
              gsap.to(mark, { scaleX: isActive ? 1 : 0, duration: 0.5, ease: "power2.inOut" })
            },
          })
        }

        // Reveals por linha.
        for (const el of q("[data-reveal-lines]")) {
          const split = SplitText.create(el, { type: "lines", mask: "lines" })
          gsap.from(split.lines, {
            yPercent: 100,
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 82%" },
          })
        }

        gsap.from(q("[data-rise]"), {
          autoAlpha: 0,
          y: 24,
          duration: 1,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: q("[data-rise]")[0], start: "top 88%" },
        })
      })
    },
    { scope },
  )

  return (
    <section
      ref={scope}
      id="perturbacao"
      aria-labelledby="perturbacao-titulo"
      className="relative bg-ink px-[var(--gutter)] py-[var(--space-section)] text-paper"
    >
      <div className="grid gap-y-16 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        {/* Coluna fixa */}
        <header className="lg:col-span-4 lg:self-start lg:sticky lg:top-[22vh]">
          <p className="mb-8 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
            <span className="text-accent">02</span> — A perturbação
          </p>
          <h2
            id="perturbacao-titulo"
            data-reveal-lines
            className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em]"
          >
            Todo mundo chega com alguma coisa.
          </h2>
          <p data-reveal-lines className="mt-8 max-w-[30ch] text-[length:var(--fs-body)] leading-relaxed text-paper/70">
            Ninguém pisa no tatame por acaso. Cada um traz uma inquietação.
          </p>
        </header>

        {/* Motivos */}
        <ul className="lg:col-span-8 lg:pt-[18vh] lg:pb-[12vh]">
          {MOTIVES.map((motive) => (
            <li key={motive} data-motive className="relative py-[clamp(0.35rem,1vw,0.9rem)]">
              <span
                data-motive-mark
                aria-hidden="true"
                className="absolute top-1/2 -left-[clamp(1rem,2.5vw,2.5rem)] hidden h-[3px] w-[clamp(0.6rem,1.6vw,1.6rem)] origin-left -translate-y-1/2 bg-accent sm:block"
              />
              <span
                data-motive-text
                className="block font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em] text-paper"
              >
                {motive}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Fecho */}
      <div className="mt-[var(--space-section)] grid lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <h2
          data-reveal-lines
          className="font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em] lg:col-span-12"
        >
          <span className="block text-paper/40">Aqui, ela não é evitada.</span>
          <span className="block">É direcionada.</span>
        </h2>
        <div className="mt-12 lg:col-span-6 lg:col-start-5 lg:mt-16">
          <p data-rise className="max-w-[46ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
            A Black Wave existe para formar faixas pretas saudáveis, com excelência técnica e caráter sólido. Gente
            preparada para gerar impacto positivo na sociedade.
          </p>
          <CtaLink data-rise href="#aula-experimental" className="mt-10">
            Agendar aula experimental
          </CtaLink>
        </div>
      </div>
    </section>
  )
}
