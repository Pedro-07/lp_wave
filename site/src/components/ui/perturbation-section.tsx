import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap, SplitText } from "@/lib/scroll"
import symbol from "./symbol-draw.json"
import { CtaLink } from "./cta-link"

// Seção 2 — "Da perturbação à faixa preta" (SPEC.md §4, v3).
// A seção fica fixa (pin) e a rolagem avança um passo por vez, com encaixe:
// abertura → 5 motivos (um por faixa) → fecho. Cada cena entra palavra a
// palavra (sobe, ganha foco) enquanto a faixa é tingida da cor seguinte.
// As 5 cores são a mesma foto recolorida (public/faixa): o formato nunca muda.

/** Um motivo por faixa, na ordem da graduação. */
const MOTIVES = [
  "Vontade de evoluir.",
  "Superar um limite.",
  "Confiança.",
  "Pertencer.",
  "Reconstruir a autoestima.",
]

const BELTS = [
  { key: "branca", name: "Branca" },
  { key: "azul", name: "Azul" },
  { key: "roxa", name: "Roxa" },
  { key: "marrom", name: "Marrom" },
  { key: "preta", name: "Preta" },
]

/** Passos: 0 abertura, 1–5 motivos, 6 "Aqui, ela não é evitada.", 7 "É direcionada.";
 *  +0.5 de respiro antes de soltar. */
const LAST_STEP = MOTIVES.length + 2
const TOTAL = LAST_STEP + 0.5
/** Rolagem por passo, em fração da altura da tela. */
const STEP_VH = 0.7

const pad = (n: number) => String(n).padStart(2, "0")
const beltSrcSet = (key: string) => `/faixa/faixa-${key}-m.webp 1000w, /faixa/faixa-${key}.webp 2000w`
const BELT_SIZES = "(max-width: 1023px) 190vw, 106vw"
const DISPLAY = "font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"

function Belt({ layer = "all" }: { layer?: "all" | "preta" }) {
  const belts = layer === "all" ? BELTS : BELTS.slice(-1)
  return (
    <div className="relative aspect-[2657/395] w-full">
      {belts.map((b, i) => (
        <img
          key={b.key}
          data-belt-layer={layer === "all" && i > 0 ? "" : undefined}
          src={`/faixa/faixa-${b.key}.webp`}
          srcSet={beltSrcSet(b.key)}
          sizes={BELT_SIZES}
          alt={i === belts.length - 1 && layer !== "all" ? "Faixa preta com ponteira vermelha" : ""}
          loading="lazy"
          decoding="async"
          className={"absolute inset-0 h-full w-full " + (layer === "all" && i > 0 ? "belt-wipe" : "")}
        />
      ))}
    </div>
  )
}

export function PerturbationSection() {
  const scope = useRef<HTMLElement>(null)
  const [isStatic] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)

  useGSAP(
    () => {
      if (isStatic) return
      const q = gsap.utils.selector(scope.current)
      const stage = q("[data-stage]")[0]
      const layers = q("[data-belt-layer]")
      const counter = q("[data-counter]")[0]
      const beltName = q("[data-belt-name]")[0]
      const inner = q("[data-belt-inner]")

      // Palavras de cada cena (abertura, motivos, fecho). Sem máscara: nada
      // corta os acentos; o que está fora de cena fica com autoAlpha 0.
      const words = (el: Element) => SplitText.create(el, { type: "words" }).words
      const intro = q("[data-scene-intro] [data-words]").flatMap(words)
      const motives = q("[data-motive]").map(words)
      const [closingLineA, closingLineB] = q("[data-closing] [data-words]")
      const closingA = words(closingLineA)
      const closingB = words(closingLineB)
      const closing = [...closingA, ...closingB]

      const hidden = { yPercent: 60, autoAlpha: 0, filter: "blur(10px)" }
      const shown = { yPercent: 0, autoAlpha: 1, filter: "blur(0px)" }
      gsap.set([...motives.flat(), ...closing], hidden)
      gsap.set(q("[data-belt]"), { xPercent: -110, autoAlpha: 0 })
      gsap.set(q("[data-counter-row]"), { autoAlpha: 0, y: 10 })
      gsap.set(layers, { "--wipe": "100%" })

      // Abertura: entra quando a seção chega na tela. Anima os blocos (título e
      // apoio), nunca as palavras — essas são só da timeline de rolagem; se as
      // duas mexessem nas mesmas palavras, chegar direto a um passo adiante
      // (rolagem rápida, recarregar no meio) traria a abertura de volta.
      gsap.from(q("[data-scene-intro] [data-words]"), {
        autoAlpha: 0,
        yPercent: 20,
        filter: "blur(10px)",
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: stage, start: "top 70%" },
      })
      gsap.from(q("[data-rise]"), {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: q("[data-rise]")[0], start: "top 88%" },
      })

      // Pontos de encaixe: cada passo inteiro + fim.
      const points = [...Array.from({ length: LAST_STEP + 1 }, (_, i) => i / TOTAL), 1]

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => "+=" + window.innerHeight * STEP_VH * TOTAL,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // Sem inércia: o encaixe vai para o passo mais próximo na direção da
          // rolagem, em vez de projetar pela velocidade (o que pulava frases).
          snap: {
            snapTo: points,
            inertia: false,
            directional: true,
            duration: { min: 0.25, max: 0.7 },
            delay: 0.08,
            ease: "power2.inOut",
          },
        },
      })

      // Troca de cena no passo k: a anterior sai (sobe e desfoca) e a nova
      // entra palavra a palavra, tudo dentro de [k-0.55, k].
      const scenes = [intro, ...motives, closingA]
      for (let k = 1; k < scenes.length; k++) {
        const prev = scenes[k - 1]
        const next = scenes[k]
        tl.to(
          prev,
          { yPercent: -50, autoAlpha: 0, filter: "blur(8px)", duration: 0.22, stagger: 0.12 / prev.length, ease: "power2.in" },
          k - 0.55,
        )
        tl.to(next, { ...shown, duration: 0.3, stagger: 0.16 / next.length, ease: "power3.out" }, k - 0.3)
      }
      // Último passo: "Aqui, ela não é evitada." fica e apaga para o cinza; o
      // destaque passa para "É direcionada.", que entra embaixo.
      // Opacidade nas próprias palavras (não cor herdada do bloco): o Safari às
      // vezes não redesenha filhos com filter/transform quando a cor herdada muda.
      tl.to(closingA, { opacity: 0.6, duration: 0.3, ease: "power2.inOut" }, LAST_STEP - 0.5)
      tl.to(closingB, { ...shown, duration: 0.3, stagger: 0.16 / closingB.length, ease: "power3.out" }, LAST_STEP - 0.3)

      // Faixa: desliza para a cena com o 1º motivo; a cada motivo seguinte a
      // cor nova corre pelo tecido e a faixa dá um leve pulso.
      tl.to(q("[data-belt]"), { xPercent: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" }, 0.45)
      tl.to(q("[data-counter-row]"), { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.7)
      layers.forEach((layer, i) => {
        const k = i + 2 // camada 1 (azul) chega com o 2º motivo
        tl.to(layer, { "--wipe": "0%", duration: 0.5, ease: "power1.inOut" }, k - 0.55)
        tl.to(inner, { scale: 1.025, duration: 0.2, ease: "power1.out" }, k - 0.5)
        tl.to(inner, { scale: 1, duration: 0.3, ease: "power1.inOut" }, k - 0.3)
      })

      // Parallax
      tl.fromTo(inner, { xPercent: -2, rotate: -0.6 }, { xPercent: 2, rotate: 0.6, duration: TOTAL }, 0)
      tl.fromTo(q("[data-bg-symbol]"), { yPercent: 12 }, { yPercent: -12, duration: TOTAL }, 0)

      // Contador e nome da faixa
      let shownIdx = -1
      tl.eventCallback("onUpdate", () => {
        const idx = Math.min(MOTIVES.length - 1, Math.max(0, Math.floor(tl.time() + 0.3) - 1))
        if (idx === shownIdx) return
        shownIdx = idx
        counter.textContent = pad(idx + 1)
        beltName.textContent = BELTS[idx].name
      })
    },
    { scope },
  )

  return (
    <section ref={scope} id="perturbacao" aria-labelledby="perturbacao-titulo" className="relative bg-ink text-paper">
      {isStatic ? (
        <StaticVersion />
      ) : (
        <div data-stage className="relative flex h-svh flex-col overflow-hidden px-[var(--gutter)] pt-[clamp(1.5rem,6vh,4rem)]">
          {/* Contorno do símbolo ao fundo */}
          <svg
            data-bg-symbol
            aria-hidden="true"
            viewBox={symbol.viewBox}
            className="pointer-events-none absolute top-[14%] -right-[18vw] w-[110vw] opacity-[0.07] lg:-right-[8vw] lg:w-[80vw]"
          >
            <path d={symbol.black} fill="none" stroke="#fff" strokeWidth={3} vectorEffect="non-scaling-stroke" />
          </svg>

          <p className="relative text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
            <span className="text-accent">02</span> — A perturbação
          </p>

          {/* Palco: abertura, motivos e fecho ocupam o mesmo lugar, um de cada vez */}
          <div className="relative flex flex-1 items-center pb-[22vh] lg:pb-[26vh]">
            <div className="grid w-full lg:w-[min(100%,78rem)]">
              <div data-scene-intro className="col-start-1 row-start-1 self-center">
                <h2 id="perturbacao-titulo" data-words className={DISPLAY + " max-w-[13ch]"}>
                  Todo mundo chega com alguma coisa.
                </h2>
                <p data-words className="mt-6 max-w-[32ch] text-[length:var(--fs-body)] leading-relaxed text-paper/70 lg:mt-8">
                  Ninguém pisa no tatame por acaso. Cada um traz uma inquietação.
                </p>
              </div>

              <div className="col-start-1 row-start-1 self-center">
                <p
                  data-counter-row
                  aria-hidden="true"
                  className="mb-5 flex items-baseline gap-3 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"
                >
                  <span>
                    <span data-counter className="text-paper">
                      01
                    </span>{" "}
                    / {pad(MOTIVES.length)}
                  </span>
                  <span className="h-px w-8 bg-paper/30" />
                  <span>
                    Faixa <span data-belt-name>Branca</span>
                  </span>
                </p>
                <div className="grid">
                  {MOTIVES.map((m) => (
                    <p key={m} data-motive aria-hidden="true" className={DISPLAY + " col-start-1 row-start-1 max-w-[16ch]"}>
                      {m}
                    </p>
                  ))}
                  <h2 data-closing className={DISPLAY + " col-start-1 row-start-1"}>
                    <span data-words className="block">
                      Aqui, ela não é evitada.
                    </span>
                    <span data-words className="block">
                      É direcionada.
                    </span>
                  </h2>
                </div>
              </div>

              {/* Lista para leitores de tela (as frases animadas são aria-hidden) */}
              <ul className="sr-only">
                {MOTIVES.map((m, i) => (
                  <li key={m}>
                    {m} (faixa {BELTS[i].name.toLowerCase()})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Faixa */}
          <div
            data-belt
            className="pointer-events-none absolute bottom-[7vh] -left-[95vw] w-[190vw] lg:bottom-[6vh] lg:-left-[6vw] lg:w-[106vw]"
          >
            <div data-belt-inner>
              <Belt />
            </div>
          </div>
        </div>
      )}

      {/* Texto e CTA (fluxo normal, depois do pin) */}
      <div className="px-[var(--gutter)] pt-[clamp(3rem,8vw,6rem)] pb-[var(--space-section)] lg:grid lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="lg:col-span-6 lg:col-start-5">
          <p data-rise className="max-w-[46ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
            A Black Wave existe para formar faixas pretas saudáveis, com excelência técnica e caráter sólido. Gente
            preparada para gerar impacto positivo na sociedade.
          </p>
          <CtaLink data-rise href="#aula-experimental" className="mt-10">
            Agendar aula experimental
          </CtaLink>
        </div>
      </div>
    </section>
  )
}

/** Movimento reduzido: sem pin — lista estática e a faixa preta parada. */
function StaticVersion() {
  return (
    <div className="px-[var(--gutter)] pt-[var(--space-section)]">
      <p className="mb-8 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
        <span className="text-accent">02</span> — A perturbação
      </p>
      <h2 id="perturbacao-titulo" className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">
        Todo mundo chega com alguma coisa.
      </h2>
      <p className="mt-8 max-w-[30ch] text-[length:var(--fs-body)] leading-relaxed text-paper/70">
        Ninguém pisa no tatame por acaso. Cada um traz uma inquietação.
      </p>
      <ul className="mt-16">
        {MOTIVES.map((m) => (
          <li key={m} className="font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.95]">
            {m}
          </li>
        ))}
      </ul>
      <div className="-mx-[var(--gutter)] my-16 w-[calc(100%+2*var(--gutter))]">
        <Belt layer="preta" />
      </div>
      <h2 className="font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92]">
        <span className="block text-paper/60">Aqui, ela não é evitada.</span>
        <span className="block">É direcionada.</span>
      </h2>
    </div>
  )
}
