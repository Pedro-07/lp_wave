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

export const MODALIDADES = ["Jiu-Jitsu Gi", "No-Gi", "Defesa pessoal", "Kids", "Feminino"] as const
export type Modalidade = (typeof MODALIDADES)[number]
