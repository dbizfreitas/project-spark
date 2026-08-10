import { createFileRoute } from "@tanstack/react-router";
import { useAuthorizedSession } from "@/hooks/use-authorized-session";
import { AuthCard } from "@/components/AuthCard";
import { AccessDenied } from "@/components/AccessDenied";
import { CompromissoView } from "@/components/compromisso/CompromissoView";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/compromisso")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Compromisso — Acompanhamento de sprint no Jira" },
      {
        name: "description",
        content: "Status, burndown e demandas da sprint ativa, direto do Jira.",
      },
    ],
  }),
  component: CompromissoPage,
});

function CompromissoPage() {
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

  return <CompromissoView email={session.user.email ?? ""} />;
}
