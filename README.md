# MydevPage

Landing page pessoal: sobre mim e projetos em destaque. HTML, CSS e JavaScript puros, sem build.

## Ver no computador

```bash
python3 -m http.server 8000 -d public
```

Abra http://localhost:8000.

## Publicar na Cloudflare (plano grátis)

**Pelo terminal** (Workers com arquivos estáticos):

```bash
npx wrangler login
npx wrangler deploy
```

O endereço aparece no final, no formato `mydevpage.<sua-conta>.workers.dev`.
O nome vem do `wrangler.jsonc`.

**Pelo painel, com deploy automático a cada push:** em *Workers & Pages*, crie uma aplicação
importando este repositório do GitHub. Deixe o comando de build vazio e use
`npx wrangler deploy` como comando de deploy.

## Editar

- Textos e projetos: `public/index.html`
- Cores e layout: `public/style.css` (as cores ficam no `:root`)
- Animações, galeria do NAM e demos: `public/main.js`
- Capturas de tela do NAM Chain Capture: `public/assets/nam-*.webp`
- Foto: `public/assets/joao.webp`
