# Importação TSE 2026

O importador lê o ZIP oficial de candidaturas do TSE e carrega apenas os cargos usados pelo protótipo: Deputado Federal, Deputado Estadual, Senador e Governador da PB, além de Presidente (BR).

## Preparação

```bash
cp .env.example .env.import.local
```

Preencha `SUPABASE_SERVICE_ROLE_KEY` apenas no arquivo local. Não publique essa chave.

## Executar

PowerShell:

```powershell
Get-Content .env.import.local | ForEach-Object {
  if ($_ -match '^([^#][^=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') }
}
npm run import:tse -- --candidates="C:\caminho\consulta_cand_2026(1).zip"
```

O script faz upsert por `election_year + tse_candidate_id`, portanto uma nova execução atualiza os mesmos registros sem depender apenas do número do candidato.
