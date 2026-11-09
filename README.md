# aao-web

Painel web do **Alpha Agents Office** — React 18 + Vite + TypeScript + Tailwind v4 + RTK Query.

Interface do escritório: chat com agentes (SSE), onboarding com geração do
escritório por IA, base de conhecimento, dados estruturados, projetos/kanban,
canais (Telegram, e-mail, WhatsApp), conector local, assinaturas de provider,
auditoria, consumo de tokens e aprendizados dos agentes.

## Rodando

```bash
npm install
cp .env.example .env   # VITE_API_URL apontando para a aao-api
npm run dev            # http://localhost:5173
```

## Build de produção

```bash
npm run build          # gera dist/ estático (sirva em qualquer host)
```
# aao-web
