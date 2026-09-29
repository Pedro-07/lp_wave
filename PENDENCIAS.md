# Black Wave — Pendências do site

Atualizado em 2026-09-28. Itens marcados [PREENCHER] no site dependem desta lista.

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
- [ ] Diferencial concreto da equipe (um fato, não adjetivo)
- [ ] Qual unidade está ativa; endereço e horários
- [ ] Data de abertura da segunda unidade
- [ ] Turmas: infantil, feminino, competição? Faixas etárias
- [ ] Números reais (alunos, anos de tatame, títulos) — nada será inventado

## Formulário
- [ ] Confirmar campos: nome, WhatsApp, unidade, idade, experiência
- [ ] Destino dos dados: e-mail, Google Sheets ou WhatsApp

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
- [ ] Analytics / pixel?

## Decisões registradas
- Hero inspirado no MetroHero (21st.dev), **sem travar a página**: pin com GSAP ScrollTrigger + scrub; sequência de imagens no mobile/iOS.
- Não usar fotos de banco nem ícones genéricos no lugar das logos.
- [ ] Confirmar o vermelho: manual diz #DC0000, arquivos do símbolo usam #FD002A
- [ ] Revisar o hero no celular real (iPhone/Android)
- [ ] SEO: hoje em https://lp-wave.vercel.app — ao ter domínio próprio, trocar `VITE_SITE_URL` em `site/.env`, criar sitemap.xml e cadastrar no Google Search Console
- [ ] SEO local: endereço, telefone e horários para o JSON-LD e para o Perfil da Empresa no Google

## Seções 3–10 (plano aprovado 2026-09-29)
- [~] **Número do WhatsApp**: provisório (98) 98855-8687 em `site/src/config.ts` — confirmar o definitivo
- [ ] **E-mail da ouvidoria** (variável de ambiente na Vercel)
- [ ] Modalidades: idades, horários, confirmar turma feminina só de mulheres
- [ ] Kimonos: tamanhos disponíveis
- [ ] Depoimentos reais (frase, nome, faixa, tempo de treino) — 3 ou mais
- [ ] Endereço e horários da unidade São Luís
- [ ] Instagram oficial
- [ ] Confirmar crédito "Identidade visual: Double Ace" no rodapé
- [ ] Vídeo real de treino (substitui o gerado no Higgsfield)
