import { createFileRoute } from "@tanstack/react-router";
import { CycleTimeView } from "@/components/cycle-time/CycleTimeView";
import { useShell } from "@/components/shell/shell-context";

export const Route = createFileRoute("/_shell/cycle-time")({
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
  // Prop temporária — some na Task 6, junto com o <header> do painel.
  const { email } = useShell();
  return <CycleTimeView email={email} />;
}
