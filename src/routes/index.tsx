import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuthorizedSession } from "@/hooks/use-authorized-session";
import { AuthCard } from "@/components/AuthCard";
import { AccessDenied } from "@/components/AccessDenied";
import { BoardGrid } from "@/components/BoardGrid";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { JIRA_PROJECTS, isJiraProjectKey, type JiraProjectKey } from "@/lib/projects";

// Chave própria da tela, não global: seguindo o precedente documentado em
// CycleTimeView.tsx — olhar o Compromisso do PIM enquanto se analisa o quadro
// do PH é um uso legítimo. Uma seleção compartilhada entre as quatro telas é
// decisão da spec de navegação unificada, não desta.
const LS_PROJECT = "alocacoesLastProject";

const ls = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

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

  // A lista é local, então o projeto inicial é escolhido de forma síncrona, sem
  // esperar rede: em prática o usuário nunca vê a tela vazia. O fallback existe
  // para a chave persistida inválida (projeto removido de JIRA_PROJECTS).
  // `ssr: false` nesta rota garante que localStorage existe aqui.
  const [project, setProject] = useState<JiraProjectKey | null>(() => {
    const stored = ls(LS_PROJECT);
    return isJiraProjectKey(stored) ? stored : (JIRA_PROJECTS[0]?.key ?? null);
  });

  function handleProjectChange(p: JiraProjectKey) {
    setProject(p);
    save(LS_PROJECT, p);
  }

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

  return (
    <BoardGrid
      email={session.user.email ?? ""}
      canEdit={canEdit}
      isAdmin={isAdmin}
      project={project}
      onProjectChange={handleProjectChange}
    />
  );
}
