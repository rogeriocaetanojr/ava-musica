-- A própria pessoa (aluno ou professor) corrige o nome no Meu perfil. Mesma
-- regra de definir_meu_nome (sem vazio, até 120 caracteres, conta sem
-- bloqueio), mas para quem já tem nome; a primeira vez continua na tela do
-- nome. O gatilho nome_so_pela_funcao segue barrando a mudança direta pela API.
create function public.alterar_meu_nome(p_nome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  limpo text := btrim(p_nome);
begin
  if auth.uid() is null then
    raise exception 'é preciso estar logado'
      using errcode = 'insufficient_privilege';
  end if;
  if limpo is null or limpo = '' or char_length(limpo) > 120 then
    raise exception 'nome inválido'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.perfis
  set nome = limpo
  where perfis.id = auth.uid()
    and perfis.nome is not null
    and perfis.bloqueado_em is null;

  if not found then
    raise exception 'perfil não encontrado'
      using errcode = 'no_data_found';
  end if;
end;
$$;

revoke all on function public.alterar_meu_nome(text) from public, anon;
grant execute on function public.alterar_meu_nome(text) to authenticated;
