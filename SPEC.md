# Black Wave — SPEC

Fonte da verdade do site. Pendências de conteúdo em `PENDENCIAS.md`.
Status: **só o hero está especificado**. As demais seções entram depois do briefing completo.

## 1. Resumo
- Marca: Black Wave Jiu Jitsu Team — São Luís (MA), est. 2026. (Imperatriz fora do site por decisão do cliente.)
- Filosofia (manual): toda onda nasce de uma perturbação; o desconforto gera evolução.
- Site: lançamento da marca. Ação única: formulário de aula experimental.
- Não é: academia de bairro, corporativa, marca de surf.
- Movimento: marcante (máx. 3 momentos wow no site).

## 2. Tokens
```css
:root {
  --ink-0: #000000;      /* Preto Absoluto — fundo */
  --paper: #ffffff;      /* Branco Absoluto — texto */
  --accent: #dc0000;     /* Vermelho Tático — UI (manual) */
  --accent-logo: #fd002a;/* vermelho usado nos arquivos oficiais do símbolo */
  --accent-2: #6666ff;   /* Azul Elétrico — apoio, uso raro */
  --grey: #666666;       /* Cinza Grafite */

  --font-display: "Astoria Sans", sans-serif;   /* institucional (manual) */
  --font-brand: "Varien", sans-serif;           /* só construção simbólica */

  --fs-hero: clamp(2.5rem, 7vw, 7.5rem);
  --fs-label: clamp(0.625rem, 0.8vw, 0.75rem);
  --gutter: clamp(1rem, 4vw, 4rem);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## 3. Stack
- Vite + React + TypeScript, Tailwind v4 (tokens mapeados no `@theme`), estrutura `src/components/ui` (padrão shadcn pedido no ORIENTAÇÃO.txt).
- GSAP + ScrollTrigger + `@gsap/react`, Lenis.
- Assets: `public/hero/` (vídeo, frames), `public/brand/`, `public/fonts/`.

## 4. Seções

### Seção 1 — Hero "Onda → Símbolo"
Objetivo: contar a filosofia da marca em um gesto — a onda (perturbação) vira o traço do símbolo, que termina na ponta da faixa preta.
Conteúdo:
- Rótulos de canto: `JIU JITSU · LIFESTYLE · COMMUNITY` (sup. esq.), `EST. 2026` (sup. dir.), `SÃO LUÍS — MA` (inf. esq.; Imperatriz removido a pedido, 2026-09-28), `ROLE` + seta (inf. centro).
- Título (início): **Toda onda nasce de uma perturbação.**
- Fim: símbolo desenhado + naming BLACK WAVE + slogan *Just Flow* + CTA **Agendar aula experimental** (âncora para o formulário).
Assets: `hero-onda.mp4` (0–4,5 s do vídeo Kling — depois disso a faixa gerada por IA começa a aparecer, reencodado com todos os quadros-chave), `frames/0001–0054.webp` (mobile, 12 fps, 960 px), `poster.webp`, símbolo vetorizado (`symbol-draw.json`), `naming-white.png`, `slogan-white.png`.
Layout desktop: vídeo em tela cheia (object-fit cover), título grande alinhado à esquerda no terço inferior, rótulos pequenos espaçados nos cantos, linha de progresso vermelha de 2 px na base.
Layout mobile: mesmo roteiro; título em 2–3 linhas; símbolo ocupa 88% da largura.
Scroll (pin por 250% da altura, scrub 0.6, sem travar a página):
- 0 → 0.60: vídeo 0 → 4,5 s; zoom 1 → 1.06.
- 0 → 0.25: título perde opacidade e ganha blur (10 px), sobe 24 px.
- 0.50 → 0.66: overlay preto 0 → 0.92 (a onda "afunda").
- 0.58 → 0.88: traço do símbolo se desenha (máscara SVG por segmentos); o vermelho aparece por último.
- 0.84 → 1.00: naming, slogan e CTA entram com reveal (y 24 → 0, blur 8 → 0).
Entrada (load): rótulos e título com reveal por linha, 1.2 s, expo.out.
Hover: CTA com botão magnético (só desktop).
Mobile/iOS: sequência de imagens em canvas no lugar do vídeo (vertical própria em retrato).
Reduced motion: sem pin; mostra o poster com o símbolo completo, naming, slogan e CTA.

## 5. Regras de movimento
- Máx. 1 wow por seção, 3 no site. O hero é o wow nº 1.
- Easings: `expo.out` entradas, `power2.inOut` transições, `none` só em scrub.
- Entradas 0.8–1.4 s.

## 6. Assets do hero
| Asset | Status |
|---|---|
| Vídeo onda (Kling, 1280×716) | tem — cortar/reencodar |
| Símbolo SVG | vetorizado a partir do PNG — trocar pelo oficial quando chegar |
| Naming / slogan PNG | tem |
| Fontes | tem (GC Epic Pro é Demo — não usar no site por ora) |

## 7. Registro de construção — Hero (2026-09-28)
- Implementado em `site/src/components/ui/wave-hero.tsx` + `symbol-draw.tsx` (dados em `symbol-draw.json`).
- Vídeo: Kling 3.0 std (plano Starter não permite Pro), 1280×716, reencodado all-intra (2,6 MB). Frames mobile 1,7 MB.
- Símbolo: vetorizado do PNG oficial (potrace) + linha central por esqueletização; máscara com 25 segmentos de largura variável + ramo da crista. Vermelho do símbolo mantido como no arquivo oficial (#FD002A); UI usa o Vermelho Tático do manual (#DC0000).
- Título em Astoria Sans Extra Bold Condensed; rótulos em Astoria Sans.
- Modo escolhido em runtime: vídeo (ponteiro fino ≥768 px), canvas (toque ou <768 px), estático (reduced motion).
- Verificado em Chrome headless a 1440×900 e 390×844, e com reduced motion: sem erros de console.
- Mobile em retrato: vídeo vertical próprio (Kling std 9:16, 720×1276, `assets/hero/hero-onda-vertical-v1.mp4`) → `frames-p/` 50 quadros a 10 fps (3,5 MB) + `poster-p.webp`. Paisagem/tablet segue com `frames/` (54 quadros do vídeo 16:9).
- Som (2026-09-28): mar sintetizado em Web Audio (`site/src/lib/ocean-sound.ts`), sem arquivo. Botão "SOM" no canto sup. dir. Ligado por padrão: começa no 1º toque/clique/tecla em qualquer lugar (aviso "Toque na tela para ouvir o mar" até lá); desligar fica salvo em localStorage (bw-sound). Som segue o progresso suavizado da timeline (mesmo relógio da imagem); quebra em 0.5, junto do escurecimento. Grave + espuma com LFOs; intensidade segue o scroll (cresce até 0.45, estouro de quebra em 0.42, assenta no símbolo, silencia ao sair do hero ou trocar de aba). Pico medido 0,55, RMS −17 dBFS.
- SEO (2026-09-28): title/description focados em "Jiu-Jitsu em São Luís – MA"; Open Graph + Twitter com `og-image.jpg` 1200×630; JSON-LD `SportsClub` (sem endereço de rua/telefone até o cliente informar); canonical/URLs via `VITE_SITE_URL` em `site/.env`; robots.txt; apple-touch-icon; `<noscript>` com h1 e descrição.
