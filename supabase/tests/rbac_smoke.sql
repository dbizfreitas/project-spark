-- Suíte de verificação do RBAC.
-- Roda inteiramente dentro de uma transação com ROLLBACK: não deixa resíduo.
-- Colar no SQL Editor do Supabase e executar por completo.
BEGIN;

-- ============================================================
-- Seção 1 — Estrutura (Task 1)
-- ============================================================
DO $$
BEGIN
  IF to_regclass('public.invitations') IS NULL THEN
    RAISE EXCEPTION 'FALHA 1.1: tabela public.invitations não existe';
  END IF;
  IF to_regclass('public.role_audit_log') IS NULL THEN
    RAISE EXCEPTION 'FALHA 1.2: tabela public.role_audit_log não existe';
  END IF;
  IF to_regproc('private.can_view_board') IS NULL THEN
    RAISE EXCEPTION 'FALHA 1.3: função private.can_view_board não existe';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_key' AND conrelid = 'public.user_roles'::regclass
  ) THEN
    RAISE EXCEPTION 'FALHA 1.4: constraint UNIQUE (user_id) ausente em user_roles';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.user_roles'::regclass AND tgname = 'audit_user_roles'
  ) THEN
    RAISE EXCEPTION 'FALHA 1.5: trigger audit_user_roles ausente';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.user_roles'::regclass AND tgname = 'guard_last_admin'
  ) THEN
    RAISE EXCEPTION 'FALHA 1.6: trigger guard_last_admin ausente';
  END IF;
  RAISE NOTICE 'Seção 1 OK';
END $$;

-- ============================================================
-- Seção 2 — Comportamento (Task 2)
-- ============================================================
DO $$
DECLARE
  v_admin uuid := '11111111-1111-1111-1111-111111111111';
  v_editor uuid := '22222222-2222-2222-2222-222222222222';
  v_nobody uuid := '33333333-3333-3333-3333-333333333333';
  v_invited uuid := '44444444-4444-4444-4444-444444444444';
  v_expired uuid := '55555555-5555-5555-5555-555555555555';
  v_count int;
  v_role public.app_role;
BEGIN
  -- Fixtures: usuários temporários (a transação faz ROLLBACK ao final)
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password,
     email_confirmed_at, created_at, updated_at,
     raw_app_meta_data, raw_user_meta_data, is_super_admin)
  VALUES
    ('00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
     'smoke-admin@test.local', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb, false),
    ('00000000-0000-0000-0000-000000000000', v_editor, 'authenticated', 'authenticated',
     'smoke-editor@test.local', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb, false),
    ('00000000-0000-0000-0000-000000000000', v_nobody, 'authenticated', 'authenticated',
     'smoke-nobody@test.local', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb, false);

  INSERT INTO public.user_roles (user_id, role) VALUES
    (v_admin, 'admin'), (v_editor, 'editor');

  -- 2.1 — RPC exige admin
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_editor, 'role', 'authenticated')::text, true);
  BEGIN
    PERFORM public.set_user_role(v_nobody, 'editor'::public.app_role);
    RAISE EXCEPTION 'FALHA 2.1: editor conseguiu alterar papel';
  EXCEPTION WHEN sqlstate 'W2001' THEN NULL;
  END;

  -- 2.2 — admin concede papel e gera auditoria
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM public.set_user_role(v_nobody, 'viewer'::public.app_role);
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_nobody;
  IF v_role IS DISTINCT FROM 'viewer'::public.app_role THEN
    RAISE EXCEPTION 'FALHA 2.2: papel viewer não aplicado';
  END IF;
  SELECT count(*) INTO v_count FROM public.role_audit_log
   WHERE target_user_id = v_nobody AND actor_user_id = v_admin AND action = 'grant';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FALHA 2.3: auditoria de concessão ausente (achou %)', v_count;
  END IF;

  -- 2.4 — auto-rebaixamento bloqueado
  BEGIN
    PERFORM public.set_user_role(v_admin, 'editor'::public.app_role);
    RAISE EXCEPTION 'FALHA 2.4: admin rebaixou a si mesmo';
  EXCEPTION WHEN sqlstate 'W2002' THEN NULL;
  END;

  -- 2.5 — último admin protegido contra DELETE direto.
  -- Remove os demais admins primeiro (a transação faz ROLLBACK), para que
  -- v_admin seja de fato o último e a trava tenha o que proteger.
  DELETE FROM public.user_roles
   WHERE role = 'admin'::public.app_role AND user_id <> v_admin;
  BEGIN
    DELETE FROM public.user_roles WHERE user_id = v_admin;
    RAISE EXCEPTION 'FALHA 2.5: último admin foi removido';
  EXCEPTION WHEN sqlstate 'W2003' THEN NULL;
  END;

  -- 2.6 — auditoria é imutável para a aplicação
  BEGIN
    SET LOCAL ROLE authenticated;
    DELETE FROM public.role_audit_log WHERE target_user_id = v_nobody;
    RESET ROLE;
    RAISE EXCEPTION 'FALHA 2.6: authenticated apagou linha da auditoria';
  EXCEPTION WHEN insufficient_privilege THEN RESET ROLE;
  END;

  -- 2.7 — convite válido concede papel na criação do usuário
  PERFORM public.create_invitation('smoke-invited@test.local', 'editor'::public.app_role);
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password,
     created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
  VALUES
    ('00000000-0000-0000-0000-000000000000', v_invited, 'authenticated', 'authenticated',
     'smoke-invited@test.local', '', now(), now(), '{}'::jsonb, '{}'::jsonb, false);
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_invited;
  IF v_role IS DISTINCT FROM 'editor'::public.app_role THEN
    RAISE EXCEPTION 'FALHA 2.7: convite não concedeu o papel editor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.invitations
                  WHERE email = 'smoke-invited@test.local' AND consumed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'FALHA 2.8: convite não foi marcado como consumido';
  END IF;

  -- 2.9 — convite expirado não concede papel
  INSERT INTO public.invitations (email, role, invited_by, expires_at)
  VALUES ('smoke-expired@test.local', 'admin', v_admin, now() - interval '1 day');
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password,
     created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
  VALUES
    ('00000000-0000-0000-0000-000000000000', v_expired, 'authenticated', 'authenticated',
     'smoke-expired@test.local', '', now(), now(), '{}'::jsonb, '{}'::jsonb, false);
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_expired) THEN
    RAISE EXCEPTION 'FALHA 2.9: convite expirado concedeu papel';
  END IF;

  -- 2.10 — usuário sem papel não lê o board
  IF private.can_view_board(v_expired) THEN
    RAISE EXCEPTION 'FALHA 2.10: usuário sem papel enxerga o board';
  END IF;
  IF NOT private.can_view_board(v_editor) THEN
    RAISE EXCEPTION 'FALHA 2.11: editor não enxerga o board';
  END IF;

  -- 2.12 — policies de SELECT do board exigem papel
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'devs' AND policyname = 'devs_select_authenticated'
  ) THEN
    RAISE EXCEPTION 'FALHA 2.12: policy permissiva devs_select_authenticated ainda existe';
  END IF;

  RAISE NOTICE 'Seção 2 OK';
END $$;

ROLLBACK;
