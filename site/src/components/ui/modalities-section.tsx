import { useCallback, useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { useIdleReady } from "@/lib/idle"
import { gsap, ScrollTrigger, scrollToY, SplitText } from "@/lib/scroll"
import type { Modalidade } from "@/config"
import { CtaLink } from "./cta-link"

// Seção 4 — Modalidades (SPEC.md §4). A seção fica fixa (pin) e a rolagem
// vertical move o carrossel para o lado; rolar/arrastar para o lado também
// funciona e leva a página junto — as duas entradas ficam sincronizadas pela
// posição horizontal da faixa (scrollLeft). Encaixe em cada painel. O painel
// em foco acende e mostra detalhes + CTA (abre a gaveta com a modalidade).

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
  /** Monta as animações num momento ocioso (ver lib/idle.ts). */
  const idleReady = useIdleReady()
  const track = useRef<HTMLDivElement>(null)
  const pin = useRef<ScrollTrigger | null>(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  activeRef.current = active
  /** true enquanto a pessoa arrasta a faixa (o encaixe espera ela soltar). */
  const dragging = useRef(false)
  const [isStatic] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)

  const maxScroll = () => {
    const el = track.current
    return el ? Math.max(1, el.scrollWidth - el.clientWidth) : 1
  }

  /** Posição (0–1) da faixa em que cada painel fica no início da área visível. */
  const stops = useCallback(() => {
    const el = track.current
    if (!el) return [0]
    const padLeft = parseFloat(getComputedStyle(el).paddingLeft)
    const max = maxScroll()
    return [...el.querySelectorAll<HTMLElement>("[data-mod]")].map((c) => Math.min(1, (c.offsetLeft - padLeft) / max))
  }, [])

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
      // Movimento lateral feito pela pessoa (trackpad, dedo, arraste) leva a
      // página junto. Se a faixa está onde a rolagem vertical a colocou, o
      // evento é eco do próprio sincronismo e é ignorado (comparar posições é
      // mais confiável que um sinal de tempo com a rolagem suave do Lenis).
      const st = pin.current
      if (st && !dragging.current) {
        const expected = st.progress * maxScroll()
        if (Math.abs(el.scrollLeft - expected) > 2) {
          scrollToY(st.start + (el.scrollLeft / maxScroll()) * (st.end - st.start))
        }
      }
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

  // Arrastar para o lado, com o dedo ou o mouse. Durante o gesto só a faixa
  // se move (leve, acompanha o dedo sem atraso); ao soltar ela desliza até o
  // painel seguinte/anterior — pela distância ou pela velocidade do gesto — e
  // só então a página é posta na posição correspondente, uma vez.
  // Gesto mais vertical que horizontal = rolagem normal da página.
  useEffect(() => {
    const el = track.current
    if (!el) return
    let state: "idle" | "pending" | "drag" = "idle"
    let pointer = -1
    let startX = 0
    let startY = 0
    let startLeft = 0
    let startActive = 0
    let lastX = 0
    let lastT = 0
    let velocity = 0
    let moved = false
    let settle: gsap.core.Tween | null = null

    const clampLeft = (x: number) => Math.max(0, Math.min(maxScroll(), x))
    /** Página na posição que corresponde à faixa (sem animar). */
    const syncPage = () => {
      const st = pin.current
      if (st) scrollToY(st.start + (el.scrollLeft / maxScroll()) * (st.end - st.start))
    }
    const release = () => {
      state = "idle"
      el.classList.remove("is-dragging")
    }
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return
      // Tocou de novo enquanto a faixa ainda deslizava: para onde está.
      if (settle?.isActive()) {
        settle.kill()
        syncPage()
        dragging.current = false
      }
      state = "pending"
      pointer = e.pointerId
      moved = false
      startX = lastX = e.clientX
      startY = e.clientY
      lastT = e.timeStamp
      velocity = 0
      startLeft = el.scrollLeft
      startActive = activeRef.current
    }
    const move = (e: PointerEvent) => {
      if (state === "idle" || e.pointerId !== pointer) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (state === "pending") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx)) {
          state = "idle"
          return
        }
        state = "drag"
        moved = true
        dragging.current = true
        el.classList.add("is-dragging")
      }
      const dt = e.timeStamp - lastT
      if (dt > 0) velocity = 0.8 * ((e.clientX - lastX) / dt) + 0.2 * velocity
      lastX = e.clientX
      lastT = e.timeStamp
      el.scrollLeft = clampLeft(startLeft - dx)
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      const wasDrag = state === "drag"
      release()
      if (!wasDrag) return
      const dx = e.clientX - startX
      // Arraste longo ou gesto rápido (px/ms) troca de painel; curto e lento volta.
      const limit = Math.min(60, el.clientWidth * 0.1)
      const dir = dx < -limit || velocity < -0.35 ? 1 : dx > limit || velocity > 0.35 ? -1 : 0
      const target = Math.max(0, Math.min(MODS.length - 1, startActive + dir))
      settle = gsap.to(el, {
        scrollLeft: stops()[target] * maxScroll(),
        duration: 0.45,
        ease: "power3.out",
        onComplete: () => {
          syncPage()
          requestAnimationFrame(() => (dragging.current = false))
        },
      })
    }
    const cancel = () => {
      if (state === "drag") {
        syncPage()
        dragging.current = false
      }
      release()
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
    window.addEventListener("pointercancel", cancel)
    el.addEventListener("click", click, true)
    return () => {
      settle?.kill()
      el.removeEventListener("pointerdown", down)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", cancel)
      el.removeEventListener("click", click, true)
    }
  }, [stops])

  const go = (i: number) => {
    const target = stops()[Math.max(0, Math.min(MODS.length - 1, i))]
    const st = pin.current
    if (st) {
      scrollToY(st.start + target * (st.end - st.start), false)
    } else {
      track.current?.scrollTo({ left: target * maxScroll(), behavior: "smooth" })
    }
  }
  const goRef = useRef(go)
  goRef.current = go

  useGSAP(
    () => {
      if (!idleReady) return
      if (isStatic) return
      const q = gsap.utils.selector(scope.current)
      const el = track.current!

      const words = SplitText.create(q("[data-mods-title]")[0], { type: "words", aria: "none" }).words
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
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 90%" },
      })

      // Rolagem vertical → faixa horizontal.
      pin.current = ScrollTrigger.create({
        trigger: q("[data-mods-stage]")[0],
        start: "top top",
        end: () => "+=" + maxScroll(),
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Durante o arraste quem manda na faixa é o dedo.
          if (!dragging.current) el.scrollLeft = self.progress * maxScroll()
        },
        snap: {
          // Painéis + o fim (painel "Ainda em dúvida?" e saída da seção).
          snapTo: (value) => (dragging.current ? value : gsap.utils.snap([...stops(), 1], value)),
          inertia: false,
          delay: 0.1,
          duration: { min: 0.25, max: 0.6 },
          ease: "power2.inOut",
        },
      })
      return () => {
        pin.current = null
      }
    },
    { scope, dependencies: [idleReady] },
  )

  return (
    <section ref={scope} id="modalidades" aria-labelledby="modalidades-titulo" className="relative bg-ink text-paper">
      <div
        data-mods-stage
        className={
          "flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)] " +
          (isStatic ? "py-[var(--space-section)]" : "h-svh pt-[clamp(1.5rem,5vh,3.5rem)] pb-[clamp(1rem,3vh,2rem)]")
        }
      >
        <div className="flex flex-col gap-6 px-[var(--gutter)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60 lg:mb-6">
              <span className="text-accent">04</span> — Modalidades
            </p>
            <h2
              id="modalidades-titulo"
              data-mods-title
              className="max-w-[14ch] font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em] lg:text-[clamp(2.5rem,5.5vw,6rem)]"
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
            <p className="hidden text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60 lg:block">Role ou arraste ↔</p>
            <p className="text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60 lg:hidden" aria-hidden="true">
              Arraste ↔
            </p>
          </div>
        </div>

        {/* Faixa do carrossel */}
        <div
          ref={track}
          className={
            "mods-track flex gap-[clamp(0.75rem,1.5vw,1.5rem)] overflow-x-auto px-[var(--gutter)] " +
            (isStatic ? "snap-x snap-mandatory scroll-px-[var(--gutter)]" : "")
          }
        >
          {MODS.map((m, i) => {
            const on = i === active
            return (
              <article
                key={m.key}
                data-mod
                aria-label={m.name}
                className="relative h-[min(60svh,42rem)] w-[82vw] shrink-0 snap-start overflow-hidden bg-ink select-none sm:w-[56vw] lg:w-[34vw]"
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

          {/* Fecho da faixa: dá espaço para o último painel chegar ao início */}
          <div className="flex w-[calc(100vw-2*var(--gutter))] shrink-0 snap-start max-lg:ml-[var(--gutter)] flex-col justify-end gap-6 pb-[clamp(1.25rem,2.4vw,2.25rem)] lg:w-[62vw] lg:pl-[4vw]">
            <p className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">Ainda em dúvida?</p>
            <p className="max-w-[34ch] text-[length:var(--fs-body)] leading-relaxed text-paper/70">
              Comece pela aula experimental. A gente te ajuda a escolher.
            </p>
            <CtaLink href="#aula-experimental" className="self-start">
              Agendar aula experimental
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  )
}
