// Painel da equipe (/ouvidoria/gestao/). Protegido por OUVIDORIA_ADMIN_TOKEN.
//   GET  /api/ouvidoria/admin          → mensagens (mais recentes primeiro)
//   POST /api/ouvidoria/admin { id, status?, resposta? } → novo evento na timeline
// O painel vê um id (hash do código), nunca o código de acompanhamento.

import { autorizado, hoje, json, kvConfigurado, ler, listar, salvar, STATUS, type Evento, type Status } from "../_lib/ouvidoria.js"

export async function GET(request: Request): Promise<Response> {
  if (!process.env.OUVIDORIA_ADMIN_TOKEN || !kvConfigurado()) return json(503, { error: "not_configured" })
  if (!autorizado(request)) return json(401, { error: "unauthorized" })
  try {
    const itens = await listar()
    return json(200, { itens: itens.map(({ id, reg }) => ({ id, ...reg })) })
  } catch {
    return json(502, { error: "read_failed" })
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.OUVIDORIA_ADMIN_TOKEN || !kvConfigurado()) return json(503, { error: "not_configured" })
  if (!autorizado(request)) return json(401, { error: "unauthorized" })

  let body: { id?: string; status?: string; resposta?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return json(400, { error: "invalid_body" })
  }
  const id = String(body.id ?? "")
  if (!/^[0-9a-f]{64}$/.test(id)) return json(400, { error: "invalid_id" })
  const status = STATUS.find((s) => s === body.status) as Status | undefined
  const resposta = String(body.resposta ?? "").trim().slice(0, 4000)
  if (!status && !resposta) return json(400, { error: "nothing_to_add" })

  try {
    const reg = await ler(id)
    if (!reg) return json(404, { error: "not_found" })
    const data = hoje()
    const novos: Evento[] = []
    if (resposta) novos.push({ data, tipo: "resposta", texto: resposta })
    // Responder sem escolher status marca como "Respondida".
    const proximo = status ?? (resposta && reg.status !== "Encerrada" ? "Respondida" : undefined)
    if (proximo && proximo !== reg.status) novos.push({ data, tipo: "status", status: proximo })
    reg.eventos.push(...novos)
    if (proximo) reg.status = proximo
    await salvar(id, reg)
    return json(200, { ok: true, status: reg.status, eventos: reg.eventos })
  } catch {
    return json(502, { error: "save_failed" })
  }
}
