import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { whatsappLink } from "@/config"
import { WhatsappIcon } from "./whatsapp-icon"

// Página /wave-profile (cliente, 2026-10-28: "WAVE PROFILE - BLACK WAVE.txt").
// Avaliação inicial do aluno, em etapas: seções 01–05 da ficha + termo. A seção
// 06 (acompanhamento técnico) é do professor e fica fora do site. O envio monta
// a mensagem e abre o WhatsApp — nada é salvo aqui (há dados de saúde).
// O agendamento da aula continua curto; a equipe manda este link depois.

type Campo =
  | { id: string; tipo: "text" | "date" | "tel"; label: string; obrigatorio?: boolean; auto?: string }
  | { id: string; tipo: "textarea"; label: string }
  | { id: string; tipo: "radio"; label: string; opcoes: string[] }
  | { id: string; tipo: "checks"; label: string; opcoes: string[]; outro?: boolean }
  | { id: string; tipo: "simnao"; label: string }

interface Etapa {
  n: string
  titulo: string
  campos: Campo[]
}

const ETAPAS: Etapa[] = [
  {
    n: "01",
    titulo: "Identificação",
    campos: [
      { id: "nome", tipo: "text", label: "Nome completo", obrigatorio: true, auto: "name" },
      { id: "nascimento", tipo: "date", label: "Data de nascimento", auto: "bday" },
      { id: "whatsapp", tipo: "tel", label: "WhatsApp", auto: "tel" },
      { id: "profissao", tipo: "text", label: "Profissão", auto: "organization-title" },
    ],
  },
  {
    n: "02",
    titulo: "Histórico esportivo",
    campos: [
      {
        id: "artes",
        tipo: "checks",
        label: "Já praticou alguma arte marcial?",
        opcoes: ["Nunca pratiquei", "Jiu-jitsu", "Judô", "Muay Thai", "Boxe"],
        outro: true,
      },
      { id: "atividade", tipo: "radio", label: "Pratica atividade física atualmente?", opcoes: ["Sim", "Não", "Ocasionalmente"] },
      { id: "condicionamento", tipo: "radio", label: "Como você avalia seu condicionamento físico atual?", opcoes: ["Iniciante", "Intermediário", "Avançado"] },
      { id: "experiencia", tipo: "textarea", label: "Conte um pouco sobre sua experiência esportiva" },
    ],
  },
  {
    n: "03",
    titulo: "Saúde e limitações",
    campos: [
      { id: "lesao", tipo: "simnao", label: "Possui alguma lesão ou limitação física?" },
      { id: "cirurgia", tipo: "simnao", label: "Já realizou alguma cirurgia?" },
      { id: "condicao", tipo: "textarea", label: "Possui alguma condição de saúde ou recomendação médica relevante para a prática de exercícios?" },
      { id: "cuidado", tipo: "textarea", label: "Existe algum cuidado específico que o professor deve conhecer?" },
    ],
  },
  {
    n: "04",
    titulo: "Objetivos pessoais",
    campos: [
      {
        id: "objetivo",
        tipo: "checks",
        label: "Qual é seu principal objetivo no jiu-jitsu?",
        opcoes: [
          "Defesa pessoal",
          "Condicionamento físico",
          "Qualidade de vida",
          "Competição",
          "Desenvolvimento técnico",
          "Disciplina e autoconfiança",
          "Socialização",
        ],
        outro: true,
      },
      { id: "seis-meses", tipo: "textarea", label: "O que você espera alcançar nos próximos seis meses?" },
      { id: "porque", tipo: "textarea", label: "Por que decidiu começar ou continuar no jiu-jitsu?" },
    ],
  },
  {
    n: "05",
    titulo: "Perfil de aprendizagem",
    campos: [
      {
        id: "preocupacoes",
        tipo: "checks",
        label: "O que mais preocupa você em relação à prática do jiu-jitsu?",
        opcoes: [
          "Não conseguir acompanhar a turma",
          "Falta de condicionamento físico",
          "Risco de lesões",
          "Contato físico",
          "Falta de experiência",
          "Insegurança ou ansiedade",
          "Não tenho preocupações específicas",
        ],
        outro: true,
      },
      {
        id: "orientacao",
        tipo: "checks",
        label: "Como você prefere receber orientações?",
        opcoes: ["Demonstração prática", "Explicação verbal", "Repetição acompanhada", "Feedback individual"],
      },
      { id: "dificuldade", tipo: "textarea", label: "Existe alguma dificuldade, insegurança ou necessidade que gostaria de compartilhar com o professor?" },
      { id: "expectativas", tipo: "textarea", label: "Quais são suas expectativas em relação à equipe Black Wave?" },
    ],
  },
]

const TERMO = [
  "Declaro que as informações fornecidas são verdadeiras e que me comprometo a comunicar à equipe quaisquer alterações relevantes relacionadas à minha saúde ou às minhas limitações para a prática esportiva.",
  "Estou ciente de que meus dados serão utilizados para avaliação inicial, segurança durante as atividades e acompanhamento da minha evolução na Black Wave Jiu-Jitsu Team, conforme a política de privacidade da equipe.",
]
const ACEITES = [
  { id: "li", label: "Confirmo que li e compreendi as informações acima." },
  { id: "autorizo", label: "Autorizo o tratamento dos meus dados pessoais para as finalidades informadas." },
]

type Respostas = Record<string, string | string[]>

const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"
const input =
  "mt-3 block w-full border-b border-paper/25 bg-transparent pb-3 text-[length:var(--fs-body)] text-paper outline-none transition-colors placeholder:text-paper/30 focus:border-accent focus-visible:outline-none [color-scheme:dark]"
const chip = (active: boolean) =>
  "border px-4 py-2.5 text-left text-sm transition-colors duration-300 " +
  (active ? "border-paper bg-paper text-ink" : "border-paper/25 text-paper/80 hover:border-paper/60")

const hoje = () => new Date().toLocaleDateString("pt-BR")

function idade(nascimento: string) {
  const d = new Date(nascimento + "T00:00:00")
  if (Number.isNaN(d.getTime())) return
  const now = new Date()
  let anos = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) anos--
  return anos >= 0 && anos < 120 ? anos : undefined
}

/** Texto de uma resposta para a mensagem (vazio = pergunta fica de fora). */
function textoResposta(c: Campo, r: Respostas) {
  const v = r[c.id]
  if (c.tipo === "checks") {
    const lista = [...((v as string[] | undefined) ?? [])]
    const outro = String(r[c.id + "-outro"] ?? "").trim()
    if (outro) lista.push(`Outro: ${outro}`)
    return lista.join(", ")
  }
  if (c.tipo === "simnao") {
    if (v !== "Sim") return v ? String(v) : ""
    const qual = String(r[c.id + "-qual"] ?? "").trim()
    return qual ? `Sim. ${qual}` : "Sim"
  }
  if (c.tipo === "date" && v) {
    const anos = idade(String(v))
    return String(v).split("-").reverse().join("/") + (anos !== undefined ? ` (${anos} anos)` : "")
  }
  return String(v ?? "").trim()
}

function montarMensagem(r: Respostas) {
  const linhas = ["*WAVE PROFILE · Black Wave*", "Avaliação inicial", ""]
  for (const e of ETAPAS) {
    const itens = e.campos.flatMap((c) => {
      const t = textoResposta(c, r)
      return t ? [`${c.label.replace(/\?$/, "")}: ${t}`] : []
    })
    if (!itens.length) continue
    linhas.push(`*${e.n}. ${e.titulo}*`, ...itens, "")
  }
  linhas.push("*Termo de ciência e privacidade*", "Li e compreendi as informações: sim", "Autorizo o tratamento dos meus dados: sim", `Data: ${hoje()}`)
  return linhas.join("\n")
}

export function WaveProfilePage() {
  const scope = useRef<HTMLElement>(null)
  const topo = useRef<HTMLDivElement>(null)
  const [passo, setPasso] = useState(0)
  const [r, setR] = useState<Respostas>({})
  const [erro, setErro] = useState<string>()
  const [enviado, setEnviado] = useState(false)
  const total = ETAPAS.length + 1
  const noTermo = passo === ETAPAS.length

  useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-rise]", { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 })
    },
    { scope },
  )

  // Ao trocar de etapa, volta para o início do formulário (no celular a etapa anterior era longa).
  const primeira = useRef(true)
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    topo.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })
    topo.current?.focus({ preventScroll: true })
  }, [passo, enviado])

  const set = (id: string, v: string | string[]) => setR((prev) => ({ ...prev, [id]: v }))
  const toggle = (id: string, op: string) => {
    const atual = (r[id] as string[] | undefined) ?? []
    set(id, atual.includes(op) ? atual.filter((x) => x !== op) : [...atual, op])
  }

  const avancar = () => {
    if (passo === 0 && String(r.nome ?? "").trim().length < 3) {
      setErro("Escreva seu nome completo para continuar.")
      return
    }
    setErro(undefined)
    setPasso((p) => Math.min(p + 1, ETAPAS.length))
  }

  const enviar = () => {
    if (!ACEITES.every((a) => r[a.id] === "sim")) {
      setErro("Para enviar, marque as duas confirmações.")
      return
    }
    setErro(undefined)
    window.open(whatsappLink(montarMensagem(r)), "_blank", "noopener")
    setEnviado(true)
  }

  const etapa = ETAPAS[passo]

  return (
    <main ref={scope} className="grain min-h-svh bg-ink px-[var(--gutter)] pt-[clamp(1.5rem,4vw,3rem)] pb-[var(--space-section)] text-paper">
      <header className="flex items-center justify-between">
        <a href="/" aria-label="Black Wave — voltar ao site">
          <img src="/brand/naming-white.webp" alt="Black Wave" width={1400} height={158} className="h-auto w-[clamp(8rem,14vw,11rem)]" />
        </a>
        <a href="/" className={label + " transition-colors hover:text-paper"}>
          ← Voltar ao site
        </a>
      </header>

      <div className="mx-auto mt-[clamp(4rem,10vw,8rem)] grid max-w-[80rem] gap-12 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="lg:col-span-5">
          <p data-rise className={label + " mb-6"}>
            <span className="text-accent">—</span> Wave Profile
          </p>
          <h1 data-rise className="font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]">
            Seu ponto de partida.
          </h1>
          <p data-rise className="mt-6 text-sm uppercase tracking-[0.24em] text-paper/60">
            Avaliação inicial · Perfil do aluno · Evolução técnica
          </p>
          <p data-rise className="mt-8 max-w-[40ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
            Leva uns 5 minutos. Com ela, o professor conhece seu histórico, seus objetivos e os cuidados que você precisa antes da
            primeira aula.
          </p>
          <p data-rise className="mt-6 max-w-[40ch] text-sm leading-relaxed text-paper/50">
            Só o nome é obrigatório. Ao final, suas respostas vão para a equipe pelo WhatsApp; nada fica salvo neste site.
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div ref={topo} tabIndex={-1} className="scroll-mt-8 outline-none" data-rise>
            {enviado ? (
              <div className="flex flex-col gap-6">
                <h2 className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">Quase lá.</h2>
                <p className="max-w-[40ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
                  Sua ficha foi aberta no WhatsApp. É só enviar a mensagem para a equipe.
                </p>
                <p className="max-w-[40ch] text-sm leading-relaxed text-paper/50">O WhatsApp não abriu? Toque no botão abaixo.</p>
                <a
                  href={whatsappLink(montarMensagem(r))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 self-start border border-paper/40 px-6 py-4 text-sm uppercase tracking-[0.2em] transition-colors hover:border-accent hover:bg-accent"
                >
                  Abrir de novo
                  <WhatsappIcon size={18} />
                </a>
              </div>
            ) : (
              <>
                {/* Progresso */}
                <div className="flex items-center justify-between">
                  <p className={label} aria-live="polite">
                    <span className="text-paper">{String(passo + 1).padStart(2, "0")}</span> / {String(total).padStart(2, "0")}
                  </p>
                  <p className={label}>{noTermo ? "Termo" : etapa.titulo}</p>
                </div>
                <div className="mt-4 h-px w-full bg-paper/15" aria-hidden="true">
                  <div className="h-px bg-accent transition-[width] duration-500" style={{ width: `${((passo + 1) / total) * 100}%` }} />
                </div>

                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (noTermo) enviar()
                    else avancar()
                  }}
                  className="mt-10 flex flex-col gap-10"
                >
                  <h2 className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">
                    {noTermo ? (
                      "Termo de ciência e privacidade"
                    ) : (
                      <>
                        <span className="text-accent">{etapa.n}.</span> {etapa.titulo}
                      </>
                    )}
                  </h2>

                  {noTermo ? (
                    <Termo r={r} set={set} />
                  ) : (
                    etapa.campos.map((c) => <CampoView key={c.id} c={c} r={r} set={set} toggle={toggle} erro={c.id === "nome" ? erro : undefined} />)
                  )}

                  {erro && noTermo && <p className="-mt-4 text-sm text-accent">{erro}</p>}

                  <div className="flex flex-wrap items-center gap-4">
                    {passo > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setErro(undefined)
                          setPasso((p) => p - 1)
                        }}
                        className="border border-paper/30 px-6 py-4 text-sm uppercase tracking-[0.2em] text-paper/80 transition-colors hover:border-paper hover:text-paper"
                      >
                        Voltar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="group inline-flex flex-1 items-center justify-between gap-4 bg-paper px-7 py-4 text-sm uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:bg-accent hover:text-paper sm:flex-none sm:tracking-[0.24em]"
                    >
                      {noTermo ? "Enviar pelo WhatsApp" : "Continuar"}
                      {noTermo ? (
                        <WhatsappIcon size={20} />
                      ) : (
                        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                          <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-[clamp(4rem,10vw,8rem)] max-w-[80rem] text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/40">
        Black Wave Jiu-Jitsu Team · Disciplina. Evolução. Constância.
      </p>
    </main>
  )
}

function CampoView({
  c,
  r,
  set,
  toggle,
  erro,
}: {
  c: Campo
  r: Respostas
  set: (id: string, v: string | string[]) => void
  toggle: (id: string, op: string) => void
  erro?: string
}) {
  if (c.tipo === "text" || c.tipo === "date" || c.tipo === "tel") {
    return (
      <label className="block">
        <span className={label}>
          {c.label}
          {c.obrigatorio ? <span className="text-accent"> *</span> : null}
        </span>
        <input
          type={c.tipo}
          name={c.id}
          autoComplete={c.auto}
          inputMode={c.tipo === "tel" ? "tel" : undefined}
          value={String(r[c.id] ?? "")}
          onChange={(e) => set(c.id, e.target.value)}
          aria-invalid={erro ? true : undefined}
          className={input}
          placeholder={c.tipo === "tel" ? "(98) 9 0000-0000" : "—"}
        />
        {erro && <span className="mt-2 block text-sm text-accent">{erro}</span>}
      </label>
    )
  }

  if (c.tipo === "textarea") {
    return (
      <label className="block">
        <span className="block text-[length:var(--fs-body)] leading-snug text-paper/90">{c.label}</span>
        <textarea
          name={c.id}
          rows={3}
          maxLength={600}
          value={String(r[c.id] ?? "")}
          onChange={(e) => set(c.id, e.target.value)}
          className={input + " resize-y"}
          placeholder="Opcional"
        />
      </label>
    )
  }

  if (c.tipo === "radio" || c.tipo === "simnao") {
    const opcoes = c.tipo === "radio" ? c.opcoes : ["Não", "Sim"]
    return (
      <fieldset>
        <legend className="text-[length:var(--fs-body)] leading-snug text-paper/90">{c.label}</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {opcoes.map((op) => (
            <button key={op} type="button" aria-pressed={r[c.id] === op} onClick={() => set(c.id, r[c.id] === op ? "" : op)} className={chip(r[c.id] === op)}>
              {op}
            </button>
          ))}
        </div>
        {c.tipo === "simnao" && r[c.id] === "Sim" && (
          <label className="mt-4 block">
            <span className={label}>Qual?</span>
            <input value={String(r[c.id + "-qual"] ?? "")} onChange={(e) => set(c.id + "-qual", e.target.value)} className={input} maxLength={300} placeholder="—" />
          </label>
        )}
      </fieldset>
    )
  }

  if (c.tipo !== "checks") return null
  const marcados = (r[c.id] as string[] | undefined) ?? []
  return (
    <fieldset>
      <legend className="text-[length:var(--fs-body)] leading-snug text-paper/90">{c.label}</legend>
      <p className="mt-1 text-xs text-paper/45">Pode marcar mais de uma.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {c.opcoes.map((op) => (
          <button key={op} type="button" aria-pressed={marcados.includes(op)} onClick={() => toggle(c.id, op)} className={chip(marcados.includes(op))}>
            {op}
          </button>
        ))}
      </div>
      {c.outro && (
        <label className="mt-4 block">
          <span className={label}>Outro</span>
          <input value={String(r[c.id + "-outro"] ?? "")} onChange={(e) => set(c.id + "-outro", e.target.value)} className={input} maxLength={120} placeholder="—" />
        </label>
      )}
    </fieldset>
  )
}

function Termo({ r, set }: { r: Respostas; set: (id: string, v: string) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 text-[length:var(--fs-body)] leading-relaxed text-paper/75">
        {TERMO.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
      <div className="grid gap-3">
        {ACEITES.map((a) => {
          const on = r[a.id] === "sim"
          return (
            <label key={a.id} className="flex cursor-pointer items-start gap-4 border border-paper/15 p-4 transition-colors hover:border-paper/40">
              <input type="checkbox" checked={on} onChange={(e) => set(a.id, e.target.checked ? "sim" : "")} className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
              <span className="text-sm leading-relaxed text-paper/85">{a.label}</span>
            </label>
          )
        })}
      </div>
      <p className="text-sm text-paper/50">Data: {hoje()}</p>
    </div>
  )
}
