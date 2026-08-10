import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, LayoutGrid, LogOut, RefreshCw, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getJiraCycleTime, getJiraProjects } from "@/integrations/jira/server-fns";
import { CYCLE_TIME_CONFIG, buildColumns, mergeStatusVariants } from "@/lib/cycle-time/calc";
import type { CycleTimeIssue, CycleTimeMode, CycleTimeResponse } from "@/lib/cycle-time/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CycleTimeTable } from "./CycleTimeTable";

/** Sub-visão ativa. Nomes do original (localStorage `ctView`). */
type CycleTimeSubView = "status" | "full";

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

// Chaves próprias, separadas das do Compromisso: são telas independentes, e
// olhar o Compromisso do PIM enquanto se analisa o Cycle Time do PH é um uso
// legítimo.
const LS_PROJECT = "cycleTimeLastProject";
const LS_VIEW = "cycleTimeView";

function prepare(
  resp: CycleTimeResponse | undefined,
  mode: CycleTimeMode,
): { issues: CycleTimeIssue[]; columns: string[] } {
  if (!resp) return { issues: [], columns: [] };
  const cfg = CYCLE_TIME_CONFIG[mode];
  const issues = mergeStatusVariants(resp.issues, resp.statuses, cfg.aliases);
  return { issues, columns: buildColumns(issues, resp.statuses, cfg) };
}

export function CycleTimeView({ email }: { email: string }) {
  const qc = useQueryClient();
  const [project, setProject] = useState<string | null>(() => ls(LS_PROJECT));
  const [subView, setSubView] = useState<CycleTimeSubView>(() =>
    ls(LS_VIEW) === "full" ? "full" : "status",
  );
  const [recalculando, setRecalculando] = useState(false);

  const projectsQ = useQuery({ queryKey: ["jira", "projects"], queryFn: () => getJiraProjects() });

  useEffect(() => {
    const first = projectsQ.data?.[0];
    if (!project && first) setProject(first.key);
  }, [project, projectsQ.data]);

  // Duas queries separadas, não uma parametrizada pela aba ativa: alternar
  // entre as sub-visões passa a ser instantâneo (cache do Query) e é o
  // comportamento do original, cujo onProjectChange dispara loadCycleTime() e
  // loadCycleTime2() juntos. O prefixo ["jira", ...] casa o das outras queries.
  const stdQ = useQuery({
    queryKey: ["jira", "cycle-time", project, "standard"],
    queryFn: () => getJiraCycleTime({ data: { project: project ?? "", mode: "standard" } }),
    enabled: !!project,
  });

  const fullQ = useQuery({
    queryKey: ["jira", "cycle-time", project, "full"],
    queryFn: () => getJiraCycleTime({ data: { project: project ?? "", mode: "full" } }),
    enabled: !!project,
  });

  const std = useMemo(() => prepare(stdQ.data, "standard"), [stdQ.data]);
  const full = useMemo(() => prepare(fullQ.data, "full"), [fullQ.data]);

  function handleProjectChange(p: string) {
    setProject(p);
    save(LS_PROJECT, p);
  }

  function handleSubViewChange(v: string) {
    const next: CycleTimeSubView = v === "full" ? "full" : "status";
    setSubView(next);
    save(LS_VIEW, next);
  }

  async function handleRecalcular() {
    if (!project) return;
    setRecalculando(true);
    try {
      // `force` precisa chegar ao SERVIDOR: invalidateQueries sozinho só limpa
      // o cache do cliente, e o servidor devolveria o mesmo payload por até 5
      // min — o botão pareceria quebrado. Os dois modos recarregam juntos,
      // como no original.
      const [novoStd, novoFull] = await Promise.all([
        getJiraCycleTime({ data: { project, mode: "standard", force: true } }),
        getJiraCycleTime({ data: { project, mode: "full", force: true } }),
      ]);
      qc.setQueryData(["jira", "cycle-time", project, "standard"], novoStd);
      qc.setQueryData(["jira", "cycle-time", project, "full"], novoFull);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao recalcular o cycle time");
    } finally {
      setRecalculando(false);
    }
  }

  const carregando = stdQ.isFetching || fullQ.isFetching || recalculando;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Timer className="size-4" />
        </span>
        <div className="mr-auto">
          <h1 className="text-base font-semibold leading-tight">Cycle Time</h1>
          <p className="text-[11px] text-muted-foreground">
            Tempo por status, a partir do changelog do Jira
          </p>
        </div>

        <Select {...(project ? { value: project } : {})} onValueChange={handleProjectChange}>
          <SelectTrigger className="h-9 w-56">
            <SelectValue placeholder="Selecione um projeto…" />
          </SelectTrigger>
          <SelectContent>
            {(projectsQ.data ?? []).map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.key} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleRecalcular}
          disabled={!project || carregando}
        >
          <RefreshCw className={`size-4 ${carregando ? "animate-spin" : ""}`} /> Recalcular
        </Button>

        <Button size="sm" variant="ghost" asChild>
          <Link to="/">
            <LayoutGrid className="size-4" /> Quadro
          </Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to="/compromisso">
            <ClipboardList className="size-4" /> Compromisso
          </Link>
        </Button>
        <ThemeToggle />
        <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()} title={email}>
          <LogOut className="size-4" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <Tabs value={subView} onValueChange={handleSubViewChange}>
          <TabsList>
            <TabsTrigger value="status">Em Andamento</TabsTrigger>
            <TabsTrigger value="full">Histórico Completo</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <CycleTimePane
              project={project}
              isLoading={stdQ.isLoading}
              error={stdQ.error ?? projectsQ.error}
              issues={std.issues}
              columns={std.columns}
              mode="standard"
              title="Cycle Time da esteira de produção"
              subtitle={null}
            />
          </TabsContent>

          <TabsContent value="full">
            <CycleTimePane
              project={project}
              isLoading={fullQ.isLoading}
              error={fullQ.error ?? projectsQ.error}
              issues={full.issues}
              columns={full.columns}
              mode="full"
              title="Histórico Completo"
              subtitle="todos os statuses do projeto"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CycleTimePane({
  project,
  isLoading,
  error,
  issues,
  columns,
  mode,
  title,
  subtitle,
}: {
  project: string | null;
  isLoading: boolean;
  error: Error | null;
  issues: CycleTimeIssue[];
  columns: string[];
  mode: CycleTimeMode;
  title: string;
  subtitle: string | null;
}) {
  if (!project) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Selecione um projeto.</p>;
  }
  if (error) {
    // error.message já vem traduzido pelo handler de getJiraCycleTime.
    return <p className="py-20 text-center text-sm text-destructive">{error.message}</p>;
  }
  if (isLoading) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">Calculando cycle time…</p>
    );
  }
  const cfg = CYCLE_TIME_CONFIG[mode];
  // key={project}: trocar de projeto descarta ordenação e página da tabela em
  // vez de carregá-las para dados de outro projeto.
  return (
    <CycleTimeTable
      key={project}
      title={title}
      subtitle={subtitle}
      issues={issues}
      columns={columns}
      fmt={cfg.fmt}
      pageSize={cfg.pageSize}
    />
  );
}
