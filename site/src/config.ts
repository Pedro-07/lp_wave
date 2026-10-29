// Dados de contato da Black Wave. PENDENCIAS.md: preencher quando o cliente enviar.

/** WhatsApp com DDI + DDD, só números. Provisório (cliente, 2026-09-29): (98) 98855-8687. */
export const WHATSAPP_NUMBER = "5598988558687"
/** Mesmo número, formatado para exibição. */
export const WHATSAPP_DISPLAY = "(98) 98855-8687"

/**
 * Link do WhatsApp com mensagem pronta. Sem número configurado, o wa.me abre o
 * WhatsApp para a pessoa escolher o contato — funciona, mas é provisório.
 */
export function whatsappLink(text: string) {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : "https://wa.me/"
  return `${base}?text=${encodeURIComponent(text)}`
}

/** Turmas da grade noturna (cliente, 2026-10-28). Aulas de 60 minutos. */
export const MODALIDADES = ["Iniciantes", "Kids", "Geral", "Feminina", "Corujão", "No-Gi"] as const
export type Modalidade = (typeof MODALIDADES)[number]

/** Dias e horário de cada turma. */
export const GRADE: Record<Modalidade, { dias: string; horario: string }> = {
  Iniciantes: { dias: "Seg, qua e sex", horario: "18h às 19h" },
  Kids: { dias: "Ter, qui e sáb", horario: "18h às 19h" },
  Geral: { dias: "Seg, qua e sex", horario: "19h às 20h" },
  Feminina: { dias: "Ter e qui", horario: "19h às 20h" },
  Corujão: { dias: "Seg, qua e sex", horario: "20h30 às 21h30" },
  "No-Gi": { dias: "Ter e qui", horario: "20h30 às 21h30" },
}

/** Resumo para "Onde estamos" e dados estruturados. */
export const HORARIO_RESUMO = "Segunda a sábado, das 18h às 21h30"
