import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useGSAP } from "@gsap/react"
import { trapFocus } from "@/lib/focus-trap"
import { gsap, setScrollLocked } from "@/lib/scroll"
import { MODALIDADES, whatsappLink, type Modalidade } from "@/config"

// Gaveta "Aula experimental" (SPEC.md §4). Todo link para #aula-experimental
// abre a gaveta em vez de rolar a página; data-modalidade pré-marca a escolha.
// O envio monta a mensagem e abre o WhatsApp (decisão do cliente).

type Choice = Modalidade | "Ainda não sei"

const EXPERIENCIAS = [
  { label: "Nunca treinei", color: null },
  { label: "Branca", color: "#f2f2f2" },
  { label: "Azul", color: "#1d3f8f" },
  { label: "Roxa", color: "#582a84" },
  { label: "Marrom", color: "#5c3a24" },
  { label: "Preta", color: "#111111" },
] as const

interface BookingApi {
  open: (modalidade?: string) => void
}

const BookingContext = createContext<BookingApi>({ open: () => {} })
export const useBooking = () => useContext(BookingContext)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; modalidade?: Choice }>({ open: false })

  const open = useCallback((modalidade?: string) => {
    const valid = MODALIDADES.find((m) => m === modalidade)
    setState({ open: true, modalidade: valid })
  }, [])

  // Intercepta qualquer link para #aula-experimental (hero, seções, rodapé…).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href="#aula-experimental"]') as HTMLAnchorElement | null
      if (!link) return
      e.preventDefault()
      open(link.dataset.modalidade)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [open])

  return (
    <BookingContext.Provider value={{ open }}>
      {children}
      {state.open && <BookingDrawer initial={state.modalidade} onClose={() => setState({ open: false })} />}
    </BookingContext.Provider>
  )
}

function BookingDrawer({ initial, onClose }: { initial?: Choice; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const firstField = useRef<HTMLInputElement>(null)
  const closing = useRef(false)
  const titleId = useId()
  const [modalidade, setModalidade] = useState<Choice | undefined>(initial)
  const [experiencia, setExperiencia] = useState<string>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)
  const [isMobile] = useState(() => matchMedia("(max-width: 767px)").matches)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    setScrollLocked(true)
    firstField.current?.focus({ preventScroll: true })
    const panel = root.current?.querySelector<HTMLElement>("[data-drawer-panel]")
    const release = panel ? trapFocus(panel) : undefined
    return () => {
      release?.()
      setScrollLocked(false)
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  const axis = isMobile ? "yPercent" : "xPercent"

  const { contextSafe } = useGSAP(
    () => {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
      gsap.from("[data-drawer-backdrop]", { opacity: 0, duration: reduce ? 0.01 : 0.5, ease: "power2.out" })
      gsap.from("[data-drawer-panel]", { [axis]: 100, duration: reduce ? 0.01 : 0.8, ease: "expo.out" })
      if (!reduce) {
        gsap.from("[data-drawer-item]", { opacity: 0, y: 16, duration: 0.8, ease: "expo.out", stagger: 0.05, delay: 0.15 })
      }
    },
    { scope: root },
  )

  const close = contextSafe(() => {
    if (closing.current) return
    closing.current = true
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    gsap
      .timeline({ onComplete: onClose })
      .to("[data-drawer-panel]", { [axis]: 100, duration: reduce ? 0.01 : 0.5, ease: "power3.in" })
      .to("[data-drawer-backdrop]", { opacity: 0, duration: reduce ? 0.01 : 0.3 }, reduce ? 0 : 0.2)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [close])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const nome = String(data.get("nome") ?? "").trim()
    const whatsapp = String(data.get("whatsapp") ?? "").trim()
    const idade = String(data.get("idade") ?? "").trim()
    const next: Record<string, string> = {}
    if (nome.length < 2) next.nome = "Diga como podemos te chamar."
    if (whatsapp.replace(/\D/g, "").length < 10) next.whatsapp = "Informe um WhatsApp com DDD."
    setErrors(next)
    if (Object.keys(next).length) return

    const linhas = [
      "Olá, Black Wave! Quero agendar uma aula experimental.",
      "",
      `Nome: ${nome}`,
      `Modalidade: ${modalidade ?? "Ainda não sei"}`,
      idade ? `${modalidade === "Kids" ? "Idade da criança" : "Idade"}: ${idade}` : null,
      `Experiência: ${experiencia ?? "Não informei"}`,
      `Meu WhatsApp: ${whatsapp}`,
    ].filter((l) => l !== null)
    window.open(whatsappLink(linhas.join("\n")), "_blank", "noopener")
    setSent(true)
  }

  const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"
  const input =
    "mt-3 block w-full border-b border-paper/25 bg-transparent pb-3 text-[length:var(--fs-body)] text-paper outline-none transition-colors placeholder:text-paper/30 focus:border-accent focus-visible:outline-none"
  const chip = (active: boolean) =>
    "flex items-center gap-2 border px-4 py-2.5 text-sm transition-colors duration-300 " +
    (active ? "border-paper bg-paper text-ink" : "border-paper/25 text-paper/80 hover:border-paper/60")

  return createPortal(
    <div ref={root} className="fixed inset-0 z-[70]">
      <div data-drawer-backdrop className="absolute inset-0 bg-ink/60 backdrop-blur-[3px]" onClick={close} />
      <div
        data-drawer-panel
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[92svh] flex-col overflow-y-auto border-t border-paper/15 bg-ink text-paper md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[min(34rem,100%)] md:border-t-0 md:border-l"
      >
        <div className="flex items-start justify-between px-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(1.5rem,4vh,2.5rem)]">
          <p data-drawer-item className={label}>
            <span className="text-accent">—</span> Black Wave
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="-mt-2 -mr-2 p-2 text-paper/70 transition-colors hover:text-paper"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="flex flex-1 flex-col justify-center gap-6 px-[clamp(1.5rem,3vw,2.5rem)] py-12">
            <h2 id={titleId} className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">
              Quase lá.
            </h2>
            <p className="max-w-[34ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
              Sua mensagem foi aberta no WhatsApp. É só enviar que a equipe responde para combinar o dia.
            </p>
            <button
              type="button"
              onClick={close}
              className="self-start border border-paper/40 px-6 py-3 text-sm uppercase tracking-[0.2em] transition-colors hover:border-accent hover:bg-accent"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8 px-[clamp(1.5rem,3vw,2.5rem)] pt-8 pb-10">
            <h2 id={titleId} data-drawer-item className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">
              Aula experimental
            </h2>

            <label data-drawer-item className="block">
              <span className={label}>Nome</span>
              <input ref={firstField} name="nome" autoComplete="name" className={input} placeholder="Como podemos te chamar" />
              {errors.nome && <span className="mt-2 block text-sm text-accent">{errors.nome}</span>}
            </label>

            <label data-drawer-item className="block">
              <span className={label}>WhatsApp</span>
              <input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" className={input} placeholder="(98) 9 0000-0000" />
              {errors.whatsapp && <span className="mt-2 block text-sm text-accent">{errors.whatsapp}</span>}
            </label>

            <fieldset data-drawer-item>
              <legend className={label}>Modalidade</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...MODALIDADES, "Ainda não sei" as const].map((m) => (
                  <button key={m} type="button" aria-pressed={modalidade === m} onClick={() => setModalidade(m)} className={chip(modalidade === m)}>
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>

            <label data-drawer-item className="block">
              <span className={label}>{modalidade === "Kids" ? "Idade da criança" : "Idade"}</span>
              <input name="idade" type="number" inputMode="numeric" min={3} max={99} className={input + " max-w-[8rem]"} placeholder="—" />
            </label>

            <fieldset data-drawer-item>
              <legend className={label}>Experiência</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {EXPERIENCIAS.map((x) => (
                  <button
                    key={x.label}
                    type="button"
                    aria-pressed={experiencia === x.label}
                    onClick={() => setExperiencia(x.label)}
                    className={chip(experiencia === x.label)}
                  >
                    {x.color && (
                      <span aria-hidden="true" className="h-2.5 w-5 rounded-[1px] ring-1 ring-paper/40" style={{ backgroundColor: x.color }} />
                    )}
                    {x.color ? `Faixa ${x.label.toLowerCase()}` : x.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              data-drawer-item
              type="submit"
              className="group mt-2 inline-flex items-center justify-between gap-4 bg-paper px-7 py-5 text-sm uppercase tracking-[0.24em] text-ink transition-colors duration-300 hover:bg-accent hover:text-paper"
            >
              Quero agendar
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            <p data-drawer-item className="-mt-4 text-xs leading-relaxed text-paper/50">
              Ao enviar, abrimos o WhatsApp com a sua mensagem pronta. Nada é salvo neste site.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
