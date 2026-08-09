import { createFileRoute } from "@tanstack/react-router";
import { useAuthorizedSession } from "@/hooks/use-authorized-session";
import { AuthCard } from "@/components/AuthCard";
import { AccessDenied } from "@/components/AccessDenied";
import { BoardGrid } from "@/components/BoardGrid";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sprint Board — Alocação de demandas do time de devs" },
      {
        name: "description",
        content:
          "Substitua a planilha: quadro visual de sprints x devs com status coloridos, tickets, férias e realocação por arrastar e soltar.",
      },
      { property: "og:title", content: "Sprint Board — Alocação de demandas do time de devs" },
      {
        property: "og:description",
        content:
          "Quadro visual de sprints x devs com status coloridos, tickets, férias e realocação por arrastar e soltar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading, canEdit, isAdmin, canView } = useAuthorizedSession();

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

  return <BoardGrid email={session.user.email ?? ""} canEdit={canEdit} isAdmin={isAdmin} />;
}
