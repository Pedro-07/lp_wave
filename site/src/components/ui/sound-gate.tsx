import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useGSAP } from "@gsap/react"
import { trapFocus } from "@/lib/focus-trap"
import { gsap, setScrollLocked } from "@/lib/scroll"

// Tela de entrada: o navegador só libera áudio após um gesto, então pedimos
// esse gesto com intenção — um toque em qualquer lugar entra no site com o
// som do mar; "Entrar sem som" entra em silêncio. Citação: abertura do
// manual da marca (Jostein Gaarder).

interface SoundGateProps {
  /** Chamado dentro do gesto do usuário (necessário para liberar o áudio). */
  onChoose: (withSound: boolean) => void
  /** Chamado quando a animação de saída termina. */
  onClosed: () => void
}

export function SoundGate({ onChoose, onClosed }: SoundGateProps) {
  const root = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  const isTouch = matchMedia("(pointer: coarse)").matches

  useEffect(() => {
    setScrollLocked(true)
    // Foco no próprio diálogo (sem contorno): leitores de tela o anunciam, e
    // o teclado usa Enter/Espaço (com som) ou Esc (sem som).
    root.current?.focus({ preventScroll: true })
    const release = root.current ? trapFocus(root.current) : undefined
    return () => {
      release?.()
      setScrollLocked(false)
    }
  }, [])

  const { contextSafe } = useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap
        .timeline()
        .from(root.current, { opacity: 0, duration: 0.8, ease: "power2.out" })
        .from("[data-gate-card]", { opacity: 0, y: 24, duration: 1, ease: "expo.out" }, 0.1)
        .from("[data-gate-item]", { opacity: 0, y: 12, duration: 1, ease: "expo.out", stagger: 0.07 }, 0.25)
    },
    { scope: root },
  )

  const choose = contextSafe((withSound: boolean) => {
    if (closing.current) return
    closing.current = true
    onChoose(withSound)
    setScrollLocked(false)
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    gsap
      .timeline({ onComplete: onClosed })
      .to("[data-gate-card]", { autoAlpha: 0, y: reduce ? 0 : -16, duration: reduce ? 0.15 : 0.5, ease: "power2.in" })
      .to(root.current, { autoAlpha: 0, duration: reduce ? 0.15 : 0.7, ease: "power2.inOut" }, reduce ? 0 : 0.2)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") choose(false)
      else if ((e.key === "Enter" || e.key === " ") && e.target === root.current) {
        e.preventDefault()
        choose(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [choose])

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-quote"
      tabIndex={-1}
      onClick={() => choose(true)}
      className="fixed inset-0 z-[60] flex cursor-pointer touch-none items-end justify-center overscroll-none bg-ink/55 p-[var(--gutter)] outline-none backdrop-blur-[3px] sm:items-center"
    >
      <div
        data-gate-card
        className="w-full max-w-[34rem] border border-paper/15 bg-ink/85 p-[clamp(1.5rem,3vw,2.5rem)] text-paper"
      >
        <p data-gate-item className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
          Black Wave <span className="text-accent">—</span> Jiu Jitsu Team
        </p>

        <figure className="mt-6">
          <blockquote
            id="gate-quote"
            data-gate-item
            className="text-[clamp(1.25rem,2vw,1.75rem)] font-light leading-[1.25] tracking-[-0.01em] text-balance"
          >
            “O fato do mar estar calmo na superfície não significa que algo não esteja acontecendo nas profundezas.”
          </blockquote>
          <figcaption data-gate-item className="mt-4 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/50">
            Jostein Gaarder
          </figcaption>
        </figure>

        <div data-gate-item className="my-6 h-px bg-paper/15" />

        <div className="flex flex-col items-start gap-5">
          <button
            data-gate-item
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              choose(true)
            }}
            className="group flex items-center gap-4 text-left"
          >
            <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="eq-bar eq-bar--on w-[2px] bg-accent" style={{ animationDelay: `${i * -0.23}s` }} />
              ))}
            </span>
            <span className="text-[length:var(--fs-body)] leading-snug">
              {isTouch ? "Toque em qualquer lugar" : "Clique em qualquer lugar"}
              <span className="text-paper/60"> e entre ouvindo o{" "}mar.</span>
            </span>
          </button>
          <button
            data-gate-item
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              choose(false)
            }}
            className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/50 underline decoration-paper/30 underline-offset-8 transition-colors hover:text-paper"
          >
            Entrar sem som
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
