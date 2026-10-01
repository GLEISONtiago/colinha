# Importação TSE 2026

## Candidaturas

```powershell
node scripts/import-tse.mjs --candidates="$env:USERPROFILE\Downloads\consulta_cand_2026.zip"
```

## Fotos da Paraíba

O bucket público `candidate-photos` já existe no Supabase. O script extrai o `SQ_CANDIDATO` do nome de cada foto, envia a imagem e atualiza `candidates.photo_url`.

```powershell
node scripts/import-photos.mjs --photos="D:\Users\gleis\Downloads\foto_cand2026_PB_div.zip"
```

A `SUPABASE_SERVICE_ROLE_KEY` é usada somente no processo local de importação e nunca deve ser enviada ao GitHub ou usada no frontend.
