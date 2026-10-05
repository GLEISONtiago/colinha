# Supabase

Esta pasta contém o necessário para recriar o backend do projeto.

## 1. Criar o esquema

No SQL Editor do Supabase, execute:

- `schema.sql`

Isso cria:

- `public.candidates`
- índices de consulta
- RLS com leitura pública
- bucket público `candidate-photos`

As escritas permanecem administrativas e são feitas com `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Teste opcional

Para popular rapidamente um projeto vazio com dados fictícios:

- execute `seed-demo.sql`

O frontend também possui um modo demonstração local e não depende desse seed.

## 3. Configurar o frontend

Copie `.env.example` para `.env.local` e informe:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

## 4. Importar dados do TSE

Consulte `scripts/README.md`.
