-- O aceite gravado pela página pública libera o menor de 12, e o mesmo token
-- não grava de novo.

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert not public.aluno_liberado(), 'menor sem aceite não deveria estar liberado';
end;
$$;

-- Mesma gravação do servidor: só onde o aceite ainda está vazio.
reset role;
do $$
declare
  token_do_aceite text;
  gravados integer;
begin
  select token into token_do_aceite from public.responsaveis
  where aluno_id = '00000000-0000-0000-0000-0000000000b1';

  update public.responsaveis set aceito_em = now(), versao_termos = '1-rascunho'
  where token = token_do_aceite and aceito_em is null;
  get diagnostics gravados = row_count;
  assert gravados = 1, 'o primeiro aceite deveria ser gravado';

  update public.responsaveis set aceito_em = now(), versao_termos = '1-rascunho'
  where token = token_do_aceite and aceito_em is null;
  get diagnostics gravados = row_count;
  assert gravados = 0, 'o token já usado não deveria gravar de novo';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

do $$
begin
  assert public.aluno_liberado(), 'depois do aceite o menor deveria estar liberado';
end;
$$;
