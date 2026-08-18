# BRAZA TECH — PRD

## Problema original
Plataforma completa de e-commerce/vitrine de tecnologia brasileira (BRAZA TECH), com curadoria, links de afiliados,
carrinho, cupons, checkout, painel administrativo, SAC/WhatsApp, FAQ, SEO e responsividade mobile-first.
Slogan: "Tecnologia que conecta. Confiança que entrega."

## Decisões de arquitetura
- Stack do ambiente: React (CRA/JS) + FastAPI + MongoDB (substitui Vite/TS/Supabase, aprovado pelo usuário).
- Autenticação JWT própria (cookies httpOnly + Bearer), perfis `customer` / `admin`, brute-force lockout, reset de senha.
- Preços, cupons, frete e estoque recalculados SEMPRE no servidor (`price_cart`).
- Mercado Pago Checkout Pro: preferência criada no backend, webhook com validação HMAC. Access Token só no servidor.
- DEMO_MODE=true: 18 produtos demonstrativos com `price_is_demo` (rótulo "Preço demonstrativo"). Zero avaliações,
  pedidos, depoimentos ou históricos de preço fictícios.

## Personas
- Visitante/cliente: pesquisa, compara, favorita, compra ou vai ao parceiro.
- Administrador: gerencia catálogo, preços, estoque, pedidos, cupons, avaliações, banners, depoimentos, SAC, configurações.

## Implementado (18/06/2026)
- Loja: home, produtos com filtros (sidebar desktop / modal mobile), categorias, ofertas, página de produto
  (galeria, abas, histórico de preço, relacionados), favoritos, carrinho persistente, cupons, frete, checkout, pedido.
- Afiliados: tipo `affiliate` vs `own_store`, botão do fornecedor em nova aba + aviso de comissão.
- Admin: dashboard com gráficos (Recharts), produtos (CRUD + confirmação), categorias, estoque, pedidos (status + baixa
  de estoque), clientes, cupons, avaliações (moderação), banners, depoimentos, atendimento, configurações.
- SAC com formulário salvo no banco, FAQ, Sobre, Termos/Privacidade, WhatsApp contextual, SEO dinâmico + sitemap + robots.
- Testes: 33 casos backend (97% → 100% após fix do rate-limit) + Playwright frontend 100%.

## Backlog priorizado
- P0: credenciais do Mercado Pago (MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET) e catálogo real do usuário.
- P1: e-mails transacionais (Resend), upload de imagens de produto, autocomplete de CEP (ViaCEP).
- P2: analytics, recuperação de carrinho, área de trocas/devoluções, exportação de relatórios.

## Próximas tarefas
1. Cadastrar credenciais MP e testar pagamento PIX/cartão ponta a ponta.
2. Importar catálogo real e desligar DEMO_MODE.
3. E-mails transacionais de pedido/pagamento.
