import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useGSAP } from "@gsap/react"
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
    return () => setScrollLocked(false)
  }, [])

  const { contextSafe } = useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      // opacity (não autoAlpha): o botão principal precisa continuar focável.
      gsap.from("[data-gate-item]", { opacity: 0, y: 16, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.15 })
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
      .to("[data-gate-item]", { autoAlpha: 0, y: -12, duration: reduce ? 0.01 : 0.5, ease: "power2.in", stagger: 0.04 })
      .to(root.current, { autoAlpha: 0, duration: reduce ? 0.2 : 0.9, ease: "power2.inOut" }, reduce ? 0 : 0.25)
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
      className="fixed inset-0 outline-none z-[60] flex cursor-pointer touch-none flex-col justify-between overscroll-none bg-ink px-[var(--gutter)] py-[clamp(1.5rem,4vw,3rem)] text-paper"
    >
      <p data-gate-item className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
        Black Wave <span className="text-accent">—</span> Jiu Jitsu Team
      </p>

      <figure>
        <blockquote
          id="gate-quote"
          data-gate-item
          className="max-w-[26ch] text-[clamp(1.5rem,3.2vw,3rem)] font-light leading-[1.2] tracking-[-0.01em] text-balance"
        >
          “O fato do mar estar calmo na superfície não significa que algo não esteja acontecendo nas profundezas.”
        </blockquote>
        <figcaption data-gate-item className="mt-6 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/50">
          Jostein Gaarder
        </figcaption>
      </figure>

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
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
    </div>,
    document.body,
  )
}
