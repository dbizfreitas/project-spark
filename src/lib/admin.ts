export type AppRole = "admin" | "editor" | "viewer";

export type PlatformUser = {
  id: string;
  email: string;
  role: AppRole | null;
  createdAt: string;
  lastSignInAt: string | null;
  pendingInvite: boolean;
};

export type AuditEntry = {
  id: string;
  action: "invite" | "grant" | "revoke" | "bootstrap" | "cancel";
  target_email: string | null;
  actor_email: string | null;
  previous_role: AppRole | null;
  new_role: AppRole | null;
  created_at: string;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Leitor",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "Gerencia usuários e edita o quadro",
  editor: "Edita o quadro",
  viewer: "Apenas visualiza o quadro",
};

export const ACTION_LABELS: Record<AuditEntry["action"], string> = {
  invite: "Convite",
  grant: "Concessão",
  revoke: "Revogação",
  bootstrap: "Bootstrap",
  cancel: "Convite cancelado",
};
