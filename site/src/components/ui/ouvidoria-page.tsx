import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"

// Página /ouvidoria (SPEC.md §4, Seção 7). Anônima de verdade: sem nome,
// e-mail ou telefone; o envio passa por /api/ouvidoria, que não registra
// dados de identificação. Honeypot + tempo mínimo contra robôs.

const TIPOS = [
  { value: "Sugestão", hint: "Uma ideia para melhorar." },
  { value: "Crítica", hint: "Algo que não funcionou." },
  { value: "Denúncia", hint: "Algo grave, que precisa de atenção." },
] as const

type Tipo = (typeof TIPOS)[number]["value"]
type Status = "idle" | "sending" | "sent" | "error" | "not_configured"

const MIN_CHARS = 10
const MAX_CHARS = 4000

export function OuvidoriaPage() {
  const scope = useRef<HTMLElement>(null)
  const abertoEm = useRef(Date.now())
  const [tipo, setTipo] = useState<Tipo>()
  const [mensagem, setMensagem] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [erro, setErro] = useState<string>()

  useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-rise]", { y: 24, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 })
    },
    { scope },
  )

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
      if (res.ok) return setStatus("sent")
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setStatus(body.error === "not_configured" ? "not_configured" : "error")
    } catch {
      setStatus("error")
    }
  }

  const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"

  return (
    <main ref={scope} className="grain min-h-svh bg-ink px-[var(--gutter)] pt-[clamp(1.5rem,4vw,3rem)] pb-[var(--space-section)] text-paper">
      <header className="flex items-center justify-between">
        <a href="/" aria-label="Black Wave — voltar ao site">
          <img src="/brand/naming-white.webp" alt="Black Wave" className="w-[clamp(8rem,14vw,11rem)]" />
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
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-accent" />
              Não pedimos nome, e-mail ou telefone.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-accent" />
              Este formulário não pede nem registra dados que identifiquem você.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-accent" />
              Sua mensagem chega por e-mail à gestão da equipe, só com o tipo, o texto e a data.
            </li>
          </ul>
          <p data-rise className="mt-6 max-w-[40ch] text-sm leading-relaxed text-paper/50">
            Evite escrever detalhes que revelem quem você é, se quiser manter o anonimato.
          </p>
        </div>

        {/* Formulário */}
        <div className="lg:col-span-6 lg:col-start-7">
          {status === "sent" ? (
            <div data-rise className="flex flex-col gap-6 border-t border-paper/15 pt-10" role="status">
              <p className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">Recebido.</p>
              <p className="max-w-[36ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">
                Obrigado por ajudar a direcionar a onda.
              </p>
              <a href="/" className="self-start border border-paper/40 px-6 py-3 text-sm uppercase tracking-[0.2em] transition-colors hover:border-accent hover:bg-accent">
                Voltar ao site
              </a>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-10">
              <fieldset data-rise>
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

              <label data-rise className="block">
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

              <div data-rise className="flex flex-col gap-4">
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
          )}
        </div>
      </div>
    </main>
  )
}
