import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { useIdleReady } from "@/lib/idle"
import { gsap, SplitText } from "@/lib/scroll"
import { CtaLink } from "./cta-link"
import { addSymbolDraw, SymbolDraw } from "./symbol-draw"

// Seção 8 — Fecho (SPEC.md §4). A tese da marca, linha a linha, e o traço do
// símbolo se desenhando de novo: o site termina como começou (hero).

export function ClosingSection() {
  const scope = useRef<HTMLElement>(null)
  /** Monta as animações num momento ocioso (ver lib/idle.ts). */
  const idleReady = useIdleReady()
  const [isStatic] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)

  useGSAP(
    () => {
      if (!idleReady) return
      if (isStatic) return
      const root = scope.current!
      const q = gsap.utils.selector(root)
      const lines = q("[data-thesis-line]").map((el) => SplitText.create(el, { type: "words", aria: "none" }).words)

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: "top 65%", end: "bottom 85%", scrub: 0.6 },
      })
      // Cada linha acende por inteiro antes da seguinte.
      lines.forEach((words, i) => {
        tl.fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.04, duration: 0.2 }, i * 0.25)
      })
      addSymbolDraw(tl, root, 0.5, 0.3)
      tl.from(q("[data-closing-rise]"), { opacity: 0, y: 24, stagger: 0.04, duration: 0.12, ease: "power2.out" }, 0.78)
    },
    { scope, dependencies: [idleReady] },
  )

  return (
    <section
      ref={scope}
      id="fecho"
      aria-labelledby="fecho-titulo"
      className="relative overflow-hidden border-t border-paper/10 bg-ink px-[var(--gutter)] py-[var(--space-section)] text-paper"
    >
      <p className="mb-8 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
        <span className="text-accent">08</span> — Just Flow
      </p>
      <h2 id="fecho-titulo" className="font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em]">
        <span data-thesis-line className="block">
          Sem perturbação, não existe movimento.
        </span>
        <span data-thesis-line className="mt-[0.15em] block text-paper">
          Sem movimento, não existe onda.
        </span>
      </h2>

      <div className="mt-[clamp(3rem,8vw,6rem)] grid items-end gap-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <SymbolDraw complete={isStatic} className="w-full lg:col-span-7" />
        <div className="flex flex-col gap-6 lg:col-span-5">
          <p data-closing-rise className="max-w-[34ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
            Toda inquietação que você trouxer, a gente direciona.
          </p>
          <img data-closing-rise src="/brand/slogan-white.webp" alt="Just Flow" width={1400} height={530} className="h-auto w-[min(60vw,220px)]" loading="lazy" />
          <CtaLink data-closing-rise href="#aula-experimental" className="self-start">
            Agendar aula experimental
          </CtaLink>
        </div>
      </div>
    </section>
  )
}
