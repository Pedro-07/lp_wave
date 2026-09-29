import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { gsap, SplitText } from "@/lib/scroll"

// Seção 7 — chamada para a ouvidoria anônima (SPEC.md §4). A ouvidoria em si
// fica em /ouvidoria/ (página própria).

export function OuvidoriaSection() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope.current)
        const words = SplitText.create(q("[data-ouv-title]")[0], { type: "words", aria: "none" }).words
        gsap.from(words, {
          yPercent: 60,
          autoAlpha: 0,
          filter: "blur(10px)",
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: scope.current, start: "top 75%" },
        })
        gsap.from(q("[data-ouv-rise]"), {
          y: 24,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: scope.current, start: "top 65%" },
        })
      })
    },
    { scope },
  )

  return (
    <section
      ref={scope}
      id="ouvidoria"
      aria-labelledby="ouvidoria-titulo"
      className="relative border-t border-paper/10 bg-ink px-[var(--gutter)] py-[var(--space-section)] text-paper"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-x-[var(--gutter)]">
        <div className="lg:col-span-7">
          <p className="mb-6 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
            <span className="text-accent">07</span> — Ouvidoria
          </p>
          <h2
            id="ouvidoria-titulo"
            data-ouv-title
            className="max-w-[12ch] font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"
          >
            Fale sem se identificar.
          </h2>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5">
          <p data-ouv-rise className="flex flex-wrap gap-x-4 gap-y-2 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
            <span>Sugestão</span>
            <span className="text-accent">·</span>
            <span>Crítica</span>
            <span className="text-accent">·</span>
            <span>Denúncia</span>
          </p>
          <p data-ouv-rise className="max-w-[40ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
            Sugestões, críticas ou denúncias chegam à gestão da equipe. Não pedimos nome, e-mail ou telefone.
          </p>
          <a
            data-ouv-rise
            href="/ouvidoria/"
            className="group inline-flex items-center gap-4 self-start border border-paper/40 px-5 py-4 text-xs uppercase tracking-[0.18em] transition-colors duration-300 hover:border-accent hover:bg-accent sm:px-7 sm:text-sm sm:tracking-[0.24em]"
          >
            Abrir a ouvidoria
            <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </a>
          <a
            data-ouv-rise
            href="/ouvidoria/#acompanhar"
            className="-mt-2 self-start text-sm text-paper/60 underline decoration-paper/30 underline-offset-8 transition-colors hover:text-paper"
          >
            Já enviou? Acompanhe pelo código
          </a>
        </div>
      </div>
    </section>
  )
}
