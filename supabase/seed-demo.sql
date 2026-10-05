-- Dados fictícios opcionais para testar um Supabase recém-criado.
-- Não representam pessoas, partidos ou candidaturas reais.

insert into public.candidates (
  election_year, uf, office, candidate_number, ballot_name, full_name,
  party_abbreviation, party_number, tse_candidate_id,
  inserted_in_urn, is_substituted, candidate_urn_status, judgement_status
) values
(2026,'PB','DEPUTADO FEDERAL','1234','CANDIDATURA DEMO','Candidatura demonstrativa Federal','DEMO',12,'demo-pb-fed-1234',true,false,'DEMONSTRAÇÃO','DEMONSTRAÇÃO'),
(2026,'PB','DEPUTADO ESTADUAL','12345','CANDIDATURA DEMO','Candidatura demonstrativa Estadual','DEMO',12,'demo-pb-est-12345',true,false,'DEMONSTRAÇÃO','DEMONSTRAÇÃO'),
(2026,'PB','SENADOR','123','CANDIDATURA DEMO','Candidatura demonstrativa Senado A','DEMO',12,'demo-pb-sen-123',true,false,'DEMONSTRAÇÃO','DEMONSTRAÇÃO'),
(2026,'PB','SENADOR','124','CANDIDATURA DEMO B','Candidatura demonstrativa Senado B','DEMO',12,'demo-pb-sen-124',true,false,'DEMONSTRAÇÃO','DEMONSTRAÇÃO'),
(2026,'PB','GOVERNADOR','12','CANDIDATURA DEMO','Candidatura demonstrativa Governo','DEMO',12,'demo-pb-gov-12',true,false,'DEMONSTRAÇÃO','DEMONSTRAÇÃO'),
(2026,'BR','PRESIDENTE','13','CANDIDATURA DEMO','Candidatura demonstrativa Presidência','DEMO',13,'demo-br-pres-13',true,false,'DEMONSTRAÇÃO','DEMONSTRAÇÃO')
on conflict (election_year, tse_candidate_id) do nothing;
