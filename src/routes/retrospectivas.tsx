import { createFileRoute } from "@tanstack/react-router";
import { useAuthorizedSession } from "@/hooks/use-authorized-session";
import { AuthCard } from "@/components/AuthCard";
import { AccessDenied } from "@/components/AccessDenied";
import { RouletteView } from "@/components/retrospectivas/RouletteView";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/retrospectivas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Retrospectivas — Roleta de sorteio do time" },
      {
        name: "description",
        content: "Sorteia quem conduz a próxima retro, com estado que sobrevive ao refresh.",
      },
    ],
  }),
  component: RetrospectivasPage,
});

function RetrospectivasPage() {
  const { session, loading, canView } = useAuthorizedSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) return <AuthCard />;

  // canView, não canEdit: sortear não escreve no banco. E não é público — os
  // dados exibidos são exatamente o que a migration de RBAC fechou nas tabelas
  // do board.
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

  return <RouletteView email={session.user.email ?? ""} />;
}
