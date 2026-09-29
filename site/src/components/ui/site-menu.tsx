import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { WHATSAPP_DISPLAY, whatsappLink } from "@/config"
import { trapFocus } from "@/lib/focus-trap"
import { enqueueIdle } from "@/lib/idle"
import { gsap, scrollToSection, setScrollLocked } from "@/lib/scroll"
import { CtaLink } from "./cta-link"

// Menu de atalhos, fixo no canto superior direito em todas as telas: a trilha
// da página continua sendo o caminho natural, mas ninguém precisa percorrê-la
// inteira para chegar a uma seção. Modalidades vem em destaque (é o "balcão").

interface Item {
  id: string
  n: string
  label: string
  main?: boolean
}

const ITEMS: Item[] = [
  { id: "modalidades", n: "04", label: "Modalidades", main: true },
  { id: "perturbacao", n: "02", label: "A perturbação" },
  { id: "tatame", n: "03", label: "O tatame" },
  { id: "kimonos", n: "05", label: "Kimonos" },
  { id: "vozes", n: "06", label: "Vozes do tatame" },
  { id: "ouvidoria", n: "07", label: "Ouvidoria" },
  { id: "onde-estamos", n: "09", label: "Onde estamos" },
]

/** Vai até a seção; se ela ainda não foi montada (logo após abrir o site), tenta de novo. */
export function goToSection(id: string) {
  if (!scrollToSection(id)) enqueueIdle(() => void scrollToSection(id))
}

export function SiteMenu() {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed top-[clamp(0.75rem,2vw,1.75rem)] right-[calc(var(--gutter)-0.75rem)] z-[60] flex items-center gap-3 px-3 py-3 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper mix-blend-difference transition-opacity hover:opacity-70"
      >
        <span className="pl-[0.32em]">Menu</span>
        <span className="flex w-5 flex-col gap-[5px]" aria-hidden="true">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-3/5 self-end bg-current" />
        </span>
      </button>
      {open && <MenuPanel onClose={() => setOpen(false)} returnFocus={button} />}
    </>
  )
}

function MenuPanel({ onClose, returnFocus }: { onClose: () => void; returnFocus: React.RefObject<HTMLButtonElement | null> }) {
  const root = useRef<HTMLDivElement>(null)
  const closing = useRef(false)

  useEffect(() => {
    const el = root.current!
    setScrollLocked(true)
    const release = trapFocus(el)
    el.querySelector<HTMLElement>("[data-menu-first]")?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduce) {
      gsap.from(el, { clipPath: "inset(0 0 100% 0)", duration: 0.6, ease: "expo.out" })
      gsap.from(el.querySelectorAll("[data-menu-item]"), {
        yPercent: 60,
        opacity: 0,
        duration: 0.7,
        ease: "expo.out",
        stagger: 0.04,
        delay: 0.1,
      })
    }
    return () => {
      release()
      document.removeEventListener("keydown", onKey)
      setScrollLocked(false)
    }
    // close é estável o suficiente aqui: só lê refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Fecha; com destino, salta até a seção por trás do painel antes de ele sumir. */
  function close(target?: string) {
    if (closing.current) return
    closing.current = true
    const el = root.current!
    const done = () => {
      onClose()
      if (!target) returnFocus.current?.focus({ preventScroll: true })
    }
    // O salto acontece por trás do painel (a rolagem programada funciona mesmo travada).
    if (target) goToSection(target)
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done()
    gsap.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.45, ease: "expo.in", onComplete: done })
  }

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[65] flex flex-col overflow-y-auto bg-ink px-[var(--gutter)] pt-[clamp(0.75rem,2vw,1.75rem)] pb-[clamp(1.5rem,4vh,3rem)] text-paper"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <div className="flex items-center justify-between">
        <a
          href="#topo"
          onClick={(e) => {
            e.preventDefault()
            close("topo")
          }}
          className="py-3"
        >
          <img src="/brand/naming-white.webp" alt="Black Wave — início" width={1400} height={158} className="h-auto w-32 sm:w-40" />
        </a>
        <button
          type="button"
          onClick={() => close()}
          className="-mr-3 flex items-center gap-3 px-3 py-3 text-[length:var(--fs-label)] uppercase tracking-[0.32em] hover:text-accent"
        >
          <span className="pl-[0.32em]">Fechar</span>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <nav aria-label="Seções" className="my-auto py-[clamp(1.5rem,5vh,4rem)]">
        <ul className="grid gap-[clamp(0.25rem,1.2vh,0.75rem)]">
          {ITEMS.map((it, i) => (
            <li key={it.id} className="overflow-hidden">
              <a
                href={`#${it.id}`}
                data-menu-item
                data-menu-first={i === 0 ? "" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  close(it.id)
                }}
                className="group flex items-baseline gap-[clamp(0.75rem,2vw,1.5rem)]"
              >
                <span className={"w-[2.5ch] shrink-0 text-[length:var(--fs-label)] tracking-[0.2em] " + (it.main ? "text-accent" : "text-paper/60")}>
                  {it.n}
                </span>
                <span
                  className={
                    "font-display font-extrabold uppercase leading-[0.95] tracking-[-0.01em] transition-colors group-hover:text-accent " +
                    (it.main ? "text-[clamp(2.75rem,9vw,7rem)]" : "text-[clamp(1.6rem,4.4vw,3.25rem)] text-paper/85")
                  }
                >
                  {it.label}
                </span>
                {it.main && (
                  <span className="hidden self-center text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60 sm:inline">
                    Comece por aqui
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div data-menu-item className="flex flex-col gap-5 border-t border-paper/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <CtaLink href="#aula-experimental" onClick={() => close()} className="self-start">
          Agendar aula experimental
        </CtaLink>
        <a
          href={whatsappLink("Olá! Vim pelo site da Black Wave.")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/70 hover:text-paper"
        >
          WhatsApp {WHATSAPP_DISPLAY}
        </a>
      </div>
    </div>,
    document.body,
  )
}
