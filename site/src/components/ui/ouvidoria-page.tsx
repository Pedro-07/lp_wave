import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { codigoCompleto, formatarCorpo, verificarCorpo } from "@/lib/ouvidoria-code"

// Página /ouvidoria (SPEC.md §4, Seção 7). Anônima de verdade: sem nome,
// e-mail ou telefone. Ao enviar, a pessoa recebe um código de acompanhamento —
// a única via de acesso à mensagem e às respostas (o servidor guarda só o hash
// dele). Aba "Acompanhar": código → timeline de status e respostas.

const TIPOS = [
  { value: "Sugestão", hint: "Uma ideia para melhorar." },
  { value: "Crítica", hint: "Algo que não funcionou." },
  { value: "Denúncia", hint: "Algo grave, que precisa de atenção." },
] as const

type Tipo = (typeof TIPOS)[number]["value"]
type Aba = "enviar" | "acompanhar"
type EnvioStatus = "idle" | "sending" | "error" | "not_configured"

interface Evento {
  data: string
  tipo: "status" | "resposta"
  status?: string
  texto?: string
}
interface Acompanhamento {
  tipo: string
  mensagem: string
  criada: string
  status: string
  eventos: Evento[]
}

const MIN_CHARS = 10
const MAX_CHARS = 4000
const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"
const dataBR = (iso: string) => iso.split("-").reverse().join("/")

const abaInicial = (): Aba => (location.hash === "#acompanhar" ? "acompanhar" : "enviar")

export function OuvidoriaPage() {
  const scope = useRef<HTMLElement>(null)
  const [aba, setAba] = useState<Aba>(abaInicial)

  useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-rise]", { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 })
    },
    { scope },
  )

  const trocarAba = (a: Aba) => {
    setAba(a)
    history.replaceState(null, "", a === "acompanhar" ? "#acompanhar" : location.pathname)
  }

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
        {/* Explicação */}
        <div className="lg:col-span-5">
          <p data-rise className={label + " mb-6"}>
            <span className="text-accent">—</span> Ouvidoria
          </p>
          <h1 data-rise className="font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]">
            Fale sem se identificar.
          </h1>
          <p data-rise className="mt-8 inline-flex items-center gap-3 border border-accent px-4 py-2 text-sm uppercase tracking-[0.24em]">
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" className="text-accent">
              <path d="M7 1L1 3.5v4C1 11.5 3.6 14.3 7 15c3.4-.7 6-3.5 6-7.5v-4L7 1z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            Anônima
          </p>
          <ul data-rise className="mt-8 grid max-w-[40ch] gap-4 text-[length:var(--fs-body)] leading-relaxed text-paper/75">
            {[
              "Não pedimos nome, e-mail ou telefone.",
              "Este formulário não pede nem registra dados que identifiquem você.",
              "Ao enviar, você recebe um código. Só com ele dá para ver as respostas da equipe.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-accent" />
                {t}
              </li>
            ))}
          </ul>
          <p data-rise className="mt-6 max-w-[40ch] text-sm leading-relaxed text-paper/50">
            Evite escrever detalhes que revelem quem você é, se quiser manter o anonimato.
          </p>
        </div>

        {/* Abas */}
        <div className="lg:col-span-6 lg:col-start-7">
          <div data-rise role="tablist" aria-label="Ouvidoria" className="mb-10 inline-flex border border-paper/25">
            {(
              [
                ["enviar", "Enviar mensagem"],
                ["acompanhar", "Acompanhar"],
              ] as const
            ).map(([k, t]) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={aba === k}
                onClick={() => trocarAba(k)}
                className={
                  "whitespace-nowrap px-4 py-3 text-xs uppercase tracking-[0.16em] transition-colors duration-300 sm:px-5 sm:text-sm sm:tracking-[0.18em] " +
                  (aba === k ? "bg-paper text-ink" : "text-paper/70 hover:text-paper")
                }
              >
                {t}
              </button>
            ))}
          </div>
          <div data-rise>{aba === "enviar" ? <Enviar onAcompanhar={() => trocarAba("acompanhar")} /> : <Acompanhar />}</div>
        </div>
      </div>
    </main>
  )
}

// ── Enviar ────────────────────────────────────────────────────────────────

function Enviar({ onAcompanhar }: { onAcompanhar: () => void }) {
  const abertoEm = useRef(Date.now())
  const [tipo, setTipo] = useState<Tipo>()
  const [mensagem, setMensagem] = useState("")
  const [status, setStatus] = useState<EnvioStatus>("idle")
  const [erro, setErro] = useState<string>()
  const [codigo, setCodigo] = useState<string>()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!tipo) return setErro("Escolha o tipo da mensagem.")
    if (mensagem.trim().length < MIN_CHARS) return setErro(`Escreva pelo menos ${MIN_CHARS} caracteres.`)
    setErro(undefined)
    setStatus("sending")
    const site = String(new FormData(e.currentTarget).get("site") ?? "")
    try {
      const res = await fetch("/api/ouvidoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, mensagem: mensagem.trim(), site, aberto_em: abertoEm.current }),
      })
      const body = (await res.json().catch(() => ({}))) as { codigo?: string; error?: string }
      if (res.ok && body.codigo) return setCodigo(body.codigo)
      setStatus(body.error === "not_configured" ? "not_configured" : "error")
    } catch {
      setStatus("error")
    }
  }

  if (codigo) {
    return (
      <CodigoGerado
        codigo={codigo}
        onConcluir={() => {
          setCodigo(undefined)
          setMensagem("")
          setTipo(undefined)
          setStatus("idle")
        }}
        onAcompanhar={onAcompanhar}
      />
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-10">
      <fieldset>
        <legend className={label}>Tipo</legend>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {TIPOS.map((t) => {
            const on = tipo === t.value
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                onClick={() => setTipo(t.value)}
                className={
                  "flex flex-col gap-2 border p-5 text-left transition-colors duration-300 " +
                  (on ? "border-paper bg-paper text-ink" : "border-paper/20 hover:border-paper/60")
                }
              >
                <span className="font-display text-2xl font-extrabold uppercase">{t.value}</span>
                <span className={"text-sm " + (on ? "text-ink/70" : "text-paper/60")}>{t.hint}</span>
              </button>
            )
          })}
        </div>
        {tipo === "Denúncia" && (
          <p className="mt-4 text-sm text-paper/70">
            <span className="text-accent">Importante:</span> se houver risco imediato, ligue 190.
          </p>
        )}
      </fieldset>

      <label className="block">
        <span className={label}>Sua mensagem</span>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value.slice(0, MAX_CHARS))}
          rows={8}
          className="mt-4 block w-full resize-y border border-paper/20 bg-transparent p-5 text-[length:var(--fs-body)] leading-relaxed text-paper outline-none transition-colors placeholder:text-paper/30 focus:border-accent focus-visible:outline-none"
          placeholder="Escreva aqui. Sem nome, sem contato."
        />
        <span className="mt-2 block text-right text-xs text-paper/40">
          {mensagem.length} / {MAX_CHARS}
        </span>
      </label>

      {/* Honeypot: invisível para pessoas; robôs costumam preencher. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site
          <input name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        {erro && <p className="text-sm text-accent">{erro}</p>}
        {status === "not_configured" && (
          <p className="text-sm text-paper/80" role="alert">
            A ouvidoria está sendo configurada e ainda não recebe mensagens. Tente novamente em breve.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-accent" role="alert">
            Não foi possível enviar agora. Tente de novo em alguns instantes.
          </p>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex items-center justify-between gap-4 self-start bg-paper px-7 py-5 text-sm uppercase tracking-[0.24em] text-ink transition-colors duration-300 hover:bg-accent hover:text-paper disabled:opacity-60"
        >
          {status === "sending" ? "Enviando…" : "Enviar anonimamente"}
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
      </div>
    </form>
  )
}

function CodigoGerado({ codigo, onConcluir, onAcompanhar }: { codigo: string; onConcluir: () => void; onAcompanhar: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const [guardei, setGuardei] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    box.current?.focus()
  }, [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      /* sem permissão de área de transferência: a pessoa pode selecionar o texto */
    }
  }

  const baixar = () => {
    const texto = [
      "Ouvidoria Black Wave — código de acompanhamento",
      "",
      codigo,
      "",
      `Use este código em ${location.host}/ouvidoria, aba Acompanhar, para ver as respostas.`,
      "Guarde-o em lugar seguro: sem ele não é possível acompanhar a mensagem.",
    ].join("\n")
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }))
    const a = Object.assign(document.createElement("a"), { href: url, download: "ouvidoria-black-wave.txt" })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div ref={box} tabIndex={-1} role="status" className="flex flex-col gap-8 border-t border-paper/15 pt-10 outline-none">
      <div>
        <p className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">Recebido.</p>
        <p className="mt-4 max-w-[40ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
          Obrigado por ajudar a direcionar a onda. Este é o seu código de acompanhamento:
        </p>
      </div>

      <div className="border border-paper/25 p-6">
        <p className={label}>Código de acompanhamento</p>
        <p className="mt-3 font-display text-[clamp(1.3rem,6vw,2rem)] font-extrabold tracking-[0.04em] whitespace-nowrap select-all lg:text-[clamp(1.3rem,2.2vw,2rem)]">{codigo}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={copiar} className="border border-paper/40 px-5 py-3 text-sm uppercase tracking-[0.18em] transition-colors hover:border-accent hover:bg-accent">
            {copiado ? "Copiado ✓" : "Copiar código"}
          </button>
          <button type="button" onClick={baixar} className="border border-paper/40 px-5 py-3 text-sm uppercase tracking-[0.18em] transition-colors hover:border-accent hover:bg-accent">
            Baixar em .txt
          </button>
        </div>
      </div>

      <p className="flex gap-3 border-l-2 border-accent pl-4 text-sm leading-relaxed text-paper/80">
        Guarde este código agora. É a única forma de acompanhar sua mensagem: como não sabemos quem você é, não temos como
        recuperá-lo nem enviá-lo para você.
      </p>

      <label className="flex cursor-pointer items-center gap-3 text-[length:var(--fs-body)]">
        <input type="checkbox" checked={guardei} onChange={(e) => setGuardei(e.target.checked)} className="size-5 accent-[var(--accent)]" />
        Guardei meu código
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!guardei}
          onClick={onConcluir}
          className="bg-paper px-7 py-4 text-sm uppercase tracking-[0.24em] text-ink transition-colors duration-300 hover:bg-accent hover:text-paper disabled:pointer-events-none disabled:opacity-30"
        >
          Concluir
        </button>
        <button
          type="button"
          disabled={!guardei}
          onClick={onAcompanhar}
          className="px-3 py-4 text-sm uppercase tracking-[0.18em] text-paper/70 underline decoration-paper/30 underline-offset-8 transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-30"
        >
          Ir para Acompanhar
        </button>
      </div>
    </div>
  )
}

// ── Acompanhar ───────────────────────────────────────────────────────────

function Acompanhar() {
  const [codigo, setCodigo] = useState("")
  const [estado, setEstado] = useState<"idle" | "loading" | "not_found" | "error" | "not_configured">("idle")
  const [dados, setDados] = useState<Acompanhamento>()
  const check = verificarCorpo(codigo)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (check !== "ok") return
    setEstado("loading")
    setDados(undefined)
    try {
      const res = await fetch("/api/ouvidoria/acompanhar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoCompleto(codigo) }),
      })
      const body = (await res.json().catch(() => ({}))) as Acompanhamento & { error?: string }
      if (res.ok) {
        setDados(body)
        setEstado("idle")
      } else setEstado(body.error === "not_found" ? "not_found" : body.error === "not_configured" ? "not_configured" : "error")
    } catch {
      setEstado("error")
    }
  }

  const dica =
    check === "invalido"
      ? "Esse código não é válido. Confira se digitou certo."
      : check === "incompleto"
        ? "Faltam caracteres: são 16 depois de BW-."
        : null

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={buscar} className="flex flex-col gap-4">
        <label className="block">
          <span className={label}>Código de acompanhamento</span>
          {/* "BW-" fixo: a pessoa digita só o corpo; colar o código inteiro também funciona. */}
          <span className="mt-4 flex items-baseline gap-1 border-b border-paper/25 pb-3 font-display text-[clamp(1.4rem,3vw,2.2rem)] font-extrabold tracking-[0.08em] transition-colors focus-within:border-accent">
            <span aria-hidden="true" className="text-paper/40">
              BW-
            </span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(formatarCorpo(e.target.value))}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              aria-invalid={check === "invalido"}
              aria-describedby="codigo-dica"
              className="w-full min-w-0 bg-transparent text-paper outline-none placeholder:text-paper/20 focus-visible:outline-none"
            />
          </span>
        </label>
        <p id="codigo-dica" className={"min-h-5 text-sm " + (check === "invalido" ? "text-accent" : "text-paper/50")}>
          {dica ?? (check === "ok" ? "Código válido." : "")}
        </p>
        <button
          type="submit"
          disabled={check !== "ok" || estado === "loading"}
          className="self-start bg-paper px-7 py-4 text-sm uppercase tracking-[0.24em] text-ink transition-colors duration-300 hover:bg-accent hover:text-paper disabled:pointer-events-none disabled:opacity-30"
        >
          {estado === "loading" ? "Buscando…" : "Ver andamento"}
        </button>
      </form>

      {estado === "not_found" && (
        <p className="text-sm text-paper/80" role="alert">
          Nenhuma mensagem com esse código. Confira se é o código que você guardou.
        </p>
      )}
      {estado === "not_configured" && (
        <p className="text-sm text-paper/80" role="alert">
          O acompanhamento está sendo configurado. Tente novamente em breve.
        </p>
      )}
      {estado === "error" && (
        <p className="text-sm text-accent" role="alert">
          Não foi possível consultar agora. Tente de novo em alguns instantes.
        </p>
      )}

      {dados && <Timeline dados={dados} />}
    </div>
  )
}

function Timeline({ dados }: { dados: Acompanhamento }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-evento]", { x: -16, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.1 })
      gsap.from("[data-linha]", { scaleY: 0, transformOrigin: "top", duration: 1, ease: "expo.out" })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="border-t border-paper/15 pt-8" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className={label}>
          {dados.tipo} · enviada em {dataBR(dados.criada)}
        </p>
        <p className="border border-accent px-3 py-1 text-xs uppercase tracking-[0.24em]">{dados.status}</p>
      </div>

      <details className="mt-5 text-sm text-paper/60">
        <summary className="cursor-pointer select-none uppercase tracking-[0.2em]">Ver minha mensagem</summary>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-paper/75">{dados.mensagem}</p>
      </details>

      <ol className="relative mt-8 grid gap-7 pl-8">
        <span data-linha aria-hidden="true" className="absolute top-2 bottom-2 left-[5px] w-px bg-paper/20" />
        {dados.eventos.map((ev, i) => (
          <li key={i} data-evento className="relative">
            <span
              aria-hidden="true"
              className={
                "absolute top-1.5 -left-8 size-[11px] rounded-full border " +
                (ev.tipo === "resposta" ? "border-accent bg-accent" : "border-paper/60 bg-ink")
              }
            />
            <p className="text-xs uppercase tracking-[0.24em] text-paper/50">{dataBR(ev.data)}</p>
            {ev.tipo === "resposta" ? (
              <>
                <p className="mt-1 text-sm uppercase tracking-[0.18em] text-paper/80">Resposta da equipe</p>
                <p className="mt-2 max-w-[48ch] whitespace-pre-wrap text-[length:var(--fs-body)] leading-relaxed">{ev.texto}</p>
              </>
            ) : (
              <p className="mt-1 text-[length:var(--fs-body)]">{ev.status}</p>
            )}
          </li>
        ))}
      </ol>
      {dados.status !== "Encerrada" && (
        <p className="mt-8 text-sm text-paper/50">Volte com o mesmo código para ver novas respostas.</p>
      )}
    </div>
  )
}
