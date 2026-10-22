-- Dados de teste carregados antes de cada arquivo, dentro da mesma transação.
--
-- Usuários: professor (...0001), aluno de 14 anos (...00a1), aluno de 10 anos sem aceite (...00b1).
-- Cursos:   c1 publicado e com os dois alunos matriculados,
--           c2 publicado sem matrícula, c3 em rascunho com o aluno de 14 matriculado.

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'professor@testes-banco.local',
   '{"nome": "Professor"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'aluno@testes-banco.local',
   '{"nome": "Aluno", "data_nascimento": "2012-03-10", "menor_de_12": false}'),
  ('00000000-0000-0000-0000-0000000000b1', 'menor@testes-banco.local',
   '{"nome": "Menor", "data_nascimento": "2016-05-20", "menor_de_12": true}');

update public.perfis set papel = 'professor'
where id = '00000000-0000-0000-0000-000000000001';

insert into public.responsaveis (aluno_id, nome, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'Responsável', 'responsavel@testes-banco.local');

insert into public.cursos (id, titulo, instrumento, publicado) values
  ('c0000000-0000-0000-0000-000000000001', 'Violão I', 'violão', true),
  ('c0000000-0000-0000-0000-000000000002', 'Piano I', 'piano', true),
  ('c0000000-0000-0000-0000-000000000003', 'Violão II', 'violão', false);

insert into public.modulos (id, curso_id, titulo, ordem) values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Acordes', 1),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Escalas', 1),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Ritmos', 1);

-- e1 publicada, e2 em rascunho (ambas no curso c1), e3 publicada no curso em rascunho.
insert into public.aulas (id, modulo_id, titulo, ordem, publicada) values
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Lá menor', 1, true),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Pestana', 2, false),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Baião', 1, true);

insert into public.conteudos (id, aula_id, tipo, ordem, titulo, url) values
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'youtube', 1, 'Vídeo', 'https://youtu.be/abc'),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'prova', 2, 'Prova', 'https://docs.google.com/forms/d/x/viewform'),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'texto', 1, 'Rascunho', null);

insert into public.matriculas (aluno_id, curso_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-0000000000b1', 'c0000000-0000-0000-0000-000000000001');

insert into public.avisos (titulo, texto, curso_id) values
  ('Geral', 'Para todos', null),
  ('Violão I', 'Só para c1', 'c0000000-0000-0000-0000-000000000001'),
  ('Piano I', 'Só para c2', 'c0000000-0000-0000-0000-000000000002');
