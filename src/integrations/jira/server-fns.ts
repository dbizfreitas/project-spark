// Stubs de RPC client-safe — só os createServerFn ficam expostos aqui. A
// lógica real (client.server/projects.server/sprints.server/issues.server)
// é importada dinamicamente dentro de cada handler, nunca no topo deste
// arquivo, seguindo a mesma convenção de src/integrations/supabase/client.server.ts:
// arquivos "*.server.ts" só são seguros de importar estaticamente a partir de
// outro "*.server.ts" — este arquivo é importado pelos componentes React.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IssueResponse, JiraProject, SprintResponse } from "@/lib/compromisso/types";

export const getJiraProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<JiraProject[]> => {
    const { assertCanViewBoard } = await import("./access.server");
    await assertCanViewBoard(context.supabase, context.userId);
    const { fetchAllowedProjects } = await import("./projects.server");
    return fetchAllowedProjects();
  });

export const getJiraSprints = createServerFn({ method: "GET" })
  .validator((data: { project: string }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<SprintResponse[]> => {
    const { assertCanViewBoard } = await import("./access.server");
    await assertCanViewBoard(context.supabase, context.userId);
    const { fetchSprintsForProject } = await import("./sprints.server");
    return fetchSprintsForProject(data.project);
  });

export const getJiraSprint = createServerFn({ method: "GET" })
  .validator((data: { id: number }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<SprintResponse> => {
    const { assertCanViewBoard } = await import("./access.server");
    await assertCanViewBoard(context.supabase, context.userId);
    const { fetchSprintById } = await import("./sprints.server");
    return fetchSprintById(data.id);
  });

export const getJiraIssues = createServerFn({ method: "GET" })
  .validator((data: { sprintId: number }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<IssueResponse[]> => {
    const { assertCanViewBoard } = await import("./access.server");
    await assertCanViewBoard(context.supabase, context.userId);
    const { fetchIssuesForSprint } = await import("./issues.server");
    return fetchIssuesForSprint(data.sprintId);
  });
