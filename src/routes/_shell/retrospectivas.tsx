import { createFileRoute } from "@tanstack/react-router";
import { RouletteView } from "@/components/retrospectivas/RouletteView";
import { useShell } from "@/components/shell/shell-context";

// canView, não canEdit: sortear não escreve no banco. E não é público — os
// dados exibidos são exatamente o que a migration de RBAC fechou nas tabelas
// do board. A checagem em si mora no `_shell.tsx`, que é `canView` para as
// quatro guias.
export const Route = createFileRoute("/_shell/retrospectivas")({
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
  // Prop temporária — some na Task 7, junto com o <header> do painel.
  const { email } = useShell();
  return <RouletteView email={email} />;
}
