import { createFileRoute } from "@tanstack/react-router";
import { CompromissoView } from "@/components/compromisso/CompromissoView";
import { useShell } from "@/components/shell/shell-context";

export const Route = createFileRoute("/_shell/compromisso")({
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
  // `email` continua vindo por prop nesta task porque o <header> do painel
  // ainda existe (ele tem o botão de logout). A Task 5 remove a prop e estas
  // duas linhas viram `return <CompromissoView />;`.
  const { email } = useShell();
  return <CompromissoView email={email} />;
}
