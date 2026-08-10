import { Link } from "@tanstack/react-router";
import { Dices, LogOut, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useRoulette } from "@/hooks/use-roulette";
import { getPhoto } from "@/lib/retrospectivas/photos";
import {
  avatarColor,
  getInitials,
  shortName,
  PARTICIPANTS,
} from "@/lib/retrospectivas/participants";
import { ParticipantCard } from "./ParticipantCard";

export function RouletteView({ email }: { email: string }) {
  const roulette = useRoulette();

  const drawnCount = roulette.drawn.size;
  const skippedCount = roulette.skipped.size;
  const plural = skippedCount > 1 ? "s" : "";
  const counter =
    skippedCount > 0
      ? `${drawnCount} / ${PARTICIPANTS.length} sorteados · ${skippedCount} ausente${plural}`
      : `${drawnCount} / ${PARTICIPANTS.length} sorteados`;

  // O card do vencedor vive aqui: são ~15 linhas de JSX que não se repetem em
  // lugar nenhum — extrair componente só espalharia props.
  const winnerIndex = PARTICIPANTS.findIndex((p) => p.email === roulette.lastWinner);
  const winner = winnerIndex === -1 ? undefined : PARTICIPANTS[winnerIndex];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Dices className="size-4" />
        </span>
        <div className="mr-auto">
          <h1 className="text-base font-semibold leading-tight">Roleta de Retrospectiva</h1>
          {/* Contador é texto real, já legível por leitor de tela. */}
          <p className="text-[11px] text-muted-foreground">{counter}</p>
        </div>
        <Button size="sm" variant="ghost" asChild>
          <Link to="/">Quadro</Link>
        </Button>
        <ThemeToggle />
        <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()} title={email}>
          <LogOut className="size-4" />
        </Button>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4">
        <Card className="flex flex-col items-center gap-4 p-6">
          {/* A região aria-live existe desde o primeiro render, mesmo vazia: é o
              que faz o leitor de tela anunciar o vencedor quando ele aparece. */}
          <div aria-live="polite" className="flex min-h-[7rem] items-center justify-center">
            {winner ? (
              <div
                key={winner.email}
                className="flex animate-in flex-col items-center gap-1 duration-300 zoom-in-95"
              >
                <Avatar className="size-16 ring-2 ring-primary">
                  <AvatarImage src={getPhoto(winner.email)} alt="" />
                  <AvatarFallback
                    style={{ backgroundColor: avatarColor(winner, winnerIndex) }}
                    className="text-lg font-semibold text-white"
                  >
                    {getInitials(winner.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-base font-semibold">{shortName(winner.name)}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  sorteado!
                </p>
              </div>
            ) : null}
          </div>

          {/* Desabilita por availableCount, não por drawn.size: com todo mundo
              restante marcado ausente, o botão do legado ficava clicável e não
              fazia nada (desvio 3). */}
          <Button
            size="lg"
            onClick={roulette.spin}
            disabled={roulette.spinning || roulette.availableCount === 0}
          >
            <Shuffle className="size-5" /> Sortear
          </Button>

          {drawnCount > 0 || skippedCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={roulette.reset} disabled={roulette.spinning}>
              <RotateCcw className="size-4" /> Reiniciar
            </Button>
          ) : null}
        </Card>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
          {PARTICIPANTS.map((p, i) => (
            <ParticipantCard
              key={p.email}
              participant={p}
              index={i}
              drawn={roulette.drawn.has(p.email)}
              skipped={roulette.skipped.has(p.email)}
              highlighted={roulette.highlight === p.email}
              disabled={roulette.spinning}
              onUnmark={() => roulette.unmark(p.email)}
              onSkip={() => roulette.skip(p.email)}
              onUnskip={() => roulette.unskip(p.email)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
