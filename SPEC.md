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
- Lista (v3, 5 motivos — 1 por faixa): Vontade de evoluir. (branca) / Superar um limite. (azul) / Confiança. (roxa) / Pertencer. (marrom) / Reconstruir a autoestima. (preta). Saíram "Saúde." e "Competir." a pedido do cliente.
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

### Seções 3–10 — plano aprovado (2026-09-29)
Decisões do cliente: vídeo de treino gerado no Higgsfield (placeholder até o real); imagens das modalidades no Higgsfield no estilo da marca; 360° fotográfico (sequência de quadros) para os kimonos; formulário de aula experimental em **gaveta lateral** aberta por todos os CTAs "Agendar"; pedidos de aula vão para o **WhatsApp** (mensagem montada a partir do formulário). Momentos wow: hero (1), faixa (2), Gear 360° (3) — as demais seções usam só reveals e parallax sutis.
Material extra do Drive: `brand/tags/` (etiqueta vertical de kimono, etiqueta de faixa, patch quadrado com texto circular) — usar como referência na geração dos kimonos, pontos de detalhe no 360°, faixa de texto da divisória e selo girando no rodapé.

### Seção 3 — O tatame (vídeo)
Conteúdo: legenda na janela *"O que acontece nas profundezas."*; em tela cheia **Técnica, suor e constância.**; botões "Assistir com som" e **Conheça as modalidades ↓**.
Assets: vídeo P&B de treino (Higgsfield), 16:9 (desktop) e 9:16 (mobile), sem rostos em destaque (mãos na gola, pés no tatame, faixa sendo amarrada, silhuetas); poster de cada.
Scroll: pin curto; o vídeo começa numa janela ~40% da largura (clip-path inset), em P&B e levemente desfocado, e se expande até tela cheia (clip-path → 0, filtro → nítido); legenda sai, frase de tela cheia entra por palavras. Vídeo mudo em loop; "Assistir com som" liga o áudio do vídeo e silencia o mar.
Reduced motion: vídeo em tela cheia parado no poster, com play manual.

### Seção 4 — Modalidades
Título: **Escolha por onde entrar.**
- Jiu-Jitsu Gi — A arte com kimono. Pegadas, alavancas e paciência. Para quem é: iniciantes e graduados, a partir de [PREENCHER] anos.
- No-Gi — Sem kimono, mais ritmo. Controle pelo corpo, não pelo tecido.
- Defesa pessoal — Sair de agarrões, controlar e ficar de pé. Jiu-Jitsu para a vida real.
- Kids — Disciplina e confiança desde cedo. Idades: [PREENCHER].
- Feminino — Turma só de mulheres [CONFIRMAR]. Mesmo tatame, mesma exigência técnica.
Cada painel: "Horários: [PREENCHER]" + CTA **Agendar aula de [modalidade]** (abre a gaveta com a modalidade marcada).
Layout: carrossel horizontal de arrastar; painéis altos com imagem sangrada, número gigante, nome em display; painel ativo expande.

### Seção 5 — Gear (divisória + 360°)
Divisória: faixa com "GEAR" gigante + texto corrido "BLACK WAVE BRAZILIAN JIU JITSU" (do patch).
Título: **Vista a onda.**
- Kimono Basic — Linha essencial para treinos regulares.
- Kimono Premium — Feito com fornecedores nacionais de referência. Tecido de alta resistência, acabamento superior e durabilidade para treino intenso e competição.
Cores Branco/Preto; tamanhos [CONFIRMAR]; "Arraste para girar"; pontos de detalhe (etiqueta da gola, patch).
CTA **Quero este kimono** → WhatsApp: "Olá, Black Wave! Tenho interesse no Kimono {modelo} {cor}. Pode me passar tamanhos e valores?"

### Seção 6 — Vozes do tatame
Título: **Quem já está no tatame.** 3 depoimentos [PREENCHER] (frase, nome, faixa, tempo de treino). Um por vez em tipografia grande; assinatura com faixa na cor da graduação desenhada no traço do símbolo. Nada inventado.

### Seção 7 — Ouvidoria
Home: **Fale sem se identificar.** / Sugestões, críticas ou denúncias chegam à gestão da equipe. Não pedimos nome, e-mail ou telefone. / CTA **Abrir a ouvidoria**.
Página `/ouvidoria`: selo "Anônima"; "Este formulário não pede nem registra dados que identifiquem você."; Sugestão / Crítica / Denúncia + "Sua mensagem"; botão **Enviar anonimamente**; confirmação "Recebido. Obrigado por ajudar a direcionar a onda."
Envio: função serverless na Vercel → e-mail (destino em variável de ambiente, cadastrado depois); anti-spam sem identificação (honeypot + tempo mínimo).

### Seção 8 — Fecho
**Sem perturbação, não existe movimento. Sem movimento, não existe onda.** / *Toda inquietação que você trouxer, a gente direciona.* / Just Flow / CTA **Agendar aula experimental**.

### Seção 9 — Onde estamos
**São Luís — MA**; endereço [PREENCHER]; horários [PREENCHER]; CTAs **Como chegar** (Google Maps) e **Chamar no WhatsApp**; mapa escuro P&B.

### Seção 10 — Rodapé
Logo, Just Flow, links (Modalidades, Gear, Ouvidoria, Instagram [PREENCHER]), "© 2026 Black Wave Jiu Jitsu Team — São Luís, MA", "Identidade visual: Double Ace" [CONFIRMAR], selo circular girando.

### Gaveta — Aula experimental
Título **Aula experimental**; campos nome, WhatsApp, modalidade (pré-marcada), idade, experiência (nunca treinou / faixa); botão **Quero agendar** → abre o WhatsApp com a mensagem montada.

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
- v3 (2026-09-29): passos 0 abertura (título + apoio sozinhos; saem quando o 1º motivo entra) → 1–5 motivos (1 por faixa; a cor nova corre pelo tecido junto com a troca de frase + leve pulso na faixa) → 6 fecho; TOTAL 6,5 × 70vh. Faixa desliza para a cena com o 1º motivo. Transição por palavras (SplitText words, sem máscara): saída sobe 50% e desfoca, entrada sobe de 60% e ganha foco. A entrada da abertura anima os blocos, nunca as palavras (evita conflito com a timeline ao chegar direto num passo adiante). Testado: salto direto p/ passos 1 e 3, rodinha rápida, ida e volta — sempre 1 cena visível.
- Fecho em 2 passos (2026-09-29): passo 6 "Aqui, ela não é evitada." entra sozinha em branco; passo 7 ela apaga para 60% (opacidade nas palavras, não cor herdada — Safari) e "É direcionada." entra em branco. TOTAL 7,5 × 70vh.
- Seção 3 construída (2026-09-29): `training-video-section.tsx`. Vídeos Kling std 10 s com áudio nativo (4 cortes: golas, pés, clinch em contraluz, faixa preta), 16:9 1276×720 e 9:16 720×1276, ~1,8 MB cada (`site/public/tatame/`). Pin 1,4 × altura: clip-path inset(24% 28%) → 0, brilho 0.55 → 1, blur 4 → 0. Toca só visível (IntersectionObserver); ao sair pausa e volta a mudo. Custo: 2 cr (quadros) + 35 cr (vídeos).
