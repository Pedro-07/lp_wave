# Black Wave — Pendências do site

Atualizado em 2026-10-29. Itens marcados [PREENCHER] no site dependem desta lista.

## Briefing já respondido
- Tipo: site de lançamento da marca
- Ação principal: formulário de **aula experimental**
- Unidade no site: só São Luís (MA). Imperatriz existe na marca, mas fica fora do site por decisão do cliente
- Movimento: marcante
- A marca NÃO é: academia de bairro, corporativa, marca de surf
- Fontes: cliente declara ter licença web de Varien, GC Epic Pro e Astoria
- Material de marca: manual (PDF) + logos PNG + fontes em `brand/`

## Conteúdo (cliente)
- [ ] Professores: nome, faixa/grau, linhagem, tempo de ensino, títulos reais
  - Sugestão (2026-09-30): seção curta de professores, no formato compacto dos depoimentos (foto, nome, faixa, linhagem) — ainda não existe no site; propor ao cliente
- [ ] Diferencial concreto da equipe (um fato, não adjetivo)
- [~] Qual unidade está ativa; endereço e horários — **horários recebidos** (2026-10-28, grade noturna); falta o endereço
- [ ] Data de abertura da segunda unidade
- [x] Turmas (2026-10-28): Iniciantes, Kids (9 a 12 anos), Geral, Feminina, Corujão e No-Gi — seg a sáb, aulas de 60 min. Grade em `site/src/config.ts` (GRADE)
  - [ ] Confirmar o público de Geral, Corujão e No-Gi (o site diz "Todas as faixas") e se há idade mínima nas turmas de adultos
- [ ] Números reais (alunos, anos de tatame, títulos) — nada será inventado

## Material recebido (2026-10-28) — `assets/cliente-2026-10-28/`
- `planos/`: carrossel de planos da inauguração → nova **Seção 5 — Planos** (`plans-section.tsx`): Mensal Essential R$ 220, Semestral Evolution R$ 205, Anual Experience R$ 190, Fundador (Founders Club, 30 vagas) R$ 170. Cada plano abre o WhatsApp com o plano na mensagem
  - [ ] Confirmar com o cliente: publicar preços no site está ok? Até quando vale o Fundador e como avisar quando as 30 vagas acabarem (hoje é texto fixo)
  - [ ] "Chame no direct" (Instagram) — o site manda para o WhatsApp; confirmar canal
- `grade-horarios/`: turmas e horários → carrossel de turmas, "Onde estamos" e dados estruturados (openingHours)
- `wave-profile.md`: ficha de avaliação inicial → página **/wave-profile/** (seções 01–05 + termo, em etapas; envio pelo WhatsApp, nada salvo). A seção 06 é do professor e não entra no site
  - [ ] Equipe: mandar o link `/wave-profile/` para quem agendar a aula experimental
  - [ ] O termo cita "a política de privacidade da equipe" — ela ainda não existe; precisa de uma página (a ficha tem dados de saúde, LGPD)
  - [ ] Ficha de criança (Kids): hoje é a mesma ficha; confirmar se o responsável preenche e se precisa de campos do responsável
- Foto do Corujão: `assets/tatame/inicio-v.png` (gerada por IA, como as demais) → `site/public/modalidades/corujao.webp`
- Seções renumeradas: 05 Planos (logo depois das turmas), 06 Kimonos, 07 Vozes, 08 Ouvidoria, 09 Just Flow, 10 Onde estamos

## Formulário
- [x] Campos definidos (2026-09-30, versão curta): modalidade + nome (obrigatório); idade e experiência opcionais. Sem campo WhatsApp — a pessoa já envia pelo próprio WhatsApp
- [x] Destino: WhatsApp (mensagem montada pela gaveta)

## Assets
- [ ] Logo e símbolo em **SVG** (pedir à Double Ace) — hoje só PNG
- [ ] Fotos dos professores: qualidade (profissional / celular?)
- [ ] Fotos reais de treino e das unidades (as do manual são IA)
- [ ] GC Epic Pro: arquivo da versão licenciada (o do Drive é *Demo*); ideal `.woff2`
- [x] Vídeo do hero — gerado no Higgsfield (Kling), usado só o trecho da onda

## Referências e técnico
- [ ] 3 a 10 sites de referência + o que agrada em cada
- [ ] Domínio e hospedagem
- [ ] Prazo
- [ ] Idiomas (só PT?)
- [ ] Analytics / pixel? (medir cliques nos botões de aula e WhatsApp)
- [ ] Testar em celular real (iPhone e Android): arraste das modalidades, trilha, barra de ação

## Decisões registradas
- Hero inspirado no MetroHero (21st.dev), **sem travar a página**: pin com GSAP ScrollTrigger + scrub; sequência de imagens no mobile/iOS.
- Não usar fotos de banco nem ícones genéricos no lugar das logos.
- [ ] Confirmar o vermelho: manual diz #DC0000, arquivos do símbolo usam #FD002A
- [ ] Revisar o hero no celular real (iPhone/Android)
- [ ] SEO: hoje em https://lp-wave.vercel.app — ao ter domínio próprio, trocar `VITE_SITE_URL` em `site/.env`, criar sitemap.xml e cadastrar no Google Search Console
- [ ] SEO local: endereço, telefone e horários para o JSON-LD e para o Perfil da Empresa no Google

## Seções 3–10 (plano aprovado 2026-09-29)
- [~] **Número do WhatsApp**: provisório (98) 98855-8687 em `site/src/config.ts` — confirmar o definitivo
- [ ] **Ativar a ouvidoria** (hoje responde "está sendo configurada"):
  1. **Banco (obrigatório):** Vercel → projeto lp-wave → Storage (ou Marketplace) → **Upstash for Redis** → criar (plano grátis) e conectar ao projeto. Isso cria sozinho as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL/_TOKEN`).
  2. **Senha do painel (obrigatório):** Settings → Environment Variables → `OUVIDORIA_ADMIN_TOKEN` = uma senha longa (a equipe usa em /ouvidoria/gestao/).
  3. **Aviso por e-mail (opcional):** conta grátis em resend.com → `RESEND_API_KEY`, `OUVIDORIA_TO` (e-mail que recebe; vários separados por vírgula) e, se tiver domínio verificado no Resend, `OUVIDORIA_FROM`. Sem domínio, o Resend só entrega para o e-mail dono da conta.
  4. Deployments → **Redeploy** para as variáveis valerem.
- [x] Modalidades → viraram as 6 turmas da grade, com dias e horários (2026-10-29). "Defesa pessoal" saiu (não existe como turma)
- [ ] Kimonos: tamanhos disponíveis
- [ ] Depoimentos reais (frase, nome, faixa, tempo de treino) — 3 ou mais (o carrossel tem 6 espaços; sobra = remover)
- [ ] Foto de cada pessoa dos depoimentos (quadrada, rosto centralizado, ~400 px) — hoje há um espaço reservado com silhueta
- [~] Endereço da unidade São Luís (horários já no site: "Segunda a sábado, das 18h às 21h30")
- [ ] Instagram oficial
- [ ] Confirmar crédito "Identidade visual: Double Ace" no rodapé
- [ ] Vídeo real de treino (substitui o gerado no Higgsfield)
- [ ] Fotos reais dos kimonos (idealmente 24–36 fotos girando cada modelo/cor) para substituir o 360° gerado por IA
