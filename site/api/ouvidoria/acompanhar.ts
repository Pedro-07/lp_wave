// POST /api/ouvidoria/acompanhar — { codigo } → timeline da mensagem.
// POST (e não GET) para o código nunca aparecer em URL/registro de acesso.

import { hashCodigo, json, kvConfigurado, ler, normalizarCodigo } from "../_lib/ouvidoria.js"

export async function POST(request: Request): Promise<Response> {
  let codigo: string | null = null
  try {
    const body = (await request.json()) as { codigo?: string }
    codigo = normalizarCodigo(String(body.codigo ?? ""))
  } catch {
    return json(400, { error: "invalid_body" })
  }
  if (!codigo) return json(400, { error: "invalid_code" })
  if (!kvConfigurado()) return json(503, { error: "not_configured" })

  try {
    const reg = await ler(await hashCodigo(codigo))
    if (!reg) return json(404, { error: "not_found" })
    return json(200, { tipo: reg.tipo, mensagem: reg.mensagem, criada: reg.criada, status: reg.status, eventos: reg.eventos })
  } catch {
    return json(502, { error: "read_failed" })
  }
}
