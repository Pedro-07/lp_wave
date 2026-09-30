# Black Wave — Pendências do site

Atualizado em 2026-09-30. Itens marcados [PREENCHER] no site dependem desta lista.

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
- [ ] Qual unidade está ativa; endereço e horários
- [ ] Data de abertura da segunda unidade
- [ ] Turmas: infantil, feminino, competição? Faixas etárias
- [ ] Números reais (alunos, anos de tatame, títulos) — nada será inventado

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
- [ ] Modalidades: idades, horários, confirmar turma feminina só de mulheres
- [ ] Kimonos: tamanhos disponíveis
- [ ] Depoimentos reais (frase, nome, faixa, tempo de treino) — 3 ou mais (o carrossel tem 6 espaços; sobra = remover)
- [ ] Foto de cada pessoa dos depoimentos (quadrada, rosto centralizado, ~400 px) — hoje há um espaço reservado com silhueta
- [ ] Endereço e horários da unidade São Luís
- [ ] Instagram oficial
- [ ] Confirmar crédito "Identidade visual: Double Ace" no rodapé
- [ ] Vídeo real de treino (substitui o gerado no Higgsfield)
- [ ] Fotos reais dos kimonos (idealmente 24–36 fotos girando cada modelo/cor) para substituir o 360° gerado por IA
