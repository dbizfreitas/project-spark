export type AllocationStatus =
  | "planejado"
  | "em_andamento"
  | "bug"
  | "evolutiva"
  | "risco"
  | "concluido"
  | "ferias";

export type Team = {
  id: string;
  name: string;
  color: string;
  position: number;
};

export type Dev = {
  id: string;
  name: string;
  initials: string;
  team_id: string;
  position: number;
  active: boolean;
};

export type Sprint = {
  id: string;
  code: string;
  quarter: string;
  start_date: string;
  end_date: string;
  days: number;
  position: number;
};

export type Allocation = {
  id: string;
  sprint_id: string;
  dev_id: string;
  title: string;
  ticket_key: string | null;
  ticket_url: string | null;
  status: AllocationStatus;
  notes: string | null;
  position: number;
};

export const STATUS_LIST: {
  value: AllocationStatus;
  label: string;
  chip: string;
  dot: string;
}[] = [
  {
    value: "planejado",
    label: "Planejado",
    chip: "bg-st-planejado text-st-planejado-fg",
    dot: "bg-st-planejado-fg",
  },
  {
    value: "em_andamento",
    label: "Em andamento",
    chip: "bg-st-andamento text-st-andamento-fg",
    dot: "bg-st-andamento-fg",
  },
  {
    value: "bug",
    label: "Bug",
    chip: "bg-st-bug text-st-bug-fg",
    dot: "bg-st-bug-fg",
  },
  {
    value: "evolutiva",
    label: "Evolutiva",
    chip: "bg-st-evolutiva text-st-evolutiva-fg",
    dot: "bg-st-evolutiva-fg",
  },
  {
    value: "risco",
    label: "Em risco",
    chip: "bg-st-risco text-st-risco-fg",
    dot: "bg-st-risco-fg",
  },
  {
    value: "concluido",
    label: "Concluído",
    chip: "bg-st-concluido text-st-concluido-fg",
    dot: "bg-st-concluido-fg",
  },
  {
    value: "ferias",
    label: "Férias / ausência",
    chip: "bg-st-ferias text-st-ferias-fg",
    dot: "bg-st-ferias-fg",
  },
];

export const statusInfo = (s: AllocationStatus) =>
  STATUS_LIST.find((x) => x.value === s) ?? STATUS_LIST[0]!;

export function formatRange(start: string, end: string) {
  const f = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y?.slice(2)}`;
  };
  return `${f(start)} – ${f(end)}`;
}

export function initialsFrom(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const TEAM_COLORS = [
  "#0f766e",
  "#1d4ed8",
  "#b45309",
  "#be123c",
  "#4d7c0f",
  "#7c2d12",
  "#0369a1",
  "#9333ea",
  "#475569",
];
