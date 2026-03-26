# Doce Impacto D.I.A

Projeto pronto para deploy no Railway com Express, CSP configurada e front-end para Teachable Machine.

## Estrutura importante
- `public/index.html`
- `public/style.css`
- `public/script.js`
- `public/model/` -> coloque aqui `model.json`, `metadata.json` e `weights.bin`
- `server.js`

## Como rodar localmente
```bash
npm install
npm start
```

Depois abra:
```text
http://localhost:3000
```

## Deploy no Railway
1. Suba esta pasta para um repositório GitHub.
2. Crie um novo projeto no Railway.
3. Conecte o repositório.
4. Railway deve detectar Node automaticamente.
5. Faça o deploy.

## Observação
Se o navegador ainda mostrar problema com cache, use Ctrl+F5 ou abra em aba anônima.
