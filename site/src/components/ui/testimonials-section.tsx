import { useCallback, useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { useIdleReady } from "@/lib/idle"
import { gsap, SplitText } from "@/lib/scroll"

// Seção 6 — Vozes do tatame (SPEC.md §4, v2). Passagem rápida: uma faixa
// horizontal de depoimentos em formato de post/comentário (foto, nome, faixa,
// texto). A seção não fica fixa — rolar para baixo passa direto; quem quiser
// ler mais arrasta/rola para o lado ou usa as setas.
// Conteúdo real pendente — nada é inventado.

type Faixa = "branca" | "azul" | "roxa" | "marrom" | "preta"

interface Depoimento {
  quote: string
  name: string
  faixa: Faixa
  tempo: string
  /** Foto da pessoa (quadrada, ~160 px), em /public/depoimentos/. Vazio = espaço reservado. */
  foto?: string
}

// [PREENCHER] — substituir por depoimentos reais (foto, frase, nome, faixa, tempo de tatame).
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
  {
    quote: "[PREENCHER] Depoimento de quem treina no Kids (pelo responsável), em uma ou duas frases.",
    name: "[Nome do responsável]",
    faixa: "branca",
    tempo: "[tempo de tatame]",
  },
  {
    quote: "[PREENCHER] Depoimento de uma aluna da turma feminina.",
    name: "[Nome da aluna]",
    faixa: "roxa",
    tempo: "[tempo de tatame]",
  },
  {
    quote: "[PREENCHER] Depoimento de quem chegou sem nunca ter treinado.",
    name: "[Nome]",
    faixa: "marrom",
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

const pad = (n: number) => String(n).padStart(2, "0")

/** Pedaço de faixa na cor da graduação, com a ponteira (vermelha na preta). */
function BeltChip({ faixa }: { faixa: Faixa }) {
  return (
    <span
      aria-hidden="true"
      className="relative mt-[0.15em] inline-block h-2 w-9 shrink-0 ring-1 ring-paper/25"
      style={{ background: BELT_COLOR[faixa] }}
    >
      <span className="absolute inset-y-0 right-1.5 w-2" style={{ background: faixa === "preta" ? "#fd002a" : "#0d0d0d" }} />
    </span>
  )
}

/** Foto da pessoa ou, até chegar, um espaço reservado com a silhueta. */
function Avatar({ d }: { d: Depoimento }) {
  if (d.foto) {
    return <img src={d.foto} alt="" width={160} height={160} loading="lazy" className="size-12 shrink-0 rounded-full object-cover" />
  }
  return (
    <span
      aria-hidden="true"
      title="Foto em breve"
      className="grid size-12 shrink-0 place-items-center rounded-full border border-dashed border-paper/35 text-paper/40"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="9" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
    </span>
  )
}

export function TestimonialsSection() {
  const scope = useRef<HTMLElement>(null)
  const track = useRef<HTMLUListElement>(null)
  /** Monta as animações num momento ocioso (ver lib/idle.ts). */
  const idleReady = useIdleReady()
  const [isStatic] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
  const [active, setActive] = useState(0)
  const [atEnd, setAtEnd] = useState(false)

  // Card em foco = o mais próximo do início da área visível.
  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const cards = [...el.children] as HTMLElement[]
    const padLeft = parseFloat(getComputedStyle(el).paddingLeft)
    let best = 0
    cards.forEach((c, i) => {
      if (Math.abs(c.offsetLeft - padLeft - el.scrollLeft) < Math.abs(cards[best].offsetLeft - padLeft - el.scrollLeft)) best = i
    })
    setActive(best)
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    measure()
    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [measure])

  // Arrastar com o mouse (no toque, a rolagem lateral nativa já faz isso).
  useEffect(() => {
    const el = track.current
    if (!el) return
    let startX = 0
    let startLeft = 0
    let dragging = false
    let moved = false
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      dragging = true
      moved = false
      startX = e.clientX
      startLeft = el.scrollLeft
      el.classList.add("is-dragging")
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      el.scrollLeft = startLeft - dx
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      // Solta o encaixe de novo: o navegador leva ao card mais próximo.
      el.classList.remove("is-dragging")
    }
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    }
    el.addEventListener("pointerdown", down)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    el.addEventListener("click", click, true)
    return () => {
      el.removeEventListener("pointerdown", down)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      el.removeEventListener("click", click, true)
    }
  }, [])

  const go = (i: number) => {
    const el = track.current
    const card = el?.children[Math.max(0, Math.min(DEPOIMENTOS.length - 1, i))] as HTMLElement | undefined
    if (!el || !card) return
    el.scrollTo({ left: card.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: isStatic ? "auto" : "smooth" })
  }

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
        scrollTrigger: { trigger: q("[data-voices-title]")[0], start: "top 85%" },
      })
      gsap.from(q("[data-voice]"), {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: track.current, start: "top 88%" },
      })
    },
    { scope, dependencies: [idleReady] },
  )

  return (
    <section ref={scope} id="vozes" aria-labelledby="vozes-titulo" className="relative bg-ink py-[clamp(3.5rem,8vw,6.5rem)] text-paper">
      <div className="flex flex-col gap-6 px-[var(--gutter)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-4 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
            <span className="text-accent">06</span> — Vozes do tatame
          </p>
          <h2
            id="vozes-titulo"
            data-voices-title
            className="max-w-[16ch] font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em]"
          >
            Quem já está no tatame.
          </h2>
        </div>

        <div className="flex items-center gap-5">
          <p className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60" aria-live="polite">
            <span className="text-paper">{pad(active + 1)}</span> / {pad(DEPOIMENTOS.length)}
          </p>
          <div className="flex gap-2">
            {[
              { dir: -1, label: "Depoimento anterior", d: "M12 1L2 8l10 7", off: active === 0 },
              { dir: 1, label: "Próximo depoimento", d: "M4 1l10 7-10 7", off: atEnd },
            ].map((b) => (
              <button
                key={b.dir}
                type="button"
                onClick={() => go(active + b.dir)}
                disabled={b.off}
                aria-label={b.label}
                className="grid size-11 place-items-center rounded-full border border-paper/30 transition-colors hover:border-accent hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <path d={b.d} stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
            ))}
          </div>
          <p className="hidden text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60 sm:block" aria-hidden="true">
            Arraste ↔
          </p>
        </div>
      </div>

      <ul
        ref={track}
        tabIndex={0}
        aria-label="Depoimentos — role para o lado para ver mais"
        className="voices-track mt-[clamp(1.75rem,4vw,3rem)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-[clamp(0.75rem,1.5vw,1.25rem)] overflow-x-auto px-[var(--gutter)] pb-2 outline-none"
      >
        {DEPOIMENTOS.map((d, i) => (
          <li key={i} data-voice className="w-[84vw] shrink-0 snap-start select-none sm:w-[58vw] lg:w-[30vw] xl:w-[26vw]">
            <figure className="flex h-full flex-col border border-paper/12 bg-paper/[0.03] p-[clamp(1.1rem,2vw,1.6rem)]">
              <figcaption className="flex items-center gap-3">
                <Avatar d={d} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="truncate text-[length:var(--fs-body)] font-medium leading-tight">{d.name}</span>
                  <span className="flex items-start gap-2 text-[length:var(--fs-label)] uppercase leading-snug tracking-[0.2em] text-paper/60">
                    <BeltChip faixa={d.faixa} />
                    <span className="-mt-[0.2em]">
                      Faixa {d.faixa} · {d.tempo}
                    </span>
                  </span>
                </span>
                <span aria-hidden="true" className="ml-auto self-start font-display text-[2.75rem] leading-[0.7] text-accent">
                  “
                </span>
              </figcaption>
              <blockquote className="mt-5 text-[length:var(--fs-body)] leading-relaxed text-paper/85">{d.quote}</blockquote>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
