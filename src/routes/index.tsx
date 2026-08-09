import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useRole } from "@/hooks/use-role";
import { AuthCard } from "@/components/AuthCard";
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
  const { session, loading } = useSession();
  const { canEdit, isAdmin, canView, loading: roleLoading } = useRole(session?.user.id);

  if (loading || (session && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) return <AuthCard />;

  if (!canView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-pop">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-semibold">Acesso ainda não liberado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta existe, mas nenhum papel foi atribuído. Peça acesso a um administrador da
            plataforma.
          </p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => supabase.auth.signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return <BoardGrid email={session.user.email ?? ""} canEdit={canEdit} isAdmin={isAdmin} />;
}
