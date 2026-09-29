import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { useIdleReady } from "@/lib/idle"
import { gsap, SplitText } from "@/lib/scroll"

// Seção 6 — Vozes do tatame (SPEC.md §4). Sem cards: um depoimento por
// "página", as palavras acendem conforme a rolagem (a pessoa fala no ritmo
// da leitura) e a assinatura traz uma faixa na cor da graduação, desenhada
// no traço do símbolo. Conteúdo real pendente — nada é inventado.

type Faixa = "branca" | "azul" | "roxa" | "marrom" | "preta"

interface Depoimento {
  quote: string
  name: string
  faixa: Faixa
  tempo: string
}

// [PREENCHER] — substituir por depoimentos reais (frase, nome, faixa, tempo de tatame).
const DEPOIMENTOS: Depoimento[] = [
  {
    quote: "[PREENCHER] Depoimento real de um aluno ou aluna, em uma ou duas frases, com as palavras dele.",
    name: "[Nome do aluno]",
    faixa: "branca",
    tempo: "[tempo de tatame]",
  },
  {
    quote: "[PREENCHER] O que mudou desde que começou a treinar na Black Wave: um fato concreto, não um elogio.",
    name: "[Nome da aluna]",
    faixa: "azul",
    tempo: "[tempo de tatame]",
  },
  {
    quote: "[PREENCHER] A voz de quem está há mais tempo no tatame, sobre a equipe e o jeito de treinar.",
    name: "[Nome]",
    faixa: "preta",
    tempo: "[tempo de tatame]",
  },
]

const BELT_COLOR: Record<Faixa, string> = {
  branca: "#eeeeee",
  azul: "#1d3f8f",
  roxa: "#582a84",
  marrom: "#5c3a24",
  preta: "#161616",
}

/** Faixa no traço do símbolo: curva que termina reta, com a ponteira. */
function BeltSignature({ faixa }: { faixa: Faixa }) {
  const color = BELT_COLOR[faixa]
  const bar = faixa === "preta" ? "#fd002a" : "#0d0d0d"
  return (
    <svg viewBox="0 0 240 40" className="h-10 w-60" aria-hidden="true">
      {/* contorno fino para a faixa preta não sumir no fundo */}
      <path d="M4 30 C 50 30, 70 10, 120 14 S 190 22, 236 18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={14} strokeLinecap="butt" data-belt-path />
      <path d="M4 30 C 50 30, 70 10, 120 14 S 190 22, 236 18" fill="none" stroke={color} strokeWidth={12} strokeLinecap="butt" data-belt-path />
      <path d="M196 20.5 L 214 19.3" fill="none" stroke={bar} strokeWidth={12} data-belt-bar />
    </svg>
  )
}

export function TestimonialsSection() {
  const scope = useRef<HTMLElement>(null)
  /** Monta as animações num momento ocioso (ver lib/idle.ts). */
  const idleReady = useIdleReady()
  const [isStatic] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)

  useGSAP(
    () => {
      if (!idleReady) return
      if (isStatic) return
      const q = gsap.utils.selector(scope.current)

      const title = SplitText.create(q("[data-voices-title]")[0], { type: "words", aria: "none" }).words
      gsap.from(title, {
        yPercent: 60,
        autoAlpha: 0,
        filter: "blur(10px)",
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: q("[data-voices-title]")[0], start: "top 80%" },
      })

      for (const block of q("[data-voice]")) {
        const b = gsap.utils.selector(block)
        const words = SplitText.create(b("[data-voice-quote]")[0], { type: "words", aria: "none" }).words

        // As palavras acendem no ritmo da rolagem.
        gsap.fromTo(
          words,
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: block, start: "top 70%", end: "center 42%", scrub: 0.5 },
          },
        )

        // Faixa da assinatura se desenha; a ponteira entra no fim.
        const paths = [...block.querySelectorAll<SVGPathElement>("[data-belt-path]")]
        paths.forEach((p) => {
          const len = p.getTotalLength()
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
        })
        const sig = gsap.timeline({ scrollTrigger: { trigger: block, start: "top 55%", end: "center 40%", scrub: 0.5 } })
        sig.to(paths, { strokeDashoffset: 0, ease: "none", duration: 1 })
        sig.from(b("[data-belt-bar]"), { opacity: 0, duration: 0.2 }, 0.85)
        sig.from(b("[data-voice-meta]"), { opacity: 0, y: 10, duration: 0.4 }, 0.5)

        // Número vazado desliza mais devagar que o texto.
        gsap.fromTo(
          b("[data-voice-index]"),
          { yPercent: 25 },
          { yPercent: -25, ease: "none", scrollTrigger: { trigger: block, start: "top bottom", end: "bottom top", scrub: true } },
        )
      }
    },
    { scope, dependencies: [idleReady] },
  )

  return (
    <section ref={scope} id="vozes" aria-labelledby="vozes-titulo" className="relative bg-ink py-[var(--space-section)] text-paper">
      <div className="px-[var(--gutter)]">
        <p className="mb-6 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
          <span className="text-accent">06</span> — Vozes do tatame
        </p>
        <h2
          id="vozes-titulo"
          data-voices-title
          className="max-w-[14ch] font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"
        >
          Quem já está no tatame.
        </h2>
      </div>

      <div className="mt-[clamp(3rem,8vw,7rem)]">
        {DEPOIMENTOS.map((d, i) => (
          <figure
            key={i}
            data-voice
            className="relative grid min-h-[80svh] items-center gap-8 border-t border-paper/10 px-[var(--gutter)] py-[clamp(3rem,8vw,7rem)] lg:grid-cols-12 lg:gap-x-[var(--gutter)]"
          >
            <span
              data-voice-index
              aria-hidden="true"
              className={
                "voice-index pointer-events-none font-display text-[clamp(6rem,18vw,18rem)] leading-none font-extrabold lg:col-span-3 " +
                (i % 2 ? "lg:order-2 lg:text-right" : "")
              }
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* Alterna o lado a cada depoimento: número à esquerda / à direita */}
            <div className={"lg:col-span-9 " + (i % 2 ? "lg:order-1 lg:pl-[6vw]" : "")}>
              <span aria-hidden="true" className="block font-display text-[clamp(4rem,8vw,7rem)] leading-[0.6] text-accent">
                “
              </span>
              <blockquote
                data-voice-quote
                className="mt-2 max-w-[28ch] text-[clamp(1.6rem,3.3vw,3.4rem)] leading-[1.18] font-light tracking-[-0.01em]"
              >
                {d.quote}
              </blockquote>
              <figcaption className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <BeltSignature faixa={d.faixa} />
                <span data-voice-meta className="flex flex-col">
                  <span className="text-[length:var(--fs-body)] font-medium">{d.name}</span>
                  <span className="text-[length:var(--fs-label)] uppercase tracking-[0.28em] text-paper/55">
                    Faixa {d.faixa} · {d.tempo}
                  </span>
                </span>
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  )
}
