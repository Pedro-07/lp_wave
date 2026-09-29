// Função da ouvidoria anônima (Vercel Function, POST /api/ouvidoria).
// Envia a mensagem por e-mail via Resend. ANONIMATO: não lê nem repassa IP,
// user-agent ou qualquer cabeçalho; não grava nada; não faz log do conteúdo.
// O e-mail contém só: tipo, mensagem e data.
//
// Variáveis de ambiente (Vercel → Settings → Environment Variables):
//   RESEND_API_KEY   chave da conta Resend
//   OUVIDORIA_TO     e-mail que recebe as mensagens (pode ter vários, separados por vírgula)
//   OUVIDORIA_FROM   remetente verificado no Resend (opcional; padrão: onboarding@resend.dev,
//                    que só entrega para o e-mail dono da conta Resend)
// Sem RESEND_API_KEY ou OUVIDORIA_TO, responde 503 "not_configured".

const TIPOS = ["Sugestão", "Crítica", "Denúncia"] as const
type Tipo = (typeof TIPOS)[number]

const MIN_CHARS = 10
const MAX_CHARS = 4000
/** Tempo mínimo entre abrir a página e enviar (robôs enviam na hora). */
const MIN_FILL_MS = 3000

interface Payload {
  tipo?: string
  mensagem?: string
  /** honeypot: campo invisível; se vier preenchido, é robô. */
  site?: string
  /** Date.now() de quando o formulário foi aberto. */
  aberto_em?: number
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } })

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

export async function POST(request: Request): Promise<Response> {
  let data: Payload
  try {
    data = (await request.json()) as Payload
  } catch {
    return json(400, { error: "invalid_body" })
  }

  // Robôs: responde "ok" sem enviar nada (não ensina o robô a contornar).
  if (data.site) return json(200, { ok: true })
  if (typeof data.aberto_em === "number" && Date.now() - data.aberto_em < MIN_FILL_MS) {
    return json(200, { ok: true })
  }

  const tipo = TIPOS.find((t) => t === data.tipo) as Tipo | undefined
  const mensagem = String(data.mensagem ?? "").trim()
  if (!tipo) return json(400, { error: "invalid_tipo" })
  if (mensagem.length < MIN_CHARS || mensagem.length > MAX_CHARS) return json(400, { error: "invalid_mensagem" })

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.OUVIDORIA_TO
  if (!apiKey || !to) return json(503, { error: "not_configured" })
  const from = process.env.OUVIDORIA_FROM || "Ouvidoria Black Wave <onboarding@resend.dev>"

  // Só a data (sem hora exata), para não ajudar a identificar quem escreveu.
  const dia = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666">Ouvidoria Black Wave — mensagem anônima</p>
      <h2 style="margin:8px 0 16px">${tipo}</h2>
      <p style="white-space:pre-wrap;font-size:15px;line-height:1.5">${escapeHtml(mensagem)}</p>
      <p style="font-size:12px;color:#888;margin-top:24px">Recebida em ${dia}. O formulário não coleta dados de identificação.</p>
    </div>`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      subject: `[Ouvidoria] ${tipo} — ${dia}`,
      html,
      text: `${tipo}\n\n${mensagem}\n\nRecebida em ${dia}.`,
    }),
  })

  if (!res.ok) return json(502, { error: "send_failed" })
  return json(200, { ok: true })
}
