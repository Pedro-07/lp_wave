// Núcleo da ouvidoria (compartilhado pelas funções em api/ouvidoria/*).
// Arquivos em api/_lib não viram rotas na Vercel.
//
// ANONIMATO: nenhuma função lê IP, user-agent ou cabeçalhos da pessoa; nada é
// logado. O código de acompanhamento nunca é guardado — só o SHA-256 dele,
// usado como chave. Quem não tem o código não chega à mensagem.
//
// Variáveis de ambiente:
//   KV_REST_API_URL / KV_REST_API_TOKEN  (ou UPSTASH_REDIS_REST_URL / _TOKEN)
//        banco Upstash Redis — instalar em Vercel → Storage/Marketplace → Upstash
//   OUVIDORIA_ADMIN_TOKEN  senha do painel /ouvidoria/gestao/
//   RESEND_API_KEY, OUVIDORIA_TO, OUVIDORIA_FROM  (opcional) aviso por e-mail

export const TIPOS = ["Sugestão", "Crítica", "Denúncia"] as const
export type Tipo = (typeof TIPOS)[number]

export const STATUS = ["Recebida", "Em análise", "Respondida", "Encerrada"] as const
export type Status = (typeof STATUS)[number]

export interface Evento {
  /** Data (AAAA-MM-DD), sem hora, para não ajudar a identificar ninguém. */
  data: string
  tipo: "status" | "resposta"
  status?: Status
  texto?: string
}

export interface Registro {
  tipo: Tipo
  mensagem: string
  criada: string
  status: Status
  eventos: Evento[]
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })

export const hoje = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Fortaleza" })

// ── Código de acompanhamento ───────────────────────────────────────────────
// Base32 de Crockford (sem I, L, O, U): 15 caracteres aleatórios (75 bits) +
// 1 dígito verificador → BW-XXXX-XXXX-XXXX-XXXX. O front valida o formato e o
// verificador (ver src/lib/ouvidoria-code.ts — mesma regra).

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

export function checkChar(body: string) {
  let sum = 0
  for (let i = 0; i < body.length; i++) sum = (sum * 7 + ALFABETO.indexOf(body[i]) * (i + 3)) % 32
  return ALFABETO[sum]
}

export function novoCodigo() {
  const bytes = crypto.getRandomValues(new Uint8Array(15))
  const body = [...bytes].map((b) => ALFABETO[b % 32]).join("")
  const full = body + checkChar(body)
  return `BW-${full.slice(0, 4)}-${full.slice(4, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}`
}

/** Normaliza o que a pessoa digitou; null se o formato/verificador não bater. */
export function normalizarCodigo(input: string) {
  let raw = input.toUpperCase().replace(/[^0-9A-Z]/g, "")
  // "BW" só é prefixo quando sobra texto (B e W também valem dentro do código).
  if (raw.length === 18 && raw.startsWith("BW")) raw = raw.slice(2)
  const fixed = raw.replace(/O/g, "0").replace(/[IL]/g, "1").replace(/U/g, "V")
  if (fixed.length !== 16 || [...fixed].some((c) => !ALFABETO.includes(c))) return null
  if (checkChar(fixed.slice(0, 15)) !== fixed[15]) return null
  return `BW-${fixed.slice(0, 4)}-${fixed.slice(4, 8)}-${fixed.slice(8, 12)}-${fixed.slice(12, 16)}`
}

export async function hashCodigo(codigo: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`bw-ouvidoria:${codigo}`))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

// ── Banco (Upstash Redis via REST) ─────────────────────────────────────────

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

export const kvConfigurado = () => kvConfig() !== null

async function kv<T = unknown>(command: (string | number)[]): Promise<T> {
  const cfg = kvConfig()
  if (!cfg) throw new Error("kv_not_configured")
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error("kv_error")
  const body = (await res.json()) as { result: T }
  return body.result
}

const chave = (id: string) => `ouv:${id}`
const INDICE = "ouv:indice"

export async function salvar(id: string, reg: Registro, novo = false) {
  await kv(["SET", chave(id), JSON.stringify(reg)])
  if (novo) await kv(["ZADD", INDICE, Date.now(), id])
}

export async function ler(id: string): Promise<Registro | null> {
  const raw = await kv<string | null>(["GET", chave(id)])
  return raw ? (JSON.parse(raw) as Registro) : null
}

/** Mais recentes primeiro. */
export async function listar(limite = 100) {
  const ids = await kv<string[]>(["ZREVRANGE", INDICE, 0, limite - 1])
  const regs = await Promise.all(ids.map(async (id) => ({ id, reg: await ler(id) })))
  return regs.filter((r): r is { id: string; reg: Registro } => r.reg !== null)
}

// ── Painel da equipe ───────────────────────────────────────────────────────

export function autorizado(request: Request) {
  const token = process.env.OUVIDORIA_ADMIN_TOKEN
  if (!token) return false
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  if (got.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ token.charCodeAt(i)
  return diff === 0
}

// ── Aviso por e-mail (opcional) ────────────────────────────────────────────

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/** Avisa a equipe. Não inclui o código de acompanhamento. Falha em silêncio. */
export async function avisarPorEmail(tipo: Tipo, mensagem: string, data: string) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.OUVIDORIA_TO
  if (!apiKey || !to) return
  const from = process.env.OUVIDORIA_FROM || "Ouvidoria Black Wave <onboarding@resend.dev>"
  const dia = data.split("-").reverse().join("/")
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666">Ouvidoria Black Wave — mensagem anônima</p>
      <h2 style="margin:8px 0 16px">${tipo}</h2>
      <p style="white-space:pre-wrap;font-size:15px;line-height:1.5">${escapeHtml(mensagem)}</p>
      <p style="font-size:12px;color:#888;margin-top:24px">Recebida em ${dia}. Responda pelo painel /ouvidoria/gestao/.</p>
    </div>`
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        subject: `[Ouvidoria] ${tipo} — ${dia}`,
        html,
        text: `${tipo}\n\n${mensagem}\n\nRecebida em ${dia}. Responda pelo painel /ouvidoria/gestao/.`,
      }),
    })
  } catch {
    /* o registro já está salvo; o e-mail é só aviso */
  }
}
