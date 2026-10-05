# Importação dos Dados Abertos do TSE

Os scripts desta pasta são opcionais. O frontend funciona sem Supabase em **modo demonstração**.

Para usar dados reais, crie primeiro o banco com `supabase/schema.sql`, configure as variáveis administrativas e baixe os arquivos oficiais do TSE.

## Variáveis locais

Crie um arquivo `.env.import.local` ou exporte no terminal:

```text
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
PHOTO_IMPORT_CONCURRENCY=8
```

> A `SUPABASE_SERVICE_ROLE_KEY` é administrativa. Nunca use essa chave no navegador ou faça commit dela.

## Candidaturas + situação de urna

O importador aceita o ZIP principal e o ZIP de informações complementares. O segundo arquivo é usado para identificar registros inseridos na urna, substituições e situação de julgamento.

```powershell
node scripts/import-tse.mjs `
  --candidates="$env:USERPROFILE\Downloads\consulta_cand_2026.zip" `
  --complementary="$env:USERPROFILE\Downloads\consulta_cand_complementar_2026.zip"
```

## Fotos por UF

Exemplo para a Paraíba:

```powershell
node scripts/import-photos.mjs `
  --photos="$env:USERPROFILE\Downloads\foto_cand2026_PB_div.zip" `
  --uf=PB
```

Para Presidência, use `--uf=BR`.

O script envia as imagens para o bucket público `candidate-photos` e grava a URL em `public.candidates.photo_url`.

## GitHub Actions

Os workflows em `.github/workflows/` ficam disponíveis para execução **manual**. Em um fork, crie os secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Os arquivos são obtidos do CDN oficial do TSE durante a execução.
