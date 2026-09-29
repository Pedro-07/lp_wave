// POST /api/ouvidoria — registra a mensagem anônima e devolve o código de
// acompanhamento (a única via de acesso a ela). Ver api/_lib/ouvidoria.ts.

import { avisarPorEmail, hashCodigo, hoje, json, kvConfigurado, novoCodigo, salvar, TIPOS, type Tipo } from "../_lib/ouvidoria.js"

const MIN_CHARS = 10
const MAX_CHARS = 4000
/** Tempo mínimo entre abrir a página e enviar (robôs enviam na hora). */
const MIN_FILL_MS = 3000

interface Payload {
  tipo?: string
  mensagem?: string
  /** honeypot: campo invisível; se vier preenchido, é robô. */
  site?: string
  aberto_em?: number
}

export async function POST(request: Request): Promise<Response> {
  let data: Payload
  try {
    data = (await request.json()) as Payload
  } catch {
    return json(400, { error: "invalid_body" })
  }

  // Robôs: responde como se tivesse dado certo, sem gravar nada.
  const robo = Boolean(data.site) || (typeof data.aberto_em === "number" && Date.now() - data.aberto_em < MIN_FILL_MS)
  if (robo) return json(200, { ok: true, codigo: novoCodigo() })

  const tipo = TIPOS.find((t) => t === data.tipo) as Tipo | undefined
  const mensagem = String(data.mensagem ?? "").trim()
  if (!tipo) return json(400, { error: "invalid_tipo" })
  if (mensagem.length < MIN_CHARS || mensagem.length > MAX_CHARS) return json(400, { error: "invalid_mensagem" })

  if (!kvConfigurado()) return json(503, { error: "not_configured" })

  const codigo = novoCodigo()
  const data_ = hoje()
  try {
    await salvar(
      await hashCodigo(codigo),
      { tipo, mensagem, criada: data_, status: "Recebida", eventos: [{ data: data_, tipo: "status", status: "Recebida" }] },
      true,
    )
  } catch {
    return json(502, { error: "save_failed" })
  }
  await avisarPorEmail(tipo, mensagem, data_)
  return json(200, { ok: true, codigo })
}
