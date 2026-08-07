import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { AuthCard } from "@/components/AuthCard";
import { CompromissoView } from "@/components/compromisso/CompromissoView";

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
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) return <AuthCard />;

  return <CompromissoView email={session.user.email ?? ""} />;
}
