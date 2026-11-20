-- O aceite gravado pela página pública libera o menor de 12, e o mesmo código
-- não grava de novo.

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert not public.aluno_liberado(), 'menor sem aceite não deveria estar liberado';
end;
$$;

-- Mesma gravação do servidor: só pelo hash do código, dentro do prazo e onde
-- o aceite ainda está vazio.
reset role;
update public.responsaveis
set token_hash = encode(sha256('codigo-do-teste'::bytea), 'hex'),
    expira_em = now() + interval '7 days'
where aluno_id = '00000000-0000-0000-0000-0000000000b1';

do $$
declare
  hash_do_codigo text := encode(sha256('codigo-do-teste'::bytea), 'hex');
  gravados integer;
begin
  update public.responsaveis set aceito_em = now(), versao_termos = '1-rascunho'
  where token_hash = hash_do_codigo and aceito_em is null and expira_em > now();
  get diagnostics gravados = row_count;
  assert gravados = 1, 'o primeiro aceite deveria ser gravado';

  update public.responsaveis set aceito_em = now(), versao_termos = '1-rascunho'
  where token_hash = hash_do_codigo and aceito_em is null and expira_em > now();
  get diagnostics gravados = row_count;
  assert gravados = 0, 'o código já usado não deveria gravar de novo';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert public.aluno_liberado(), 'depois do aceite o menor deveria estar liberado';
end;
$$;
