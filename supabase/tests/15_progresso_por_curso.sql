-- progresso_por_curso conta o progresso no banco, por aluno e curso, mesmo
-- com mais de 1000 registros (o limite de linhas da API), e respeita a RLS.

-- 1200 aulas publicadas a mais no curso c1 (módulo d1), cada uma com uma prova.
insert into public.aulas (id, modulo_id, titulo, ordem, publicada)
select
  ('e1000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'd0000000-0000-0000-0000-000000000001',
  'Aula ' || n,
  10 + n,
  true
from generate_series(1, 1200) as n;

insert into public.conteudos (id, aula_id, tipo, ordem, titulo, url)
select
  ('f1000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  ('e1000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'prova',
  1,
  'Prova ' || n,
  'https://docs.google.com/forms/d/x/viewform'
from generate_series(1, 1200) as n;

-- Aluno a1 conclui as 1200 aulas novas e envia as 1200 provas: 2400 registros.
-- Metade das aulas foi há 30 dias; a outra metade, ontem.
insert into public.progresso (aluno_id, aula_id, conteudo_id, concluido_em)
select
  '00000000-0000-0000-0000-0000000000a1',
  ('e1000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  null,
  case when n <= 600 then now() - interval '30 days'
       else now() - interval '1 day' + n * interval '1 second' end
from generate_series(1, 1200) as n;

insert into public.progresso (aluno_id, aula_id, conteudo_id, concluido_em)
select
  '00000000-0000-0000-0000-0000000000a1',
  ('e1000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  ('f1000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  now() - interval '1 day'
from generate_series(1, 1200) as n;

-- A aula em rascunho e2 concluída não entra nas aulas concluídas, mas entra
-- na semana (o painel sempre contou assim).
insert into public.progresso (aluno_id, aula_id, conteudo_id, concluido_em) values
  ('00000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-000000000002', null, now());

-- Aluno b1 (menor sem aceite) com um registro gravado pelo professor.
insert into public.progresso (aluno_id, aula_id, conteudo_id) values
  ('00000000-0000-0000-0000-0000000000b1', 'e0000000-0000-0000-0000-000000000001', null);

set local role authenticated;

-- Professor: vê as contagens de todos, já agregadas.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$
declare
  linha record;
begin
  select * into strict linha from public.progresso_por_curso()
  where aluno_id = '00000000-0000-0000-0000-0000000000a1'
    and curso_id = 'c0000000-0000-0000-0000-000000000001';

  assert linha.aulas_concluidas = 1200,
    format('a1 deveria ter 1200 aulas concluídas em c1, veio %s', linha.aulas_concluidas);
  assert linha.provas_enviadas = 1200,
    format('a1 deveria ter 1200 provas enviadas em c1, veio %s', linha.provas_enviadas);
  assert linha.aulas_na_semana = 601,
    format('a1 deveria ter 601 aulas na semana (600 + rascunho), veio %s', linha.aulas_na_semana);
  assert linha.ultima_aula_id = 'e1000000-0000-0000-0000-000000001200',
    'a última aula publicada concluída de a1 deveria ser a 1200';

  assert (select count(*) from public.progresso_por_curso()) = 2,
    'o professor deveria ver uma linha para a1 e outra para b1';

  assert (select count(*) from public.progresso_por_curso('00000000-0000-0000-0000-0000000000b1')) = 1,
    'o filtro por aluno deveria devolver só a linha de b1';
end;
$$;

-- Aluno a1: vê só a própria linha, com as mesmas contagens.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  assert (select count(*) from public.progresso_por_curso()) = 1,
    'o aluno deveria ver só a própria linha';
  assert (select aulas_concluidas from public.progresso_por_curso()) = 1200,
    'o aluno deveria ver as próprias 1200 aulas concluídas';
  assert (select count(*) from public.progresso_por_curso('00000000-0000-0000-0000-0000000000b1')) = 0,
    'o aluno não deveria ver o progresso de outro aluno';
end;
$$;

-- Menor sem aceite: a RLS não deixa ver nada, nem o próprio progresso.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert (select count(*) from public.progresso_por_curso()) = 0,
    'o menor sem aceite não deveria ver progresso';
end;
$$;

-- Visitante sem login não executa a função.
reset role;
set local role anon;

do $$
begin
  perform public.progresso_por_curso();
  raise exception 'anon não deveria executar progresso_por_curso';
exception
  when insufficient_privilege then null;
end;
$$;
