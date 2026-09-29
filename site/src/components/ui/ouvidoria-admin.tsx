import { useCallback, useEffect, useState } from "react"

// Painel da equipe — /ouvidoria/gestao/ (noindex). Lê as mensagens e
// adiciona respostas/status à timeline que a pessoa vê com o código.
// A senha é OUVIDORIA_ADMIN_TOKEN (Vercel); fica só nesta aba (sessionStorage).
// O painel nunca vê o código de acompanhamento — só um id (hash).

const STATUS = ["Recebida", "Em análise", "Respondida", "Encerrada"] as const

interface Evento {
  data: string
  tipo: "status" | "resposta"
  status?: string
  texto?: string
}
interface Item {
  id: string
  tipo: string
  mensagem: string
  criada: string
  status: string
  eventos: Evento[]
}

const KEY = "bw-ouvidoria-admin"
const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"
const dataBR = (iso: string) => iso.split("-").reverse().join("/")

function lerToken() {
  try {
    return sessionStorage.getItem(KEY) ?? ""
  } catch {
    return ""
  }
}

export function OuvidoriaAdmin() {
  const [token, setToken] = useState(lerToken)
  const [itens, setItens] = useState<Item[]>()
  const [erro, setErro] = useState<string>()
  const [selecionado, setSelecionado] = useState<string>()
  const [filtro, setFiltro] = useState<string>("Abertas")

  const carregar = useCallback(async (t: string) => {
    setErro(undefined)
    const res = await fetch("/api/ouvidoria/admin", { headers: { Authorization: `Bearer ${t}` } }).catch(() => null)
    if (!res) return setErro("Sem conexão.")
    if (res.status === 401) {
      setErro("Senha incorreta.")
      setToken("")
      return
    }
    if (res.status === 503) return setErro("A ouvidoria ainda não está configurada na Vercel (banco e/ou senha do painel).")
    if (!res.ok) return setErro("Não foi possível carregar.")
    const body = (await res.json()) as { itens: Item[] }
    setItens(body.itens)
    try {
      sessionStorage.setItem(KEY, t)
    } catch {
      /* ok */
    }
  }, [])

  useEffect(() => {
    if (token) void carregar(token)
  }, [token, carregar])

  if (!token || !itens) {
    return (
      <main className="grid min-h-svh place-items-center bg-ink px-[var(--gutter)] text-paper">
        <form
          className="flex w-full max-w-sm flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            const t = String(new FormData(e.currentTarget).get("senha") ?? "")
            if (t) {
              setToken(t)
              void carregar(t)
            }
          }}
        >
          <img src="/brand/naming-white.webp" alt="Black Wave" width={1400} height={158} className="h-auto w-44" />
          <p className={label}>Gestão da ouvidoria</p>
          <input
            name="senha"
            type="password"
            autoComplete="current-password"
            placeholder="Senha do painel"
            className="border-b border-paper/25 bg-transparent pb-3 text-lg outline-none focus:border-accent focus-visible:outline-none"
          />
          {erro && <p className="text-sm text-accent">{erro}</p>}
          <button type="submit" className="self-start bg-paper px-6 py-3 text-sm uppercase tracking-[0.2em] text-ink hover:bg-accent hover:text-paper">
            Entrar
          </button>
        </form>
      </main>
    )
  }

  const visiveis = itens.filter((i) => (filtro === "Abertas" ? i.status !== "Encerrada" : filtro === "Todas" ? true : i.status === filtro))
  const atual = itens.find((i) => i.id === selecionado)

  return (
    <main className="min-h-svh bg-ink px-[var(--gutter)] py-8 text-paper">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 pb-6">
        <div className="flex items-center gap-4">
          <img src="/brand/naming-white.webp" alt="Black Wave" width={1400} height={158} className="h-auto w-36" />
          <p className={label}>Gestão da ouvidoria</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => carregar(token)} className="border border-paper/30 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-paper">
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem(KEY)
              } catch {
                /* ok */
              }
              setToken("")
              setItens(undefined)
            }}
            className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-paper/60 hover:text-paper"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {["Abertas", "Todas", ...STATUS].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltro(f)}
                className={"px-3 py-1.5 text-xs uppercase tracking-[0.18em] " + (filtro === f ? "bg-paper text-ink" : "border border-paper/20 text-paper/70")}
              >
                {f}
              </button>
            ))}
          </div>
          {visiveis.length === 0 && <p className="text-sm text-paper/50">Nenhuma mensagem aqui.</p>}
          <ul className="grid gap-2">
            {visiveis.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => setSelecionado(i.id)}
                  className={
                    "w-full border p-4 text-left transition-colors " +
                    (selecionado === i.id ? "border-paper bg-paper/5" : "border-paper/15 hover:border-paper/40")
                  }
                >
                  <span className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em]">
                    <span className={i.tipo === "Denúncia" ? "text-accent" : "text-paper/80"}>{i.tipo}</span>
                    <span className="text-paper/50">
                      {dataBR(i.criada)} · {i.status}
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm text-paper/75">{i.mensagem}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="lg:col-span-7">
          {atual ? (
            <Detalhe key={atual.id} item={atual} token={token} onSalvo={() => carregar(token)} />
          ) : (
            <p className="text-sm text-paper/50">Selecione uma mensagem.</p>
          )}
        </section>
      </div>
    </main>
  )
}

function Detalhe({ item, token, onSalvo }: { item: Item; token: string; onSalvo: () => void }) {
  const [resposta, setResposta] = useState("")
  const [status, setStatus] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<string>()

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resposta.trim() && !status) return setMsg("Escreva uma resposta ou escolha um status.")
    setSalvando(true)
    setMsg(undefined)
    const res = await fetch("/api/ouvidoria/admin", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, resposta: resposta.trim() || undefined, status: status || undefined }),
    }).catch(() => null)
    setSalvando(false)
    if (!res?.ok) return setMsg("Não foi possível salvar.")
    setResposta("")
    setStatus("")
    setMsg("Salvo. A pessoa verá isso na timeline.")
    onSalvo()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className={label}>
          {item.tipo} · {dataBR(item.criada)} · {item.status}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-[length:var(--fs-body)] leading-relaxed">{item.mensagem}</p>
      </div>

      <ol className="grid gap-3 border-l border-paper/20 pl-5">
        {item.eventos.map((ev, i) => (
          <li key={i} className="text-sm">
            <span className="text-paper/50">{dataBR(ev.data)} — </span>
            {ev.tipo === "resposta" ? <span className="whitespace-pre-wrap">Resposta: {ev.texto}</span> : <span>{ev.status}</span>}
          </li>
        ))}
      </ol>

      <form onSubmit={salvar} className="flex flex-col gap-4 border-t border-paper/10 pt-6">
        <label className="block">
          <span className={label}>Responder</span>
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value.slice(0, 4000))}
            rows={5}
            placeholder="A resposta aparece para a pessoa na timeline (sem assinatura pessoal)."
            className="mt-3 block w-full border border-paper/20 bg-transparent p-4 text-sm leading-relaxed outline-none focus:border-accent focus-visible:outline-none"
          />
        </label>
        <label className="flex flex-wrap items-center gap-3">
          <span className={label}>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-paper/20 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">{resposta.trim() ? "Automático (Respondida)" : "Manter"}</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {msg && <p className="text-sm text-paper/70">{msg}</p>}
        <button type="submit" disabled={salvando} className="self-start bg-paper px-6 py-3 text-sm uppercase tracking-[0.2em] text-ink hover:bg-accent hover:text-paper disabled:opacity-50">
          {salvando ? "Salvando…" : "Salvar na timeline"}
        </button>
      </form>
    </div>
  )
}
