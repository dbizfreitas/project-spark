import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { AuthCard } from "@/components/AuthCard";
import { BoardGrid } from "@/components/BoardGrid";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) return <AuthCard />;

  return <BoardGrid email={session.user.email ?? ""} />;
}
