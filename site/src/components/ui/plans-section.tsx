import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { useIdleReady } from "@/lib/idle"
import { gsap } from "@/lib/scroll"
import { whatsappLink } from "@/config"
import { CtaLink } from "./cta-link"
import { WhatsappIcon } from "./whatsapp-icon"

// Seção 5 — Planos (logo depois das turmas: escolhe a turma, depois o plano) (cliente, 2026-10-28: "Inauguração 2026"). Quatro planos;
// o Fundador (Founders Club, 30 vagas) em destaque. Cada plano abre o WhatsApp
// com o plano escolhido na mensagem. Economia sempre em relação ao mensal.

interface Plano {
  nome: string
  tier: string
  preco: number
  total?: string
  economia?: string
  selo?: string
  destaque?: boolean
  beneficios: string[]
}

const PLANOS: Plano[] = [
  {
    nome: "Mensal",
    tier: "Essential",
    preco: 220,
    selo: "Sem fidelidade",
    beneficios: [
      "Acesso às aulas da modalidade",
      "Avaliação inicial Wave Profile",
      "Acompanhamento técnico nas aulas",
      "Comunidade Black Wave",
      "Eventos internos abertos aos alunos",
    ],
  },
  {
    nome: "Semestral",
    tier: "Evolution",
    preco: 205,
    total: "R$ 1.230 em 6 meses",
    economia: "R$ 90",
    beneficios: [
      "Tudo do plano Essential",
      "10% off em produtos selecionados da loja",
      "10% off em seminários e workshops",
      "Avaliação de evolução a cada 3 meses",
      "Prioridade em eventos com vagas limitadas",
    ],
  },
  {
    nome: "Anual",
    tier: "Experience",
    preco: 190,
    total: "R$ 2.280 em 12 meses",
    economia: "R$ 360",
    selo: "Melhor custo-benefício",
    beneficios: [
      "Tudo do plano Essential",
      "15% off em produtos selecionados da loja",
      "15% off em seminários e workshops",
      "3 aulas individuais de acompanhamento técnico",
      "Avaliação trimestral e presente de aniversário",
    ],
  },
  {
    nome: "Fundador",
    tier: "Founders Club",
    preco: 170,
    total: "R$ 2.040 em 12 meses",
    economia: "R$ 600",
    selo: "Apenas 30 vagas",
    destaque: true,
    beneficios: [
      "Tudo do plano Essential",
      "Desconto especial na matrícula",
      "Condições no primeiro kimono Black Wave",
      "Desconto em rash guards e equipamentos No-Gi",
      "Camiseta exclusiva e certificado de fundador",
      "Acesso antecipado a lançamentos da marca",
    ],
  },
]

export function PlansSection() {
  const scope = useRef<HTMLElement>(null)
  /** Monta as animações num momento ocioso (ver lib/idle.ts). */
  const idleReady = useIdleReady()

  useGSAP(
    () => {
      if (!idleReady) return
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope.current)
        gsap.from(q("[data-plans-rise]"), {
          y: 24,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: scope.current, start: "top 70%" },
        })
        gsap.from(q("[data-plan]"), {
          y: 48,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: q("[data-plans-grid]")[0], start: "top 85%" },
        })
      })
    },
    { scope, dependencies: [idleReady] },
  )

  const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"

  return (
    <section
      ref={scope}
      id="planos"
      aria-labelledby="planos-titulo"
      className="relative border-t border-paper/10 bg-ink px-[var(--gutter)] py-[var(--space-section)] text-paper"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p data-plans-rise className={label + " mb-4 lg:mb-6"}>
            <span className="text-accent">05</span> — Planos · Inauguração 2026
          </p>
          <h2
            id="planos-titulo"
            data-plans-rise
            className="max-w-[14ch] font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95] tracking-[-0.01em]"
          >
            Escolha o seu ritmo.
          </h2>
        </div>
        <p data-plans-rise className="max-w-[38ch] text-[length:var(--fs-body)] leading-relaxed text-paper/70">
          Os 30 primeiros alunos entram para a história da Black Wave: o plano Fundador só existe na inauguração.
        </p>
      </div>

      <ul data-plans-grid className="mt-[clamp(2.5rem,6vw,4.5rem)] grid gap-[clamp(0.75rem,1.5vw,1.25rem)] sm:grid-cols-2 xl:grid-cols-4">
        {PLANOS.map((p) => (
          <li
            key={p.nome}
            data-plan
            className={
              "relative flex flex-col border p-[clamp(1.25rem,2vw,1.75rem)] " +
              (p.destaque ? "border-accent bg-accent/[0.12]" : "border-paper/12 bg-paper/[0.03]")
            }
          >
            {p.destaque && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />}
            {/* Selo numa linha própria, acima do nome: em 4 colunas não cabe ao lado */}
            <p className="flex h-7 items-start">
              {p.selo && (
                <span
                  className={
                    "px-2.5 py-1.5 text-[0.65rem] uppercase leading-none tracking-[0.16em] " +
                    (p.destaque ? "bg-accent text-paper" : "border border-paper/30 text-paper/80")
                  }
                >
                  {p.selo}
                </span>
              )}
            </p>
            <h3 className="mt-4 font-display text-[clamp(1.75rem,2.6vw,2.4rem)] font-extrabold uppercase leading-none">{p.nome}</h3>
            <p className="mt-2 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">{p.tier}</p>

            <p className="mt-8 flex items-baseline gap-1.5">
              <span className="text-sm text-paper/60">R$</span>
              <span className="font-display text-[clamp(3.25rem,5vw,4.5rem)] font-extrabold leading-none">{p.preco}</span>
              <span className="text-sm text-paper/60">/mês</span>
            </p>
            <p className="mt-2 min-h-[1.5em] text-sm text-paper/60">{p.total ?? "Contratação mensal, com flexibilidade"}</p>
            <p className="mt-1 min-h-[1.5em] text-sm">
              {p.economia ? (
                <>
                  Você economiza <strong className={p.destaque ? "text-paper" : "text-accent"}>{p.economia}</strong>
                </>
              ) : (
                <span className="text-paper/40">—</span>
              )}
            </p>

            <ul className="mt-6 mb-8 grid gap-2.5 border-t border-paper/10 pt-6 text-sm leading-snug text-paper/80">
              {p.beneficios.map((b) => (
                <li key={b} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.6em] h-px w-3 shrink-0 bg-accent" />
                  {b}
                </li>
              ))}
            </ul>

            <a
              href={whatsappLink(`Olá, Black Wave! Tenho interesse no plano ${p.nome} (${p.tier}), R$ ${p.preco}/mês.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={
                "mt-auto flex w-full items-center justify-between gap-3 whitespace-nowrap px-5 py-4 text-xs uppercase tracking-[0.16em] transition-colors duration-300 sm:text-sm " +
                (p.destaque ? "bg-paper text-ink hover:bg-accent hover:text-paper" : "border border-paper/40 hover:border-accent hover:bg-accent")
              }
            >
              {p.destaque ? "Garantir minha vaga" : "Quero este plano"}
              <WhatsappIcon size={18} />
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-[clamp(1.75rem,4vw,3rem)] flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-paper/50">Economia calculada em relação ao plano mensal (R$ 220).</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-sm text-paper/60">Ainda não treinou com a gente?</p>
          <CtaLink href="#aula-experimental">Agendar aula experimental</CtaLink>
        </div>
      </div>
    </section>
  )
}
