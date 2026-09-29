// Validação do código de acompanhamento no navegador (mesma regra de
// site/api/_lib/ouvidoria.ts): BW-XXXX-XXXX-XXXX-XXXX em base32 de Crockford,
// último caractere é dígito verificador. Pega erros de digitação sem ir ao servidor.
//
// O prefixo "BW-" é fixo na interface; a pessoa digita só o corpo (16 caracteres).
// Como B e W também são caracteres válidos do corpo, o prefixo só é descartado
// quando sobra texto demais (quem cola ou digita o código inteiro).

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const TAMANHO = 16

function checkChar(body: string) {
  let sum = 0
  for (let i = 0; i < body.length; i++) sum = (sum * 7 + ALFABETO.indexOf(body[i]) * (i + 3)) % 32
  return ALFABETO[sum]
}

/** Formata o corpo enquanto a pessoa digita: XXXX-XXXX-XXXX-XXXX (O→0, I/L→1, U→V). */
export function formatarCorpo(input: string) {
  let raw = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V")
  if (raw.length > TAMANHO && raw.startsWith("BW")) raw = raw.slice(2)
  raw = raw.slice(0, TAMANHO)
  return (raw.match(/.{1,4}/g) ?? []).join("-")
}

export type CodigoCheck = "vazio" | "incompleto" | "invalido" | "ok"

export function verificarCorpo(corpo: string): CodigoCheck {
  const raw = corpo.replace(/-/g, "")
  if (!raw) return "vazio"
  if (raw.length < TAMANHO) return "incompleto"
  if ([...raw].some((c) => !ALFABETO.includes(c))) return "invalido"
  return checkChar(raw.slice(0, TAMANHO - 1)) === raw[TAMANHO - 1] ? "ok" : "invalido"
}

export const codigoCompleto = (corpo: string) => `BW-${corpo}`
