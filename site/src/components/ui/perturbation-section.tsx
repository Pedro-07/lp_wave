import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap, SplitText } from "@/lib/scroll"
import symbol from "./symbol-draw.json"
import { CtaLink } from "./cta-link"

// Seção 2 — "Da perturbação à faixa preta" (SPEC.md §4, v2).
// A seção fica fixa (pin) e a rolagem avança uma frase por vez, com encaixe
// em cada uma. Uma faixa atravessa a tela e vai sendo graduada — branca, azul,
// roxa, marrom, preta — por uma "tinta" que corre no tecido. As 5 cores são a
// mesma foto recolorida (public/faixa), então o formato nunca muda.

const MOTIVES = [
  "Vontade de evoluir.",
  "Superar um limite.",
  "Confiança.",
  "Pertencer.",
  "Saúde.",
  "Competir.",
  "Reconstruir a autoestima.",
]

const BELTS = [
  { key: "branca", name: "Branca" },
  { key: "azul", name: "Azul" },
  { key: "roxa", name: "Roxa" },
  { key: "marrom", name: "Marrom" },
  { key: "preta", name: "Preta" },
]
/** Faixa de cada motivo (índice em BELTS): progressão contínua até a preta. */
const BELT_OF_MOTIVE = [0, 0, 1, 2, 3, 3, 4]

/** Duração do roteiro, em "passos": 7 motivos + fecho + respiro final. */
const TOTAL = MOTIVES.length + 0.5
/** Rolagem por passo, em fração da altura da tela. */
const STEP_VH = 0.7

const pad = (n: number) => String(n).padStart(2, "0")
const beltSrcSet = (key: string) => `/faixa/faixa-${key}-m.webp 1000w, /faixa/faixa-${key}.webp 2000w`
const BELT_SIZES = "(max-width: 1023px) 190vw, 106vw"

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
      const motives = q("[data-motive]")
      const closingLines = q("[data-closing-line]")
      const layers = q("[data-belt-layer]")
      const counter = q("[data-counter]")[0]
      const beltName = q("[data-belt-name]")[0]

      // Entrada do cabeçalho
      for (const el of q("[data-reveal-lines]")) {
        const split = SplitText.create(el, { type: "lines", mask: "lines" })
        gsap.from(split.lines, {
          yPercent: 100,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%" },
        })
      }
      gsap.from(q("[data-rise]"), {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: q("[data-rise]")[0], start: "top 88%" },
      })

      // Estado inicial. 140% (não 100%): a janela tem folga para os acentos das
      // maiúsculas, então a frase precisa sair além dela.
      const HIDE = 140
      // Além do deslocamento, as frases fora de cena ficam invisíveis (autoAlpha 0):
      // nada da próxima frase aparece antes da rolagem chegar nela.
      gsap.set(motives.slice(1), { yPercent: HIDE, autoAlpha: 0 })
      gsap.set(closingLines, { yPercent: HIDE, autoAlpha: 0 })
      gsap.set(layers, { "--wipe": "100%" })

      // Pontos de encaixe: cada frase inteira + fecho + fim.
      const points = [...Array.from({ length: MOTIVES.length + 1 }, (_, i) => i / TOTAL), 1]

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
          // Sem inércia: o encaixe vai para a frase mais próxima na direção da
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

      // Troca de frases: a entrada de k ocupa a 2ª metade do passo [k-0.5, k].
      for (let k = 1; k < MOTIVES.length; k++) {
        tl.to(motives[k - 1], { yPercent: -HIDE, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, k - 0.5)
        tl.to(motives[k], { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power2.out" }, k - 0.45)
      }
      const last = MOTIVES.length
      tl.to(motives[last - 1], { yPercent: -HIDE, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, last - 0.5)
      tl.to(closingLines, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out", stagger: 0.05 }, last - 0.45)

      // Graduação: cada camada de cor "tinge" a faixa no passo em que aparece.
      layers.forEach((layer, i) => {
        const k = BELT_OF_MOTIVE.indexOf(i + 1)
        tl.to(layer, { "--wipe": "0%", duration: 0.6, ease: "power1.inOut" }, k - 0.6)
      })

      // Parallax
      tl.fromTo(q("[data-belt]"), { xPercent: -2, rotate: -0.6 }, { xPercent: 2, rotate: 0.6, duration: TOTAL }, 0)
      tl.fromTo(q("[data-bg-symbol]"), { yPercent: 12 }, { yPercent: -12, duration: TOTAL }, 0)
      tl.fromTo(q("[data-motive-stage]"), { y: 20 }, { y: -20, duration: TOTAL }, 0)

      // Contador e nome da faixa
      let shown = -1
      tl.eventCallback("onUpdate", () => {
        const idx = Math.min(MOTIVES.length - 1, Math.max(0, Math.floor(tl.time() + 0.25)))
        if (idx === shown) return
        shown = idx
        counter.textContent = pad(idx + 1)
        beltName.textContent = BELTS[BELT_OF_MOTIVE[idx]].name
      })
    },
    { scope },
  )

  return (
    <section ref={scope} id="perturbacao" aria-labelledby="perturbacao-titulo" className="relative bg-ink text-paper">
      {isStatic ? (
        <StaticVersion />
      ) : (
        <div data-stage className="relative h-svh overflow-hidden">
          {/* Contorno do símbolo ao fundo */}
          <svg
            data-bg-symbol
            aria-hidden="true"
            viewBox={symbol.viewBox}
            className="pointer-events-none absolute top-[14%] -right-[18vw] w-[110vw] opacity-[0.07] lg:-right-[8vw] lg:w-[80vw]"
          >
            <path d={symbol.black} fill="none" stroke="#fff" strokeWidth={3} vectorEffect="non-scaling-stroke" />
          </svg>

          <div className="relative flex h-full flex-col px-[var(--gutter)] pt-[clamp(5rem,12vh,8rem)] lg:grid lg:grid-cols-12 lg:gap-x-[var(--gutter)] lg:pt-0">
            {/* Cabeçalho */}
            <header className="lg:col-span-4 lg:self-center lg:pb-[22vh]">
              <p className="mb-6 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60 lg:mb-8">
                <span className="text-accent">02</span> — A perturbação
              </p>
              <h2
                id="perturbacao-titulo"
                data-reveal-lines
                className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em]"
              >
                Todo mundo chega com alguma coisa.
              </h2>
              <p data-reveal-lines className="mt-5 max-w-[30ch] text-[length:var(--fs-body)] leading-relaxed text-paper/70 lg:mt-8">
                Ninguém pisa no tatame por acaso. Cada um traz uma inquietação.
              </p>
            </header>

            {/* Frases */}
            <div className="mt-[8vh] lg:col-span-8 lg:mt-0 lg:self-center lg:pb-[22vh]">
              <p className="mb-5 flex items-baseline gap-3 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60" aria-hidden="true">
                <span>
                  <span data-counter className="text-paper">01</span> / {pad(MOTIVES.length)}
                </span>
                <span className="h-px w-8 bg-paper/30" />
                <span>
                  Faixa <span data-belt-name>Branca</span>
                </span>
              </p>
              {/* Cada frase fica numa "janela" (overflow-hidden) com folga de
                  0.25em em cima e 0.15em embaixo — compensada por margem negativa —
                  para os acentos das maiúsculas (É, Ú, Ã) não serem cortados. */}
              <div
                data-motive-stage
                className="grid font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"
              >
                {MOTIVES.map((m) => (
                  <p key={m} className="col-start-1 row-start-1 -mt-[0.25em] -mb-[0.15em] overflow-hidden pt-[0.25em] pb-[0.15em]">
                    {/* h-full: a frase ocupa a janela toda (altura do maior item),
                        então o deslocamento a tira inteira da máscara. */}
                    <span data-motive className="block h-full">
                      {m}
                    </span>
                  </p>
                ))}
                <h2 className="col-start-1 row-start-1">
                  <span className="-mt-[0.25em] -mb-[0.15em] block overflow-hidden pt-[0.25em] pb-[0.15em]">
                    <span data-closing-line className="block text-paper/40">
                      Aqui, ela não é evitada.
                    </span>
                  </span>
                  <span className="-mt-[0.25em] -mb-[0.15em] block overflow-hidden pt-[0.25em] pb-[0.15em]">
                    <span data-closing-line className="block">
                      É direcionada.
                    </span>
                  </span>
                </h2>
              </div>
              {/* Lista completa para leitores de tela */}
              <ul className="sr-only">
                {MOTIVES.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Faixa */}
          <div
            data-belt
            className="pointer-events-none absolute bottom-[7vh] -left-[95vw] w-[190vw] lg:bottom-[6vh] lg:-left-[6vw] lg:w-[106vw]"
          >
            <Belt />
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
        <span className="block text-paper/40">Aqui, ela não é evitada.</span>
        <span className="block">É direcionada.</span>
      </h2>
    </div>
  )
}
