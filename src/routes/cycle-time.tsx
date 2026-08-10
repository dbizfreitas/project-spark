import { createFileRoute } from "@tanstack/react-router";
import { useAuthorizedSession } from "@/hooks/use-authorized-session";
import { AuthCard } from "@/components/AuthCard";
import { AccessDenied } from "@/components/AccessDenied";
import { CycleTimeView } from "@/components/cycle-time/CycleTimeView";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cycle-time")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cycle Time — Tempo por status no fluxo do Jira" },
      {
        name: "description",
        content:
          "Quanto tempo cada demanda passou em cada status do fluxo, calculado a partir do changelog do Jira.",
      },
    ],
  }),
  component: CycleTimePage,
});

function CycleTimePage() {
  const { session, loading, canView } = useAuthorizedSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) return <AuthCard />;

  if (!canView) {
    return (
      <AccessDenied
        title="Acesso ainda não liberado"
        description="Sua conta existe, mas nenhum papel foi atribuído. Peça acesso a um administrador da plataforma."
        action={
          <Button variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
            Sair
          </Button>
        }
      />
    );
  }

  return <CycleTimeView email={session.user.email ?? ""} />;
}
