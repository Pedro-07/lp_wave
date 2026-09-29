import { useCallback, useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap, SplitText } from "@/lib/scroll"
import type { Modalidade } from "@/config"

// Seção 4 — Modalidades (SPEC.md §4). Carrossel horizontal de arrastar: o painel
// em foco acende e mostra detalhes + CTA; os outros ficam escurecidos. Rolagem
// nativa com snap (toque) + arraste com mouse e setas no desktop. Cada CTA
// abre a gaveta de agendamento já com a modalidade marcada.

interface Mod {
  key: string
  name: Modalidade
  desc: string
  para: string
  alt: string
}

const MODS: Mod[] = [
  {
    key: "gi",
    name: "Jiu-Jitsu Gi",
    desc: "A arte com kimono. Pegadas, alavancas e paciência.",
    para: "Iniciantes e graduados, a partir de [PREENCHER] anos.",
    alt: "Dois atletas de kimono treinando guarda fechada no tatame",
  },
  {
    key: "nogi",
    name: "No-Gi",
    desc: "Sem kimono, mais ritmo. Controle pelo corpo, não pelo tecido.",
    para: "[PREENCHER]",
    alt: "Dois atletas de rashguard disputando posição no tatame",
  },
  {
    key: "defesa",
    name: "Defesa pessoal",
    desc: "Sair de agarrões, controlar e ficar de pé. Jiu-Jitsu para a vida real.",
    para: "[PREENCHER]",
    alt: "Pessoa escapando de uma pegada no punho",
  },
  {
    key: "kids",
    name: "Kids",
    desc: "Disciplina e confiança desde cedo.",
    para: "Idades: [PREENCHER].",
    alt: "Mãos de uma criança amarrando a faixa branca com a ajuda do professor",
  },
  {
    key: "feminino",
    name: "Feminino",
    desc: "Turma só de mulheres [CONFIRMAR]. Mesmo tatame, mesma exigência técnica.",
    para: "[PREENCHER]",
    alt: "Atleta de kimono preto segurando a gola da parceira de treino",
  },
]

const pad = (n: number) => String(n).padStart(2, "0")

export function ModalitiesSection() {
  const scope = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // Painel em foco = o mais próximo do início da faixa visível. Também
  // atualiza --p (distância ao foco) de cada painel para o parallax da imagem.
  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const cards = [...el.querySelectorAll<HTMLElement>("[data-mod]")]
    const origin = el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft)
    let best = 0
    let bestDist = Infinity
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect()
      const d = (r.left - origin) / r.width
      card.style.setProperty("--p", String(Math.max(-1.5, Math.min(1.5, d))))
      if (Math.abs(d) < bestDist) {
        bestDist = Math.abs(d)
        best = i
      }
    })
    setActive(best)
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

  // Arrastar com mouse (no toque a rolagem nativa já faz isso).
  useEffect(() => {
    const el = track.current
    if (!el) return
    let startX = 0
    let startScroll = 0
    let dragging = false
    let moved = false
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      dragging = true
      moved = false
      startX = e.clientX
      startScroll = el.scrollLeft
      el.classList.add("is-dragging")
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      el.scrollLeft = startScroll - dx
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      el.classList.remove("is-dragging")
    }
    // Depois de arrastar, o clique não deve disparar links.
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
    const card = el?.querySelectorAll<HTMLElement>("[data-mod]")[Math.max(0, Math.min(MODS.length - 1, i))]
    if (!el || !card) return
    el.scrollTo({ left: card.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" })
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope.current)
        const words = SplitText.create(q("[data-mods-title]")[0], { type: "words" }).words
        gsap.from(words, {
          yPercent: 60,
          autoAlpha: 0,
          filter: "blur(10px)",
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.05,
          scrollTrigger: { trigger: scope.current, start: "top 75%" },
        })
        gsap.from(q("[data-mod]"), {
          x: 80,
          autoAlpha: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: track.current, start: "top 85%" },
        })
      })
    },
    { scope },
  )

  return (
    <section ref={scope} id="modalidades" aria-labelledby="modalidades-titulo" className="relative bg-ink py-[var(--space-section)] text-paper">
      <div className="flex flex-col gap-8 px-[var(--gutter)] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-6 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
            <span className="text-accent">04</span> — Modalidades
          </p>
          <h2
            id="modalidades-titulo"
            data-mods-title
            className="max-w-[12ch] font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"
          >
            Escolha por onde entrar.
          </h2>
        </div>

        <div className="flex items-center gap-6">
          <p className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60" aria-live="polite">
            <span className="text-paper">{pad(active + 1)}</span> / {pad(MODS.length)}
          </p>
          <div className="flex gap-2">
            {[
              { dir: -1, label: "Modalidade anterior", d: "M12 1L2 8l10 7" },
              { dir: 1, label: "Próxima modalidade", d: "M4 1l10 7-10 7" },
            ].map((b) => (
              <button
                key={b.dir}
                type="button"
                onClick={() => go(active + b.dir)}
                disabled={b.dir < 0 ? active === 0 : active === MODS.length - 1}
                aria-label={b.label}
                className="grid size-12 place-items-center rounded-full border border-paper/30 transition-colors hover:border-accent hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d={b.d} stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
            ))}
          </div>
          <p className="hidden text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/40 lg:block">Arraste ↔</p>
        </div>
      </div>

      {/* Faixa do carrossel */}
      <div
        ref={track}
        className="mods-track mt-12 flex snap-x snap-mandatory gap-[clamp(0.75rem,1.5vw,1.5rem)] overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)] pb-4 lg:mt-16"
      >
        {MODS.map((m, i) => {
          const on = i === active
          return (
            <article
              key={m.key}
              data-mod
              aria-label={m.name}
              className="relative h-[min(72svh,46rem)] w-[82vw] shrink-0 snap-start overflow-hidden bg-ink select-none sm:w-[56vw] lg:w-[34vw]"
            >
              <img
                src={`/modalidades/${m.key}.webp`}
                srcSet={`/modalidades/${m.key}-m.webp 640w, /modalidades/${m.key}.webp 1000w`}
                sizes="(max-width: 639px) 82vw, (max-width: 1023px) 56vw, 34vw"
                alt={m.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="mods-img absolute inset-0 h-full w-full object-cover"
                style={{ filter: on ? "brightness(1)" : "brightness(0.42)" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.25)_55%,rgba(0,0,0,0.92)_100%)]" />

              <span
                aria-hidden="true"
                className="mods-index absolute top-[clamp(1rem,2vw,1.75rem)] left-[clamp(1rem,2vw,1.75rem)] font-display text-[clamp(4rem,8vw,8rem)] leading-none font-extrabold"
              >
                {pad(i + 1)}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-[clamp(1.25rem,2.4vw,2.25rem)]">
                <h3 className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">{m.name}</h3>
                <div
                  className="grid transition-[grid-template-rows,opacity] duration-700 ease-[var(--ease-out)]"
                  style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}
                  aria-hidden={!on}
                >
                  <div className="overflow-hidden">
                    <p className="mt-4 max-w-[36ch] text-[length:var(--fs-body)] leading-relaxed text-paper/85">{m.desc}</p>
                    <dl className="mt-5 grid gap-2 text-sm text-paper/70">
                      <div className="flex gap-3">
                        <dt className="w-24 shrink-0 text-[length:var(--fs-label)] uppercase tracking-[0.24em] text-paper/50">Para quem</dt>
                        <dd>{m.para}</dd>
                      </div>
                      <div className="flex gap-3">
                        <dt className="w-24 shrink-0 text-[length:var(--fs-label)] uppercase tracking-[0.24em] text-paper/50">Horários</dt>
                        <dd>[PREENCHER]</dd>
                      </div>
                    </dl>
                    <a
                      href="#aula-experimental"
                      data-modalidade={m.name}
                      tabIndex={on ? 0 : -1}
                      className="group mt-6 inline-flex items-center gap-4 border border-paper/40 bg-ink/40 px-5 py-3.5 text-xs uppercase tracking-[0.18em] backdrop-blur-sm transition-colors duration-300 hover:border-accent hover:bg-accent sm:text-sm"
                    >
                      Agendar aula de {m.name}
                      <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                        <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
        {/* Respiro final para o último painel poder chegar ao início */}
        <div aria-hidden="true" className="w-[18vw] shrink-0 lg:w-[62vw]" />
      </div>
    </section>
  )
}
