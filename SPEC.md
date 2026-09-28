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

### Seção 2 — A perturbação
Objetivo: fazer quem lê se reconhecer em um motivo para começar, e apresentar a tese da marca (a perturbação é direcionada).
Conteúdo (aprovado 2026-09-28, base: "A Filosofia da Marca" do manual):
- Rótulo: `02 — A perturbação`
- Título: **Todo mundo chega com alguma coisa.**
- Apoio: Ninguém pisa no tatame por acaso. Cada um traz uma inquietação.
- Lista: Vontade de evoluir. / Superar um limite. / Confiança. / Pertencer. / Saúde. / Competir. / Reconstruir a autoestima.
- Fecho: **Aqui, ela não é evitada. É direcionada.**
- Texto: A Black Wave existe para formar faixas pretas saudáveis, com excelência técnica e caráter sólido. Gente preparada para gerar impacto positivo na sociedade.
- CTA: Agendar aula experimental → `#aula-experimental`
Conceito v2 (2026-09-28): **"Da perturbação à faixa preta"** — wow nº 2 do site. A seção conta a jornada das faixas: cada motivo avança a graduação de uma faixa que atravessa a tela, de branca até a preta com ponteira vermelha (o fim do símbolo).
Decisões do cliente: faixa = 1 foto (Higgsfield) recolorida em código; progressão contínua de cor ao longo dos 7 motivos; rolagem com encaixe (snap) em cada frase.
Assets: `belt-texture.webp` (faixa branca real, fundo removido, horizontal com leve curva), `belt-body-mask.png` e `belt-bar-mask.png` (gerados a partir da foto: corpo e ponteira), contorno do símbolo (SVG já existente).
Layout desktop: col. 1–4 fixa com rótulo, título e apoio (como v1). Col. 5–12: uma frase por vez em display gigante, contador `01 / 07` + nome da faixa atual (`Branca`, `Azul`, `Roxa`, `Marrom`, `Preta`). Faixa atravessa a largura no terço inferior, por baixo do texto. Ao fundo, contorno do símbolo em ~6% de opacidade.
Layout mobile: título no topo, frase no meio, faixa na base (mais estreita).
Scroll (pin, ~65vh de rolagem por passo, scrub 0.6, snap por frase, sem travar a página):
- Passos 1–7: frase atual sai para cima por máscara (yPercent 0 → −100) e a próxima entra de baixo (100 → 0) em ~40% do passo; 60% parado para leitura. Rolar para trás volta.
- Cor da faixa: paradas em branca (passo 1) → azul → roxa → marrom → preta (passo 7). Cada troca é uma "tinta" que corre ao longo do tecido (máscara em gradiente, esquerda → direita), preservando a textura. Ponteira preta nas coloridas; vira vermelha (#FD002A) junto com a faixa preta.
- Passo final: frase sai; entra o fecho **Aqui, ela não é evitada. / É direcionada.** (reveal por linha). Depois o pin solta; texto + CTA seguem no fluxo normal.
- Parallax: faixa desliza x −3% → 3% e ondula levemente; contorno do símbolo y +10% → −10% (mais lento); frases com leve deslocamento próprio.
Entrada: título/apoio com reveal por linha (como v1).
Reduced motion: sem pin; lista estática em branco; faixa preta parada.
Motivo da v2: na v1 (lista livre) rolagens rápidas pulavam frases — sem controle de ritmo.

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
- Som (2026-09-28): mar sintetizado em Web Audio (`site/src/lib/ocean-sound.ts`), sem arquivo. Modal de som (`sound-gate.tsx`, diálogo em portal sobre o hero — fundo escurecido com blur leve, cartão central no desktop e na base no celular; o hero abre normalmente por trás): citação de Jostein Gaarder (abertura do manual) + "Toque/Clique em qualquer lugar e entre ouvindo o mar." + "Entrar sem som". Toque em qualquer ponto ou Enter/Espaço = com som; Esc/"Entrar sem som" = sem som (salvo em localStorage bw-sound, e a tela não volta). Rolagem travada enquanto aberta; Botão "SOM" no canto sup. dir. liga/desliga depois. Som segue o progresso suavizado da timeline (mesmo relógio da imagem); quebra em 0.5, junto do escurecimento. Grave + espuma com LFOs; intensidade segue o scroll (cresce até 0.45, estouro de quebra em 0.42, assenta no símbolo, silencia ao sair do hero ou trocar de aba). Pico medido 0,55, RMS −17 dBFS.
- SEO (2026-09-28): title/description focados em "Jiu-Jitsu em São Luís – MA"; Open Graph + Twitter com `og-image.jpg` 1200×630; JSON-LD `SportsClub` (sem endereço de rua/telefone até o cliente informar); canonical/URLs via `VITE_SITE_URL` em `site/.env`; robots.txt; apple-touch-icon; `<noscript>` com h1 e descrição.
- Seção 2 v2 (2026-09-28): implementada em `perturbation-section.tsx`. Faixa A do Higgsfield (`assets/faixa/faixa-A.png`, fundo transparente) recolorida offline em 5 WebP (`site/public/faixa/`, 2000 e 1000 px) e empilhada com máscara `.belt-wipe` (--wipe 100% → 0%). Pin de 7,5 passos × 70vh, snap sem inércia (a inércia jogava a rolagem para o início/fim e pulava frases). Frases escondidas a 120% (acentos das maiúsculas vazavam a 100%). Verificado a 1440 e 390 px e com reduced motion.
- Ajuste (2026-09-28): janelas das frases com folga (pt 0.25em / pb 0.15em, compensadas por margem negativa) para não cortar acentos; frases fora de cena com autoAlpha 0 e deslocamento de 140% — em repouso só a frase atual é visível (medido em todos os passos, 1440 e 390 px).
