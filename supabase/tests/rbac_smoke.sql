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

ROLLBACK;
